import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export interface TechnicianIdentity {
  uid: string;
  praxisId: string;
  doctorId: string;
}

// Bearer-token check shared by app/api/techniker/** routes — mirrors the
// requireAdmin() pattern in app/api/invoices/route.ts but for the
// role: 'technician' claim set (praxisId + doctorId) instead of praxisAdmin.
export async function requireTechnician(req: NextRequest): Promise<TechnicianIdentity | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== 'technician' || !decoded.praxisId || !decoded.doctorId) return null;
    return { uid: decoded.uid, praxisId: decoded.praxisId as string, doctorId: decoded.doctorId as string };
  } catch {
    return null;
  }
}
