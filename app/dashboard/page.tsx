"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/dispatcher/top-bar"
import { UnassignedColumn } from "@/components/dispatcher/unassigned-column"
import { Timeline } from "@/components/dispatcher/timeline"
import { AnalyticsPanel } from "@/components/dispatcher/analytics-panel"
import { OrderDetailModal } from "@/components/dispatcher/order-detail-modal"
import { useAuth } from "@/components/providers/AuthProvider"
import { getPractice, subscribeToAppointments, dispatchAppointment, getOpenInvoices } from "@/lib/firebase/firestore"
import { appointmentToOrder, doctorToTechnician, computeDailyProgress, invoiceToSummary } from "@/lib/adapters"
import { cn } from "@/lib/utils"
import type { AppointmentDoc, PracticeDoc } from "@/lib/types"
import type { InvoiceSummary, Order } from "@/types/props"

type MobileTab = "warteschlange" | "timeline" | "analytics"

function isToday(a: AppointmentDoc): boolean {
  const d = a.dateTime?.toDate?.()
  if (!d) return false
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export default function DispatcherPage() {
  const router = useRouter()
  const { user, claims, loading: authLoading } = useAuth()

  const [practice, setPractice] = useState<PracticeDoc | null>(null)
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([])
  const [openInvoices, setOpenInvoices] = useState<InvoiceSummary[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [search, setSearch] = useState("")
  const [mobileTab, setMobileTab] = useState<MobileTab>("timeline")

  useEffect(() => {
    if (!authLoading && (!user || claims?.role !== "praxisAdmin")) {
      router.replace("/login")
    }
  }, [authLoading, user, claims, router])

  useEffect(() => {
    if (!claims?.praxisId) return
    getPractice(claims.praxisId).then(setPractice)
    getOpenInvoices(claims.praxisId).then((invs) => setOpenInvoices(invs.map(invoiceToSummary)))
    return subscribeToAppointments(claims.praxisId, setAppointments)
  }, [claims?.praxisId])

  const rates = useMemo(
    () => ({ hourlyRateCents: practice?.hourlyRateCents, travelCostCents: practice?.travelCostCents }),
    [practice?.hourlyRateCents, practice?.travelCostCents],
  )

  const unassignedOrders = useMemo(() => {
    let list = appointments.filter((a) => a.status === "online_request" && !a.deleted)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((a) => a.patientName.toLowerCase().includes(q) || a.symptomNote?.toLowerCase().includes(q))
    return list.map((a) => appointmentToOrder(a, rates))
  }, [appointments, search, rates])

  const dispatchedToday = useMemo(
    () => appointments.filter((a) => a.doctorId && isToday(a) && !a.deleted && a.status !== "online_request"),
    [appointments],
  )

  const technicians = useMemo(
    () => (practice?.doctors ?? []).filter((d) => d.isActive).map((d) => doctorToTechnician(d, dispatchedToday)),
    [practice?.doctors, dispatchedToday],
  )

  const dailyProgress = useMemo(() => computeDailyProgress(dispatchedToday), [dispatchedToday])

  async function handleAssignTechnician(orderId: string, technicianId: string, dateTime: Date) {
    if (!user) return
    await dispatchAppointment(orderId, { doctorId: technicianId, dateTime }, user.uid)
    setSelected(null)
  }

  async function handleGenerateInvoice(orderId: string) {
    const order = unassignedOrders.find((o) => o.id === orderId) ?? selected
    if (!order || !user) return
    const idToken = await user.getIdToken()
    const lineItems = [
      { type: "labor", description: "Arbeitsleistung", quantity: order.laborHours, unitPriceCents: Math.round(order.hourlyRate * 100) },
      ...(order.materialCost > 0 ? [{ type: "material", description: "Material", quantity: 1, unitPriceCents: Math.round(order.materialCost * 100) }] : []),
      ...(order.travelCost > 0 ? [{ type: "travel", description: "Fahrtkosten (Anfahrtspauschale)", quantity: 1, unitPriceCents: Math.round(order.travelCost * 100) }] : []),
    ]
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ appointmentId: orderId, lineItems }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const messages: Record<string, string> = {
        NOT_COMPLETED: "Auftrag ist noch nicht abgeschlossen — Techniker muss den Job zuerst beenden.",
        ALREADY_INVOICED: "Für diesen Auftrag existiert bereits eine Rechnung.",
        FORBIDDEN: "Keine Berechtigung für diesen Auftrag.",
      }
      throw new Error(messages[data.error] ?? "Rechnung konnte nicht erstellt werden.")
    }
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    if (!user) return
    const idToken = await user.getIdToken()
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    })
    if (res.ok) setOpenInvoices((list) => list.filter((inv) => inv.id !== invoiceId))
  }

  if (authLoading || !practice) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Lädt…</div>
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar
        currentUser={{ initials: "DP", name: practice.name }}
        notificationCount={unassignedOrders.length}
        onSearch={setSearch}
        onOpenSettings={() => router.push("/dashboard/einstellungen")}
      />
      {/* Below `lg` there's no room for all three panels side by side — a tab
          switcher stands in for the grid instead of just hiding two of them. */}
      <div className="flex gap-1 border-b border-border bg-card px-2 py-1.5 lg:hidden">
        {([
          ["warteschlange", `Warteschlange${unassignedOrders.length ? ` (${unassignedOrders.length})` : ""}`],
          ["timeline", "Timeline"],
          ["analytics", "Analytics"],
        ] as [MobileTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              mobileTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <div className={cn("min-h-0", mobileTab === "warteschlange" ? "block" : "hidden", "lg:block")}>
          <UnassignedColumn orders={unassignedOrders} onSelectOrder={setSelected} onSearch={setSearch} />
        </div>
        <div className={cn("min-h-0", mobileTab === "timeline" ? "block" : "hidden", "lg:block")}>
          <Timeline
            technicians={technicians}
            selectedDateLabel={new Date().toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long" })}
          />
        </div>
        <div className={cn("min-h-0", mobileTab === "analytics" ? "block" : "hidden", "xl:block")}>
          <AnalyticsPanel
            technicians={technicians}
            vehiclePins={[]}
            progress={dailyProgress}
            invoices={openInvoices}
            onMarkInvoicePaid={handleMarkInvoicePaid}
          />
        </div>
      </main>

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        technicians={technicians}
        onAssignTechnician={handleAssignTechnician}
        onGenerateInvoice={handleGenerateInvoice}
      />
    </div>
  )
}
