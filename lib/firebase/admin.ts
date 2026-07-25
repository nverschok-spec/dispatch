// Server-only Firebase Admin SDK init — used by app/api/** route handlers.
// NEVER import this from a 'use client' component.
//
// Vercel deployment: set FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL /
// FIREBASE_ADMIN_PRIVATE_KEY as project env vars (values from tools/serviceAccountKey.json).
// The private key's newlines must be escaped as literal "\n" in the env var value.

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
      }),
    });

export const adminAuth      = getAuth(adminApp);
export const adminDb        = getFirestore(adminApp);
export { getMessaging as getAdminMessaging } from 'firebase-admin/messaging';
