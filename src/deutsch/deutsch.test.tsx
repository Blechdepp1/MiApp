import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { gutschriften, tageMitErfolgen, zusammengefasst } from '../erfolge/verlauf.ts';
import { ausJsonl, zuJsonl } from '../sync/abgleich.ts';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { berechneStaende, NEU_PRO_RUNDE } from '../vokabeln-en/leitner.ts';
import {
  bewerteAntippen,
  bewerteSchreiben,
  loesungText,
  normalisiere,
  woerterIm,
} from './bewertung.ts';
import { deutschAuswahl } from './auswahl.ts';
import { DeutschSeite } from './DeutschSeite.tsx';
import { THEMEN } from './themen.ts';
import type { AntippAufgabe, SchreibAufgabe, Thema } from './typen.ts';

const HEUTE = '2026-11-02';

describe('Themen nach Deutsch Fit', () => {
  it('haben eindeutige ids und stimmige Lösungen', () => {
    expect(new Set(THEMEN.map((t) => t.id)).size).toBe(THEMEN.length);
    for (const t of THEMEN) {
      expect(t.merkwissen.length).toBeGreaterThan(0);
      expect(new Set(t.woerter.map((a) => a.id)).size, t.id).toBe(t.woerter.length);
      for (const a of t.woerter) {
        expect(a.hilfe, a.id).toBeTruthy();
        if (a.art === 'waehlen')
          expect(
            a.richtig.every((r) => a.optionen.includes(r)),
            a.id,
          ).toBe(true);
        if (a.art === 'schreiben') expect(a.loesungen.length, a.id).toBeGreaterThan(0);
        if (a.art === 'antippen') {
          const n = woerterIm(a.satz).length;
          expect(
            a.richtig.every((i) => i >= 0 && i < n),
            a.id,
          ).toBe(true);
          expect(
            (a.kern ?? []).every((i) => a.richtig.includes(i)),
            a.id,
          ).toBe(true);
        }
      }
    }
  });

  it('markiert im Text die richtigen Wörter', () => {
    const alle = THEMEN.flatMap((t) => t.woerter).filter(
      (a): a is AntippAufgabe => a.art === 'antippen',
    );
    const loesung = (satzAnfang: string, frage: string) =>
      loesungText(alle.find((a) => a.satz.startsWith(satzAnfang) && a.frage.includes(frage))!);
    expect(loesung('Am ersten Tag', 'Nomen')).toBe('Tag, Klasse, Lina');
    expect(loesung('In der Pause', 'Nomen')).toBe('Pause, Lina, Mädchen, Schulhof');
    expect(loesung('In der Pause', 'Verb')).toBe('spielt');
    expect(loesung('Im Klassenraum', 'Adjektive')).toBe('neue, freundliche');
    expect(loesung('Am Ende', 'Adjektive')).toBe('müde, glücklich');
    expect(loesung('Am Morgen klingelt', 'Subjekt')).toBe('der Wecker');
    expect(loesung('Am Morgen klingelt', 'Prädikat')).toBe('klingelt');
    expect(loesung('Auf dem Schulhof', 'Subjekt')).toBe('die Kinder');
    expect(loesung('Unsere Klasse', 'Subjekt')).toBe('Unsere Klasse');
  });
});

const mehrzahl = (einzahl: string) =>
  THEMEN.flatMap((t) => t.woerter).find(
    (a): a is SchreibAufgabe => a.art === 'schreiben' && a.inhalt.startsWith(einzahl),
  )!;

describe('Bewertung', () => {
  it('ignoriert Leerzeichen am Rand und Satzzeichen am Ende', () => {
    expect(normalisiere('  die  Bücher. ')).toBe('die Bücher');
    expect(bewerteSchreiben('Bücher', mehrzahl('das Buch'))).toEqual({ richtig: true });
    expect(bewerteSchreiben('die Bücher', mehrzahl('das Buch'))).toEqual({ richtig: true });
  });

  it('gibt eigene Hinweise für groß/klein, Umlaut und Lücke', () => {
    expect(bewerteSchreiben('bücher', mehrzahl('das Buch'))).toEqual({
      richtig: false,
      hinweis: 'gross-klein',
    });
    // Milenas Fehler im Heft: „Buche“ ist nicht nur ein Umlaut-Fehler, „Baume“ schon
    expect(bewerteSchreiben('Baume', mehrzahl('der Baum'))).toEqual({
      richtig: false,
      hinweis: 'umlaut',
    });
    expect(bewerteSchreiben('Buche', mehrzahl('das Buch'))).toEqual({ richtig: false });
    const haustuer = THEMEN.flatMap((t) => t.woerter).find(
      (a) => a.id === 'no-zs-haus-tuer',
    ) as SchreibAufgabe;
    expect(bewerteSchreiben('Haus tür', haustuer)).toEqual({
      richtig: false,
      hinweis: 'leerzeichen',
    });
  });

  it('akzeptiert beim Subjekt die Wortgruppe oder ihren Kern, aber nichts außerhalb', () => {
    const a: AntippAufgabe = {
      id: 'x',
      art: 'antippen',
      frage: 'Subjekt',
      satz: 'Die Kinder spielen auf dem Schulhof.',
      richtig: [0, 1],
      kern: [1],
    };
    expect(bewerteAntippen([0, 1], a)).toBe(true);
    expect(bewerteAntippen([1], a)).toBe(true);
    expect(bewerteAntippen([0], a)).toBe(false);
    expect(bewerteAntippen([1, 2], a)).toBe(false);
    const ohneKern = { ...a, kern: undefined };
    expect(bewerteAntippen([1], ohneKern)).toBe(false);
  });
});

const KLEIN: Thema[] = [
  {
    id: 'de-test',
    titel: 'Testthema',
    symbol: '🧪',
    seiten: 'S. 1',
    merkwissen: ['Nomen schreibt man groß.'],
    woerter: [
      {
        id: 'a1',
        art: 'waehlen',
        frage: 'Welche Wortart ist das?',
        inhalt: 'Hund',
        optionen: ['Nomen', 'Verb', 'Adjektiv'],
        richtig: ['Nomen'],
        hilfe: 'Artikelprobe: der Hund.',
      },
      {
        id: 'a2',
        art: 'schreiben',
        frage: 'Schreibe die Mehrzahl.',
        inhalt: 'der Baum → die …',
        loesungen: ['Bäume'],
        hilfe: 'Achte auf ä.',
      },
      {
        id: 'a3',
        art: 'antippen',
        frage: 'Tippe das Verb an.',
        satz: 'Lina spielt Ball.',
        richtig: [1],
        hilfe: 'Was tut Lina?',
      },
    ],
  },
];

describe('deutschAuswahl', () => {
  it('nimmt im Mix zuerst höchstens fünf neue Aufgaben, in Heft-Reihenfolge', () => {
    const woerter = deutschAuswahl({ art: 'mix' }, THEMEN, new Map(), HEUTE);
    expect(woerter).toHaveLength(NEU_PRO_RUNDE);
    expect(woerter[0]!.liste.id).toBe('de-wortarten');
  });

  it('nimmt bei einem Thema nur dessen Aufgaben', () => {
    const woerter = deutschAuswahl({ art: 'thema', id: 'de-verben' }, THEMEN, new Map(), HEUTE);
    expect(woerter.every((w) => w.liste.id === 'de-verben')).toBe(true);
  });
});

describe('DeutschSeite', () => {
  it('übt ein Thema: wählen, schreiben, antippen, mit Hinweis und Wiederholung', async () => {
    const protokoll = protokollImArbeitsspeicher();
    render(
      <ProtokollProvider protokoll={protokoll}>
        <DeutschSeite themen={KLEIN} zufall={() => 0.5} />
      </ProtokollProvider>,
    );
    await userEvent.click(await screen.findByRole('button', { name: /Testthema/ }));
    expect(screen.getByText('Du übst jetzt: Testthema')).toBeInTheDocument();

    // 1. Wählen: richtig
    await userEvent.click(screen.getByRole('button', { name: 'Nomen' }));
    expect(await screen.findByText(/Richtig! Super gemacht!/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    // 2. Schreiben: Umlaut vergessen → eigener Hinweis, Prüffrage, kommt nochmal
    await userEvent.type(screen.getByRole('textbox'), 'Baume');
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Fast! Denk an ä, ö oder ü. Richtig ist:');
    expect(status).toHaveTextContent('Bäume');
    expect(status).toHaveTextContent('Achte auf ä.');
    expect(status).toHaveTextContent('kommt gleich noch einmal');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    // 3. Antippen mit Tipp: richtig, zählt als „mit Hilfe“
    await userEvent.click(screen.getByRole('button', { name: '💡 Tipp' }));
    expect(screen.getByText('💡 Was tut Lina?')).toBeInTheDocument();
    const satz = screen.getByRole('group', { name: 'Wörter im Satz' });
    await userEvent.click(within(satz).getByRole('button', { name: 'spielt' }));
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(await screen.findByText(/Der Tipp hat geholfen/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    // 4. Die falsche Aufgabe kommt noch einmal
    expect(screen.getByText('Aufgabe 4 von 4')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'Bäume');
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Weiter →' }));

    expect(await screen.findByText(/Geschafft!/)).toBeInTheDocument();
    const alle = await protokoll.alle();
    expect(
      alle.filter((e) => e.typ === 'antwort').map((e) => e.typ === 'antwort' && e.uebung),
    ).toEqual(['de-waehlen', 'de-schreiben', 'de-antippen', 'de-schreiben']);
    expect(alle.at(-1)).toMatchObject({
      typ: 'runde-beendet',
      fach: 'deutsch',
      richtig: 2,
      mitHilfe: 1,
    });
    // Wiederholungsplan: das mit Tipp geschaffte Wort steigt nicht auf
    expect(berechneStaende(alle).get('de-test/a3')).toMatchObject({ fach: 1 });
  });

  it('zeigt Merkwissen zum Vorlesen', async () => {
    render(
      <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
        <DeutschSeite themen={KLEIN} />
      </ProtokollProvider>,
    );
    await userEvent.click(await screen.findByText('💡 Merkwissen'));
    expect(screen.getByText('Nomen schreibt man groß.')).toBeVisible();
  });
});

describe('Deutsch im Abgleich und bei den Erfolgen', () => {
  it('übernimmt Deutsch-Antworten und Runden aus Dropbox', () => {
    const ereignisse = [
      erstelleEreignis(
        { typ: 'antwort', listeId: 'de-nomen', wortId: 'x', uebung: 'de-schreiben', richtig: true },
        'kind',
      ),
      erstelleEreignis(
        { typ: 'runde-beendet', richtig: 3, mitHilfe: 0, verbessert: 0, fach: 'deutsch' },
        'kind',
      ),
    ];
    expect(ausJsonl(zuJsonl(ereignisse))).toEqual(ereignisse);
  });

  it('nennt Deutschrunden bei den Erfolgen eigens', () => {
    const runde = (fach?: 'deutsch') =>
      erstelleEreignis(
        { typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0, ...(fach && { fach }) },
        'kind',
        new Date(`${HEUTE}T10:00:00`),
      );
    const tag = tageMitErfolgen(gutschriften([runde(), runde('deutsch'), runde('deutsch')]))[0]!;
    // Gleiche Uhrzeit: Reihenfolge egal
    expect(
      zusammengefasst(tag.eintraege)
        .map((g) => g.text)
        .sort(),
    ).toEqual(['2 Deutschrunden geschafft', 'Tagesziel geschafft', 'Vokabelrunde geschafft']);
  });
});
