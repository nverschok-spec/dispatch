"use client"

import { useState } from "react"
import {
  Droplets,
  Camera,
  X,
  ChevronLeft,
  Check,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resolveIcon, categoryIconMap, timeWindowIconMap } from "@/lib/icon-map"
import type { BookingWidgetProps, BookingConfirmation, BookingResidencyStatus } from "@/types/props"

const eur = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100)

interface PhotoSlot {
  previewUrl: string
  uploadedUrl?: string
  uploading: boolean
  error?: boolean
}

export function BookingWidget({ categories, timeWindows, depositAmountCents, onUploadPhoto, onSubmit }: BookingWidgetProps) {
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoSlot[]>([])
  const [timeWindow, setTimeWindow] = useState<string | null>(null)

  const [street, setStreet] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [plz, setPlz] = useState("")
  const [city, setCity] = useState("")
  const [floor, setFloor] = useState("")
  const [hasParking, setHasParking] = useState(false)
  const [accessNotes, setAccessNotes] = useState("")
  const [residency, setResidency] = useState<BookingResidencyStatus>("eigentuemer")
  const [hausverwaltungName, setHausverwaltungName] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [widerrufAccepted, setWiderrufAccepted] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  const selectedCategory = categories.find((c) => c.id === category)
  const isUrgent = selectedCategory?.urgent ?? false

  // Steps: 0 Anliegen · 1 Fotos · 2 Termin (skipped if urgent) · 3 Adresse · 4 Kontakt+Bestätigung
  const STEPS = isUrgent
    ? ["Anliegen", "Fotos", "Adresse", "Bestätigung"]
    : ["Anliegen", "Fotos", "Termin", "Adresse", "Bestätigung"]
  const addressStepIndex = isUrgent ? 2 : 3
  const finalStepIndex = STEPS.length - 1

  const canNext =
    (step === 0 && category) ||
    step === 1 ||
    (!isUrgent && step === 2 && timeWindow) ||
    (step === addressStepIndex &&
      street.trim() && houseNumber.trim() && plz.trim() && city.trim() &&
      (residency === "eigentuemer" || hausverwaltungName.trim()))

  // Linear advance — the time-window step is simply absent from the flow for
  // Notdienst categories (see STEPS/addressStepIndex above), so no special
  // skip-logic is needed here.
  function goNext() {
    setStep((s) => s + 1)
  }

  async function handleAddPhotos(files: FileList | null) {
    if (!files) return
    const room = 5 - photos.length
    const toAdd = Array.from(files).slice(0, room)
    if (toAdd.length === 0) return

    const newSlots: PhotoSlot[] = toAdd.map((f) => ({ previewUrl: URL.createObjectURL(f), uploading: true }))
    setPhotos((p) => [...p, ...newSlots])
    const startIndex = photos.length

    await Promise.all(toAdd.map(async (file, i) => {
      const slotIndex = startIndex + i
      try {
        // EXIF-stripping (GPS/camera metadata) and the actual Storage upload
        // both happen inside the container's onUploadPhoto — keeps this
        // component free of any Firebase/backend import.
        const url = await onUploadPhoto(file)
        setPhotos((p) => p.map((slot, idx) => (idx === slotIndex ? { ...slot, uploadedUrl: url, uploading: false } : slot)))
      } catch {
        setPhotos((p) => p.map((slot, idx) => (idx === slotIndex ? { ...slot, uploading: false, error: true } : slot)))
      }
    }))
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!category || !widerrufAccepted) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const result = await onSubmit({
        categoryId: category,
        photoUrls: photos.filter((p) => p.uploadedUrl).map((p) => p.uploadedUrl!),
        timeWindowId: isUrgent ? null : timeWindow,
        address: { street: street.trim(), houseNumber: houseNumber.trim(), plz: plz.trim(), city: city.trim(), floor: floor.trim() || undefined, hasParking, accessNotes: accessNotes.trim() || undefined },
        residencyStatus: residency,
        hausverwaltungName: residency === "mieter" ? hausverwaltungName.trim() : undefined,
        contact: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        widerrufAccepted,
      })
      setConfirmation(result)
    } catch {
      setSubmitError("Fehler beim Senden. Bitte versuche es erneut.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTimeWindow = timeWindows.find((w) => w.id === timeWindow)
  const paid = confirmation !== null
  const photosUploading = photos.some((p) => p.uploading)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-5 pb-4 pt-5">
        <div className="mb-4 flex items-center gap-3">
          {step > 0 && !paid ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              aria-label="Zurück"
              className="-ml-1.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight text-card-foreground">MeisterPlan</p>
            <p className="text-xs text-muted-foreground">Termin online buchen</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Geprüfte Betriebe
          </span>
        </div>

        {!paid && (
          <ol className="flex items-center gap-1.5" aria-label="Fortschritt">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 flex-col gap-1.5">
                <span className={cn("h-1.5 rounded-full transition-colors", i < step ? "bg-success" : i === step ? "bg-primary" : "bg-border")} />
                <span className={cn("text-[10px] font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </li>
            ))}
          </ol>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Womit können wir Ihnen helfen?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Wählen Sie die passende Kategorie für Ihr Anliegen.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {categories.map((c) => {
                const Icon = resolveIcon(categoryIconMap, c.iconKey)
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg transition-colors", active ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                      {c.label}
                      {c.urgent && <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">{c.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: Photos */}
        {step === 1 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Fotos vom Problem</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fotos helfen unserem Techniker, das richtige Werkzeug und Material mitzubringen. (Optional)
            </p>

            <label
              className={cn(
                "mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                photos.length >= 5 ? "pointer-events-none opacity-50" : "border-border bg-muted/40 hover:border-primary/50",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-card-foreground">Foto aufnehmen oder hochladen</p>
              <p className="text-xs text-muted-foreground">Tippen · JPG, PNG · max. 5 Fotos</p>
              <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handleAddPhotos(e.target.files)} />
            </label>

            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-2.5">
                {photos.map((p, i) => (
                  <li key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                    {p.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                      </div>
                    )}
                    {p.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/60 text-white">
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      aria-label={`Foto ${i + 1} entfernen`}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Step 2: Time window (skipped for urgent categories) */}
        {!isUrgent && step === 2 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Wann passt es Ihnen?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sie erhalten am Vortag eine genaue Uhrzeit per SMS.</p>
            <div className="mt-5 space-y-3">
              {timeWindows.map((w) => {
                const Icon = resolveIcon(timeWindowIconMap, w.iconKey)
                const active = timeWindow === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setTimeWindow(w.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg transition-colors", active ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-card-foreground">{w.label}</span>
                      <span className="block text-xs text-muted-foreground">{w.range}</span>
                    </span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {active && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step: Address + Eigentümer/Mieter */}
        {step === addressStepIndex && (
          <div className="space-y-4">
            <div>
              <h1 className="text-balance text-xl font-semibold text-card-foreground">Adresse &amp; Zugang</h1>
              <p className="mt-1 text-sm text-muted-foreground">Wohin soll der Techniker kommen?</p>
            </div>
            {isUrgent && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                Notdienst — wir kontaktieren Sie umgehend mit dem nächstmöglichen Termin. Es gilt ein Notdienstaufschlag.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2.5">
              <input placeholder="Straße" value={street} onChange={(e) => setStreet(e.target.value)} className={cn(inputCls, "col-span-2")} />
              <input placeholder="Nr." value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <input placeholder="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} className={inputCls} />
              <input placeholder="Stadt" value={city} onChange={(e) => setCity(e.target.value)} className={cn(inputCls, "col-span-2")} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input placeholder="Etage (optional)" value={floor} onChange={(e) => setFloor(e.target.value)} className={inputCls} />
              <button
                type="button"
                onClick={() => setHasParking((v) => !v)}
                className={cn("rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors", hasParking ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground")}
              >
                🅿️ Parkplatz {hasParking ? "vorhanden" : "angeben"}
              </button>
            </div>
            <textarea
              placeholder="Zugang (Türcode, Klingel defekt …) — optional"
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              rows={2}
              className={cn(inputCls, "resize-none")}
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ich bin</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(["eigentuemer", "mieter"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setResidency(v)}
                    className={cn(
                      "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                      residency === v ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {v === "eigentuemer" ? "Eigentümer" : "Mieter"}
                  </button>
                ))}
              </div>
            </div>
            {residency === "mieter" && (
              <input
                placeholder="Hausverwaltung (Name) *"
                value={hausverwaltungName}
                onChange={(e) => setHausverwaltungName(e.target.value)}
                className={inputCls}
              />
            )}
          </div>
        )}

        {/* Final step: Contact + Widerruf + Deposit disclosure */}
        {step === finalStepIndex && !paid && (
          <div className="space-y-4">
            <div>
              <h1 className="text-balance text-xl font-semibold text-card-foreground">Kontakt &amp; Bestätigung</h1>
              <p className="mt-1 text-sm text-muted-foreground">Fast geschafft.</p>
            </div>

            <div className="space-y-2.5">
              <input placeholder="Ihr Name *" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              <input type="email" placeholder="E-Mail *" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              <input type="tel" placeholder="Telefon *" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>

            {/* Summary */}
            <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Anliegen</span>
                <span className="font-medium text-card-foreground">{selectedCategory?.label ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zeitfenster</span>
                <span className="font-medium text-card-foreground">{isUrgent ? "Notdienst — ASAP" : (selectedTimeWindow?.label ?? "—")}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <span className="font-semibold text-card-foreground">Anfahrtspauschale (Hold)</span>
                <span className="font-mono text-base font-semibold text-card-foreground">{eur(depositAmountCents)}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Der Betrag wird erst nach dem Einsatz abgebucht — noch keine Zahlungsintegration angebunden, diese Anfrage löst keine Belastung aus.
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <input type="checkbox" checked={widerrufAccepted} onChange={(e) => setWiderrufAccepted(e.target.checked)} className="mt-0.5 flex-shrink-0" />
              <span>
                Ich verlange ausdrücklich, dass mit der Dienstleistung vor Ablauf der Widerrufsfrist begonnen wird. Mir ist
                bekannt, dass ich bei vollständiger Vertragserfüllung mein Widerrufsrecht verliere.
              </span>
            </label>

            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          </div>
        )}

        {/* Confirmation */}
        {paid && confirmation && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-semibold text-card-foreground">Anfrage gesendet!</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Der Betrieb bestätigt Ihr Zeitfenster, sobald ein Mitarbeiter eingeteilt ist.
            </p>
            <div className="mt-6 w-full space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auftrag</span>
                <span className="font-mono font-medium text-card-foreground">{confirmation.orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zeitfenster</span>
                <span className="font-medium text-card-foreground">{confirmation.timeWindowLabel} · {confirmation.timeWindowRange}</span>
              </div>
            </div>
            {confirmation.portalUrl && (
              <a href={confirmation.portalUrl} className="mt-4 text-xs font-medium text-primary underline underline-offset-2">
                Live-Status verfolgen →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer action */}
      {!paid && (
        <footer className="sticky bottom-0 border-t border-border bg-card px-5 py-4">
          {step < finalStepIndex ? (
            <Button className="h-12 w-full text-base" disabled={!canNext || photosUploading} onClick={goNext}>
              {step === 1 && photosUploading ? "Fotos werden hochgeladen…" : "Weiter"}
            </Button>
          ) : (
            <Button className="h-12 w-full gap-2 text-base" disabled={submitting || !widerrufAccepted || !name.trim() || !email.trim() || !phone.trim()} onClick={handleSubmit}>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Wird gesendet…" : "Anfrage verbindlich senden"}
            </Button>
          )}
        </footer>
      )}
    </div>
  )
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
