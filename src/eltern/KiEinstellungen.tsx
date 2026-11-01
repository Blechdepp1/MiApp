import { useEffect, useState, type FormEvent } from 'react';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import { useGeraet } from './GeraetKontext.tsx';
import {
  erzeugeKiClient,
  KI_MODELL,
  pruefeSchluessel,
  PRUEFUNG_TEXT,
  schluesselEnde,
  siehtWieSchluesselAus,
  standardKiSchluessel,
  type KiClientFabrik,
  type SchluesselPruefung,
} from './ki.ts';

// KI-Schlüssel hinterlegen, prüfen, entfernen – nur auf Eltern-Geräten
export function KiEinstellungen({
  speicher = standardKiSchluessel,
  fabrik = erzeugeKiClient,
}: {
  speicher?: GespeicherterWert<string>;
  fabrik?: KiClientFabrik;
}) {
  const istEltern = useGeraet().geraet?.rolle === 'eltern';
  const [gespeichert, setGespeichert] = useState<string | null | undefined>(undefined);
  const [eingabe, setEingabe] = useState('');
  const [pruefung, setPruefung] = useState<SchluesselPruefung | 'falsches-format' | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    if (!istEltern) return;
    speicher
      .laden()
      // „Entfernen“ speichert einen leeren Text
      .then((s) => setGespeichert(s || null))
      .catch(() => setGespeichert(null));
  }, [speicher, istEltern]);

  if (!istEltern) {
    return (
      <section className="verbinden">
        <h2>KI (Claude)</h2>
        <p className="eltern-hinweis">
          Die KI wird nur auf einem Eltern-Gerät eingerichtet. Auf dem Gerät des Kindes wird kein
          Schlüssel gespeichert.
        </p>
      </section>
    );
  }

  async function sichern(e: FormEvent) {
    e.preventDefault();
    const schluessel = eingabe.trim();
    if (!siehtWieSchluesselAus(schluessel)) {
      setPruefung('falsches-format');
      return;
    }
    setLaeuft(true);
    const ergebnis = await pruefeSchluessel(schluessel, fabrik);
    // Nur einen Schlüssel speichern, der nicht eindeutig abgelehnt wurde
    if (ergebnis !== 'ungueltig') {
      await speicher.speichern(schluessel);
      setGespeichert(schluessel);
      setEingabe('');
    }
    setPruefung(ergebnis);
    setLaeuft(false);
  }

  async function erneutPruefen() {
    if (!gespeichert) return;
    setLaeuft(true);
    setPruefung(await pruefeSchluessel(gespeichert, fabrik));
    setLaeuft(false);
  }

  async function entfernen() {
    await speicher.speichern('');
    setGespeichert(null);
    setPruefung(null);
  }

  const meldung =
    pruefung === 'falsches-format'
      ? 'Das sieht nicht wie ein Anthropic-Schlüssel aus (er beginnt mit „sk-ant-“).'
      : pruefung && PRUEFUNG_TEXT[pruefung];

  return (
    <section className="verbinden">
      <h2>KI (Claude)</h2>
      <p className="eltern-hinweis">
        Für „Lektion aus Fotos“. Der Schlüssel bleibt nur auf diesem Gerät und wird nie in Dropbox
        gespeichert. Modell: {KI_MODELL}, etwa 2–3 Cent pro Vokabelblatt.
      </p>

      {gespeichert ? (
        <>
          <p>
            KI ist eingerichtet, Schlüssel <strong>{schluesselEnde(gespeichert)}</strong>
          </p>
          <div className="verbinden-knoepfe">
            <button type="button" onClick={erneutPruefen} disabled={laeuft}>
              Prüfen
            </button>
            <button type="button" onClick={entfernen} disabled={laeuft}>
              Entfernen
            </button>
          </div>
        </>
      ) : (
        gespeichert === null && (
          <form className="ki-formular" onSubmit={sichern}>
            <label>
              <span>API-Schlüssel</span>
              <input
                type="password"
                value={eingabe}
                onChange={(e) => {
                  setEingabe(e.target.value);
                  setPruefung(null);
                }}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="sk-ant-…"
              />
            </label>
            <p className="eltern-hinweis">
              Einen Schlüssel legt ihr in der Anthropic Console unter „API Keys“ an.
            </p>
            <div className="verbinden-knoepfe">
              <button
                type="submit"
                className="verbinden-haupt"
                disabled={laeuft || !eingabe.trim()}
              >
                {laeuft ? 'Wird geprüft …' : 'Speichern und prüfen'}
              </button>
            </div>
          </form>
        )
      )}

      {meldung && (
        <p
          className={pruefung === 'ok' ? 'verbinden-ok' : 'verbinden-fehler'}
          role={pruefung === 'ok' ? 'status' : 'alert'}
        >
          {meldung}
        </p>
      )}
    </section>
  );
}
