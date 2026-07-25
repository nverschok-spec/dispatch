import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireTechnician } from '@/lib/server/technicianAuth';

export const dynamic = 'force-dynamic';

// Today's assigned jobs for the logged-in Techniker. Deliberately a plain GET
// + client refetch rather than a realtime listener — the Techniker app has no
// direct Firestore access (see firestore.rules: appointments read/write is
// admin/master only), all technician access goes through these Bearer-authed
// Admin SDK routes instead.
export async function GET(req: NextRequest) {
  const tech = await requireTechnician(req);
  if (!tech) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const snap = await adminDb.collection('appointments')
    .where('praxisId', '==', tech.praxisId)
    .where('doctorId', '==', tech.doctorId)
    .where('deleted', '==', false)
    .where('dateTime', '>=', startOfDay)
    .where('dateTime', '<', endOfDay)
    .get();

  const appointments = snap.docs
    .map((d) => d.data())
    .filter((a) => ['dispatched', 'en_route', 'behandlung', 'completed', 'invoiced'].includes(a.status));

  // Timestamps don't survive JSON.stringify as usable dates — serialize
  // explicitly so the client can reconstruct Firestore-Timestamp-like objects.
  const serialized = appointments.map((a) => ({
    ...a,
    dateTime: a.dateTime.toDate().toISOString(),
    createdAt: a.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: a.updatedAt?.toDate?.().toISOString() ?? null,
  }));

  const practiceSnap = await adminDb.collection('practices').doc(tech.praxisId).get();
  const doctor = (practiceSnap.data()?.doctors ?? []).find((d: { id: string }) => d.id === tech.doctorId) ?? null;

  return NextResponse.json({ appointments: serialized, doctor });
}
