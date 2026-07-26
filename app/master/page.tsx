'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { logout } from '@/lib/firebase/auth';
import {
  getAllPractices, getAllAppointmentsForStats, updatePracticeTier, softDeletePractice, reactivatePractice,
} from '@/lib/firebase/firestore';
import { TIER_CONFIG, type AppointmentDoc, type PracticeDoc, type SubscriptionTier } from '@/lib/types';
import { GEWERKE } from '@/lib/data/handwerkCatalog';
import { Button } from '@/components/ui/button';

const TIER_BADGE: Record<SubscriptionTier, string> = {
  basis: 'border-border bg-muted text-muted-foreground',
  pro: 'border-primary/30 bg-primary/10 text-primary',
  enterprise: 'border-success/30 bg-success/10 text-success',
};

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function MasterPage() {
  const { user, claims, loading: authLoading } = useAuth();
  const router = useRouter();

  const [practices, setPractices] = useState<PracticeDoc[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PracticeDoc | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || claims?.role !== 'master')) {
      router.replace('/master/login');
    }
  }, [authLoading, user, claims, router]);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!(user && claims?.role === 'master')) return;
    Promise.all([getAllPractices(), getAllAppointmentsForStats()])
      .then(([p, a]) => {
        setPractices(p.sort((x, y) => x.name.localeCompare(y.name)));
        setAppointments(a);
        setLoadingData(false);
      })
      .catch(() => { setLoadError(true); setLoadingData(false); });
  }, [user, claims]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - dow);
    let today = 0, week = 0;
    appointments.forEach((a) => {
      const dt = a.dateTime?.toDate?.();
      if (!dt) return;
      if (dt >= startOfToday) today++;
      if (dt >= startOfWeek) week++;
    });
    const active = practices.filter((p) => !p.deleted);
    return {
      practiceCount: active.length,
      doctorCount: active.reduce((n, p) => n + (p.doctors?.length ?? 0), 0),
      today, week,
    };
  }, [practices, appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return practices;
    return practices.filter((p) =>
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) || (p.phone ?? '').toLowerCase().includes(q));
  }, [practices, search]);

  async function handleTierChange(p: PracticeDoc, tier: SubscriptionTier) {
    if (p.tier === tier) return;
    setBusy(p.id + tier);
    try {
      await updatePracticeTier(p.id, tier);
      setPractices((list) => list.map((x) => (x.id === p.id ? { ...x, tier } : x)));
      showToast(`Tarif → ${TIER_CONFIG[tier].label}`);
    } catch {
      showToast('Fehler beim Tarifwechsel');
    } finally {
      setBusy(null);
    }
  }

  async function handleDeactivate() {
    if (!deleteTarget) return;
    setBusy('delete');
    try {
      await softDeletePractice(deleteTarget.id);
      setPractices((list) => list.map((x) => (x.id === deleteTarget.id ? { ...x, deleted: true } : x)));
      showToast(`"${deleteTarget.name}" deaktiviert`);
      setDeleteTarget(null);
    } catch {
      showToast('Fehler beim Deaktivieren');
    } finally {
      setBusy(null);
    }
  }

  async function handleReactivate(p: PracticeDoc) {
    setBusy(p.id);
    try {
      await reactivatePractice(p.id);
      setPractices((list) => list.map((x) => (x.id === p.id ? { ...x, deleted: false } : x)));
      showToast(`"${p.name}" reaktiviert`);
    } catch {
      showToast('Fehler beim Reaktivieren');
    } finally {
      setBusy(null);
    }
  }

  // ── Create-practice modal ─────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName] = useState('');
  const [cGewerk, setCGewerk] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/master/create-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ companyName: cName, gewerk: cGewerk, email: cEmail, phone: cPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error === 'EMAIL_IN_USE' ? 'E-Mail bereits vergeben' : 'Fehler beim Anlegen');
        return;
      }
      const [refreshedPractices] = await Promise.all([getAllPractices()]);
      setPractices(refreshedPractices.sort((x, y) => x.name.localeCompare(y.name)));
      setCreated({ name: cName, email: data.email, password: data.password });
      setShowCreate(false);
      setCName(''); setCGewerk(''); setCEmail(''); setCPhone('');
    } catch {
      showToast('Fehler beim Anlegen');
    } finally {
      setCreating(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <p>Daten konnten nicht geladen werden.</p>
        <button onClick={() => window.location.reload()} className="text-primary underline underline-offset-2">Erneut versuchen</button>
      </div>
    );
  }
  if (authLoading || loadingData) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Lädt…</div>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Image src="/app-icon-192.png" alt="MeisterPlan" width={28} height={28} className="rounded-lg" />
          <h1 className="text-sm font-bold text-foreground">Master-Übersicht</h1>
          <span className="text-xs text-muted-foreground">alle Betriebe</span>
          <button
            onClick={() => logout().then(() => router.replace('/master/login'))}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Abmelden
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {toast && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">{toast}</div>
        )}

        {/* Global stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Betriebe" value={stats.practiceCount} />
          <StatCard label="Mitarbeiter gesamt" value={stats.doctorCount} />
          <StatCard label="Einsätze heute" value={stats.today} accent />
          <StatCard label="Einsätze diese Woche" value={stats.week} />
        </div>

        {/* Practice list */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Betriebe ({filtered.length}{search ? ` / ${practices.length}` : ''})
          </h2>
          <div className="flex items-center gap-2">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, ID, E-Mail…" className="w-56 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none"
            />
            <Button size="sm" onClick={() => setShowCreate(true)}>+ Neuer Betrieb</Button>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
              Keine Treffer
            </div>
          ) : (
            filtered.map((p) => {
              const apptCount = appointments.filter((a) => a.praxisId === p.id).length;
              return (
                <div key={p.id} className={`rounded-2xl border bg-card p-4 shadow-sm ${p.deleted ? 'border-border opacity-60' : 'border-border'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-card-foreground">{p.name}</p>
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_BADGE[p.tier ?? 'basis']}`}>
                          {TIER_CONFIG[p.tier ?? 'basis'].label}
                        </span>
                        {p.deleted && (
                          <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                            Deaktiviert
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[p.email, p.phone].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.id}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{p.doctors?.length ?? 0} Mitarbeiter</span>
                        <span>{apptCount} Einsätze</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {(['basis', 'pro', 'enterprise'] as SubscriptionTier[]).map((t) => (
                          <button
                            key={t}
                            disabled={busy === p.id + t || p.deleted}
                            onClick={() => handleTierChange(p, t)}
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-40 ${
                              (p.tier ?? 'basis') === t ? TIER_BADGE[t] : 'border-border text-muted-foreground hover:border-primary/40'
                            }`}
                          >
                            {TIER_CONFIG[t].label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/buchen/${p.id}`} target="_blank" className="text-[11px] text-primary underline underline-offset-2">
                          Buchungsseite ↗
                        </Link>
                        {p.deleted ? (
                          <button
                            onClick={() => handleReactivate(p)}
                            disabled={busy === p.id}
                            className="text-[11px] text-primary underline underline-offset-2"
                          >
                            Reaktivieren
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="text-[11px] text-destructive underline underline-offset-2"
                          >
                            Deaktivieren
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-card-foreground">Neuen Betrieb anlegen</h3>
            <Field label="Firmenname *">
              <input required autoFocus value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Gewerk *">
              <select required value={cGewerk} onChange={(e) => setCGewerk(e.target.value)} className={inputCls}>
                <option value="" disabled>Bitte wählen…</option>
                {GEWERKE.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="E-Mail *">
                <input type="email" required value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Telefon *">
                <input type="tel" required value={cPhone} onChange={(e) => setCPhone(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button type="submit" className="flex-1" disabled={creating}>{creating ? 'Wird angelegt…' : 'Anlegen'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Created-credentials modal */}
      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setCreated(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-card-foreground">Betrieb angelegt — {created.name}</h3>
            <p className="text-sm text-muted-foreground">Zugangsdaten jetzt notieren, werden nur einmal angezeigt:</p>
            <div className="space-y-2 rounded-lg border border-border bg-muted/60 p-3 text-sm">
              <p><span className="text-muted-foreground">E-Mail:</span> <span className="font-mono text-card-foreground">{created.email}</span></p>
              <p><span className="text-muted-foreground">Passwort:</span> <span className="font-mono text-card-foreground">{created.password}</span></p>
            </div>
            <p className="text-[11px] text-muted-foreground">Login unter /login</p>
            <Button className="w-full" onClick={() => setCreated(null)}>Verstanden</Button>
          </div>
        </div>
      )}

      {/* Deactivate confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-card-foreground">Betrieb deaktivieren?</h3>
            <p className="text-sm text-muted-foreground">
              <strong className="text-card-foreground">{deleteTarget.name}</strong> kann danach nicht mehr gebucht werden und der Disponent wird ausgesperrt. Reaktivierbar jederzeit.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeactivate} disabled={busy === 'delete'}>
                {busy === 'delete' ? 'Wird deaktiviert…' : 'Deaktivieren'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className={`text-2xl font-bold ${accent ? 'text-primary' : 'text-card-foreground'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
