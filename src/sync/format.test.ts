import { DATENFORMAT, istZuNeu } from './format.ts';

describe('istZuNeu', () => {
  it('erkennt Dateien einer neueren App-Version', () => {
    expect(istZuNeu(JSON.stringify({ format: DATENFORMAT + 1, daten: [] }))).toBe(true);
    expect(istZuNeu(`{"format":${DATENFORMAT + 1}}\n{"id":"a"}\n`)).toBe(true);
  });

  it('liest aktuelle, alte und kaputte Dateien wie bisher', () => {
    expect(istZuNeu(JSON.stringify({ format: DATENFORMAT }))).toBe(false);
    expect(istZuNeu('{"geaendert":"2026-11-01T10:00:00Z"}')).toBe(false);
    expect(istZuNeu('{"id":"a"}\n{"id":"b"}\n')).toBe(false);
    expect(istZuNeu('{kaputt')).toBe(false);
    expect(istZuNeu('')).toBe(false);
  });
});
