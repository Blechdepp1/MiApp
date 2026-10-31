// Erzeugt die PNG-Icons aus public/icon.svg: node scripts/icons.mjs
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const groessen = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
];

const browser = await chromium.launch();
for (const [datei, px] of groessen) {
  const page = await browser.newPage({ viewport: { width: px, height: px } });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${px}px;height:${px}px}</style>${svg}`,
  );
  await page.screenshot({ path: `public/${datei}` });
  await page.close();
}
await browser.close();
