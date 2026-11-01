import { useEffect, useRef, useState } from 'react';
import type { GespeicherterWert } from '../daten/schluesselWert.ts';
import { istVokabelLektion, MAX_TITEL, pruefeLektion, type Lektion } from '../lektionen/lektion.ts';
import { useLektionen, useLektionenSpeicher } from '../lektionen/LektionenKontext.tsx';
import type { Vokabel } from '../vokabeln-en/typen.ts';
import {
  erkenneVokabeln,
  FEHLER_TEXT,
  FotoImportFehler,
  verkleinere,
  type Bild,
  type Erkennung,
} from './fotoImport.ts';
import { useGeraet } from './GeraetKontext.tsx';
import { standardKiSchluessel } from './ki.ts';

type Foto = { datei: File; vorschau: string };

type Schritt =
  | { art: 'liste' }
  | { art: 'neu'; fehler?: string }
  | { art: 'auswerten' }
  | { art: 'vorschau'; woerter: Vokabel[]; hinweis: string; ergaenzt: string[]; fehler?: string };

// Lektionen ansehen und neue aus Fotos anlegen (Englisch-Vokabeln in Version 1)
export function Lektionen({
  kiSchluessel = standardKiSchluessel,
  erkenne = erkenneVokabeln,
  leseBild = verkleinere,
}: {
  kiSchluessel?: GespeicherterWert<string>;
  erkenne?: (schluessel: string, bilder: Bild[]) => Promise<Erkennung>;
  leseBild?: (datei: File) => Promise<Bild>;
}) {
  const istEltern = useGeraet().geraet?.rolle === 'eltern';
  const lektionen = useLektionen() ?? [];
  const speicher = useLektionenSpeicher();
  const [schritt, setSchritt] = useState<Schritt>({ art: 'liste' });
  const [titel, setTitel] = useState('');
  const [klassenarbeit, setKlassenarbeit] = useState('');
  const [fotos, setFotos] = useState<Foto[]>([]);

  // Vorschaubilder beim Verlassen der Seite freigeben
  const offeneVorschauen = useRef(new Set<string>());
  useEffect(() => {
    const vorschauen = offeneVorschauen.current;
    return () => vorschauen.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function fotoEntfernen(foto: Foto) {
    URL.revokeObjectURL(foto.vorschau);
    offeneVorschauen.current.delete(foto.vorschau);
    setFotos((alt) => alt.filter((x) => x !== foto));
  }

  function zuruecksetzen() {
    fotos.forEach(fotoEntfernen);
    setTitel('');
    setKlassenarbeit('');
    setSchritt({ art: 'liste' });
  }

  function fotosDazu(dateien: FileList | null) {
    if (!dateien) return;
    const neu = [...dateien].map((datei) => ({ datei, vorschau: URL.createObjectURL(datei) }));
    neu.forEach((f) => offeneVorschauen.current.add(f.vorschau));
    setFotos((alt) => [...alt, ...neu]);
  }

  async function auswerten() {
    const schluessel = await kiSchluessel.laden().catch(() => undefined);
    if (!schluessel) {
      setSchritt({ art: 'neu', fehler: FEHLER_TEXT['kein-schluessel'] });
      return;
    }
    setSchritt({ art: 'auswerten' });
    try {
      const bilder = await Promise.all(fotos.map((f) => leseBild(f.datei)));
      const { woerter, hinweis, ergaenzt } = await erkenne(schluessel, bilder);
      setSchritt({ art: 'vorschau', woerter, hinweis, ergaenzt });
    } catch (fehler) {
      // Fotos bleiben erhalten, damit man es direkt noch einmal versuchen kann
      const art = fehler instanceof FotoImportFehler ? fehler.art : 'fehler';
      setSchritt({ art: 'neu', fehler: FEHLER_TEXT[art] });
    }
  }

  async function freigeben(woerter: Vokabel[], hinweis: string) {
    const jetzt = new Date().toISOString();
    const lektion: Lektion = {
      id: crypto.randomUUID(),
      fach: 'englisch',
      titel: titel.trim(),
      ...(klassenarbeit && { klassenarbeit }),
      erstellt: jetzt,
      geaendert: jetzt,
      inhalt: {
        art: 'vokabeln',
        woerter: woerter.map((w) => ({ ...w, en: w.en.trim(), de: w.de.trim() })),
      },
    };
    const fehler = pruefeLektion(lektion);
    if (fehler) {
      setSchritt({ art: 'vorschau', woerter, hinweis, ergaenzt: [], fehler });
      return;
    }
    await speicher.speichere(lektion);
    zuruecksetzen();
  }

  async function loeschen(lektion: Lektion) {
    if (!window.confirm(`Lektion „${lektion.titel}“ wirklich löschen?`)) return;
    await speicher.speichere({ ...lektion, geloescht: true, geaendert: new Date().toISOString() });
  }

  return (
    <section className="verbinden verwalten">
      <h2>Lektionen</h2>

      {schritt.art === 'liste' && (
        <>
          {lektionen.length === 0 ? (
            <p>Noch keine Lektionen. Bis dahin übt sie mit der eingebauten Beispielliste.</p>
          ) : (
            <ul className="verwalten-liste">
              {lektionen.map((l) => (
                <li key={l.id}>
                  <span aria-hidden="true">📘</span>
                  <span className="lektion-text">
                    <strong>{l.titel}</strong>
                    <span>
                      {istVokabelLektion(l) ? `${l.inhalt.woerter.length} Wörter` : l.fach}
                      {l.klassenarbeit &&
                        ` · Klassenarbeit ${new Date(l.klassenarbeit).toLocaleDateString('de-DE')}`}
                    </span>
                  </span>
                  {istEltern && (
                    <button
                      type="button"
                      className="verwalten-entfernen"
                      aria-label={`${l.titel} löschen`}
                      onClick={() => loeschen(l)}
                    >
                      🗑️
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {istEltern ? (
            <div className="verbinden-knoepfe">
              <button
                type="button"
                className="verbinden-haupt"
                onClick={() => setSchritt({ art: 'neu' })}
              >
                📷 Neue Lektion aus Fotos
              </button>
            </div>
          ) : (
            <p className="eltern-hinweis">Neue Lektionen legt ihr auf einem Eltern-Gerät an.</p>
          )}
        </>
      )}

      {schritt.art === 'neu' && (
        <div className="lektion-neu">
          <p>
            Fach: <strong>Englisch – Vokabeln</strong>
          </p>
          <label>
            <span>Titel</span>
            <input
              value={titel}
              maxLength={MAX_TITEL}
              placeholder="z. B. Unit 3 – At school"
              onChange={(e) => setTitel(e.target.value)}
            />
          </label>
          <label>
            <span>Klassenarbeit am (optional)</span>
            <input
              type="date"
              value={klassenarbeit}
              onChange={(e) => setKlassenarbeit(e.target.value)}
            />
          </label>

          <div className="lektion-fotos">
            {fotos.map((f, i) => (
              <figure key={f.vorschau}>
                <img src={f.vorschau} alt={`Foto ${i + 1}`} />
                <button
                  type="button"
                  aria-label={`Foto ${i + 1} entfernen`}
                  onClick={() => fotoEntfernen(f)}
                >
                  ✕
                </button>
              </figure>
            ))}
          </div>
          <div className="verbinden-knoepfe">
            <label className="lektion-dateiknopf">
              📷 Foto aufnehmen
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  fotosDazu(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            <label className="lektion-dateiknopf">
              🖼️ Aus Galerie
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  fotosDazu(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {schritt.fehler && (
            <p className="verbinden-fehler" role="alert">
              {schritt.fehler}
            </p>
          )}
          <div className="verbinden-knoepfe">
            <button
              type="button"
              className="verbinden-haupt"
              disabled={fotos.length === 0}
              onClick={auswerten}
            >
              Fotos auswerten
            </button>
            <button type="button" onClick={zuruecksetzen}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {schritt.art === 'auswerten' && (
        <p role="status">⏳ Die KI liest die Fotos … das dauert meist 10 bis 30 Sekunden.</p>
      )}

      {schritt.art === 'vorschau' && (
        <Vorschau
          woerter={schritt.woerter}
          hinweis={schritt.hinweis}
          ergaenzt={schritt.ergaenzt}
          fehler={schritt.fehler}
          titel={titel}
          setTitel={setTitel}
          onFreigeben={freigeben}
          onVerwerfen={zuruecksetzen}
        />
      )}
    </section>
  );
}

function Vorschau({
  woerter: start,
  hinweis,
  ergaenzt: startErgaenzt,
  fehler,
  titel,
  setTitel,
  onFreigeben,
  onVerwerfen,
}: {
  woerter: Vokabel[];
  hinweis: string;
  ergaenzt: string[];
  fehler?: string;
  titel: string;
  setTitel: (t: string) => void;
  onFreigeben: (woerter: Vokabel[], hinweis: string) => void;
  onVerwerfen: () => void;
}) {
  const [woerter, setWoerter] = useState(start);
  // Markierung verschwindet, sobald die Eltern die Übersetzung selbst anpassen
  const [ergaenzt, setErgaenzt] = useState(() => new Set(startErgaenzt));
  const anzahlErgaenzt = woerter.filter((w) => ergaenzt.has(w.id)).length;

  function aendere(i: number, feld: 'en' | 'de', wert: string) {
    const id = woerter[i]!.id;
    if (feld === 'de' && ergaenzt.has(id)) {
      setErgaenzt(new Set([...ergaenzt].filter((e) => e !== id)));
    }
    setWoerter(woerter.map((w, j) => (j === i ? { ...w, [feld]: wert } : w)));
  }

  return (
    <div className="lektion-neu">
      <p role="status">
        ✓ {woerter.length} Wörter erkannt. Bitte kurz prüfen und bei Bedarf korrigieren.
      </p>
      {anzahlErgaenzt > 0 && (
        <p className="eltern-hinweis">
          ✨ {anzahlErgaenzt === 1 ? '1 Übersetzung hat' : `${anzahlErgaenzt} Übersetzungen hat`}{' '}
          die KI ergänzt, weil sie im Heft noch fehlte. Sie sind markiert, bitte besonders prüfen.
        </p>
      )}
      {hinweis && <p className="eltern-hinweis">Hinweis der KI: {hinweis}</p>}
      <label>
        <span>Titel</span>
        <input value={titel} maxLength={MAX_TITEL} onChange={(e) => setTitel(e.target.value)} />
      </label>
      <ul className="verwalten-liste">
        {woerter.map((w, i) => (
          <li key={w.id} className={ergaenzt.has(w.id) ? 'lektion-ergaenzt' : undefined}>
            <input
              aria-label={`Englisch ${i + 1}`}
              lang="en"
              value={w.en}
              onChange={(e) => aendere(i, 'en', e.target.value)}
            />
            <input
              aria-label={`Deutsch ${i + 1}`}
              value={w.de}
              onChange={(e) => aendere(i, 'de', e.target.value)}
            />
            {ergaenzt.has(w.id) && (
              <span role="img" aria-label="Von der KI ergänzt" title="Von der KI ergänzt">
                ✨
              </span>
            )}
            <button
              type="button"
              className="verwalten-entfernen"
              aria-label={`Wort ${i + 1} löschen`}
              onClick={() => setWoerter(woerter.filter((_, j) => j !== i))}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
      {fehler && (
        <p className="verbinden-fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="verbinden-knoepfe">
        <button
          type="button"
          onClick={() => setWoerter([...woerter, { id: crypto.randomUUID(), en: '', de: '' }])}
        >
          + Wort
        </button>
        <button
          type="button"
          className="verbinden-haupt"
          onClick={() => onFreigeben(woerter, hinweis)}
        >
          Freigeben
        </button>
        <button type="button" onClick={onVerwerfen}>
          Verwerfen
        </button>
      </div>
    </div>
  );
}
