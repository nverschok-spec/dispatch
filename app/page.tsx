import Link from "next/link"
import Image from "next/image"
import {
  CalendarCheck,
  Camera,
  FileCheck2,
  MapPinned,
  Radio,
  Receipt,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    icon: Camera,
    title: "Intelligente Online-Buchung",
    desc: "Kunden wählen ihr Problem, laden Fotos hoch und geben ein Zeitfenster an — statt endloser Telefonate.",
  },
  {
    icon: Radio,
    title: "Live-Disposition",
    desc: "Sehen Sie alle eingehenden Aufträge in einer Warteschlange und weisen Sie sie per Klick Ihren Technikern zu.",
  },
  {
    icon: MapPinned,
    title: "Techniker-Timeline",
    desc: "Der komplette Tagesplan aller Mitarbeiter auf einen Blick — wer ist wo, wann verfügbar.",
  },
  {
    icon: Receipt,
    title: "ZUGFeRD-Rechnungen automatisch",
    desc: "Arbeitszeit, Material und Fahrtkosten werden korrekt nach § 35a EStG getrennt und als E-Rechnung ausgestellt.",
  },
  {
    icon: FileCheck2,
    title: "Kundenportal ohne Login",
    desc: "Ihre Kunden verfolgen den Status live über einen sicheren Link — kein Konto, kein Passwort nötig.",
  },
  {
    icon: ShieldCheck,
    title: "DSGVO-konform",
    desc: "Daten in der EU gespeichert, Fotos automatisch von Standortdaten befreit, GoBD-konforme Rechnungsnummern.",
  },
]

const STEPS = [
  { n: "1", title: "Kunde bucht online", desc: "Anliegen wählen, Foto hochladen, Zeitfenster festlegen — in unter 2 Minuten." },
  { n: "2", title: "Sie disponieren", desc: "Die Anfrage erscheint sofort in Ihrer Warteschlange. Ein Klick weist sie einem Techniker zu." },
  { n: "3", title: "Rechnung entsteht automatisch", desc: "Nach Abschluss des Einsatzes erstellen Sie die ZUGFeRD-Rechnung direkt aus dem Auftrag." },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/app-icon-192.png" alt="MeisterPlan" width={36} height={36} className="rounded-xl" />
            <span className="text-lg font-bold text-foreground">MeisterPlan</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Anmelden</Link>
            <Link href="/register" className={buttonVariants({ variant: "outline" })}>Kostenlos starten</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          Für Handwerksbetriebe in Deutschland
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Vom Telefon-Chaos zur digitalen Disposition
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Online-Terminbuchung mit Fotos, ein Leitstand für Ihre Techniker und automatische ZUGFeRD-Rechnungen —
          gebaut für Sanitär, Elektro, Heizung und mehr.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}>
            Kostenlos starten
          </Link>
          <a href="mailto:office@lavender-edition.de?subject=MeisterPlan%20Demo" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-6 text-base")}>
            Demo anfragen
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Alles, was Ihr Betrieb braucht</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">So funktioniert's</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-14 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl px-4">
          <CalendarCheck className="mx-auto h-8 w-8" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold">Bereit, den Telefon-Ping-Pong zu beenden?</h2>
          <p className="mt-2 text-sm text-primary-foreground/85">
            In 2 Minuten registriert — oder wir richten Ihren Betrieb persönlich ein.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "h-11 px-6 text-base")}>
              Kostenlos starten
            </Link>
            <a href="mailto:office@lavender-edition.de?subject=MeisterPlan%20Demo" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 border-primary-foreground/30 px-6 text-base text-primary-foreground hover:bg-primary-foreground/10")}>
              Demo anfragen
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} MeisterPlan · Lavender Edition Systems</p>
          <div className="flex items-center gap-4">
            <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
            <Link href="/avv" className="hover:text-foreground">AVV</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
