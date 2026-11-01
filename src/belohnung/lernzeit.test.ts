import { erstelleEreignis, type EreignisDaten } from '../daten/ereignisse.ts';
import { lernrate, lernzeitText, rundenDauernMs, STANDARD_PUNKTE_PRO_MINUTE } from './lernzeit.ts';

function um(uhrzeit: string, daten: EreignisDaten, geraet = 'kind') {
  return erstelleEreignis(daten, geraet, new Date(`2026-11-01T${uhrzeit}:00`));
}

const ANTWORT: EreignisDaten = {
  typ: 'antwort',
  listeId: 'l',
  wortId: 'w',
  uebung: 'erkennen',
  richtig: true,
};
// 10 + 10 × 2 = 30 Punkte
const RUNDE: EreignisDaten = { typ: 'runde-beendet', richtig: 10, mitHilfe: 0, verbessert: 0 };

describe('rundenDauernMs', () => {
  it('misst von der ersten Antwort bis zum Rundenende', () => {
    const e = [um('10:00', ANTWORT), um('10:02', ANTWORT), um('10:05', RUNDE)];
    expect(rundenDauernMs(e)).toEqual([5 * 60_000]);
  });

  it('begrenzt liegen gelassene Runden auf 30 Minuten und zu kurze auf 1 Minute', () => {
    const e = [um('10:00', ANTWORT), um('12:00', RUNDE), um('13:00', ANTWORT), um('13:00', RUNDE)];
    expect(rundenDauernMs(e)).toEqual([30 * 60_000, 60_000]);
  });

  it('trennt die Geräte', () => {
    const e = [
      um('10:00', ANTWORT, 'kind'),
      um('10:01', ANTWORT, 'eltern'),
      um('10:04', RUNDE, 'eltern'),
      um('10:05', RUNDE, 'kind'),
    ];
    expect(rundenDauernMs(e)).toEqual([3 * 60_000, 5 * 60_000]);
  });
});

describe('lernrate', () => {
  it('schätzt, solange es weniger als 3 Runden gibt', () => {
    const e = [um('10:00', ANTWORT), um('10:05', RUNDE)];
    expect(lernrate(e)).toEqual({
      punkteProMinute: STANDARD_PUNKTE_PRO_MINUTE,
      gemessen: false,
      runden: 1,
    });
  });

  it('rechnet ab 3 Runden mit den echten Punkten und Minuten', () => {
    const e = ['10', '11', '12'].flatMap((stunde) => [
      um(`${stunde}:00`, ANTWORT),
      um(`${stunde}:05`, RUNDE),
    ]);
    // 3 × 30 Punkte + 20 Tagesziel = 110 Punkte in 15 Minuten
    expect(lernrate(e)).toMatchObject({ gemessen: true, runden: 3 });
    expect(lernrate(e).punkteProMinute).toBeCloseTo(110 / 15);
  });
});

describe('lernzeitText', () => {
  it.each([
    [10, 9, '≈ 5 Min.'],
    [225, 9, '≈ 25 Min.'],
    [900, 9, '≈ 1 Std. 40 Min.'],
    [1080, 9, '≈ 2 Std.'],
    [4000, 9, '≈ 7 Std. 25 Min.'],
  ])('%i Punkte bei %i Punkten/Minute → %s', (punkte, rate, text) => {
    expect(lernzeitText(punkte, rate)).toBe(text);
  });
});
