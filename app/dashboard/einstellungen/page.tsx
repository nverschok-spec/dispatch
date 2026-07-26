'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { getPractice, updatePracticeInfo, updateDoctors, updateBlacklist } from '@/lib/firebase/firestore';
import { DOC_PALETTE, normalizeDoctor, type Doctor, type DoctorStatus, type PracticeDoc } from '@/lib/types';
import { Button } from '@/components/ui/button';

type Tab = 'betrieb' | 'mitarbeiter' | 'kundensperre';

const STATUS_LABEL: Record<DoctorStatus, string> = {
  active: 'Aktiv',
  vacation: 'Urlaub',
  sick: 'Krank',
};

const STATUS_STYLE: Record<DoctorStatus, string> = {
  active: 'border-primary/30 bg-primary/10 text-primary',
  vacation: 'border-amber-400/30 bg-amber-400/10 text-amber-600',
  sick: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const inputCls =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function EinstellungenPage() {
  const { user, claims, loading: authLoading } = useAuth();
  const router = useRouter();

  const [practice, setPractice] = useState<PracticeDoc | null>(null);
  const [tab, setTab] = useState<Tab>('mitarbeiter');
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || claims?.role !== 'praxisAdmin')) {
      router.replace('/login');
    }
  }, [authLoading, user, claims, router]);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!claims?.praxisId) return;
    getPractice(claims.praxisId).then(setPractice).catch(() => setLoadError(true));
  }, [claims?.praxisId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  // ── Betrieb-Info form ─────────────────────────────────────────────
  const [infoName, setInfoName] = useState('');
  const [infoEmail, setInfoEmail] = useState('');
  const [infoPhone, setInfoPhone] = useState('');
  const [infoAddress, setInfoAddress] = useState('');
  const [infoCity, setInfoCity] = useState('');
  const [infoHourlyRate, setInfoHourlyRate] = useState('');
  const [infoTravelCost, setInfoTravelCost] = useState('');

  useEffect(() => {
    if (!practice) return;
    setInfoName(practice.name);
    setInfoEmail(practice.email);
    setInfoPhone(practice.phone);
    setInfoAddress(practice.address ?? '');
    setInfoCity(practice.city ?? '');
    setInfoHourlyRate(practice.hourlyRateCents != null ? (practice.hourlyRateCents / 100).toFixed(2) : '65.00');
    setInfoTravelCost(practice.travelCostCents != null ? (practice.travelCostCents / 100).toFixed(2) : '39.00');
  }, [practice]);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!practice) return;
    setSaving('info');
    try {
      const data = {
        name: infoName.trim(), email: infoEmail.trim(), phone: infoPhone.trim(),
        address: infoAddress.trim(), city: infoCity.trim(),
        hourlyRateCents: Math.round(parseFloat(infoHourlyRate.replace(',', '.')) * 100),
        travelCostCents: Math.round(parseFloat(infoTravelCost.replace(',', '.')) * 100),
      };
      await updatePracticeInfo(practice.id, data);
      setPractice((p) => (p ? { ...p, ...data } : p));
      showToast('Betriebsdaten gespeichert');
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  // ── Mitarbeiter form (add + edit) ─────────────────────────────────
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('Geselle');
  const [docEmail, setDocEmail] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docColor, setDocColor] = useState<string>(DOC_PALETTE[0]);

  function resetDocForm() {
    setDocName(''); setDocSpec('Geselle'); setDocEmail(''); setDocPhone('');
    setDocColor(DOC_PALETTE[0]); setEditingDoctor(null); setShowDocForm(false);
  }

  function openEditDoctor(d: Doctor) {
    setEditingDoctor(d);
    setDocName(d.name);
    setDocSpec(d.spec);
    setDocEmail(d.email ?? '');
    setDocPhone(d.phone ?? '');
    setDocColor(d.color);
    setShowDocForm(true);
  }

  async function saveDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!practice || !docName.trim()) return;

    let updated: Doctor[];
    if (editingDoctor) {
      updated = practice.doctors.map((d) =>
        d.id === editingDoctor.id
          ? { ...d, name: docName.trim(), spec: docSpec.trim(), color: docColor,
              email: docEmail.trim() || undefined, phone: docPhone.trim() || undefined }
          : d,
      );
    } else {
      const d = normalizeDoctor({
        id: generateId(), name: docName.trim(), spec: docSpec.trim(), color: docColor,
        email: docEmail.trim() || undefined, phone: docPhone.trim() || undefined,
      });
      updated = [...practice.doctors, d];
    }

    // Optional fields (email/phone/bio/avatarUrl) can end up as literal
    // `undefined` keys here — Firestore's updateDoc rejects those outright.
    // Round-trip through JSON to strip them before writing.
    updated = JSON.parse(JSON.stringify(updated));

    setSaving('mitarbeiter');
    try {
      await updateDoctors(practice.id, updated);
      setPractice((p) => (p ? { ...p, doctors: updated } : p));
      showToast(editingDoctor ? 'Mitarbeiter gespeichert' : 'Mitarbeiter hinzugefügt');
      resetDocForm();
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  async function cycleStatus(id: string) {
    if (!practice) return;
    const order: DoctorStatus[] = ['active', 'vacation', 'sick'];
    const updated = practice.doctors.map((d) => {
      if (d.id !== id) return d;
      const next = order[(order.indexOf(d.status) + 1) % order.length];
      return { ...d, status: next, isActive: next === 'active' };
    });
    setSaving('mitarbeiter');
    try {
      await updateDoctors(practice.id, updated);
      setPractice((p) => (p ? { ...p, doctors: updated } : p));
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  // ── Techniker-Zugang (Firebase Auth login for this Mitarbeiter) ──
  const [inviteResult, setInviteResult] = useState<{ name: string; email: string; password: string | null; alreadyExisted: boolean } | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);

  async function inviteAsTechnician(d: Doctor) {
    if (!user) return;
    setInviting(d.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/mitarbeiter/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ doctorId: d.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error === 'DOCTOR_HAS_NO_EMAIL' ? 'Bitte zuerst eine E-Mail-Adresse hinterlegen' :
          data.error === 'EMAIL_BELONGS_TO_OTHER_ACCOUNT' ? 'Diese E-Mail-Adresse gehört bereits zu einem anderen Konto (z. B. Ihrem eigenen Login)' :
          'Fehler beim Einrichten';
        showToast(msg);
        return;
      }
      setInviteResult({ name: d.name, email: data.email, password: data.password, alreadyExisted: data.alreadyExisted });
    } catch {
      showToast('Fehler beim Einrichten');
    } finally {
      setInviting(null);
    }
  }

  async function removeDoctor(id: string) {
    if (!practice) return;
    if (practice.doctors.length <= 1) {
      showToast('Mindestens ein Mitarbeiter muss bestehen bleiben');
      return;
    }
    const updated = practice.doctors.filter((d) => d.id !== id);
    setSaving('mitarbeiter');
    try {
      await updateDoctors(practice.id, updated);
      setPractice((p) => (p ? { ...p, doctors: updated } : p));
      showToast('Mitarbeiter entfernt');
    } catch {
      showToast('Fehler beim Löschen');
    } finally {
      setSaving(null);
    }
  }

  // ── Kundensperre (Blacklist) ──────────────────────────────────────
  const [blockEmail, setBlockEmail] = useState('');
  const blacklist = useMemo(() => practice?.blacklist ?? [], [practice]);

  async function addToBlacklist(e: React.FormEvent) {
    e.preventDefault();
    if (!practice || !blockEmail.trim()) return;
    const normalized = blockEmail.trim().toLowerCase();
    if (blacklist.includes(normalized)) { setBlockEmail(''); return; }
    const updated = [...blacklist, normalized];
    setSaving('blacklist');
    try {
      await updateBlacklist(practice.id, updated);
      setPractice((p) => (p ? { ...p, blacklist: updated } : p));
      setBlockEmail('');
      showToast('E-Mail gesperrt');
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  async function removeFromBlacklist(email: string) {
    if (!practice) return;
    const updated = blacklist.filter((e) => e !== email);
    setSaving('blacklist');
    try {
      await updateBlacklist(practice.id, updated);
      setPractice((p) => (p ? { ...p, blacklist: updated } : p));
      showToast('Sperre aufgehoben');
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <p>Betriebsdaten konnten nicht geladen werden.</p>
        <button onClick={() => window.location.reload()} className="text-primary underline underline-offset-2">Erneut versuchen</button>
      </div>
    );
  }
  if (authLoading || !practice) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Lädt…</div>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">←</Link>
          <h1 className="flex-1 text-sm font-bold text-foreground">Einstellungen</h1>
          <span className="text-xs text-muted-foreground">{practice.name}</span>
        </div>
        <div className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-4">
          {([
            ['betrieb', 'Betrieb'],
            ['mitarbeiter', `Mitarbeiter (${practice.doctors.length})`],
            ['kundensperre', `Kundensperre${blacklist.length ? ` (${blacklist.length})` : ''}`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
                tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {toast && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
            {toast}
          </div>
        )}

        {tab === 'betrieb' && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ihr Buchungslink</h3>
              <p className="text-xs text-muted-foreground">
                Teilen Sie diesen Link mit Ihren Kunden (eigene Website, Google-Eintrag, QR-Code) —
                nur darüber können Kunden online eine Anfrage stellen.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-card-foreground">
                  {typeof window !== 'undefined' ? `${window.location.origin}/buchen/${practice.id}` : `/buchen/${practice.id}`}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/buchen/${practice.id}`);
                    showToast('Link kopiert');
                  }}
                >
                  Kopieren
                </Button>
              </div>
            </div>

          <form onSubmit={saveInfo} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Field label="Firmenname">
              <input required value={infoName} onChange={(e) => setInfoName(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="E-Mail">
                <input type="email" required value={infoEmail} onChange={(e) => setInfoEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Telefon">
                <input type="tel" required value={infoPhone} onChange={(e) => setInfoPhone(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Straße & Hausnummer">
              <input value={infoAddress} onChange={(e) => setInfoAddress(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ort">
              <input value={infoCity} onChange={(e) => setInfoCity(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Gewerk">
              <input disabled value={practice.specialty ?? '—'} className={`${inputCls} cursor-not-allowed opacity-60`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stundensatz (€)">
                <input
                  type="number" min="0" step="0.01" required value={infoHourlyRate}
                  onChange={(e) => setInfoHourlyRate(e.target.value)} className={inputCls}
                />
              </Field>
              <Field label="Anfahrtspauschale (€)">
                <input
                  type="number" min="0" step="0.01" required value={infoTravelCost}
                  onChange={(e) => setInfoTravelCost(e.target.value)} className={inputCls}
                />
              </Field>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">
              Gilt für alle neuen Rechnungen dieses Betriebs, bis hier geändert.
            </p>
            <Button type="submit" disabled={saving === 'info'}>
              {saving === 'info' ? 'Wird gespeichert…' : 'Speichern'}
            </Button>
          </form>
          </div>
        )}

        {tab === 'mitarbeiter' && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {practice.doctors.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Noch keine Mitarbeiter</div>
              ) : (
                <ul className="divide-y divide-border">
                  {practice.doctors.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-4">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: d.color }}
                      >
                        {initials(d.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-card-foreground">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.spec}</p>
                        {(d.email || d.phone) && (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {[d.email, d.phone].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => cycleStatus(d.id)}
                        disabled={saving === 'mitarbeiter'}
                        title="Klicken zum Wechseln"
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${STATUS_STYLE[d.status]}`}
                      >
                        {STATUS_LABEL[d.status]}
                      </button>
                      <button
                        onClick={() => inviteAsTechnician(d)}
                        disabled={!d.email || inviting === d.id}
                        title={d.email ? 'Techniker-App-Zugang einrichten' : 'Erst E-Mail-Adresse hinterlegen'}
                        className="flex h-7 items-center justify-center whitespace-nowrap rounded-lg border border-border px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {inviting === d.id ? '…' : 'App-Zugang'}
                      </button>
                      <button
                        onClick={() => openEditDoctor(d)}
                        title="Bearbeiten"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => removeDoctor(d.id)}
                        disabled={saving === 'mitarbeiter'}
                        title="Entfernen"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showDocForm ? (
              <form onSubmit={saveDoctor} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {editingDoctor ? `Mitarbeiter bearbeiten — ${editingDoctor.name}` : 'Neuer Mitarbeiter'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name *">
                    <input required autoFocus value={docName} onChange={(e) => setDocName(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Rolle">
                    <select value={docSpec} onChange={(e) => setDocSpec(e.target.value)} className={inputCls}>
                      {['Meister', 'Geselle', 'Azubi'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="E-Mail">
                    <input type="email" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Telefon">
                    <input type="tel" value={docPhone} onChange={(e) => setDocPhone(e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <Field label="Farbe">
                  <div className="flex flex-wrap gap-2">
                    {DOC_PALETTE.map((c) => (
                      <button
                        key={c} type="button" onClick={() => setDocColor(c)}
                        className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition-shadow ${
                          docColor === c ? 'ring-2 ring-foreground' : 'hover:ring-2 hover:ring-foreground/30'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </Field>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={resetDocForm}>Abbrechen</Button>
                  <Button type="submit" disabled={saving === 'mitarbeiter' || !docName.trim()}>
                    {saving === 'mitarbeiter' ? 'Wird gespeichert…' : editingDoctor ? 'Änderungen speichern' : 'Mitarbeiter speichern'}
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => { resetDocForm(); setShowDocForm(true); }}
                className="w-full rounded-2xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                + Mitarbeiter hinzufügen
              </button>
            )}
          </div>
        )}

        {tab === 'kundensperre' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Gesperrte E-Mail-Adressen können über die Online-Buchung keine neuen Anfragen mehr einreichen.
            </p>
            <form onSubmit={addToBlacklist} className="flex gap-2">
              <input
                type="email" required placeholder="kunde@beispiel.de" value={blockEmail}
                onChange={(e) => setBlockEmail(e.target.value)} className={inputCls}
              />
              <Button type="submit" disabled={saving === 'blacklist'}>Sperren</Button>
            </form>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {blacklist.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Keine gesperrten Kunden</div>
              ) : (
                <ul className="divide-y divide-border">
                  {blacklist.map((email) => (
                    <li key={email} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-card-foreground">{email}</span>
                      <button
                        onClick={() => removeFromBlacklist(email)}
                        disabled={saving === 'blacklist'}
                        className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        Sperre aufheben
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {inviteResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setInviteResult(null)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-card-foreground">Techniker-App-Zugang — {inviteResult.name}</h3>
            {inviteResult.alreadyExisted ? (
              <p className="text-sm text-muted-foreground">
                Zugang besteht bereits für <strong className="text-card-foreground">{inviteResult.email}</strong>.
                Das Passwort wurde nicht geändert.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Bitte diese Zugangsdaten jetzt notieren und an den Mitarbeiter weitergeben — sie werden nur einmal angezeigt:
                </p>
                <div className="space-y-2 rounded-lg border border-border bg-muted/60 p-3 text-sm">
                  <p><span className="text-muted-foreground">E-Mail:</span> <span className="font-mono text-card-foreground">{inviteResult.email}</span></p>
                  <p><span className="text-muted-foreground">Passwort:</span> <span className="font-mono text-card-foreground">{inviteResult.password}</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground">Login unter /techniker/login</p>
              </>
            )}
            <Button className="w-full" onClick={() => setInviteResult(null)}>Verstanden</Button>
          </div>
        </div>
      )}
    </div>
  );
}
