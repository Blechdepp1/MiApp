import type { Belohnung } from '../belohnung/inhalte.ts';
import { inhalteImArbeitsspeicher, type InhaltEintrag } from '../daten/inhalte.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { dropboxAttrappe, verbundenesDropbox, type DropboxAttrappe } from './dropboxAttrappe.ts';
import { gleicheInhalteAb, inhaltDatei, liesInhalt, type InhalteStand } from './inhalteAbgleich.ts';

const KINO: Belohnung = { id: 'kino', symbol: '🎬', name: 'Kino', preis: 1300 };
const EIS: Belohnung = { id: 'eis', symbol: '🍦', name: 'Eis essen', preis: 300 };

function belohnungen(liste: Belohnung[], geaendert: string): InhaltEintrag {
  return { name: 'belohnungen', daten: liste, geaendert };
}

async function geraet(
  rolle: 'kind' | 'eltern',
  seite: DropboxAttrappe,
  start: InhaltEintrag[] = [],
) {
  const inhalte = inhalteImArbeitsspeicher(start);
  const stand = wertImArbeitsspeicher<InhalteStand>();
  const dropbox = await verbundenesDropbox(seite);
  return {
    inhalte,
    abgleichen: () =>
      gleicheInhalteAb({ dropbox, inhalte, darfSchreiben: rolle === 'eltern', stand }),
  };
}

describe('gleicheInhalteAb', () => {
  it('Eltern laden geänderte Belohnungen hoch, das Kind übernimmt sie', async () => {
    const seite = dropboxAttrappe();
    const eltern = await geraet('eltern', seite, [belohnungen([KINO], '2026-11-01T10:00:00Z')]);
    const kind = await geraet('kind', seite);

    expect(await eltern.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 1 });
    expect(await kind.abgleichen()).toEqual({ uebernommen: 1, hochgeladen: 0 });
    expect((await kind.inhalte.lade('belohnungen'))?.daten).toEqual([KINO]);
  });

  it('das Kind-Gerät schreibt nie nach /inhalte, auch mit eigenen Daten', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind', seite, [belohnungen([EIS], '2026-11-01T10:00:00Z')]);
    await kind.abgleichen();
    expect([...seite.dateien.keys()].some((p) => p.startsWith('/inhalte'))).toBe(false);
    expect(seite.aufrufe.some((a) => a.url.endsWith('/files/upload'))).toBe(false);
  });

  it('übernimmt nur neuere Stände; offline Geändertes wird später hochgeladen', async () => {
    const seite = dropboxAttrappe();
    const papa = await geraet('eltern', seite, [belohnungen([KINO], '2026-11-01T10:00:00Z')]);
    await papa.abgleichen();

    // Mama hat offline später etwas geändert
    const mama = await geraet('eltern', seite, [belohnungen([EIS], '2026-11-01T11:00:00Z')]);
    expect(await mama.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 1 });

    expect((await papa.abgleichen()).uebernommen).toBe(1);
    expect((await papa.inhalte.lade('belohnungen'))?.daten).toEqual([EIS]);
  });

  it('überträgt nichts, wenn sich nichts geändert hat', async () => {
    const seite = dropboxAttrappe();
    const eltern = await geraet('eltern', seite, [belohnungen([KINO], '2026-11-01T10:00:00Z')]);
    await eltern.abgleichen();
    expect(await eltern.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 0 });
  });

  it('ignoriert ungültige oder unbekannte Dateien', async () => {
    const seite = dropboxAttrappe();
    const papa = await geraet('eltern', seite);
    const dropbox = await verbundenesDropbox(seite);
    await dropbox.hochladen(
      inhaltDatei('belohnungen'),
      '{"geaendert":"2026-11-01","daten":[{"id":1}]}',
    );
    await dropbox.hochladen('/inhalte/unbekannt.json', '{}');
    await dropbox.hochladen(inhaltDatei('level'), 'kein json');
    expect(await papa.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 0 });
    expect(await papa.inhalte.alle()).toEqual([]);
  });
});

describe('liesInhalt', () => {
  it('liest gültige Level-Tabellen', () => {
    const text = JSON.stringify({
      geaendert: '2026-11-01T10:00:00Z',
      daten: [{ ab: 0, titel: 'Start' }],
    });
    expect(liesInhalt('level', text)?.daten).toEqual([{ ab: 0, titel: 'Start' }]);
  });

  it('lehnt fehlende Zeitstempel ab', () => {
    expect(liesInhalt('level', JSON.stringify({ daten: [{ ab: 0, titel: 'A' }] }))).toBeUndefined();
  });
});
