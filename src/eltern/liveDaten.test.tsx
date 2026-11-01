import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { fuerVorschau, zusammenfassung, type LiveDaten } from './liveKopie.ts';
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

const LIVE: LiveDaten = {
  lektionen: [LEKTION, { ...LEKTION, id: 'alt', geloescht: true }],
  inhalte: [{ name: 'belohnungen', daten: [], geaendert: '2026-10-31T10:00:00Z' }],
  ereignisse: [
    erstelleEreignis({ typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0 }, 'kind'),
  ],
  gesehenesLevel: 3,
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
    expect(kopie.gesehenesLevel).toBe(3);
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
    expect(schreiben).toHaveBeenCalledWith(
      expect.objectContaining({ lektionen: expect.any(Array), gesehenesLevel: 3 }),
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

  it('erklärt, wenn es auf dem Gerät keine Live-Daten gibt', async () => {
    render(<LiveDatenUebernehmen lesen={async () => null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Daten übernehmen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('keine Daten aus Milenas App');
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
