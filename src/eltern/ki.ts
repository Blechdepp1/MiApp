import type Anthropic from '@anthropic-ai/sdk';
import { dexieWert, type GespeicherterWert } from '../daten/schluesselWert.ts';

// Claude wird nur im Eltern-Bereich genutzt, direkt aus dem Browser des Eltern-Geräts.
// Der Schlüssel liegt nur dort (lokale Datenbank, Tabelle „schluessel“) und wird nie abgeglichen.
export const KI_MODELL = 'claude-opus-5-5';

export const standardKiSchluessel: GespeicherterWert<string> = dexieWert<string>('ki-schluessel');

export type SchluesselPruefung = 'ok' | 'ungueltig' | 'keine-berechtigung' | 'kein-netz' | 'fehler';

export type KiClientFabrik = (schluessel: string) => Promise<Anthropic>;

// Das SDK wird erst geladen, wenn die KI gebraucht wird – das Kind-Gerät lädt es nie
export const erzeugeKiClient: KiClientFabrik = async (schluessel) => {
  const { default: AnthropicSdk } = await import('@anthropic-ai/sdk');
  return new AnthropicSdk({ apiKey: schluessel, dangerouslyAllowBrowser: true });
};

export function siehtWieSchluesselAus(text: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(text.trim());
}

// Für die Anzeige: nur das Ende des Schlüssels
export function schluesselEnde(schluessel: string): string {
  return `…${schluessel.slice(-4)}`;
}

// Kostenlose Prüfung: Darf dieser Schlüssel das Modell nutzen?
export async function pruefeSchluessel(
  schluessel: string,
  fabrik: KiClientFabrik = erzeugeKiClient,
): Promise<SchluesselPruefung> {
  try {
    const client = await fabrik(schluessel.trim());
    await client.models.retrieve(KI_MODELL);
    return 'ok';
  } catch (fehler) {
    const { default: AnthropicSdk } = await import('@anthropic-ai/sdk');
    if (fehler instanceof AnthropicSdk.AuthenticationError) return 'ungueltig';
    if (
      fehler instanceof AnthropicSdk.PermissionDeniedError ||
      fehler instanceof AnthropicSdk.NotFoundError
    ) {
      return 'keine-berechtigung';
    }
    if (fehler instanceof AnthropicSdk.APIConnectionError) return 'kein-netz';
    return 'fehler';
  }
}

export const PRUEFUNG_TEXT: Record<SchluesselPruefung, string> = {
  ok: 'Schlüssel funktioniert ✓',
  ungueltig: 'Dieser Schlüssel wird nicht angenommen. Bitte prüft ihn in der Anthropic Console.',
  'keine-berechtigung': `Der Schlüssel funktioniert, darf aber das Modell ${KI_MODELL} nicht nutzen.`,
  'kein-netz': 'Keine Verbindung. Ist das Internet an?',
  fehler: 'Die Prüfung hat gerade nicht geklappt. Bitte später noch einmal versuchen.',
};
