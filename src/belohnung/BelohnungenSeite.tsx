import { useEffect, useRef, useState } from 'react';
import { Seite } from '../basis/Seite.tsx';
import { VorleseKnopf } from '../basis/VorleseKnopf.tsx';
import { useInhalt } from '../daten/InhalteKontext.tsx';
import { useEreignisse, useProtokoll } from '../daten/ProtokollKontext.tsx';
import type { Belohnung } from './inhalte.ts';
import { einloesungen, guthaben } from './logik.ts';
import './Belohnung.css';

// Belohnungen ansehen und mit Punkten einlösen; die Eltern bestätigen danach
export function BelohnungenSeite() {
  const ereignisse = useEreignisse();
  const protokoll = useProtokoll();
  const [belohnungen] = useInhalt('belohnungen');
  const [frage, setFrage] = useState<Belohnung | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [gerade, setGerade] = useState<string | null>(null);

  if (!ereignisse) return <Seite titel="Belohnungen">{null}</Seite>;
  const punkte = guthaben(ereignisse);
  const eingeloest = einloesungen(ereignisse);
  const kopf = `Du hast ${punkte} Punkte zum Einlösen.`;

  async function einloesen(b: Belohnung) {
    // Doppeltes Tippen darf nicht zweimal einlösen; Guthaben frisch prüfen
    if (laeuft) return;
    setLaeuft(true);
    try {
      if (guthaben(await protokoll.alle()) < b.preis) return;
      await protokoll.hinzufuegen({
        typ: 'eingeloest',
        belohnungId: b.id,
        preis: b.preis,
        name: b.name,
        symbol: b.symbol,
      });
      setGerade(b.name);
    } finally {
      setFrage(null);
      setLaeuft(false);
    }
  }

  return (
    <Seite titel="Belohnungen" vorlesetext="Deine Belohnungen">
      <p className="belohnungen-guthaben">
        <VorleseKnopf text={kopf} />
        <span>
          <span aria-hidden="true">🪙 </span>Du hast <strong>{punkte} Punkte</strong> zum Einlösen.
        </span>
      </p>

      {gerade && (
        <p className="belohnungen-meldung" role="status">
          <VorleseKnopf
            text={`Super! ${gerade} ist eingelöst. Jetzt müssen deine Eltern noch bestätigen.`}
          />
          <span>
            🎉 <strong>{gerade}</strong> ist eingelöst! Jetzt müssen deine Eltern noch bestätigen.
          </span>
        </p>
      )}

      {belohnungen.length === 0 ? (
        <p>Noch keine Belohnungen festgelegt.</p>
      ) : (
        <ul className="belohnungen-liste">
          {belohnungen.map((b) => {
            const fehlt = Math.max(0, b.preis - punkte);
            const vorlesen =
              fehlt > 0
                ? `${b.name}. Kostet ${b.preis} Punkte. Dir fehlen noch ${fehlt} Punkte.`
                : `${b.name}. Kostet ${b.preis} Punkte. Du kannst es jetzt einlösen!`;
            return (
              <li key={b.id} className="belohnung-karte" data-erreichbar={fehlt === 0}>
                <span className="belohnung-symbol" aria-hidden="true">
                  {b.symbol}
                </span>
                <div className="belohnung-text">
                  <strong>{b.name}</strong>
                  <span>{b.preis} Punkte</span>
                  <progress
                    max={b.preis}
                    value={Math.min(punkte, b.preis)}
                    aria-label={`Fortschritt ${b.name}`}
                  />
                  {fehlt > 0 ? (
                    <span className="belohnung-fehlt">Noch {fehlt} Punkte</span>
                  ) : (
                    <button
                      type="button"
                      className="runde-weiter"
                      onClick={() => setFrage(b)}
                      disabled={laeuft}
                    >
                      Einlösen
                    </button>
                  )}
                </div>
                <VorleseKnopf text={vorlesen} />
              </li>
            );
          })}
        </ul>
      )}

      {eingeloest.length > 0 && (
        <section className="belohnungen-verlauf">
          <h2>Eingelöst</h2>
          <ul>
            {eingeloest.map((e) => (
              <li key={e.id}>
                <span aria-hidden="true">{e.symbol ?? '🎁'}</span>
                <span>{e.name ?? 'Belohnung'}</span>
                <span className="belohnung-status" data-bestaetigt={e.bestaetigt}>
                  {e.bestaetigt ? '✓ bestätigt' : '⏳ wartet auf Bestätigung'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {frage && (
        <EinloesenFrage
          belohnung={frage}
          laeuft={laeuft}
          onJa={() => einloesen(frage)}
          onNein={() => setFrage(null)}
        />
      )}
    </Seite>
  );
}

function EinloesenFrage({
  belohnung,
  laeuft,
  onJa,
  onNein,
}: {
  belohnung: Belohnung;
  laeuft: boolean;
  onJa: () => void;
  onNein: () => void;
}) {
  const ja = useRef<HTMLButtonElement>(null);
  const text = `Möchtest du ${belohnung.name} für ${belohnung.preis} Punkte einlösen?`;
  useEffect(() => {
    ja.current?.focus();
  }, []);
  return (
    <div className="aufhoeren" role="dialog" aria-modal="true" aria-labelledby="einloesen-titel">
      <div className="aufhoeren-karte">
        <p className="aufhoeren-symbol" aria-hidden="true">
          {belohnung.symbol}
        </p>
        <div className="aufhoeren-titel">
          <h2 id="einloesen-titel">{belohnung.name} einlösen?</h2>
          <VorleseKnopf text={text} />
        </div>
        <p>
          Das kostet <strong>{belohnung.preis} Punkte</strong>. Dein Level bleibt gleich.
        </p>
        <div className="aufhoeren-knoepfe">
          <button ref={ja} type="button" className="runde-weiter" onClick={onJa} disabled={laeuft}>
            Ja, einlösen!
          </button>
          <button type="button" className="schreib-hilfe" onClick={onNein} disabled={laeuft}>
            Noch nicht
          </button>
        </div>
      </div>
    </div>
  );
}
