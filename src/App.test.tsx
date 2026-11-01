import { act, render, screen, within } from '@testing-library/react';
import { speicherImArbeitsspeicher } from './basis/einstellungen.ts';
import { pfad, ZIELE, type Ziel } from './basis/navigation.ts';
import { inhalteImArbeitsspeicher } from './daten/inhalte.ts';
import { lektionenImArbeitsspeicher } from './lektionen/speicher.ts';
import { protokollImArbeitsspeicher } from './daten/protokoll.ts';
import { wertImArbeitsspeicher } from './daten/schluesselWert.ts';
import { geraetImArbeitsspeicher, type GeraetSpeicher } from './eltern/geraet.ts';
import { erzeugePruefwert } from './eltern/pin.ts';
import { erstelleDropbox } from './sync/dropbox.ts';
import { tokenSpeicherImArbeitsspeicher } from './sync/tokenSpeicher.ts';
import { App } from './App.tsx';

function gehe(ziel: Ziel) {
  act(() => {
    window.location.hash = pfad(ziel);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

async function eingerichtet(): Promise<GeraetSpeicher> {
  return geraetImArbeitsspeicher({ rolle: 'kind', pin: await erzeugePruefwert('1234') });
}

// Rendert die App und wartet, bis das Gerät geladen ist
async function zeige(geraet?: GeraetSpeicher) {
  window.history.replaceState(null, '', '#/');
  render(
    <App
      speicher={speicherImArbeitsspeicher()}
      protokoll={protokollImArbeitsspeicher()}
      gesehenesLevel={wertImArbeitsspeicher<number>()}
      geraet={geraet ?? (await eingerichtet())}
      dropbox={erstelleDropbox({
        speicher: tokenSpeicherImArbeitsspeicher(),
        redirectUri: 'https://blechdepp1.github.io/MiApp/',
        abrufen: vi.fn(),
      })}
      abgleichStand={wertImArbeitsspeicher()}
      inhalteStand={wertImArbeitsspeicher()}
      inhalte={inhalteImArbeitsspeicher()}
      lektionen={lektionenImArbeitsspeicher()}
      lektionenStand={wertImArbeitsspeicher()}
    />,
  );
  await screen.findAllByRole('heading', { level: 1 });
}

afterEach(() => gehe('start'));

describe('App', () => {
  it('zeigt beim ersten Start die Einrichtung', async () => {
    await zeige(geraetImArbeitsspeicher());
    expect(
      screen.getByRole('heading', { name: 'Willkommen! Wer benutzt dieses Gerät?' }),
    ).toBeInTheDocument();
  });

  it('zeigt auf der Startseite Kacheln mit Vorlese-Knopf', async () => {
    await zeige();
    for (const name of ['Vokabeln', 'Belohnungen', 'Einstellungen']) {
      const kachel = screen.getByRole('link', { name }).closest('li')!;
      expect(within(kachel).getByRole('button', { name: 'Vorlesen' })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Eltern-Bereich' })).toBeInTheDocument();
  });

  const TITEL: Record<Ziel, RegExp> = {
    start: /^Hallo/,
    vokabeln: /^Vokabeln$/,
    belohnungen: /^Belohnungen$/,
    einstellungen: /^Einstellungen$/,
    eltern: /^Eltern-Bereich$/,
  };

  it.each(ZIELE)('Seite „%s“ hat einen vorlesbaren Titel', async (ziel) => {
    await zeige();
    gehe(ziel);
    // Auf die Überschrift genau dieser Seite warten, nicht die der vorherigen
    const titel = await screen.findByRole('heading', { level: 1, name: TITEL[ziel] });
    expect(
      within(titel.parentElement!).getByRole('button', { name: 'Vorlesen' }),
    ).toBeInTheDocument();
  });

  it.each(ZIELE.filter((z) => z !== 'start'))(
    'Seite „%s“ führt mit Zurück zur Startseite',
    async (ziel) => {
      await zeige();
      gehe(ziel);
      expect(await screen.findByRole('link', { name: /Zurück/ })).toHaveAttribute(
        'href',
        pfad('start'),
      );
    },
  );

  it('erreicht die Einstellungen von der Startseite mit einem Tipp', async () => {
    await zeige();
    expect(screen.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute(
      'href',
      pfad('einstellungen'),
    );
    gehe('einstellungen');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Einstellungen' }),
    ).toBeInTheDocument();
  });

  it('öffnet den Eltern-Bereich auch per Adresse nur mit PIN', async () => {
    await zeige();
    gehe('eltern');
    expect(await screen.findByRole('heading', { name: 'Eltern-PIN eingeben' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dropbox' })).toBeNull();
  });
});
