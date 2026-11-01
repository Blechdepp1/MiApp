import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';
import { DropboxFehler, type Dropbox } from './dropbox.ts';
import { istRueckkehrVonDropbox } from './verbindung.ts';
import { DropboxVerbinden } from './Verbinden.tsx';

let zaehler = 0;

// Jede Prüfung bekommt eine eigene Adresse, weil die Rückkehr pro Adresse nur einmal verarbeitet wird
function adresse(suche = '') {
  return `https://blechdepp1.github.io/MiApp/${suche ? suche + '&' : '?'}n=${++zaehler}#/eltern`;
}

type DropboxAttrappe = { [K in keyof Dropbox]: Mock<Dropbox[K]> };

function attrappe(verbunden: boolean): DropboxAttrappe {
  let istVerbunden = verbunden;
  let datei: string | undefined;
  return {
    verbunden: vi.fn(async () => istVerbunden),
    anmeldeAdresse: vi.fn(async () => 'https://www.dropbox.com/oauth2/authorize?x=1'),
    schliesseAnmeldungAb: vi.fn(async (url: string) => {
      if (url.includes('error=')) throw new DropboxFehler('Dropbox-Zugriff wurde nicht erlaubt');
      if (!url.includes('code=')) return false;
      istVerbunden = true;
      return true;
    }),
    hochladen: vi.fn(async (_pfad: string, inhalt: string) => {
      datei = inhalt;
    }),
    herunterladen: vi.fn(async () => datei),
    aenderungsMarke: vi.fn(async () => 'marke'),
    // Lauschen endet hier nie von selbst; der Test braucht keine Änderungen anderer Geräte
    warteAufAenderung: vi.fn(
      (_marke: string, { signal }: { signal?: AbortSignal } = {}) =>
        new Promise<never>((_, abbrechen) =>
          signal?.addEventListener('abort', () => abbrechen(new Error('abgebrochen'))),
        ),
    ),
    liste: vi.fn(async () => []),
    trennen: vi.fn(async () => {
      istVerbunden = false;
    }),
  };
}

describe('DropboxVerbinden', () => {
  it('bietet „Mit Dropbox verbinden“ an und leitet zur Anmeldung weiter', async () => {
    const navigieren = vi.fn();
    render(
      <DropboxVerbinden dropbox={attrappe(false)} adresse={adresse()} navigieren={navigieren} />,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Mit Dropbox verbinden' }));
    expect(navigieren).toHaveBeenCalledWith('https://www.dropbox.com/oauth2/authorize?x=1');
  });

  it('schließt die Anmeldung nach der Rückkehr ab und bereinigt die Adresse', async () => {
    const bereinigen = vi.fn();
    const dropbox = attrappe(false);
    render(
      <DropboxVerbinden
        dropbox={dropbox}
        adresse={adresse('?code=abc&state=xyz')}
        adresseBereinigen={bereinigen}
      />,
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Verbunden ✓');
    expect(bereinigen).toHaveBeenCalled();
    expect(dropbox.schliesseAnmeldungAb).toHaveBeenCalledTimes(1);
  });

  it('zeigt einen Fehler, wenn der Zugriff abgelehnt wurde', async () => {
    render(
      <DropboxVerbinden
        dropbox={attrappe(false)}
        adresse={adresse('?error=access_denied')}
        adresseBereinigen={() => {}}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('nicht erlaubt');
    expect(screen.getByRole('button', { name: 'Mit Dropbox verbinden' })).toBeInTheDocument();
  });

  it('zeigt, mit welchem Ordner das Gerät verbunden ist', async () => {
    render(<DropboxVerbinden dropbox={attrappe(true)} adresse={adresse()} />);
    expect(await screen.findByText('Apps/MiApp-Lernen')).toBeInTheDocument();
  });

  it('testet die Verbindung mit Schreiben und Lesen', async () => {
    const dropbox = attrappe(true);
    render(<DropboxVerbinden dropbox={dropbox} adresse={adresse()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Verbindung testen' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Test erfolgreich');
    expect(dropbox.hochladen).toHaveBeenCalledWith('/verbindungstest.json', expect.any(String));
  });

  it('meldet einen Netzwerkfehler beim Test verständlich', async () => {
    const dropbox = attrappe(true);
    dropbox.hochladen.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<DropboxVerbinden dropbox={dropbox} adresse={adresse()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Verbindung testen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ist das Internet an?');
  });

  it('trennt die Verbindung', async () => {
    const dropbox = attrappe(true);
    render(<DropboxVerbinden dropbox={dropbox} adresse={adresse()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Trennen' }));
    expect(
      await screen.findByRole('button', { name: 'Mit Dropbox verbinden' }),
    ).toBeInTheDocument();
    expect(dropbox.trennen).toHaveBeenCalled();
  });
});

describe('istRueckkehrVonDropbox', () => {
  it.each([
    ['?code=abc&state=x', true],
    ['?error=access_denied', true],
    ['', false],
  ])('%s → %s', (suche, erwartet) => {
    expect(istRueckkehrVonDropbox(suche)).toBe(erwartet);
  });
});
