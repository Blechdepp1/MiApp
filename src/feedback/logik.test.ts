import { erstelleEreignis } from '../daten/ereignisse.ts';
import { geraetInfo, rueckmeldungen } from './logik.ts';

describe('Rückmeldungen', () => {
  it('listet neueste zuerst und kennt erledigte', () => {
    const alt = erstelleEreignis(
      { typ: 'feedback', art: 'rueckmeldung', stimmung: 'gut', seite: 'start', version: '0.11.0' },
      'kind',
      new Date('2026-11-01T10:00:00Z'),
    );
    const neu = erstelleEreignis(
      { typ: 'feedback', art: 'fehler', text: 'Boom', seite: 'vokabeln', version: '0.11.0' },
      'kind',
      new Date('2026-11-02T10:00:00Z'),
    );
    const liste = rueckmeldungen([
      alt,
      neu,
      erstelleEreignis({ typ: 'feedback-erledigt', feedbackId: alt.id }, 'eltern'),
    ]);
    expect(liste.map((r) => [r.art, r.erledigt])).toEqual([
      ['fehler', false],
      ['rueckmeldung', true],
    ]);
    expect(liste[1]).toMatchObject({ stimmung: 'gut', seite: 'start' });
  });

  it('beschreibt das Gerät knapp', () => {
    expect(
      geraetInfo(
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe('Android 14 · Chrome 141');
    expect(geraetInfo('Mozilla/5.0 (Windows NT 10.0; rv:140.0) Gecko/20100101 Firefox/140.0')).toBe(
      'Windows · Firefox 140',
    );
    expect(geraetInfo('irgendwas')).toBe('');
  });
});
