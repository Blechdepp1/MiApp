import { useGeraet } from '../eltern/GeraetKontext.tsx';
import { COMMIT, VERSION } from './version.ts';
import './VorschauBand.css';

// Immer sichtbar im Testkanal, damit niemand ihn mit Milenas App verwechselt.
// Zum Ausprobieren lässt sich hier die Rolle des Geräts wechseln (die PIN bleibt gleich).
export function VorschauBand() {
  const { geraet, einrichten } = useGeraet();
  const andere = geraet?.rolle === 'eltern' ? 'kind' : 'eltern';

  return (
    <div className="vorschau-band" role="note">
      <span>
        🧪 Testversion {VERSION} {COMMIT && `(${COMMIT})`}
      </span>
      {geraet && (
        <button type="button" onClick={() => einrichten({ ...geraet, rolle: andere })}>
          {geraet.rolle === 'eltern' ? '👨‍👩‍👧 Eltern' : '🧒 Kind'} → zur{' '}
          {andere === 'eltern' ? 'Eltern' : 'Kind'}-Ansicht
        </button>
      )}
    </div>
  );
}
