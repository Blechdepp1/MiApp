import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Alle CSS-Dateien gelten in der ganzen App. Derselbe Klassenname in zwei Dateien hat schon
// einmal die Startseite verschoben (Level-Balken). Deshalb: jede Klasse gehört einer Datei.
// Ausnahmen nur, wenn eine Datei eine Klasse einer anderen bewusst ergänzt.
const ERLAUBT = new Set(['lerninhalte-eintrag']);

function cssDateien(ordner: string): string[] {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? cssDateien(join(ordner, e.name))
      : e.name.endsWith('.css')
        ? [join(ordner, e.name)]
        : [],
  );
}

it('jeder CSS-Klassenname ist nur in einer Datei definiert', () => {
  const dateienJeKlasse = new Map<string, Set<string>>();
  for (const datei of cssDateien('src')) {
    const text = readFileSync(datei, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selektoren] of text.matchAll(/([^{}]+)\{/g)) {
      for (const teil of selektoren!.split(',')) {
        const klasse = /^\s*\.([\w-]+)/.exec(teil)?.[1];
        if (!klasse) continue;
        if (!dateienJeKlasse.has(klasse)) dateienJeKlasse.set(klasse, new Set());
        dateienJeKlasse.get(klasse)!.add(datei);
      }
    }
  }
  const doppelt = [...dateienJeKlasse]
    .filter(([klasse, dateien]) => dateien.size > 1 && !ERLAUBT.has(klasse))
    .map(([klasse, dateien]) => `${klasse}: ${[...dateien].join(', ')}`);
  expect(doppelt).toEqual([]);
});
