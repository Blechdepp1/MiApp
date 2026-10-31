import { pfad, zielAusHash, ZIELE } from './navigation.ts';

describe('zielAusHash', () => {
  it.each([
    ['', 'start'],
    ['#/', 'start'],
    ['#/vokabeln', 'vokabeln'],
    ['#einstellungen', 'einstellungen'],
    ['#/gibtsnicht', 'start'],
  ])('%s → %s', (hash, ziel) => {
    expect(zielAusHash(hash)).toBe(ziel);
  });

  it('findet jedes Ziel über seinen eigenen Pfad wieder', () => {
    for (const ziel of ZIELE) expect(zielAusHash(pfad(ziel))).toBe(ziel);
  });
});
