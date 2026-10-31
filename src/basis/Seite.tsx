import type { ReactNode } from 'react';
import { pfad } from './navigation.ts';
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
        <a className="seite-zurueck" href={pfad('start')}>
          <span aria-hidden="true">←</span> Zurück
        </a>
        <div className="seite-titel">
          <h1>{titel}</h1>
          <VorleseKnopf text={vorlesetext ?? titel} />
        </div>
      </header>
      {children}
    </div>
  );
}

export function KommtBald({ titel }: { titel: string }) {
  const text = 'Das kommt bald!';
  return (
    <Seite titel={titel}>
      <p className="seite-bald">
        <VorleseKnopf text={text} />
        <span>{text}</span>
      </p>
    </Seite>
  );
}
