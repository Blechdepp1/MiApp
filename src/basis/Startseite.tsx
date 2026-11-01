import { Fortschritt } from '../belohnung/Fortschritt.tsx';
import { useOffeneEinloesungen } from '../eltern/Einloesungen.tsx';
import { useGeraet } from '../eltern/GeraetKontext.tsx';
import { SagUnsWas } from '../feedback/SagUnsWas.tsx';
import { AppHinweis } from './AppHinweis.tsx';
import type { Ziel } from './navigation.ts';
import { Verweis } from './Verweis.tsx';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Startseite.css';

const KACHELN: { ziel: Ziel; symbol: string; text: string; vorlesen: string }[] = [
  { ziel: 'vokabeln', symbol: '📚', text: 'Vokabeln', vorlesen: 'Vokabeln üben' },
  { ziel: 'tests', symbol: '📝', text: 'Tests', vorlesen: 'Meine Tests und Klassenarbeiten' },
  { ziel: 'erfolge', symbol: '🌟', text: 'Erfolge', vorlesen: 'Meine Erfolge' },
  { ziel: 'belohnungen', symbol: '🏆', text: 'Belohnungen', vorlesen: 'Deine Belohnungen' },
  { ziel: 'einstellungen', symbol: '⚙️', text: 'Einstellungen', vorlesen: 'Einstellungen' },
];

const BEGRUESSUNG = 'Hallo! Was möchtest du heute machen?';

export function Startseite() {
  const istEltern = useGeraet().geraet?.rolle === 'eltern';
  const offen = useOffeneEinloesungen();
  return (
    <div className="startseite">
      {istEltern && offen > 0 && (
        <Verweis className="startseite-hinweis" ziel="eltern">
          🎁 {offen === 1 ? '1 Belohnung wartet' : `${offen} Belohnungen warten`} auf eure
          Bestätigung →
        </Verweis>
      )}
      <header className="startseite-kopf">
        <div className="startseite-gruss">
          <VorleseKnopf text={BEGRUESSUNG} />
          <h1>{BEGRUESSUNG}</h1>
        </div>
        <Verweis className="startseite-eltern" ziel="eltern" aria-label="Eltern-Bereich">
          <span aria-hidden="true">🔒</span>
        </Verweis>
      </header>

      <Fortschritt />

      <ul className="kacheln">
        {KACHELN.map((k) => (
          <li key={k.ziel} className="kachel">
            <Verweis ziel={k.ziel}>
              <span className="kachel-symbol" aria-hidden="true">
                {k.symbol}
              </span>
              <span>{k.text}</span>
            </Verweis>
            <span className="kachel-vorlesen">
              <VorleseKnopf text={k.vorlesen} />
            </span>
          </li>
        ))}
      </ul>

      <SagUnsWas />
      <AppHinweis />
    </div>
  );
}
