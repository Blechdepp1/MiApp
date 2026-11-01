import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { protokollImArbeitsspeicher, type Protokoll } from '../daten/protokoll.ts';
import { inhalteImArbeitsspeicher } from '../daten/inhalte.ts';
import { InhalteProvider } from '../daten/InhalteKontext.tsx';
import { ProtokollProvider } from '../daten/ProtokollKontext.tsx';
import type { InhalteStand } from './inhalteAbgleich.ts';
import { wertImArbeitsspeicher } from '../daten/schluesselWert.ts';
import { ausJsonl, eigeneDatei, type AbgleichStand } from './abgleich.ts';
import { erstelleDropbox, type Dropbox } from './dropbox.ts';
import { dropboxAttrappe, verbundenesDropbox } from './dropboxAttrappe.ts';
import { SyncProvider } from './SyncKontext.tsx';
import { SyncStatus } from './SyncStatus.tsx';
import { tokenSpeicherImArbeitsspeicher } from './tokenSpeicher.ts';

const RUNDE = { typ: 'runde-beendet', richtig: 5, mitHilfe: 0, verbessert: 0 } as const;

function zeige(dropbox: Dropbox, protokoll: Protokoll = protokollImArbeitsspeicher([], 'kind-1')) {
  render(
    <ProtokollProvider protokoll={protokoll}>
      <InhalteProvider speicher={inhalteImArbeitsspeicher()}>
        <SyncProvider
          dropbox={dropbox}
          stand={wertImArbeitsspeicher<AbgleichStand>()}
          inhalteStand={wertImArbeitsspeicher<InhalteStand>()}
          intervallMs={60_000}
          verzoegerungMs={20}
        >
          <SyncStatus />
        </SyncProvider>
      </InhalteProvider>
    </ProtokollProvider>,
  );
  return protokoll;
}

describe('SyncProvider', () => {
  it('gleicht beim Start ab und zeigt die Uhrzeit', async () => {
    const seite = dropboxAttrappe();
    const protokoll = protokollImArbeitsspeicher([], 'kind-1');
    await protokoll.hinzufuegen(RUNDE);
    zeige(await verbundenesDropbox(seite), protokoll);
    expect(await screen.findByText(/Zuletzt abgeglichen um/)).toBeInTheDocument();
    expect(ausJsonl(seite.dateien.get(eigeneDatei('kind-1'))!.inhalt)).toHaveLength(1);
  });

  it('gleicht kurz nach einem neuen Ereignis erneut ab', async () => {
    const seite = dropboxAttrappe();
    const protokoll = zeige(await verbundenesDropbox(seite));
    await screen.findByText(/Zuletzt abgeglichen um/);
    await act(() => protokoll.hinzufuegen(RUNDE));
    await vi.waitFor(() =>
      expect(ausJsonl(seite.dateien.get(eigeneDatei('kind-1'))?.inhalt ?? '')).toHaveLength(1),
    );
  });

  it('zeigt ohne Internet einen ruhigen Hinweis und versucht es erneut', async () => {
    const seite = dropboxAttrappe();
    seite.setzeOffline(true);
    zeige(await verbundenesDropbox(seite));
    expect(await screen.findByRole('alert')).toHaveTextContent('kein Internet');
    seite.setzeOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Jetzt abgleichen' }));
    expect(await screen.findByText(/Zuletzt abgeglichen um/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gleicht bei wiederkehrendem Netz ab', async () => {
    const seite = dropboxAttrappe();
    seite.setzeOffline(true);
    zeige(await verbundenesDropbox(seite));
    await screen.findByRole('alert');
    seite.setzeOffline(false);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(await screen.findByText(/Zuletzt abgeglichen um/)).toBeInTheDocument();
  });

  it('zeigt nichts und tut nichts, solange Dropbox nicht verbunden ist', async () => {
    const abrufen = vi.fn();
    const dropbox = erstelleDropbox({
      speicher: tokenSpeicherImArbeitsspeicher(),
      redirectUri: 'https://blechdepp1.github.io/MiApp/',
      abrufen,
    });
    zeige(dropbox);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('heading', { name: 'Abgleich' })).toBeNull();
    expect(abrufen).not.toHaveBeenCalled();
  });
});
