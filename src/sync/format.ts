// Version des Datenformats der Dateien in Dropbox. Sie steigt nur, wenn sich der Aufbau so
// ändert, dass ältere App-Versionen die Dateien nicht mehr richtig verstehen würden.
export const DATENFORMAT = 1;

// Ältere Dateien ohne Feld zählen als Format 1
function formatVon(wert: unknown): number {
  if (typeof wert !== 'object' || wert === null) return 1;
  const format = (wert as { format?: unknown }).format;
  return typeof format === 'number' ? format : 1;
}

// true, wenn eine neuere App-Version die Datei geschrieben hat. Dann wird sie weder gelesen
// noch überschrieben, bis dieses Gerät die neue Version hat. Bei JSONL zählt die erste Zeile.
export function istZuNeu(text: string, format = DATENFORMAT): boolean {
  for (const kandidat of [text, text.split('\n', 1)[0] ?? '']) {
    try {
      return formatVon(JSON.parse(kandidat)) > format;
    } catch {
      // nächsten Kandidaten versuchen
    }
  }
  return false;
}

// Was diese App-Version aus den Dateien lesen kann (Ereignis-Arten, Felder). Steigt sie,
// liest der Abgleich einmal alle Dateien neu – auch solche, die eine ältere Version beim
// Lesen übersprungen hat, weil sie Teile davon noch nicht kannte.
export const LESART = 2;
