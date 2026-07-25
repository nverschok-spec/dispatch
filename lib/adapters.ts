/**
 * Maps Firestore document shapes (lib/types.ts) onto the UI component prop
 * contracts (types/props.ts). Keeps the presentational component tree fully
 * decoupled from the database schema — see the header comment in
 * types/props.ts for why that boundary exists.
 */

import type { AppointmentDoc, Doctor, InvoiceDoc, ServiceCategory } from './types';
import type { DepositStatus, Order, OrderTag, Technician, Visit, DailyProgress, InvoiceSummary, Stop, StopKind, TechnicianDaySummary } from '@/types/props';
import { resolveHandwerkService } from './data/handwerkCatalog';

const CATEGORY_TO_ICON_KEY: Record<ServiceCategory, string> = {
  Sanitaer: 'sanitaer',
  Heizung: 'heizung',
  Elektrik: 'elektro',
  GaLaBau: 'sanitaer', // no dedicated garden icon yet — falls back gracefully
  Notdienst: 'sanitaer',
  Sonstiges: 'schluessel',
};

function timeAgoLabel(ts: AppointmentDoc['createdAt']): string {
  const ms = ts?.toDate ? Date.now() - ts.toDate().getTime() : 0;
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Gerade eben';
  if (min < 60) return `Vor ${min} Min`;
  return `Vor ${Math.floor(min / 60)} Std`;
}

function mapDeposit(status?: AppointmentDoc['depositStatus']): DepositStatus {
  if (status === 'captured') return 'paid';
  if (status === 'authorized') return 'pending';
  return 'none';
}

// Fallback pricing for Betriebe that haven't set their own rate yet in
// Einstellungen (see PracticeDoc.hourlyRateCents/travelCostCents) — every
// Betrieb used to be stuck with these regardless of trade or region.
const DEFAULT_HOURLY_RATE_CENTS = 6500;
const DEFAULT_TRAVEL_CENTS = 3900;

export function appointmentToOrder(
  a: AppointmentDoc,
  rates?: { hourlyRateCents?: number; travelCostCents?: number },
): Order {
  const svc = resolveHandwerkService(a.serviceId);
  const [title, description] = (a.symptomNote ?? 'Anfrage').split(' — ');
  const tags: OrderTag[] = [];
  if (a.urgency === 'notfall') tags.push('notdienst');
  const createdMs = a.createdAt?.toDate ? Date.now() - a.createdAt.toDate().getTime() : Infinity;
  if (createdMs < 15 * 60 * 1000) tags.push('new');

  const durationMin = svc?.durationMin ?? 60;
  // Once the Techniker app reports real worked time (job-completion flow),
  // prefer that over the catalog estimate used to prefill this before dispatch.
  const laborHoursSource = a.actualDurationMinutes ?? durationMin;

  return {
    id: a.id,
    title: title || 'Anfrage',
    category: svc?.category ?? 'Sonstiges',
    categoryKey: CATEGORY_TO_ICON_KEY[svc?.category ?? 'Sonstiges'],
    street: [a.address?.street, a.address?.houseNumber].filter(Boolean).join(' '),
    plz: a.address?.plz ?? '',
    city: a.address?.city ?? '',
    receivedAt: timeAgoLabel(a.createdAt),
    tags,
    deposit: mapDeposit(a.depositStatus),
    estMinutes: durationMin,
    contactName: a.patientName,
    phone: a.patientPhone ?? '',
    description: description ?? '',
    accessNote: a.address?.accessNotes ?? '',
    photos: (a.photos ?? []).map((p) => p.url),
    laborHours: Math.max(0.25, Math.round((laborHoursSource / 60) * 4) / 4),
    hourlyRate: (rates?.hourlyRateCents ?? DEFAULT_HOURLY_RATE_CENTS) / 100,
    travelCost: (rates?.travelCostCents ?? DEFAULT_TRAVEL_CENTS) / 100,
    materialCost: 0,
    materialsUsed: a.materials?.map((m) => ({ name: m.name, qty: m.qty, unit: m.unit })),
  };
}

const STATUS_TO_KIND: Record<string, Visit['kind']> = {
  dispatched: 'reparatur',
  en_route: 'reparatur',
  behandlung: 'reparatur',
  completed: 'reparatur',
  invoiced: 'reparatur',
};

function appointmentToVisit(a: AppointmentDoc): Visit {
  const svc = resolveHandwerkService(a.serviceId);
  const start = a.dateTime.toDate();
  const startHour = start.getHours() + start.getMinutes() / 60;
  const durationMin = svc?.durationMin ?? 60;
  return {
    id: a.id,
    title: (a.symptomNote ?? 'Einsatz').split(' — ')[0],
    street: a.address?.street ?? '',
    city: a.address?.city ?? '',
    start: startHour,
    end: startHour + durationMin / 60,
    kind: a.urgency === 'notfall' ? 'notdienst' : (STATUS_TO_KIND[a.status] ?? 'reparatur'),
  };
}

export function doctorToTechnician(d: Doctor, todaysAppointments: AppointmentDoc[]): Technician {
  const visits = todaysAppointments
    .filter((a) => a.doctorId === d.id)
    .map(appointmentToVisit);
  const status: Technician['status'] =
    d.status !== 'active' ? 'pause' :
    todaysAppointments.some((a) => a.doctorId === d.id && a.status === 'en_route') ? 'unterwegs' :
    todaysAppointments.some((a) => a.doctorId === d.id && a.status === 'behandlung') ? 'vor-ort' :
    'verfügbar';
  const initials = d.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return {
    id: d.id,
    name: d.name,
    role: (d.spec as Technician['role']) || 'Geselle',
    initials,
    color: d.color || '#2b6cb0',
    status,
    vehicle: `Fahrzeug ${initials}`,
    visits,
  };
}

export function computeDailyProgress(todaysDispatched: AppointmentDoc[]): DailyProgress {
  const completedCount = todaysDispatched.filter((a) => a.status === 'completed' || a.status === 'invoiced').length;
  const inProgressCount = todaysDispatched.filter((a) => a.status === 'en_route' || a.status === 'behandlung').length;
  const pendingCount = todaysDispatched.filter((a) => a.status === 'dispatched').length;
  const total = todaysDispatched.length;
  return {
    percentDone: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    completedCount,
    inProgressCount,
    pendingCount,
  };
}

// ─── TECHNIKER APP ──────────────────────────────────────────────────────────

function stopKindFor(a: AppointmentDoc): StopKind {
  if (a.urgency === 'notfall') return 'Notdienst';
  const name = (a.symptomNote ?? '').toLowerCase();
  if (/wartung|inspektion|e-check|prüfung/.test(name)) return 'Wartung';
  if (/installation|neuinstallation/.test(name)) return 'Installation';
  return 'Reparatur';
}

export function appointmentToStop(a: AppointmentDoc, status: Stop['status']): Stop {
  const [title] = (a.symptomNote ?? 'Auftrag').split(' — ');
  return {
    id: a.id,
    time: a.dateTime.toDate().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    title: title || 'Auftrag',
    customer: a.patientName,
    street: [a.address?.street, a.address?.houseNumber].filter(Boolean).join(' '),
    city: [a.address?.plz, a.address?.city].filter(Boolean).join(' '),
    kind: stopKindFor(a),
    status,
    phone: a.patientPhone ?? '',
  };
}

// A route has at most one 'current' stop (the next open one, chronologically) —
// everything before it is 'done', everything after is 'upcoming'.
export function appointmentsToRoute(appointments: AppointmentDoc[]): Stop[] {
  const sorted = [...appointments].sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
  let currentAssigned = false;
  return sorted.map((a) => {
    const isDone = a.status === 'completed' || a.status === 'invoiced';
    let status: Stop['status'];
    if (isDone) status = 'done';
    else if (!currentAssigned) { status = 'current'; currentAssigned = true; }
    else status = 'upcoming';
    return appointmentToStop(a, status);
  });
}

export function computeTechnicianDaySummary(route: Stop[]): TechnicianDaySummary {
  const completedCount = route.filter((s) => s.status === 'done').length;
  const next = route.find((s) => s.status === 'current');
  return {
    completedLabel: `${completedCount}/${route.length}`,
    driveTimeLabel: '—', // no real drive-time tracking yet
    nextStopTimeLabel: next?.time ?? '—',
  };
}

export function invoiceToSummary(inv: InvoiceDoc): InvoiceSummary {
  const created = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date();
  const daysOld = Math.floor((Date.now() - created.getTime()) / 86400000);
  const overdue = daysOld > 14; // simple heuristic — no payment-terms field on InvoiceDoc yet
  return {
    id: inv.id,
    client: inv.invoiceNumber,
    amount: `${(inv.grossTotalCents / 100).toFixed(2)} €`,
    dueLabel: overdue ? 'überfällig' : `fällig in ${Math.max(0, 14 - daysOld)} Tagen`,
    overdue,
  };
}
