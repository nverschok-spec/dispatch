import Link from "next/link"

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-card-foreground">
        {children}
      </div>
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            {head.map((h) => <th key={h} className="border-b border-border px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {r.map((c, j) => <td key={j} className="px-3 py-2 align-top text-muted-foreground">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Content matches what the app actually collects (see app/api/book-handwerk,
// lib/firebase/storage.ts EXIF-stripping, app/api/portal) — not boilerplate.
export default function DatenschutzPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Zurück</Link>
          <h1 className="mt-2 text-lg font-bold text-foreground">Datenschutzerklärung</h1>
          <p className="text-xs text-muted-foreground">MeisterPlan</p>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-4 py-7">
        <Card title="Verantwortlicher">
          <p>Lavender Edition Systems, Inh. Nikita Verschok, Ahornbogen 27a, 25899 Niebüll — <a href="mailto:office@lavender-edition.de">office@lavender-edition.de</a></p>
        </Card>

        <Card title="Welche Daten wir erheben">
          <Table
            head={["Kategorie", "Beispiele", "Erhoben von"]}
            rows={[
              ["Kontaktdaten", "Name, E-Mail, Telefonnummer", "Kunde bei Anfrage"],
              ["Auftragsdaten", "Problembeschreibung, Gewerk, Dringlichkeit", "Kunde bei Anfrage"],
              ["Fotos", "Bis zu 5 Fotos des Problems — EXIF-Metadaten (u. a. GPS-Standort) werden vor dem Upload technisch entfernt", "Kunde, optional"],
              ["Adressdaten", "Straße, PLZ, Ort, Etage, Zugangshinweise", "Kunde bei Anfrage"],
              ["Mietverhältnis", "Eigentümer/Mieter-Status, ggf. Hausverwaltung", "Kunde bei Anfrage"],
              ["Rechnungsdaten", "Leistungspositionen, Beträge, Rechnungsnummer", "Betrieb bei Rechnungsstellung"],
            ]}
          />
        </Card>

        <Card title="Zweck der Verarbeitung">
          <ul className="list-disc space-y-1 pl-5">
            <li>Entgegennahme und Disposition von Handwerker-Einsatzanfragen</li>
            <li>Status-Kommunikation über das passwortlose Kundenportal (Zugriff über einen unvorhersehbaren Link-Token, kein Konto nötig)</li>
            <li>Erstellung gesetzeskonformer Rechnungen (§ 35a EStG-Aufteilung, ZUGFeRD-E-Rechnung)</li>
          </ul>
        </Card>

        <Card title="Rechtsgrundlage">
          <p>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung/vorvertragliche Anfrage) für die Auftragsabwicklung; Art. 6 Abs. 1 lit. c DSGVO für die Rechnungsstellung nach handels- und steuerrechtlichen Vorgaben (GoBD).</p>
        </Card>

        <Card title="Firebase (Google) — Cloud-Speicherung">
          <p>Wir nutzen Cloud Firestore und Firebase Authentication von Google Ireland Ltd. Datenregion: <strong>europe-west3 (Frankfurt am Main, Deutschland)</strong>.</p>
        </Card>

        <Card title="Speicherdauer & Löschung">
          <p>Auftragsdaten werden für die Dauer der Geschäftsbeziehung und anschließend entsprechend gesetzlicher Aufbewahrungsfristen gespeichert (Rechnungen: 10 Jahre gem. § 147 AO).</p>
        </Card>

        <Card title="Ihre Rechte (Art. 15–22 DSGVO)">
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich an den Betrieb, der Ihre Anfrage bearbeitet hat, oder an uns.</p>
        </Card>

        <Card title="Auftragsverarbeitungsvertrag (AVV) für Betriebe">
          <p>Betriebe, die MeisterPlan einsetzen und dabei personenbezogene Kundendaten an uns übermitteln, benötigen gemäß Art. 28 DSGVO einen Auftragsverarbeitungsvertrag. Vorlage: <Link href="/avv">/avv</Link>.</p>
        </Card>

        <Card title="Kontakt & Beschwerderecht">
          <p>Bei Fragen zum Datenschutz: <a href="mailto:office@lavender-edition.de">office@lavender-edition.de</a>. Sie haben zudem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.</p>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">Stand: Juli 2026 · MeisterPlan</p>
      </div>
    </div>
  )
}
