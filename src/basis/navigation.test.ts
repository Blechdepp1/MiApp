import { navigiere, pfad, zielAusHash, ZIELE } from './navigation.ts';

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

describe('navigiere (flacher Verlauf)', () => {
  // Wartet, bis ein history.back() in jsdom angekommen ist
  function warteAufHash(hash: string) {
    return vi.waitFor(() => expect(window.location.hash).toBe(hash));
  }

  beforeEach(() => {
    window.history.replaceState(null, '', '#/');
  });

  it('legt von der Startseite aus genau einen Eintrag an', () => {
    const vorher = window.history.length;
    navigiere('vokabeln');
    expect(window.location.hash).toBe('#/vokabeln');
    expect(window.history.length).toBe(vorher + 1);
  });

  it('ersetzt beim Wechsel zwischen Unterseiten, statt zu stapeln', () => {
    navigiere('vokabeln');
    const vorher = window.history.length;
    navigiere('einstellungen');
    expect(window.location.hash).toBe('#/einstellungen');
    expect(window.history.length).toBe(vorher);
  });

  it('geht mit „Zurück“ im Verlauf zurück zur Startseite', async () => {
    navigiere('einstellungen');
    navigiere('start');
    await warteAufHash('#/');
  });

  it('springt zur Startseite, wenn die App direkt auf einer Unterseite geöffnet wurde', () => {
    window.history.replaceState(null, '', '#/eltern');
    const vorher = window.history.length;
    navigiere('start');
    expect(window.location.hash).toBe('#/');
    expect(window.history.length).toBe(vorher);
  });

  it('meldet jeden Wechsel als hashchange', () => {
    const zuhoerer = vi.fn();
    window.addEventListener('hashchange', zuhoerer);
    navigiere('belohnungen');
    window.removeEventListener('hashchange', zuhoerer);
    expect(zuhoerer).toHaveBeenCalled();
  });
});
