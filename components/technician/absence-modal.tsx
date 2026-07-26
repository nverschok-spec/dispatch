"use client"

import { useEffect, useState } from "react"
import { X, CalendarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AbsenceModalProps, AbsenceStatus, AbsenceType } from "@/types/props"

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

const STATUS_LABEL: Record<AbsenceStatus, string> = {
  requested: "Angefragt",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
}
const STATUS_STYLE: Record<AbsenceStatus, string> = {
  requested: "border-warning/30 bg-warning/10 text-warning",
  approved: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}
const TYPE_LABEL: Record<AbsenceType, string> = { urlaub: "Urlaub", krank: "Krank" }

export function AbsenceModal({ open, absences, onClose, onSubmit }: AbsenceModalProps) {
  const [type, setType] = useState<AbsenceType>("urlaub")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setType("urlaub"); setStartDate(""); setEndDate(""); setNote(""); setSubmitting(false); setError("")
    }
  }, [open])

  if (!open) return null

  const valid = startDate && endDate && endDate >= startDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError("")
    try {
      await onSubmit({ type, startDate, endDate, note: note.trim() || undefined })
      setStartDate(""); setEndDate(""); setNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anfrage fehlgeschlagen.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Urlaub / Krank melden"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-card-foreground">
            <CalendarOff className="h-4 w-4 text-primary" aria-hidden="true" />
            Urlaub / Krank melden
          </h2>
          <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {(["urlaub", "krank"] as const).map((t) => (
                <button
                  key={t} type="button" onClick={() => setType(t)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Von</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bis</label>
                <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notiz (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" disabled={!valid || submitting} className="w-full">
              {submitting ? "Wird gesendet…" : "Anfrage senden"}
            </Button>
          </form>

          {absences.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meine Meldungen</h3>
              <ul className="space-y-1.5">
                {absences.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <span className="text-card-foreground">
                      {TYPE_LABEL[a.type]} · {a.startDate} – {a.endDate}
                    </span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLE[a.status])}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
