"use client"

import { useState } from "react"
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  ArrowLeft,
  Phone,
  Plus,
  Minus,
  Package,
  Timer,
  CheckCircle2,
  Send,
  CircleDot,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SignaturePad } from "./signature-pad"

type Stop = {
  id: string
  time: string
  title: string
  customer: string
  street: string
  city: string
  kind: "Reparatur" | "Wartung" | "Notdienst" | "Installation"
  status: "done" | "current" | "upcoming"
  phone: string
}

const route: Stop[] = [
  {
    id: "H-8901",
    time: "08:00",
    title: "Heizungswartung",
    customer: "Fam. Albrecht",
    street: "Choriner Str. 21",
    city: "10119 Berlin",
    kind: "Wartung",
    status: "done",
    phone: "+49 170 1122334",
  },
  {
    id: "H-8941",
    time: "10:00",
    title: "Rohrbruch im Bad",
    customer: "Herr Baumann",
    street: "Danziger Str. 60",
    city: "10435 Berlin",
    kind: "Notdienst",
    status: "current",
    phone: "+49 151 55029183",
  },
  {
    id: "H-8955",
    time: "13:30",
    title: "Boiler Installation",
    customer: "Frau Kern",
    street: "Greifswalder Str. 4",
    city: "10405 Berlin",
    kind: "Installation",
    status: "upcoming",
    phone: "+49 176 33810274",
  },
  {
    id: "H-8962",
    time: "15:30",
    title: "Armatur tauschen",
    customer: "Herr Novak",
    street: "Stargarder Str. 5",
    city: "10437 Berlin",
    kind: "Reparatur",
    status: "upcoming",
    phone: "+49 152 09183746",
  },
]

const kindStyles: Record<Stop["kind"], string> = {
  Reparatur: "bg-primary/10 text-primary",
  Wartung: "bg-success/10 text-success",
  Notdienst: "bg-destructive/10 text-destructive",
  Installation: "bg-warning/15 text-warning",
}

type Material = { id: number; name: string; qty: number; unit: string }

export function TechnicianApp() {
  const [activeStop, setActiveStop] = useState<Stop | null>(null)

  if (activeStop) {
    return <JobCompletion stop={activeStop} onBack={() => setActiveStop(null)} />
  }

  const nextStop = route.find((s) => s.status === "current") ?? null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-card-foreground">Meine Tour heute</p>
            <p className="text-xs text-muted-foreground">Dienstag, 24. Juli · 4 Aufträge</p>
          </div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          JW
        </span>
      </header>

      {/* Day progress summary */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        <SummaryStat label="Erledigt" value="1/4" icon={CheckCircle2} tone="success" />
        <SummaryStat label="Fahrzeit" value="0:42" icon={Navigation} tone="primary" />
        <SummaryStat label="Nächster" value="10:00" icon={Clock} tone="muted" />
      </div>

      <div className="flex-1 space-y-3 p-4">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route</h2>
        <ol className="space-y-2.5">
          {route.map((stop) => (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => stop.status !== "done" && setActiveStop(stop)}
                disabled={stop.status === "done"}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-sm transition-all",
                  stop.status === "current" && "border-primary ring-1 ring-primary/30",
                  stop.status === "done" && "opacity-60",
                  stop.status === "upcoming" && "border-border hover:border-primary/40",
                )}
              >
                <div className="flex flex-col items-center">
                  <span className="font-mono text-sm font-semibold text-card-foreground">{stop.time}</span>
                  {stop.status === "done" ? (
                    <CheckCircle2 className="mt-1 h-4 w-4 text-success" aria-hidden="true" />
                  ) : stop.status === "current" ? (
                    <CircleDot className="mt-1 h-4 w-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Clock className="mt-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-card-foreground">{stop.title}</p>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", kindStyles[stop.kind])}>
                      {stop.kind}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{stop.customer}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {stop.street}, {stop.city}
                  </p>
                </div>
                {stop.status !== "done" && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Sticky primary action */}
      {nextStop && (
        <div className="sticky bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
          <Button size="lg" className="h-14 w-full gap-2 text-base font-semibold" onClick={() => setActiveStop(nextStop)}>
            <Navigation className="h-5 w-5" aria-hidden="true" />
            Anfahrt starten
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Sendet automatisch eine ETA-SMS an {nextStop.customer}.
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: "success" | "primary" | "muted"
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <Icon
        className={cn(
          "h-4 w-4",
          tone === "success" && "text-success",
          tone === "primary" && "text-primary",
          tone === "muted" && "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <p className="mt-1.5 font-mono text-lg font-semibold leading-none text-card-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function JobCompletion({ stop, onBack }: { stop: Stop; onBack: () => void }) {
  const [enRoute, setEnRoute] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "Dichtungsring 1/2\"", qty: 2, unit: "Stk" },
    { id: 2, name: "Kupferrohr 15mm", qty: 1, unit: "m" },
  ])
  const [duration, setDuration] = useState(90)
  const [signed, setSigned] = useState(false)
  const [done, setDone] = useState(false)

  function updateQty(id: number, delta: number) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, qty: Math.max(0, m.qty + delta) } : m)),
    )
  }

  function addMaterial() {
    setMaterials((prev) => [...prev, { id: Date.now(), name: "Neues Material", qty: 1, unit: "Stk" }])
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-background p-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-foreground">Auftrag abgeschlossen</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Der Arbeitsnachweis für <span className="font-mono">{stop.id}</span> wurde gespeichert. Die ZUGFeRD-Rechnung
          wird automatisch erstellt und an {stop.customer} gesendet.
        </p>
        <Button className="mt-6 w-full" onClick={onBack}>
          Zurück zur Tour
        </Button>
      </div>
    )
  }

  const hours = Math.floor(duration / 60)
  const mins = duration % 60

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Zurück zur Tour"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-card-foreground">{stop.title}</p>
          <p className="text-xs text-muted-foreground">
            {stop.customer} · <span className="font-mono">{stop.id}</span>
          </p>
        </div>
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-medium", kindStyles[stop.kind])}>{stop.kind}</span>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Address + anfahrt */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">{stop.street}</p>
              <p className="text-xs text-muted-foreground">{stop.city}</p>
            </div>
            <a
              href={`tel:${stop.phone}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Kunde anrufen"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <Button
            variant={enRoute ? "outline" : "default"}
            className={cn("mt-3 w-full gap-2", enRoute && "bg-transparent")}
            onClick={() => setEnRoute(true)}
          >
            {enRoute ? (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                ETA-SMS gesendet
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Anfahrt starten
              </>
            )}
          </Button>
        </div>

        {/* Materials */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
            Materialverbrauch
          </h2>
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                <span className="flex-1 text-sm text-card-foreground">{m.name}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQty(m.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Menge verringern"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm text-card-foreground">
                    {m.qty} {m.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(m.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Menge erhöhen"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addMaterial}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Material hinzufügen
          </button>
        </section>

        {/* Work duration */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
            <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
            Arbeitszeit
          </h2>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <button
              type="button"
              onClick={() => setDuration((d) => Math.max(15, d - 15))}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Zeit verringern"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="text-center">
              <p className="font-mono text-2xl font-semibold leading-none text-card-foreground">
                {hours}:{mins.toString().padStart(2, "0")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Stunden : Minuten</p>
            </div>
            <button
              type="button"
              onClick={() => setDuration((d) => d + 15)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Zeit erhöhen"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Signature */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-card-foreground">Kunde unterschreiben</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Mit der Unterschrift bestätigt der Kunde die ordnungsgemäße Ausführung.
          </p>
          <SignaturePad onChange={setSigned} />
        </section>
      </div>

      {/* Sticky complete button */}
      <div className="sticky bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
        <Button
          size="lg"
          className="h-14 w-full gap-2 text-base font-semibold"
          disabled={!signed}
          onClick={() => setDone(true)}
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Auftrag abschließen
        </Button>
        {!signed && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Kundenunterschrift erforderlich zum Abschließen.
          </p>
        )}
      </div>
    </div>
  )
}
