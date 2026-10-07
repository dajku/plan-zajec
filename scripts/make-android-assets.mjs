// Renders public/icons/icon.svg into the Android launcher icons and splash
// images under android/app/src/main/res. Same approach as make-icons.mjs.
// Usage: CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/make-android-assets.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(root, 'android/app/src/main/res');
const svg = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');
const TEAL = '#0f766e';
const PAPER = '#f7f8f6';

const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const splashPort = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

// width x height canvas, icon of `iconSize` px centred, optional background and circle mask
async function render(file, { width, height, iconSize, bg, circle = false }) {
  await page.setViewportSize({ width, height });
  const left = Math.round((width - iconSize) / 2);
  const top = Math.round((height - iconSize) / 2);
  await page.setContent(
    `<body style="margin:0;width:${width}px;height:${height}px;overflow:hidden;background:transparent">
       <div style="position:absolute;inset:0;background:${bg ?? 'transparent'};${circle ? 'border-radius:50%;' : ''}"></div>
       <div style="position:absolute;left:${left}px;top:${top}px;width:${iconSize}px;height:${iconSize}px">${svg.replace(
         /width="512" height="512"/,
         `width="${iconSize}" height="${iconSize}"`,
       )}</div>
     </body>`,
  );
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } });
  writeFileSync(join(res, file), png);
}

for (const [d, k] of Object.entries(densities)) {
  const legacy = Math.round(48 * k);
  const fg = Math.round(108 * k);
  // Legacy icon: the rounded-square artwork as is.
  await render(`mipmap-${d}/ic_launcher.png`, { width: legacy, height: legacy, iconSize: legacy });
  // Round legacy icon: teal circle; the artwork's own teal square blends into it.
  await render(`mipmap-${d}/ic_launcher_round.png`, { width: legacy, height: legacy, iconSize: legacy, bg: TEAL, circle: true });
  // Adaptive foreground: launchers show only the middle ~66%, so the calendar has to sit well inside it.
  await render(`mipmap-${d}/ic_launcher_foreground.png`, { width: fg, height: fg, iconSize: Math.round(fg * 0.8), bg: TEAL });
  const [w, h] = splashPort[d];
  const icon = Math.round(Math.min(w, h) * 0.3);
  await render(`drawable-port-${d}/splash.png`, { width: w, height: h, iconSize: icon, bg: PAPER });
  await render(`drawable-land-${d}/splash.png`, { width: h, height: w, iconSize: icon, bg: PAPER });
  if (d === 'mdpi') await render('drawable/splash.png', { width: h, height: w, iconSize: icon, bg: PAPER });
}
await browser.close();
console.log('Android icons and splash written');
