// Shared IP rate limiting for public write endpoints (booking routes). Max
// `max` attempts per IP per `windowMs`, enforced via a Firestore transaction so
// concurrent requests from the same IP are handled correctly.

import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

export async function isRateLimited(
  ip: string,
  opts: { windowMs?: number; max?: number; bucket?: string } = {},
): Promise<boolean> {
  const windowMs = opts.windowMs ?? 10 * 60 * 1000; // 10 minutes
  const max      = opts.max ?? 10;
  const bucket   = opts.bucket ?? 'default';

  // Firestore doc IDs cannot contain '/'; replace all non-alphanumeric chars.
  const docId = `${bucket}_${ip}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 150) || 'unknown';
  const ref   = adminDb.collection('rateLimits').doc(docId);
  const now   = Date.now();

  let blocked = false;
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      tx.set(ref, { ip, attempts: 1, windowStart: now });
      return;
    }

    const { attempts, windowStart } = snap.data()!;

    if (now - windowStart > windowMs) {
      tx.update(ref, { attempts: 1, windowStart: now });
    } else if (attempts >= max) {
      blocked = true;
    } else {
      tx.update(ref, { attempts: FieldValue.increment(1) });
    }
  });

  return blocked;
}
