import Link from "next/link"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="w-28 flex-shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-card-foreground">{children}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

export default function ImpressumPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Zurück</Link>
          <h1 className="mt-2 text-lg font-bold text-foreground">Impressum</h1>
          <p className="text-xs text-muted-foreground">Angaben gemäß § 5 TMG</p>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-4 py-7">
        <Card title="Anbieter (§ 5 Abs. 1 TMG)">
          <Row label="Unternehmen">Lavender Edition Systems</Row>
          <Row label="Inhaber">Nikita Verschok</Row>
          <Row label="Straße">Ahornbogen 27a</Row>
          <Row label="PLZ / Ort">25899 Niebüll</Row>
          <Row label="Land">Deutschland</Row>
        </Card>

        <Card title="Kontakt">
          <Row label="Telefon"><a href="tel:+4915207306078" className="hover:text-primary">+49 152 07306078</a></Row>
          <Row label="E-Mail"><a href="mailto:office@lavender-edition.de" className="hover:text-primary">office@lavender-edition.de</a></Row>
        </Card>

        <Card title="Rechtsform & Tätigkeit">
          <Row label="Rechtsform">Einzelunternehmen</Row>
          <Row label="Tätigkeit">Software für Handwerksbetriebe (MeisterPlan)</Row>
        </Card>

        <Card title="Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)">
          <Row label="Person">Nikita Verschok</Row>
          <Row label="Anschrift">Lavender Edition Systems, Ahornbogen 27a, 25899 Niebüll</Row>
        </Card>

        <Card title="Haftungsausschluss">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8–10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
          </p>
        </Card>

        <Card title="Streitschlichtung (ODR)">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">Stand: Juli 2026 · MeisterPlan</p>
      </div>
    </div>
  )
}
