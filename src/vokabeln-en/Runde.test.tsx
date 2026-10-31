import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis, type LernEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { Runde } from './Runde.tsx';
import type { Vokabelliste } from './typen.ts';

const HEUTE = '2026-11-01';

const LISTE: Vokabelliste = {
  id: 'l',
  name: 'Test',
  woerter: [
    { id: 'house', en: 'house', de: 'Haus' },
    { id: 'dog', en: 'dog', de: 'Hund' },
    { id: 'cat', en: 'cat', de: 'Katze' },
  ],
};

function zeige(
  ereignisse: LernEreignis[] = [],
  protokoll: Protokoll = protokollImArbeitsspeicher(),
) {
  const nochEinmal = vi.fn();
  const ansicht = render(
    <ProtokollProvider protokoll={protokoll}>
      <Runde listen={[LISTE]} ereignisse={ereignisse} heute={HEUTE} onNochEinmal={nochEinmal} />
    </ProtokollProvider>,
  );
  return { ...ansicht, protokoll, nochEinmal };
}

function frage(container: HTMLElement): string {
  return container.querySelector('.uebung-frage > span:last-child')!.textContent!;
}

// Beantwortet die aktuelle Frage richtig oder absichtlich falsch
async function antworte(container: HTMLElement, richtig: boolean) {
  const gefragt = frage(container);
  const wort = LISTE.woerter.find((w) => w.en === gefragt || w.de === gefragt)!;
  const loesung = gefragt === wort.en ? wort.de : wort.en;
  const optionen = within(container.querySelector('.uebung-optionen')!).getAllByRole('button', {
    name: (name) => !name.startsWith('Vorlesen'),
  });
  const ziel = optionen.find((o) => (o.textContent === loesung) === richtig)!;
  await userEvent.click(ziel);
  await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));
}

function antwortAm(wortId: string, richtig: boolean, tag = '2026-10-31') {
  return erstelleEreignis(
    { typ: 'antwort', listeId: 'l', wortId, uebung: 'erkennen', richtig },
    'kind',
    new Date(`${tag}T12:00:00`),
  );
}

describe('Runde', () => {
  it('spielt eine Runde durch und vergibt die Punkte', async () => {
    const { container, protokoll } = zeige();
    expect(screen.getByText('Wort 1 von 3')).toBeInTheDocument();
    for (let i = 0; i < 3; i++) await antworte(container, true);

    expect(await screen.findByText('+16 Punkte')).toBeInTheDocument();
    const ereignisse = await protokoll.alle();
    expect(ereignisse.filter((e) => e.typ === 'antwort')).toHaveLength(3);
    expect(ereignisse.at(-1)).toMatchObject({ typ: 'runde-beendet', richtig: 3, verbessert: 0 });
    expect(screen.getByText('Diese Wörter kannst du jetzt:')).toBeInTheDocument();
  });

  it('zeigt nach einem Fehler die Lösung und fragt das Wort am Ende noch einmal', async () => {
    const { container } = zeige();
    const erstesWort = frage(container);
    const optionen = container.querySelectorAll<HTMLButtonElement>('.uebung-option');
    const falsch = [...optionen].find(
      (o) => o.textContent !== LISTE.woerter.find((w) => w.en === erstesWort)!.de,
    )!;
    await userEvent.click(falsch);

    const rueckmeldung = screen.getByRole('status');
    expect(rueckmeldung).toHaveTextContent('So ist es richtig:');
    expect(rueckmeldung).toHaveTextContent('Das Wort kommt gleich noch einmal.');
    expect(container.querySelector('[data-zustand="richtig"]')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    expect(screen.getByText('Wort 2 von 4')).toBeInTheDocument();
    await antworte(container, true);
    await antworte(container, true);
    expect(frage(container)).toBe(erstesWort);
    await antworte(container, true);
    // 10 + 3 richtige × 2, der Fehler kostet nichts
    expect(await screen.findByText('+16 Punkte')).toBeInTheDocument();
  });

  it('fragt ein Wort höchstens einmal zusätzlich', async () => {
    const { container } = zeige();
    await antworte(container, false);
    await antworte(container, true);
    await antworte(container, true);
    expect(screen.getByText('Wort 4 von 4')).toBeInTheDocument();
    const wiederholung = frage(container);
    await userEvent.click(
      [...container.querySelectorAll<HTMLButtonElement>('.uebung-option')].find(
        (o) => o.textContent !== LISTE.woerter.find((w) => w.en === wiederholung)!.de,
      )!,
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('kommt gleich noch einmal');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));
    expect(await screen.findByText(/Punkte/)).toBeInTheDocument();
  });

  it('gibt den Tagesziel-Bonus bei der zweiten Runde des Tages', async () => {
    const ersteRunde = erstelleEreignis(
      { typ: 'runde-beendet', richtig: 0, mitHilfe: 0, verbessert: 0 },
      'kind',
      new Date(`${HEUTE}T09:00:00`),
    );
    const { container } = zeige([ersteRunde]);
    for (let i = 0; i < 3; i++) await antworte(container, true);
    expect(await screen.findByText('+36 Punkte')).toBeInTheDocument();
    expect(screen.getByText(/Tagesziel geschafft!/)).toBeInTheDocument();
  });

  it('zählt ein gestern falsches Wort als verbessert', async () => {
    const protokoll = protokollImArbeitsspeicher();
    const { container } = zeige([antwortAm('house', false)], protokoll);
    // house ist fällig und kommt zuerst, danach die zwei neuen Wörter
    expect(frage(container)).toBe('house');
    for (let i = 0; i < 3; i++) await antworte(container, true);
    expect((await protokoll.alle()).at(-1)).toMatchObject({ typ: 'runde-beendet', verbessert: 1 });
    expect(await screen.findByText('+21 Punkte')).toBeInTheDocument();
  });

  it('fragt nach einmal Erkennen Deutsch → Englisch', async () => {
    const gestern = ['house', 'dog', 'cat'].map((id) => antwortAm(id, true));
    const { container } = zeige(gestern);
    expect(
      screen.getByText('Was heißt das auf Englisch? Tippe auf das richtige Wort.'),
    ).toBeInTheDocument();
    expect(['Haus', 'Hund', 'Katze']).toContain(frage(container));
  });

  it('lobt, wenn heute nichts mehr fällig ist', () => {
    const heute = ['house', 'dog', 'cat'].map((id) => antwortAm(id, true, HEUTE));
    zeige(heute);
    expect(screen.getByText(/Für heute hast du alle Wörter geübt/)).toBeInTheDocument();
  });

  describe('Schreiben', () => {
    // Zweimal erkannt (an zwei Tagen), also ist heute Schreiben dran
    const zweimalErkannt = ['house', 'dog', 'cat'].flatMap((id) => [
      antwortAm(id, true, '2026-10-29'),
      antwortAm(id, true, '2026-10-30'),
    ]);

    async function schreibe(text: string, hilfe = 0) {
      for (let i = 0; i < hilfe; i++) {
        await userEvent.click(screen.getByRole('button', { name: '💡 Hilfe' }));
      }
      await userEvent.type(screen.getByRole('textbox'), `${text}{Enter}`);
    }

    function gefragtesWort(container: HTMLElement) {
      return LISTE.woerter.find((w) => w.de === frage(container))!;
    }

    it('fragt nach zweimal Erkennen das Schreiben ab', () => {
      const { container } = zeige(zweimalErkannt);
      expect(screen.getByText('Schreib das Wort auf Englisch.')).toBeInTheDocument();
      expect(['Haus', 'Hund', 'Katze']).toContain(frage(container));
    });

    it('zählt „fast richtig“ als richtig und zeigt die Schreibweise', async () => {
      const { container, protokoll } = zeige(zweimalErkannt);
      // Gleich fällige Wörter kommen in Listenreihenfolge: zuerst „Haus“
      expect(gefragtesWort(container).id).toBe('house');
      await schreibe('housx');
      expect(screen.getByRole('status')).toHaveTextContent('Fast richtig!');
      expect((await protokoll.alle()).at(-1)).toMatchObject({ richtig: true, fastRichtig: true });
    });

    it('gibt mit Hilfe 1 statt 2 Punkte, aber nie Abzug', async () => {
      const { container, protokoll } = zeige(zweimalErkannt);
      for (let i = 0; i < 3; i++) {
        const wort = gefragtesWort(container);
        await schreibe(wort.en, i === 0 ? 1 : 0);
        await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));
      }
      // 10 + 2 × 2 ohne Hilfe + 1 × 1 mit Hilfe
      expect(await screen.findByText('+15 Punkte')).toBeInTheDocument();
      expect((await protokoll.alle()).at(-1)).toMatchObject({ richtig: 2, mitHilfe: 1 });
    });
  });

  it('bietet nach der Runde „Noch eine Runde“ an', async () => {
    const { container, nochEinmal } = zeige();
    for (let i = 0; i < 3; i++) await antworte(container, true);
    await userEvent.click(await screen.findByRole('button', { name: 'Noch eine Runde' }));
    expect(nochEinmal).toHaveBeenCalled();
  });
});
