import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { zuJsonl, eigeneDatei } from '../sync/abgleich.ts';
import { dropboxAttrappe, verbundenesDropbox } from '../sync/dropboxAttrappe.ts';
import { inhaltDatei } from '../sync/inhalteAbgleich.ts';
import { lektionDatei } from '../sync/lektionenAbgleich.ts';
import {
  fuerVorschau,
  istLeer,
  leseLiveDatenAusDropbox,
  zusammenfassung,
  type KopieStand,
  type LiveDaten,
} from './liveKopie.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import type { Lektion } from '../lektionen/lektion.ts';
import { LiveDatenUebernehmen } from './LiveDatenUebernehmen.tsx';

const LEKTION: Lektion = {
  id: 'u5',
  fach: 'englisch',
  titel: 'Unit 5',
  erstellt: '2026-11-01T10:00:00Z',
  geaendert: '2026-11-01T10:00:00Z',
  inhalt: { art: 'vokabeln', woerter: [{ id: 'w1', en: 'began', de: 'anfangen' }] },
};

const dropboxAttrappeOhneVerbindung = {
  verbunden: async () => false,
  liste: async () => [],
  herunterladen: async () => undefined,
};

const LIVE: LiveDaten = {
  quelle: 'Dropbox-Ordner Apps/MiApp-Lernen',
  lektionen: [LEKTION, { ...LEKTION, id: 'alt', geloescht: true }],
  inhalte: [{ name: 'belohnungen', daten: [], geaendert: '2026-10-31T10:00:00Z' }],
  ereignisse: [
    erstelleEreignis({ typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0 }, 'kind'),
  ],
};

describe('Live-Daten für den Testkanal', () => {
  it('gibt Lektionen und Inhalten einen frischen Zeitstempel, Ereignisse bleiben gleich', () => {
    const kopie = fuerVorschau(LIVE, '2026-11-02T08:00:00Z');
    expect(kopie.lektionen.map((l) => l.geaendert)).toEqual([
      '2026-11-02T08:00:00Z',
      '2026-11-02T08:00:00Z',
    ]);
    expect(kopie.inhalte[0]!.geaendert).toBe('2026-11-02T08:00:00Z');
    expect(kopie.ereignisse).toBe(LIVE.ereignisse);
    // 20 Punkte: Level 1 ohne Sterne gilt als schon gefeiert
    expect(kopie.gesehenesLevel).toBe(1000);
  });

  it('liest die Live-Daten aus dem Dropbox-Ordner der Live-App', async () => {
    const seite = dropboxAttrappe();
    const live = await verbundenesDropbox(seite);
    await live.hochladen(lektionDatei('u5'), JSON.stringify({ format: 1, ...LEKTION }));
    await live.hochladen(
      lektionDatei('neu'),
      JSON.stringify({ format: 99, ...LEKTION, id: 'neu' }),
    );
    await live.hochladen(
      inhaltDatei('belohnungen'),
      JSON.stringify({ format: 1, geaendert: '2026-10-31T10:00:00Z', daten: [] }),
    );
    await live.hochladen('/inhalte/unbekannt.json', '{}');
    await live.hochladen(eigeneDatei('kind-1'), zuJsonl(LIVE.ereignisse));
    // Testdaten im Unterordner gehören nicht dazu
    await live.hochladen('/vorschau/inhalte/lektionen/test.json', JSON.stringify(LEKTION));

    const daten = (await leseLiveDatenAusDropbox(live))!;
    expect(daten.lektionen.map((l) => l.id)).toEqual(['u5']);
    expect(daten.inhalte.map((i) => i.name)).toEqual(['belohnungen']);
    expect(daten.ereignisse).toEqual(LIVE.ereignisse);
    expect(istLeer(daten)).toBe(false);
  });

  it('liest ohne Dropbox-Verbindung nichts', async () => {
    expect(await leseLiveDatenAusDropbox({ ...dropboxAttrappeOhneVerbindung })).toBeNull();
  });

  it('fasst zusammen, was übernommen wird', () => {
    expect(zusammenfassung(LIVE)).toBe('1 Lektionen, 1 Listen (Belohnungen/Level), 1 Runden');
  });
});

describe('LiveDatenUebernehmen', () => {
  it('übernimmt nach Rückfrage und lädt neu', async () => {
    const schreiben = vi.fn(async () => {});
    const neuLaden = vi.fn();
    const frage = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <LiveDatenUebernehmen lesen={async () => LIVE} schreiben={schreiben} neuLaden={neuLaden} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    await vi.waitFor(() => expect(neuLaden).toHaveBeenCalled());
    expect(frage.mock.calls[0]![0]).toContain('1 Lektionen');
    expect(frage.mock.calls[0]![0]).toContain('Aus Dropbox-Ordner Apps/MiApp-Lernen übernehmen');
    expect(schreiben).toHaveBeenCalledWith(
      expect.objectContaining({ lektionen: expect.any(Array), gesehenesLevel: 1000 }),
      expect.objectContaining({
        quelle: 'Dropbox-Ordner Apps/MiApp-Lernen',
        lektionen: 1,
        runden: 1,
      }),
    );
  });

  it('ändert nichts, wenn man abbricht', async () => {
    const schreiben = vi.fn(async () => {});
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<LiveDatenUebernehmen lesen={async () => LIVE} schreiben={schreiben} />);
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    expect(await screen.findByRole('button', { name: 'Daten übernehmen' })).toBeEnabled();
    expect(schreiben).not.toHaveBeenCalled();
  });

  it('erklärt, wenn es keine Live-Daten gibt, und schlägt Dropbox vor', async () => {
    render(<LiveDatenUebernehmen lesen={async () => null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Keine Daten aus Milenas App');
    expect(screen.getByRole('alert')).toHaveTextContent('mit Dropbox verbinden');
  });

  it('zeigt, welcher Stand zuletzt übernommen wurde', async () => {
    const standSpeicher = wertImArbeitsspeicher<KopieStand>({
      zeit: '2026-11-01T13:32:00Z',
      quelle: 'Dropbox-Ordner Apps/MiApp-Lernen',
      lektionen: 3,
      runden: 12,
      letzteRunde: '2026-10-31T17:05:00Z',
    });
    render(<LiveDatenUebernehmen standSpeicher={standSpeicher} />);
    expect(await screen.findByText('3 Lektionen, 12 Runden')).toBeInTheDocument();
    expect(screen.getByText('Dropbox-Ordner Apps/MiApp-Lernen')).toBeInTheDocument();
    expect(screen.getByText('Letzte Runde von Milena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu übernehmen' })).toBeInTheDocument();
  });

  it('übernimmt keine leeren Daten', async () => {
    const schreiben = vi.fn(async () => {});
    const leer: LiveDaten = {
      quelle: 'Milenas App auf diesem Gerät',
      lektionen: [],
      inhalte: [],
      ereignisse: [],
    };
    render(<LiveDatenUebernehmen lesen={async () => leer} schreiben={schreiben} />);
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('(Milenas App auf diesem Gerät)');
    expect(schreiben).not.toHaveBeenCalled();
  });

  it('meldet Fehler beim Lesen', async () => {
    render(
      <LiveDatenUebernehmen
        lesen={async () => {
          throw new Error('kaputt');
        }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nicht geklappt');
  });
});
