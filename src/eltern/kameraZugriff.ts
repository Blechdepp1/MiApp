// Zugriff auf die Kamera für die Kamera-Ansicht in der App

export function kameraVerfuegbar() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export function standardStrom() {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 3072 } },
  });
}

// Chrome auf Android kann über ImageCapture in voller Kamera-Auflösung fotografieren
type BildAufnahme = { takePhoto(): Promise<Blob> };
type BildAufnahmeKlasse = new (spur: MediaStreamTrack) => BildAufnahme;

export async function standardAufnahme(video: HTMLVideoElement, strom: MediaStream) {
  const ImageCapture = (window as unknown as { ImageCapture?: BildAufnahmeKlasse }).ImageCapture;
  const spur = strom.getVideoTracks()[0];
  if (ImageCapture && spur) {
    try {
      return await new ImageCapture(spur).takePhoto();
    } catch {
      // weiter mit dem Standbild aus dem Video
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return new Promise<Blob>((fertig, fehler) =>
    canvas.toBlob((b) => (b ? fertig(b) : fehler(new Error('kein Bild'))), 'image/jpeg', 0.92),
  );
}
