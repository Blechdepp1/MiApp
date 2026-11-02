/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages liefert die App unter /MiApp/ aus, den Testkanal unter /MiApp/vorschau/
const VORSCHAU = process.env.MIAPP_KANAL === 'vorschau';
// Der Testkanal liegt bewusst nicht unter /MiApp/: Android ordnet sonst jede Seite darunter der
// installierten Live-App zu, und die Vorschau ließe sich nicht als eigene App installieren
const BASIS = VORSCHAU ? '/MiApp-Vorschau/' : '/MiApp/';
const ICON_ENDUNG = VORSCHAU ? '-vorschau' : '';
const VERSION = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;

function commit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// Content Security Policy für die fertige App (GitHub Pages kann keine Header setzen, also als
// <meta>). Erlaubt nur eigene Skripte und Verbindungen zu Dropbox und Anthropic. Nicht im
// Entwicklungsserver, der Inline-Skripte braucht.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self' https://api.dropboxapi.com https://content.dropboxapi.com https://notify.dropboxapi.com https://api.anthropic.com",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function sicherheitsRegeln(): Plugin {
  return {
    name: 'miapp-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  base: BASIS,
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
    __APP_COMMIT__: JSON.stringify(commit()),
  },
  // Vite-Zwischenspeicher außerhalb von Dropbox, sonst sperrt die Synchronisierung Dateien (EBUSY)
  cacheDir: join(tmpdir(), 'miapp-vite'),
  optimizeDeps: { include: ['dexie'] },
  server: {
    watch: { ignored: ['**/coverage/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  plugins: [
    react(),
    sicherheitsRegeln(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        // Eigene id: Testkanal und Live-App lassen sich nebeneinander installieren. Die Vorschau
        // hat eine neue id bekommen, weil Chrome am Eltern-Handy eine hängende Installation unter
        // der alten id festhielt („bereits installiert“, ließ sich aber nicht öffnen).
        id: VORSCHAU ? `${BASIS}app` : BASIS,
        name: VORSCHAU ? 'MiApp Vorschau (Eltern)' : 'MiApp – Lernen',
        short_name: VORSCHAU ? 'MiApp Test' : 'MiApp',
        description: 'Lern-App mit Vorlesen, Vokabeln und Belohnungen',
        lang: 'de',
        start_url: BASIS,
        scope: BASIS,
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#FBF6EC',
        theme_color: VORSCHAU ? '#B4572E' : '#2E7D6B',
        // Testkanal mit gelbem Symbol, damit man ihn auf dem Startbildschirm unterscheidet
        icons: [
          { src: `pwa-192${ICON_ENDUNG}.png`, sizes: '192x192', type: 'image/png' },
          { src: `pwa-512${ICON_ENDUNG}.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `pwa-512${ICON_ENDUNG}.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Die Live-App darf Seitenaufrufe des Testkanals nicht mit ihrer eigenen Seite beantworten
        ...(!VORSCHAU && { navigateFallbackDenylist: [/^\/MiApp\/vorschau\//] }),
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/testSetup.ts', 'src/**/*.d.ts'],
      // Untergrenzen: insgesamt und strenger für die Fachlogik (SPEC 10: mindestens 90 %)
      thresholds: {
        lines: 90,
        statements: 88,
        branches: 85,
        functions: 85,
        'src/{belohnung,daten,lektionen,vokabeln-en,sync}/*.ts': { lines: 90, branches: 85 },
      },
    },
  },
});
