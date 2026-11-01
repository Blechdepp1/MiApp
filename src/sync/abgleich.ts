import type { LernEreignis } from '../daten/ereignisse.ts';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import type { Protokoll } from '../daten/protokoll.ts';
import type { Dropbox } from './dropbox.ts';

// Jedes Gerät schreibt nur seine eigene Datei; gelesen werden die Dateien aller Geräte.
// Dadurch gibt es keine Schreibkonflikte, und Doppeltes fällt über die Ereignis-id heraus.
export const EREIGNIS_ORDNER = '/ereignisse';

export function eigeneDatei(geraetId: string): string {
  return `${EREIGNIS_ORDNER}/${geraetId}.jsonl`;
}

// Was beim letzten Abgleich gesehen bzw. hochgeladen wurde, damit nichts unnötig übertragen wird
export type AbgleichStand = {
  // Revision je fremder Datei
  revs: Record<string, string>;
  // Anzahl der eigenen Ereignisse beim letzten Hochladen
  hochgeladen: number;
};

export type AbgleichErgebnis = { neu: number; hochgeladen: boolean };

export function zuJsonl(ereignisse: readonly LernEreignis[]): string {
  return ereignisse.map((e) => JSON.stringify(e)).join('\n') + (ereignisse.length ? '\n' : '');
}

const TYPEN = new Set(['antwort', 'runde-beendet', 'eingeloest', 'bestaetigt']);

function istEreignis(wert: unknown): wert is LernEreignis {
  if (typeof wert !== 'object' || wert === null) return false;
  const e = wert as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.geraet === 'string' &&
    typeof e.zeit === 'string' &&
    !Number.isNaN(Date.parse(e.zeit)) &&
    typeof e.typ === 'string' &&
    TYPEN.has(e.typ)
  );
}

// Kaputte oder unbekannte Zeilen werden übersprungen statt den ganzen Abgleich zu stoppen
export function ausJsonl(text: string): LernEreignis[] {
  const ereignisse: LernEreignis[] = [];
  for (const zeile of text.split('\n')) {
    if (!zeile.trim()) continue;
    try {
      const wert: unknown = JSON.parse(zeile);
      if (istEreignis(wert)) ereignisse.push(wert);
    } catch {
      // Zeile überspringen
    }
  }
  return ereignisse;
}

export async function gleicheAb({
  dropbox,
  protokoll,
  stand,
}: {
  dropbox: Dropbox;
  protokoll: Protokoll;
  stand: GespeicherterWert<AbgleichStand>;
}): Promise<AbgleichErgebnis> {
  const geraetId = await protokoll.geraetId();
  const meinPfad = eigeneDatei(geraetId).toLowerCase();
  const bisher = (await stand.laden()) ?? { revs: {}, hochgeladen: -1 };
  const revs = { ...bisher.revs };

  // 1. Neue Ereignisse der anderen Geräte holen
  let neu = 0;
  const dateien = await dropbox.liste(EREIGNIS_ORDNER);
  const meineDateiFehlt = !dateien.some((d) => d.pfad.toLowerCase() === meinPfad);
  for (const datei of dateien) {
    if (datei.pfad.toLowerCase() === meinPfad || revs[datei.pfad] === datei.rev) continue;
    const text = await dropbox.herunterladen(datei.pfad);
    if (text !== undefined) neu += await protokoll.importiere(ausJsonl(text));
    revs[datei.pfad] = datei.rev;
  }

  // 2. Eigene Ereignisse hochladen, wenn welche dazugekommen sind oder die Datei fehlt
  const eigene = (await protokoll.alle()).filter((e) => e.geraet === geraetId);
  const hochladen = eigene.length !== bisher.hochgeladen || (meineDateiFehlt && eigene.length > 0);
  if (hochladen) await dropbox.hochladen(eigeneDatei(geraetId), zuJsonl(eigene));

  await stand.speichern({ revs, hochgeladen: hochladen ? eigene.length : bisher.hochgeladen });
  return { neu, hochgeladen: hochladen };
}
