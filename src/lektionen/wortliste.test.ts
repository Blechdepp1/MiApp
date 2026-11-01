import { liesWortliste } from './wortliste.ts';

describe('liesWortliste', () => {
  it('liest Paare mit verschiedenen Trennern', () => {
    const text = [
      'began – anfangen, beginnen',
      'blew - pusten, blasen, wehen',
      'broke\tzerbrechen',
      'brought = (mit)bringen',
      'built; bauen',
      'cat—Katze',
    ].join('\n');
    expect(liesWortliste(text)).toEqual({
      paare: [
        { en: 'began', de: 'anfangen, beginnen' },
        { en: 'blew', de: 'pusten, blasen, wehen' },
        { en: 'broke', de: 'zerbrechen' },
        { en: 'brought', de: '(mit)bringen' },
        { en: 'built', de: 'bauen' },
      ],
      fehler: ['cat—Katze'],
    });
  });

  it('erhält Bindestriche im Wort und entfernt Aufzählungszeichen', () => {
    expect(liesWortliste('1. T-shirt - T-Shirt\n• ice-cream – Eis\n\n').paare).toEqual([
      { en: 'T-shirt', de: 'T-Shirt' },
      { en: 'ice-cream', de: 'Eis' },
    ]);
  });

  it('meldet Zeilen ohne Übersetzung', () => {
    expect(liesWortliste('did\ncame – kommen').fehler).toEqual(['did']);
  });
});
