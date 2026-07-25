/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // pdfkit (lib/server/invoicePdf.ts, ZUGFeRD invoices) loads its .afm font
  // metric files via fs.readFileSync relative to its own package directory —
  // bundling breaks that path, so it's excluded and required natively from
  // node_modules at runtime instead. Next 15+/16 stable location (superseded
  // experimental.serverComponentsExternalPackages from Next 14).
  //
  // firebase-admin's auth module depends on jwks-rsa -> jose (ESM-only).
  // Marking firebase-admin external (like pdfkit) skips webpack's CJS/ESM
  // interop rewrite for it, so `require()` hits the raw ESM file directly —
  // that's what caused ERR_REQUIRE_ESM in prod (Vercel) even though it
  // happened to work under `next start` locally. Bundling it normally instead
  // lets webpack transform the import correctly.
  serverExternalPackages: ['pdfkit'],
}

export default nextConfig
