"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TechnicianApp, JobCompletion } from "@/components/technician/technician-app"
import { useAuth } from "@/components/providers/AuthProvider"
import { appointmentsToRoute, computeTechnicianDaySummary } from "@/lib/adapters"
import type { AppointmentDoc } from "@/lib/types"
import type { Stop, JobCompletionResult } from "@/types/props"

// The API returns Timestamps as ISO strings (see app/api/techniker/jobs) —
// this re-wraps them with the .toDate()/.toMillis() shape lib/adapters.ts
// expects from a real Firestore Timestamp, so appointmentsToRoute() can stay
// unchanged and shared with the dispatcher-side adapter code.
function reviveTimestamp(iso: string | null) {
  const d = iso ? new Date(iso) : new Date(0)
  return { toDate: () => d, toMillis: () => d.getTime() }
}

function reviveAppointment(raw: Record<string, unknown>): AppointmentDoc {
  return {
    ...raw,
    dateTime: reviveTimestamp(raw.dateTime as string | null),
    createdAt: reviveTimestamp(raw.createdAt as string | null),
    updatedAt: reviveTimestamp(raw.updatedAt as string | null),
  } as unknown as AppointmentDoc
}

export default function TechnikerPage() {
  const router = useRouter()
  const { user, claims, loading: authLoading } = useAuth()

  const [appointments, setAppointments] = useState<AppointmentDoc[]>([])
  const [doctor, setDoctor] = useState<{ name: string } | null>(null)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [activeStop, setActiveStop] = useState<Stop | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || claims?.role !== "technician")) {
      router.replace("/techniker/login")
    }
  }, [authLoading, user, claims, router])

  const loadJobs = useCallback(async () => {
    if (!user) return
    setLoadingJobs(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/techniker/jobs", { headers: { Authorization: `Bearer ${idToken}` } })
      if (!res.ok) return
      const data = await res.json()
      setAppointments((data.appointments ?? []).map(reviveAppointment))
      setDoctor(data.doctor ?? null)
    } finally {
      setLoadingJobs(false)
    }
  }, [user])

  useEffect(() => {
    if (user && claims?.role === "technician") loadJobs()
  }, [user, claims, loadJobs])

  const route = appointmentsToRoute(appointments)
  const summary = computeTechnicianDaySummary(route)

  async function callTechnikerApi(path: string, body: object) {
    if (!user) return
    const idToken = await user.getIdToken()
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const messages: Record<string, string> = {
        SIGNATURE_REQUIRED: "Unterschrift fehlt.",
        FORBIDDEN: "Dieser Auftrag gehört nicht zu Ihrer Tour.",
        NOT_FOUND: "Auftrag nicht gefunden.",
      }
      throw new Error(messages[data.error] ?? "Aktion fehlgeschlagen — bitte erneut versuchen.")
    }
  }

  if (authLoading || (loadingJobs && appointments.length === 0)) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Lädt…</div>
  }

  if (activeStop) {
    return (
      <JobCompletion
        stop={activeStop}
        onBack={() => { setActiveStop(null); loadJobs() }}
        onStartRoute={async () => {
          await callTechnikerApi("/api/techniker/status", { appointmentId: activeStop.id, status: "en_route" })
        }}
        onComplete={async (result: JobCompletionResult) => {
          await callTechnikerApi("/api/techniker/complete", {
            appointmentId: result.stopId,
            materials: result.materials,
            durationMinutes: result.durationMinutes,
            signed: result.signed,
          })
        }}
      />
    )
  }

  const initials = doctor?.name
    ? doctor.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "MA"

  return (
    <TechnicianApp
      technicianInitials={initials}
      dateLabel={new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
      summary={summary}
      route={route}
      onOpenStop={setActiveStop}
    />
  )
}
