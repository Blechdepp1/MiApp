import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { gesamtPunkte } from '../belohnung/logik.ts';
import { erstelleEreignis, type EreignisDaten, type LernEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { ErfolgeSeite } from './ErfolgeSeite.tsx';
import {
  gutschriften,
  kalender,
  tageMitErfolgen,
  wochenAnfang,
  woche,
  zusammengefasst,
} from './verlauf.ts';

// Sonntag
const HEUTE = '2026-11-01';

function am(tag: string, stunde: number, daten: EreignisDaten, geraet = 'kind'): LernEreignis {
  return erstelleEreignis(
    daten,
    geraet,
    new Date(`${tag}T${String(stunde).padStart(2, '0')}:00:00`),
  );
}

// 10 + 2 × richtig Punkte
const runde = (tag: string, stunde: number, richtig = 5) =>
  am(tag, stunde, { typ: 'runde-beendet', richtig, mitHilfe: 0, verbessert: 0 });

function testMitNote(tag: string): LernEreignis[] {
  const eintrag = am(tag, 8, {
    typ: 'test-eingetragen',
    fach: 'englisch',
    art: 'vokabeltest',
    datum: tag,
  });
  return [
    eintrag,
    am(tag, 15, { typ: 'test-ergebnis', testId: eintrag.id, note: 2 }),
    am(tag, 19, { typ: 'test-bestaetigt', testId: eintrag.id, note: 2 }, 'eltern'),
  ];
}

describe('gutschriften', () => {
  it('ergibt zusammen genau die Gesamtpunkte, mit Tagesziel, Test und Level', () => {
    const ereignisse = [
      runde('2026-10-30', 16, 20),
      runde('2026-10-30', 17, 20),
      ...testMitNote('2026-10-31'),
      am('2026-10-31', 20, { typ: 'eingeloest', belohnungId: 'eis', preis: 50, name: 'Eis' }),
    ];
    const liste = gutschriften(ereignisse);
    expect(liste.reduce((s, g) => s + g.punkte, 0)).toBe(gesamtPunkte(ereignisse));
    expect(liste.map((g) => g.text)).toEqual([
      'Vokabelrunde geschafft',
      'Vokabelrunde geschafft',
      'Tagesziel geschafft',
      'Vokabeltest in Englisch eingetragen',
      'Note für Vokabeltest in Englisch eingetragen',
      // 120 + 20 + 30 Punkte: Schwelle 150 erreicht
      'Level 2 erreicht: Spurenleserin',
      'Eis eingelöst',
    ]);
  });

  it('feiert eine bessere Note als beim letzten Mal', () => {
    const zweiter = am('2026-10-31', 8, {
      typ: 'test-eingetragen',
      fach: 'englisch',
      art: 'test',
      datum: '2026-10-31',
    });
    const ereignisse = [
      ...testMitNote('2026-10-20'),
      zweiter,
      am('2026-10-31', 19, { typ: 'test-bestaetigt', testId: zweiter.id, note: 1 }, 'eltern'),
    ];
    const liste = gutschriften(ereignisse);
    expect(liste.find((g) => g.symbol === '📈')).toMatchObject({
      text: 'Besser als beim letzten Mal in Englisch!',
      punkte: 50,
    });
    expect(liste.reduce((s, g) => s + g.punkte, 0)).toBe(gesamtPunkte(ereignisse));
  });

  it('fasst mehrere Runden eines Tages zusammen', () => {
    const tage = tageMitErfolgen(
      gutschriften([runde(HEUTE, 9), runde(HEUTE, 10), runde(HEUTE, 11)]),
    );
    expect(zusammengefasst(tage[0]!.eintraege).map((g) => [g.text, g.punkte])).toEqual([
      ['3 Vokabelrunden geschafft', 60],
      ['Tagesziel geschafft', 20],
    ]);
  });
});

describe('woche und kalender', () => {
  const tage = tageMitErfolgen(
    gutschriften([runde('2026-10-20', 9), runde('2026-10-27', 9), runde('2026-10-27', 10)]),
  );

  it('beginnt am Montag', () => {
    expect(wochenAnfang(HEUTE)).toBe('2026-10-26');
    expect(wochenAnfang('2026-10-26')).toBe('2026-10-26');
  });

  it('zählt Punkte je Tag und die Vorwoche', () => {
    const w = woche(tage, HEUTE);
    expect(w.tage.map((t) => t.punkte)).toEqual([0, 60, 0, 0, 0, 0, 0]);
    expect(w.tage[1]!.tagesziel).toBe(true);
    expect(w.punkte).toBe(60);
    expect(w.letzteWoche).toBe(20);
  });

  it('legt den Monat ab Montag an', () => {
    // 1. Oktober 2026 ist ein Donnerstag
    const felder = kalender(tage, 2026, 9);
    expect(felder.slice(0, 3)).toEqual([null, null, null]);
    expect(felder[3]).toMatchObject({ tag: '2026-10-01', geuebt: false });
    expect(felder.filter((f) => f?.geuebt).map((f) => f!.tag)).toEqual([
      '2026-10-20',
      '2026-10-27',
    ]);
    expect(felder).toHaveLength(3 + 31);
  });
});

function zeige(ereignisse: LernEreignis[]) {
  render(
    <ProtokollProvider protokoll={protokollImArbeitsspeicher(ereignisse)}>
      <ErfolgeSeite heute={HEUTE} />
    </ProtokollProvider>,
  );
}

describe('ErfolgeSeite', () => {
  it('lädt ohne Erfolge zur ersten Runde ein', async () => {
    zeige([]);
    expect(await screen.findByText(/Starte deine erste Runde/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Vokabeln üben/ })).toBeInTheDocument();
  });

  it('zeigt Zahlen, Woche, Kalender und Verlauf', async () => {
    zeige([runde('2026-10-20', 9), runde('2026-10-31', 9), runde(HEUTE, 9), runde(HEUTE, 10)]);
    const zahlen = await screen.findByRole('region', { name: 'Alles zusammen' });
    expect(within(zahlen).getByText('Lerntage').nextSibling).toHaveTextContent('3');
    expect(within(zahlen).getByText('Runden').nextSibling).toHaveTextContent('4');

    const woche = screen.getByRole('region', { name: 'Diese Woche' });
    expect(within(woche).getByLabelText('Sonntag: 60 Punkte, Tagesziel geschafft')).toBeVisible();
    expect(within(woche).getByText(/80 Punkte gesammelt. Das ist schon mehr/)).toBeVisible();

    const kalender = screen.getByRole('region', { name: 'Dein Kalender' });
    expect(within(kalender).getByText('November')).toBeVisible();
    expect(within(kalender).getByLabelText('1. geübt, Tagesziel')).toBeVisible();
    await userEvent.click(within(kalender).getByRole('button', { name: 'Monat davor' }));
    expect(within(kalender).getByText('Im Oktober hast du an 2 Tagen gelernt.')).toBeVisible();
    expect(within(kalender).getByRole('button', { name: 'Monat danach' })).toBeEnabled();

    const verlauf = screen.getByRole('region', { name: 'So hast du gesammelt' });
    const tage = within(verlauf).getAllByRole('heading', { level: 3 });
    expect(tage.map((t) => t.textContent)).toEqual(['Heute', 'Gestern', 'Dienstag, 20. Oktober']);
    expect(within(verlauf).getByText('2 Vokabelrunden geschafft')).toBeVisible();
  });

  it('zeigt ältere Tage erst auf Wunsch', async () => {
    const ereignisse = Array.from({ length: 9 }, (_, i) =>
      runde(`2026-10-${String(10 + i).padStart(2, '0')}`, 9),
    );
    zeige(ereignisse);
    const verlauf = await screen.findByRole('region', { name: 'So hast du gesammelt' });
    expect(within(verlauf).getAllByRole('heading', { level: 3 })).toHaveLength(7);
    await userEvent.click(within(verlauf).getByRole('button', { name: 'Ältere Tage zeigen' }));
    expect(within(verlauf).getAllByRole('heading', { level: 3 })).toHaveLength(9);
    expect(within(verlauf).queryByRole('button', { name: 'Ältere Tage zeigen' })).toBeNull();
  });
});
