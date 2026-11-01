import { useState, type ReactNode } from 'react';
import { AktionenZiel } from './UntenAktionen.tsx';
import { Verweis } from './Verweis.tsx';
import { VorleseKnopf } from './VorleseKnopf.tsx';
import './Seite.css';

// Einheitliche Seitenvorlage: oben nur Titel und Vorlesen, unten eine feste Leiste über die volle
// Breite (Daumen-Bereich, für Links- und Rechtshänder gleich). Dort steht „⌂ Startseite“ bzw. der
// Weg eine Ebene zurück, oder die Hauptknöpfe der Seite (siehe UntenAktionen). Die Zurück-Geste
// bzw. -Taste von Android funktioniert wie gewohnt.
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
  const [aktionenZiel, setAktionenZiel] = useState<HTMLElement | null>(null);
  return (
    <div className="seite">
      <header className="seite-kopf">
        <div className="seite-titel">
          <h1>{titel}</h1>
          <VorleseKnopf text={vorlesetext ?? titel} />
        </div>
      </header>
      <AktionenZiel.Provider value={aktionenZiel}>{children}</AktionenZiel.Provider>
      <div className="aktionsleiste-platz" aria-hidden="true" />
      <nav className="aktionsleiste" aria-label="Seitenleiste">
        <div ref={setAktionenZiel} className="aktionsleiste-eigene" />
        {zurueck ? (
          <button type="button" className="aktionsleiste-weg" onClick={zurueck.onClick}>
            <span aria-hidden="true">← </span>
            {zurueck.text}
          </button>
        ) : (
          <Verweis className="aktionsleiste-weg" ziel="start">
            <span aria-hidden="true">⌂</span>Startseite
          </Verweis>
        )}
      </nav>
    </div>
  );
}
