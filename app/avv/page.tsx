import Link from "next/link"

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-card-foreground">§ {n} {title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_strong]:text-card-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  )
}

export default function AvvPage() {
  return (
    <div className="min-h-dvh bg-background print:bg-white">
      <header className="border-b border-border px-4 py-5 print:hidden">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Zurück</Link>
          <h1 className="mt-2 text-lg font-bold text-foreground">Auftragsverarbeitungsvertrag</h1>
          <p className="text-xs text-muted-foreground">Gemäß Art. 28 DSGVO · Zwischen Lavender Edition Systems und dem Betrieb</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 border-b border-border pb-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Auftragsverarbeiter</p>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                <p className="font-semibold text-card-foreground">Lavender Edition Systems</p>
                <p>Inh. Nikita Verschok</p>
                <p>Ahornbogen 27a, 25899 Niebüll</p>
                <p>office@lavender-edition.de</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Verantwortlicher (Betrieb)</p>
              <div className="space-y-2 text-sm">
                {["Firmenname", "Adresse", "E-Mail / Telefon", "Vertreten durch"].map((label) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <div className="h-5 border-b border-border" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="pt-3 text-xs text-muted-foreground">
            Gemeinsam nachfolgend als <strong className="text-card-foreground">„die Parteien“</strong> bezeichnet.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Section n={1} title="Gegenstand und Dauer">
            <p>Dieser Vertrag regelt die Auftragsverarbeitung durch den Auftragsverarbeiter im Auftrag des Verantwortlichen bei der Nutzung von <strong>MeisterPlan</strong> (SaaS-Plattform für Auftragsannahme, Disposition und E-Rechnung für Handwerksbetriebe). Der Vertrag endet automatisch mit der Beendigung des Nutzungsverhältnisses.</p>
          </Section>
          <Section n={2} title="Art, Umfang und Zweck der Verarbeitung">
            <ul>
              <li><strong>Datenkategorien:</strong> Name, E-Mail, Telefon, Adresse (inkl. Zugangshinweise), Fotos (EXIF-bereinigt), Eigentümer/Mieter-Status, Auftrags- und Rechnungsdetails</li>
              <li><strong>Betroffenenkreis:</strong> Kunden des Betriebs</li>
              <li><strong>Verarbeitungsort:</strong> Cloud Firestore (europe-west3, Frankfurt am Main), Google Ireland Ltd.</li>
            </ul>
          </Section>
          <Section n={3} title="Weisungsgebundenheit">
            <p>Der Auftragsverarbeiter verarbeitet personenbezogene Daten ausschließlich auf dokumentierte Weisung des Verantwortlichen und nicht zu eigenen Zwecken.</p>
          </Section>
          <Section n={4} title="Technische und organisatorische Maßnahmen (Art. 32 DSGVO)">
            <ul>
              <li>TLS-Verschlüsselung aller Verbindungen, AES-256 at-rest</li>
              <li>Rollenbasierte Zugriffsrechte je Betrieb (Firebase Custom Claims)</li>
              <li>Kundenportal ohne Passwort — Zugriff nur über kryptographisch zufälligen Link-Token</li>
              <li>EXIF-Bereinigung aller Kundenfotos vor Speicherung</li>
              <li>GoBD-Unveränderbarkeit ausgestellter Rechnungen (Korrektur nur per Stornorechnung)</li>
            </ul>
          </Section>
          <Section n={5} title="Unterauftragsverarbeiter">
            <p>Aktuell eingesetzt: <strong>Google Ireland Ltd.</strong> (Firebase — Firestore, Authentication, Storage), EU-Region europe-west3 (Frankfurt am Main). Neue Unterauftragsverarbeiter werden mindestens 30 Tage im Voraus per E-Mail angekündigt.</p>
          </Section>
          <Section n={6} title="Löschung und Rückgabe">
            <p>Nach Beendigung der Auftragsverarbeitung löscht oder gibt der Auftragsverarbeiter alle personenbezogenen Daten zurück — mit Ausnahme gesetzlicher Aufbewahrungspflichten (Rechnungen: 10 Jahre, § 147 AO).</p>
          </Section>
          <Section n={7} title="Laufzeit und Kündigung">
            <p>Unbestimmte Laufzeit, kündbar von jeder Partei mit einer Frist von 30 Tagen.</p>
          </Section>
        </div>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">Stand: Juli 2026 · MeisterPlan · Lavender Edition Systems</p>
      </div>
    </div>
  )
}
