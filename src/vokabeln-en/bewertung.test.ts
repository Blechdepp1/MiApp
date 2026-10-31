import { abstand, bewerteSchreiben, erlaubteAntworten } from './bewertung.ts';

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
