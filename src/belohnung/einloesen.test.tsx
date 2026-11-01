import { geraetImArbeitsspeicher } from '../eltern/geraet.ts';
import { GeraetProvider } from '../eltern/GeraetKontext.tsx';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis, type LernEreignis } from '../daten/ereignisse.ts';
import { inhalteImArbeitsspeicher } from '../daten/inhalte.ts';
import { InhalteProvider } from '../daten/InhalteKontext.tsx';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { Einloesungen } from '../eltern/Einloesungen.tsx';
import { BelohnungenSeite } from './BelohnungenSeite.tsx';
import { einloesungen, gesamtPunkte, guthaben, level } from './logik.ts';

// Punkte aus einer früheren Runde: 10 + richtig × 2
function punkte(anzahl: number, tag = '2026-10-30'): LernEreignis {
  return erstelleEreignis(
    { typ: 'runde-beendet', richtig: (anzahl - 10) / 2, mitHilfe: 0, verbessert: 0 },
    'kind',
    new Date(`${tag}T12:00:00`),
  );
}

const PIN = { salz: '', hash: '' };

function zeige(protokoll: Protokoll, inhalt: 'kind' | 'eltern' = 'kind') {
  render(
    <ProtokollProvider protokoll={protokoll}>
      <InhalteProvider speicher={inhalteImArbeitsspeicher()}>
        <GeraetProvider speicher={geraetImArbeitsspeicher({ rolle: inhalt, pin: PIN })}>
          {inhalt === 'kind' ? <BelohnungenSeite /> : <Einloesungen />}
        </GeraetProvider>
      </InhalteProvider>
    </ProtokollProvider>,
  );
}

async function karte(name: string) {
  return (await screen.findByText(name, { selector: 'strong' })).closest('li')!;
}

describe('einloesungen', () => {
  it('erkennt offene und bestätigte Einlösungen, neueste zuerst', () => {
    const kino = erstelleEreignis(
      { typ: 'eingeloest', belohnungId: 'kino', preis: 1300, name: 'Kino' },
      'kind',
      new Date('2026-11-01T10:00:00Z'),
    );
    const bad = erstelleEreignis(
      { typ: 'eingeloest', belohnungId: 'bad', preis: 900 },
      'kind',
      new Date('2026-11-01T11:00:00Z'),
    );
    const ok = erstelleEreignis({ typ: 'bestaetigt', einloesungId: kino.id }, 'eltern');
    expect(einloesungen([kino, bad, ok]).map((e) => [e.belohnungId, e.bestaetigt])).toEqual([
      ['bad', false],
      ['kino', true],
    ]);
  });
});

describe('BelohnungenSeite', () => {
  it('zeigt Guthaben und was noch fehlt', async () => {
    zeige(protokollImArbeitsspeicher([punkte(1000)]));
    expect(await screen.findByText('1000 Punkte')).toBeInTheDocument();
    expect(
      within(await karte('Schwimmbad')).getByRole('button', { name: 'Einlösen' }),
    ).toBeEnabled();
    expect(within(await karte('Kino')).getByText('Noch 300 Punkte')).toBeInTheDocument();
    expect(within(await karte('Kino')).queryByRole('button', { name: 'Einlösen' })).toBeNull();
  });

  it('löst nach Nachfrage ein: Guthaben sinkt, Level bleibt', async () => {
    const protokoll = protokollImArbeitsspeicher([punkte(1000)]);
    zeige(protokoll);
    await userEvent.click(
      await within(await karte('Schwimmbad')).findByRole('button', { name: 'Einlösen' }),
    );
    const frage = screen.getByRole('dialog', { name: 'Schwimmbad einlösen?' });
    expect(frage).toHaveTextContent('Dein Level bleibt gleich');
    await userEvent.click(within(frage).getByRole('button', { name: 'Ja, einlösen!' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Schwimmbad');
    expect(screen.getByText('100 Punkte')).toBeInTheDocument();
    expect(screen.getByText('⏳ wartet auf Bestätigung')).toBeInTheDocument();
    const alle = await protokoll.alle();
    expect(guthaben(alle)).toBe(100);
    expect(gesamtPunkte(alle)).toBe(1000);
    expect(level(gesamtPunkte(alle)).nummer).toBe(3);
  });

  it('löst bei „Noch nicht“ nichts ein', async () => {
    const protokoll = protokollImArbeitsspeicher([punkte(1000)]);
    zeige(protokoll);
    await userEvent.click(
      await within(await karte('Schwimmbad')).findByRole('button', { name: 'Einlösen' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Noch nicht' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(einloesungen(await protokoll.alle())).toEqual([]);
  });

  it('löst bei doppeltem Tippen nur einmal ein', async () => {
    // Genug für zweimal Schwimmbad
    const protokoll = protokollImArbeitsspeicher([punkte(2000)]);
    zeige(protokoll);
    await userEvent.click(
      await within(await karte('Schwimmbad')).findByRole('button', { name: 'Einlösen' }),
    );
    const ja = screen.getByRole('button', { name: 'Ja, einlösen!' });
    await userEvent.dblClick(ja);
    await screen.findByRole('status');
    expect(einloesungen(await protokoll.alle())).toHaveLength(1);
  });

  it('zeigt bestätigte Einlösungen', async () => {
    const kino = erstelleEreignis(
      { typ: 'eingeloest', belohnungId: 'kino', preis: 1300, name: 'Kino', symbol: '🎬' },
      'kind',
    );
    const ok = erstelleEreignis({ typ: 'bestaetigt', einloesungId: kino.id }, 'eltern');
    zeige(protokollImArbeitsspeicher([punkte(2000), kino, ok]));
    expect(await screen.findByText('✓ bestätigt')).toBeInTheDocument();
  });
});

describe('Einloesungen (Eltern)', () => {
  it('bestätigt eine offene Einlösung', async () => {
    const kino = erstelleEreignis(
      { typ: 'eingeloest', belohnungId: 'kino', preis: 1300, name: 'Kino' },
      'kind',
    );
    const protokoll = protokollImArbeitsspeicher([punkte(2000), kino]);
    zeige(protokoll, 'eltern');
    await userEvent.click(await screen.findByRole('button', { name: 'Bestätigen' }));
    expect(await screen.findByText(/Gerade wartet nichts/)).toBeInTheDocument();
    expect(einloesungen(await protokoll.alle())[0]?.bestaetigt).toBe(true);
  });

  it('meldet, wenn nichts wartet', async () => {
    zeige(protokollImArbeitsspeicher([]), 'eltern');
    expect(await screen.findByText(/Gerade wartet nichts/)).toBeInTheDocument();
  });
});
