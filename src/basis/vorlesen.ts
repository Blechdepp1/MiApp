// Vorlesen über die Web Speech API (speechSynthesis)

export type Sprache = 'de' | 'en';

export type VorleseErgebnis = 'fertig' | 'abgebrochen' | 'keine-stimme' | 'nicht-verfuegbar';

// Bevorzugte Regionen: Deutsch aus Deutschland, Englisch britisch wie in der Schule
const BEVORZUGT: Record<Sprache, string[]> = {
  de: ['de-DE', 'de-AT', 'de-CH'],
  en: ['en-GB', 'en-US', 'en-AU'],
};

const STANDARD_TEMPO = 0.9;

function norm(lang: string): string {
  return lang.replace('_', '-').toLowerCase();
}

export function stimmeFuer(
  sprache: Sprache,
  stimmen: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  for (const region of BEVORZUGT[sprache]) {
    const passend = stimmen.filter((s) => norm(s.lang) === norm(region));
    const lokal = passend.find((s) => s.localService);
    if (lokal ?? passend[0]) return lokal ?? passend[0];
  }
  return stimmen.find((s) => norm(s.lang).startsWith(sprache));
}

export function vorleseVerfuegbar(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Stimmen kommen auf Android oft erst nach dem Event "voiceschanged"
export function ladeStimmen(wartezeitMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!vorleseVerfuegbar()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const sofort = synth.getVoices();
  if (sofort.length > 0) return Promise.resolve(sofort);
  return new Promise((resolve) => {
    const fertig = () => {
      synth.removeEventListener('voiceschanged', fertig);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(fertig, wartezeitMs);
    synth.addEventListener('voiceschanged', fertig);
  });
}

// Welcher Knopf gerade vorliest, damit ein neuer Knopf den alten zurücksetzt
let aktuelleId: string | null = null;
const zuhoerer = new Set<() => void>();

function setzeAktuelleId(id: string | null) {
  aktuelleId = id;
  zuhoerer.forEach((z) => z());
}

export function liestGerade(): string | null {
  return aktuelleId;
}

export function beobachteVorlesen(z: () => void): () => void {
  zuhoerer.add(z);
  return () => zuhoerer.delete(z);
}

export function stoppen(): void {
  if (vorleseVerfuegbar()) window.speechSynthesis.cancel();
  setzeAktuelleId(null);
}

export async function vorlesen(
  text: string,
  sprache: Sprache,
  optionen: { id?: string; tempo?: number } = {},
): Promise<VorleseErgebnis> {
  if (!vorleseVerfuegbar()) return 'nicht-verfuegbar';
  const id = optionen.id ?? text;
  stoppen();

  const stimmen = await ladeStimmen();
  const stimme = stimmeFuer(sprache, stimmen);
  // Ist die Liste leer, versuchen wir es trotzdem: manche Geräte melden keine Stimmen
  if (!stimme && stimmen.length > 0) return 'keine-stimme';

  const aeusserung = new SpeechSynthesisUtterance(text);
  aeusserung.lang = stimme?.lang ?? BEVORZUGT[sprache][0]!;
  if (stimme) aeusserung.voice = stimme;
  aeusserung.rate = optionen.tempo ?? STANDARD_TEMPO;

  setzeAktuelleId(id);
  return new Promise((resolve) => {
    const ende = (ergebnis: VorleseErgebnis) => {
      if (aktuelleId === id) setzeAktuelleId(null);
      resolve(ergebnis);
    };
    aeusserung.onend = () => ende('fertig');
    aeusserung.onerror = () => ende('abgebrochen');
    window.speechSynthesis.speak(aeusserung);
  });
}
