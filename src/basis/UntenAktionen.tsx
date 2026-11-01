import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Platz in der unteren Leiste der Seite (von Seite bereitgestellt)
// eslint-disable-next-line react-refresh/only-export-components
export const AktionenZiel = createContext<HTMLElement | null>(null);

// Stellt Hauptknöpfe (z. B. „Eintragen“, „Speichern“) in die untere Leiste der Seite. Solange sie
// da sind, tritt „⌂ Startseite“ zurück; ohne Seite (z. B. im Test) stehen sie an Ort und Stelle.
export function UntenAktionen({ children }: { children: ReactNode }) {
  const ziel = useContext(AktionenZiel);
  if (!ziel) return <div className="aktionsleiste-ersatz">{children}</div>;
  return createPortal(children, ziel);
}
