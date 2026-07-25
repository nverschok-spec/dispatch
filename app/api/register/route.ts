import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getClientIp, isRateLimited } from '@/lib/server/rateLimit';
import { normalizeDoctor } from '@/lib/types';
import { GEWERKE } from '@/lib/data/handwerkCatalog';

export const dynamic = 'force-dynamic';

// Self-serve Betrieb sign-up. No admin/master step needed — replaces the old
// manual `node tools/set-praxis-admin.js` flow. Creates, in one Admin SDK
// pass: the Firebase Auth user, their praxisAdmin custom claims, the
// practices/{id} doc, and the users/{uid} doc — all three must exist for the
// dispatcher dashboard + Firestore rules (isAdmin(praxisId) check) to work.

interface RegisterBody {
  companyName: string;
  gewerk:      string;
  email:       string;
  password:    string;
  phone:       string;
  street?:     string;
  plz?:        string;
  city?:       string;
  avvAccepted: boolean;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, { bucket: 'register', windowMs: 60 * 60 * 1000, max: 5 })) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await req.json() as RegisterBody;
  const { companyName, gewerk, email, password, phone, street, plz, city, avvAccepted } = body;

  if (!companyName?.trim() || !gewerk || !email?.trim() || !password || !phone?.trim()) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (!GEWERKE.includes(gewerk as (typeof GEWERKE)[number])) {
    return NextResponse.json({ error: 'INVALID_GEWERK' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
  }
  if (!avvAccepted) {
    return NextResponse.json({ error: 'AVV_REQUIRED' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  let userRecord;
  try {
    userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: companyName.trim(),
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'EMAIL_IN_USE' }, { status: 409 });
    }
    if (code === 'auth/invalid-password' || code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 400 });
    }
    throw err;
  }

  const practiceRef = adminDb.collection('practices').doc();

  try {
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'praxisAdmin',
      praxisId: practiceRef.id,
    });

    // normalizeDoctor leaves unset optional fields (bio, avatarUrl) present as
    // `undefined` rather than omitted, which the Admin SDK rejects outright —
    // round-trip through JSON to drop them before writing to Firestore.
    const ownerDoctor = JSON.parse(JSON.stringify(normalizeDoctor({
      id: randomUUID(),
      name: companyName.trim(),
      spec: 'Meister',
      email: normalizedEmail,
      phone: phone.trim(),
    })));

    await practiceRef.set({
      id: practiceRef.id,
      name: companyName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      ...(street?.trim() ? { address: street.trim() } : {}),
      ...(city?.trim() ? { city: city.trim() } : {}),
      specialty: gewerk,
      tier: 'basis',
      infrastructure: {
        hosting: 'Vercel / Google Cloud (Firebase)',
        databaseRegion: 'europe-west3',
        dsgvoCompliant: true,
      },
      settings: {
        isPwaEnabled: true,
        maxWaitTimeMinutes: 30,
        theme: 'light-lavender',
      },
      doctors: [ownerDoctor],
      services: [],
      blacklist: [],
      createdAt: FieldValue.serverTimestamp(),
      deleted: false,
      deletedAt: null,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: normalizedEmail,
      role: 'praxisAdmin',
      praxisId: practiceRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deleted: false,
      deletedAt: null,
    });
  } catch (err) {
    // Roll back the Auth user so a failed registration doesn't leave a
    // claim-less/practice-less account blocking that email address forever.
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    throw err;
  }

  return NextResponse.json({ praxisId: practiceRef.id, uid: userRecord.uid });
}
