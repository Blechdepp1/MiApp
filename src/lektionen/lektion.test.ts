import { erstelleEreignis } from '../daten/ereignisse.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import {
  dropboxAttrappe,
  verbundenesDropbox,
  type DropboxAttrappe,
} from '../sync/dropboxAttrappe.ts';
import {
  gleicheLektionenAb,
  lektionDatei,
  liesLektion,
  type LektionenStand,
} from '../sync/lektionenAbgleich.ts';
import { berechneStaende, rundeAuswaehlen, extraRundeAuswaehlen } from '../vokabeln-en/leitner.ts';
import { vokabelQuellen } from '../vokabeln-en/quellen.ts';
import {
  hatVorrang,
  pruefeLektion,
  sortiereLektionen,
  statusVon,
  verschiebe,
  type Lektion,
} from './lektion.ts';
import { lektionenImArbeitsspeicher } from './speicher.ts';

function lektion(id: string, ueber: Partial<Lektion> = {}): Lektion {
  return {
    id,
    fach: 'englisch',
    titel: `Unit ${id}`,
    erstellt: '2026-11-01T10:00:00Z',
    geaendert: '2026-11-01T10:00:00Z',
    inhalt: {
      art: 'vokabeln',
      woerter: [
        { id: `${id}-1`, en: `word${id}a`, de: `Wort${id}a` },
        { id: `${id}-2`, en: `word${id}b`, de: `Wort${id}b` },
      ],
    },
    ...ueber,
  };
}

describe('pruefeLektion', () => {
  it('akzeptiert eine gültige Englisch-Lektion', () => {
    expect(pruefeLektion(lektion('a'))).toBeNull();
    expect(pruefeLektion(lektion('a', { klassenarbeit: '2026-11-12' }))).toBeNull();
  });

  it.each([
    [{ titel: ' ' }, 'Titel'],
    [{ titel: 'x'.repeat(61) }, 'höchstens'],
    [{ klassenarbeit: 'nächste Woche' }, 'Datum'],
    [{ inhalt: { art: 'vokabeln', woerter: [] } }, 'mindestens ein Wort'],
    [{ inhalt: { art: 'vokabeln', woerter: [{ id: 'x', en: 'dog', de: ' ' }] } }, 'Wort 1'],
    [{ erstellt: 'gestern' }, 'Ungültige Daten'],
  ])('lehnt %o ab', (aenderung, teil) => {
    expect(pruefeLektion(lektion('a', aenderung as Partial<Lektion>))).toContain(teil);
  });

  it('behält unbekannte Fächer und Inhaltsarten (neuere App-Version)', () => {
    const mathe = lektion('m', { fach: 'mathe', inhalt: { art: 'aufgaben' } });
    expect(pruefeLektion(mathe)).toBeNull();
  });

  it('akzeptiert Lösch-Markierungen ohne Inhalt', () => {
    expect(
      pruefeLektion({
        id: 'a',
        fach: 'englisch',
        erstellt: '2026-11-01',
        geaendert: '2026-11-02',
        geloescht: true,
      }),
    ).toBeNull();
  });
});

describe('Status und Reihenfolge', () => {
  it('prüft Status und Reihenfolge', () => {
    expect(pruefeLektion(lektion('a', { status: 'pausiert', reihenfolge: 2 }))).toBeNull();
    expect(pruefeLektion({ ...lektion('a'), status: 5 })).toBe('Ungültige Daten');
    // Status einer neueren App-Version: behalten, aber nicht üben
    const neu = { ...lektion('a'), status: 'wiederholen' } as unknown as Lektion;
    expect(pruefeLektion(neu)).toBeNull();
    expect(statusVon(neu)).toBe('pausiert');
    expect(pruefeLektion(lektion('a', { reihenfolge: Number.NaN }))).toBe('Ungültige Daten');
  });

  it('sortiert nach Reihenfolge, ohne Angabe nach Erstellung', () => {
    const liste = [
      lektion('c', { erstellt: '2026-11-03T10:00:00Z' }),
      lektion('b', { reihenfolge: 1 }),
      lektion('a', { reihenfolge: 0 }),
      lektion('d', { erstellt: '2026-11-02T10:00:00Z' }),
    ];
    expect(sortiereLektionen(liste).map((l) => l.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('verschiebt eine Lektion und nummeriert die Gruppe neu', () => {
    const gruppe = [
      lektion('a', { reihenfolge: 0 }),
      lektion('b', { reihenfolge: 1 }),
      lektion('c'),
    ];
    const geaendert = verschiebe(gruppe, 'c', -1);
    expect(geaendert.map((l) => [l.id, l.reihenfolge])).toEqual([
      ['c', 1],
      ['b', 2],
    ]);
    expect(verschiebe(gruppe, 'a', -1)).toEqual([]);
    expect(verschiebe(gruppe, 'x', 1)).toEqual([]);
  });
});

describe('hatVorrang', () => {
  it('gilt von heute bis 7 Tage vor der Klassenarbeit', () => {
    const l = lektion('a', { klassenarbeit: '2026-11-08' });
    expect(hatVorrang(l, '2026-11-01')).toBe(true);
    expect(hatVorrang(l, '2026-11-08')).toBe(true);
    expect(hatVorrang(l, '2026-10-31')).toBe(false);
    expect(hatVorrang(l, '2026-11-09')).toBe(false);
    expect(hatVorrang(lektion('b'), '2026-11-01')).toBe(false);
  });
});

describe('vokabelQuellen', () => {
  it('nimmt die Beispielliste, solange es keine Englisch-Lektion gibt', () => {
    const { listen } = vokabelQuellen(
      [lektion('m', { fach: 'mathe', inhalt: { art: 'x' } })],
      '2026-11-01',
    );
    expect(listen.map((l) => l.id)).toEqual(['beispiel-1']);
  });

  it('übt alle nicht gelöschten Englisch-Lektionen', () => {
    const { listen, vorrang } = vokabelQuellen(
      [
        lektion('a'),
        lektion('b', { geloescht: true }),
        lektion('c', { klassenarbeit: '2026-11-03' }),
      ],
      '2026-11-01',
    );
    expect(listen.map((l) => l.id)).toEqual(['a', 'c']);
    expect([...vorrang]).toEqual(['c']);
  });

  it('übt pausierte gar nicht und archivierte nur bereits gelernte Wörter', () => {
    const staende = berechneStaende([
      erstelleEreignis(
        { typ: 'antwort', listeId: 'arch', wortId: 'arch-1', richtig: true, uebung: 'erkennen' },
        'kind',
      ),
    ]);
    const { listen, vorrang } = vokabelQuellen(
      [
        lektion('aktiv', { reihenfolge: 1 }),
        lektion('pause', { status: 'pausiert', klassenarbeit: '2026-11-02' }),
        lektion('arch', { status: 'archiviert', reihenfolge: 0 }),
        lektion('alt', { status: 'archiviert' }),
      ],
      '2026-11-01',
      staende,
    );
    expect(listen.map((l) => [l.id, l.woerter.map((w) => w.id)])).toEqual([
      ['arch', ['arch-1']],
      ['aktiv', ['aktiv-1', 'aktiv-2']],
    ]);
    expect(vorrang.size).toBe(0);
  });
});

describe('Klassenarbeit zuerst', () => {
  it('nimmt neue und fällige Wörter der Vorrang-Lektion zuerst', () => {
    const { listen, vorrang } = vokabelQuellen(
      [lektion('a'), lektion('b'), lektion('c', { klassenarbeit: '2026-11-05' })],
      '2026-11-01',
    );
    const runde = rundeAuswaehlen(listen, new Map(), '2026-11-01', vorrang);
    expect(runde.slice(0, 2).map((r) => r.liste.id)).toEqual(['c', 'c']);
  });

  it('gilt auch für Extra-Runden', () => {
    const { listen, vorrang } = vokabelQuellen(
      [lektion('a'), lektion('c', { klassenarbeit: '2026-11-05' })],
      '2026-11-01',
    );
    const staende = berechneStaende(
      ['a-1', 'a-2', 'c-1', 'c-2'].map((wortId) => ({
        id: wortId,
        geraet: 'kind',
        zeit: '2026-11-01T09:00:00Z',
        typ: 'antwort' as const,
        listeId: wortId[0]!,
        wortId,
        uebung: 'erkennen' as const,
        richtig: true,
      })),
    );
    const runde = extraRundeAuswaehlen(listen, staende, () => 0.5, vorrang);
    expect(runde.slice(0, 2).map((r) => r.liste.id)).toEqual(['c', 'c']);
  });
});

describe('gleicheLektionenAb', () => {
  async function geraet(rolle: 'kind' | 'eltern', seite: DropboxAttrappe, start: Lektion[] = []) {
    const lektionen = lektionenImArbeitsspeicher(start);
    const stand = wertImArbeitsspeicher<LektionenStand>();
    const dropbox = await verbundenesDropbox(seite);
    return {
      lektionen,
      abgleichen: () =>
        gleicheLektionenAb({ dropbox, lektionen, darfSchreiben: rolle === 'eltern', stand }),
    };
  }

  it('Eltern laden jede Lektion als eigene Datei hoch, das Kind übernimmt sie', async () => {
    const seite = dropboxAttrappe();
    const eltern = await geraet('eltern', seite, [lektion('a'), lektion('b')]);
    const kind = await geraet('kind', seite);
    expect(await eltern.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 2 });
    expect(seite.dateien.has(lektionDatei('a'))).toBe(true);
    expect(await kind.abgleichen()).toEqual({ uebernommen: 2, hochgeladen: 0 });
    expect((await kind.lektionen.alle()).map((l) => l.id).sort()).toEqual(['a', 'b']);
  });

  it('schreibt das Datenformat in die Datei, aber nicht in die Lektion', async () => {
    const seite = dropboxAttrappe();
    const eltern = await geraet('eltern', seite, [lektion('a')]);
    const kind = await geraet('kind', seite);
    await eltern.abgleichen();
    expect(JSON.parse(seite.dateien.get(lektionDatei('a'))!.inhalt)).toMatchObject({ format: 1 });
    await kind.abgleichen();
    expect(await kind.lektionen.lade('a')).toEqual(lektion('a'));
  });

  it('überschreibt keine Lektion, die eine neuere App-Version geschrieben hat', async () => {
    const seite = dropboxAttrappe();
    const neuer = JSON.stringify({ ...lektion('a', { titel: 'Neu' }), format: 99 });
    seite.dateien.set(lektionDatei('a'), { inhalt: neuer, rev: 'r1' });
    const eltern = await geraet('eltern', seite, [
      lektion('a', { geaendert: '2026-11-02T10:00:00Z' }),
    ]);
    expect(await eltern.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 0 });
    expect(seite.dateien.get(lektionDatei('a'))!.inhalt).toBe(neuer);
  });

  it('zwei Eltern-Geräte legen gleichzeitig Lektionen an, ohne sich zu überschreiben', async () => {
    const seite = dropboxAttrappe();
    const papa = await geraet('eltern', seite, [lektion('papa')]);
    const mama = await geraet('eltern', seite, [lektion('mama')]);
    await papa.abgleichen();
    await mama.abgleichen();
    await papa.abgleichen();
    expect((await papa.lektionen.alle()).map((l) => l.id).sort()).toEqual(['mama', 'papa']);
    expect((await mama.lektionen.alle()).map((l) => l.id).sort()).toEqual(['mama', 'papa']);
  });

  it('verteilt Löschungen und neuere Änderungen', async () => {
    const seite = dropboxAttrappe();
    const eltern = await geraet('eltern', seite, [lektion('a')]);
    const kind = await geraet('kind', seite);
    await eltern.abgleichen();
    await kind.abgleichen();
    await eltern.lektionen.speichere({
      ...lektion('a'),
      geloescht: true,
      geaendert: '2026-11-02T10:00:00Z',
    });
    await eltern.abgleichen();
    await kind.abgleichen();
    expect((await kind.lektionen.lade('a'))?.geloescht).toBe(true);
  });

  it('das Kind-Gerät schreibt nie Lektionen', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind', seite, [lektion('a')]);
    await kind.abgleichen();
    expect(seite.aufrufe.some((a) => a.url.endsWith('/files/upload'))).toBe(false);
  });

  it('ignoriert kaputte Dateien und Dateien mit fremder id', async () => {
    const seite = dropboxAttrappe();
    const kind = await geraet('kind', seite);
    const dropbox = await verbundenesDropbox(seite);
    await dropbox.hochladen(lektionDatei('kaputt'), '{nicht json');
    await dropbox.hochladen(lektionDatei('falsch'), JSON.stringify(lektion('anders')));
    expect(await kind.abgleichen()).toEqual({ uebernommen: 0, hochgeladen: 0 });
  });
});

describe('liesLektion', () => {
  it('liest nur gültige Lektionen', () => {
    expect(liesLektion(JSON.stringify(lektion('a')))?.id).toBe('a');
    expect(liesLektion(JSON.stringify({ id: 'a' }))).toBeUndefined();
  });
});
