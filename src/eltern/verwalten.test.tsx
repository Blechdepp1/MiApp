import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BELOHNUNGEN_START } from '../belohnung/inhalte.ts';
import { LEVEL_START } from '../belohnung/werte.ts';
import { inhalteImArbeitsspeicher, type InhalteSpeicher } from '../daten/inhalte.ts';
import { InhalteProvider } from '../daten/InhalteKontext.tsx';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { BelohnungenVerwalten } from './BelohnungenVerwalten.tsx';
import { geraetImArbeitsspeicher, type Rolle } from './geraet.ts';
import { GeraetProvider } from './GeraetKontext.tsx';
import { LevelVerwalten } from './LevelVerwalten.tsx';
import { erzeugePruefwert } from './pin.ts';

async function zeige(ansicht: 'belohnungen' | 'level', rolle: Rolle = 'eltern') {
  const inhalte: InhalteSpeicher = inhalteImArbeitsspeicher();
  render(
    <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
      <InhalteProvider speicher={inhalte}>
        <GeraetProvider
          speicher={geraetImArbeitsspeicher({ rolle, pin: await erzeugePruefwert('1234') })}
        >
          {ansicht === 'belohnungen' ? <BelohnungenVerwalten /> : <LevelVerwalten />}
        </GeraetProvider>
      </InhalteProvider>
    </ProtokollProvider>,
  );
  await screen.findByRole('heading');
  return inhalte;
}

describe('BelohnungenVerwalten', () => {
  it('zeigt die Startwerte', async () => {
    await zeige('belohnungen');
    expect(
      screen.getAllByRole('textbox', { name: 'Name' }).map((e) => (e as HTMLInputElement).value),
    ).toEqual(BELOHNUNGEN_START.map((b) => b.name));
  });

  it('zeigt die ungefähre Lernzeit je Belohnung', async () => {
    await zeige('belohnungen');
    // Schätzung 9 Punkte/Minute: 900 Punkte ≈ 100 Minuten
    expect(screen.getByText('≈ 1 Std. 40 Min. Lernzeit')).toBeInTheDocument();
    expect(screen.getByText(/Lernzeit geschätzt/)).toBeInTheDocument();
  });

  it('legt eine Belohnung an und speichert sie nach Punkten sortiert', async () => {
    const inhalte = await zeige('belohnungen');
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: '+ Belohnung' })).not.toBeDisabled(),
    );
    await userEvent.click(screen.getByRole('button', { name: '+ Belohnung' }));
    const namen = screen.getAllByRole('textbox', { name: 'Name' });
    await userEvent.type(namen.at(-1)!, 'Eis essen');
    const preis = screen.getByRole('spinbutton', { name: 'Preis für Eis essen' });
    await userEvent.clear(preis);
    await userEvent.type(preis, '300');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Gespeichert');
    const gespeichert = await inhalte.lade('belohnungen');
    expect(gespeichert?.daten[0]).toMatchObject({ name: 'Eis essen', preis: 300 });
    expect(screen.getAllByRole('textbox', { name: 'Name' })[0]).toHaveValue('Eis essen');
  });

  it('lehnt einen Preis von 0 verständlich ab', async () => {
    const inhalte = await zeige('belohnungen');
    const preis = screen.getByRole('spinbutton', { name: 'Preis für Kino' });
    await userEvent.clear(preis);
    await userEvent.type(preis, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Preis');
    expect(await inhalte.lade('belohnungen')).toBeUndefined();
  });

  it('löscht eine Belohnung', async () => {
    const inhalte = await zeige('belohnungen');
    await userEvent.click(screen.getByRole('button', { name: 'Kino löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('status');
    expect((await inhalte.lade('belohnungen'))?.daten.map((b) => b.id)).not.toContain('kino');
  });

  it('auf dem Kind-Gerät nur anzeigen', async () => {
    await zeige('belohnungen', 'kind');
    await screen.findByText(/auf einem Eltern-Gerät/);
    expect(screen.queryByRole('button', { name: 'Speichern' })).toBeNull();
    for (const feld of screen.getAllByRole('textbox')) expect(feld).toBeDisabled();
  });
});

describe('LevelVerwalten', () => {
  it('benennt ein Level um und speichert', async () => {
    const inhalte = await zeige('level');
    await vi.waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Titel Level 1' })).not.toBeDisabled(),
    );
    const titel = screen.getByRole('textbox', { name: 'Titel Level 1' });
    await userEvent.clear(titel);
    await userEvent.type(titel, 'Wort-Detektivin');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await screen.findByRole('status');
    const gespeichert = await inhalte.lade('level');
    expect(gespeichert?.daten[0]).toEqual({ ab: 0, titel: 'Wort-Detektivin' });
    expect(gespeichert?.daten).toHaveLength(LEVEL_START.length);
  });

  it('lehnt nicht aufsteigende Schwellen ab', async () => {
    await zeige('level');
    const zwei = screen.getByRole('spinbutton', { name: 'Punkte für Level 3' });
    await userEvent.clear(zwei);
    await userEvent.type(zwei, '100');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Level 3 muss mehr Punkte brauchen');
  });

  it('kann ein Level anhängen und das letzte wieder entfernen', async () => {
    await zeige('level');
    await userEvent.click(screen.getByRole('button', { name: '+ Level' }));
    const liste = screen.getByRole('list');
    expect(within(liste).getAllByRole('listitem')).toHaveLength(LEVEL_START.length + 1);
    await userEvent.click(
      screen.getByRole('button', { name: `Level ${LEVEL_START.length + 1} löschen` }),
    );
    expect(within(liste).getAllByRole('listitem')).toHaveLength(LEVEL_START.length);
  });
});
