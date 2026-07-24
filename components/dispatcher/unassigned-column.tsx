"use client"

import { useState } from "react"
import { Inbox, Search } from "lucide-react"
import { unassignedOrders, type Order } from "@/lib/dispatcher-data"
import { OrderCard } from "./order-card"
import { OrderDetailModal } from "./order-detail-modal"

export function UnassignedColumn() {
  const notdienstCount = unassignedOrders.filter((o) => o.tags.includes("notdienst")).length
  const [selected, setSelected] = useState<Order | null>(null)

  return (
    <section
      aria-label="Eingegangene und ungeplante Aufträge"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Inbox className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight text-card-foreground">Eingegangen / Ungeplant</h2>
            <p className="text-xs text-muted-foreground">
              {unassignedOrders.length} Aufträge
              {notdienstCount > 0 && <span className="text-destructive"> · {notdienstCount} Notdienst</span>}
            </p>
          </div>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
          {unassignedOrders.length}
        </span>
      </header>

      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            type="search"
            placeholder="Auftrag suchen…"
            aria-label="Auftrag suchen"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {unassignedOrders.map((order) => (
          <OrderCard key={order.id} order={order} onSelect={setSelected} />
        ))}
      </div>

      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
