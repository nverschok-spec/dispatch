import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import app from './config';
import type { AppointmentDoc, AppointmentStatus, Doctor, InvoiceDoc, PracticeDoc, SubscriptionTier } from '@/lib/types';

export const db = getFirestore(app);

// ─── COLLECTION REFS ──────────────────────────────────────────────────────────

export const usersCol        = () => collection(db, 'users');
export const practicesCol    = () => collection(db, 'practices');
export const appointmentsCol = () => collection(db, 'appointments');

// ─── BETRIEB ────────────────────────────────────────────────────────────────

export async function getPractice(praxisId: string): Promise<PracticeDoc | null> {
  const snap = await getDoc(doc(db, 'practices', praxisId));
  if (!snap.exists()) return null;
  const practice = { id: snap.id, tier: 'basis', ...snap.data() } as PracticeDoc;
  // A master-deactivated Betrieb must stop accepting bookings and dispatcher
  // logins — this was never enforced before (public booking read the doc by
  // ID directly and ignored the `deleted` flag entirely).
  if (practice.deleted) return null;
  return practice;
}

// ─── MASTER (platform owner — sees/manages every Betrieb) ─────────────────────

export async function getAllPractices(): Promise<PracticeDoc[]> {
  const snap = await getDocs(practicesCol());
  return snap.docs.map((d) => ({ id: d.id, tier: 'basis', ...d.data() } as PracticeDoc));
}

export async function getAllAppointmentsForStats(): Promise<AppointmentDoc[]> {
  const q = query(appointmentsCol(), where('deleted', '==', false));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppointmentDoc));
}

export async function softDeletePractice(praxisId: string) {
  return updateDoc(doc(db, 'practices', praxisId), { deleted: true, deletedAt: serverTimestamp() });
}

export async function reactivatePractice(praxisId: string) {
  return updateDoc(doc(db, 'practices', praxisId), { deleted: false, deletedAt: null });
}

export async function updatePracticeTier(praxisId: string, tier: SubscriptionTier) {
  return updateDoc(doc(db, 'practices', praxisId), { tier, updatedAt: serverTimestamp() });
}

export async function updatePracticeInfo(
  praxisId: string,
  data: {
    name?: string; email?: string; phone?: string; address?: string; city?: string;
    hourlyRateCents?: number; travelCostCents?: number;
  },
) {
  return updateDoc(doc(db, 'practices', praxisId), { ...data, updatedAt: serverTimestamp() });
}

export async function updateDoctors(praxisId: string, doctors: Doctor[]) {
  return updateDoc(doc(db, 'practices', praxisId), { doctors, updatedAt: serverTimestamp() });
}

// Blacklist entries block a customer's e-mail at booking time — see
// app/api/book-handwerk/route.ts's BLACKLISTED check. No UI ever wrote to
// this field before now, so it always stayed empty and that check never
// actually triggered.
export async function updateBlacklist(praxisId: string, blacklist: string[]) {
  return updateDoc(doc(db, 'practices', praxisId), { blacklist, updatedAt: serverTimestamp() });
}

// ─── EINSÄTZE (Appointments) ──────────────────────────────────────────────────

// Real-time listener for all non-deleted Einsätze of a Betrieb — feeds the
// dispatcher's Unassigned column + Timeline without a page reload.
export function subscribeToAppointments(
  praxisId: string,
  callback: (appointments: AppointmentDoc[]) => void,
) {
  const q = query(
    appointmentsCol(),
    where('praxisId', '==', praxisId),
    where('deleted', '==', false),
    orderBy('dateTime', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppointmentDoc)));
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  updatedBy: string,
) {
  return updateDoc(doc(db, 'appointments', appointmentId), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

// Dispatcher Timeline: assign a Mitarbeiter + concrete start time to a queued
// 'online_request', moving it to 'dispatched'.
export async function dispatchAppointment(
  appointmentId: string,
  params: { doctorId: string; dateTime: Date },
  updatedBy: string,
) {
  return updateDoc(doc(db, 'appointments', appointmentId), {
    doctorId:  params.doctorId,
    dateTime:  Timestamp.fromDate(params.dateTime),
    status:    'dispatched' as AppointmentStatus,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

// ─── RECHNUNGEN (Invoices) ─────────────────────────────────────────────────────
// One-time fetch (not realtime) for the Analytics panel's "Offene Rechnungen"
// list — invoices don't change often enough to justify a live listener.
export async function getOpenInvoices(praxisId: string): Promise<InvoiceDoc[]> {
  const q = query(collection(db, 'invoices'), where('praxisId', '==', praxisId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as InvoiceDoc))
    .filter((inv) => inv.status !== 'paid');
}

// GoBD/accounting export (Settings → Betrieb) — every invoice regardless of
// status, unlike getOpenInvoices above.
export async function getAllInvoices(praxisId: string): Promise<InvoiceDoc[]> {
  const q = query(collection(db, 'invoices'), where('praxisId', '==', praxisId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InvoiceDoc));
}

// Soft-delete (DSGVO — no physical deletion). Handwerk bookings have no
// slotLocks (no exact-slot collision system — arrival windows only), so
// unlike the medical original this is a plain update, no batch/lock cleanup.
export async function softDeleteAppointment(appointmentId: string, deletedBy: string) {
  return updateDoc(doc(appointmentsCol(), appointmentId), {
    deleted:   true,
    deletedAt: serverTimestamp(),
    deletedBy,
    updatedAt: serverTimestamp(),
    updatedBy: deletedBy,
  });
}
