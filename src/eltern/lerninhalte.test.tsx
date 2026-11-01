import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lektion } from '../lektionen/lektion.ts';
import { LektionenProvider } from '../lektionen/LektionenKontext.tsx';
import { lektionenImArbeitsspeicher } from '../lektionen/speicher.ts';
import { Lerninhalte } from './Lerninhalte.tsx';

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
        { id: `${id}-1`, en: 'began', de: 'anfangen' },
        { id: `${id}-2`, en: 'blew', de: 'pusten' },
      ],
    },
    ...ueber,
  };
}

async function zeige(start: Lektion[], startId?: string) {
  const speicher = lektionenImArbeitsspeicher(start);
  const onSchliessen = vi.fn();
  render(
    <LektionenProvider speicher={speicher}>
      <Lerninhalte startId={startId} onSchliessen={onSchliessen} />
    </LektionenProvider>,
  );
  await screen.findByRole('dialog', { name: 'Lerninhalte' });
  return { speicher, onSchliessen };
}

const liste = () => screen.getByRole('navigation', { name: 'Lektionen' });

// Der Eintrag einer Lektion in der Liste (nicht die Pfeile daneben)
function eintrag(titel: string) {
  return within(liste()).getByText(titel).closest('button')!;
}

describe('Lerninhalte', () => {
  it('gliedert nach Fach und Status', async () => {
    await zeige([
      lektion('1'),
      lektion('2', { status: 'pausiert' }),
      lektion('3', { status: 'archiviert' }),
      lektion('m', { fach: 'mathe', inhalt: { art: 'aufgaben' } }),
    ]);
    const nav = liste();
    await within(nav).findByText('Unit 1');
    const englisch = within(nav).getByRole('heading', { name: 'Englisch' }).parentElement!;
    expect(within(nav).getByRole('heading', { name: 'Englisch' })).toBeInTheDocument();
    expect(within(nav).getByRole('heading', { name: 'Mathe' })).toBeInTheDocument();
    for (const [gruppe, titel] of [
      ['Gerade dran', 'Unit 1'],
      ['Noch nicht dran', 'Unit 2'],
      ['Archiv', 'Unit 3'],
    ] as const) {
      const abschnitt = within(englisch).getByRole('heading', { name: gruppe }).parentElement!;
      expect(within(abschnitt).getByText(titel)).toBeInTheDocument();
    }
  });

  it('zeigt zur Lektion, wo Milena steht', async () => {
    await zeige([lektion('1')], '1');
    const f = await screen.findByRole('region', { name: 'Fortschritt' });
    expect(
      within(f).getByRole('img', { name: '0 sicher, 0 am Lernen, 2 neu' }),
    ).toBeInTheDocument();
    expect(within(f).getByText('Zuletzt geübt: noch nie')).toBeInTheDocument();
  });

  it('bearbeitet Wörter, ohne dass der Lernstand verloren geht', async () => {
    const { speicher } = await zeige([lektion('1')], '1');
    const de = await screen.findByLabelText('Deutsch 1');
    await userEvent.type(de, ', beginnen');
    await userEvent.click(screen.getByRole('button', { name: '+ Wort' }));
    await userEvent.type(screen.getByLabelText('Englisch 3'), 'broke');
    await userEvent.type(screen.getByLabelText('Deutsch 3'), 'zerbrechen');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByText('✓ Gespeichert')).toBeInTheDocument();
    const gespeichert = (await speicher.lade('1'))!;
    expect(gespeichert.geaendert > '2026-11-01T10:00:00Z').toBe(true);
    expect(gespeichert.inhalt).toMatchObject({
      woerter: [
        { id: '1-1', en: 'began', de: 'anfangen, beginnen' },
        { id: '1-2', en: 'blew', de: 'pusten' },
        { en: 'broke', de: 'zerbrechen' },
      ],
    });
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('meldet Fehler und speichert dann nicht', async () => {
    const { speicher } = await zeige([lektion('1')], '1');
    await userEvent.clear(await screen.findByLabelText('Titel'));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Titel');
    expect((await speicher.lade('1'))!.titel).toBe('Unit 1');
  });

  it('pausiert eine Lektion', async () => {
    const { speicher } = await zeige([lektion('1'), lektion('2')], '1');
    await userEvent.click(await screen.findByRole('button', { name: 'Noch nicht dran' }));
    expect(screen.getByText(/Wird noch nicht geübt/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await vi.waitFor(async () => expect((await speicher.lade('1'))!.status).toBe('pausiert'));
    const pausiert = within(liste()).getByRole('heading', {
      name: 'Noch nicht dran',
    }).parentElement!;
    expect(within(pausiert).getByText('Unit 1')).toBeInTheDocument();
  });

  it('übernimmt eine eingefügte Wortliste', async () => {
    await zeige([lektion('1')], '1');
    await userEvent.click(await screen.findByText('Wortliste einfügen'));
    await userEvent.type(
      screen.getByLabelText(/Eine Zeile pro Wort/),
      'broke - zerbrechen{enter}did{enter}began - anfangen',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 Wörter übernommen.');
    expect(screen.getByLabelText('Englisch 3')).toHaveValue('broke');
    expect(screen.queryByLabelText('Englisch 4')).toBeNull();
    // Nicht erkannte Zeilen bleiben zum Korrigieren im Feld
    expect(screen.getByLabelText(/Eine Zeile pro Wort/)).toHaveValue('did');
  });

  it('ändert die Reihenfolge innerhalb einer Gruppe', async () => {
    const { speicher } = await zeige([
      lektion('a', { reihenfolge: 0 }),
      lektion('b', { reihenfolge: 1 }),
    ]);
    await userEvent.click(await screen.findByRole('button', { name: 'Unit b nach oben' }));
    await vi.waitFor(async () => expect((await speicher.lade('b'))!.reihenfolge).toBe(0));
    expect((await speicher.lade('a'))!.reihenfolge).toBe(1);
    const titel = within(liste())
      .getAllByRole('button')
      .filter((b) => b.classList.contains('lerninhalte-eintrag'))
      .map((b) => b.querySelector('strong')!.textContent);
    expect(titel).toEqual(['Unit b', 'Unit a']);
  });

  it('fragt vor dem Verlassen ungespeicherter Änderungen nach', async () => {
    const { onSchliessen } = await zeige([lektion('1'), lektion('2')], '1');
    await userEvent.type(await screen.findByLabelText('Titel'), ' neu');
    const frage = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.click(eintrag('Unit 2'));
    expect(screen.getByLabelText('Titel')).toHaveValue('Unit 1 neu');
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onSchliessen).not.toHaveBeenCalled();
    frage.mockReturnValue(true);
    await userEvent.click(eintrag('Unit 2'));
    expect(screen.getByLabelText('Titel')).toHaveValue('Unit 2');
    expect(frage).toHaveBeenCalledTimes(3);
  });

  it('Zurück-Taste schließt die Lerninhalte, fragt aber vorher bei ungespeicherten Änderungen', async () => {
    window.history.replaceState({ elternBereich: 'lektionen' }, '', window.location.href);
    const { onSchliessen } = await zeige([lektion('1')], '1');
    expect(window.history.state).toMatchObject({ lerninhalte: true, elternBereich: 'lektionen' });
    await userEvent.type(await screen.findByLabelText('Titel'), ' neu');

    const frage = vi.spyOn(window, 'confirm').mockReturnValue(false);
    window.history.back();
    await vi.waitFor(() => expect(frage).toHaveBeenCalled());
    expect(onSchliessen).not.toHaveBeenCalled();
    expect(window.history.state).toMatchObject({ lerninhalte: true });

    frage.mockReturnValue(true);
    window.history.back();
    await vi.waitFor(() => expect(onSchliessen).toHaveBeenCalled());
  });

  it('löscht eine Lektion nach Rückfrage', async () => {
    const { speicher } = await zeige([lektion('1')], '1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(await screen.findByRole('button', { name: '🗑️ Lektion löschen' }));
    await vi.waitFor(async () => expect((await speicher.lade('1'))!.geloescht).toBe(true));
    expect(within(liste()).queryByText('Unit 1')).toBeNull();
  });
});
