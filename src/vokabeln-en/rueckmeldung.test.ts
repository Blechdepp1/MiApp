import type { WortStand } from './leitner.ts';
import { lobText } from './rueckmeldung.ts';

const heute = '2026-11-02';
const stand = (fach: number, faelligAb = heute): WortStand => ({ fach, faelligAb, erkannt: 2 });

describe('lobText (V12)', () => {
  it('sagt, wann das Wort wiederkommt', () => {
    expect(lobText(stand(3), stand(4, '2026-11-09'), { heute })).toBe(
      'Richtig! Das sitzt. Es kommt erst in 7 Tagen wieder.',
    );
    expect(lobText(stand(2), stand(3, '2026-11-05'), { heute })).toBe(
      'Richtig! Es kommt in 3 Tagen wieder.',
    );
  });

  it('erkennt neue, verbesserte und mit Hilfe geschaffte Wörter', () => {
    expect(lobText(stand(0, '0000-00-00'), stand(1), { heute })).toMatch(/neu für dich/);
    expect(lobText(stand(1), stand(2), { heute, verbessert: true })).toMatch(/jetzt kannst du es/);
    expect(lobText(stand(2), stand(2), { heute, mitHilfe: true })).toMatch(/mit Hilfe/);
  });

  it('wechselt sonst das Lob ab', () => {
    const texte = [0, 1, 2].map((nr) => lobText(stand(1), stand(1), { heute, nr }));
    expect(new Set(texte).size).toBe(3);
  });
});
