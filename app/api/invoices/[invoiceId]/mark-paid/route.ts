import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Manual payment confirmation (bank transfer, cash, …) — there's no Stripe
// integration yet, so this is the only way an invoice ever leaves the
// "Offene Rechnungen" list. GoBD only requires the invoice DOCUMENT itself
// stay immutable (firestore.rules: `allow write: if false`); recording that
// it was paid is bookkeeping metadata, not a content change, so this goes
// through the Admin SDK rather than loosening that rule.

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin || (admin.role !== 'praxisAdmin' && admin.role !== 'master')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const invoiceRef = adminDb.collection('invoices').doc(invoiceId);
  const snap = await invoiceRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const invoice = snap.data()!;

  if (admin.role !== 'master' && invoice.praxisId !== admin.praxisId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  if (invoice.status === 'paid') {
    return NextResponse.json({ ok: true }); // idempotent
  }
  if (invoice.status !== 'issued') {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 409 });
  }

  await invoiceRef.update({ status: 'paid', paidAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
