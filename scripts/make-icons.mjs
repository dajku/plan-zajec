// Renders public/icons/icon.svg to the PNG sizes the web manifest needs.
// Uses the Playwright Chromium that is already installed; no image library.
// Usage: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');

// Maskable icons keep everything inside the central 80% "safe zone".
const variants = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.1, bg: '#0f766e' },
];

// CHROMIUM_PATH lets CI or a container point at an already installed browser.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const v of variants) {
  const inner = Math.round(v.size * (1 - 2 * v.pad));
  const offset = Math.round(v.size * v.pad);
  await page.setViewportSize({ width: v.size, height: v.size });
  await page.setContent(
    `<body style="margin:0;background:${v.bg ?? 'transparent'}">
       <div style="position:absolute;left:${offset}px;top:${offset}px;width:${inner}px;height:${inner}px">${svg.replace(
         /width="512" height="512"/,
         `width="${inner}" height="${inner}"`,
       )}</div>
     </body>`,
  );
  const png = await page.screenshot({ omitBackground: !v.bg, clip: { x: 0, y: 0, width: v.size, height: v.size } });
  writeFileSync(join(root, 'public/icons', v.file), png);
  console.log('wrote', v.file);
}
await browser.close();
