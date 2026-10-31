import { erstelleEreignis, sortiere, type EreignisDaten } from '../daten/ereignisse.ts';
import { gesamtPunkte, guthaben, level, punkteFuerRunde, tagesziel, tagVon } from './logik.ts';
import { LEVEL_START } from './werte.ts';

// Mittags, damit das Datum in jeder Zeitzone gleich bleibt
function am(tag: string, daten: EreignisDaten) {
  return erstelleEreignis(daten, 'kind', new Date(`${tag}T12:00:00`));
}

function runde(tag: string, richtig = 0, mitHilfe = 0, verbessert = 0) {
  return am(tag, { typ: 'runde-beendet', richtig, mitHilfe, verbessert });
}

describe('punkteFuerRunde', () => {
  it('10 pro Runde, 2 je richtig, 1 mit Hilfe, 5 je verbessertem Wort', () => {
    expect(punkteFuerRunde({ richtig: 0, mitHilfe: 0, verbessert: 0 })).toBe(10);
    expect(punkteFuerRunde({ richtig: 8, mitHilfe: 1, verbessert: 2 })).toBe(10 + 16 + 1 + 10);
  });
});

describe('gesamtPunkte', () => {
  it('ist 0 ohne Ereignisse', () => {
    expect(gesamtPunkte([])).toBe(0);
  });

  it('zählt falsche Antworten nicht negativ', () => {
    const falsch = am('2026-11-01', {
      typ: 'antwort',
      listeId: 'l',
      wortId: 'w',
      uebung: 'erkennen',
      richtig: false,
    });
    expect(gesamtPunkte([falsch, runde('2026-11-01', 0)])).toBe(10);
  });

  it('gibt den Tagesziel-Bonus bei 2 Runden genau einmal pro Tag', () => {
    const tag = '2026-11-01';
    expect(gesamtPunkte([runde(tag)])).toBe(10);
    expect(gesamtPunkte([runde(tag), runde(tag)])).toBe(20 + 20);
    expect(gesamtPunkte([runde(tag), runde(tag), runde(tag)])).toBe(30 + 20);
  });

  it('rechnet den Bonus für jeden Tag einzeln', () => {
    const e = [runde('2026-11-01'), runde('2026-11-01'), runde('2026-11-02'), runde('2026-11-03')];
    expect(gesamtPunkte(e)).toBe(40 + 20);
  });

  it('wird durch Einlösen nicht kleiner', () => {
    const e = [
      runde('2026-11-01', 5),
      am('2026-11-01', { typ: 'eingeloest', belohnungId: 'kino', preis: 15 }),
    ];
    expect(gesamtPunkte(e)).toBe(20);
  });
});

describe('guthaben', () => {
  it('zieht nur Einlösungen ab', () => {
    const e = [
      runde('2026-11-01', 20),
      runde('2026-11-01', 20),
      am('2026-11-01', { typ: 'eingeloest', belohnungId: 'kino', preis: 50 }),
    ];
    expect(gesamtPunkte(e)).toBe(120);
    expect(guthaben(e)).toBe(70);
  });
});

describe('tagesziel', () => {
  it('zählt die Runden des Tages', () => {
    const e = [runde('2026-11-01'), runde('2026-11-02')];
    expect(tagesziel(e, '2026-11-02')).toEqual({ runden: 1, ziel: 2, erreicht: false });
    expect(tagesziel([...e, runde('2026-11-02')], '2026-11-02').erreicht).toBe(true);
    expect(tagesziel(e, '2026-11-05').runden).toBe(0);
  });
});

describe('tagVon', () => {
  it('nimmt den Kalendertag des Geräts', () => {
    expect(tagVon(new Date('2026-11-01T12:00:00').toISOString())).toBe('2026-11-01');
  });
});

describe('level', () => {
  it('startet als Wort-Sammlerin', () => {
    expect(level(0)).toMatchObject({ nummer: 1, titel: 'Wort-Sammlerin', ab: 0, naechstesAb: 150 });
  });

  it('steigt genau an der Schwelle auf', () => {
    expect(level(149).nummer).toBe(1);
    expect(level(150)).toMatchObject({ nummer: 2, titel: 'Spurenleserin' });
  });

  it('berechnet den Fortschritt bis zum nächsten Level', () => {
    expect(level(325).fortschritt).toBeCloseTo((325 - 150) / (500 - 150));
  });

  it('kennt alle 8 Stufen der Start-Tabelle', () => {
    expect(LEVEL_START.map((s) => level(s.ab).nummer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(level(7000)).toMatchObject({ titel: 'Sprach-Legende', sterne: 0, naechstesAb: 9500 });
  });

  it('vergibt nach dem letzten Level alle 2500 Punkte einen Stern', () => {
    expect(level(9499).sterne).toBe(0);
    expect(level(9500)).toMatchObject({ nummer: 8, sterne: 1, ab: 9500, naechstesAb: 12000 });
    expect(level(14600)).toMatchObject({ sterne: 3, fortschritt: (14600 - 14500) / 2500 });
  });

  it('nutzt eine eigene Tabelle der Eltern', () => {
    const eigene = [
      { ab: 0, titel: 'Start' },
      { ab: 10, titel: 'Profi' },
    ];
    expect(level(12, eigene)).toMatchObject({ nummer: 2, titel: 'Profi', naechstesAb: 2510 });
  });
});

describe('Ereignisse', () => {
  it('bekommen eine eindeutige id, das Gerät und die Zeit', () => {
    const a = runde('2026-11-01');
    const b = runde('2026-11-01');
    expect(a.id).not.toBe(b.id);
    expect(a.geraet).toBe('kind');
    expect(a.zeit).toBe(new Date('2026-11-01T12:00:00').toISOString());
  });

  it('werden nach Zeit sortiert', () => {
    const spaeter = runde('2026-11-02');
    const frueher = runde('2026-11-01');
    expect(sortiere([spaeter, frueher])).toEqual([frueher, spaeter]);
  });
});
