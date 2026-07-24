import Image from "next/image"
import { Navigation, Truck, FileText, ArrowUpRight, Layers, CircleCheck } from "lucide-react"
import { technicians } from "@/lib/dispatcher-data"
import { DonutChart } from "./donut-chart"

const vehiclePins = [
  { id: "t1", label: "MW", top: "28%", left: "34%", color: "var(--chart-1)" },
  { id: "t2", label: "JW", top: "52%", left: "62%", color: "var(--chart-2)" },
  { id: "t3", label: "SF", top: "68%", left: "40%", color: "var(--chart-3)" },
  { id: "t4", label: "AS", top: "40%", left: "72%", color: "var(--chart-4)" },
]

const invoices = [
  { id: "RE-2041", client: "Bäckerei Krüger", amount: "1.240,00 €", days: "fällig in 3 Tagen" },
  { id: "RE-2038", client: "Hausverwaltung Nord", amount: "680,50 €", days: "fällig in 5 Tagen" },
  { id: "RE-2035", client: "Café Sonnenschein", amount: "310,00 €", days: "überfällig", overdue: true },
  { id: "RE-2029", client: "M. Hoffmann", amount: "95,00 €", days: "fällig in 8 Tagen" },
]

export function AnalyticsPanel() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-0.5">
      {/* Geo map */}
      <section
        aria-label="Standorte der Techniker in Echtzeit"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-card-foreground">Flotte · Live</h2>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
            {technicians.length} aktiv
          </span>
        </header>
        <div className="relative aspect-[4/3] w-full">
          <Image src="/map-berlin.png" alt="Karte mit Standorten der Techniker-Fahrzeuge" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/20 to-transparent" aria-hidden="true" />
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
          <button className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-card/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-card">
            <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Route planen
          </button>
        </div>
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
          <DonutChart percent={85} />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> Erledigt
              </span>
              <span className="font-mono text-sm font-bold text-success">17</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-xs font-medium text-primary">In Arbeit</span>
              <span className="font-mono text-sm font-bold text-primary">3</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Ausstehend</span>
              <span className="font-mono text-sm font-bold text-foreground">7</span>
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
            4 · ZUGFeRD PDF
          </span>
        </div>
        <ul className="space-y-1.5">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <button className="group flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/60">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-card-foreground">
                    <span className="font-mono text-muted-foreground">{inv.id}</span> · {inv.client}
                  </p>
                  <p className={inv.overdue ? "text-[11px] font-medium text-destructive" : "text-[11px] text-muted-foreground"}>
                    {inv.days}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold text-card-foreground">{inv.amount}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" aria-hidden="true" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
