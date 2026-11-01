import { gesamtPunkte, guthaben } from '../belohnung/logik.ts';
import { TEST_PUNKTE } from '../belohnung/werte.ts';
import { erstelleEreignis, type EreignisDaten, type LernEreignis } from '../daten/ereignisse.ts';
import { alleTests, ohneNote, testPunkte, testVorrang, zuBestaetigen } from './logik.ts';

// Ereignisse mit festen Zeiten bauen: n Tage nach dem 2.11.2026 (ein Montag)
function ereignis(daten: EreignisDaten, tag: number, stunde = 10): LernEreignis {
  return erstelleEreignis(daten, 'kind', new Date(2026, 10, 2 + tag, stunde));
}

function eingetragen(fach: 'englisch' | 'mathe', datum: string, tag = 0, lektionId?: string) {
  return ereignis(
    { typ: 'test-eingetragen', fach, art: 'klassenarbeit', datum, ...(lektionId && { lektionId }) },
    tag,
  );
}

describe('Tests und Klassenarbeiten', () => {
  it('zählt die Obergrenze je Gerät: ein anderes Gerät nimmt keine Punkte weg', () => {
    const handy = [1, 2, 3].map((t) => eingetragen('mathe', '2026-11-20', t));
    const tablet = erstelleEreignis(
      { typ: 'test-eingetragen', fach: 'mathe', art: 'test', datum: '2026-11-21' },
      'tablet',
      new Date(2026, 10, 2, 9),
    );
    expect(testPunkte([...handy, tablet])).toBe(4 * TEST_PUNKTE.eintragen);
  });

  it('nimmt einmal vergebene Punkte nie wieder weg, auch bei nachgetragenen Tests', () => {
    const t1 = eingetragen('englisch', '2026-11-01', 0);
    const t2 = eingetragen('englisch', '2026-11-10', 8);
    const verlauf = [
      t1,
      ereignis({ typ: 'test-ergebnis', testId: t1.id, note: 3 }, 1),
      ereignis({ typ: 'test-bestaetigt', testId: t1.id, note: 3 }, 1, 12),
      t2,
      ereignis({ typ: 'test-ergebnis', testId: t2.id, note: 2 }, 9),
      ereignis({ typ: 'test-bestaetigt', testId: t2.id, note: 2 }, 9, 12),
    ];
    // Ein vergessener Test vom 05.11. mit Note 1 wird erst später nachgetragen und bestätigt
    const vergessen = eingetragen('englisch', '2026-11-05', 15);
    const spaeter = [
      vergessen,
      ereignis({ typ: 'test-ergebnis', testId: vergessen.id, note: 1 }, 15, 11),
      ereignis({ typ: 'test-bestaetigt', testId: vergessen.id, note: 1 }, 15, 12),
      ereignis({ typ: 'test-geloescht', testId: t1.id }, 16),
    ];
    // Jedes neue Ereignis darf die Punkte nur gleich lassen oder erhöhen
    let vorher = testPunkte(verlauf);
    for (let i = 1; i <= spaeter.length; i++) {
      const jetzt = testPunkte([...verlauf, ...spaeter.slice(0, i)]);
      expect(jetzt).toBeGreaterThanOrEqual(vorher);
      vorher = jetzt;
    }
    expect(
      alleTests([...verlauf, ...spaeter]).find((t) => t.id === t2.id)!.punkte.verbesserung,
    ).toBe(TEST_PUNKTE.verbesserung);
  });

  it('bestätigt genau die Note, die die Eltern gesehen haben', () => {
    const t = eingetragen('mathe', '2026-11-05');
    const [test] = alleTests([
      t,
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 4 }, 4),
      ereignis({ typ: 'test-bestaetigt', testId: t.id, note: 3 }, 4, 12),
      // Ein Kind-Gerät mit vorgehender Uhr meldet danach noch eine andere Note
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 1 }, 4, 13),
    ]);
    expect(test).toMatchObject({ note: 3, bestaetigt: true });
  });

  it('entfernte Tests fragen nicht mehr nach der Note, behalten aber ihre Punkte', () => {
    const t = eingetragen('mathe', '2026-11-03');
    const ereignisse = [t, ereignis({ typ: 'test-geloescht', testId: t.id }, 1)];
    expect(ohneNote(alleTests(ereignisse), '2026-11-10')).toEqual([]);
    expect(testPunkte(ereignisse)).toBe(TEST_PUNKTE.eintragen);
  });

  it('gibt fürs Eintragen sofort Punkte, höchstens 3-mal pro Woche', () => {
    const woche1 = [0, 1, 2, 3].map((t) => eingetragen('mathe', '2026-11-20', t));
    const woche2 = eingetragen('mathe', '2026-11-27', 7);
    expect(testPunkte([...woche1, woche2])).toBe(4 * TEST_PUNKTE.eintragen);
    expect(alleTests(woche1).filter((t) => t.punkte.eintragen > 0)).toHaveLength(3);
  });

  it('zählt Note und Verbesserung erst nach Bestätigung durch die Eltern', () => {
    const erste = eingetragen('mathe', '2026-11-05');
    const zweite = eingetragen('mathe', '2026-11-12');
    const basis = [
      erste,
      ereignis({ typ: 'test-ergebnis', testId: erste.id, note: 4 }, 4),
      ereignis({ typ: 'test-bestaetigt', testId: erste.id }, 5),
      zweite,
      ereignis({ typ: 'test-ergebnis', testId: zweite.id, note: 3 }, 11),
    ];
    // Zweite Note noch nicht bestätigt: nur Eintragen + erstes Ergebnis
    expect(testPunkte(basis)).toBe(2 * TEST_PUNKTE.eintragen + TEST_PUNKTE.ergebnis);
    expect(zuBestaetigen(alleTests(basis)).map((t) => t.id)).toEqual([zweite.id]);

    const bestaetigt = [...basis, ereignis({ typ: 'test-bestaetigt', testId: zweite.id }, 12)];
    expect(testPunkte(bestaetigt)).toBe(
      2 * TEST_PUNKTE.eintragen + 2 * TEST_PUNKTE.ergebnis + TEST_PUNKTE.verbesserung,
    );
  });

  it('gibt Punkte unabhängig von der Note, Verbesserung nur im selben Fach', () => {
    const mathe = eingetragen('mathe', '2026-11-05');
    const englisch = eingetragen('englisch', '2026-11-12');
    const schlechter = eingetragen('mathe', '2026-11-19');
    const tests = alleTests([
      mathe,
      ereignis({ typ: 'test-ergebnis', testId: mathe.id, note: 2 }, 4),
      ereignis({ typ: 'test-bestaetigt', testId: mathe.id }, 4, 12),
      englisch,
      ereignis({ typ: 'test-ergebnis', testId: englisch.id, note: 1 }, 11),
      ereignis({ typ: 'test-bestaetigt', testId: englisch.id }, 11, 12),
      schlechter,
      ereignis({ typ: 'test-ergebnis', testId: schlechter.id, note: 5 }, 18),
      ereignis({ typ: 'test-bestaetigt', testId: schlechter.id }, 18, 12),
    ]);
    for (const t of tests) expect(t.punkte.ergebnis).toBe(TEST_PUNKTE.ergebnis);
    expect(tests.map((t) => t.punkte.verbesserung)).toEqual([0, 0, 0]);
  });

  it('nimmt bis zur Bestätigung die letzte Note, danach steht sie fest', () => {
    const t = eingetragen('mathe', '2026-11-05');
    const [test] = alleTests([
      t,
      // Ohne Note kann nichts bestätigt werden
      ereignis({ typ: 'test-bestaetigt', testId: t.id }, 3),
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 5 }, 4),
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 2 }, 5),
      ereignis({ typ: 'test-bestaetigt', testId: t.id }, 6),
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 1 }, 7),
      ereignis({ typ: 'test-ergebnis', testId: 'unbekannt', note: 1 }, 7),
    ]);
    expect(test).toMatchObject({ note: 2, bestaetigt: true });
  });

  it('fragt nach dem Termin nach der Note', () => {
    const vorbei = eingetragen('mathe', '2026-11-03');
    const heute = eingetragen('mathe', '2026-11-04');
    const spaeter = eingetragen('mathe', '2026-11-10');
    // Am Tag des Tests selbst wird noch nicht gefragt
    expect(ohneNote(alleTests([vorbei, heute, spaeter]), '2026-11-04').map((t) => t.datum)).toEqual(
      ['2026-11-03'],
    );
  });

  it('gibt der Lektion eines bald anstehenden Tests Vorrang', () => {
    const ereignisse = [
      eingetragen('englisch', '2026-11-06', 0, 'unit-5'),
      eingetragen('englisch', '2026-11-30', 0, 'unit-6'),
      eingetragen('englisch', '2026-10-30', 0, 'unit-4'),
    ];
    expect([...testVorrang(ereignisse, '2026-11-02')]).toEqual(['unit-5']);
  });

  it('fließt in Gesamtpunkte und Guthaben ein, zieht nie etwas ab', () => {
    const t = eingetragen('mathe', '2026-11-05');
    const ereignisse = [
      ereignis({ typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0 }, 0),
      t,
      ereignis({ typ: 'test-ergebnis', testId: t.id, note: 6 }, 4),
    ];
    expect(gesamtPunkte(ereignisse)).toBe(20 + TEST_PUNKTE.eintragen);
    expect(guthaben(ereignisse)).toBe(gesamtPunkte(ereignisse));
  });
});
