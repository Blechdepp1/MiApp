import { abstand, bewerteSchreiben, erlaubteAntworten, unterschiede } from './bewertung.ts';

const markiert = (eingabe: string, loesung: string) =>
  unterschiede(eingabe, loesung)
    .map((b) => (b.anders ? `[${b.zeichen}]` : b.zeichen))
    .join('');

describe('bewerteSchreiben', () => {
  it.each([
    ['house', 'house'],
    ['House', 'house'],
    ['  house ', 'house'],
    ['HOUSE.', 'house'],
    ['go', '(to) go'],
    ['to go', '(to) go'],
    ['large', 'big, large'],
    ['ice cream', 'ice  cream'],
    ["don't", 'don’t'],
  ])('„%s“ ist richtig für „%s“', (eingabe, loesung) => {
    expect(bewerteSchreiben(eingabe, loesung)).toBe('richtig');
  });

  it.each([
    ['hose', 'house'],
    ['housse', 'house'],
    ['hosue', 'house'],
    ['beautifull', 'beautiful'],
    ['wednesdy', 'wednesday'],
  ])('„%s“ ist fast richtig für „%s“', (eingabe, loesung) => {
    expect(bewerteSchreiben(eingabe, loesung)).toBe('fast');
  });

  it.each([
    ['', 'house'],
    ['car', 'cat'],
    ['hus', 'house'],
    ['tree', 'house'],
  ])('„%s“ ist falsch für „%s“', (eingabe, loesung) => {
    expect(bewerteSchreiben(eingabe, loesung)).toBe('falsch');
  });
});

describe('erlaubteAntworten', () => {
  it('löst Klammern und Alternativen auf', () => {
    expect(erlaubteAntworten('(to) go / walk')).toEqual(['to go', 'go', 'walk']);
  });
});

describe('abstand', () => {
  it('zählt Vertauschungen als einen Fehler', () => {
    expect(abstand('hosue', 'house')).toBe(1);
    expect(abstand('house', 'house')).toBe(0);
    expect(abstand('', 'abc')).toBe(3);
    expect(abstand('kitten', 'sitting')).toBe(3);
  });
});

describe('unterschiede', () => {
  it('markiert die Stelle, die anders ist', () => {
    expect(markiert('nite', 'night')).toBe('ni[g][h]t');
    expect(markiert('frend', 'friend')).toBe('fr[i]end');
  });

  it('markiert fehlende, zusätzliche und vertauschte Buchstaben', () => {
    expect(markiert('hose', 'house')).toBe('ho[u]se');
    expect(markiert('housse', 'house')).toBe('hou[s]e');
    expect(markiert('hosue', 'house')).toBe('ho[u]s[e]');
  });

  it('markiert nichts, wenn alles stimmt, auch bei Großschreibung', () => {
    expect(markiert('Monday', 'Monday')).toBe('Monday');
    expect(markiert('monday', 'Monday')).toBe('Monday');
  });

  it('markiert alles bei ganz anderem Wort', () => {
    expect(markiert('x', 'night')).toBe('[n][i][g][h][t]');
  });
});
