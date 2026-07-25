import { CalendarClock, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { visitKindLabels } from "@/lib/dispatcher-data"
import { cn } from "@/lib/utils"
import type { TimelineProps, Technician, Visit } from "@/types/props"

const HOUR_HEIGHT = 68

const statusConfig: Record<Technician["status"], { label: string; dot: string; text: string }> = {
  "vor-ort": { label: "Vor Ort", dot: "bg-success", text: "text-success" },
  unterwegs: { label: "Unterwegs", dot: "bg-primary", text: "text-primary" },
  verfügbar: { label: "Verfügbar", dot: "bg-success", text: "text-success" },
  pause: { label: "Pause", dot: "bg-warning", text: "text-warning" },
}

const kindStyles: Record<Visit["kind"], string> = {
  installation: "border-l-primary bg-primary/8",
  reparatur: "border-l-chart-4 bg-muted",
  wartung: "border-l-success bg-success/8",
  notdienst: "border-l-destructive bg-destructive/8",
}

function fmt(hour: number) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function VisitBlock({ visit, dayStart }: { visit: Visit; dayStart: number }) {
  const top = (visit.start - dayStart) * HOUR_HEIGHT
  const height = (visit.end - visit.start) * HOUR_HEIGHT
  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-lg border border-border border-l-[3px] p-2 shadow-sm transition-shadow hover:shadow-md",
        kindStyles[visit.kind],
      )}
      style={{ top: top + 2, height: height - 4 }}
      role="button"
      tabIndex={0}
      aria-label={`${visit.title}, ${fmt(visit.start)} bis ${fmt(visit.end)}`}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-xs font-semibold text-card-foreground">{visit.title}</p>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {fmt(visit.start)}–{fmt(visit.end)}
      </p>
      {height > 60 && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{visit.street}</span>
        </div>
      )}
      {height > 90 && (
        <span className="mt-1.5 inline-block rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {visitKindLabels[visit.kind]}
        </span>
      )}
    </div>
  )
}

export function Timeline({
  technicians,
  dayStart = 8,
  dayEnd = 17,
  selectedDateLabel = "Mo, 27. Juli",
  onPrevDay,
  onNextDay,
}: TimelineProps) {
  const hours = Array.from({ length: dayEnd - dayStart + 1 }, (_, i) => dayStart + i)

  return (
    <section
      aria-label="Techniker Zeitplan"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight text-card-foreground">Technicians Timeline</h2>
            <p className="text-xs text-muted-foreground">Heute · {technicians.length} Techniker im Einsatz</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevDay}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Vorheriger Tag"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
            {selectedDateLabel}
          </span>
          <button
            onClick={onNextDay}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Nächster Tag"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Technician header row */}
      <div className="flex border-b border-border bg-muted/40">
        <div className="w-14 shrink-0 border-r border-border" aria-hidden="true" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${technicians.length}, minmax(0, 1fr))` }}>
          {technicians.map((tech) => {
            const status = statusConfig[tech.status]
            return (
              <div key={tech.id} className="flex items-center gap-2 border-r border-border px-3 py-2.5 last:border-r-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                  style={{ backgroundColor: tech.color }}
                  aria-hidden="true"
                >
                  {tech.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-card-foreground">
                    {tech.name} <span className="font-normal text-muted-foreground">· {tech.role}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden="true" />
                    <span className={cn("text-[11px] font-medium", status.text)}>{status.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* time gutter */}
        <div className="w-14 shrink-0 border-r border-border">
          {hours.map((h) => (
            <div key={h} className="relative border-b border-border/60" style={{ height: HOUR_HEIGHT }}>
              <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground">{fmt(h)}</span>
            </div>
          ))}
        </div>

        {/* technician lanes */}
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${technicians.length}, minmax(0, 1fr))` }}
        >
          {technicians.map((tech) => (
            <div key={tech.id} className="relative border-r border-border last:border-r-0">
              {/* hour lines */}
              {hours.map((h) => (
                <div key={h} className="border-b border-border/60" style={{ height: HOUR_HEIGHT }} aria-hidden="true" />
              ))}
              {/* visits */}
              <div className="absolute inset-0">
                {tech.visits.map((visit) => (
                  <VisitBlock key={visit.id} visit={visit} dayStart={dayStart} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
