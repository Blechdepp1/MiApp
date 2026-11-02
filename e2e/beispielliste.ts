import { BEISPIELLISTE } from '../src/vokabeln-en/beispielliste.ts';

// Englisch → Deutsch für alle Wörter der eingebauten Beispielliste. Neue Wörter kommen über die
// Liste verteilt (nicht der Reihe nach), deshalb kennen die Tests alle.
export const DEUTSCH: Record<string, string> = Object.fromEntries(
  BEISPIELLISTE.woerter.map((w) => [w.en, w.de]),
);
