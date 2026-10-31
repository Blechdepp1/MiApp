export type Vokabel = {
  id: string;
  // Englisch; Alternativen mit Komma, Optionales in Klammern: "(to) go", "big, large"
  en: string;
  de: string;
};

export type Vokabelliste = {
  id: string;
  name: string;
  woerter: Vokabel[];
};
