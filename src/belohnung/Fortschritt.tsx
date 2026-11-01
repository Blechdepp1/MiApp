import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse } from '../daten/ProtokollKontext.tsx';
import { gesamtPunkte, level, naechstesZiel, tagesziel, tagVon } from './logik.ts';
import './Belohnung.css';

// Level, Punkte und Tagesziel auf der Startseite
export function Fortschritt({ heute = tagVon(new Date().toISOString()) }: { heute?: string }) {
  const ereignisse = useEreignisse();
  const [stufen] = useInhalt('level');
  if (!ereignisse) return null;

  const punkte = gesamtPunkte(ereignisse);
  const l = level(punkte, stufen);
  const ziel = tagesziel(ereignisse, heute);
  const bisZiel = l.naechstesAb - punkte;
  const naechstes = naechstesZiel(l, stufen);
  const naechstesText = naechstes.startsWith('zum') ? naechstes : `bis ${naechstes}`;
  const sterne = '★'.repeat(l.sterne);

  const vorlesetext =
    `Du bist Level ${l.nummer}, ${l.titel}${l.sterne ? ` mit ${l.sterne} Sternen` : ''}. ` +
    `Du hast ${punkte} Punkte. Noch ${bisZiel} Punkte ${naechstesText}. ` +
    (ziel.erreicht
      ? 'Dein Tagesziel hast du heute geschafft!'
      : `Tagesziel: ${ziel.runden} von ${ziel.ziel} Runden.`);

  return (
    <section className="fortschritt" aria-label="Dein Fortschritt">
      <div className="fortschritt-kopf">
        <span className="fortschritt-level">Level {l.nummer}</span>
        <VorleseKnopf text={vorlesetext} />
      </div>
      <p className="fortschritt-titel">
        {l.titel} {sterne && <span className="fortschritt-sterne">{sterne}</span>}
      </p>

      <div className="fortschritt-balken">
        <progress
          max={l.naechstesAb - l.ab}
          value={punkte - l.ab}
          aria-label={`Fortschritt ${naechstesText}`}
        />
        <span>
          Noch <strong>{bisZiel}</strong> Punkte {naechstesText}
        </span>
      </div>

      <div className="fortschritt-zeile">
        <span>
          <span aria-hidden="true">🪙 </span>
          {punkte} Punkte
        </span>
        <span className="fortschritt-tagesziel" data-erreicht={ziel.erreicht}>
          <span className="unsichtbar">Tagesziel: </span>
          {Array.from({ length: ziel.ziel }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="fortschritt-punkt"
              data-voll={i < ziel.runden}
            />
          ))}
          <span>{ziel.erreicht ? 'Tagesziel ✓' : `${ziel.runden} von ${ziel.ziel} Runden`}</span>
        </span>
      </div>
    </section>
  );
}
