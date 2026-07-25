/**
 * Generates every icon size the app needs (favicon, apple-touch-icon, PWA
 * manifest icons) from a single source image.
 *
 * Nutzung:
 *   node scripts/generate-icons.js public/app-icon-source.png
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('Usage: node scripts/generate-icons.js <path-to-source-png>');
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'public');

const targets = [
  { file: 'app-icon-32.png', size: 32 },
  { file: 'app-icon-180.png', size: 180 }, // apple-touch-icon
  { file: 'app-icon-192.png', size: 192 }, // PWA manifest
  { file: 'app-icon-512.png', size: 512 }, // PWA manifest / splash
];

async function run() {
  for (const t of targets) {
    await sharp(src)
      .resize(t.size, t.size, { fit: 'cover' })
      .png()
      .toFile(path.join(outDir, t.file));
    console.log(`✅ ${t.file} (${t.size}x${t.size})`);
  }

  // Maskable variant: Android adds a circular/rounded crop mask, so content
  // needs a safe zone — pad the icon onto a slightly larger canvas rather
  // than letting the mask clip the wrench/checkmark art.
  await sharp(src)
    .resize(410, 410, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(outDir, 'app-icon-512-maskable.png'));
  console.log('✅ app-icon-512-maskable.png (512x512, safe-zone padded)');
}

run().catch(err => { console.error(err); process.exit(1); });
