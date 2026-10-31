import { STANDARD } from './einstellungen.ts';
import { FARBEN, kontrast, themaVariablen, wendeThemaAn } from './thema.ts';

describe('kontrast', () => {
  it('rechnet wie WCAG: Schwarz auf Weiß ist 21:1', () => {
    expect(kontrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(kontrast('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });
});

describe.each(Object.entries(FARBEN))('Farben „%s“', (_name, f) => {
  // WCAG AA für normalen Text: mindestens 4,5:1
  it.each([
    ['Text auf Hintergrund', f.text, f.hintergrund],
    ['Text auf Fläche', f.text, f.flaeche],
    ['leiser Text auf Hintergrund', f.textLeise, f.hintergrund],
    ['leiser Text auf Fläche', f.textLeise, f.flaeche],
    ['Schrift auf Akzent', f.aufAkzent, f.akzent],
    ['Schrift auf Belohnung', f.aufBelohnung, f.belohnung],
  ])('%s erfüllt WCAG AA', (_was, vorne, hinten) => {
    expect(kontrast(vorne, hinten)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('wendeThemaAn', () => {
  it('setzt alle CSS-Variablen am Dokument', () => {
    wendeThemaAn({ ...STANDARD, hintergrund: 'dunkel', schriftgroesse: 'gross' });
    const stil = document.documentElement.style;
    expect(stil.getPropertyValue('--farbe-hintergrund')).toBe(FARBEN.dunkel.hintergrund);
    expect(stil.getPropertyValue('--schrift-groesse')).toBe('24px');
    expect(document.documentElement.dataset.hintergrund).toBe('dunkel');
    for (const name of Object.keys(themaVariablen(STANDARD))) {
      expect(stil.getPropertyValue(name)).not.toBe('');
    }
  });
});
