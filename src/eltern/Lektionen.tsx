import { useEffect, useRef, useState } from 'react';
import { dexieWert, type GespeicherterWert } from '../daten/schluesselWert.ts';
import {
  MAX_TITEL,
  pruefeLektion,
  sortiereLektionen,
  STATUS_TEXT,
  statusVon,
  umfang,
  type Lektion,
} from '../lektionen/lektion.ts';
import { useLektionen, useLektionenSpeicher } from '../lektionen/LektionenKontext.tsx';
import { EintragFelder } from './Eintraege.tsx';
import { inhaltAus, leererEintrag, NAME, type Art, type Eintrag } from './eintragsArten.ts';
import {
  erkenneVerben,
  erkenneVokabeln,
  FEHLER_TEXT,
  FotoImportFehler,
  verkleinere,
  type Bild,
  type Erkennung,
  type VerbErkennung,
} from './fotoImport.ts';
import { useGeraet } from './GeraetKontext.tsx';
import { Kamera } from './Kamera.tsx';
import { Lerninhalte } from './Lerninhalte.tsx';
import { kameraVerfuegbar } from './kameraZugriff.ts';
import { standardKiSchluessel } from './ki.ts';

type Foto = { datei: File; vorschau: string };

// Angefangene Lektion. Android beendet die App oft, während die Kamera offen ist;
// danach geht es mit Titel, Datum und Fotos weiter, statt von vorn zu beginnen.
// inhaltsArt fehlt bei Entwürfen älterer Versionen und gilt dann als Vokabeln
export type Entwurf = { titel: string; klassenarbeit: string; fotos: File[]; inhaltsArt?: Art };
const standardEntwurf = dexieWert<Entwurf | null>('lektion-entwurf');

type Schritt =
  | { art: 'liste' }
  | { art: 'neu'; fehler?: string; detail?: string }
  | { art: 'auswerten' }
  | { art: 'vorschau'; eintraege: Eintrag[]; hinweis: string; ergaenzt: string[]; fehler?: string };

// Lektionen ansehen und neue aus Fotos anlegen (Englisch: Vokabeln oder unregelmäßige Verben)
export function Lektionen({
  kiSchluessel = standardKiSchluessel,
  erkenne = erkenneVokabeln,
  erkenneV = erkenneVerben,
  leseBild = verkleinere,
  entwurf = standardEntwurf,
  kamera = kameraVerfuegbar() ? {} : undefined,
}: {
  // Kamera in der App; fehlt sie, öffnet „Foto aufnehmen“ die System-Kamera
  kamera?: Pick<Parameters<typeof Kamera>[0], 'holeStrom' | 'nimmAuf'>;
  entwurf?: GespeicherterWert<Entwurf | null>;
  kiSchluessel?: GespeicherterWert<string>;
  erkenne?: (schluessel: string, bilder: Bild[]) => Promise<Erkennung>;
  erkenneV?: (schluessel: string, bilder: Bild[]) => Promise<VerbErkennung>;
  leseBild?: (datei: File) => Promise<Bild>;
}) {
  const istEltern = useGeraet().geraet?.rolle === 'eltern';
  const lektionen = useLektionen() ?? [];
  const speicher = useLektionenSpeicher();
  const [schritt, setSchritt] = useState<Schritt>({ art: 'liste' });
  const [titel, setTitel] = useState('');
  const [klassenarbeit, setKlassenarbeit] = useState('');
  const [inhaltsArt, setInhaltsArt] = useState<Art>('vokabeln');
  const [fotos, setFotos] = useState<Foto[]>([]);

  // Vorschaubilder beim Verlassen der Seite freigeben
  const offeneVorschauen = useRef(new Set<string>());
  useEffect(() => {
    const vorschauen = offeneVorschauen.current;
    return () => vorschauen.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Entwurf einmal laden und danach bei jeder Änderung sichern
  const [entwurfGeladen, setEntwurfGeladen] = useState(false);
  useEffect(() => {
    let aktiv = true;
    entwurf
      .laden()
      .catch(() => null)
      .then((e) => {
        if (!aktiv) return;
        if (e && (e.fotos.length > 0 || e.titel)) {
          const neu = e.fotos.map((datei) => ({ datei, vorschau: URL.createObjectURL(datei) }));
          neu.forEach((f) => offeneVorschauen.current.add(f.vorschau));
          setTitel(e.titel);
          setKlassenarbeit(e.klassenarbeit);
          setInhaltsArt(e.inhaltsArt ?? 'vokabeln');
          setFotos(neu);
          setSchritt({ art: 'neu' });
        }
        setEntwurfGeladen(true);
      });
    return () => {
      aktiv = false;
    };
  }, [entwurf]);

  useEffect(() => {
    if (!entwurfGeladen || schritt.art === 'vorschau') return;
    const wert =
      schritt.art === 'liste'
        ? null
        : { titel, klassenarbeit, inhaltsArt, fotos: fotos.map((f) => f.datei) };
    entwurf.speichern(wert).catch(() => {});
  }, [entwurf, entwurfGeladen, schritt.art, titel, klassenarbeit, inhaltsArt, fotos]);

  // Neue Lektion als eigene Vollbild-Ansicht: Jeder Schritt beginnt oben, nichts springt
  const vollbild = useRef<HTMLDivElement>(null);
  useEffect(() => {
    vollbild.current?.scrollTo?.(0, 0);
  }, [schritt.art]);
  const [kameraOffen, setKameraOffen] = useState(false);
  // null = zu, '' = Übersicht, sonst id der gewählten Lektion
  const [verwalten, setVerwalten] = useState<string | null>(null);
  const [ohneKamera, setOhneKamera] = useState(!kamera);

  function fotoEntfernen(foto: Foto) {
    URL.revokeObjectURL(foto.vorschau);
    offeneVorschauen.current.delete(foto.vorschau);
    setFotos((alt) => alt.filter((x) => x !== foto));
  }

  function zuruecksetzen() {
    fotos.forEach(fotoEntfernen);
    setTitel('');
    setKlassenarbeit('');
    setInhaltsArt('vokabeln');
    setSchritt({ art: 'liste' });
  }

  function fotosDazu(dateien: FileList | readonly File[] | null) {
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
      // Nacheinander verkleinern: viele große Fotos gleichzeitig überfordern den Speicher am Handy
      const bilder: Bild[] = [];
      for (const f of fotos) {
        try {
          bilder.push(await leseBild(f.datei));
        } catch (fehler) {
          throw new FotoImportFehler(
            'foto-lesen',
            fehler instanceof Error ? fehler.message.slice(0, 120) : undefined,
          );
        }
      }
      if (inhaltsArt === 'verben') {
        const { verben, hinweis, ergaenzt } = await erkenneV(schluessel, bilder);
        setSchritt({ art: 'vorschau', eintraege: verben, hinweis, ergaenzt });
      } else {
        const { woerter, hinweis, ergaenzt } = await erkenne(schluessel, bilder);
        setSchritt({ art: 'vorschau', eintraege: woerter, hinweis, ergaenzt });
      }
    } catch (fehler) {
      // Fotos bleiben erhalten, damit man es direkt noch einmal versuchen kann
      const art = fehler instanceof FotoImportFehler ? fehler.art : 'fehler';
      const detail =
        fehler instanceof FotoImportFehler
          ? fehler.detail
          : fehler instanceof Error
            ? fehler.message.slice(0, 120)
            : undefined;
      setSchritt({ art: 'neu', fehler: FEHLER_TEXT[art], detail });
    }
  }

  async function freigeben(eintraege: Eintrag[], hinweis: string) {
    const jetzt = new Date().toISOString();
    const lektion: Lektion = {
      id: crypto.randomUUID(),
      fach: 'englisch',
      titel: titel.trim(),
      ...(klassenarbeit && { klassenarbeit }),
      erstellt: jetzt,
      geaendert: jetzt,
      inhalt: inhaltAus(inhaltsArt, eintraege),
    };
    const fehler = pruefeLektion(lektion);
    if (fehler) {
      setSchritt({ art: 'vorschau', eintraege, hinweis, ergaenzt: [], fehler });
      return;
    }
    await speicher.speichere(lektion);
    zuruecksetzen();
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
              {sortiereLektionen(lektionen).map((l) => (
                <li key={l.id}>
                  <span aria-hidden="true">📘</span>
                  <span className="lektion-text">
                    <strong>{l.titel}</strong>
                    <span>
                      {umfang(l)}
                      {statusVon(l) !== 'aktiv' && ` · ${STATUS_TEXT[statusVon(l)]}`}
                      {l.klassenarbeit &&
                        ` · Klassenarbeit ${new Date(l.klassenarbeit).toLocaleDateString('de-DE')}`}
                    </span>
                  </span>
                  {istEltern && (
                    <button
                      type="button"
                      className="lektion-oeffnen"
                      aria-label={`${l.titel} bearbeiten`}
                      onClick={() => setVerwalten(l.id)}
                    >
                      ✏️
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
              <button type="button" onClick={() => setVerwalten('')}>
                📚 Lerninhalte verwalten
              </button>
            </div>
          ) : (
            <p className="eltern-hinweis">Neue Lektionen legt ihr auf einem Eltern-Gerät an.</p>
          )}
        </>
      )}

      {schritt.art !== 'liste' && (
        <div className="lektion-vollbild" ref={vollbild}>
          <h2>Neue Lektion</h2>
          {schritt.art === 'neu' && (
            <div className="lektion-neu">
              <fieldset className="bearbeiten-status">
                <legend>Englisch – was ist auf den Fotos?</legend>
                <div>
                  {(['vokabeln', 'verben'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={inhaltsArt === a}
                      onClick={() => setInhaltsArt(a)}
                    >
                      {a === 'verben' ? 'Unregelmäßige Verben' : 'Vokabeln'}
                    </button>
                  ))}
                </div>
                {inhaltsArt === 'verben' && (
                  <p className="eltern-hinweis">
                    Eine Liste wie „go – went – gone – gehen“. Fehlende Formen ergänzt die KI.
                  </p>
                )}
              </fieldset>
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
                {ohneKamera ? (
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
                ) : (
                  <button
                    type="button"
                    className="lektion-dateiknopf"
                    onClick={() => setKameraOffen(true)}
                  >
                    📷 Foto aufnehmen
                  </button>
                )}
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
                  {schritt.detail && (
                    <small className="fehler-detail">Technisch: {schritt.detail}</small>
                  )}
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
              art={inhaltsArt}
              eintraege={schritt.eintraege}
              hinweis={schritt.hinweis}
              ergaenzt={schritt.ergaenzt}
              fehler={schritt.fehler}
              titel={titel}
              setTitel={setTitel}
              onFreigeben={freigeben}
              onVerwerfen={zuruecksetzen}
            />
          )}
        </div>
      )}
      {kameraOffen && (
        <Kamera
          {...kamera}
          anzahl={fotos.length}
          onFoto={(datei) => fotosDazu([datei])}
          onFertig={() => setKameraOffen(false)}
          onNichtVerfuegbar={() => {
            setKameraOffen(false);
            setOhneKamera(true);
          }}
        />
      )}
      {verwalten !== null && (
        <Lerninhalte startId={verwalten || undefined} onSchliessen={() => setVerwalten(null)} />
      )}
    </section>
  );
}

function Vorschau({
  art,
  eintraege: start,
  hinweis,
  ergaenzt: startErgaenzt,
  fehler,
  titel,
  setTitel,
  onFreigeben,
  onVerwerfen,
}: {
  art: Art;
  eintraege: Eintrag[];
  hinweis: string;
  ergaenzt: string[];
  fehler?: string;
  titel: string;
  setTitel: (t: string) => void;
  onFreigeben: (eintraege: Eintrag[], hinweis: string) => void;
  onVerwerfen: () => void;
}) {
  const name = NAME[art];
  const [eintraege, setEintraege] = useState(start);
  // Markierung verschwindet, sobald die Eltern das Ergänzte selbst anpassen
  const [ergaenzt, setErgaenzt] = useState(() => new Set(startErgaenzt));
  const anzahlErgaenzt = eintraege.filter((w) => ergaenzt.has(w.id)).length;

  function aendere(i: number, neu: Eintrag) {
    const alt = eintraege[i]!;
    if (ergaenzt.has(alt.id) && ('formen' in neu || neu.de !== alt.de)) {
      setErgaenzt(new Set([...ergaenzt].filter((e) => e !== alt.id)));
    }
    setEintraege(eintraege.map((w, j) => (j === i ? neu : w)));
  }

  return (
    <div className="lektion-neu">
      <p role="status">
        ✓ {eintraege.length} {name.viele} erkannt. Bitte kurz prüfen und bei Bedarf korrigieren.
      </p>
      {anzahlErgaenzt > 0 && (
        <p className="eltern-hinweis">
          ✨{' '}
          {art === 'verben'
            ? `Bei ${anzahlErgaenzt === 1 ? '1 Verb' : `${anzahlErgaenzt} Verben`} hat die KI Formen oder die Bedeutung ergänzt.`
            : `${anzahlErgaenzt === 1 ? '1 Übersetzung hat' : `${anzahlErgaenzt} Übersetzungen hat`} die KI ergänzt, weil sie im Heft noch fehlte.`}{' '}
          Sie sind markiert, bitte besonders prüfen.
        </p>
      )}
      {hinweis && <p className="eltern-hinweis">Hinweis der KI: {hinweis}</p>}
      <label>
        <span>Titel</span>
        <input value={titel} maxLength={MAX_TITEL} onChange={(e) => setTitel(e.target.value)} />
      </label>
      <ul className="verwalten-liste">
        {eintraege.map((w, i) => (
          <li key={w.id} className={ergaenzt.has(w.id) ? 'lektion-ergaenzt' : undefined}>
            <EintragFelder eintrag={w} nr={i + 1} onAendern={(neu) => aendere(i, neu)} />
            {ergaenzt.has(w.id) && (
              <span role="img" aria-label="Von der KI ergänzt" title="Von der KI ergänzt">
                ✨
              </span>
            )}
            <button
              type="button"
              className="verwalten-entfernen"
              aria-label={`${name.einer} ${i + 1} löschen`}
              onClick={() => setEintraege(eintraege.filter((_, j) => j !== i))}
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
        <button type="button" onClick={() => setEintraege([...eintraege, leererEintrag(art)])}>
          + {name.einer}
        </button>
        <button
          type="button"
          className="verbinden-haupt"
          onClick={() => onFreigeben(eintraege, hinweis)}
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
