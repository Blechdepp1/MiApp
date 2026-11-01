import type Anthropic from '@anthropic-ai/sdk';
import type { Vokabel } from '../vokabeln-en/typen.ts';
import { erzeugeKiClient, KI_MODELL, type KiClientFabrik } from './ki.ts';

// Ein Foto, bereit für die API: verkleinertes JPEG als Base64 (ohne „data:“-Präfix)
export type Bild = { base64: string; medienTyp: 'image/jpeg' };

export type Erkennung = { woerter: Vokabel[]; hinweis: string };

export type ErkennungsFehler =
  'kein-schluessel' | 'kein-netz' | 'abgelehnt' | 'nichts-erkannt' | 'fehler';

export class FotoImportFehler extends Error {
  constructor(readonly art: ErkennungsFehler) {
    super(art);
  }
}

export const FEHLER_TEXT: Record<ErkennungsFehler, string> = {
  'kein-schluessel':
    'Auf diesem Gerät ist noch kein KI-Schlüssel hinterlegt (unten bei „KI (Claude)“).',
  'kein-netz':
    'Keine Verbindung. Die Fotos bleiben hier, ihr könnt es gleich noch einmal versuchen.',
  abgelehnt: 'Die KI hat die Fotos nicht ausgewertet. Bitte andere Fotos versuchen.',
  'nichts-erkannt':
    'Auf den Fotos wurden keine Vokabeln gefunden. Ist die ganze Liste gut zu sehen?',
  fehler:
    'Das Auswerten hat gerade nicht geklappt. Die Fotos bleiben hier, bitte noch einmal versuchen.',
};

// Lange Seite höchstens so viele Pixel: reicht für Schrift, spart Kosten und Zeit
export const MAX_KANTE = 1600;

// Im Browser verkleinern und als JPEG kodieren; das Originalfoto wird nirgends gespeichert
export async function verkleinere(datei: Blob, maxKante = MAX_KANTE): Promise<Bild> {
  const bitmap = await createImageBitmap(datei, { imageOrientation: 'from-image' });
  const faktor = Math.min(1, maxKante / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * faktor);
  canvas.height = Math.round(bitmap.height * faktor);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), medienTyp: 'image/jpeg' };
}

const SYSTEM = `Du liest Vokabellisten aus englischen Schulbüchern, Arbeitsheften und Lernzetteln der Klassen 5 bis 7 ab.
Die Eltern prüfen dein Ergebnis anschließend, bevor ihr Kind damit übt.

So gehst du vor:
- Gib jedes Wortpaar Englisch–Deutsch genau einmal aus, in der Reihenfolge der Vorlage.
- Übernimm die englische Schreibweise exakt, inklusive Großschreibung (z. B. Wochentage) und Angaben wie „(to) play“.
- Mehrere deutsche Bedeutungen trennst du mit Komma.
- Lass Lautschrift, Beispielsätze, Seitenzahlen, Überschriften und Übungsanweisungen weg.
- Ist ein Wort unleserlich oder abgeschnitten, lass es weg, statt zu raten, und nenne es im Hinweis.
- Der Hinweis ist ein kurzer deutscher Satz für die Eltern (z. B. was unsicher war). Ist alles klar, bleibt er leer.`;

const SCHEMA = {
  type: 'object',
  properties: {
    woerter: {
      type: 'array',
      items: {
        type: 'object',
        properties: { en: { type: 'string' }, de: { type: 'string' } },
        required: ['en', 'de'],
        additionalProperties: false,
      },
    },
    hinweis: { type: 'string' },
  },
  required: ['woerter', 'hinweis'],
  additionalProperties: false,
} as const;

// Erkennt die Wortpaare auf einem oder mehreren Fotos
export async function erkenneVokabeln(
  schluessel: string,
  bilder: readonly Bild[],
  fabrik: KiClientFabrik = erzeugeKiClient,
): Promise<Erkennung> {
  const [client, { default: AnthropicSdk }, { betaJSONSchemaOutputFormat }] = await Promise.all([
    fabrik(schluessel),
    import('@anthropic-ai/sdk'),
    import('@anthropic-ai/sdk/helpers/beta/json-schema'),
  ]);

  let antwort;
  try {
    antwort = await client.beta.messages.parse({
      model: KI_MODELL,
      max_tokens: 16000,
      // Lehnt das Modell fälschlich ab, übernimmt serverseitig ein passendes anderes Modell
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      output_config: { format: betaJSONSchemaOutputFormat(SCHEMA) },
      messages: [
        {
          role: 'user',
          content: [
            ...bilder.map((b): Anthropic.Beta.BetaImageBlockParam => ({
              type: 'image',
              source: { type: 'base64', media_type: b.medienTyp, data: b.base64 },
            })),
            {
              type: 'text',
              text:
                bilder.length > 1
                  ? `Hier sind ${bilder.length} Fotos derselben Vokabelliste. Lies alle Wortpaare ab.`
                  : 'Lies alle Wortpaare auf diesem Foto ab.',
            },
          ],
        },
      ],
    });
  } catch (fehler) {
    if (fehler instanceof AnthropicSdk.APIConnectionError) throw new FotoImportFehler('kein-netz');
    throw new FotoImportFehler('fehler');
  }

  if (antwort.stop_reason === 'refusal') throw new FotoImportFehler('abgelehnt');
  const ergebnis = antwort.parsed_output;
  if (!ergebnis) throw new FotoImportFehler('fehler');
  return bereinige(ergebnis.woerter, ergebnis.hinweis);
}

// Leere und doppelte Paare entfernen, ids vergeben
export function bereinige(
  roh: readonly { en: string; de: string }[],
  hinweis = '',
  neueId: () => string = () => crypto.randomUUID(),
): Erkennung {
  const gesehen = new Set<string>();
  const woerter: Vokabel[] = [];
  for (const { en, de } of roh) {
    const e = en.trim().replace(/\s+/g, ' ');
    const d = de.trim().replace(/\s+/g, ' ');
    const schluessel = `${e.toLowerCase()}|${d.toLowerCase()}`;
    if (!e || !d || gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    woerter.push({ id: neueId(), en: e, de: d });
  }
  if (woerter.length === 0) throw new FotoImportFehler('nichts-erkannt');
  return { woerter, hinweis: hinweis.trim() };
}
