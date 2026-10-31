import { act, render, screen, within } from '@testing-library/react';
import { speicherImArbeitsspeicher } from './basis/einstellungen.ts';
import { pfad, ZIELE, type Ziel } from './basis/navigation.ts';
import { App } from './App.tsx';

function gehe(ziel: Ziel) {
  act(() => {
    window.location.hash = pfad(ziel);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function zeige() {
  render(<App speicher={speicherImArbeitsspeicher()} />);
}

afterEach(() => gehe('start'));

describe('App', () => {
  it('zeigt auf der Startseite Kacheln mit Vorlese-Knopf', () => {
    zeige();
    for (const name of ['Vokabeln', 'Belohnungen', 'Einstellungen']) {
      const kachel = screen.getByRole('link', { name }).closest('li')!;
      expect(within(kachel).getByRole('button', { name: 'Vorlesen' })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Eltern-Bereich' })).toBeInTheDocument();
  });

  it.each(ZIELE)('Seite „%s“ hat einen vorlesbaren Titel', (ziel) => {
    zeige();
    gehe(ziel);
    const titel = screen.getByRole('heading', { level: 1 });
    expect(
      within(titel.parentElement!).getByRole('button', { name: 'Vorlesen' }),
    ).toBeInTheDocument();
  });

  it.each(ZIELE.filter((z) => z !== 'start'))(
    'Seite „%s“ führt mit Zurück zur Startseite',
    (ziel) => {
      zeige();
      gehe(ziel);
      expect(screen.getByRole('link', { name: /Zurück/ })).toHaveAttribute('href', pfad('start'));
    },
  );

  it('erreicht die Einstellungen von der Startseite mit einem Tipp', () => {
    zeige();
    expect(screen.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute(
      'href',
      pfad('einstellungen'),
    );
    gehe('einstellungen');
    expect(screen.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeInTheDocument();
  });
});
