import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { nextInvoiceNumber } from '@/lib/server/invoiceNumbering';
import type { InvoiceLineItem, InvoiceLineType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VAT_RATE = 19;

interface CreateInvoiceBody {
  appointmentId: string;
  lineItems: { type: InvoiceLineType; description: string; quantity: number; unitPriceCents: number }[];
}

async function requireAdmin(req: NextRequest): Promise<{ uid: string; praxisId: string | null; role: string } | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, praxisId: (decoded.praxisId as string) ?? null, role: (decoded.role as string) ?? '' };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin || (admin.role !== 'praxisAdmin' && admin.role !== 'master')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json() as CreateInvoiceBody;
  const { appointmentId, lineItems } = body;
  if (!appointmentId || !lineItems?.length) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  const apptRef  = adminDb.collection('appointments').doc(appointmentId);
  const apptSnap = await apptRef.get();
  if (!apptSnap.exists) {
    return NextResponse.json({ error: 'APPOINTMENT_NOT_FOUND' }, { status: 404 });
  }
  const appt = apptSnap.data()!;

  if (admin.role !== 'master' && appt.praxisId !== admin.praxisId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  if (appt.invoiceId) {
    return NextResponse.json({ error: 'ALREADY_INVOICED' }, { status: 409 });
  }
  if (appt.status !== 'completed') {
    return NextResponse.json({ error: 'NOT_COMPLETED' }, { status: 409 });
  }

  const resolvedLineItems: InvoiceLineItem[] = lineItems.map(li => ({
    type: li.type,
    description: li.description,
    quantity: li.quantity,
    unitPriceCents: li.unitPriceCents,
    netAmountCents: Math.round(li.quantity * li.unitPriceCents),
  }));
  const netTotalCents   = resolvedLineItems.reduce((sum, li) => sum + li.netAmountCents, 0);
  const vatAmountCents  = Math.round(netTotalCents * (VAT_RATE / 100));
  const grossTotalCents = netTotalCents + vatAmountCents;

  const invoiceRef = adminDb.collection('invoices').doc();

  await adminDb.runTransaction(async (tx) => {
    const invoiceNumber = await nextInvoiceNumber(tx, appt.praxisId);
    tx.set(invoiceRef, {
      id:                invoiceRef.id,
      praxisId:          appt.praxisId,
      appointmentId,
      invoiceNumber,
      status:            'issued',
      lineItems:         resolvedLineItems,
      vatRatePercent:    VAT_RATE,
      netTotalCents,
      vatAmountCents,
      grossTotalCents,
      pdfUrl:            null, // rendered on-demand, see /api/invoices/[invoiceId]/pdf
      zugferdXmlEmbedded: true,
      paidAt:            null,
      stornoOfInvoiceId: null,
      createdAt:         FieldValue.serverTimestamp(),
      createdBy:         admin.uid,
    });
    tx.update(apptRef, { status: 'invoiced', invoiceId: invoiceRef.id, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid });
  });

  return NextResponse.json({ invoiceId: invoiceRef.id });
}
