// GoBD requires a gapless, sequential invoice number per company (no reuse, no
// skipped numbers even for voided invoices — void via Stornorechnung instead,
// see lib/server/invoicePdf.ts / InvoiceDoc.stornoOfInvoiceId). One counter
// document per praxisId+year, incremented inside the same transaction that
// creates the invoice so two concurrent requests can never collide.

import { adminDb } from '@/lib/firebase/admin';
import type { Transaction } from 'firebase-admin/firestore';

export async function nextInvoiceNumber(tx: Transaction, praxisId: string): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = adminDb.collection('invoiceCounters').doc(`${praxisId}_${year}`);
  const snap = await tx.get(counterRef);
  const next = snap.exists ? (snap.data()!.value as number) + 1 : 1;
  tx.set(counterRef, { value: next, praxisId, year }, { merge: true });
  return `RE-${year}-${String(next).padStart(4, '0')}`;
}
