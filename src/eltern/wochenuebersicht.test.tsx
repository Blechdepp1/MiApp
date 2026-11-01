import { render, screen, within } from '@testing-library/react';
import { erstelleEreignis, type EreignisDaten } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import type { Lektion } from '../lektionen/lektion.ts';
import { LektionenProvider } from '../lektionen/LektionenKontext.tsx';
import { lektionenImArbeitsspeicher } from '../lektionen/speicher.ts';
import { Wochenuebersicht } from './Wochenuebersicht.tsx';

const UNIT5: Lektion = {
  id: 'u5',
  fach: 'englisch',
  titel: 'Unit 5',
  erstellt: '2026-11-01T10:00:00Z',
  geaendert: '2026-11-01T10:00:00Z',
  inhalt: {
    art: 'vokabeln',
    woerter: [
      { id: 'a', en: 'began', de: 'anfangen' },
      { id: 'b', en: 'blew', de: 'pusten' },
    ],
  },
};

const am = (tag: number, daten: EreignisDaten, minute = 0) =>
  erstelleEreignis(daten, 'kind', new Date(2026, 10, 2 + tag, 10, minute));

describe('Wochenübersicht', () => {
  it('zeigt Lerntage, Runden, Minuten, Fortschritt und schwierige Wörter', async () => {
    const ereignisse = [
      am(5, { typ: 'antwort', listeId: 'u5', wortId: 'b', uebung: 'erkennen', richtig: false }),
      am(5, { typ: 'antwort', listeId: 'u5', wortId: 'a', uebung: 'erkennen', richtig: true }, 1),
      am(5, { typ: 'runde-beendet', richtig: 1, mitHilfe: 0, verbessert: 0 }, 9),
    ];
    render(
      <ProtokollProvider protokoll={protokollImArbeitsspeicher(ereignisse)}>
        <LektionenProvider speicher={lektionenImArbeitsspeicher([UNIT5])}>
          <Wochenuebersicht heute="2026-11-08" />
        </LektionenProvider>
      </ProtokollProvider>,
    );
    const woche = await screen.findByRole('region', { name: 'Die letzten 7 Tage' });
    expect(await within(woche).findByText('≈ 9')).toBeInTheDocument();
    expect(within(woche).getByLabelText('1 Runden')).toBeInTheDocument();

    const dran = screen.getByRole('region', { name: 'Gerade dran' });
    expect(within(dran).getByText('Unit 5')).toBeInTheDocument();
    expect(
      within(dran).getByRole('img', { name: '0 sicher, 2 am Lernen, 0 neu' }),
    ).toBeInTheDocument();
    expect(within(dran).getByText('Zuletzt geübt: gestern')).toBeInTheDocument();

    const schwer = screen.getByRole('region', { name: 'Fällt ihr gerade schwer' });
    expect(within(schwer).getByText('blew')).toBeInTheDocument();
    expect(within(schwer).getByText('1×')).toBeInTheDocument();
  });

  it('kommt ohne Lektionen und Runden aus', async () => {
    render(
      <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
        <LektionenProvider speicher={lektionenImArbeitsspeicher()}>
          <Wochenuebersicht heute="2026-11-08" />
        </LektionenProvider>
      </ProtokollProvider>,
    );
    expect(await screen.findByText(/keine Lektion als „Gerade dran“/)).toBeInTheDocument();
    expect(screen.getByText(/keine Fehler/)).toBeInTheDocument();
  });
});
