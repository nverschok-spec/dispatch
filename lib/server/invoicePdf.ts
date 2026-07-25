// Renders the visual invoice PDF and embeds the ZUGFeRD/Factur-X CII XML as a
// file attachment (the mechanism that makes a PDF "ZUGFeRD" at all). Built
// on-demand from Firestore data — no Storage bucket needed (see
// app/api/invoices/[invoiceId]/pdf/route.ts).
//
// `subset: 'PDF/A-3b'` turns on pdfkit's built-in PDF/A-3 mode (embeds fonts,
// sets the required XMP/OutputIntent structures) — PDF/A-3 is the container
// format ZUGFeRD mandates. See the honesty note in zugferdXml.ts: this hasn't
// been run through the official KoSIT validator, so treat it as "structurally
// real ZUGFeRD", not "certified compliant".

import PDFDocument from 'pdfkit';
import { buildZugferdXml, type ZugferdInvoiceInput } from './zugferdXml';

function eur(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

export async function buildInvoicePdf(inv: ZugferdInvoiceInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      subset: 'PDF/A-3b',
      info: { Title: `Rechnung ${inv.invoiceNumber}`, Author: inv.seller.name },
    });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // @types/pdfkit's PDFAttachmentOptions doesn't declare `relationship` yet,
    // even though the installed pdfkit runtime (see node_modules/pdfkit/js/
    // pdfkit.js AttachmentsMixin.file) reads and uses it — it sets the PDF's
    // AFRelationship entry, which is what tells a ZUGFeRD reader this
    // attachment IS the invoice data, not just a random file. Cast around the
    // stale type rather than silently dropping a field the runtime honours.
    const xml = buildZugferdXml(inv);
    doc.file(Buffer.from(xml, 'utf-8'), {
      name: 'factur-x.xml',
      type: 'text/xml',
      description: 'ZUGFeRD/Factur-X CII Invoice Data',
      relationship: 'Alternative',
    } as PDFKit.Mixins.PDFAttachmentOptions);

    // ── Header ──────────────────────────────────────────────────────────
    doc.fontSize(18).fillColor('#1a365d').text(inv.seller.name);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#555').text(
      [inv.seller.street, `${inv.seller.postcode ?? ''} ${inv.seller.city ?? ''}`.trim(), inv.seller.email]
        .filter(Boolean).join(' · '),
    );
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).text(`Rechnung ${inv.invoiceNumber}`);
    doc.fontSize(9).fillColor('#555').text(
      `Rechnungsdatum: ${new Date(inv.issueDateISO).toLocaleDateString('de-DE')}`,
    );
    doc.moveDown(1);

    doc.fillColor('#000').fontSize(10).text('Rechnungsempfänger:');
    doc.text(inv.buyer.name);
    if (inv.buyer.street) doc.text(inv.buyer.street);
    if (inv.buyer.postcode || inv.buyer.city) doc.text(`${inv.buyer.postcode ?? ''} ${inv.buyer.city ?? ''}`.trim());
    doc.moveDown(1.5);

    // ── Line items table ────────────────────────────────────────────────
    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fill('#1a365d');
    doc.fillColor('#fff').fontSize(9);
    doc.text('Position', 58, tableTop + 6, { width: 220 });
    doc.text('Menge', 280, tableTop + 6, { width: 60, align: 'right' });
    doc.text('Einzelpreis', 340, tableTop + 6, { width: 80, align: 'right' });
    doc.text('Gesamt', 430, tableTop + 6, { width: 100, align: 'right' });

    let y = tableTop + 24;
    doc.fillColor('#000').font('Helvetica');
    for (const item of inv.lineItems) {
      doc.fontSize(9).text(item.description, 58, y, { width: 220 });
      doc.text(String(item.quantity), 280, y, { width: 60, align: 'right' });
      doc.text(eur(item.unitPriceCents), 340, y, { width: 80, align: 'right' });
      doc.text(eur(item.netAmountCents), 430, y, { width: 100, align: 'right' });
      y += 20;
    }
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
    y += 10;

    doc.fontSize(9);
    doc.text('Netto gesamt', 340, y, { width: 80, align: 'right' });
    doc.text(eur(inv.netTotalCents), 430, y, { width: 100, align: 'right' });
    y += 16;
    doc.text(`zzgl. ${inv.vatRatePercent}% MwSt.`, 340, y, { width: 80, align: 'right' });
    doc.text(eur(inv.vatAmountCents), 430, y, { width: 100, align: 'right' });
    y += 16;
    doc.font('Helvetica-Bold');
    doc.text('Gesamtbetrag', 340, y, { width: 80, align: 'right' });
    doc.text(eur(inv.grossTotalCents), 430, y, { width: 100, align: 'right' });
    doc.font('Helvetica');

    y += 40;
    doc.fontSize(8).fillColor('#666').text(
      'Hinweis gem. § 35a EStG: Die Position "Arbeitsleistung" ist als Handwerkerleistung steuerlich ' +
      'absetzbar (20 % der Lohnkosten, max. 1.200 €/Jahr, nur bei unbarer Zahlung). Material- und ' +
      'Fahrtkosten sind hiervon nicht begünstigt und daher als eigene Position ausgewiesen.',
      50, y, { width: 495 },
    );

    doc.end();
  });
}

export type { ZugferdInvoiceInput };
