import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import { pruefeLektion, type Lektion } from '../lektionen/lektion.ts';
import type { LektionenSpeicher } from '../lektionen/speicher.ts';
import type { Dropbox } from './dropbox.ts';
import { DATENFORMAT, istZuNeu, LESART } from './format.ts';

// Jede Lektion ist eine eigene Datei /inhalte/lektionen/<id>.json, damit zwei Eltern-Geräte
// sich beim Anlegen nicht überschreiben. Nur Eltern-Geräte schreiben; bei Änderungen an
// derselben Lektion gewinnt der neueste Stand. Gelöschte Lektionen bleiben als Markierung.
export const LEKTION_ORDNER = '/inhalte/lektionen';

export function lektionDatei(id: string): string {
  return `${LEKTION_ORDNER}/${id}.json`;
}

export type LektionenStand = {
  revs: Record<string, string>;
  // LESART beim letzten Abgleich; weicht sie ab, werden alle Dateien neu gelesen
  lesart?: number;
  // Stand je Lektion, der zuletzt hochgeladen oder übernommen wurde
  bekannt: Record<string, string>;
};

export function liesLektion(text: string): Lektion | undefined {
  try {
    const wert: unknown = JSON.parse(text);
    if (pruefeLektion(wert) !== null) return undefined;
    // Das Format gehört zur Datei, nicht zur Lektion
    const lektion = { ...(wert as Lektion & { format?: number }) };
    delete lektion.format;
    return lektion;
  } catch {
    return undefined;
  }
}

export async function gleicheLektionenAb({
  dropbox,
  lektionen,
  darfSchreiben,
  stand,
}: {
  dropbox: Dropbox;
  lektionen: LektionenSpeicher;
  darfSchreiben: boolean;
  stand: GespeicherterWert<LektionenStand>;
}): Promise<{ uebernommen: number; hochgeladen: number }> {
  const bisher = (await stand.laden()) ?? { revs: {}, bekannt: {} };
  const revs = bisher.lesart === LESART ? { ...bisher.revs } : {};
  const bekannt = { ...bisher.bekannt };

  let uebernommen = 0;
  // Von einer neueren App-Version geschrieben: nicht lesen und nicht überschreiben
  const gesperrt = new Set<string>();
  for (const datei of await dropbox.liste(LEKTION_ORDNER)) {
    if (!datei.name.endsWith('.json') || revs[datei.pfad] === datei.rev) continue;
    const text = await dropbox.herunterladen(datei.pfad);
    if (text !== undefined && istZuNeu(text)) {
      gesperrt.add(datei.pfad.toLowerCase());
      continue;
    }
    revs[datei.pfad] = datei.rev;
    const fern = text === undefined ? undefined : liesLektion(text);
    // Eine Datei darf nur „ihre“ Lektion enthalten
    if (!fern || lektionDatei(fern.id).toLowerCase() !== datei.pfad.toLowerCase()) continue;
    const lokal = await lektionen.lade(fern.id);
    if (lokal && lokal.geaendert > fern.geaendert) continue;
    if (!lokal || fern.geaendert > lokal.geaendert) {
      await lektionen.speichere(fern);
      uebernommen++;
    }
    bekannt[fern.id] = fern.geaendert;
  }

  let hochgeladen = 0;
  if (darfSchreiben) {
    for (const lektion of await lektionen.alle()) {
      if (bekannt[lektion.id] === lektion.geaendert) continue;
      if (gesperrt.has(lektionDatei(lektion.id).toLowerCase())) continue;
      await dropbox.hochladen(
        lektionDatei(lektion.id),
        JSON.stringify({ format: DATENFORMAT, ...lektion }, null, 2),
      );
      bekannt[lektion.id] = lektion.geaendert;
      hochgeladen++;
    }
  }

  await stand.speichern({ lesart: LESART, revs, bekannt });
  return { uebernommen, hochgeladen };
}
