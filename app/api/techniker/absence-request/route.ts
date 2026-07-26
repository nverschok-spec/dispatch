import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireTechnician } from '@/lib/server/technicianAuth';
import type { Absence, AbsenceType, Doctor } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Technician requests time off (Urlaub/Krank) for a date range — appended to
// their own Doctor entry with status: 'requested'. Firestore's arrayUnion
// can't hold a serverTimestamp() inside a nested object, and the doctors
// array on practices/{praxisId} isn't writable by a 'technician' role
// client-side anyway (see firestore.rules), so this goes through a
// transaction here instead — same pattern as invoiceNumbering's counter.

interface AbsenceRequestBody {
  type: AbsenceType;
  startDate: string;
  endDate: string;
  note?: string;
}

export async function POST(req: NextRequest) {
  const tech = await requireTechnician(req);
  if (!tech) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { type, startDate, endDate, note } = await req.json() as AbsenceRequestBody;
  if (!type || !startDate || !endDate) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'INVALID_RANGE' }, { status: 400 });
  }

  const practiceRef = adminDb.collection('practices').doc(tech.praxisId);

  const absence: Absence = {
    id: randomUUID(),
    type,
    startDate,
    endDate,
    status: 'requested',
    // Admin SDK Timestamp vs. the client-SDK Timestamp type Absence is typed
    // against in lib/types.ts — same cross-SDK cast used elsewhere for
    // Admin-SDK-authored Firestore documents (see book-handwerk/route.ts).
    requestedAt: Timestamp.now() as unknown as Absence['requestedAt'],
    ...(note?.trim() ? { note: note.trim() } : {}),
  };

  const notFound = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(practiceRef);
    if (!snap.exists) return true;
    const doctors: Doctor[] = snap.data()!.doctors ?? [];
    const idx = doctors.findIndex((d) => d.id === tech.doctorId);
    if (idx === -1) return true;
    const updated = [...doctors];
    updated[idx] = { ...updated[idx], absences: [...(updated[idx].absences ?? []), absence] };
    tx.update(practiceRef, { doctors: updated });
    return false;
  });

  if (notFound) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ absence });
}
