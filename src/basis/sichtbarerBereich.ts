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
    // Tastatur offen, wenn deutlich weniger zu sehen ist als das Fenster hoch ist
    const offen = fenster.innerHeight - vv.height > 150;
    fenster.document.documentElement.toggleAttribute('data-tastatur', offen);
    if (offen) fenster.document.documentElement.setAttribute('data-tastatur', 'offen');
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
export function insBildHolen(
  feld: HTMLElement,
  verzoegerung = 300,
  block: ScrollLogicalPosition = 'center',
): void {
  setTimeout(() => feld.scrollIntoView?.({ block, behavior: 'smooth' }), verzoegerung);
}
