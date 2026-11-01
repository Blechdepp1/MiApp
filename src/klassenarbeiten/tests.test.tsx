import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { TEST_PUNKTE } from '../belohnung/werte.ts';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { TestUebersicht } from '../eltern/TestUebersicht.tsx';
import { LektionenProvider } from '../lektionen/LektionenKontext.tsx';
import { lektionenImArbeitsspeicher } from '../lektionen/speicher.ts';
import { alleTests, testPunkte } from './logik.ts';
import { TestsSeite } from './TestsSeite.tsx';

const UNIT5 = {
  id: 'unit-5',
  fach: 'englisch',
  titel: 'Unit 5',
  erstellt: '2026-11-01T10:00:00Z',
  geaendert: '2026-11-01T10:00:00Z',
  inhalt: { art: 'vokabeln', woerter: [{ id: 'w1', en: 'began', de: 'anfangen' }] },
};

function mit(protokoll: Protokoll, inhalt: ReactNode) {
  return render(
    <ProtokollProvider protokoll={protokoll}>
      <LektionenProvider speicher={lektionenImArbeitsspeicher([UNIT5])}>{inhalt}</LektionenProvider>
    </ProtokollProvider>,
  );
}

function test(datum: string, fach: 'englisch' | 'mathe' = 'mathe') {
  return erstelleEreignis({ typ: 'test-eingetragen', fach, art: 'klassenarbeit', datum }, 'kind');
}

describe('Meine Tests (Kind)', () => {
  it('trägt eine Englisch-Arbeit mit Lektion ein und gibt dafür Punkte', async () => {
    const protokoll = protokollImArbeitsspeicher();
    mit(protokoll, <TestsSeite heute="2026-11-02" />);
    await userEvent.click(await screen.findByRole('button', { name: '➕ Test eintragen' }));
    const form = screen.getByRole('region', { name: 'Test eintragen' });
    expect(within(form).getByRole('button', { name: 'Eintragen' })).toBeDisabled();
    await userEvent.click(within(form).getByRole('button', { name: /Englisch/ }));
    await userEvent.click(within(form).getByRole('button', { name: 'Vokabeltest' }));
    await userEvent.type(within(form).getByLabelText(/Wann/), '2026-11-06');
    await userEvent.selectOptions(within(form).getByLabelText(/Welche Lektion/), 'unit-5');
    await userEvent.click(within(form).getByRole('button', { name: 'Eintragen' }));

    expect(await screen.findByRole('status')).toHaveTextContent(`+${TEST_PUNKTE.eintragen} Punkte`);
    const [t] = alleTests(await protokoll.alle());
    expect(t).toMatchObject({ fach: 'englisch', art: 'vokabeltest', lektionId: 'unit-5' });
    const bald = screen.getByRole('region', { name: 'Bald' });
    expect(within(bald).getByText(/Vokabeltest in Englisch/)).toBeInTheDocument();
  });

  it('fragt nach dem Termin nach der Note', async () => {
    const t = test('2026-11-02');
    const protokoll = protokollImArbeitsspeicher([t]);
    mit(protokoll, <TestsSeite heute="2026-11-03" />);
    expect(await screen.findByRole('heading', { name: 'Wie lief dein Test?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(await screen.findByRole('status')).toHaveTextContent('egal welche Note');
    expect(alleTests(await protokoll.alle())[0]).toMatchObject({ note: 3, bestaetigt: false });
    expect(screen.getByText(/wartet auf Bestätigung/)).toBeInTheDocument();
  });

  it('„Weiß ich noch nicht“ blendet die Frage aus', async () => {
    mit(protokollImArbeitsspeicher([test('2026-11-02')]), <TestsSeite heute="2026-11-03" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Weiß ich noch nicht' }));
    expect(screen.queryByRole('heading', { name: 'Wie lief dein Test?' })).toBeNull();
  });
});

describe('Tests & Klassenarbeiten (Eltern)', () => {
  it('bestätigt eine Note, auch nach Korrektur', async () => {
    const t = test('2026-11-02');
    const protokoll = protokollImArbeitsspeicher([
      t,
      erstelleEreignis({ typ: 'test-ergebnis', testId: t.id, note: 4 }, 'kind'),
    ]);
    mit(protokoll, <TestUebersicht />);
    const zeile = (await screen.findByText(/Klassenarbeit Mathe · Note 4/)).closest('li')!;
    await userEvent.selectOptions(within(zeile).getByLabelText('Note'), '3');
    await vi.waitFor(async () => expect(alleTests(await protokoll.alle())[0]!.note).toBe(3));
    await userEvent.click(
      within((await screen.findByText(/Note 3/)).closest('li')!).getByRole('button', {
        name: 'Bestätigen',
      }),
    );
    expect(await screen.findByText(/Gerade wartet keine Note/)).toBeInTheDocument();
    expect(testPunkte(await protokoll.alle())).toBe(TEST_PUNKTE.eintragen + TEST_PUNKTE.ergebnis);
    const tabelle = screen.getByRole('table');
    expect(within(tabelle).getByText('3 ✓')).toBeInTheDocument();
  });
});
