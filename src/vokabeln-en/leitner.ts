import { tagVon } from '../belohnung/logik.ts';
import type { LernEreignis, Uebung } from '../daten/ereignisse.ts';
import { abstand, hauptform } from './bewertung.ts';
import type { Vokabelliste } from './typen.ts';

// Leitner-System mit 5 Fächern: richtig → ein Fach höher und länger Pause, falsch → zurück in Fach 1
export const FAECHER = 5;
const PAUSE_TAGE: Record<number, number> = { 1: 1, 2: 1, 3: 3, 4: 7, 5: 14 };
export const RUNDE_MAX = 10;
// Nicht zu viele neue Wörter auf einmal
export const NEU_PRO_RUNDE = 5;
// So oft muss ein Wort richtig erkannt werden, bevor es geschrieben wird
export const ERKENNEN_BIS_SCHREIBEN = 2;

export type WortStand = {
  // 0 = noch nie geübt
  fach: number;
  faelligAb: string;
  erkannt: number;
  // Tag des letzten noch nicht korrigierten Fehlers
  fehlerTag?: string;
  // Tag der letzten Abfrage (für die Auffrischung vor einer Klassenarbeit)
  zuletzt?: string;
};

export function schluessel(listeId: string, wortId: string): string {
  return `${listeId}/${wortId}`;
}

export function plusTage(tag: string, tage: number): string {
  const [j, m, t] = tag.split('-').map(Number);
  return tagVon(new Date(j!, m! - 1, t! + tage, 12).toISOString());
}

const NEU: WortStand = { fach: 0, faelligAb: '0000-00-00', erkannt: 0 };

export function wortStand(
  staende: ReadonlyMap<string, WortStand>,
  listeId: string,
  wortId: string,
): WortStand {
  return staende.get(schluessel(listeId, wortId)) ?? NEU;
}

// Ergebnis einer Antwort auf den Stand eines Wortes anwenden
export function naechsterStand(
  stand: WortStand,
  antwort: { richtig: boolean; uebung: Uebung; mitHilfe?: boolean },
  tag: string,
): { stand: WortStand; verbessert: boolean } {
  if (!antwort.richtig) {
    return {
      stand: { ...stand, fach: 1, faelligAb: plusTage(tag, 1), fehlerTag: tag, zuletzt: tag },
      verbessert: false,
    };
  }
  const erkannt = antwort.uebung === 'schreiben' ? stand.erkannt : stand.erkannt + 1;
  // Mit Hilfe geschafft: gut geübt, aber noch nicht aus dem Kopf gekonnt. Fach bleibt, morgen wieder.
  if (antwort.mitHilfe) {
    return {
      stand: {
        ...stand,
        fach: Math.max(stand.fach, 1),
        faelligAb: plusTage(tag, 1),
        erkannt,
        zuletzt: tag,
      },
      verbessert: false,
    };
  }
  // Noch nicht fällig (Extra-Runde, Auffrischung vor einer Arbeit oder Fehler von heute):
  // üben ja, hochstufen erst am Fälligkeitstag
  if (tag < stand.faelligAb) {
    return { stand: { ...stand, erkannt, zuletzt: tag }, verbessert: false };
  }
  const fach = Math.min(Math.max(stand.fach, 0) + 1, FAECHER);
  return {
    stand: { fach, faelligAb: plusTage(tag, PAUSE_TAGE[fach]!), erkannt, zuletzt: tag },
    verbessert: stand.fehlerTag !== undefined,
  };
}

export function berechneStaende(ereignisse: readonly LernEreignis[]): Map<string, WortStand> {
  const staende = new Map<string, WortStand>();
  for (const e of ereignisse) {
    if (e.typ !== 'antwort') continue;
    const k = schluessel(e.listeId, e.wortId);
    staende.set(k, naechsterStand(staende.get(k) ?? NEU, e, tagVon(e.zeit)).stand);
  }
  return staende;
}

// Welche Übung passt zum Wort: erst anhören und erkennen, dann Deutsch → Englisch wählen, dann schreiben
export function uebungFuer(stand: WortStand): Uebung {
  if (stand.erkannt >= ERKENNEN_BIS_SCHREIBEN) return 'schreiben';
  return stand.erkannt === 0 ? 'erkennen' : 'waehlen-de-en';
}

// Alles, was der Wiederholungsplan braucht: eine Liste mit id und Einträgen mit id. So nutzen ihn
// Englisch-Vokabeln (Vokabelliste) und Deutsch-Themen gleichermaßen.
export type LernListe = { id: string; woerter: readonly { id: string }[] };

export type RundenWort<L extends LernListe = Vokabelliste> = {
  liste: L;
  wort: L['woerter'][number];
  stand: WortStand;
};

// Listen mit Vorrang (z. B. Klassenarbeit steht an) kommen jeweils zuerst
function vorrangZuerst(vorrang: ReadonlySet<string>) {
  return (a: RundenWort<LernListe>, b: RundenWort<LernListe>) =>
    Number(vorrang.has(b.liste.id)) - Number(vorrang.has(a.liste.id));
}

// Vor einer Klassenarbeit (Vorrang) wird jedes schon geübte Wort der Lektion wieder abgefragt,
// wenn es mindestens so lange her ist – auch wenn es nach Leitner noch Pause hätte
export const AUFFRISCHEN_NACH_TAGEN = 2;

function istFaellig(
  w: RundenWort<LernListe>,
  heute: string,
  vorrang: ReadonlySet<string>,
): boolean {
  if (w.stand.fach === 0) return false;
  if (w.stand.faelligAb <= heute) return true;
  return (
    vorrang.has(w.liste.id) &&
    (w.stand.zuletzt ?? '0000-00-00') <= plusTage(heute, -AUFFRISCHEN_NACH_TAGEN)
  );
}

// Fällige Wörter zuerst (schwierigste zuerst), dann neue, insgesamt höchstens RUNDE_MAX
export function rundeAuswaehlen<L extends LernListe = Vokabelliste>(
  listen: readonly L[],
  staende: Map<string, WortStand>,
  heute: string,
  vorrang: ReadonlySet<string> = new Set(),
): RundenWort<L>[] {
  const zuerst = vorrangZuerst(vorrang);
  const alle: RundenWort<L>[] = listen.flatMap((liste) =>
    liste.woerter.map((wort) => ({ liste, wort, stand: wortStand(staende, liste.id, wort.id) })),
  );
  const faellig = alle
    .filter((w) => istFaellig(w, heute, vorrang))
    .sort(
      (a, b) =>
        zuerst(a, b) ||
        a.stand.fach - b.stand.fach ||
        a.stand.faelligAb.localeCompare(b.stand.faelligAb),
    );
  const neu = alle.filter((w) => w.stand.fach === 0).sort(zuerst);
  const platzFuerNeu = Math.min(NEU_PRO_RUNDE, RUNDE_MAX - Math.min(faellig.length, RUNDE_MAX));
  return [...faellig.slice(0, RUNDE_MAX), ...neueWoerter(neu, platzFuerNeu)];
}

// Neue Wörter nicht streng der Reihe nach, sondern über jede Liste verteilt (V13): Im Heft stehen
// ähnliche Wörter oft beieinander (Farben, Wochentage), und gleichzeitig neu werden sie leichter
// verwechselt. Wörter, die sich zum Verwechseln ähneln (quiet/quite), kommen nicht in dieselbe Runde,
// solange es genug andere gibt.
function neueWoerter<L extends LernListe>(neu: RundenWort<L>[], anzahl: number): RundenWort<L>[] {
  const verteilt: RundenWort<L>[] = [];
  for (const liste of new Set(neu.map((w) => w.liste))) {
    const eigene = neu.filter((w) => w.liste === liste);
    const schritt = Math.max(1, Math.ceil(eigene.length / NEU_PRO_RUNDE));
    for (let start = 0; start < schritt; start++) {
      for (let i = start; i < eigene.length; i += schritt) verteilt.push(eigene[i]!);
    }
  }
  const gewaehlt: RundenWort<L>[] = [];
  const zurueck: RundenWort<L>[] = [];
  for (const w of verteilt) {
    if (gewaehlt.length >= anzahl) break;
    if (gewaehlt.some((g) => verwechselbar(g.wort, w.wort))) zurueck.push(w);
    else gewaehlt.push(w);
  }
  return [...gewaehlt, ...zurueck].slice(0, anzahl);
}

// Nur für Vokabeln (Einträge mit englischem Wort); Formen desselben Verbs gehören zusammen
export function verwechselbar(a: object, b: object): boolean {
  if (!('en' in a && 'en' in b) || typeof a.en !== 'string' || typeof b.en !== 'string') {
    return false;
  }
  if ('gruppe' in a && 'gruppe' in b && a.gruppe !== undefined && a.gruppe === b.gruppe) {
    return false;
  }
  const x = hauptform(a.en).toLowerCase();
  const y = hauptform(b.en).toLowerCase();
  return abstand(x, y) <= (Math.min(x.length, y.length) >= 5 ? 2 : 1);
}

// Wenn heute nichts mehr fällig ist: freiwillige Extra-Runde mit bereits geübten Wörtern,
// unsichere zuerst, innerhalb eines Fachs zufällig, damit nicht immer dieselben kommen
export function extraRundeAuswaehlen<L extends LernListe = Vokabelliste>(
  listen: readonly L[],
  staende: Map<string, WortStand>,
  zufall: () => number = Math.random,
  vorrang: ReadonlySet<string> = new Set(),
): RundenWort<L>[] {
  const zuerst = vorrangZuerst(vorrang);
  const geuebt = listen
    .flatMap((liste): RundenWort<L>[] =>
      liste.woerter.map((wort) => ({ liste, wort, stand: wortStand(staende, liste.id, wort.id) })),
    )
    .filter((w) => w.stand.fach > 0)
    .map((w) => ({ w, los: zufall() }))
    .sort((a, b) => zuerst(a.w, b.w) || a.w.stand.fach - b.w.stand.fach || a.los - b.los)
    .map(({ w }) => w);
  return geuebt.slice(0, RUNDE_MAX);
}

// Selbst gewählte Lektion: erst was fällig ist und ein paar neue Wörter, dann mit schon geübten
// Wörtern derselben Lektion bis zu einer vollen Runde aufgefüllt (unsichere zuerst). Noch nicht
// fällige Wörter werden dabei nur geübt, nicht hochgestuft (siehe naechsterStand).
export function lektionsRundeAuswaehlen<L extends LernListe = Vokabelliste>(
  liste: L,
  staende: Map<string, WortStand>,
  heute: string,
  zufall: () => number = Math.random,
): RundenWort<L>[] {
  const zuerst = rundeAuswaehlen([liste], staende, heute);
  const dabei = new Set(zuerst.map((w) => w.wort.id));
  const auffuellen = extraRundeAuswaehlen([liste], staende, zufall).filter(
    (w) => !dabei.has(w.wort.id),
  );
  return [...zuerst, ...auffuellen].slice(0, RUNDE_MAX);
}
