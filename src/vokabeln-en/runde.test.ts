import { antwortOptionen, mische, sprechtext } from './runde.ts';
import { BEISPIELLISTE } from './beispielliste.ts';

// Einfacher, wiederholbarer Zufall für Tests
function zufallAus(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

describe('mische', () => {
  it('behält alle Elemente', () => {
    const gemischt = mische([1, 2, 3, 4, 5], zufallAus(7));
    expect([...gemischt].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('antwortOptionen', () => {
  const woerter = BEISPIELLISTE.woerter;
  const haus = woerter[0]!;

  it('enthält die richtige Antwort und zwei andere', () => {
    const optionen = antwortOptionen(haus, woerter, 'de', zufallAus(3));
    expect(optionen).toHaveLength(3);
    expect(optionen).toContain(haus);
    expect(new Set(optionen.map((o) => o.de)).size).toBe(3);
  });

  it('kommt mit sehr kurzen Listen zurecht', () => {
    expect(antwortOptionen(haus, [haus], 'de')).toEqual([haus]);
  });

  it('nimmt keine Wörter mit gleicher Übersetzung', () => {
    const gleich = { id: 'home', en: 'home', de: 'Haus' };
    const optionen = antwortOptionen(haus, [haus, gleich, woerter[1]!], 'de', zufallAus(1));
    expect(optionen.map((o) => o.id).sort()).toEqual(['house', 'school']);
  });
});

describe('sprechtext', () => {
  it('liest Klammern nicht vor', () => {
    expect(sprechtext('(to) play')).toBe('to play');
  });
});
