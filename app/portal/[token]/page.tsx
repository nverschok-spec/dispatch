"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CustomerPortal } from "@/components/portal/customer-portal"
import type { PortalTechnician, PortalTimelineStep, PortalInvoice } from "@/types/props"

interface PortalData {
  id: string
  status: string
  address: { plz: string; city: string } | null
  praxis: { name: string; phone: string }
  mitarbeiter: { name: string; spec: string; avatarUrl: string | null } | null
  invoiceId: string | null
}

const STATUS_HEADLINE: Record<string, string> = {
  online_request: "Anfrage eingegangen",
  scheduled: "Termin bestätigt",
  dispatched: "Mitarbeiter zugewiesen",
  en_route: "Handwerker ist unterwegs",
  behandlung: "Mitarbeiter vor Ort",
  completed: "Einsatz abgeschlossen",
  invoiced: "Rechnung verfügbar",
}

const STEP_DEFS = [
  { key: "online_request", label: "Anfrage eingegangen" },
  { key: "dispatched", label: "Mitarbeiter zugewiesen" },
  { key: "en_route", label: "Anfahrt" },
  { key: "behandlung", label: "Vor Ort & Abschluss" },
  { key: "invoiced", label: "Rechnung" },
]

// Collapses the richer AppointmentStatus set onto the 5 portal steps —
// 'scheduled' folds into 'dispatched', 'completed' into 'behandlung'.
function stepIndexFor(status: string): number {
  switch (status) {
    case "online_request": return 0
    case "scheduled":
    case "dispatched": return 1
    case "en_route": return 2
    case "behandlung":
    case "completed": return 3
    case "invoiced": return 4
    default: return 0
  }
}

export default function PortalPage() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Diese Anfrage wurde nicht gefunden. Bitte prüfe den Link."))
  }, [token])

  if (error) {
    return <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4 text-center text-sm text-muted-foreground">{error}</main>
  }
  if (!data) {
    return <main className="flex min-h-dvh items-center justify-center bg-muted/40 text-sm text-muted-foreground">Lädt…</main>
  }

  const stepIdx = stepIndexFor(data.status)
  const steps: PortalTimelineStep[] = STEP_DEFS.map((s, i) => ({
    label: s.label,
    time: i <= stepIdx ? "" : "Ausstehend",
    state: i < stepIdx ? "done" : i === stepIdx ? "active" : "todo",
  }))

  const technician: PortalTechnician | null = data.mitarbeiter
    ? { name: data.mitarbeiter.name, roleLabel: `${data.mitarbeiter.spec} · ${data.praxis.name}`, photoUrl: data.mitarbeiter.avatarUrl ?? undefined }
    : null

  const invoice: PortalInvoice | null = data.invoiceId
    ? { fileName: `Rechnung_${data.id.slice(0, 8)}.pdf`, downloadUrl: `/api/invoices/${data.invoiceId}/pdf?token=${token}`, deductibleNotePercent: 20 }
    : null

  return (
    <main className="min-h-dvh bg-muted/40">
      <CustomerPortal
        orderId={data.id.slice(0, 8).toUpperCase()}
        statusHeadline={STATUS_HEADLINE[data.status] ?? data.status}
        // No live GPS feed exists yet — 20 is an illustrative placeholder
        // shown only once truly en route, not a real tracked ETA.
        etaMinutes={data.status === "en_route" ? 20 : undefined}
        technician={technician}
        steps={steps}
        invoice={invoice}
        onCall={() => { if (data.praxis.phone) window.location.href = `tel:${data.praxis.phone}` }}
        onDownloadInvoice={() => { if (invoice) window.open(invoice.downloadUrl, "_blank") }}
      />
    </main>
  )
}
