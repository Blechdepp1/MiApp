import { INHALTE, type InhaltName } from '../belohnung/inhalte.ts';
import type { InhaltEintrag, InhalteSpeicher } from '../daten/inhalte.ts';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import type { Dropbox } from './dropbox.ts';
import { DATENFORMAT, istZuNeu } from './format.ts';

// Inhalte liegen als /inhalte/<name>.json. Nur Eltern-Geräte schreiben sie, alle lesen sie.
// Haben zwei Eltern-Geräte geändert, gewinnt der neueste Stand.
export const INHALT_ORDNER = '/inhalte';

export function inhaltDatei(name: InhaltName): string {
  return `${INHALT_ORDNER}/${name}.json`;
}

export type InhalteStand = {
  // Revision je Datei beim letzten Lesen
  revs: Record<string, string>;
  // Zeitstempel je Inhalt, der zuletzt hochgeladen oder übernommen wurde
  bekannt: Record<string, string>;
};

function istName(name: string): name is InhaltName {
  return Object.hasOwn(INHALTE, name);
}

// Prüft eine heruntergeladene Datei; ungültige Inhalte werden ignoriert
export function liesInhalt(name: InhaltName, text: string): InhaltEintrag | undefined {
  try {
    const wert = JSON.parse(text) as { geaendert?: unknown; daten?: unknown };
    if (typeof wert.geaendert !== 'string' || Number.isNaN(Date.parse(wert.geaendert))) return;
    if (INHALTE[name].pruefe(wert.daten) !== null) return;
    return { name, daten: wert.daten, geaendert: wert.geaendert } as InhaltEintrag;
  } catch {
    return undefined;
  }
}

export async function gleicheInhalteAb({
  dropbox,
  inhalte,
  darfSchreiben,
  stand,
}: {
  dropbox: Dropbox;
  inhalte: InhalteSpeicher;
  darfSchreiben: boolean;
  stand: GespeicherterWert<InhalteStand>;
}): Promise<{ uebernommen: number; hochgeladen: number }> {
  const bisher = (await stand.laden()) ?? { revs: {}, bekannt: {} };
  const revs = { ...bisher.revs };
  const bekannt = { ...bisher.bekannt };

  // 1. Neuere Inhalte aus Dropbox übernehmen
  let uebernommen = 0;
  // Von einer neueren App-Version geschrieben: nicht lesen und nicht überschreiben
  const gesperrt = new Set<string>();
  for (const datei of await dropbox.liste(INHALT_ORDNER)) {
    const name = datei.name.replace(/\.json$/, '');
    if (!istName(name) || revs[datei.pfad] === datei.rev) continue;
    const text = await dropbox.herunterladen(datei.pfad);
    if (text !== undefined && istZuNeu(text)) {
      gesperrt.add(name);
      continue;
    }
    revs[datei.pfad] = datei.rev;
    const fern = text === undefined ? undefined : liesInhalt(name, text);
    if (!fern) continue;
    const lokal = await inhalte.lade(name);
    // Lokal neuer (z. B. offline geändert): behalten und unten hochladen
    if (lokal && lokal.geaendert > fern.geaendert) continue;
    if (!lokal || fern.geaendert > lokal.geaendert) {
      await inhalte.speichere(fern);
      uebernommen++;
    }
    bekannt[name] = fern.geaendert;
  }

  // 2. Eigene Änderungen hochladen – nur auf Eltern-Geräten
  let hochgeladen = 0;
  if (darfSchreiben) {
    for (const eintrag of await inhalte.alle()) {
      if (bekannt[eintrag.name] === eintrag.geaendert || gesperrt.has(eintrag.name)) continue;
      await dropbox.hochladen(
        inhaltDatei(eintrag.name),
        JSON.stringify(
          { format: DATENFORMAT, geaendert: eintrag.geaendert, daten: eintrag.daten },
          null,
          2,
        ),
      );
      bekannt[eintrag.name] = eintrag.geaendert;
      hochgeladen++;
    }
  }

  await stand.speichern({ revs, bekannt });
  return { uebernommen, hochgeladen };
}
