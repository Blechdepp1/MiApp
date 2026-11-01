import { COMMIT, VERSION } from './version.ts';
import './VorschauBand.css';

// Immer sichtbar im Testkanal, damit niemand ihn mit Milenas App verwechselt
export function VorschauBand() {
  return (
    <div className="vorschau-band" role="note">
      🧪 Testversion {VERSION} {COMMIT && `(${COMMIT})`}
    </div>
  );
}
