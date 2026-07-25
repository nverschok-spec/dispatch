import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { normalizeDoctor } from '@/lib/types';
import { GEWERKE } from '@/lib/data/handwerkCatalog';

export const dynamic = 'force-dynamic';

// Master-only counterpart to /api/register — lets the platform owner onboard
// a Betrieb directly (e.g. over the phone) instead of the owner self-serving
// through /register. Same Auth-user + practice + owner-Mitarbeiter + users-doc
// shape as /api/register, just gated on role: 'master' and without the
// AVV-checkbox step (master onboarding implies that agreement out-of-band).

interface CreateBody {
  companyName: string;
  gewerk: string;
  email: string;
  phone: string;
  street?: string;
  plz?: string;
  city?: string;
}

async function requireMaster(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'master') return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const master = await requireMaster(req);
  if (!master) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { companyName, gewerk, email, phone, street, plz, city } = await req.json() as CreateBody;
  if (!companyName?.trim() || !gewerk || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (!GEWERKE.includes(gewerk as (typeof GEWERKE)[number])) {
    return NextResponse.json({ error: 'INVALID_GEWERK' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const password = randomBytes(9).toString('base64url');

  let userRecord;
  try {
    userRecord = await adminAuth.createUser({ email: normalizedEmail, password, displayName: companyName.trim() });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-exists') return NextResponse.json({ error: 'EMAIL_IN_USE' }, { status: 409 });
    throw err;
  }

  const practiceRef = adminDb.collection('practices').doc();

  try {
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'praxisAdmin', praxisId: practiceRef.id });

    const ownerDoctor = JSON.parse(JSON.stringify(normalizeDoctor({
      id: randomUUID(), name: companyName.trim(), spec: 'Meister', email: normalizedEmail, phone: phone.trim(),
    })));

    await practiceRef.set({
      id: practiceRef.id, name: companyName.trim(), email: normalizedEmail, phone: phone.trim(),
      ...(street?.trim() ? { address: street.trim() } : {}),
      ...(city?.trim() ? { city: city.trim() } : {}),
      specialty: gewerk, tier: 'basis',
      infrastructure: { hosting: 'Vercel / Google Cloud (Firebase)', databaseRegion: 'europe-west3', dsgvoCompliant: true },
      settings: { isPwaEnabled: true, maxWaitTimeMinutes: 30, theme: 'light-lavender' },
      doctors: [ownerDoctor], services: [], blacklist: [],
      createdAt: FieldValue.serverTimestamp(), deleted: false, deletedAt: null,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid, email: normalizedEmail, role: 'praxisAdmin', praxisId: practiceRef.id,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), deleted: false, deletedAt: null,
    });
  } catch (err) {
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    throw err;
  }

  return NextResponse.json({ praxisId: practiceRef.id, email: normalizedEmail, password });
}
