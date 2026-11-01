import { useState, useSyncExternalStore } from 'react';
import { KANAL } from './kanal.ts';
import { beiAenderung, installierbar, installieren, laeuftAlsApp } from './installieren.ts';
import './AppHinweis.css';

const WEG_SCHLUESSEL = `${KANAL.speicherPraefix}-app-hinweis-weg`;

function weggeklickt(): boolean {
  try {
    return localStorage.getItem(WEG_SCHLUESSEL) === '1';
  } catch {
    return false;
  }
}

// Im Browser-Tab: Hinweis, dass die installierte App ohne Leisten im Vollbild läuft
export function AppHinweis({ alsApp = laeuftAlsApp() }: { alsApp?: boolean }) {
  const kannInstallieren = useSyncExternalStore(beiAenderung, installierbar);
  const [weg, setWeg] = useState(weggeklickt);
  if (alsApp || weg) return null;

  function schliessen() {
    setWeg(true);
    try {
      localStorage.setItem(WEG_SCHLUESSEL, '1');
    } catch {
      // dann kommt der Hinweis beim nächsten Mal wieder
    }
  }

  return (
    <aside className="app-hinweis" aria-label="Als App installieren">
      <p>
        <strong>Vollbild ohne Leisten:</strong>{' '}
        {kannInstallieren
          ? 'MiApp als App auf den Startbildschirm legen.'
          : 'In Chrome ⋮ → „Zum Startbildschirm hinzufügen“ und MiApp dann von dort öffnen.'}
      </p>
      <div className="app-hinweis-knoepfe">
        {kannInstallieren && (
          <button type="button" className="app-hinweis-haupt" onClick={() => void installieren()}>
            📲 Als App installieren
          </button>
        )}
        <button type="button" onClick={schliessen}>
          Nicht mehr zeigen
        </button>
      </div>
    </aside>
  );
}
