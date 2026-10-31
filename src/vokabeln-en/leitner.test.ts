import { erstelleEreignis, type Uebung } from '../daten/ereignisse.ts';
import {
  berechneStaende,
  extraRundeAuswaehlen,
  naechsterStand,
  NEU_PRO_RUNDE,
  plusTage,
  RUNDE_MAX,
  rundeAuswaehlen,
  schluessel,
  uebungFuer,
  type WortStand,
} from './leitner.ts';
import type { Vokabelliste } from './typen.ts';

const NEU: WortStand = { fach: 0, faelligAb: '0000-00-00', erkannt: 0 };

function antwort(tag: string, wortId: string, richtig: boolean, uebung: Uebung = 'erkennen') {
  return erstelleEreignis(
    { typ: 'antwort', listeId: 'l', wortId, uebung, richtig },
    'kind',
    new Date(`${tag}T12:00:00`),
  );
}

function liste(anzahl: number): Vokabelliste {
  return {
    id: 'l',
    name: 'Test',
    woerter: Array.from({ length: anzahl }, (_, i) => ({
      id: `w${i}`,
      en: `en${i}`,
      de: `de${i}`,
    })),
  };
}

describe('plusTage', () => {
  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(plusTage('2026-11-30', 1)).toBe('2026-12-01');
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01');
    expect(plusTage('2026-11-01', 14)).toBe('2026-11-15');
  });
});

describe('naechsterStand', () => {
  it('stuft ein neues Wort bei richtig in Fach 1 ein, morgen wieder', () => {
    const { stand } = naechsterStand(NEU, { richtig: true, uebung: 'erkennen' }, '2026-11-01');
    expect(stand).toEqual({ fach: 1, faelligAb: '2026-11-02', erkannt: 1 });
  });

  it('wartet in höheren Fächern länger', () => {
    let stand: WortStand = NEU;
    const tage = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-06', '2026-11-13'];
    const faellig: string[] = [];
    for (const tag of tage) {
      stand = naechsterStand(stand, { richtig: true, uebung: 'schreiben' }, tag).stand;
      faellig.push(stand.faelligAb);
    }
    expect(stand.fach).toBe(5);
    expect(faellig).toEqual(['2026-11-02', '2026-11-03', '2026-11-06', '2026-11-13', '2026-11-27']);
  });

  it('bleibt in Fach 5', () => {
    const { stand } = naechsterStand(
      { fach: 5, faelligAb: '2026-11-01', erkannt: 3 },
      { richtig: true, uebung: 'schreiben' },
      '2026-11-01',
    );
    expect(stand.fach).toBe(5);
  });

  it('setzt bei falsch zurück in Fach 1, morgen wieder', () => {
    const { stand } = naechsterStand(
      { fach: 4, faelligAb: '2026-11-01', erkannt: 3 },
      { richtig: false, uebung: 'schreiben' },
      '2026-11-01',
    );
    expect(stand).toMatchObject({ fach: 1, faelligAb: '2026-11-02', fehlerTag: '2026-11-01' });
  });

  it('stuft nach einem Fehler am selben Tag nicht hoch und zählt es nicht als verbessert', () => {
    const falsch = naechsterStand(NEU, { richtig: false, uebung: 'erkennen' }, '2026-11-01').stand;
    const ergebnis = naechsterStand(falsch, { richtig: true, uebung: 'erkennen' }, '2026-11-01');
    expect(ergebnis.verbessert).toBe(false);
    expect(ergebnis.stand).toMatchObject({ fach: 1, faelligAb: '2026-11-02', erkannt: 1 });
  });

  it('zählt ein früher falsches Wort an einem späteren Tag als verbessert', () => {
    const falsch = naechsterStand(NEU, { richtig: false, uebung: 'erkennen' }, '2026-11-01').stand;
    const ergebnis = naechsterStand(falsch, { richtig: true, uebung: 'erkennen' }, '2026-11-02');
    expect(ergebnis.verbessert).toBe(true);
    expect(ergebnis.stand.fehlerTag).toBeUndefined();
    expect(ergebnis.stand.fach).toBe(2);
  });

  it('stuft ein noch nicht fälliges Wort bei richtig nicht hoch (Extra-Runde)', () => {
    const stand: WortStand = { fach: 3, faelligAb: '2026-11-05', erkannt: 2 };
    const ergebnis = naechsterStand(stand, { richtig: true, uebung: 'schreiben' }, '2026-11-01');
    expect(ergebnis).toEqual({ stand, verbessert: false });
  });

  it('setzt ein noch nicht fälliges Wort bei falsch trotzdem zurück', () => {
    const stand: WortStand = { fach: 3, faelligAb: '2026-11-05', erkannt: 2 };
    const { stand: neu } = naechsterStand(
      stand,
      { richtig: false, uebung: 'schreiben' },
      '2026-11-01',
    );
    expect(neu).toMatchObject({ fach: 1, faelligAb: '2026-11-02' });
  });

  it('zählt Schreiben nicht als Erkennen', () => {
    const { stand } = naechsterStand(NEU, { richtig: true, uebung: 'schreiben' }, '2026-11-01');
    expect(stand.erkannt).toBe(0);
  });
});

describe('uebungFuer', () => {
  it('erst erkennen, dann Deutsch → Englisch wählen, nach 2× erkannt schreiben', () => {
    expect(uebungFuer({ ...NEU, erkannt: 0 })).toBe('erkennen');
    expect(uebungFuer({ ...NEU, erkannt: 1 })).toBe('waehlen-de-en');
    expect(uebungFuer({ ...NEU, erkannt: 2 })).toBe('schreiben');
  });
});

describe('berechneStaende', () => {
  it('spielt alle Antworten der Reihe nach ab', () => {
    const staende = berechneStaende([
      antwort('2026-11-01', 'w0', true),
      antwort('2026-11-02', 'w0', true, 'waehlen-de-en'),
      antwort('2026-11-02', 'w1', false),
    ]);
    expect(staende.get(schluessel('l', 'w0'))).toMatchObject({ fach: 2, erkannt: 2 });
    expect(staende.get(schluessel('l', 'w1'))).toMatchObject({ fach: 1, faelligAb: '2026-11-03' });
  });
});

describe('extraRundeAuswaehlen', () => {
  it('nimmt nur schon geübte Wörter, unsichere zuerst, höchstens 10', () => {
    const ereignisse = [
      ...Array.from({ length: 12 }, (_, i) => antwort('2026-10-31', `w${i}`, true)),
      antwort('2026-11-01', 'w0', true),
    ];
    const runde = extraRundeAuswaehlen([liste(20)], berechneStaende(ereignisse), () => 0.5);
    expect(runde).toHaveLength(RUNDE_MAX);
    expect(runde.every((r) => r.stand.fach === 1)).toBe(true);
    expect(runde.map((r) => r.wort.id)).not.toContain('w0');
  });

  it('mischt innerhalb eines Fachs, damit nicht immer dieselben kommen', () => {
    const staende = berechneStaende(
      Array.from({ length: 12 }, (_, i) => antwort('2026-10-31', `w${i}`, true)),
    );
    let n = 0;
    const absteigend = () => 1 - n++ / 100;
    const runde = extraRundeAuswaehlen([liste(12)], staende, absteigend);
    expect(runde[0]!.wort.id).toBe('w11');
  });

  it('ist leer, wenn noch nichts geübt wurde', () => {
    expect(extraRundeAuswaehlen([liste(5)], new Map())).toEqual([]);
  });
});

describe('rundeAuswaehlen', () => {
  it('nimmt beim ersten Mal höchstens 5 neue Wörter', () => {
    const runde = rundeAuswaehlen([liste(20)], new Map(), '2026-11-01');
    expect(runde).toHaveLength(NEU_PRO_RUNDE);
  });

  it('nimmt fällige Wörter zuerst, schwierigste zuerst, und füllt mit neuen auf', () => {
    const staende = berechneStaende([
      antwort('2026-10-30', 'w0', true),
      antwort('2026-10-31', 'w0', true),
      antwort('2026-10-31', 'w1', false),
      antwort('2026-10-31', 'w2', true),
    ]);
    const runde = rundeAuswaehlen([liste(6)], staende, '2026-11-01');
    // w0: Fach 2, fällig 01.11.; w1: Fach 1, fällig 01.11.; w2: Fach 1, fällig 01.11.
    expect(runde.map((r) => r.wort.id)).toEqual(['w1', 'w2', 'w0', 'w3', 'w4', 'w5']);
  });

  it('lässt noch nicht fällige Wörter weg', () => {
    const staende = berechneStaende([antwort('2026-11-01', 'w0', true)]);
    const runde = rundeAuswaehlen([liste(1)], staende, '2026-11-01');
    expect(runde).toEqual([]);
  });

  it('nimmt höchstens 10 Wörter', () => {
    const ereignisse = Array.from({ length: 15 }, (_, i) => antwort('2026-10-31', `w${i}`, true));
    const runde = rundeAuswaehlen([liste(20)], berechneStaende(ereignisse), '2026-11-01');
    expect(runde).toHaveLength(RUNDE_MAX);
    expect(runde.every((r) => r.stand.fach === 1)).toBe(true);
  });
});
