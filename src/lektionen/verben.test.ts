import { antwortOptionen } from '../vokabeln-en/runde.ts';
import {
  alsVokabelliste,
  istVokabelLektion,
  pruefeLektion,
  umfang,
  verbFormen,
  type Lektion,
  type Verb,
} from './lektion.ts';

const go: Verb = { id: 'go', de: 'gehen', formen: ['go', 'went', 'gone'] };
const bring: Verb = { id: 'bring', de: 'bringen', formen: ['bring', 'brought', 'brought'] };
const put: Verb = { id: 'put', de: 'legen, stellen', formen: ['put', 'put', 'put'] };

function lektion(verben: unknown): Lektion {
  return {
    id: 'l',
    fach: 'englisch',
    titel: 'Irregular verbs',
    erstellt: '2026-11-02T10:00:00.000Z',
    geaendert: '2026-11-02T10:00:00.000Z',
    inhalt: { art: 'verben', verben } as Lektion['inhalt'],
  };
}

describe('unregelmäßige Verben', () => {
  it('macht aus jeder Form ein eigenes Wort mit eigenem Lernstand', () => {
    const reihe = 'go – went – gone';
    expect(verbFormen(go)).toEqual([
      { id: 'go-1', en: 'go', de: 'gehen – 1. Form (infinitive)', gruppe: 'go', reihe },
      { id: 'go-2', en: 'went', de: 'gehen – 2. Form (simple past)', gruppe: 'go', reihe },
      { id: 'go-3', en: 'gone', de: 'gehen – 3. Form (past participle)', gruppe: 'go', reihe },
    ]);
  });

  it('fasst gleiche Formen zusammen, damit klar ist, welche gemeint ist', () => {
    expect(verbFormen(bring).map((w) => [w.id, w.en, w.de])).toEqual([
      ['bring-1', 'bring', 'bringen – 1. Form (infinitive)'],
      ['bring-2', 'brought', 'bringen – 2. und 3. Form'],
    ]);
    expect(verbFormen(put).map((w) => w.de)).toEqual(['legen, stellen – alle drei Formen gleich']);
  });

  it('prüft Verb-Lektionen', () => {
    expect(pruefeLektion(lektion([go, bring]))).toBeNull();
    expect(pruefeLektion(lektion([]))).toBe('Die Lektion braucht mindestens ein Verb.');
    expect(pruefeLektion(lektion([{ ...go, formen: ['go', '', 'gone'] }]))).toBe(
      'Verb 1: Deutsch und alle drei Formen müssen ausgefüllt sein.',
    );
    expect(pruefeLektion(lektion([{ ...go, formen: ['go', 'went'] }]))).toBe('Ungültige Daten');
    expect(pruefeLektion(lektion([go, go]))).toBe('Ungültige Daten');
  });

  it('wird wie eine Vokabel-Lektion geübt', () => {
    const l = lektion([go, bring]);
    if (!istVokabelLektion(l)) throw new Error('keine Englisch-Lektion');
    expect(umfang(l)).toBe('2 Verben');
    expect(alsVokabelliste(l).woerter.map((w) => w.en)).toEqual([
      'go',
      'went',
      'gone',
      'bring',
      'brought',
    ]);
  });

  it('bietet beim Wählen die anderen Formen desselben Verbs an', () => {
    const alle = [
      ...verbFormen(go),
      ...verbFormen(bring),
      { id: 'h', en: 'house', de: 'Haus' },
      { id: 'g', en: 'garden', de: 'Garten' },
    ];
    const went = alle.find((w) => w.en === 'went')!;
    const optionen = antwortOptionen(went, alle, 'en', () => 0.5).map((w) => w.en);
    expect(optionen.sort()).toEqual(['go', 'gone', 'went']);
    // Normale Vokabeln bekommen keine Verbformen als Auswahl
    const haus = alle.find((w) => w.en === 'house')!;
    const fuerHaus = antwortOptionen(haus, alle, 'en', () => 0.5).map((w) => w.en);
    expect(fuerHaus).toContain('garden');
    expect(fuerHaus.filter((e) => !['house', 'garden'].includes(e))).toHaveLength(1);
  });
});
