import { rundenMitDauer } from '../belohnung/lernzeit.ts';
import { tagVon } from '../belohnung/logik.ts';
import type { LernEreignis } from '../daten/ereignisse.ts';
import { berechneStaende, plusTage, wortStand, type WortStand } from '../vokabeln-en/leitner.ts';
import type { Vokabel, Vokabelliste } from '../vokabeln-en/typen.ts';

// Auswertungen für die Eltern (Aufgabe 18b), alles aus dem Ereignis-Protokoll berechnet

// Ab diesem Leitner-Fach gilt ein Wort als „sicher“
export const SICHER_AB_FACH = 3;

export type Lernstand = 'neu' | 'lernt' | 'sicher';

export function lernstand(stand: WortStand): Lernstand {
  if (stand.fach === 0) return 'neu';
  return stand.fach >= SICHER_AB_FACH ? 'sicher' : 'lernt';
}

export type Fortschritt = { neu: number; lernt: number; sicher: number; gesamt: number };

export function fortschritt(
  liste: Vokabelliste,
  staende: ReadonlyMap<string, WortStand>,
): Fortschritt {
  const ergebnis: Fortschritt = { neu: 0, lernt: 0, sicher: 0, gesamt: liste.woerter.length };
  for (const w of liste.woerter) ergebnis[lernstand(wortStand(staende, liste.id, w.id))]++;
  return ergebnis;
}

export type WortDetail = {
  wort: Vokabel;
  stand: Lernstand;
  fach: number;
  zuletzt?: string;
  falsch: number;
};

// Pro Wort: Lernstand, wann zuletzt geübt und wie oft falsch
export function wortDetails(
  liste: Vokabelliste,
  ereignisse: readonly LernEreignis[],
  staende: ReadonlyMap<string, WortStand> = berechneStaende(ereignisse),
): WortDetail[] {
  const zuletzt = new Map<string, string>();
  const falsch = new Map<string, number>();
  for (const e of ereignisse) {
    if (e.typ !== 'antwort' || e.listeId !== liste.id) continue;
    if (e.zeit > (zuletzt.get(e.wortId) ?? '')) zuletzt.set(e.wortId, e.zeit);
    if (!e.richtig) falsch.set(e.wortId, (falsch.get(e.wortId) ?? 0) + 1);
  }
  return liste.woerter.map((wort) => {
    const stand = wortStand(staende, liste.id, wort.id);
    const z = zuletzt.get(wort.id);
    return {
      wort,
      stand: lernstand(stand),
      fach: stand.fach,
      ...(z && { zuletzt: z }),
      falsch: falsch.get(wort.id) ?? 0,
    };
  });
}

// Wann wurde zuletzt etwas aus dieser Liste geübt?
export function zuletztGeuebt(
  listeId: string,
  ereignisse: readonly LernEreignis[],
): string | undefined {
  let zuletzt: string | undefined;
  for (const e of ereignisse) {
    if (e.typ === 'antwort' && e.listeId === listeId && e.zeit > (zuletzt ?? '')) zuletzt = e.zeit;
  }
  return zuletzt;
}

export type SchwierigesWort = { liste: Vokabelliste; wort: Vokabel; falsch: number };

// Wörter mit den meisten Fehlern in den letzten Tagen (ohne Wörter, die es nicht mehr gibt)
export function schwierigeWoerter(
  listen: readonly Vokabelliste[],
  ereignisse: readonly LernEreignis[],
  heute: string,
  { tage = 14, anzahl = 10 } = {},
): SchwierigesWort[] {
  const ab = plusTage(heute, -(tage - 1));
  const zaehler = new Map<string, number>();
  for (const e of ereignisse) {
    if (e.typ !== 'antwort' || e.richtig || tagVon(e.zeit) < ab) continue;
    const k = `${e.listeId}/${e.wortId}`;
    zaehler.set(k, (zaehler.get(k) ?? 0) + 1);
  }
  const ergebnis: SchwierigesWort[] = [];
  for (const liste of listen) {
    for (const wort of liste.woerter) {
      const falsch = zaehler.get(`${liste.id}/${wort.id}`);
      if (falsch) ergebnis.push({ liste, wort, falsch });
    }
  }
  return ergebnis.sort((a, b) => b.falsch - a.falsch).slice(0, anzahl);
}

export type Woche = {
  // Die letzten 7 Tage bis heute, ältester zuerst
  tage: { tag: string; runden: number }[];
  lerntage: number;
  runden: number;
  minuten: number;
  // Wörter, die in dieser Zeit „sicher“ geworden sind
  neuSicher: number;
};

export function wochenUebersicht(
  ereignisse: readonly LernEreignis[],
  heute: string,
  listen: readonly Vokabelliste[] = [],
): Woche {
  const ab = plusTage(heute, -6);
  const tage = Array.from({ length: 7 }, (_, i) => ({ tag: plusTage(ab, i), runden: 0 }));
  for (const e of ereignisse) {
    if (e.typ !== 'runde-beendet') continue;
    const tag = tage.find((t) => t.tag === tagVon(e.zeit));
    if (tag) tag.runden++;
  }
  const minuten = Math.round(
    rundenMitDauer(ereignisse)
      .filter((r) => tagVon(r.ende) >= ab && tagVon(r.ende) <= heute)
      .reduce((s, r) => s + r.dauerMs, 0) / 60_000,
  );

  // Lernstand vor Beginn der Woche und jetzt vergleichen
  const vorher = berechneStaende(ereignisse.filter((e) => tagVon(e.zeit) < ab));
  const jetzt = berechneStaende(ereignisse);
  let neuSicher = 0;
  for (const liste of listen) {
    for (const w of liste.woerter) {
      if (
        lernstand(wortStand(jetzt, liste.id, w.id)) === 'sicher' &&
        lernstand(wortStand(vorher, liste.id, w.id)) !== 'sicher'
      ) {
        neuSicher++;
      }
    }
  }

  return {
    tage,
    lerntage: tage.filter((t) => t.runden > 0).length,
    runden: tage.reduce((s, t) => s + t.runden, 0),
    minuten,
    neuSicher,
  };
}

// „heute“, „gestern“, „vor 3 Tagen“ oder ein Datum
export function wannText(
  iso: string | undefined,
  heute = tagVon(new Date().toISOString()),
): string {
  if (!iso) return 'noch nie';
  const tag = tagVon(iso);
  const tage = Math.round((Date.parse(heute) - Date.parse(tag)) / 86_400_000);
  if (tage <= 0) return 'heute';
  if (tage === 1) return 'gestern';
  if (tage < 7) return `vor ${tage} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}
