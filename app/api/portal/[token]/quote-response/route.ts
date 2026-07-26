import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Same possession-of-token trust model as the rest of the Kundenportal (see
// app/api/portal/[token]/route.ts) — no Firebase Auth for the customer.

interface QuoteResponseBody {
  response: 'accepted' | 'rejected';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const { response } = await req.json() as QuoteResponseBody;
  if (response !== 'accepted' && response !== 'rejected') {
    return NextResponse.json({ error: 'INVALID_RESPONSE' }, { status: 400 });
  }

  const snap = await adminDb.collection('appointments').where('magicToken', '==', token).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const apptRef = snap.docs[0].ref;
  const appt = snap.docs[0].data();
  if (!appt.quote) return NextResponse.json({ error: 'NO_QUOTE' }, { status: 404 });
  if (appt.quote.status !== 'sent') return NextResponse.json({ error: 'ALREADY_RESPONDED' }, { status: 409 });

  await apptRef.update({
    'quote.status': response,
    'quote.respondedAt': FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
