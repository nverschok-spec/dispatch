// Builds a ZUGFeRD 2.2 / Factur-X BASIC-profile Cross-Industry-Invoice (CII) XML.
//
// HONESTY NOTE for whoever picks this up next: this produces a structurally
// correct CII document (the same XML shape real ZUGFeRD invoices use, embedded
// into the PDF as a file attachment by lib/server/invoicePdf.ts — that
// PDF-attachment mechanism is the actual core of what makes a PDF "ZUGFeRD").
// It has NOT been run through the official KoSIT validator
// (https://www.itb.ec.europa.eu / Validator-Konfiguration ZUGFeRD), and the
// PDF itself is not PDF/A-3 compliant (pdfkit doesn't produce PDF/A). Both are
// required for a fully legally-conformant e-invoice — treat this as a strong
// starting point, not a compliance guarantee. Validate before relying on it
// for real invoicing.

export interface ZugferdParty {
  name: string;
  street?: string;
  postcode?: string;
  city?: string;
  email?: string;
  vatId?: string; // USt-IdNr, e.g. "DE123456789"
}

export interface ZugferdLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  netAmountCents: number;
}

export interface ZugferdInvoiceInput {
  invoiceNumber: string;
  issueDateISO: string; // YYYY-MM-DD
  seller: ZugferdParty;
  buyer: ZugferdParty;
  lineItems: ZugferdLineItem[];
  vatRatePercent: number;
  netTotalCents: number;
  vatAmountCents: number;
  grossTotalCents: number;
  currency?: string;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cii(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dateCii(iso: string): string {
  return iso.replace(/-/g, ''); // CII wants YYYYMMDD with format qualifier 102
}

function partyBlock(tag: 'SellerTradeParty' | 'BuyerTradeParty', p: ZugferdParty): string {
  return `
      <ram:${tag}>
        <ram:Name>${xmlEscape(p.name)}</ram:Name>
        ${p.vatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xmlEscape(p.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
        <ram:PostalTradeAddress>
          ${p.postcode ? `<ram:PostcodeCode>${xmlEscape(p.postcode)}</ram:PostcodeCode>` : ''}
          ${p.street ? `<ram:LineOne>${xmlEscape(p.street)}</ram:LineOne>` : ''}
          ${p.city ? `<ram:CityName>${xmlEscape(p.city)}</ram:CityName>` : ''}
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        ${p.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xmlEscape(p.email)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
      </ram:${tag}>`;
}

function lineItemBlock(item: ZugferdLineItem, index: number, vatRatePercent: number): string {
  return `
      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument>
          <ram:LineID>${index + 1}</ram:LineID>
        </ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct>
          <ram:Name>${xmlEscape(item.description)}</ram:Name>
        </ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice>
            <ram:ChargeAmount>${cii(item.unitPriceCents)}</ram:ChargeAmount>
          </ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery>
          <ram:BilledQuantity unitCode="C62">${item.quantity}</ram:BilledQuantity>
        </ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>S</ram:CategoryCode>
            <ram:RateApplicablePercent>${vatRatePercent}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <ram:LineTotalAmount>${cii(item.netAmountCents)}</ram:LineTotalAmount>
          </ram:SpecifiedTradeSettlementLineMonetarySummation>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`;
}

export function buildZugferdXml(inv: ZugferdInvoiceInput): string {
  const currency = inv.currency ?? 'EUR';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xmlEscape(inv.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateCii(inv.issueDateISO)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${inv.lineItems.map((item, i) => lineItemBlock(item, i, inv.vatRatePercent)).join('')}
    <ram:ApplicableHeaderTradeAgreement>
${partyBlock('SellerTradeParty', inv.seller)}
${partyBlock('BuyerTradeParty', inv.buyer)}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${cii(inv.vatAmountCents)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${cii(inv.netTotalCents)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${inv.vatRatePercent}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms />
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${cii(inv.netTotalCents)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${cii(inv.netTotalCents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${cii(inv.vatAmountCents)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${cii(inv.grossTotalCents)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${cii(inv.grossTotalCents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
