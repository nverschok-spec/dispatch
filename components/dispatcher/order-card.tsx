import { Clock, MapPin, GripVertical, CircleCheck, CircleDashed, CircleSlash } from "lucide-react"
import type { Order } from "@/lib/dispatcher-data"
import { cn } from "@/lib/utils"

const tagStyles: Record<string, string> = {
  new: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  notdienst: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
  wartung: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
}

const tagLabels: Record<string, string> = {
  new: "NEU",
  notdienst: "Notdienst",
  wartung: "Wartung",
}

const depositConfig = {
  paid: { label: "Anzahlung erhalten", icon: CircleCheck, className: "text-success" },
  pending: { label: "Anzahlung offen", icon: CircleDashed, className: "text-warning" },
  none: { label: "Keine Anzahlung", icon: CircleSlash, className: "text-muted-foreground" },
} as const

export function OrderCard({ order }: { order: Order }) {
  const Icon = order.icon
  const deposit = depositConfig[order.deposit]
  const DepositIcon = deposit.icon

  return (
    <article
      className="group relative cursor-grab rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:cursor-grabbing"
      role="button"
      tabIndex={0}
      aria-label={`Auftrag ${order.title}, ${order.city}`}
    >
      <GripVertical
        className="absolute right-1.5 top-3.5 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {order.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  tagStyles[tag],
                )}
              >
                {tagLabels[tag]}
              </span>
            ))}
          </div>
          <h3 className="truncate text-sm font-semibold leading-tight text-card-foreground">{order.title}</h3>
          <p className="text-xs text-muted-foreground">{order.category}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {order.street}, {order.plz} {order.city}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{order.receivedAt}</span>
            <span className="text-border">·</span>
            <span className="font-mono">{order.estMinutes} Min.</span>
          </div>
          <div className={cn("flex items-center gap-1 text-[11px] font-medium", deposit.className)}>
            <DepositIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{order.deposit === "paid" ? "Bezahlt" : order.deposit === "pending" ? "Offen" : "—"}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
