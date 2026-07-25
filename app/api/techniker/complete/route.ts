import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireTechnician } from '@/lib/server/technicianAuth';
import type { JobMaterial } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface CompleteBody {
  appointmentId: string;
  materials: { id: string | number; name: string; qty: number; unit: string }[];
  durationMinutes: number;
  signed: boolean;
}

export async function POST(req: NextRequest) {
  const tech = await requireTechnician(req);
  if (!tech) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { appointmentId, materials, durationMinutes, signed } = await req.json() as CompleteBody;
  if (!appointmentId || durationMinutes == null) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  // Signature is mandatory in the UI (the "Auftrag abschließen" button stays
  // disabled without it) — enforced again here since the client can't be trusted.
  if (!signed) {
    return NextResponse.json({ error: 'SIGNATURE_REQUIRED' }, { status: 400 });
  }

  const apptRef = adminDb.collection('appointments').doc(appointmentId);
  const snap = await apptRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  const appt = snap.data()!;

  if (appt.praxisId !== tech.praxisId || appt.doctorId !== tech.doctorId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const cleanMaterials: JobMaterial[] = (materials ?? [])
    .filter((m) => m.qty > 0)
    .map((m) => ({ id: String(m.id), name: m.name, qty: m.qty, unit: m.unit }));

  await apptRef.update({
    status: 'completed',
    materials: cleanMaterials,
    actualDurationMinutes: durationMinutes,
    signedByCustomer: true,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: tech.uid,
  });

  return NextResponse.json({ ok: true });
}
