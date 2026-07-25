import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

interface InviteBody {
  doctorId: string;
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

// Provisions (or re-links) a Firebase Auth login for a Mitarbeiter so they can
// use the Techniker app. No email provider is wired up yet (see roadmap), so
// the generated password is returned once, in-band, for the dispatcher to
// hand to their employee directly — same bootstrap pattern used for the
// serviceAccountKey-based admin tools before self-serve registration existed.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { doctorId } = await req.json() as InviteBody;
  if (!doctorId) return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });

  const practiceRef = adminDb.collection('practices').doc(admin.praxisId);
  const practiceSnap = await practiceRef.get();
  if (!practiceSnap.exists) return NextResponse.json({ error: 'PRACTICE_NOT_FOUND' }, { status: 404 });
  const practice = practiceSnap.data()!;

  const doctor = (practice.doctors ?? []).find((d: { id: string }) => d.id === doctorId);
  if (!doctor) return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
  if (!doctor.email) return NextResponse.json({ error: 'DOCTOR_HAS_NO_EMAIL' }, { status: 400 });

  const email = String(doctor.email).trim().toLowerCase();
  const claims = { role: 'technician', praxisId: admin.praxisId, doctorId };

  let uid: string;
  let password: string | null = null;
  let alreadyExisted: boolean;

  try {
    const existing = await adminAuth.getUserByEmail(email);
    // The registering owner's Mitarbeiter entry carries the same e-mail as
    // their own praxisAdmin login (see app/api/register) — without this
    // guard, inviting that entry as a technician would silently overwrite
    // the dispatcher's own account claims and lock them out of /dashboard.
    const existingRole = existing.customClaims?.role;
    if (existingRole && existingRole !== 'technician') {
      return NextResponse.json({ error: 'EMAIL_BELONGS_TO_OTHER_ACCOUNT' }, { status: 409 });
    }
    uid = existing.uid;
    alreadyExisted = true;
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch {
    password = randomBytes(9).toString('base64url');
    const created = await adminAuth.createUser({ email, password, displayName: doctor.name });
    uid = created.uid;
    alreadyExisted = false;
    await adminAuth.setCustomUserClaims(uid, claims);
  }

  await adminDb.collection('users').doc(uid).set({
    uid, email, role: 'technician', praxisId: admin.praxisId, doctorId,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    deleted: false, deletedAt: null,
  }, { merge: true });

  return NextResponse.json({ email, password, alreadyExisted });
}
