import type { ReactNode } from 'react';
import { Verweis } from './Verweis.tsx';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Seite.css';

// Einheitliche Seitenvorlage: Zurück zur Startseite und vorlesbarer Titel
export function Seite({
  titel,
  vorlesetext,
  children,
}: {
  titel: string;
  vorlesetext?: string;
  children: ReactNode;
}) {
  return (
    <div className="seite">
      <header className="seite-kopf">
        <Verweis className="seite-zurueck" ziel="start">
          <span aria-hidden="true">←</span> Zurück
        </Verweis>
        <div className="seite-titel">
          <h1>{titel}</h1>
          <VorleseKnopf text={vorlesetext ?? titel} />
        </div>
      </header>
      {children}
    </div>
  );
}
