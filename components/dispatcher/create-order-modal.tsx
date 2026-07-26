"use client"

import { useEffect, useState } from "react"
import { X, Phone, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveIcon, categoryIconMap } from "@/lib/icon-map"
import type { CreateOrderModalProps } from "@/types/props"

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function CreateOrderModal({ open, categories, onClose, onCreate }: CreateOrderModalProps) {
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [source, setSource] = useState<"phone" | "walk-in">("phone")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [street, setStreet] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [plz, setPlz] = useState("")
  const [city, setCity] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setCategoryId(""); setDescription(""); setSource("phone")
      setCustomerName(""); setCustomerPhone(""); setCustomerEmail("")
      setStreet(""); setHouseNumber(""); setPlz(""); setCity("")
      setSubmitting(false); setError("")
    }
  }, [open])

  if (!open) return null

  const category = categories.find((c) => c.id === categoryId)
  const valid = categoryId && customerName.trim() && customerPhone.trim() && street.trim() && plz.trim() && city.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError("")
    try {
      await onCreate({
        categoryId,
        urgency: category?.urgent ? "notfall" : "normal",
        description: description.trim(),
        source,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        plz: plz.trim(),
        city: city.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auftrag konnte nicht angelegt werden.")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Neuen Auftrag anlegen"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-card-foreground">Neuer Auftrag (Telefon/Vor-Ort)</h2>
          <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Wie kam die Anfrage rein? *">
            <div className="flex gap-2">
              {(["phone", "walk-in"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    source === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s === "phone" ? <Phone className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" /> : <UserIcon className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />}
                  {s === "phone" ? "Anruf" : "Vor Ort"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Anliegen *">
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="" disabled>Bitte wählen…</option>
              {categories.map((c) => {
                const Icon = resolveIcon(categoryIconMap, c.iconKey)
                return (
                  <option key={c.id} value={c.id}>
                    {c.label}{c.urgent ? " — Notdienst" : ""}
                  </option>
                )
              })}
            </select>
            {category && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {(() => { const Icon = resolveIcon(categoryIconMap, category.iconKey); return <Icon className="h-3.5 w-3.5" aria-hidden="true" /> })()}
                {category.desc}
              </p>
            )}
          </Field>

          <Field label="Notizen (optional)">
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className={`${inputCls} resize-none`}
              placeholder="z. B. Details aus dem Telefonat"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *">
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Telefon *">
              <input required type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="E-Mail (optional)">
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Straße *">
              <input required value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nr.">
              <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className={inputCls} />
            </Field>
            <Field label="PLZ *">
              <input required value={plz} onChange={(e) => setPlz(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Ort *">
            <input required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
          </Field>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" disabled={!valid || submitting}>
            {submitting ? "Wird angelegt…" : "Auftrag anlegen"}
          </Button>
        </footer>
      </form>
    </div>
  )
}
