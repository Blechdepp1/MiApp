import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { erstelleEreignis } from '../daten/ereignisse.ts';
import { protokollImArbeitsspeicher } from '../daten/protokoll.ts';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import { gutschriften, tageMitErfolgen, zusammengefasst } from '../erfolge/verlauf.ts';
import { ausJsonl, zuJsonl } from '../sync/abgleich.ts';
import { berechneStaende, gemischteRunde, NEU_PRO_RUNDE } from '../vokabeln-en/leitner.ts';
import { antwortOptionen, EINMALEINS, malTipp, REIHEN, sprechText } from './einmaleins.ts';
import { MatheSeite } from './MatheSeite.tsx';
import type { MatheThema } from './typen.ts';

const HEUTE = '2026-11-07';

describe('Einmaleins', () => {
  it('enthält jede Malaufgabe genau einmal und dazu die Geteilt-Aufgaben', () => {
    const alle = EINMALEINS.flatMap((t) => t.woerter);
    expect(new Set(alle.map((a) => a.id)).size).toBe(alle.length);
    expect(EINMALEINS.map((t) => t.id)).toEqual(REIHEN.map((n) => `ma-reihe-${n}`));
    for (const a of alle) {
      expect(a.ergebnis, a.id).toBe(a.op === 'mal' ? a.a * a.b : a.a / a.b);
      expect(Number.isInteger(a.ergebnis), a.id).toBe(true);
      expect(a.hilfe, a.id).toBeTruthy();
      // Der Tipp verrät das Ergebnis nicht
      if (a.op === 'mal' && a.a > 1 && a.a !== 10 && a.b !== 10) {
        expect(a.hilfe.split(/\D+/).includes(String(a.ergebnis)), a.id).toBe(false);
      }
    }
    expect(alle.find((a) => a.id === '7x8')).toMatchObject({ ergebnis: 56 });
    expect(alle.find((a) => a.id === '56d8')).toMatchObject({ ergebnis: 7 });
  });

  it('gibt Rechentricks über Kernaufgaben, bei Bedarf mit Tauschaufgabe', () => {
    expect(malTipp(9, 6)).toBe('Rechne 10 · 6 = 60, dann − 6.');
    expect(malTipp(7, 3)).toBe('Tauschaufgabe: 7 · 3 = 3 · 7. Rechne 2 · 7 = 14, dann noch + 7.');
    expect(malTipp(7, 7)).toBe('Rechne 5 · 7 = 35 und 2 · 7 = 14, dann zusammen.');
    expect(malTipp(7, 2)).toBe('Tauschaufgabe: 7 · 2 = 2 · 7. Verdopple: 7 + 7.');
  });

  it('bietet das Ergebnis und Verwechsler aus der Nachbarreihe an', () => {
    const a = EINMALEINS.flatMap((t) => t.woerter).find((x) => x.id === '7x8')!;
    const optionen = antwortOptionen(a, () => 0.5);
    expect(optionen).toHaveLength(3);
    expect(optionen).toContain(56);
    expect(optionen.every((o) => [48, 64, 49, 63, 56].includes(o))).toBe(true);
    const klein = EINMALEINS.flatMap((t) => t.woerter).find((x) => x.id === '2d2')!;
    expect(antwortOptionen(klein).every((o) => o > 0)).toBe(true);
  });

  it('liest Aufgaben so vor, wie man sie spricht', () => {
    expect(sprechText({ a: 7, b: 8, op: 'mal' })).toBe('7 mal 8');
    expect(sprechText({ a: 56, b: 8, op: 'geteilt' })).toBe('56 geteilt durch 8');
  });

  it('beginnt im Mix mit der 2er-Reihe, gemischt und mit höchstens fünf neuen', () => {
    const runde = gemischteRunde(null, EINMALEINS, new Map(), HEUTE, () => 0.3);
    expect(runde).toHaveLength(NEU_PRO_RUNDE);
    expect(runde.every((r) => r.liste.id === 'ma-reihe-2')).toBe(true);
  });
});

const KLEIN: MatheThema[] = [
  {
    id: 'ma-test',
    titel: 'Testreihe',
    symbol: '✖️',
    merkwissen: ['Mal 7 ist mal 5 und mal 2 zusammen.'],
    woerter: [
      { id: '7x8', a: 7, b: 8, op: 'mal', ergebnis: 56, hilfe: malTipp(7, 8) },
      {
        id: '56d8',
        a: 56,
        b: 8,
        op: 'geteilt',
        ergebnis: 7,
        hilfe: 'Welche Zahl mal 8 ergibt 56?',
      },
    ],
  },
];

function zeige(start = protokollImArbeitsspeicher()) {
  render(
    <ProtokollProvider protokoll={start}>
      {/* Zufall knapp unter 1: Mischen lässt die Reihenfolge unverändert */}
      <MatheSeite themen={KLEIN} zufall={() => 0.9999} />
    </ProtokollProvider>,
  );
  return start;
}

describe('MatheSeite', () => {
  it('übt eine Reihe: neue Aufgaben auswählen, falsche kommen wieder', async () => {
    const protokoll = zeige();
    await userEvent.click(await screen.findByRole('button', { name: /Testreihe/ }));

    // 1. Auswählen: richtig
    expect(screen.getByText('7 · 8 = ?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '56' }));
    expect(await screen.findByRole('status')).toHaveTextContent('7 · 8 = 56');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    // 2. Auswählen: falsch → Lösung, Tipp, kommt nochmal
    const falsch = within(document.querySelector('.uebung-optionen')!)
      .getAllByRole('button')
      .find((b) => b.textContent !== '7')!;
    await userEvent.click(falsch);
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Nicht schlimm! Richtig ist:');
    expect(status).toHaveTextContent('56 : 8 = 7');
    expect(status).toHaveTextContent('Welche Zahl mal 8 ergibt 56?');
    expect(status).toHaveTextContent('kommt gleich noch einmal');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter →' }));

    // 3. Die falsche Aufgabe noch einmal
    expect(screen.getByText('Aufgabe 3 von 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '7' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Weiter →' }));

    expect(await screen.findByText(/Geschafft!/)).toBeInTheDocument();
    const alle = await protokoll.alle();
    expect(alle.at(-1)).toMatchObject({ typ: 'runde-beendet', fach: 'mathe', richtig: 2 });
    expect(
      alle.filter((e) => e.typ === 'antwort').map((e) => e.typ === 'antwort' && e.uebung),
    ).toEqual(['ma-waehlen', 'ma-waehlen', 'ma-waehlen']);
  });

  it('lässt Bekanntes mit dem Ziffernblock eintippen, mit Tipp als „mit Hilfe“', async () => {
    const frueher = erstelleEreignis(
      { typ: 'antwort', listeId: 'ma-test', wortId: '7x8', uebung: 'ma-waehlen', richtig: true },
      'kind',
      new Date('2026-11-05T10:00:00'),
    );
    const protokoll = zeige(protokollImArbeitsspeicher([frueher]));
    await userEvent.click(await screen.findByRole('button', { name: /Testreihe/ }));

    expect(screen.getByText('Rechne im Kopf.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '💡 Tipp' }));
    expect(screen.getByText(/Tauschaufgabe: 7 · 8 = 8 · 7/)).toBeInTheDocument();
    const block = screen.getByRole('group', { name: 'Ziffernblock' });
    await userEvent.click(within(block).getByRole('button', { name: '5' }));
    await userEvent.click(within(block).getByRole('button', { name: '7' }));
    await userEvent.click(within(block).getByRole('button', { name: 'Letzte Ziffer löschen' }));
    await userEvent.click(within(block).getByRole('button', { name: '6' }));
    expect(screen.getByLabelText('Deine Antwort')).toHaveTextContent('56');
    await userEvent.click(within(block).getByRole('button', { name: 'Prüfen' }));

    expect(await screen.findByText(/Der Tipp hat geholfen/)).toBeInTheDocument();
    const alle = await protokoll.alle();
    expect(alle.at(-1)).toMatchObject({
      typ: 'antwort',
      uebung: 'ma-tippen',
      richtig: true,
      mitHilfe: true,
    });
    expect(berechneStaende(alle).get('ma-test/7x8')).toMatchObject({ fach: 1 });
  });

  it('nimmt am PC auch die Zifferntasten', async () => {
    const frueher = erstelleEreignis(
      { typ: 'antwort', listeId: 'ma-test', wortId: '7x8', uebung: 'ma-waehlen', richtig: true },
      'kind',
      new Date('2026-11-05T10:00:00'),
    );
    zeige(protokollImArbeitsspeicher([frueher]));
    await userEvent.click(await screen.findByRole('button', { name: /Testreihe/ }));
    await userEvent.keyboard('56{Enter}');
    expect(await screen.findByRole('status')).toHaveTextContent('Richtig');
  });
});

describe('Mathe im Abgleich und bei den Erfolgen', () => {
  it('übernimmt Mathe-Antworten und Runden aus Dropbox', () => {
    const ereignisse = [
      erstelleEreignis(
        {
          typ: 'antwort',
          listeId: 'ma-reihe-7',
          wortId: '8x7',
          uebung: 'ma-tippen',
          richtig: true,
        },
        'kind',
      ),
      erstelleEreignis(
        { typ: 'runde-beendet', richtig: 3, mitHilfe: 0, verbessert: 0, fach: 'mathe' },
        'kind',
      ),
    ];
    expect(ausJsonl(zuJsonl(ereignisse))).toEqual(ereignisse);
  });

  it('nennt Matherunden bei den Erfolgen eigens', () => {
    const runde = erstelleEreignis(
      { typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0, fach: 'mathe' },
      'kind',
      new Date(`${HEUTE}T10:00:00`),
    );
    const tag = tageMitErfolgen(gutschriften([runde]))[0]!;
    expect(zusammengefasst(tag.eintraege).map((g) => g.text)).toContain('Matherunde geschafft');
  });
});
