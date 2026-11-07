// Mathe: Einmaleins mit fest berechneten Aufgaben. Die App rechnet selbst, ids sind dauerhaft,
// weil der Wiederholungsplan an ihnen hängt.

// a · b = ergebnis oder a : b = ergebnis
export type RechenAufgabe = {
  id: string;
  a: number;
  b: number;
  op: 'mal' | 'geteilt';
  ergebnis: number;
  // Rechentrick als Tipp (zählt als „mit Hilfe“)
  hilfe: string;
};

export type MatheThema = {
  id: string;
  titel: string;
  symbol: string;
  // Was beim Thema zum Merken steht (vorlesbar)
  merkwissen: string[];
  woerter: RechenAufgabe[];
};
