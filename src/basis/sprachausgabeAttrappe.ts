// Test-Attrappe für window.speechSynthesis und SpeechSynthesisUtterance (jsdom kennt beide nicht)

export class AttrappenAeusserung {
  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

export function stimme(lang: string, name = lang, localService = true): SpeechSynthesisVoice {
  return { lang, name, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

export function installiereSprachausgabe(stimmen: SpeechSynthesisVoice[] = []) {
  const gesprochen: AttrappenAeusserung[] = [];
  let laufend: AttrappenAeusserung | null = null;
  const events = new EventTarget();
  const synth = {
    getVoices: () => stimmen,
    speak: (a: AttrappenAeusserung) => {
      gesprochen.push(a);
      laufend = a;
    },
    cancel: () => {
      const a = laufend;
      laufend = null;
      a?.onerror?.();
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  globalThis.SpeechSynthesisUtterance =
    AttrappenAeusserung as unknown as typeof SpeechSynthesisUtterance;

  return {
    gesprochen,
    beendeAktuelle() {
      const a = laufend;
      laufend = null;
      a?.onend?.();
    },
    setzeStimmen(neu: SpeechSynthesisVoice[]) {
      stimmen = neu;
      events.dispatchEvent(new Event('voiceschanged'));
    },
  };
}

export function entferneSprachausgabe() {
  Reflect.deleteProperty(window, 'speechSynthesis');
}
