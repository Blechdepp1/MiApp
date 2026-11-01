import { KANAL } from '../basis/kanal.ts';
import { erstelleDropbox } from './dropbox.ts';
import { dexieTokenSpeicher } from './tokenSpeicher.ts';

// Rücksprung-Adresse muss exakt in der Dropbox App Console eingetragen sein
export const REDIRECT_URI = new URL(import.meta.env.BASE_URL, window.location.origin).href;

export const dropbox = erstelleDropbox({
  speicher: dexieTokenSpeicher,
  redirectUri: REDIRECT_URI,
  ordner: KANAL.dropboxOrdner,
});

export function istRueckkehrVonDropbox(suche = window.location.search): boolean {
  const p = new URLSearchParams(suche);
  return p.has('code') || p.has('error');
}

// Testkanal: liest die Daten von Milenas App (App-Ordner ohne Unterordner), schreibt dort nie
export const dropboxLive: Pick<typeof dropbox, 'verbunden' | 'liste' | 'herunterladen'> =
  erstelleDropbox({ speicher: dexieTokenSpeicher, redirectUri: REDIRECT_URI });
