import { act, render, screen } from '@testing-library/react';
import { erstelleEreignis, type LernEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { Fortschritt } from './Fortschritt.tsx';
import { LevelFeier } from './LevelFeier.tsx';
import { level, naechstesZiel, rang } from './logik.ts';

const HEUTE = '2026-11-01';

// Eine Runde mit so vielen richtigen Antworten, dass genau `punkte` herauskommen (gerade Zahl ≥ 10)
function rundeMit(punkte: number, tag = '2026-10-30') {
  return erstelleEreignis(
    { typ: 'runde-beendet', richtig: (punkte - 10) / 2, mitHilfe: 0, verbessert: 0 },
    'kind',
    new Date(`${tag}T12:00:00`),
  );
}

function zeigeFortschritt(ereignisse: LernEreignis[]) {
  render(
    <ProtokollProvider protokoll={protokollImArbeitsspeicher(ereignisse)}>
      <Fortschritt heute={HEUTE} />
    </ProtokollProvider>,
  );
}

describe('Fortschritt', () => {
  it('startet bei Level 1 mit 0 Punkten', async () => {
    zeigeFortschritt([]);
    expect(await screen.findByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Wort-Sammlerin')).toBeInTheDocument();
    expect(screen.getByText('0 Punkte')).toBeInTheDocument();
    expect(screen.getByText('0 von 2 Runden')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '150');
  });

  it('zeigt Level, Punkte bis zum nächsten Level und Tagesziel', async () => {
    zeigeFortschritt([rundeMit(320), rundeMit(10, HEUTE)]);
    expect(await screen.findByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Spurenleserin')).toBeInTheDocument();
    expect(screen.getByText(/bis Pfadfinderin/)).toHaveTextContent(
      'Noch 170 Punkte bis Pfadfinderin',
    );
    expect(screen.getByText('1 von 2 Runden')).toBeInTheDocument();
  });

  it('zeigt erreichtes Tagesziel und Sterne', async () => {
    zeigeFortschritt([rundeMit(9500), rundeMit(10, HEUTE), rundeMit(10, HEUTE)]);
    expect(await screen.findByText('Tagesziel ✓')).toBeInTheDocument();
    expect(screen.getByText('★')).toBeInTheDocument();
    expect(screen.getByText(/zum nächsten Stern/)).toBeInTheDocument();
  });
});

describe('LevelFeier', () => {
  function zeigeFeier(ereignisse: LernEreignis[], gesehen = wertImArbeitsspeicher<number>()) {
    const protokoll = protokollImArbeitsspeicher(ereignisse);
    const ton = vi.fn();
    render(
      <ProtokollProvider protokoll={protokoll}>
        <LevelFeier gesehen={gesehen} ton={ton} />
      </ProtokollProvider>,
    );
    return { protokoll, ton, gesehen };
  }

  it('feiert beim allerersten Start nicht, merkt sich aber den Stand', async () => {
    const { gesehen, ton } = zeigeFeier([rundeMit(200)]);
    await vi.waitFor(async () => expect(await gesehen.laden()).toBe(2000));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ton).not.toHaveBeenCalled();
  });

  it('feiert einen Aufstieg mit Ton, genau einmal', async () => {
    const gesehen = wertImArbeitsspeicher(rang(level(0)));
    const { protokoll, ton } = zeigeFeier([rundeMit(140)], gesehen);
    await vi.waitFor(async () => expect(await gesehen.laden()).toBe(1000));
    expect(screen.queryByRole('dialog')).toBeNull();

    await act(() =>
      protokoll.hinzufuegen({ typ: 'runde-beendet', richtig: 0, mitHilfe: 0, verbessert: 0 }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Neues Level!' });
    expect(dialog).toHaveTextContent('Level 2: Spurenleserin');
    expect(ton).toHaveBeenCalledTimes(1);

    await act(() => screen.getByRole('button', { name: 'Juhu! 🎉' }).click());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await gesehen.laden()).toBe(2000);
  });

  it('feiert einen neuen Stern', async () => {
    const gesehen = wertImArbeitsspeicher(8000);
    zeigeFeier([rundeMit(9500)], gesehen);
    expect(await screen.findByRole('dialog', { name: 'Neuer Stern!' })).toHaveTextContent('★');
  });
});

describe('rang und naechstesZiel', () => {
  it('ordnet Level vor Sternen', () => {
    expect(rang(level(150))).toBeGreaterThan(rang(level(149)));
    expect(rang(level(9500))).toBeGreaterThan(rang(level(7000)));
  });

  it('nennt das nächste Level oder den nächsten Stern', () => {
    expect(naechstesZiel(level(0))).toBe('Spurenleserin');
    expect(naechstesZiel(level(7000))).toBe('zum nächsten Stern');
  });
});
