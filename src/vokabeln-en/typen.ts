export type Vokabel = {
  id: string;
  // Englisch; Alternativen mit Komma, Optionales in Klammern: "(to) go", "big, large"
  en: string;
  de: string;
  // Nur bei Formen unregelmäßiger Verben (aus der Lektion abgeleitet, nicht gespeichert):
  // gruppe = id des Verbs, reihe = alle Formen zum Nachsprechen („go – went – gone“)
  gruppe?: string;
  reihe?: string;
};

export type Vokabelliste = {
  id: string;
  name: string;
  woerter: Vokabel[];
};
