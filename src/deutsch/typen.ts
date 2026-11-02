// Deutsch-Grammatik (nach „Deutsch Fit“, Klasse 5/6): Themen mit fest geprüften Aufgaben.
// Die App bewertet selbst; ids sind dauerhaft, weil der Wiederholungsplan an ihnen hängt.

// Aus Knöpfen wählen (z. B. Wortart, Artikel, Satzart, Satzzeichen)
export type WaehlAufgabe = {
  id: string;
  art: 'waehlen';
  frage: string;
  // Das Wort oder der Satz, um den es geht (groß angezeigt und vorgelesen)
  inhalt: string;
  optionen: string[];
  // Mehrere, wenn mehr als eine Antwort stimmt (z. B. Punkt oder Ausrufezeichen)
  richtig: string[];
  hilfe?: string;
};

// Ein Wort schreiben (z. B. Mehrzahl, Verbform, Steigerung)
export type SchreibAufgabe = {
  id: string;
  art: 'schreiben';
  frage: string;
  inhalt: string;
  // Erste Lösung wird gezeigt; weitere gelten auch als richtig
  loesungen: string[];
  hilfe?: string;
};

// Im Satz Wörter antippen (z. B. Subjekt, Prädikat, alle Nomen)
export type AntippAufgabe = {
  id: string;
  art: 'antippen';
  frage: string;
  satz: string;
  // Wörter (Index nach Leerzeichen getrennt), die zur Lösung gehören
  richtig: number[];
  // Optional: Bei Wortgruppen (Subjekt „Die Kinder“) reicht es, nur diese Wörter zu treffen,
  // solange alle angetippten Wörter zur Gruppe gehören
  kern?: number[];
  hilfe?: string;
};

export type Aufgabe = WaehlAufgabe | SchreibAufgabe | AntippAufgabe;

export type Thema = {
  id: string;
  titel: string;
  symbol: string;
  // Seiten im Heft „Deutsch Fit“
  seiten: string;
  merkwissen: string[];
  // Heißt so, damit der Wiederholungsplan (LernListe) die Aufgaben wie Wörter behandelt
  woerter: Aufgabe[];
};
