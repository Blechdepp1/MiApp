import { BELOHNUNGEN_START, pruefeBelohnungen, pruefeLevel } from './inhalte.ts';
import { LEVEL_START } from './werte.ts';

describe('pruefeBelohnungen', () => {
  const kino = { id: 'kino', symbol: '🎬', name: 'Kino', preis: 1300 };

  it('akzeptiert die Startwerte und eine leere Liste', () => {
    expect(pruefeBelohnungen(BELOHNUNGEN_START)).toBeNull();
    expect(pruefeBelohnungen([])).toBeNull();
  });

  it.each([
    [{ ...kino, preis: 0 }, 'Preis'],
    [{ ...kino, preis: 12.5 }, 'Preis'],
    [{ ...kino, preis: Number.NaN }, 'Preis'],
    [{ ...kino, name: '  ' }, 'Namen'],
    [{ ...kino, name: 'x'.repeat(41) }, 'höchstens'],
    [{ ...kino, symbol: '' }, 'Symbol'],
  ])('lehnt %o verständlich ab', (belohnung, teil) => {
    expect(pruefeBelohnungen([belohnung])).toContain(teil);
  });

  it('lehnt doppelte ids und Unsinn ab', () => {
    expect(pruefeBelohnungen([kino, kino])).toBe('Ungültige Daten');
    expect(pruefeBelohnungen({})).toBe('Ungültige Daten');
    expect(pruefeBelohnungen([null])).toBe('Ungültige Daten');
  });
});

describe('pruefeLevel', () => {
  it('akzeptiert die Startwerte', () => {
    expect(pruefeLevel(LEVEL_START)).toBeNull();
  });

  it.each([
    [[], 'mindestens ein Level'],
    [[{ ab: 10, titel: 'A' }], 'bei 0 Punkten'],
    [
      [
        { ab: 0, titel: 'A' },
        { ab: 0, titel: 'B' },
      ],
      'mehr Punkte',
    ],
    [
      [
        { ab: 0, titel: 'A' },
        { ab: 100, titel: '' },
      ],
      'braucht einen Titel',
    ],
    [[{ ab: -1, titel: 'A' }], 'ganze Zahl'],
    [[{ ab: 0, titel: 'x'.repeat(41) }], 'höchstens'],
  ])('lehnt %o ab', (stufen, teil) => {
    expect(pruefeLevel(stufen)).toContain(teil);
  });
});
