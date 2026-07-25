'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginWithEmail, resetPassword } from '@/lib/firebase/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user && claims?.role === 'praxisAdmin') {
      router.replace('/dashboard');
    }
  }, [user, claims, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch {
      setError('E-Mail oder Passwort ist falsch.');
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await resetPassword(email.trim());
    } catch {
      // Enumeration-safe: show the same confirmation whether or not the address exists.
    } finally {
      setResetSent(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/app-icon-192.png" alt="MeisterPlan" width={56} height={56} className="rounded-2xl" />
          <div>
            <p className="text-lg font-bold text-foreground">MeisterPlan</p>
            <p className="text-sm text-muted-foreground">Disponenten-Login</p>
          </div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">E-Mail</label>
              <input
                type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Passwort</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Wird geprüft…' : 'Anmelden'}
            </Button>
            <button
              type="button"
              onClick={() => { setMode('reset'); setResetSent(false); setError(''); }}
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Passwort vergessen?
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            {resetSent ? (
              <p className="text-sm text-card-foreground">
                Falls <strong>{email.trim()}</strong> ein Konto hat, wurde soeben eine E-Mail zum Zurücksetzen verschickt.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">E-Mail</label>
                  <input
                    type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? 'Wird gesendet…' : 'Link zum Zurücksetzen senden'}
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Zurück zum Login
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Noch kein Konto? <a href="/register" className="text-primary underline underline-offset-2">Jetzt registrieren</a>
        </p>
      </div>
    </div>
  );
}
