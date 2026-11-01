// Spracherkennung des Browsers (Chrome auf Android: webkitSpeechRecognition).
// Hinweis: Chrome schickt die Aufnahme dafür an Googles Spracherkennung.

// Minimale Typen der Web-Spracherkennung (Chrome: webkitSpeechRecognition)
type ErkennungsErgebnis = { isFinal: boolean; 0: { transcript: string } };
export type Erkennung = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ErkennungsErgebnis> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
export type ErkennungsFabrik = () => Erkennung;

export function standardErkennung(): ErkennungsFabrik | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Erkennung;
    webkitSpeechRecognition?: new () => Erkennung;
  };
  const Klasse = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Klasse ? () => new Klasse() : null;
}
