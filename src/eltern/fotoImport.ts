import type Anthropic from '@anthropic-ai/sdk';
import type { Verb } from '../lektionen/lektion.ts';
import type { Vokabel } from '../vokabeln-en/typen.ts';
import { erzeugeKiClient, KI_MODELL, type KiClientFabrik } from './ki.ts';

// Ein Foto, bereit für die API: verkleinertes JPEG als Base64 (ohne „data:“-Präfix)
export type Bild = { base64: string; medienTyp: 'image/jpeg' };

// ergaenzt: ids der Wörter, deren Übersetzung im Heft fehlte und von der KI stammt
export type Erkennung = { woerter: Vokabel[]; hinweis: string; ergaenzt: string[] };
// Dasselbe für eine Tabelle unregelmäßiger Verben
export type VerbErkennung = { verben: Verb[]; hinweis: string; ergaenzt: string[] };

export type ErkennungsFehler =
  | 'kein-schluessel'
  | 'kein-netz'
  | 'abgelehnt'
  | 'nichts-erkannt'
  | 'schluessel-ungueltig'
  | 'limit'
  | 'ueberlastet'
  | 'zu-viel'
  | 'foto-lesen'
  | 'fehler';

export class FotoImportFehler extends Error {
  // detail: kurze technische Angabe (z. B. „429 rate_limit_error“), damit man den Fehler melden kann
  constructor(
    readonly art: ErkennungsFehler,
    readonly detail?: string,
  ) {
    super(detail ? `${art}: ${detail}` : art);
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
  'schluessel-ungueltig':
    'Der KI-Schlüssel wird nicht angenommen (abgelaufen oder widerrufen?). Bitte unten bei „KI (Claude)“ prüfen.',
  limit:
    'Das Limit des KI-Schlüssels ist gerade erreicht (zu viele Anfragen oder Monatslimit). Bitte später noch einmal versuchen oder das Limit in der Anthropic-Konsole prüfen.',
  ueberlastet:
    'Die KI ist gerade überlastet. Die Fotos bleiben hier, bitte gleich noch einmal versuchen.',
  'zu-viel':
    'Das waren zu viele Fotos oder Wörter auf einmal. Bitte höchstens 4 bis 5 Seiten pro Lektion auswerten.',
  'foto-lesen': 'Ein Foto ließ sich nicht öffnen. Bitte das Foto entfernen und neu aufnehmen.',
  fehler:
    'Das Auswerten hat gerade nicht geklappt. Die Fotos bleiben hier, bitte noch einmal versuchen.',
};

// Fehler der API in eine verständliche Art übersetzen
function apiFehler(fehler: unknown, AnthropicSdk: typeof Anthropic): FotoImportFehler {
  if (fehler instanceof AnthropicSdk.APIConnectionError) return new FotoImportFehler('kein-netz');
  if (fehler instanceof AnthropicSdk.APIError) {
    const detail = [fehler.status, fehler.type].filter(Boolean).join(' ');
    const status = fehler.status ?? 0;
    if (status === 401 || status === 403)
      return new FotoImportFehler('schluessel-ungueltig', detail);
    if (status === 429) return new FotoImportFehler('limit', detail);
    if (status === 413) return new FotoImportFehler('zu-viel', detail);
    if (status >= 500) return new FotoImportFehler('ueberlastet', detail);
    return new FotoImportFehler('fehler', detail);
  }
  return new FotoImportFehler(
    'fehler',
    fehler instanceof Error ? fehler.message.slice(0, 120) : '',
  );
}

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
- Gib jedes englische Wort genau einmal aus, in der Reihenfolge der Vorlage.
- Übernimm die englische Schreibweise exakt, inklusive Großschreibung (z. B. Wochentage) und Angaben wie „(to) play“.
- Mehrere deutsche Bedeutungen trennst du mit Komma.
- Lass Lautschrift, Beispielsätze, Seitenzahlen, Überschriften und Übungsanweisungen weg.
- Oft hat das Kind die deutsche Seite noch nicht (ganz) ausgefüllt. Fehlt die Übersetzung oder ist sie nur angefangen, übernimm das englische Wort trotzdem und ergänze die naheliegendste deutsche Bedeutung, wie sie im Englischunterricht der 6. Klasse gelernt wird. Setze dann „ergaenzt“ auf true, sonst auf false.
- Richte ergänzte Übersetzungen nach denen, die schon auf der Seite stehen: Werden dort z. B. Vergangenheitsformen wie „began“ mit dem deutschen Infinitiv („anfangen, beginnen“) übersetzt, machst du es bei den anderen genauso.
- Ist ein Wort unleserlich oder abgeschnitten, lass es weg, statt zu raten, und nenne es im Hinweis.
- Der Hinweis ist ein kurzer deutscher Satz für die Eltern (z. B. was unsicher war). Ist alles klar, bleibt er leer.`;

const SCHEMA = {
  type: 'object',
  properties: {
    woerter: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          en: { type: 'string' },
          de: { type: 'string' },
          ergaenzt: { type: 'boolean' },
        },
        required: ['en', 'de', 'ergaenzt'],
        additionalProperties: false,
      },
    },
    hinweis: { type: 'string' },
  },
  required: ['woerter', 'hinweis'],
  additionalProperties: false,
} as const;

// Fotos mit Anweisung und Schema an die KI schicken und das geprüfte Ergebnis zurückgeben
async function frageKi<T>(
  schluessel: string,
  bilder: readonly Bild[],
  system: string,
  schema: Parameters<
    typeof import('@anthropic-ai/sdk/helpers/beta/json-schema').betaJSONSchemaOutputFormat
  >[0],
  text: string,
  fabrik: KiClientFabrik,
): Promise<T> {
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
      system,
      output_config: { format: betaJSONSchemaOutputFormat(schema) },
      messages: [
        {
          role: 'user',
          content: [
            ...bilder.map((b): Anthropic.Beta.BetaImageBlockParam => ({
              type: 'image',
              source: { type: 'base64', media_type: b.medienTyp, data: b.base64 },
            })),
            { type: 'text', text },
          ],
        },
      ],
    });
  } catch (fehler) {
    throw apiFehler(fehler, AnthropicSdk);
  }

  if (antwort.stop_reason === 'refusal') throw new FotoImportFehler('abgelehnt');
  // Antwort abgeschnitten: zu viele Wörter für eine Anfrage
  if (antwort.stop_reason === 'max_tokens') throw new FotoImportFehler('zu-viel', 'max_tokens');
  const ergebnis = antwort.parsed_output;
  if (!ergebnis) throw new FotoImportFehler('fehler', `keine Daten (${antwort.stop_reason})`);
  return ergebnis as T;
}

// Erkennt die Wortpaare auf einem oder mehreren Fotos
export async function erkenneVokabeln(
  schluessel: string,
  bilder: readonly Bild[],
  fabrik: KiClientFabrik = erzeugeKiClient,
): Promise<Erkennung> {
  const ergebnis = await frageKi<{
    woerter: { en: string; de: string; ergaenzt: boolean }[];
    hinweis: string;
  }>(
    schluessel,
    bilder,
    SYSTEM,
    SCHEMA,
    bilder.length > 1
      ? `Hier sind ${bilder.length} Fotos derselben Vokabelliste. Lies alle Wortpaare ab.`
      : 'Lies alle Wortpaare auf diesem Foto ab.',
    fabrik,
  );
  return bereinige(ergebnis.woerter, ergebnis.hinweis);
}

const SYSTEM_VERBEN = `Du liest Listen unregelmäßiger englischer Verben aus Schulbüchern, Arbeitsheften und Vokabelheften der Klassen 5 bis 7 ab.
Die Eltern prüfen dein Ergebnis anschließend, bevor ihr Kind damit übt.

So gehst du vor:
- Gib jedes Verb genau einmal aus, in der Reihenfolge der Vorlage, mit den drei Formen infinitive, simple past und past participle sowie der deutschen Bedeutung im Infinitiv.
- Übernimm die englische Schreibweise exakt. Gibt es zwei Formen (z. B. „was/were“), trenne sie mit Komma: „was, were“.
- Mehrere deutsche Bedeutungen trennst du mit Komma.
- Oft stehen nicht alle Spalten da (z. B. nur „began – anfangen“), oder das Kind hat die Liste noch nicht fertig ausgefüllt. Ergänze dann die fehlenden Formen nach britischem Schulenglisch und die naheliegendste deutsche Bedeutung, wie sie in der 6. Klasse gelernt wird. Setze dann „ergaenzt“ auf true, sonst auf false.
- Lass Lautschrift, Beispielsätze, Seitenzahlen, Überschriften und regelmäßige Verben weg.
- Ist ein Verb unleserlich oder abgeschnitten, lass es weg, statt zu raten, und nenne es im Hinweis.
- Der Hinweis ist ein kurzer deutscher Satz für die Eltern (z. B. was unsicher war). Ist alles klar, bleibt er leer.`;

const SCHEMA_VERBEN = {
  type: 'object',
  properties: {
    verben: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          infinitive: { type: 'string' },
          simplePast: { type: 'string' },
          pastParticiple: { type: 'string' },
          de: { type: 'string' },
          ergaenzt: { type: 'boolean' },
        },
        required: ['infinitive', 'simplePast', 'pastParticiple', 'de', 'ergaenzt'],
        additionalProperties: false,
      },
    },
    hinweis: { type: 'string' },
  },
  required: ['verben', 'hinweis'],
  additionalProperties: false,
} as const;

type RohVerb = {
  infinitive: string;
  simplePast: string;
  pastParticiple: string;
  de: string;
  ergaenzt?: boolean;
};

// Erkennt eine Liste unregelmäßiger Verben auf einem oder mehreren Fotos
export async function erkenneVerben(
  schluessel: string,
  bilder: readonly Bild[],
  fabrik: KiClientFabrik = erzeugeKiClient,
): Promise<VerbErkennung> {
  const ergebnis = await frageKi<{ verben: RohVerb[]; hinweis: string }>(
    schluessel,
    bilder,
    SYSTEM_VERBEN,
    SCHEMA_VERBEN,
    bilder.length > 1
      ? `Hier sind ${bilder.length} Fotos derselben Verbliste. Lies alle Verben ab.`
      : 'Lies alle Verben auf diesem Foto ab.',
    fabrik,
  );
  return bereinigeVerben(ergebnis.verben, ergebnis.hinweis);
}

export function bereinigeVerben(
  roh: readonly RohVerb[],
  hinweis = '',
  neueId: () => string = () => crypto.randomUUID(),
): VerbErkennung {
  const gesehen = new Set<string>();
  const verben: Verb[] = [];
  const ergaenzt: string[] = [];
  const sauber = (t: string) => t.trim().replace(/\s+/g, ' ');
  for (const r of roh) {
    const formen: Verb['formen'] = [
      sauber(r.infinitive),
      sauber(r.simplePast),
      sauber(r.pastParticiple),
    ];
    const de = sauber(r.de);
    const schluessel = formen.join('|').toLowerCase();
    if (!de || formen.some((f) => !f) || gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    const id = neueId();
    verben.push({ id, de, formen });
    if (r.ergaenzt) ergaenzt.push(id);
  }
  if (verben.length === 0) throw new FotoImportFehler('nichts-erkannt');
  return { verben, hinweis: hinweis.trim(), ergaenzt };
}

// Leere und doppelte Paare entfernen, ids vergeben
export function bereinige(
  roh: readonly { en: string; de: string; ergaenzt?: boolean }[],
  hinweis = '',
  neueId: () => string = () => crypto.randomUUID(),
): Erkennung {
  const gesehen = new Set<string>();
  const woerter: Vokabel[] = [];
  const ergaenzt: string[] = [];
  for (const { en, de, ergaenzt: vonKi } of roh) {
    const e = en.trim().replace(/\s+/g, ' ');
    const d = de.trim().replace(/\s+/g, ' ');
    const schluessel = `${e.toLowerCase()}|${d.toLowerCase()}`;
    if (!e || !d || gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    const id = neueId();
    woerter.push({ id, en: e, de: d });
    if (vonKi) ergaenzt.push(id);
  }
  if (woerter.length === 0) throw new FotoImportFehler('nichts-erkannt');
  return { woerter, hinweis: hinweis.trim(), ergaenzt };
}
