import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireTechnician } from '@/lib/server/technicianAuth';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['en_route', 'behandlung'] as const;

interface StatusBody {
  appointmentId: string;
  status: (typeof ALLOWED_STATUSES)[number];
}

export async function POST(req: NextRequest) {
  const tech = await requireTechnician(req);
  if (!tech) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { appointmentId, status } = await req.json() as StatusBody;
  if (!appointmentId || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  const apptRef = adminDb.collection('appointments').doc(appointmentId);
  const snap = await apptRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const appt = snap.data()!;

  if (appt.praxisId !== tech.praxisId || appt.doctorId !== tech.doctorId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  await apptRef.update({ status, updatedAt: FieldValue.serverTimestamp(), updatedBy: tech.uid });
  return NextResponse.json({ ok: true });
}
