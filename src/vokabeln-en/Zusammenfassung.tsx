import { Verweis } from '../basis/Verweis.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { TAGESZIEL_RUNDEN } from '../belohnung/werte.ts';
import { sprechtext } from './runde.ts';
import type { Vokabel } from './typen.ts';

export type Ergebnis = {
  punkte: number;
  tageszielGeradeErreicht: boolean;
  rundenHeute: number;
  gelernt: Vokabel[];
};

// Zeigt, was geschafft wurde – keine Fehlerliste
export function Zusammenfassung({
  ergebnis,
  onNochEinmal,
}: {
  ergebnis: Ergebnis;
  onNochEinmal: () => void;
}) {
  const jubel = `Geschafft! Du hast ${ergebnis.punkte} Punkte bekommen.`;
  const ziel = ergebnis.tageszielGeradeErreicht
    ? 'Tagesziel geschafft! Dafür gibt es Extra-Punkte.'
    : ergebnis.rundenHeute < TAGESZIEL_RUNDEN
      ? `Tagesziel: ${ergebnis.rundenHeute} von ${TAGESZIEL_RUNDEN} Runden. Noch eine Runde bis zum Bonus!`
      : 'Tagesziel ist heute schon geschafft. Toll, dass du weiter übst!';

  return (
    <div className="zusammenfassung">
      <p className="zusammenfassung-jubel">
        <VorleseKnopf text={jubel} />
        <span>
          Geschafft! 🎉 <strong>+{ergebnis.punkte} Punkte</strong>
        </span>
      </p>
      <p>
        <VorleseKnopf text={ziel} />
        <span>
          {ergebnis.tageszielGeradeErreicht && '⭐ '}
          {ziel}
        </span>
      </p>

      {ergebnis.gelernt.length > 0 && (
        <>
          <h2>Diese Wörter kannst du jetzt:</h2>
          <ul className="zusammenfassung-woerter">
            {ergebnis.gelernt.map((w) => (
              <li key={w.id}>
                <VorleseKnopf text={sprechtext(w.en)} sprache="en" />
                <span lang="en">{w.en}</span>
                <span aria-hidden="true">=</span>
                <span>{w.de}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="zusammenfassung-knoepfe">
        <button type="button" className="runde-weiter" onClick={onNochEinmal}>
          Noch eine Runde
        </button>
        <Verweis className="seite-zurueck" ziel="start">
          Zur Startseite
        </Verweis>
      </div>
    </div>
  );
}
