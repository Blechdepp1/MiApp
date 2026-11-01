import type { ReactNode } from 'react';
import { Verweis } from './Verweis.tsx';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Seite.css';

// Einheitliche Seitenvorlage: Zurück zur Startseite (oder eine Ebene höher) und vorlesbarer Titel
export function Seite({
  titel,
  vorlesetext,
  zurueck,
  children,
}: {
  titel: string;
  vorlesetext?: string;
  // Für Unterseiten: zurück zur übergeordneten Seite statt zur Startseite
  zurueck?: { text: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <div className="seite">
      <header className="seite-kopf">
        {zurueck ? (
          <button type="button" className="seite-zurueck" onClick={zurueck.onClick}>
            <span aria-hidden="true">←</span> {zurueck.text}
          </button>
        ) : (
          <Verweis className="seite-zurueck" ziel="start">
            <span aria-hidden="true">←</span> Zurück
          </Verweis>
        )}
        <div className="seite-titel">
          <h1>{titel}</h1>
          <VorleseKnopf text={vorlesetext ?? titel} />
        </div>
      </header>
      {children}
    </div>
  );
}
