import { act, render, screen, within } from '@testing-library/react';
import { navigiere } from '../basis/navigation.ts';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis, type LernEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { speicherImArbeitsspeicher } from '../basis/einstellungen.ts';
import { EinstellungenProvider } from '../basis/EinstellungenKontext.tsx';
import { berechneStaende, schluessel } from './leitner.ts';
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
  sprich = vi.fn(async () => 'fertig' as const),
) {
  const nochEinmal = vi.fn();
  const ansicht = render(
    <ProtokollProvider protokoll={protokoll}>
      <Runde
        listen={[LISTE]}
        ereignisse={ereignisse}
        heute={HEUTE}
        onNochEinmal={nochEinmal}
        sprich={sprich}
      />
    </ProtokollProvider>,
  );
  return { ...ansicht, protokoll, nochEinmal, sprich };
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
  it('spricht nach jeder Antwort das englische Wort noch einmal vor', async () => {
    const { container, sprich } = zeige();
    const gefragt = frage(container);
    const wort = LISTE.woerter.find((w) => w.en === gefragt || w.de === gefragt)!;
    const optionen = within(container.querySelector('.uebung-optionen')!).getAllByRole('button', {
      name: (name) => !name.startsWith('Vorlesen'),
    });
    await userEvent.click(optionen[0]!);
    expect(sprich).toHaveBeenCalledWith(wort.en, 'en', expect.anything());
  });

  it('spricht nicht vor, wenn es in den Einstellungen aus ist', async () => {
    const sprich = vi.fn(async () => 'fertig' as const);
    const { container } = render(
      <EinstellungenProvider speicher={speicherImArbeitsspeicher({ wortVorsagen: 'aus' })}>
        <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
          <Runde
            listen={[LISTE]}
            ereignisse={[]}
            heute={HEUTE}
            onNochEinmal={vi.fn()}
            sprich={sprich}
          />
        </ProtokollProvider>
      </EinstellungenProvider>,
    );
    await new Promise((r) => setTimeout(r, 20));
    const optionen = within(container.querySelector('.uebung-optionen')!).getAllByRole('button', {
      name: (name) => !name.startsWith('Vorlesen'),
    });
    await userEvent.click(optionen[0]!);
    expect(sprich).not.toHaveBeenCalled();
  });

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

  describe('Extra-Runde', () => {
    const heuteGeuebt = ['house', 'dog', 'cat'].map((id) => antwortAm(id, true, HEUTE));

    it('bietet eine Extra-Runde an, wenn heute nichts mehr fällig ist', () => {
      zeige(heuteGeuebt);
      expect(screen.getByText(/Das ist eine Extra-Runde zum Wiederholen/)).toBeInTheDocument();
      expect(screen.getByText('Wort 1 von 3')).toBeInTheDocument();
    });

    it('gibt Punkte, verschiebt die Wörter aber nicht im Wiederholungsplan', async () => {
      const protokoll = protokollImArbeitsspeicher();
      const { container } = zeige(heuteGeuebt, protokoll);
      for (let i = 0; i < 3; i++) await antworte(container, true);
      expect(await screen.findByText('+16 Punkte')).toBeInTheDocument();
      const neu = (await protokoll.alle()).filter((e) => e.typ === 'antwort');
      const staende = berechneStaende([...heuteGeuebt, ...neu]);
      expect(staende.get(schluessel('l', 'house'))).toMatchObject({
        fach: 1,
        faelligAb: '2026-11-02',
      });
    });

    it('lässt beliebig viele Extra-Runden zu', async () => {
      const { container, nochEinmal } = zeige(heuteGeuebt);
      for (let i = 0; i < 3; i++) await antworte(container, true);
      await userEvent.click(await screen.findByRole('button', { name: 'Noch eine Runde' }));
      expect(nochEinmal).toHaveBeenCalled();
    });
  });

  describe('Aufhören mitten in der Runde', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '#/');
      window.history.pushState({ ueberStart: true }, '', '#/vokabeln');
    });

    // Erste Frage richtig beantworten, ohne auf „Weiter“ zu tippen
    async function ersteAntwort(container: HTMLElement) {
      const loesung = LISTE.woerter.find((w) => w.en === frage(container))!.de;
      const optionen = [...container.querySelectorAll<HTMLButtonElement>('.uebung-option')];
      await userEvent.click(optionen.find((o) => o.textContent === loesung)!);
    }

    it('fragt nicht, solange noch nichts beantwortet ist', () => {
      zeige();
      act(() => navigiere('start'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('fragt beim App-Zurück nach und bleibt bei „Weiter üben“', async () => {
      const { container } = zeige();
      await ersteAntwort(container);
      act(() => navigiere('start'));
      const frage = screen.getByRole('dialog', { name: 'Möchtest du aufhören?' });
      expect(frage).toHaveTextContent('deine Punkte für diese Runde');
      expect(frage).toHaveTextContent('Nur noch 2 Wörter!');
      await userEvent.click(screen.getByRole('button', { name: 'Weiter üben' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(window.location.hash).toBe('#/vokabeln');
    });

    it('geht bei „Später weiter“ zur Startseite', async () => {
      const { container } = zeige();
      await ersteAntwort(container);
      act(() => navigiere('start'));
      await userEvent.click(screen.getByRole('button', { name: 'Später weiter' }));
      await vi.waitFor(() => expect(window.location.hash).toBe('#/'));
    });

    it('fragt auch bei der Zurück-Taste des Handys nach', async () => {
      const { container } = zeige();
      await ersteAntwort(container);
      act(() => window.history.back());
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(window.location.hash).toBe('#/vokabeln');
    });

    it('fragt nach dem Ende der Runde nicht mehr', async () => {
      const { container } = zeige();
      for (let i = 0; i < 3; i++) await antworte(container, true);
      await screen.findByText(/Punkte/);
      act(() => navigiere('start'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('meldet freundlich, wenn es gar keine Wörter gibt', () => {
    render(
      <ProtokollProvider protokoll={protokollImArbeitsspeicher()}>
        <Runde
          listen={[{ id: 'leer', name: 'Leer', woerter: [] }]}
          ereignisse={[]}
          heute={HEUTE}
          onNochEinmal={() => {}}
        />
      </ProtokollProvider>,
    );
    expect(screen.getByText(/noch keine Wörter/)).toBeInTheDocument();
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
