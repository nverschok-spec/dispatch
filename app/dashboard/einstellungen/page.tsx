'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import { getPractice, updatePracticeInfo, updateDoctors, updateBlacklist, getAllInvoices, getAppointmentsForPractice } from '@/lib/firebase/firestore';
import { DOC_PALETTE, KANBAN_LABELS, normalizeDoctor, type AppointmentDoc, type Doctor, type DoctorStatus, type PracticeDoc } from '@/lib/types';
import { Button } from '@/components/ui/button';

type Tab = 'betrieb' | 'mitarbeiter' | 'kundensperre' | 'kunden';

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
  const [appointments, setAppointments] = useState<AppointmentDoc[] | null>(null);

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

  // Fetched lazily (not on every Settings visit) — only once the Kunden tab
  // is actually opened.
  useEffect(() => {
    if (tab !== 'kunden' || !claims?.praxisId || appointments !== null) return;
    getAppointmentsForPractice(claims.praxisId).then(setAppointments).catch(() => setAppointments([]));
  }, [tab, claims?.praxisId, appointments]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const customers = useMemo(() => {
    if (!appointments) return [];
    const byEmail = new Map<string, {
      email: string; name: string; phone: string; total: number; lastVisit: Date; appointments: AppointmentDoc[];
    }>();
    for (const a of appointments) {
      if (a.deleted) continue;
      const email = a.patientEmail.toLowerCase();
      const dt = a.dateTime?.toDate?.() ?? new Date(0);
      const existing = byEmail.get(email);
      if (!existing) {
        byEmail.set(email, { email, name: a.patientName, phone: a.patientPhone ?? '', total: 1, lastVisit: dt, appointments: [a] });
      } else {
        existing.total += 1;
        existing.appointments.push(a);
        if (dt > existing.lastVisit) { existing.lastVisit = dt; existing.name = a.patientName; existing.phone = a.patientPhone ?? existing.phone; }
      }
    }
    return Array.from(byEmail.values()).sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
  }, [appointments]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.includes(q) || c.phone.includes(q));
  }, [customers, customerSearch]);

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

  // ── Rechnungsexport (CSV, für Buchhaltung/Steuerberater) ──────────
  const [exporting, setExporting] = useState(false);

  async function exportInvoicesCsv() {
    if (!practice) return;
    setExporting(true);
    try {
      const invoices = await getAllInvoices(practice.id);
      const header = ['Rechnungsnummer', 'Status', 'Datum', 'Netto (€)', 'MwSt. (€)', 'Brutto (€)', 'Bezahlt am'];
      const rows = invoices
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
        .map((inv) => [
          inv.invoiceNumber,
          inv.status,
          inv.createdAt?.toDate?.().toLocaleDateString('de-DE') ?? '',
          (inv.netTotalCents / 100).toFixed(2),
          (inv.vatAmountCents / 100).toFixed(2),
          (inv.grossTotalCents / 100).toFixed(2),
          inv.paidAt?.toDate?.().toLocaleDateString('de-DE') ?? '',
        ]);
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rechnungen-${practice.name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (invoices.length === 0) showToast('Keine Rechnungen vorhanden');
    } catch {
      showToast('Export fehlgeschlagen');
    } finally {
      setExporting(false);
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

  // ── Anträge (Urlaub/Krank, vom Mitarbeiter über die Techniker-App gemeldet) ──
  const pendingAbsences = useMemo(() => {
    if (!practice) return [];
    return practice.doctors.flatMap((d) =>
      (d.absences ?? [])
        .filter((a) => a.status === 'requested')
        .map((a) => ({ doctorId: d.id, doctorName: d.name, absence: a })),
    );
  }, [practice]);

  async function reviewAbsence(doctorId: string, absenceId: string, status: 'approved' | 'rejected') {
    if (!practice) return;
    const updated = practice.doctors.map((d) => {
      if (d.id !== doctorId) return d;
      return {
        ...d,
        absences: (d.absences ?? []).map((a) =>
          a.id === absenceId ? { ...a, status, reviewedAt: Timestamp.now() } : a,
        ),
      };
    });
    setSaving('mitarbeiter');
    try {
      await updateDoctors(practice.id, updated);
      setPractice((p) => (p ? { ...p, doctors: updated } : p));
      showToast(status === 'approved' ? 'Genehmigt' : 'Abgelehnt');
    } catch {
      showToast('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  }

  function currentAbsence(d: Doctor): { label: string } | null {
    const today = new Date().toISOString().slice(0, 10);
    const active = (d.absences ?? [])
      .filter((a) => a.status === 'approved' && a.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    if (!active) return null;
    const label = active.type === 'urlaub' ? 'Urlaub' : 'Krank';
    return { label: `${label}: ${active.startDate} – ${active.endDate}` };
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
            ['kunden', 'Kunden'],
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

          <div className="space-y-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rechnungsexport</h3>
            <p className="text-xs text-muted-foreground">
              Alle Rechnungen (offen, bezahlt, storniert) als CSV — für Buchhaltung oder Steuerberater.
            </p>
            <Button type="button" variant="outline" onClick={exportInvoicesCsv} disabled={exporting}>
              {exporting ? 'Wird exportiert…' : 'Als CSV exportieren'}
            </Button>
          </div>
          </div>
        )}

        {tab === 'mitarbeiter' && (
          <div className="space-y-4">
            {pendingAbsences.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-warning/30 bg-warning/10 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-warning">
                  Offene Anträge ({pendingAbsences.length})
                </h3>
                <ul className="space-y-1.5">
                  {pendingAbsences.map(({ doctorId, doctorName, absence }) => (
                    <li key={absence.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <span className="text-sm text-card-foreground">
                        {doctorName} · {absence.type === 'urlaub' ? 'Urlaub' : 'Krank'} · {absence.startDate} – {absence.endDate}
                        {absence.note && <span className="text-muted-foreground"> · &bdquo;{absence.note}&ldquo;</span>}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => reviewAbsence(doctorId, absence.id, 'approved')}
                          disabled={saving === 'mitarbeiter'}
                          className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
                        >
                          Genehmigen
                        </button>
                        <button
                          onClick={() => reviewAbsence(doctorId, absence.id, 'rejected')}
                          disabled={saving === 'mitarbeiter'}
                          className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                        >
                          Ablehnen
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                        {currentAbsence(d) && (
                          <p className="mt-0.5 truncate text-[11px] font-medium text-warning">{currentAbsence(d)!.label}</p>
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

        {tab === 'kunden' && (
          <div className="space-y-4">
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Name, E-Mail, Telefon…"
              className={inputCls}
            />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {appointments === null ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Lädt…</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {customerSearch ? 'Keine Treffer' : 'Noch keine Kunden'}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredCustomers.map((c) => (
                    <li key={c.email}>
                      <button
                        onClick={() => setExpandedCustomer((cur) => (cur === c.email ? null : c.email))}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-card-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{c.total} Auftrag{c.total !== 1 ? 'e' : ''}</span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.lastVisit.toLocaleDateString('de-DE')}</span>
                      </button>
                      {expandedCustomer === c.email && (
                        <ul className="space-y-1 bg-muted/30 px-5 py-3">
                          {c.appointments
                            .sort((a, b) => (b.dateTime?.toDate?.().getTime() ?? 0) - (a.dateTime?.toDate?.().getTime() ?? 0))
                            .map((a) => (
                              <li key={a.id} className="flex items-center justify-between text-xs">
                                <span className="truncate text-card-foreground">{a.symptomNote ?? 'Auftrag'}</span>
                                <span className="shrink-0 text-muted-foreground">
                                  {a.dateTime?.toDate?.().toLocaleDateString('de-DE')} · {KANBAN_LABELS[a.status] ?? a.status}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
