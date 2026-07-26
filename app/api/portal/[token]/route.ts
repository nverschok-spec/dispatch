import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Passwordless Kundenportal — GET only, no Firebase Auth. Possession of the
// (unguessable, 24-byte) token in the URL is the entire access control model,
// same trust model as a Firebase email-sign-in link but without needing an
// Auth account or the "Email link" sign-in method enabled in the console.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const snap = await adminDb.collection('appointments')
    .where('magicToken', '==', token)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const appt = snap.docs[0].data();

  const practiceSnap = await adminDb.collection('practices').doc(appt.praxisId).get();
  const practice = practiceSnap.data();
  const doctor = appt.doctorId
    ? (practice?.doctors ?? []).find((d: { id: string }) => d.id === appt.doctorId)
    : null;

  return NextResponse.json({
    id:           snap.docs[0].id,
    status:       appt.status,
    symptomNote:  appt.symptomNote ?? null,
    urgency:      appt.urgency ?? 'normal',
    address:      appt.address ?? null,
    arrivalWindow: appt.arrivalWindow ?? null,
    dateTime:     appt.dateTime?.toDate?.().toISOString() ?? null,
    customerName: appt.patientName,
    mitarbeiter:  doctor ? { name: doctor.name, spec: doctor.spec, color: doctor.color, avatarUrl: doctor.avatarUrl ?? null } : null,
    invoiceId:    appt.invoiceId ?? null, // Phase 4 wires a real ZUGFeRD PDF behind this
    quote: appt.quote ? {
      lineItems: appt.quote.lineItems,
      netTotalCents: appt.quote.netTotalCents,
      vatAmountCents: appt.quote.vatAmountCents,
      grossTotalCents: appt.quote.grossTotalCents,
      status: appt.quote.status,
    } : null,
    praxis: {
      name:  practice?.name ?? '',
      phone: practice?.phone ?? '',
    },
  });
}
