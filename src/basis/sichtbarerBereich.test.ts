import { beobachteSichtbarenBereich } from './sichtbarerBereich.ts';

it('überträgt den sichtbaren Bereich in CSS-Variablen', () => {
  const vv = Object.assign(new EventTarget(), { height: 400, offsetTop: 0 });
  const fenster = { visualViewport: vv, document } as unknown as Window;
  const aufraeumen = beobachteSichtbarenBereich(fenster);
  const stil = document.documentElement.style;
  expect(stil.getPropertyValue('--sichtbar-hoehe')).toBe('400px');
  vv.height = 250;
  vv.offsetTop = 30;
  vv.dispatchEvent(new Event('resize'));
  expect(stil.getPropertyValue('--sichtbar-hoehe')).toBe('250px');
  expect(stil.getPropertyValue('--sichtbar-oben')).toBe('30px');
  aufraeumen();
  vv.height = 100;
  vv.dispatchEvent(new Event('resize'));
  expect(stil.getPropertyValue('--sichtbar-hoehe')).toBe('250px');
});

it('tut ohne visualViewport nichts', () => {
  expect(() =>
    beobachteSichtbarenBereich({ visualViewport: null } as unknown as Window)(),
  ).not.toThrow();
});
