import {
  bereinige,
  speicherImArbeitsspeicher,
  STANDARD,
  type Einstellungen,
} from './einstellungen.ts';

describe('bereinige', () => {
  it('liefert Standardwerte ohne gespeicherte Daten', () => {
    expect(bereinige(undefined)).toEqual(STANDARD);
  });

  it('übernimmt gültige Werte', () => {
    const gespeichert: Einstellungen = {
      schriftgroesse: 'sehr-gross',
      abstand: 'weit',
      hintergrund: 'dunkel',
      schrift: 'opendyslexic',
      tempo: 0.7,
      wortVorsagen: 'aus',
      nachsprechen: 'aus',
    };
    expect(bereinige(gespeichert)).toEqual(gespeichert);
  });

  it('ersetzt unbekannte Werte durch Standardwerte', () => {
    const kaputt = {
      hintergrund: 'pink',
      schriftgroesse: 42,
      tempo: 5,
    } as unknown as Partial<Einstellungen>;
    expect(bereinige(kaputt)).toEqual(STANDARD);
  });
});

describe('speicherImArbeitsspeicher', () => {
  it('gibt zurück, was gespeichert wurde', async () => {
    const speicher = speicherImArbeitsspeicher();
    expect(await speicher.laden()).toBeUndefined();
    await speicher.speichern({ ...STANDARD, abstand: 'weit' });
    expect(await speicher.laden()).toEqual({ ...STANDARD, abstand: 'weit' });
  });
});
