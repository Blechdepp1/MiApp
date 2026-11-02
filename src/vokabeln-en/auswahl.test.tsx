import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis, type LernEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import type { Lektion } from '../lektionen/lektion.ts';
import { LektionenProvider } from '../lektionen/LektionenKontext.tsx';
import { lektionenImArbeitsspeicher } from '../lektionen/speicher.ts';
import { tagVon } from '../belohnung/logik.ts';
import { berechneStaende, lektionsRundeAuswaehlen, plusTage, RUNDE_MAX } from './leitner.ts';
import { woerterFuer } from './modus.ts';
import type { Vokabelliste } from './typen.ts';
import { VokabelSeite } from './VokabelSeite.tsx';

const HEUTE = '2026-11-02';

function liste(id: string, anzahl: number): Vokabelliste {
  return {
    id,
    name: `Unit ${id}`,
    woerter: Array.from({ length: anzahl }, (_, i) => ({
      id: `w${i}`,
      en: `word${i}`,
      de: `Wort${i}`,
    })),
  };
}

function antwort(listeId: string, wortId: string, richtig: boolean, tag: string): LernEreignis {
  return erstelleEreignis(
    { typ: 'antwort', listeId, wortId, uebung: 'erkennen', richtig },
    'kind',
    new Date(`${tag}T10:00:00`),
  );
}

describe('lektionsRundeAuswaehlen', () => {
  it('nimmt Fälliges und Neues und füllt mit geübten Wörtern derselben Lektion auf', () => {
    const l = liste('a', 14);
    // w0–w9 gestern geübt (fällig heute: Fach 1, Pause 1 Tag), w10–w13 neu
    const geuebt = Array.from({ length: 10 }, (_, i) => antwort('a', `w${i}`, true, '2026-11-01'));
    const staende = berechneStaende(geuebt);
    const runde = lektionsRundeAuswaehlen(l, staende, HEUTE, () => 0.5);
    expect(runde).toHaveLength(RUNDE_MAX);
    expect(runde.every((w) => w.liste.id === 'a')).toBe(true);
  });

  it('füllt auf, auch wenn heute nichts fällig ist', () => {
    const l = liste('a', 8);
    const heuteGeuebt = l.woerter.map((w) => antwort('a', w.id, true, HEUTE));
    const runde = lektionsRundeAuswaehlen(l, berechneStaende(heuteGeuebt), HEUTE, () => 0.5);
    expect(runde).toHaveLength(8);
  });
});

describe('woerterFuer', () => {
  const listen = [liste('a', 3), liste('b', 3)];

  it('lässt beim Mix die Runde selbst wählen', () => {
    expect(woerterFuer({ art: 'mix' }, listen, [], new Map(), HEUTE)).toBeUndefined();
  });

  it('nimmt bei „knifflig“ nur Wörter mit Fehlern, die häufigsten zuerst', () => {
    const ereignisse = [
      antwort('b', 'w1', false, '2026-11-01'),
      antwort('b', 'w1', false, HEUTE),
      antwort('a', 'w2', false, HEUTE),
      antwort('a', 'w0', true, HEUTE),
    ];
    const woerter = woerterFuer(
      { art: 'schwierig' },
      listen,
      ereignisse,
      berechneStaende(ereignisse),
      HEUTE,
    )!;
    expect(woerter.map((w) => `${w.liste.id}/${w.wort.id}`)).toEqual(['b/w1', 'a/w2']);
  });
});

const LEKTIONEN: Lektion[] = [
  {
    id: 'u5',
    fach: 'englisch',
    titel: 'Unit 5',
    erstellt: '2026-10-20T10:00:00Z',
    geaendert: '2026-10-20T10:00:00Z',
    inhalt: {
      art: 'vokabeln',
      woerter: [
        { id: 'w1', en: 'house', de: 'Haus' },
        { id: 'w2', en: 'dog', de: 'Hund' },
        { id: 'w3', en: 'cat', de: 'Katze' },
      ],
    },
  },
  {
    id: 'u4',
    fach: 'englisch',
    titel: 'Unit 4',
    erstellt: '2026-10-01T10:00:00Z',
    geaendert: '2026-10-01T10:00:00Z',
    status: 'archiviert',
    inhalt: {
      art: 'vokabeln',
      woerter: [
        { id: 'w1', en: 'red', de: 'rot' },
        { id: 'w2', en: 'blue', de: 'blau' },
      ],
    },
  },
  {
    id: 'u6',
    fach: 'englisch',
    titel: 'Unit 6',
    erstellt: '2026-10-25T10:00:00Z',
    geaendert: '2026-10-25T10:00:00Z',
    status: 'pausiert',
    inhalt: { art: 'vokabeln', woerter: [{ id: 'w1', en: 'tree', de: 'Baum' }] },
  },
];

function zeige(ereignisse: LernEreignis[] = []) {
  render(
    <ProtokollProvider protokoll={protokollImArbeitsspeicher(ereignisse)}>
      <LektionenProvider speicher={lektionenImArbeitsspeicher(LEKTIONEN)}>
        <VokabelSeite zufall={() => 0.5} />
      </LektionenProvider>
    </ProtokollProvider>,
  );
}

describe('Auswahl vor der Runde', () => {
  it('bietet Mix, Lektionen und knifflige Wörter an; pausierte Lektionen nicht', async () => {
    // Unit 4 ist archiviert: dabei nur, was sie schon geübt hat
    zeige([antwort('u4', 'w1', true, '2026-10-05')]);
    expect(await screen.findByRole('button', { name: /Mix für heute/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Unit 5/ })).toHaveAccessibleName(/3 neue Wörter/);
    expect(screen.getByText('Ältere Lektionen (1)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unit 6/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Knifflige Wörter üben/ })).toBeDisabled();
  });

  it('übt nur die gewählte Lektion und kommt nach der Runde zurück zur Auswahl', async () => {
    zeige();
    await userEvent.click(await screen.findByRole('button', { name: /^Unit 5/ }));
    expect(screen.getByText('📖 Du übst jetzt: Unit 5')).toBeInTheDocument();
    expect(screen.getByText('Wort 1 von 3')).toBeInTheDocument();

    for (let i = 0; i < 3; i++) {
      const optionen = document.querySelectorAll<HTMLButtonElement>('.uebung-option');
      const englisch = document.querySelector('.uebung-frage > span:last-child')!.textContent;
      const richtig = { house: 'Haus', dog: 'Hund', cat: 'Katze' }[englisch as 'house']!;
      [...optionen].find((o) => o.textContent?.includes(richtig))!.click();
      await userEvent.click(await screen.findByRole('button', { name: 'Weiter →' }));
    }
    await userEvent.click(await screen.findByRole('button', { name: 'Etwas anderes üben' }));
    expect(await screen.findByRole('button', { name: /Mix für heute/ })).toBeInTheDocument();
  });

  it('zeigt einen anstehenden Test an der Lektion', async () => {
    // Die Seite rechnet mit dem echten Datum: Test für morgen eintragen
    const morgen = plusTage(tagVon(new Date().toISOString()), 1);
    const mitTest = { ...LEKTIONEN[0]!, klassenarbeit: morgen };
    render(
      <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
        <LektionenProvider speicher={lektionenImArbeitsspeicher([mitTest, LEKTIONEN[1]!])}>
          <VokabelSeite />
        </LektionenProvider>
      </ProtokollProvider>,
    );
    const karte = (await screen.findByRole('button', { name: /^Unit 5/ })).closest('li')!;
    expect(within(karte).getByText('📝 Test morgen')).toBeInTheDocument();
  });
});
