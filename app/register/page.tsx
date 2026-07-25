'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loginWithEmail } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { GEWERKE } from '@/lib/data/handwerkCatalog';

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_FIELDS: 'Bitte füllen Sie alle Pflichtfelder aus.',
  INVALID_GEWERK: 'Bitte wählen Sie ein gültiges Gewerk.',
  WEAK_PASSWORD: 'Das Passwort muss mindestens 8 Zeichen haben.',
  AVV_REQUIRED: 'Bitte akzeptieren Sie den Auftragsverarbeitungsvertrag.',
  EMAIL_IN_USE: 'Diese E-Mail-Adresse ist bereits registriert.',
  INVALID_CREDENTIALS: 'E-Mail oder Passwort ungültig.',
  RATE_LIMITED: 'Zu viele Versuche. Bitte später erneut versuchen.',
};

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [gewerk, setGewerk] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [plz, setPlz] = useState('');
  const [city, setCity] = useState('');
  const [avvAccepted, setAvvAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName, gewerk, email, password, phone, street, plz, city, avvAccepted,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(ERROR_MESSAGES[data.error] ?? 'Registrierung fehlgeschlagen. Bitte erneut versuchen.');
        setBusy(false);
        return;
      }
      await loginWithEmail(email.trim(), password);
      router.replace('/dashboard');
    } catch {
      setError('Registrierung fehlgeschlagen. Bitte erneut versuchen.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/app-icon-192.png" alt="MeisterPlan" width={56} height={56} className="rounded-2xl" />
          <div>
            <p className="text-lg font-bold text-foreground">MeisterPlan</p>
            <p className="text-sm text-muted-foreground">Kostenloses Konto für Ihren Betrieb</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Firmenname *</label>
            <input
              required value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Gewerk *</label>
            <select
              required value={gewerk} onChange={e => setGewerk(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>Bitte wählen…</option>
              {GEWERKE.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">E-Mail *</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Telefon *</label>
              <input
                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Passwort * (mind. 8 Zeichen)</label>
            <input
              type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Straße &amp; Hausnummer (optional)</label>
            <input
              value={street} onChange={e => setStreet(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">PLZ (optional)</label>
              <input
                value={plz} onChange={e => setPlz(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ort (optional)</label>
              <input
                value={city} onChange={e => setCity(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <input
              type="checkbox" required checked={avvAccepted} onChange={e => setAvvAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Ich akzeptiere die <Link href="/datenschutz" target="_blank" className="text-primary underline underline-offset-2">Datenschutzerklärung</Link> und
              den <Link href="/avv" target="_blank" className="text-primary underline underline-offset-2">Auftragsverarbeitungsvertrag (AVV)</Link>. *
            </span>
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Wird erstellt…' : 'Konto erstellen'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Bereits registriert? <Link href="/login" className="text-primary underline underline-offset-2">Anmelden</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
