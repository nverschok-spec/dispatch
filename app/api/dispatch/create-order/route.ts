import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import type { AppointmentSource, BookingAddress, UrgencyLevel } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Authenticated counterpart to /api/book-handwerk — a phoned-in or walk-in
// customer has no way to reach the public booking widget, so the dispatcher
// needs to be able to create the same appointment record directly. No
// rate-limit (authenticated action, not a public endpoint) and no Widerruf
// checkbox (that consent flow belongs to the self-service online form; a
// staff-taken phone order isn't that same distance-sale checkout step).

interface CreateOrderBody {
  gewerk: string;
  problemName: string;
  urgency: UrgencyLevel;
  description?: string;
  source: 'phone' | 'walk-in';
  address: BookingAddress;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

async function requireAdmin(req: NextRequest): Promise<{ uid: string; praxisId: string } | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'praxisAdmin' || !decoded.praxisId) return null;
    return { uid: decoded.uid, praxisId: decoded.praxisId as string };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json() as CreateOrderBody;
  const { gewerk, problemName, urgency, description, source, address, customerName, customerEmail, customerPhone } = body;

  if (!gewerk || !problemName || !address?.street || !address?.plz || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  const magicToken = randomBytes(24).toString('base64url');
  const effectiveSource: AppointmentSource = source === 'walk-in' ? 'walk-in' : 'phone';

  const apptRef = adminDb.collection('appointments').doc();
  await apptRef.set({
    id: apptRef.id,
    praxisId: admin.praxisId,
    patientId: null,
    patientName: customerName.trim(),
    patientEmail: (customerEmail ?? '').trim().toLowerCase(),
    patientPhone: customerPhone.trim(),
    doctorId: null,
    serviceId: `${gewerk}::${problemName}`,
    dateTime: new Date(),
    source: effectiveSource,
    status: 'online_request',
    noShow: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: admin.uid,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    symptomNote: [problemName, description?.trim()].filter(Boolean).join(' — '),
    urgency,
    address,
    photos: [],
    depositStatus: 'none',
    magicToken,
  });

  return NextResponse.json({ appointmentId: apptRef.id, magicToken });
}
