// Eltern-PIN: gespeichert wird nur ein gesalzener SHA-256-Prüfwert, nie die PIN selbst.
// Bei 4 Ziffern ist das kein Schutz gegen Fachleute, aber gegen neugierige Kinderfinger.

export type PinPruefwert = { salz: string; hash: string };

export const PIN_LAENGE = 4;

function hex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

export function istGueltigePin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LAENGE}}$`).test(pin);
}

export async function erzeugePruefwert(pin: string): Promise<PinPruefwert> {
  if (!istGueltigePin(pin)) throw new Error(`Die PIN muss aus ${PIN_LAENGE} Ziffern bestehen`);
  const salz = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { salz, hash: await sha256(`${salz}:${pin}`) };
}

export async function pruefePin(pin: string, wert: PinPruefwert): Promise<boolean> {
  return (await sha256(`${wert.salz}:${pin}`)) === wert.hash;
}

// Nach zu vielen Fehlversuchen kurz sperren, damit Durchprobieren keinen Spaß macht
export const MAX_FEHLVERSUCHE = 5;
export const SPERRE_MS = 60_000;
