import { Truck, FileText, ArrowUpRight, Layers, CircleCheck, MapPinOff, CircleDollarSign } from "lucide-react"
import { DonutChart } from "./donut-chart"
import type { AnalyticsPanelProps } from "@/types/props"

export function AnalyticsPanel({
  technicians,
  vehiclePins,
  progress,
  invoices,
  onInvoiceClick,
  onMarkInvoicePaid,
}: AnalyticsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-0.5">
      {/* Geo map — no GPS tracking is wired up yet, so this stays an honest
          placeholder instead of a decorative map with fabricated pins. */}
      <section
        aria-label="Fahrzeug-Standorte"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-card-foreground">Flotte</h2>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
            {technicians.length} aktiv
          </span>
        </header>
        {vehiclePins.length > 0 ? (
          <div className="relative aspect-[4/3] w-full bg-muted">
            {vehiclePins.map((pin) => (
              <div
                key={pin.id}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ top: pin.top, left: pin.left }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground shadow-md"
                  style={{ backgroundColor: pin.color }}
                >
                  {pin.label}
                </div>
                <div className="h-2 w-2 -translate-y-1 rotate-45 border-b-2 border-r-2 border-card" style={{ backgroundColor: pin.color }} aria-hidden="true" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
            <MapPinOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">Live-Standortverfolgung ist noch nicht angebunden.</p>
          </div>
        )}
      </section>

      {/* Progress + KPIs */}
      <section
        aria-label="Fortschritt der heutigen Aufgaben"
        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 pb-3">
          <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-card-foreground">Tagesfortschritt</h2>
        </div>
        <div className="flex items-center gap-4">
          <DonutChart percent={progress.percentDone} />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> Erledigt
              </span>
              <span className="font-mono text-sm font-bold text-success">{progress.completedCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-xs font-medium text-primary">In Arbeit</span>
              <span className="font-mono text-sm font-bold text-primary">{progress.inProgressCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Ausstehend</span>
              <span className="font-mono text-sm font-bold text-foreground">{progress.pendingCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Open invoices */}
      <section
        aria-label="Offene Rechnungen"
        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-card-foreground">Offene Rechnungen</h2>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {invoices.length} · ZUGFeRD PDF
          </span>
        </div>
        <ul className="space-y-1.5">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex items-center gap-1.5">
              <button
                onClick={() => onInvoiceClick?.(inv.id)}
                className="group flex flex-1 items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-card-foreground">
                    <span className="font-mono text-muted-foreground">{inv.id}</span> · {inv.client}
                  </p>
                  <p className={inv.overdue ? "text-[11px] font-medium text-destructive" : "text-[11px] text-muted-foreground"}>
                    {inv.dueLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold text-card-foreground">{inv.amount}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" aria-hidden="true" />
                </div>
              </button>
              {onMarkInvoicePaid && (
                <button
                  onClick={() => onMarkInvoicePaid(inv.id)}
                  title="Als bezahlt markieren"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-success/40 hover:text-success"
                >
                  <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          {invoices.length === 0 && (
            <li className="py-4 text-center text-xs text-muted-foreground">Keine offenen Rechnungen</li>
          )}
        </ul>
      </section>
    </div>
  )
}
