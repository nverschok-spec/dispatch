import type { Metadata } from "next"
import { CustomerPortal } from "@/components/portal/customer-portal"

export const metadata: Metadata = {
  title: "Ihr Auftrag H-8941 — MeisterPlan",
  description: "Verfolgen Sie live den Status Ihres Handwerkers, sehen Sie die voraussichtliche Ankunftszeit und laden Sie Ihre ZUGFeRD-Rechnung herunter.",
}

export default function PortalPage() {
  return (
    <main className="min-h-dvh bg-muted/40">
      <CustomerPortal />
    </main>
  )
}
