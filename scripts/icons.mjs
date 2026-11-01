// Erzeugt die PNG-Icons aus public/icon.svg: node scripts/icons.mjs
// Dazu gelbe Icons für den Testkanal, damit er auf dem Startbildschirm ohne Schriftzug erkennbar ist.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const vorschauSvg = svg
  .replace(
    '<rect width="512" height="512" fill="#2E7D6B"/>',
    '<rect width="512" height="512" fill="#F2B544"/>',
  )
  .replaceAll('stroke="#2E7D6B"', 'stroke="#2B2B2B"')
  .replace('fill="#F2B544"/>\n</svg>', 'fill="#B4572E"/>\n</svg>');

const icons = [
  [svg, 'pwa-192.png', 192],
  [svg, 'pwa-512.png', 512],
  [svg, 'apple-touch-icon.png', 180],
  [vorschauSvg, 'pwa-192-vorschau.png', 192],
  [vorschauSvg, 'pwa-512-vorschau.png', 512],
];

const browser = await chromium.launch();
for (const [quelle, datei, px] of icons) {
  const page = await browser.newPage({ viewport: { width: px, height: px } });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${px}px;height:${px}px}</style>${quelle}`,
  );
  await page.screenshot({ path: `public/${datei}` });
  await page.close();
}
await browser.close();
