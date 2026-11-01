// Die Handy-Tastatur verdeckt den unteren Teil des Bildschirms. In der Vollbild-App verkleinert
// Android dabei nicht immer die Seite, deshalb richten sich Dialoge und Vollbild-Ansichten nach
// dem tatsächlich sichtbaren Bereich (CSS-Variablen --sichtbar-hoehe und --sichtbar-oben).
export function beobachteSichtbarenBereich(fenster: Window = window): () => void {
  const vv = fenster.visualViewport;
  if (!vv) return () => {};
  const stil = fenster.document.documentElement.style;
  const setzen = () => {
    stil.setProperty('--sichtbar-hoehe', `${vv.height}px`);
    stil.setProperty('--sichtbar-oben', `${vv.offsetTop}px`);
  };
  setzen();
  vv.addEventListener('resize', setzen);
  vv.addEventListener('scroll', setzen);
  return () => {
    vv.removeEventListener('resize', setzen);
    vv.removeEventListener('scroll', setzen);
  };
}

// Eingabefeld nach dem Aufklappen der Tastatur in die Mitte des sichtbaren Bereichs holen
export function insBildHolen(feld: HTMLElement, verzoegerung = 300): void {
  setTimeout(() => feld.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), verzoegerung);
}
