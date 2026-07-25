"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  X,
  MapPin,
  Phone,
  User,
  KeyRound,
  Clock,
  FileText,
  ChevronDown,
  Check,
  Receipt,
  Info,
  CalendarClock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPriceBreakdown } from "@/lib/dispatcher-data"
import { resolveIcon, categoryIconMap } from "@/lib/icon-map"
import { cn } from "@/lib/utils"
import type { OrderDetailModalProps } from "@/types/props"

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)

// Local (not UTC) "YYYY-MM-DDTHH:mm" for <input type="datetime-local">,
// rounded up to the next half hour as a sane default arrival slot.
function defaultArrivalValue(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function OrderDetailModal({
  order,
  onClose,
  technicians,
  onAssignTechnician,
  onGenerateInvoice,
}: OrderDetailModalProps) {
  const [assignee, setAssignee] = useState<string>("")
  const [arrivalValue, setArrivalValue] = useState<string>(defaultArrivalValue())
  const [assigning, setAssigning] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (order) {
      setAssignee("")
      setArrivalValue(defaultArrivalValue())
      setDropdownOpen(false)
      setGenerated(false)
    }
  }, [order])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (order) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [order, onClose])

  if (!order) return null

  const Icon = resolveIcon(categoryIconMap, order.categoryKey)
  const price = getPriceBreakdown(order)
  const selectedTech = technicians.find((t) => t.id === assignee)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Auftragsdetails ${order.id}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-card-foreground">{order.title}</h2>
                {order.tags.includes("notdienst") && (
                  <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive ring-1 ring-inset ring-destructive/20">
                    Notdienst
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{order.id}</span> · {order.category} · eingegangen {order.receivedAt}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Photos */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hochgeladene Fotos ({order.photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {order.photos.map((src, i) => (
                  <div
                    key={src + i}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`Schadensfoto ${i + 1} zu Auftrag ${order.id}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 200px"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Problembeschreibung
              </h3>
              <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-card-foreground">
                {order.description}
              </p>
            </section>

            {/* Address & contact */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Adresse &amp; Kontakt
              </h3>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-card-foreground">
                  {order.street}
                  <br />
                  {order.plz} {order.city}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <User className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-card-foreground">{order.contactName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                  {order.phone}
                </a>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-sm">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Zugangshinweise</p>
                  <p className="text-card-foreground">{order.accessNote}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Technician assignment */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Techniker zuweisen
              </h3>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
                >
                  {selectedTech ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                        style={{ backgroundColor: selectedTech.color }}
                      >
                        {selectedTech.initials}
                      </span>
                      <span className="font-medium text-card-foreground">{selectedTech.name}</span>
                      <span className="text-muted-foreground">· {selectedTech.role}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Techniker auswählen…</span>
                  )}
                  <ChevronDown
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
                {dropdownOpen && (
                  <ul
                    role="listbox"
                    className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
                  >
                    {technicians.map((t) => (
                      <li key={t.id}>
                        <button
                          role="option"
                          aria-selected={assignee === t.id}
                          onClick={() => {
                            setAssignee(t.id)
                            setDropdownOpen(false)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                            style={{ backgroundColor: t.color }}
                          >
                            {t.initials}
                          </span>
                          <span className="flex-1">
                            <span className="font-medium text-popover-foreground">{t.name}</span>
                            <span className="text-muted-foreground"> · {t.role}</span>
                          </span>
                          <span
                            className={cn(
                              "text-[11px] capitalize",
                              t.status === "verfügbar" ? "text-success" : "text-muted-foreground",
                            )}
                          >
                            {t.status}
                          </span>
                          {assignee === t.id && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Geschätzte Dauer: <span className="font-mono">{order.estMinutes} Min.</span>
              </p>

              <label className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Ankunftszeit
              </label>
              <input
                type="datetime-local"
                value={arrivalValue}
                onChange={(e) => setArrivalValue(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />

              <Button
                className="mt-3 w-full"
                disabled={!assignee || assigning || !arrivalValue}
                onClick={async () => {
                  if (!assignee || !arrivalValue) return
                  setAssigning(true)
                  try {
                    await onAssignTechnician?.(order.id, assignee, new Date(arrivalValue))
                  } finally {
                    setAssigning(false)
                  }
                }}
              >
                {assigning ? "Wird zugewiesen…" : "Techniker & Zeit zuweisen"}
              </Button>
            </section>

            {/* Materials reported by the technician on-site */}
            {order.materialsUsed && order.materialsUsed.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Verwendetes Material
                </h3>
                <ul className="space-y-1 rounded-lg border border-border bg-muted/60 p-3 text-sm text-card-foreground">
                  {order.materialsUsed.map((m, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{m.name}</span>
                      <span className="font-mono text-muted-foreground">{m.qty} {m.unit}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Vom Techniker vor Ort gemeldet, zur Dokumentation. Materialpreise sind hier noch nicht hinterlegt.
                </p>
              </section>
            )}

            {/* Price calculation */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                Preiskalkulation
              </h3>
              <div className="overflow-hidden rounded-lg border border-border">
                <dl className="divide-y divide-border text-sm">
                  <PriceRow
                    label={`Arbeitslohn (${order.laborHours} Std. × ${eur(order.hourlyRate)})`}
                    value={eur(price.labor)}
                    eligible
                  />
                  <PriceRow label="Anfahrt" value={eur(price.travel)} eligible />
                  <PriceRow label="Material" value={eur(price.material)} />
                  <PriceRow label="Nettobetrag" value={eur(price.net)} muted />
                  <PriceRow label="zzgl. 19% MwSt." value={eur(price.vat)} muted />
                  <div className="flex items-center justify-between bg-muted/60 px-3 py-2.5">
                    <dt className="font-semibold text-card-foreground">Gesamt (brutto)</dt>
                    <dd className="font-mono text-base font-semibold text-card-foreground">{eur(price.gross)}</dd>
                  </div>
                </dl>
              </div>

              {/* §35a breakdown */}
              <div className="mt-2.5 rounded-lg border border-success/30 bg-success/10 p-3">
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-success" aria-hidden="true" />
                  <p className="text-xs font-semibold text-success">§35a EStG — Steuerbonus für Kunden</p>
                </div>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Begünstigte Lohn-/Anfahrtskosten (brutto)</dt>
                    <dd className="font-mono text-card-foreground">{eur(price.deductibleBase)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">20% absetzbar (max. 1.200 €/Jahr)</dt>
                    <dd className="font-mono font-semibold text-success">− {eur(price.deductible)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Materialkosten sind nicht begünstigt. Der absetzbare Betrag wird auf der ZUGFeRD-Rechnung separat
                  ausgewiesen.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedTech
              ? `Wird ${selectedTech.name} zugewiesen`
              : "Noch kein Techniker zugewiesen"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                await onGenerateInvoice?.(order.id)
                setGenerated(true)
              }}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {generated ? "Rechnung erstellt ✓" : "ZUGFeRD PDF Rechnung generieren"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function PriceRow({
  label,
  value,
  eligible,
  muted,
}: {
  label: string
  value: string
  eligible?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <dt className={cn("flex items-center gap-1.5", muted ? "text-muted-foreground" : "text-card-foreground")}>
        {label}
        {eligible && (
          <span className="rounded bg-success/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-success">
            §35a
          </span>
        )}
      </dt>
      <dd className={cn("font-mono", muted ? "text-muted-foreground" : "text-card-foreground")}>{value}</dd>
    </div>
  )
}
