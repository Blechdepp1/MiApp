import changelog from '../../CHANGELOG.md?raw';
import { IST_VORSCHAU } from './kanal.ts';

export const VERSION = __APP_VERSION__;

// „0.9.0“ in der Live-App, „0.9.0 · Vorschau a1b2c3d“ im Testkanal
export const VERSION_TEXT = IST_VORSCHAU
  ? `${VERSION} · Vorschau ${__APP_COMMIT__}`.trim()
  : VERSION;

// Stichpunkte des Abschnitts „## <version> …“ aus dem CHANGELOG
export function wasIstNeu(text: string, version: string): string[] {
  const zeilen = text.split(/\r?\n/);
  const start = zeilen.findIndex((z) => z.startsWith(`## ${version} `) || z === `## ${version}`);
  if (start < 0) return [];
  const punkte: string[] = [];
  for (const zeile of zeilen.slice(start + 1)) {
    if (zeile.startsWith('## ')) break;
    if (zeile.startsWith('- ')) punkte.push(zeile.slice(2).trim());
  }
  return punkte;
}

export const NEU = wasIstNeu(changelog, VERSION);
