import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { buildInvoicePdf } from '@/lib/server/invoicePdf';
import type { InvoiceDoc, AppointmentDoc, PracticeDoc } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Rendered on-demand from Firestore data — no Storage bucket needed. Two ways
// in: a praxisAdmin's Bearer token, or the customer's own magicToken (their
// Kundenportal link) as ?token=… — either proves the right to see this PDF.
async function isAuthorized(req: NextRequest, invoice: InvoiceDoc, appt: AppointmentDoc): Promise<boolean> {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  if (queryToken && queryToken === appt.magicToken) return true;

  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!bearer) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(bearer);
    const role = decoded.role as string;
    const praxisId = decoded.praxisId as string | undefined;
    return role === 'master' || (role === 'praxisAdmin' && praxisId === invoice.praxisId);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const invSnap = await adminDb.collection('invoices').doc(invoiceId).get();
  if (!invSnap.exists) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const invoice = invSnap.data() as InvoiceDoc;

  const apptSnap = await adminDb.collection('appointments').doc(invoice.appointmentId).get();
  if (!apptSnap.exists) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const appt = apptSnap.data() as AppointmentDoc;

  if (!(await isAuthorized(req, invoice, appt))) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const praxisSnap = await adminDb.collection('practices').doc(invoice.praxisId).get();
  const practice = praxisSnap.data() as PracticeDoc | undefined;

  const issueDateISO = invoice.createdAt?.toDate
    ? invoice.createdAt.toDate().toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const pdf = await buildInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    issueDateISO,
    seller: {
      name:  practice?.name ?? '',
      street: practice?.address,
      city:   practice?.city,
      email:  practice?.email,
    },
    buyer: {
      name:   appt.patientName,
      street: appt.address ? `${appt.address.street} ${appt.address.houseNumber}` : undefined,
      postcode: appt.address?.plz,
      city:     appt.address?.city,
      email:    appt.patientEmail,
    },
    lineItems: invoice.lineItems.map(li => ({
      description:    li.description,
      quantity:        li.quantity,
      unitPriceCents:  li.unitPriceCents,
      netAmountCents:  li.netAmountCents,
    })),
    vatRatePercent:  invoice.vatRatePercent,
    netTotalCents:   invoice.netTotalCents,
    vatAmountCents:  invoice.vatAmountCents,
    grossTotalCents: invoice.grossTotalCents,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
