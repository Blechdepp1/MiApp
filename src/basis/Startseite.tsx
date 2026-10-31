import { pfad, type Ziel } from './navigation.ts';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Startseite.css';

const KACHELN: { ziel: Ziel; symbol: string; text: string; vorlesen: string }[] = [
  { ziel: 'vokabeln', symbol: '📚', text: 'Vokabeln', vorlesen: 'Vokabeln üben' },
  { ziel: 'belohnungen', symbol: '🏆', text: 'Belohnungen', vorlesen: 'Deine Belohnungen' },
  { ziel: 'einstellungen', symbol: '⚙️', text: 'Einstellungen', vorlesen: 'Einstellungen' },
];

const BEGRUESSUNG = 'Hallo! Was möchtest du heute machen?';

export function Startseite() {
  return (
    <div className="startseite">
      <header className="startseite-kopf">
        <div className="startseite-gruss">
          <VorleseKnopf text={BEGRUESSUNG} />
          <h1>{BEGRUESSUNG}</h1>
        </div>
        <a className="startseite-eltern" href={pfad('eltern')} aria-label="Eltern-Bereich">
          <span aria-hidden="true">🔒</span>
        </a>
      </header>

      <ul className="kacheln">
        {KACHELN.map((k) => (
          <li key={k.ziel} className="kachel">
            <a href={pfad(k.ziel)}>
              <span className="kachel-symbol" aria-hidden="true">
                {k.symbol}
              </span>
              <span>{k.text}</span>
            </a>
            <span className="kachel-vorlesen">
              <VorleseKnopf text={k.vorlesen} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
