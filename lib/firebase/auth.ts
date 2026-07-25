'use client';

import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import type { User } from 'firebase/auth';
import app from './config';
import type { CustomClaims } from '@/lib/types';

export const auth = getAuth(app);

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Uses Firebase Auth's own transactional e-mail (Google-sent, no EmailJS/SMTP
// dependency) — the one notification channel that works today without
// waiting on a provider decision. Always resolves without revealing whether
// the address exists, matching Firebase's own enumeration-safe default.
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

// Decoded Custom Claims from the JWT — forces token refresh so claims are
// always current right after a role change.
export async function getClaims(user: User, forceRefresh = false): Promise<CustomClaims | null> {
  const idTokenResult = await user.getIdTokenResult(forceRefresh);
  const { role, praxisId } = idTokenResult.claims as Record<string, unknown>;
  if (!role) return null;
  return { role: role as CustomClaims['role'], praxisId: (praxisId as string) ?? null };
}

export { onAuthStateChanged };
export type { User };
