import { Timestamp } from 'firebase/firestore';

// Firestore document shapes — the DB/backend layer. Deliberately separate
// from types/props.ts (the UI component contract): container pages fetch
// these and map them into Order/Technician/etc. props. Ported from
// einfach-termin-v2-handwerk/lib/types.ts, stripped of the medical vertical
// (InsuranceType, LANR/BSNR, patient role, Wartezimmer, medical Service
// catalog) now that this is a single-vertical (Handwerk) product.

// ─── ROLES ────────────────────────────────────────────────────────────────────

export type UserRole = 'master' | 'praxisAdmin' | 'technician'; // 'praxisAdmin' = Betriebs-Disponent, 'technician' = Mitarbeiter im Feld
export type AppointmentSource = 'online' | 'phone' | 'walk-in';
export type AppointmentStatus =
  | 'online_request'
  | 'scheduled'
  | 'dispatched'
  | 'en_route'
  | 'behandlung' // "vor Ort / in Arbeit" — kept for continuity with tested PDF/rules code
  | 'completed'
  | 'invoiced';

export const KANBAN_COLUMNS: AppointmentStatus[] = [
  'online_request', 'scheduled', 'dispatched', 'en_route', 'behandlung', 'completed', 'invoiced',
];

export const KANBAN_LABELS: Record<AppointmentStatus, string> = {
  online_request: 'Eingegangen',
  scheduled:      'Bestätigt',
  dispatched:     'Mitarbeiter zugewiesen',
  en_route:       'In Anfahrt',
  behandlung:     'Vor Ort',
  completed:      'Abgeschlossen',
  invoiced:       'Rechnung gestellt',
};

// ─── MITARBEITER (Techniker) ───────────────────────────────────────────────────

export type DoctorStatus = 'active' | 'vacation' | 'sick'; // field name kept for continuity with ported lib/server code

export const DOC_PALETTE = [
  '#2b6cb0', '#27ae60', '#c0392b', '#8e44ad',
  '#e67e22', '#16a085', '#1abc9c', '#e74c3c',
] as const;

export interface WorkDay {
  day: number;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
}

export interface ScheduleBreak {
  start: string;
  end: string;
  label: string;
}

export interface DoctorSchedule {
  workDays: WorkDay[];
  breaks: ScheduleBreak[];
  bufferMinutes: number;
  mealBreakFlex: { enabled: boolean; start: string; end: string };
}

export interface Doctor {
  id: string;
  name: string;
  spec: string; // e.g. 'Meister' | 'Geselle' | 'Azubi'
  status: DoctorStatus;
  isActive: boolean;
  slotDuration: 5 | 10 | 15 | 20 | 30 | 50;
  color: string;
  schedule: DoctorSchedule;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  absences: Absence[];
}

// ─── ABWESENHEITEN (Urlaub/Krank — beantragt vom Mitarbeiter, vom Betrieb genehmigt) ──

export type AbsenceType = 'urlaub' | 'krank';
export type AbsenceStatus = 'requested' | 'approved' | 'rejected';

export interface Absence {
  id: string;
  type: AbsenceType;
  startDate: string; // YYYY-MM-DD, inclusive
  endDate: string;   // YYYY-MM-DD, inclusive
  status: AbsenceStatus;
  note?: string;
  requestedAt: Timestamp;
  reviewedAt?: Timestamp | null;
}

// ─── SERVICE (Gewerk-Katalog-Eintrag, falls im Admin-Panel gepflegt) ──────────

export type ServiceCategory = 'Sanitaer' | 'Elektrik' | 'Heizung' | 'GaLaBau' | 'Notdienst' | 'Sonstiges';

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  category: ServiceCategory;
  icon: string;
  description?: string;
  price?: number;
  isActive: boolean;
  order: number;
}

// ─── SUBSCRIPTION TIERS ───────────────────────────────────────────────────────

export type SubscriptionTier = 'basis' | 'pro' | 'enterprise';

export interface TierConfig {
  label: string;
  basePrice: number;
  perDoctorPrice: number;
  maxDoctors: number | null;
  monthlyApptCap: number | null;
  auditLog: boolean;
  noShowPanel: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  basis: {
    label: 'Basis', basePrice: 0, perDoctorPrice: 0, maxDoctors: 1,
    monthlyApptCap: 30, auditLog: false, noShowPanel: false,
  },
  pro: {
    label: 'Pro', basePrice: 79, perDoctorPrice: 15, maxDoctors: null,
    monthlyApptCap: null, auditLog: false, noShowPanel: false,
  },
  enterprise: {
    label: 'Enterprise', basePrice: 199, perDoctorPrice: 0, maxDoctors: null,
    monthlyApptCap: null, auditLog: true, noShowPanel: true,
  },
};

export function monthlyPrice(tier: SubscriptionTier, doctorCount: number): number {
  const c = TIER_CONFIG[tier];
  return c.basePrice + c.perDoctorPrice * doctorCount;
}

// ─── BETRIEB (Company/Practice) ────────────────────────────────────────────────

export interface PracticeSettings {
  isPwaEnabled: boolean;
  maxWaitTimeMinutes: number;
  theme: 'light-lavender';
  nurLabor?: boolean;
}

export interface PracticeInfrastructure {
  hosting: string;
  databaseRegion: string;
  dsgvoCompliant: boolean;
}

export interface PracticeDoc {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  specialty?: string; // Gewerk, e.g. "Sanitär & Heizung" — see lib/data/handwerkCatalog.ts
  // Billing defaults used to prefill invoice line items (see lib/adapters.ts
  // appointmentToOrder) — every Betrieb used to get the same hardcoded 65€/39€
  // regardless of trade or region until this was made configurable.
  hourlyRateCents?: number;
  travelCostCents?: number;
  tier: SubscriptionTier;
  infrastructure: PracticeInfrastructure;
  settings: PracticeSettings;
  doctors: Doctor[]; // Mitarbeiter
  services: Service[];
  blacklist: string[];
  delayMinutes?: number;
  createdAt: Timestamp;
  deleted: boolean;
  deletedAt: Timestamp | null;
}

// ─── USER ─────────────────────────────────────────────────────────────────────

export interface UserDoc {
  uid: string;
  email: string;
  role: UserRole;
  praxisId: string | null;
  doctorId?: string | null; // set for role: 'technician' — which Mitarbeiter entry this login maps to
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deleted: boolean;
  deletedAt: Timestamp | null;
}

// ─── BOOKING (Address / Arrival / Deposit) ─────────────────────────────────────

export type ResidencyStatus = 'eigentuemer' | 'mieter';
export type UrgencyLevel = 'normal' | 'notfall';
export type DepositStatus = 'none' | 'authorized' | 'captured' | 'released' | 'failed';

export interface BookingAddress {
  street: string;
  houseNumber: string;
  plz: string;
  city: string;
  floor?: string;
  hasParking?: boolean;
  accessNotes?: string;
  lat?: number;
  lng?: number;
}

export interface BookingPhoto {
  url: string;
  uploadedAt: Timestamp;
}

export interface ArrivalWindow {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

// ─── EINSATZ (Appointment) ─────────────────────────────────────────────────────

export interface AppointmentDoc {
  id: string;
  patientId: string | null; // Kunde (kept field name for continuity with ported code)
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  praxisId: string;
  doctorId: string | null; // Mitarbeiter
  serviceId: string;
  dateTime: Timestamp;
  source: AppointmentSource;
  status: AppointmentStatus;
  noShow: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string | null;
  deleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
  reminderSent?: boolean;
  symptomNote?: string;

  address?: BookingAddress;
  photos?: BookingPhoto[];
  arrivalWindow?: ArrivalWindow;
  urgency?: UrgencyLevel;
  residencyStatus?: ResidencyStatus;
  hausverwaltungName?: string;
  hausverwaltungAddress?: string;
  depositAmountCents?: number;
  depositStatus?: DepositStatus;
  depositPaymentIntentId?: string;
  widerrufAccepted?: boolean;
  invoiceId?: string | null;
  magicToken?: string; // bearer token for the passwordless Kundenportal

  // Reported by the Techniker app on job completion (see app/api/techniker/complete).
  materials?: JobMaterial[];
  actualDurationMinutes?: number;
  signedByCustomer?: boolean;
  completedAt?: Timestamp | null;

  // Kostenvoranschlag — optional, sent before the job for non-urgent work so
  // the customer signs off on price before a technician is dispatched. Not a
  // GoBD-relevant document (no numbering/immutability requirement, unlike
  // InvoiceDoc), so it lives inline on the appointment instead of its own
  // collection.
  quote?: Quote;
}

export type QuoteStatus = 'sent' | 'accepted' | 'rejected';

export interface Quote {
  lineItems: InvoiceLineItem[];
  netTotalCents: number;
  vatAmountCents: number;
  grossTotalCents: number;
  status: QuoteStatus;
  createdAt: Timestamp;
  createdBy: string;
  respondedAt?: Timestamp | null;
}

export interface JobMaterial {
  id: string;
  name: string;
  qty: number;
  unit: string;
}

// ─── RECHNUNG (Invoice: § 35a EStG / GoBD / ZUGFeRD 2.2) ──────────────────────

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'storno';
export type InvoiceLineType = 'labor' | 'material' | 'travel';

export interface InvoiceLineItem {
  type: InvoiceLineType;
  description: string;
  quantity: number;
  unitPriceCents: number;
  netAmountCents: number;
}

export interface InvoiceDoc {
  id: string;
  praxisId: string;
  appointmentId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  vatRatePercent: number;
  netTotalCents: number;
  vatAmountCents: number;
  grossTotalCents: number;
  pdfUrl: string | null;
  zugferdXmlEmbedded: boolean;
  stripePaymentIntentId?: string;
  paidAt: Timestamp | null;
  stornoOfInvoiceId?: string | null;
  createdAt: Timestamp;
  createdBy: string;
}

// ─── CUSTOM CLAIMS ────────────────────────────────────────────────────────────

export interface CustomClaims {
  role: UserRole;
  praxisId: string | null;
  doctorId?: string | null; // set for role: 'technician'
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function normalizeDoctor(raw: Record<string, unknown>): Doctor {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    spec: String(raw.spec ?? ''),
    status: (raw.status as DoctorStatus) ?? 'active',
    isActive: (raw.isActive as boolean) ?? true,
    slotDuration: (raw.slotDuration as Doctor['slotDuration']) ?? 30,
    color: String(raw.color ?? DOC_PALETTE[0]),
    schedule: (raw.schedule as DoctorSchedule) ?? {
      workDays: [
        { day: 0, label: 'So', enabled: false, start: '08:00', end: '18:00' },
        { day: 1, label: 'Mo', enabled: true, start: '07:00', end: '16:00' },
        { day: 2, label: 'Di', enabled: true, start: '07:00', end: '16:00' },
        { day: 3, label: 'Mi', enabled: true, start: '07:00', end: '16:00' },
        { day: 4, label: 'Do', enabled: true, start: '07:00', end: '16:00' },
        { day: 5, label: 'Fr', enabled: true, start: '07:00', end: '14:00' },
        { day: 6, label: 'Sa', enabled: false, start: '08:00', end: '13:00' },
      ],
      breaks: [{ start: '12:00', end: '13:00', label: 'Mittagspause' }],
      bufferMinutes: 15,
      mealBreakFlex: { enabled: false, start: '12:00', end: '13:00' },
    },
    email: raw.email as string | undefined,
    phone: raw.phone as string | undefined,
    bio: raw.bio as string | undefined,
    avatarUrl: raw.avatarUrl as string | undefined,
    absences: (raw.absences as Absence[]) ?? [],
  };
}
