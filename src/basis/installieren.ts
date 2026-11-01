// „Als App installieren“: Nur die installierte App läuft auf Android im Vollbild (ohne Adress-
// und Statusleiste, siehe manifest „display: fullscreen“). Chrome bietet die Installation über
// das Ereignis beforeinstallprompt an; es kommt früh beim Laden und wird hier aufgehoben.

type InstallAufforderung = Event & { prompt(): Promise<void> };

let aufforderung: InstallAufforderung | null = null;
const zuhoerer = new Set<() => void>();

export function beobachteInstallation(fenster: Window = window): void {
  fenster.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    aufforderung = e as InstallAufforderung;
    zuhoerer.forEach((z) => z());
  });
  fenster.addEventListener('appinstalled', () => {
    aufforderung = null;
    zuhoerer.forEach((z) => z());
  });
}

export function installierbar(): boolean {
  return aufforderung !== null;
}

export function beiAenderung(z: () => void): () => void {
  zuhoerer.add(z);
  return () => zuhoerer.delete(z);
}

export async function installieren(): Promise<void> {
  const a = aufforderung;
  aufforderung = null;
  zuhoerer.forEach((z) => z());
  await a?.prompt();
}

// Läuft die App schon installiert (eigenes Fenster bzw. Vollbild)?
export function laeuftAlsApp(fenster: Window = window): boolean {
  return ['fullscreen', 'standalone', 'minimal-ui'].some(
    (modus) => fenster.matchMedia?.(`(display-mode: ${modus})`).matches,
  );
}
