/**
 * Component prop types for MeisterPlan.
 * Every dispatcher/booking/portal/technician component receives its data via
 * these props instead of importing mock data directly, so it can be wired to
 * the real backend.
 *
 * `icon: LucideIcon` fields have been removed from data-shaped types — the
 * backend has no business returning a React component. Each component maps a
 * string discriminator (e.g. `categoryKey: "sanitaer"`) to an icon via
 * lib/icon-map.ts instead.
 */

export type DepositStatus = "paid" | "pending" | "none"
export type OrderTag = "new" | "notdienst" | "wartung"

export interface Order {
  id: string
  title: string
  category: string
  /** e.g. "sanitaer" | "heizung" | "elektro" | "klima" | "schluessel" — resolved to an icon via categoryIconMap */
  categoryKey: string
  street: string
  plz: string
  city: string
  receivedAt: string
  tags: OrderTag[]
  deposit: DepositStatus
  estMinutes: number
  contactName: string
  phone: string
  description: string
  accessNote: string
  photos: string[]
  laborHours: number
  hourlyRate: number
  travelCost: number
  materialCost: number
  /** Materials the technician reported using on-site (see JobCompletion) — display-only, no pricing yet. */
  materialsUsed?: { name: string; qty: number; unit: string }[]
}

export interface PriceBreakdown {
  labor: number
  travel: number
  material: number
  net: number
  vat: number
  gross: number
  deductibleBase: number // labor + travel (§35a eligible)
  deductible: number // 20% of eligible, capped
}

export interface Visit {
  id: string
  title: string
  street: string
  city: string
  start: number // hour, e.g. 9.5 = 09:30
  end: number
  kind: "installation" | "reparatur" | "wartung" | "notdienst"
}

export type TechnicianStatus = "unterwegs" | "vor-ort" | "pause" | "verfügbar"

export interface Technician {
  id: string
  name: string
  role: "Meister" | "Geselle" | "Azubi"
  initials: string
  color: string
  status: TechnicianStatus
  vehicle: string
  visits: Visit[]
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/order-card.tsx                                    */
/* ----------------------------------------------------------------------- */

export interface OrderCardProps {
  order: Order
  onSelect?: (order: Order) => void
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/order-detail-modal.tsx                            */
/* ----------------------------------------------------------------------- */

export interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
  /** List of technicians available for assignment (dropdown source) */
  technicians: Technician[]
  /** Called when the dispatcher confirms a technician + arrival time for this order */
  onAssignTechnician?: (orderId: string, technicianId: string, dateTime: Date) => void | Promise<void>
  /** Called when "ZUGFeRD PDF Rechnung generieren" is clicked */
  onGenerateInvoice?: (orderId: string) => void | Promise<void>
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/unassigned-column.tsx                             */
/* ----------------------------------------------------------------------- */

export interface UnassignedColumnProps {
  orders: Order[]
  onSelectOrder?: (order: Order) => void
  onSearch?: (query: string) => void
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/timeline.tsx                                      */
/* ----------------------------------------------------------------------- */

export interface TimelineProps {
  technicians: Technician[]
  /** Working-day bounds, e.g. 8 and 17 (was DAY_START / DAY_END constants) */
  dayStart?: number
  dayEnd?: number
  /** Label shown in the date switcher, e.g. "Mo, 27. Juli" */
  selectedDateLabel?: string
  onPrevDay?: () => void
  onNextDay?: () => void
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/top-bar.tsx                                       */
/* ----------------------------------------------------------------------- */

export interface TopBarNotification {
  id: string
  title: string
  subtitle: string
  time: string
}

export interface TopBarProps {
  currentUser?: {
    initials: string
    name?: string
    email?: string
  }
  notificationCount?: number
  /** Most recent incoming requests, newest first — rendered in the bell dropdown. */
  notifications?: TopBarNotification[]
  onSearch?: (query: string) => void
  onCreateOrder?: () => void
  onSelectNotification?: (id: string) => void
  onOpenSettings?: () => void
  onLogout?: () => void
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/analytics-panel.tsx                               */
/* ----------------------------------------------------------------------- */

export interface VehiclePin {
  id: string
  label: string
  /** CSS percentage position on the map, e.g. "28%" */
  top: string
  left: string
  color: string
}

export interface DailyProgress {
  percentDone: number
  completedCount: number
  inProgressCount: number
  pendingCount: number
}

export interface InvoiceSummary {
  id: string
  client: string
  /** Pre-formatted currency string, e.g. "1.240,00 €" (or pass a number and format in the component) */
  amount: string
  /** e.g. "fällig in 3 Tagen" | "überfällig" */
  dueLabel: string
  overdue?: boolean
}

export interface AnalyticsPanelProps {
  technicians: Technician[]
  vehiclePins: VehiclePin[]
  progress: DailyProgress
  invoices: InvoiceSummary[]
  onInvoiceClick?: (invoiceId: string) => void
  /** Manual "als bezahlt markieren" — there's no payment processor wired up yet, so this is the only way an invoice ever leaves the open list. */
  onMarkInvoicePaid?: (invoiceId: string) => void | Promise<void>
  mapImageUrl?: string
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/create-order-modal.tsx                            */
/* ----------------------------------------------------------------------- */

export interface CreateOrderData {
  categoryId: string
  urgency: "normal" | "notfall"
  description: string
  source: "phone" | "walk-in"
  customerName: string
  customerPhone: string
  customerEmail: string
  street: string
  houseNumber: string
  plz: string
  city: string
}

export interface CreateOrderModalProps {
  open: boolean
  categories: BookingCategory[]
  onClose: () => void
  onCreate: (data: CreateOrderData) => void | Promise<void>
}

/* ----------------------------------------------------------------------- */
/* components/dispatcher/donut-chart.tsx  (already clean, kept for parity) */
/* ----------------------------------------------------------------------- */

export interface DonutChartProps {
  percent: number
}

/* ----------------------------------------------------------------------- */
/* components/booking/booking-widget.tsx                                   */
/* ----------------------------------------------------------------------- */

export interface BookingCategory {
  id: string
  label: string
  desc: string
  /** Frontend resolves the actual icon component from this key */
  iconKey: string
  /** Notdienst pricing/urgency flag — skips the time-window step (ASAP instead) */
  urgent?: boolean
}

export interface BookingTimeWindow {
  id: string
  label: string
  /** e.g. "08:00 – 12:00 Uhr" */
  range: string
  iconKey: string
}

export interface BookingAddress {
  street: string
  houseNumber: string
  plz: string
  city: string
  floor?: string
  hasParking: boolean
  accessNotes?: string
}

export type BookingResidencyStatus = "eigentuemer" | "mieter"

export interface BookingContact {
  name: string
  email: string
  phone: string
}

export interface BookingSubmission {
  categoryId: string
  photoUrls: string[]
  timeWindowId: string | null // null when the category is urgent (ASAP, no window chosen)
  address: BookingAddress
  residencyStatus: BookingResidencyStatus
  hausverwaltungName?: string
  contact: BookingContact
  widerrufAccepted: boolean
}

export interface BookingConfirmation {
  orderId: string
  timeWindowLabel: string
  timeWindowRange: string
  /** Link to the passwordless Kundenportal (magicToken-based) */
  portalUrl?: string
}

export interface BookingWidgetProps {
  categories: BookingCategory[]
  timeWindows: BookingTimeWindow[]
  depositAmountCents: number
  /** Betrieb id — used to namespace Storage uploads (practices/{praxisId}/booking-drafts/...) */
  praxisId: string
  /** Uploads one photo (client-side EXIF-strip already applied) and resolves its public URL */
  onUploadPhoto: (file: File) => Promise<string>
  /** Called once the customer confirms; resolves with the created order to show the confirmation screen */
  onSubmit: (data: BookingSubmission) => Promise<BookingConfirmation>
}

/* ----------------------------------------------------------------------- */
/* components/portal/customer-portal.tsx                                   */
/* ----------------------------------------------------------------------- */

export type PortalStepState = "done" | "active" | "todo"

export interface PortalTimelineStep {
  label: string
  time: string
  state: PortalStepState
}

export interface PortalTechnician {
  name: string
  roleLabel: string // e.g. "Sanitär-Meister · MeisterPlan GmbH"
  /** No review system exists yet — omit rather than fabricate a number. */
  rating?: number
  reviewCount?: number
  /** Omit to fall back to initials — most Betriebe won't have a photo on file. */
  photoUrl?: string
}

export interface PortalInvoice {
  fileName: string
  downloadUrl: string
  deductibleNotePercent?: number // e.g. 20
}

export interface CustomerPortalProps {
  orderId: string
  /** Headline for the live-status banner, e.g. "Anfrage eingegangen" | "Handwerker ist unterwegs" — driven by the real AppointmentStatus, not hardcoded in the component. */
  statusHeadline: string
  /**
   * Live ETA in minutes — only meaningful once a technician is actually en
   * route with real tracking. `undefined` hides the countdown/map banner
   * entirely rather than showing a fake number.
   */
  etaMinutes?: number
  /** `null` before a Mitarbeiter has been assigned. */
  technician: PortalTechnician | null
  steps: PortalTimelineStep[]
  invoice: PortalInvoice | null
  mapImageUrl?: string
  onCall?: () => void
  onMessage?: () => void
  onDownloadInvoice?: () => void | Promise<void>
}

/* ----------------------------------------------------------------------- */
/* components/technician/technician-app.tsx                                */
/* ----------------------------------------------------------------------- */

export type StopKind = "Reparatur" | "Wartung" | "Notdienst" | "Installation"
export type StopStatus = "done" | "current" | "upcoming"

export interface Stop {
  id: string
  time: string
  title: string
  customer: string
  street: string
  city: string
  kind: StopKind
  status: StopStatus
  phone: string
}

export interface TechnicianDaySummary {
  completedLabel: string // e.g. "1/4"
  driveTimeLabel: string // e.g. "0:42"
  nextStopTimeLabel: string // e.g. "10:00"
}

export interface TechnicianAppProps {
  technicianInitials: string
  dateLabel: string // e.g. "Dienstag, 24. Juli"
  summary: TechnicianDaySummary
  route: Stop[]
  onOpenStop?: (stop: Stop) => void
  onOpenAbsences?: () => void
}

/* ----------------------------------------------------------------------- */
/* components/technician/absence-modal.tsx                                 */
/* ----------------------------------------------------------------------- */

export type AbsenceType = "urlaub" | "krank"
export type AbsenceStatus = "requested" | "approved" | "rejected"

export interface AbsenceItem {
  id: string
  type: AbsenceType
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  status: AbsenceStatus
  note?: string
}

export interface AbsenceModalProps {
  open: boolean
  absences: AbsenceItem[]
  onClose: () => void
  onSubmit: (data: { type: AbsenceType; startDate: string; endDate: string; note?: string }) => void | Promise<void>
}

export interface Material {
  id: number | string
  name: string
  qty: number
  unit: string
}

export interface JobCompletionResult {
  stopId: string
  materials: Material[]
  durationMinutes: number
  signed: boolean
}

export interface JobCompletionProps {
  stop: Stop
  /** Initial material list to prefill, if the backend has predicted parts */
  initialMaterials?: Material[]
  initialDurationMinutes?: number
  onBack: () => void
  /** Fired when the technician taps "Anfahrt starten" — persists status: 'en_route' so the customer portal's live status updates. */
  onStartRoute?: () => void | Promise<void>
  onComplete: (result: JobCompletionResult) => void | Promise<void>
}

/* ----------------------------------------------------------------------- */
/* components/technician/signature-pad.tsx (already clean, kept for parity)*/
/* ----------------------------------------------------------------------- */

export interface SignaturePadProps {
  onChange?: (hasSignature: boolean) => void
}
