"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BookingWidget } from "@/components/booking/booking-widget"
import { getPractice } from "@/lib/firebase/firestore"
import { uploadBookingPhoto, stripExifAndResize } from "@/lib/firebase/storage"
import { GEWERKE, HANDWERK_CATALOG, type Gewerk } from "@/lib/data/handwerkCatalog"
import type { PracticeDoc } from "@/lib/types"
import type { BookingCategory, BookingConfirmation, BookingSubmission, BookingTimeWindow } from "@/types/props"

const TIME_WINDOWS: BookingTimeWindow[] = [
  { id: "vormittags", label: "Vormittags", range: "08:00 – 12:00 Uhr", iconKey: "morning" },
  { id: "nachmittags", label: "Nachmittags", range: "12:00 – 16:00 Uhr", iconKey: "afternoon" },
]

const CATEGORY_ICON_KEY: Record<string, string> = {
  Sanitaer: "sanitaer", Heizung: "heizung", Elektrik: "elektro", GaLaBau: "sanitaer", Notdienst: "sanitaer", Sonstiges: "schluessel",
}

function resolveGewerk(practice: PracticeDoc): Gewerk {
  return GEWERKE.find((g) => g === practice.specialty) ?? GEWERKE[0]
}

export default function BookingPage() {
  const params = useParams<{ praxisId: string }>()
  const praxisId = params.praxisId
  const [practice, setPractice] = useState<PracticeDoc | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [draftId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    getPractice(praxisId).then((p) => (p ? setPractice(p) : setNotFound(true)))
  }, [praxisId])

  if (notFound) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4 text-center">
        <p className="text-sm text-muted-foreground">Betrieb nicht gefunden. Bitte prüfen Sie den Link.</p>
      </main>
    )
  }
  if (!practice) {
    return <main className="flex min-h-dvh items-center justify-center bg-muted/40 text-sm text-muted-foreground">Lädt…</main>
  }

  const gewerk = resolveGewerk(practice)
  const categories: BookingCategory[] = HANDWERK_CATALOG[gewerk].map((item) => ({
    id: item.name,
    label: item.name,
    desc: `${item.durationMin} Min. geschätzt`,
    iconKey: CATEGORY_ICON_KEY[item.category] ?? "schluessel",
    urgent: item.urgent,
  }))

  async function handleUploadPhoto(file: File): Promise<string> {
    const blob = await stripExifAndResize(file)
    const index = Math.floor(Math.random() * 100000) // draft photos don't need strict ordering
    return uploadBookingPhoto(praxisId, draftId, blob, index)
  }

  async function handleSubmit(data: BookingSubmission): Promise<BookingConfirmation> {
    const category = categories.find((c) => c.id === data.categoryId)
    const timeWindow = TIME_WINDOWS.find((w) => w.id === data.timeWindowId)
    const urgency = category?.urgent ? "notfall" : "normal"

    const res = await fetch("/api/book-handwerk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        praxisId,
        gewerk,
        problemName: data.categoryId,
        urgency,
        photoUrls: data.photoUrls,
        arrivalWindow: urgency === "notfall" ? undefined : {
          date: new Date().toISOString().split("T")[0],
          startTime: timeWindow?.id === "vormittags" ? "08:00" : "12:00",
          endTime: timeWindow?.id === "vormittags" ? "12:00" : "16:00",
        },
        address: data.address,
        residencyStatus: data.residencyStatus,
        hausverwaltungName: data.hausverwaltungName,
        customerName: data.contact.name,
        customerEmail: data.contact.email,
        customerPhone: data.contact.phone,
        widerrufAccepted: data.widerrufAccepted,
      }),
    })
    if (!res.ok) throw new Error("booking_failed")
    const json = await res.json() as { appointmentId: string; magicToken: string }

    return {
      orderId: json.appointmentId,
      timeWindowLabel: urgency === "notfall" ? "Notdienst" : (timeWindow?.label ?? ""),
      timeWindowRange: urgency === "notfall" ? "So schnell wie möglich" : (timeWindow?.range ?? ""),
      portalUrl: `/portal/${json.magicToken}`,
    }
  }

  return (
    <main className="min-h-dvh bg-muted/40">
      <BookingWidget
        categories={categories}
        timeWindows={TIME_WINDOWS}
        depositAmountCents={3900}
        praxisId={praxisId}
        onUploadPhoto={handleUploadPhoto}
        onSubmit={handleSubmit}
      />
    </main>
  )
}
