import type { LernEreignis } from '../daten/ereignisse.ts';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import type { Protokoll } from '../daten/protokoll.ts';
import type { Dropbox } from './dropbox.ts';
import { DATENFORMAT, istZuNeu, LESART } from './format.ts';

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
  // LESART beim letzten Abgleich; weicht sie ab, werden alle Dateien neu gelesen
  lesart?: number;
  // Anzahl der eigenen Ereignisse beim letzten Hochladen
  hochgeladen: number;
};

export type AbgleichErgebnis = { neu: number; hochgeladen: boolean };

// Erste Zeile nennt das Datenformat, danach ein Ereignis pro Zeile
export function zuJsonl(ereignisse: readonly LernEreignis[]): string {
  return [{ format: DATENFORMAT }, ...ereignisse].map((e) => JSON.stringify(e)).join('\n') + '\n';
}

// Grenzen für Werte aus Dropbox: Eine kaputte oder manipulierte Datei soll keine absurden
// Punkte erzeugen, denn Ereignisse bleiben für immer im Protokoll aller Geräte
const MAX_ZAHL = 1000;
// Rund 20 000 Runden pro Gerät; mehr ist kein echtes Protokoll
export const MAX_DATEI = 20_000_000;
const MAX_ID = 100;
const MAX_TEXT = 2000;

const istText = (w: unknown, max = MAX_ID): w is string =>
  typeof w === 'string' && w.length > 0 && w.length <= max;
const istOptionalText = (w: unknown, max = MAX_TEXT) =>
  w === undefined || (typeof w === 'string' && w.length <= max);
const istZahl = (w: unknown, min = 0, max = MAX_ZAHL): w is number =>
  typeof w === 'number' && Number.isFinite(w) && w >= min && w <= max;
const istTag = (w: unknown) => typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w);
const einsVon = (w: unknown, werte: readonly string[]) =>
  typeof w === 'string' && werte.includes(w);

// Prüft die Felder je Ereignis-Art; unbekannte Arten (neuere App-Version) werden übersprungen
const PRUEFUNGEN: Record<string, (e: Record<string, unknown>) => boolean> = {
  antwort: (e) =>
    istText(e.listeId) &&
    istText(e.wortId) &&
    einsVon(e.uebung, ['erkennen', 'waehlen-de-en', 'schreiben']) &&
    typeof e.richtig === 'boolean',
  'runde-beendet': (e) =>
    istZahl(e.richtig, 0, 100) && istZahl(e.mitHilfe, 0, 100) && istZahl(e.verbessert, 0, 100),
  eingeloest: (e) =>
    istText(e.belohnungId) &&
    istZahl(e.preis, 1, 1_000_000) &&
    istOptionalText(e.name, 200) &&
    istOptionalText(e.symbol, 20),
  bestaetigt: (e) => istText(e.einloesungId),
  feedback: (e) =>
    einsVon(e.art, ['rueckmeldung', 'fehler']) &&
    (e.stimmung === undefined || einsVon(e.stimmung, ['gut', 'mittel', 'schlecht'])) &&
    istOptionalText(e.text) &&
    istText(e.seite) &&
    istText(e.version) &&
    istOptionalText(e.geraetInfo, 200) &&
    (e.rolle === undefined || einsVon(e.rolle, ['kind', 'eltern'])),
  'feedback-erledigt': (e) => istText(e.feedbackId),
  'test-eingetragen': (e) =>
    einsVon(e.fach, ['englisch', 'deutsch', 'mathe', 'andere']) &&
    einsVon(e.art, ['klassenarbeit', 'test', 'vokabeltest']) &&
    istTag(e.datum) &&
    istOptionalText(e.thema, 200) &&
    (e.lektionId === undefined || istText(e.lektionId)),
  'test-ergebnis': (e) => istText(e.testId) && istZahl(e.note, 1, 6) && Number.isInteger(e.note),
  'test-bestaetigt': (e) =>
    istText(e.testId) &&
    (e.note === undefined || (istZahl(e.note, 1, 6) && Number.isInteger(e.note))),
  'test-geloescht': (e) => istText(e.testId),
};

function istEreignis(wert: unknown): wert is LernEreignis {
  if (typeof wert !== 'object' || wert === null) return false;
  const e = wert as Record<string, unknown>;
  const pruefe = typeof e.typ === 'string' ? PRUEFUNGEN[e.typ] : undefined;
  return (
    istText(e.id) &&
    istText(e.geraet) &&
    typeof e.zeit === 'string' &&
    !Number.isNaN(Date.parse(e.zeit)) &&
    pruefe !== undefined &&
    pruefe(e)
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
  const revs = bisher.lesart === LESART ? { ...bisher.revs } : {};

  // 1. Neue Ereignisse der anderen Geräte holen
  let neu = 0;
  const dateien = await dropbox.liste(EREIGNIS_ORDNER);
  const meineDateiFehlt = !dateien.some((d) => d.pfad.toLowerCase() === meinPfad);
  for (const datei of dateien) {
    if (datei.pfad.toLowerCase() === meinPfad || revs[datei.pfad] === datei.rev) continue;
    const text = await dropbox.herunterladen(datei.pfad);
    // Ungewöhnlich große Dateien nicht verarbeiten (kaputt oder manipuliert)
    if (text !== undefined && text.length > MAX_DATEI) {
      revs[datei.pfad] = datei.rev;
      continue;
    }
    // Von einer neueren App-Version: später noch einmal lesen, wenn dieses Gerät aktuell ist
    if (text !== undefined && istZuNeu(text)) continue;
    if (text !== undefined) neu += await protokoll.importiere(ausJsonl(text));
    revs[datei.pfad] = datei.rev;
  }

  // 2. Eigene Ereignisse hochladen, wenn welche dazugekommen sind oder die Datei fehlt
  const eigene = (await protokoll.alle()).filter((e) => e.geraet === geraetId);
  const hochladen = eigene.length !== bisher.hochgeladen || (meineDateiFehlt && eigene.length > 0);
  if (hochladen) await dropbox.hochladen(eigeneDatei(geraetId), zuJsonl(eigene));

  await stand.speichern({
    lesart: LESART,
    revs,
    hochgeladen: hochladen ? eigene.length : bisher.hochgeladen,
  });
  return { neu, hochgeladen: hochladen };
}
