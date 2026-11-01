import { erstelleEreignis, type EreignisDaten, type LernEreignis } from '../daten/ereignisse.ts';
import type { Vokabelliste } from '../vokabeln-en/typen.ts';
import {
  fortschritt,
  schwierigeWoerter,
  wochenUebersicht,
  wortDetails,
  zuletztGeuebt,
} from './statistik.ts';
import { berechneStaende } from '../vokabeln-en/leitner.ts';

const LISTE: Vokabelliste = {
  id: 'u5',
  name: 'Unit 5',
  woerter: [
    { id: 'a', en: 'began', de: 'anfangen' },
    { id: 'b', en: 'blew', de: 'pusten' },
    { id: 'c', en: 'broke', de: 'zerbrechen' },
  ],
};

// Ereignis am Tag n nach dem 2.11.2026 (Montag), um 10:mm Uhr Ortszeit
function am(tag: number, daten: EreignisDaten, minute = 0): LernEreignis {
  return erstelleEreignis(daten, 'kind', new Date(2026, 10, 2 + tag, 10, minute));
}

function antwort(tag: number, wortId: string, richtig: boolean, minute = 0) {
  return am(tag, { typ: 'antwort', listeId: 'u5', wortId, uebung: 'erkennen', richtig }, minute);
}

const runde = (tag: number, minute = 8) =>
  am(tag, { typ: 'runde-beendet', richtig: 3, mitHilfe: 0, verbessert: 0 }, minute);

// Wort „a“ an genug Tagen richtig, damit es Fach 3 erreicht (Pausen 1 und 1 Tag)
const SICHER = [antwort(0, 'a', true), antwort(1, 'a', true), antwort(2, 'a', true)];

describe('Statistik für Eltern', () => {
  it('zählt neu, lernt und sicher pro Lektion', () => {
    const ereignisse = [...SICHER, antwort(2, 'b', false)];
    expect(fortschritt(LISTE, berechneStaende(ereignisse))).toEqual({
      neu: 1,
      lernt: 1,
      sicher: 1,
      gesamt: 3,
    });
  });

  it('zeigt pro Wort Lernstand, zuletzt geübt und Fehler', () => {
    const ereignisse = [...SICHER, antwort(3, 'b', false), antwort(4, 'b', false, 5)];
    const details = wortDetails(LISTE, ereignisse);
    expect(details.map((d) => [d.wort.id, d.stand, d.falsch])).toEqual([
      ['a', 'sicher', 0],
      ['b', 'lernt', 2],
      ['c', 'neu', 0],
    ]);
    expect(details[1]!.zuletzt).toBe(ereignisse.at(-1)!.zeit);
    expect(zuletztGeuebt('u5', ereignisse)).toBe(ereignisse.at(-1)!.zeit);
    expect(zuletztGeuebt('andere', ereignisse)).toBeUndefined();
  });

  it('findet die schwierigsten Wörter der letzten 14 Tage', () => {
    const ereignisse = [
      antwort(0, 'c', false),
      antwort(20, 'b', false),
      antwort(20, 'b', false, 1),
      antwort(21, 'a', false),
      antwort(21, 'a', true, 1),
    ];
    const schwer = schwierigeWoerter([LISTE], ereignisse, '2026-11-23');
    // „c“ liegt mehr als 14 Tage zurück
    expect(schwer.map((s) => [s.wort.en, s.falsch])).toEqual([
      ['blew', 2],
      ['began', 1],
    ]);
  });

  it('fasst die letzten 7 Tage zusammen', () => {
    const ereignisse = [
      ...SICHER,
      // Am 2.11.; zählt am 9.11. nicht mehr zur Woche
      runde(0),
      antwort(5, 'b', true),
      runde(5, 10),
      antwort(6, 'c', true),
      runde(6, 6),
      runde(6, 30),
    ];
    const woche = wochenUebersicht(ereignisse, '2026-11-08', [LISTE]);
    expect(woche.tage.map((t) => t.tag)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(woche.tage.map((t) => t.runden)).toEqual([1, 0, 0, 0, 0, 1, 2]);

    const spaeter = wochenUebersicht(ereignisse, '2026-11-09', [LISTE]);
    expect(spaeter).toMatchObject({ lerntage: 2, runden: 3 });
    // Runde am 7.11.: 10 Minuten, am 8.11.: 6 Minuten; die dritte hat keine Antwort davor
    expect(spaeter.minuten).toBe(16);
  });

  it('zählt Wörter, die in der Woche sicher geworden sind', () => {
    expect(wochenUebersicht(SICHER, '2026-11-04', [LISTE]).neuSicher).toBe(1);
    expect(wochenUebersicht(SICHER, '2026-11-20', [LISTE]).neuSicher).toBe(0);
  });
});
