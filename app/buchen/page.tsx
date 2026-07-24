import type { Metadata } from "next"
import { BookingWidget } from "@/components/booking/booking-widget"

export const metadata: Metadata = {
  title: "Termin buchen — MeisterPlan",
  description: "Buchen Sie in wenigen Schritten einen geprüften Handwerker: Anliegen wählen, Fotos hochladen, Zeitfenster festlegen und Anzahlung leisten.",
}

export default function BookingPage() {
  return (
    <main className="min-h-dvh bg-muted/40">
      <BookingWidget />
    </main>
  )
}
