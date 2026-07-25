"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Truck,
  Phone,
  MessageSquare,
  MapPin,
  Navigation,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Download,
  Star,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CustomerPortalProps, PortalStepState } from "@/types/props"

const stepIcons: Record<PortalStepState, LucideIcon> = {
  done: CheckCircle2,
  active: Truck,
  todo: Circle,
}

export function CustomerPortal({
  orderId,
  statusHeadline,
  etaMinutes,
  technician,
  steps,
  invoice,
  mapImageUrl = "/map-berlin.png",
  onCall,
  onMessage,
  onDownloadInvoice,
}: CustomerPortalProps) {
  const [eta, setEta] = useState(etaMinutes)

  // Simulated countdown for the demo map marker — there is no live GPS feed
  // yet, so this only runs when a real etaMinutes was actually passed in
  // (i.e. status is genuinely "en route"). See the map caption below for the
  // honesty note about what this map is and isn't.
  useEffect(() => {
    if (etaMinutes == null) return
    const id = setInterval(() => {
      setEta((e) => (e != null && e > 1 ? e - 1 : e))
    }, 4000)
    return () => clearInterval(id)
  }, [etaMinutes])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-card-foreground">MeisterPlan</p>
            <p className="text-xs text-muted-foreground">
              Auftrag <span className="font-mono">{orderId}</span>
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verifiziert
        </span>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Status banner — only shows the live-map/countdown chrome once a
            real etaMinutes came in (status genuinely en route); otherwise a
            plain status card, no fabricated ETA or ping animation. */}
        {eta != null ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground/70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-foreground" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">{statusHeadline}</p>
                <p className="text-xs text-primary-foreground/80">Ankunft in ca. {eta} Minuten</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-semibold leading-none">{eta}</p>
                <p className="text-[10px] uppercase tracking-wide text-primary-foreground/80">Min.</p>
              </div>
            </div>

            {/* Map — illustrative, not a live GPS feed (no tracking backend
                wired yet); marker positions are fixed, not the technician's
                real location. */}
            <div className="relative h-44 w-full">
              <Image
                src={mapImageUrl}
                alt="Kartendarstellung (noch keine Live-GPS-Anbindung)"
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
              />
              <div className="absolute inset-0 bg-primary/5" />
              <div className="absolute left-[28%] top-[38%] flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="absolute right-[24%] top-[64%] flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg ring-4 ring-card">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="mt-1 rounded-md bg-card px-1.5 py-0.5 text-[10px] font-medium text-card-foreground shadow">
                  Ihr Zuhause
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-card-foreground">{statusHeadline}</p>
          </div>
        )}

        {/* Technician card — omitted entirely until a Mitarbeiter is assigned */}
        {technician && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {technician.photoUrl ? (
                <Image
                  src={technician.photoUrl}
                  alt={`Handwerker ${technician.name}`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {technician.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-card-foreground">{technician.name}</p>
                <p className="text-xs text-muted-foreground">{technician.roleLabel}</p>
                {technician.rating != null && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                    <span className="font-medium text-card-foreground">
                      {technician.rating.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                    {technician.reviewCount != null && <span className="text-muted-foreground">· {technician.reviewCount} Bewertungen</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Button variant="outline" className="gap-1.5 bg-transparent" onClick={onCall}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Anrufen
              </Button>
              <Button variant="outline" className="gap-1.5 bg-transparent" onClick={onMessage}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Nachricht
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            Status-Verlauf
          </h2>
          <ol className="relative">
            {steps.map((s, i) => {
              const Icon = stepIcons[s.state]
              const last = i === steps.length - 1
              return (
                <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
                  {!last && (
                    <span
                      className={cn(
                        "absolute left-[11px] top-6 h-full w-0.5",
                        s.state === "done" ? "bg-success" : "bg-border",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      s.state === "done" && "bg-success text-success-foreground",
                      s.state === "active" && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                      s.state === "todo" && "border-2 border-border bg-card text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-1 items-center justify-between">
                    <p
                      className={cn(
                        "text-sm",
                        s.state === "active"
                          ? "font-semibold text-card-foreground"
                          : s.state === "done"
                            ? "text-card-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </p>
                    <span className="font-mono text-xs text-muted-foreground">{s.time}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Invoice download — appears once the Betrieb has issued the ZUGFeRD invoice */}
        {invoice ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{invoice.fileName}</p>
                <p className="text-xs text-muted-foreground">ZUGFeRD · elektronische Rechnung</p>
              </div>
            </div>
            <Button className="mt-3 w-full gap-2" onClick={onDownloadInvoice}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Rechnung herunterladen
            </Button>
            {invoice.deductibleNotePercent != null && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {invoice.deductibleNotePercent}% der Lohnkosten sind gemäß §35a EStG steuerlich absetzbar.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-xs text-muted-foreground">
              Die Rechnung (ZUGFeRD, § 35a EStG-konform) erscheint hier automatisch nach Abschluss des Einsatzes.
            </p>
          </div>
        )}
      </div>

      <footer className="px-4 pb-6 pt-2 text-center">
        <p className="text-[11px] text-muted-foreground">
          Sie sehen diese Seite über Ihren persönlichen, sicheren Magic-Link.
        </p>
      </footer>
    </div>
  )
}
