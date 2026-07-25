import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getClientIp, isRateLimited } from '@/lib/server/rateLimit';
import type {
  ArrivalWindow,
  BookingAddress,
  BookingPhoto,
  ResidencyStatus,
  UrgencyLevel,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

// Handwerk requests have no exact slot at submission time — a dispatcher assigns a
// Mitarbeiter and arrival window later (Phase 2 Dispatcher Dashboard). So unlike
// /api/book, there is no atomic slot-lock transaction here: we just create an
// 'online_request' appointment doc for the dispatcher's queue.

interface BookHandwerkBody {
  praxisId:               string;
  gewerk:                 string;
  problemName:            string;
  urgency:                UrgencyLevel;
  description?:           string;
  photoUrls?:             string[];
  arrivalWindow?:         ArrivalWindow; // omitted when urgency === 'notfall'
  address:                BookingAddress;
  residencyStatus:        ResidencyStatus;
  hausverwaltungName?:    string;
  hausverwaltungAddress?: string;
  customerName:           string;
  customerEmail:          string;
  customerPhone:          string;
  widerrufAccepted:       boolean;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, { bucket: 'book_handwerk' })) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await req.json() as BookHandwerkBody;
  const {
    praxisId, gewerk, problemName, urgency, description, photoUrls, arrivalWindow,
    address, residencyStatus, hausverwaltungName, hausverwaltungAddress,
    customerName, customerEmail, customerPhone, widerrufAccepted,
  } = body;

  if (!praxisId || !gewerk || !problemName || !address?.street || !address?.plz ||
      !customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (!widerrufAccepted) {
    return NextResponse.json({ error: 'WIDERRUF_REQUIRED' }, { status: 400 });
  }
  if (urgency !== 'notfall' && !arrivalWindow?.date) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  const practiceSnap = await adminDb.collection('practices').doc(praxisId).get();
  if (!practiceSnap.exists) {
    return NextResponse.json({ error: 'PRACTICE_NOT_FOUND' }, { status: 404 });
  }
  const practice = practiceSnap.data()!;

  const blacklist: string[] = practice.blacklist ?? [];
  if (blacklist.includes(customerEmail.toLowerCase())) {
    return NextResponse.json({ error: 'BLACKLISTED' }, { status: 403 });
  }

  // Emergencies get "as soon as possible" — today's date, no fixed window yet;
  // the dispatcher slots it in on the Timeline. Non-urgent requests carry the
  // window the customer picked.
  const effectiveWindow: ArrivalWindow = urgency === 'notfall'
    ? { date: new Date().toISOString().split('T')[0], startTime: '00:00', endTime: '23:59' }
    : arrivalWindow!;

  const photos: BookingPhoto[] = (photoUrls ?? []).slice(0, 5).map(url => ({
    url,
    uploadedAt: FieldValue.serverTimestamp() as unknown as BookingPhoto['uploadedAt'],
  }));

  // Bearer token for the passwordless Kundenportal — possession of the link is
  // the auth (matches the medical app's Firebase-email-link model, but simpler:
  // no Firebase Auth account needed at all, see app/api/portal/[token]/route.ts).
  const magicToken = randomBytes(24).toString('base64url');

  const apptRef = adminDb.collection('appointments').doc();
  await apptRef.set({
    id:                   apptRef.id,
    praxisId,
    patientId:            null,
    patientName:          customerName.trim(),
    patientEmail:         customerEmail.trim().toLowerCase(),
    insuranceType:        null,
    doctorId:             null, // assigned by dispatcher later (Mitarbeiter id)
    // Synthetic — Handwerk practices don't necessarily have a populated
    // `services` catalog (Phase 1 has no admin UI for that yet). Dispatcher
    // Dashboard (Phase 2) should read `symptomNote` for the human-readable
    // problem text rather than resolving this as a Service FK.
    serviceId:             `${gewerk}::${problemName}`,
    dateTime:             new Date(`${effectiveWindow.date}T${effectiveWindow.startTime === '00:00' ? '08:00' : effectiveWindow.startTime}`),
    source:               'online',
    status:               'online_request',
    wartezimmerEntryTime: null,
    noShow:               false,
    reminderSent:         false,
    updatedBy:            null,
    createdAt:            FieldValue.serverTimestamp(),
    updatedAt:            FieldValue.serverTimestamp(),
    deleted:              false,
    deletedAt:            null,
    deletedBy:            null,
    symptomNote:          [problemName, description?.trim()].filter(Boolean).join(' — '),
    urgency,
    address,
    photos,
    arrivalWindow:        effectiveWindow,
    residencyStatus,
    ...(hausverwaltungName?.trim()    ? { hausverwaltungName: hausverwaltungName.trim() }       : {}),
    ...(hausverwaltungAddress?.trim() ? { hausverwaltungAddress: hausverwaltungAddress.trim() } : {}),
    depositStatus:         'none',
    widerrufAccepted:      true,
    patientPhone:          customerPhone.trim(),
    magicToken,
  });

  return NextResponse.json({ appointmentId: apptRef.id, magicToken });
}
