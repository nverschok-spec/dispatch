"use client"

import { useState } from "react"
import {
  Droplets,
  Flame,
  Zap,
  Wind,
  KeyRound,
  Camera,
  X,
  Sun,
  Sunset,
  ChevronLeft,
  Check,
  ShieldCheck,
  CreditCard,
  Lock,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  label: string
  desc: string
  icon: LucideIcon
}

const categories: Category[] = [
  { id: "sanitaer", label: "Sanitär", desc: "Rohrbruch, Abfluss, Armatur", icon: Droplets },
  { id: "heizung", label: "Heizung", desc: "Therme, Heizkörper, Ausfall", icon: Flame },
  { id: "elektro", label: "Elektro", desc: "Stromausfall, Steckdose, Sicherung", icon: Zap },
  { id: "klima", label: "Klima / Lüftung", desc: "Kühlung, Wartung, Filter", icon: Wind },
  { id: "schluessel", label: "Schließtechnik", desc: "Türöffnung, Schloss, Zylinder", icon: KeyRound },
]

const timeWindows = [
  { id: "morning", label: "Vormittag", range: "08:00 – 12:00 Uhr", icon: Sun },
  { id: "afternoon", label: "Nachmittag", range: "12:00 – 17:00 Uhr", icon: Sunset },
]

const STEPS = ["Anliegen", "Fotos", "Termin", "Anzahlung"] as const

export function BookingWidget() {
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [timeWindow, setTimeWindow] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [paid, setPaid] = useState(false)

  const canNext =
    (step === 0 && category) ||
    (step === 1) ||
    (step === 2 && timeWindow) ||
    step === 3

  function addPhotos(count = 1) {
    setPhotos((p) => [...p, ...Array.from({ length: count }, (_, i) => `photo-${p.length + i + 1}`)])
  }

  const selectedCategory = categories.find((c) => c.id === category)

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

        {/* Stepper */}
        <ol className="flex items-center gap-1.5" aria-label="Fortschritt">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  i < step ? "bg-success" : i === step ? "bg-primary" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Step 1: Category */}
        {step === 0 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">
              Womit können wir Ihnen helfen?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Wählen Sie die passende Kategorie für Ihr Anliegen.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {categories.map((c) => {
                const Icon = c.icon
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-card-foreground">{c.label}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{c.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 1 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Fotos vom Problem</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fotos helfen unserem Techniker, das richtige Werkzeug und Material mitzubringen. (Optional)
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                addPhotos(1)
              }}
              onClick={() => addPhotos(1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  addPhotos(1)
                }
              }}
              className={cn(
                "mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:border-primary/50",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-card-foreground">Foto aufnehmen oder hochladen</p>
              <p className="text-xs text-muted-foreground">Tippen oder Datei hierher ziehen · JPG, PNG</p>
            </div>

            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-2.5">
                {photos.map((p, i) => (
                  <li
                    key={p}
                    className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-muted"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">Foto {i + 1}</span>
                    <button
                      onClick={() => setPhotos((arr) => arr.filter((x) => x !== p))}
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

        {/* Step 3: Time window */}
        {step === 2 && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Wann passt es Ihnen?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Wählen Sie ein Zeitfenster für morgen. Sie erhalten am Vortag eine genaue Uhrzeit per SMS.
            </p>
            <div className="mt-5 space-y-3">
              {timeWindows.map((w) => {
                const Icon = w.icon
                const active = timeWindow === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setTimeWindow(w.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-card-foreground">{w.label}</span>
                      <span className="block text-xs text-muted-foreground">{w.range}</span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {active && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Deposit checkout */}
        {step === 3 && !paid && (
          <div>
            <h1 className="text-balance text-xl font-semibold text-card-foreground">Anzahlung &amp; Bestätigung</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Eine Anzahlung sichert Ihren Wunschtermin und wird mit der Endrechnung verrechnet.
            </p>

            {/* Summary */}
            <div className="mt-5 space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Anliegen</span>
                <span className="font-medium text-card-foreground">{selectedCategory?.label ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fotos</span>
                <span className="font-medium text-card-foreground">{photos.length} hochgeladen</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zeitfenster</span>
                <span className="font-medium text-card-foreground">
                  {timeWindows.find((w) => w.id === timeWindow)?.label ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <span className="font-semibold text-card-foreground">Anzahlung</span>
                <span className="font-mono text-base font-semibold text-card-foreground">49,00 €</span>
              </div>
            </div>

            {/* Stripe card */}
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                  <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                  Kartenzahlung
                </span>
                <span className="text-xs text-muted-foreground">Powered by Stripe</span>
              </div>
              <div className="space-y-2.5">
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                  Kartennummer · 4242 4242 4242 4242
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                    MM / JJ
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                    CVC
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Sichere, verschlüsselte Zahlung
              </p>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {paid && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-semibold text-card-foreground">Termin gebucht!</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Ihre Anzahlung ist eingegangen. Sie erhalten in Kürze eine SMS mit dem Tracking-Link zu Ihrem Techniker.
            </p>
            <div className="mt-6 w-full rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auftrag</span>
                <span className="font-mono font-medium text-card-foreground">A-4822</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Zeitfenster</span>
                <span className="font-medium text-card-foreground">
                  {timeWindows.find((w) => w.id === timeWindow)?.label} ·{" "}
                  {timeWindows.find((w) => w.id === timeWindow)?.range}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer action */}
      {!paid && (
        <footer className="sticky bottom-0 border-t border-border bg-card px-5 py-4">
          {step < 3 ? (
            <Button
              className="h-12 w-full text-base"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Weiter
            </Button>
          ) : (
            <Button className="h-12 w-full gap-2 text-base" onClick={() => setPaid(true)}>
              <Lock className="h-4 w-4" aria-hidden="true" />
              49,00 € sicher bezahlen
            </Button>
          )}
          {step === 1 && photos.length === 0 && (
            <button
              onClick={() => setStep(2)}
              className="mt-2 w-full text-center text-xs text-muted-foreground underline underline-offset-2"
            >
              Ohne Fotos fortfahren
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
