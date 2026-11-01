import { useEffect, useRef, useState } from 'react';
import { standardAufnahme, standardStrom } from './kameraZugriff.ts';

// Kamera direkt in der App: Die Seite wird nicht verlassen, also kann Android sie
// währenddessen auch nicht beenden (mit der System-Kamera gingen Fotos und Freigabe verloren).

export function Kamera({
  anzahl,
  onFoto,
  onFertig,
  onNichtVerfuegbar,
  holeStrom = standardStrom,
  nimmAuf = standardAufnahme,
}: {
  anzahl: number;
  onFoto: (datei: File) => void;
  onFertig: () => void;
  onNichtVerfuegbar: () => void;
  holeStrom?: () => Promise<MediaStream>;
  nimmAuf?: (video: HTMLVideoElement, strom: MediaStream) => Promise<Blob>;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [strom, setStrom] = useState<MediaStream | null>(null);
  const [blitz, setBlitz] = useState(false);
  const [beschaeftigt, setBeschaeftigt] = useState(false);

  useEffect(() => {
    let aktiv = true;
    let geoeffnet: MediaStream | null = null;
    holeStrom()
      .then((s) => {
        geoeffnet = s;
        if (!aktiv) return s.getTracks().forEach((t) => t.stop());
        setStrom(s);
        if (video.current) {
          video.current.srcObject = s;
          Promise.resolve(video.current.play?.()).catch(() => {});
        }
      })
      .catch(() => {
        if (aktiv) onNichtVerfuegbar();
      });
    return () => {
      aktiv = false;
      geoeffnet?.getTracks().forEach((t) => t.stop());
    };
    // Kamera nur einmal öffnen; die Rückrufe ändern sich bei jedem Rendern
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holeStrom]);

  async function ausloesen() {
    if (!strom || !video.current || beschaeftigt) return;
    setBeschaeftigt(true);
    setBlitz(true);
    setTimeout(() => setBlitz(false), 150);
    try {
      const bild = await nimmAuf(video.current, strom);
      onFoto(new File([bild], `foto-${Date.now()}.jpg`, { type: bild.type || 'image/jpeg' }));
    } catch {
      // ein misslungenes Foto einfach noch einmal aufnehmen
    } finally {
      setBeschaeftigt(false);
    }
  }

  return (
    <div className="kamera" role="dialog" aria-label="Kamera">
      <video ref={video} className="kamera-bild" playsInline muted autoPlay />
      {blitz && <div className="kamera-blitz" aria-hidden="true" />}
      <p className="kamera-zahl" role="status">
        {anzahl === 0 ? 'Ganze Seite ins Bild, dann auslösen' : `${anzahl} Foto(s) aufgenommen`}
      </p>
      <div className="kamera-knoepfe">
        <button
          type="button"
          className="kamera-ausloeser"
          aria-label="Foto aufnehmen"
          disabled={!strom || beschaeftigt}
          onClick={ausloesen}
        />
        <button type="button" className="kamera-fertig" onClick={onFertig}>
          Fertig
        </button>
      </div>
    </div>
  );
}
