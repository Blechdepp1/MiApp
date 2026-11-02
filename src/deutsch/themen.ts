import type { AntippAufgabe, Aufgabe, SchreibAufgabe, Thema, WaehlAufgabe } from './typen.ts';

// Aufgaben nach „Deutsch Fit“ S. 3–10 (Wortarten, Nomen, Verben, Adjektive, Satzarten,
// Satzzeichen, Subjekt und Prädikat), ergänzt um weitere Beispiele gleicher Art.
// ids nie nachträglich ändern: Der Wiederholungsplan merkt sich den Stand je id.

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function waehlen(
  prefix: string,
  frage: string,
  inhalt: string,
  optionen: string[],
  richtig: string | string[],
  hilfe?: string,
): WaehlAufgabe {
  return {
    id: `${prefix}-${slug(inhalt)}`,
    art: 'waehlen',
    frage,
    inhalt,
    optionen,
    richtig: Array.isArray(richtig) ? richtig : [richtig],
    ...(hilfe && { hilfe }),
  };
}

function schreiben(
  prefix: string,
  frage: string,
  inhalt: string,
  loesungen: string[],
  hilfe?: string,
): SchreibAufgabe {
  return {
    id: `${prefix}-${slug(inhalt)}`,
    art: 'schreiben',
    frage,
    inhalt,
    loesungen,
    ...(hilfe && { hilfe }),
  };
}

function antippen(
  prefix: string,
  frage: string,
  satz: string,
  richtig: number[],
  kern?: number[],
  hilfe?: string,
): AntippAufgabe {
  return {
    id: `${prefix}-${slug(satz)}`,
    art: 'antippen',
    frage,
    satz,
    richtig,
    ...(kern && { kern }),
    ...(hilfe && { hilfe }),
  };
}

// --- Wortarten (S. 3) ---------------------------------------------------------------------

type Wortart = 'Nomen' | 'Verb' | 'Adjektiv';
const WORTART_HILFE: Record<Wortart, string> = {
  Nomen:
    'Artikelprobe: Passt der, die oder das davor? Dann ist es ein Nomen. Nomen schreibt man groß.',
  Verb: 'Passt ich oder wir davor? Verben sagen, was jemand tut.',
  Adjektiv: 'Passt „Das ist …“ oder „der … Hund“? Adjektive sagen, wie etwas ist.',
};

function wortart(wort: string, art: Wortart): WaehlAufgabe {
  return waehlen(
    'wa',
    'Welche Wortart ist das?',
    wort,
    ['Nomen', 'Verb', 'Adjektiv'],
    art,
    WORTART_HILFE[art],
  );
}

const WORTARTEN: Thema = {
  id: 'de-wortarten',
  titel: 'Wortarten erkennen',
  symbol: '🔤',
  seiten: 'S. 3',
  merkwissen: [
    'Nomen sind Namenwörter: Menschen, Tiere, Dinge oder Gefühle. Beispiele: der Hund, die Schule, die Freude. Nomen schreibt man groß.',
    'Verben sind Tunwörter: Sie sagen, was jemand tut oder was passiert. Beispiele: laufen, schreiben, spielen.',
    'Adjektive sind Wiewörter: Sie beschreiben, wie etwas ist. Beispiele: schnell, lustig, freundlich.',
    'Verben und Adjektive schreibt man klein.',
  ],
  woerter: [
    ...['Freund', 'Heft', 'Schule', 'Ball', 'Lehrer', 'Freundschaft', 'Katze', 'Ferien'].map((w) =>
      wortart(w, 'Nomen'),
    ),
    ...['Tisch', 'Hund', 'Freude', 'Pause', 'Angst'].map((w) => wortart(w, 'Nomen')),
    ...['springen', 'lernen', 'lesen', 'malen', 'laufen', 'schreiben', 'schlafen', 'sehen'].map(
      (w) => wortart(w, 'Verb'),
    ),
    ...['spielen', 'rennen', 'singen'].map((w) => wortart(w, 'Verb')),
    ...['leise', 'mutig', 'traurig', 'fröhlich', 'schnell', 'spannend', 'laut'].map((w) =>
      wortart(w, 'Adjektiv'),
    ),
    ...['freundlich', 'lustig', 'müde', 'glücklich', 'schwierig'].map((w) =>
      wortart(w, 'Adjektiv'),
    ),
  ],
};

// --- Nomen (S. 4) -------------------------------------------------------------------------

function artikel(nomen: string, richtig: 'der' | 'die' | 'das'): WaehlAufgabe {
  return waehlen(
    'no-art',
    'Welcher Artikel passt?',
    nomen,
    ['der', 'die', 'das'],
    richtig,
    `Sprich alle drei: der ${nomen}, die ${nomen}, das ${nomen}. Was klingt richtig?`,
  );
}

const UMLAUT_HILFE = 'Achte auf ä, ö, ü: In der Mehrzahl wird aus a, o, u oft ä, ö, ü.';

function mehrzahl(einzahl: string, plural: string): SchreibAufgabe {
  const umlaut = /[äöü]/i.test(plural) && !/[äöü]/i.test(einzahl);
  return schreiben(
    'no-mz',
    'Schreibe die Mehrzahl.',
    `${einzahl} → die …`,
    [plural, `die ${plural}`],
    umlaut ? UMLAUT_HILFE : 'Sprich die Mehrzahl langsam in Silben und hör genau hin.',
  );
}

function zusammen(teil1: string, teil2: string, ganz: string): SchreibAufgabe {
  return schreiben(
    'no-zs',
    'Bilde ein zusammengesetztes Nomen.',
    `${teil1} + ${teil2}`,
    [ganz],
    'Ohne Lücke zusammenschreiben. Nur der erste Buchstabe ist groß.',
  );
}

const NOMEN: Thema = {
  id: 'de-nomen',
  titel: 'Nomen: Artikel, Mehrzahl, zusammensetzen',
  symbol: '🏷️',
  seiten: 'S. 4',
  merkwissen: [
    'Vor Nomen steht ein Artikel: der, die oder das.',
    'Die Mehrzahl hat immer den Artikel „die“: der Hund → die Hunde.',
    'In der Mehrzahl wird aus a, o, u oft ä, ö, ü: der Baum → die Bäume, das Buch → die Bücher.',
    'Zusammengesetzte Nomen schreibt man zusammen: Schul + hof → Schulhof.',
  ],
  woerter: [
    artikel('Apfel', 'der'),
    artikel('Haus', 'das'),
    artikel('Lehrerin', 'die'),
    artikel('Kind', 'das'),
    artikel('Tafel', 'die'),
    artikel('Blume', 'die'),
    artikel('Hund', 'der'),
    artikel('Heft', 'das'),
    artikel('Baum', 'der'),
    artikel('Buch', 'das'),
    artikel('Stuhl', 'der'),
    artikel('Tasche', 'die'),
    artikel('Fenster', 'das'),
    artikel('Füller', 'der'),
    mehrzahl('der Hund', 'Hunde'),
    mehrzahl('die Klasse', 'Klassen'),
    mehrzahl('das Buch', 'Bücher'),
    mehrzahl('der Baum', 'Bäume'),
    mehrzahl('das Kind', 'Kinder'),
    mehrzahl('das Haus', 'Häuser'),
    mehrzahl('der Apfel', 'Äpfel'),
    mehrzahl('der Ball', 'Bälle'),
    mehrzahl('das Heft', 'Hefte'),
    mehrzahl('der Stuhl', 'Stühle'),
    mehrzahl('die Maus', 'Mäuse'),
    mehrzahl('die Blume', 'Blumen'),
    zusammen('Schul', 'hof', 'Schulhof'),
    zusammen('Haus', 'tür', 'Haustür'),
    zusammen('Lese', 'buch', 'Lesebuch'),
    zusammen('Spiel', 'platz', 'Spielplatz'),
    zusammen('Fuß', 'ball', 'Fußball'),
    zusammen('Klassen', 'raum', 'Klassenraum'),
    zusammen('Haus', 'aufgabe', 'Hausaufgabe'),
    zusammen('Sport', 'halle', 'Sporthalle'),
  ],
};

// --- Verben (S. 5) ------------------------------------------------------------------------

function beugen(person: string, verb: string, form: string, hilfe?: string): SchreibAufgabe {
  return schreiben(
    've-form',
    'Setze das Verb in die passende Form.',
    `${person} … (${verb})`,
    [form],
    hilfe ?? 'du → -st, er/sie/es → -t, wir → -en. Beispiel: du spielst, er spielt.',
  );
}

const STAMM_HILFE = 'Hier ändert sich der Selbstlaut: ';

function vergangenheit(gegenwart: string, form: string, unregelmaessig: boolean): SchreibAufgabe {
  return schreiben(
    've-vg',
    'Schreibe die Vergangenheit.',
    `ich ${gegenwart} → gestern: ich …`,
    [form, `ich ${form}`],
    unregelmaessig
      ? `Unregelmäßiges Verb, das merkt man sich: ich ${gegenwart} → ich ${form}.`
      : 'Regelmäßig: hänge -te an. Beispiel: ich spiele → ich spielte.',
  );
}

const PASSEND = ['packe', 'spielen', 'liest', 'lese'];
function passendesVerb(satz: string, richtig: string): WaehlAufgabe {
  return waehlen(
    've-lu',
    'Welches Verb passt in die Lücke?',
    satz,
    PASSEND,
    richtig,
    'Lies den Satz mit jedem Verb. Wer tut etwas? Danach richtet sich die Form.',
  );
}

const VERBEN: Thema = {
  id: 'de-verben',
  titel: 'Verben: beugen und Vergangenheit',
  symbol: '🏃',
  seiten: 'S. 5',
  merkwissen: [
    'Verben verändern sich je nach Person: ich spiele, du spielst, er spielt, wir spielen.',
    'Bei manchen Verben ändert sich der Selbstlaut: ich lese, du liest, er liest.',
    'Vergangenheit: Regelmäßige Verben bekommen -te: ich spielte. Unregelmäßige muss man sich merken: ich ging, ich las, ich kam.',
  ],
  woerter: [
    beugen('ich', 'lesen', 'lese'),
    beugen('du', 'lesen', 'liest', `${STAMM_HILFE}lesen → du liest.`),
    beugen('er', 'lesen', 'liest', `${STAMM_HILFE}lesen → er liest.`),
    beugen('wir', 'lesen', 'lesen'),
    beugen('ich', 'gehen', 'gehe'),
    beugen('du', 'gehen', 'gehst', 'Der Stamm bleibt „geh“: du geh-st. Das h bleibt!'),
    beugen('er', 'gehen', 'geht', 'Der Stamm bleibt „geh“: er geh-t. Das h bleibt!'),
    beugen('wir', 'gehen', 'gehen'),
    beugen('du', 'spielen', 'spielst'),
    beugen('sie', 'spielen', 'spielt'),
    beugen('du', 'laufen', 'läufst', `${STAMM_HILFE}laufen → du läufst.`),
    beugen('er', 'laufen', 'läuft', `${STAMM_HILFE}laufen → er läuft.`),
    beugen('du', 'schlafen', 'schläfst', `${STAMM_HILFE}schlafen → du schläfst.`),
    beugen('du', 'sehen', 'siehst', `${STAMM_HILFE}sehen → du siehst.`),
    beugen('es', 'sehen', 'sieht', `${STAMM_HILFE}sehen → es sieht.`),
    vergangenheit('spiele', 'spielte', false),
    vergangenheit('gehe', 'ging', true),
    vergangenheit('lese', 'las', true),
    vergangenheit('komme', 'kam', true),
    vergangenheit('lerne', 'lernte', false),
    vergangenheit('male', 'malte', false),
    vergangenheit('mache', 'machte', false),
    vergangenheit('schreibe', 'schrieb', true),
    vergangenheit('laufe', 'lief', true),
    vergangenheit('sehe', 'sah', true),
    vergangenheit('springe', 'sprang', true),
    vergangenheit('finde', 'fand', true),
    vergangenheit('singe', 'sang', true),
    passendesVerb('Jeden Morgen … ich meinen Schulranzen.', 'packe'),
    passendesVerb('In der Pause … wir auf dem Schulhof.', 'spielen'),
    passendesVerb('Frau Meier … eine Geschichte vor.', 'liest'),
    passendesVerb('Ich … gern in spannenden Büchern.', 'lese'),
  ],
};

// --- Adjektive (S. 6) ---------------------------------------------------------------------

function gegenteil(wort: string, loesungen: string[]): SchreibAufgabe {
  return schreiben(
    'ad-ggt',
    'Schreibe das Gegenteil.',
    `${wort} ↔ …`,
    loesungen,
    'Adjektive schreibt man klein. Denk an ein Bild: Was ist das Gegenteil davon?',
  );
}

function steigern(
  grund: string,
  mehr: string,
  meist: string,
  besonders?: string,
): SchreibAufgabe[] {
  const hilfe =
    besonders ??
    'Vergleichsstufe: -er anhängen. Höchststufe: am …-sten. Beispiel: schneller, am schnellsten.';
  return [
    schreiben('ad-st1', 'Steigere das Adjektiv.', `${grund} – …`, [mehr], hilfe),
    schreiben(
      'ad-st2',
      'Steigere das Adjektiv.',
      `${grund} – ${mehr} – am …`,
      [`am ${meist}`, meist],
      hilfe,
    ),
  ];
}

const ADJEKTIVE: Thema = {
  id: 'de-adjektive',
  titel: 'Adjektive: Gegenteil und steigern',
  symbol: '🌈',
  seiten: 'S. 6',
  merkwissen: [
    'Adjektive beschreiben Nomen genauer: der schnelle Hund.',
    'Viele Adjektive haben ein Gegenteil: laut ↔ leise, hell ↔ dunkel.',
    'Steigern: schnell – schneller – am schnellsten. Manchmal kommt ein Umlaut dazu: groß – größer – am größten.',
  ],
  woerter: [
    gegenteil('fröhlich', ['traurig']),
    gegenteil('schnell', ['langsam']),
    gegenteil('laut', ['leise']),
    gegenteil('hell', ['dunkel']),
    gegenteil('mutig', ['ängstlich', 'feige']),
    gegenteil('groß', ['klein']),
    gegenteil('warm', ['kalt']),
    gegenteil('voll', ['leer']),
    gegenteil('hart', ['weich']),
    gegenteil('lang', ['kurz']),
    gegenteil('nass', ['trocken']),
    ...steigern('schnell', 'schneller', 'schnellsten'),
    ...steigern('lustig', 'lustiger', 'lustigsten'),
    ...steigern('spannend', 'spannender', 'spannendsten'),
    ...steigern('klein', 'kleiner', 'kleinsten'),
    ...steigern('groß', 'größer', 'größten', 'Bei groß kommt ein ö dazu: größer, am größten.'),
    ...steigern('alt', 'älter', 'ältesten', 'Bei alt kommt ein ä dazu: älter, am ältesten.'),
    ...steigern('warm', 'wärmer', 'wärmsten', 'Bei warm kommt ein ä dazu: wärmer, am wärmsten.'),
    ...steigern('gut', 'besser', 'besten', 'Gut ist eine Ausnahme: gut – besser – am besten.'),
  ],
};

// --- Wortarten im Text (S. 7) -------------------------------------------------------------

const NOMEN_TIPPEN = 'Tippe alle Nomen an.';
const VERB_TIPPEN = 'Tippe das Verb an.';
const ADJ_TIPPEN = 'Tippe die Adjektive an.';

const IM_TEXT: Thema = {
  id: 'de-im-text',
  titel: 'Wortarten im Text finden',
  symbol: '🔍',
  seiten: 'S. 7',
  merkwissen: [
    'Nomen erkennst du am Artikel davor und am großen Anfangsbuchstaben. Auch Namen wie Lina sind Nomen.',
    'Das Verb sagt, was jemand tut: Lina spielt.',
    'Adjektive sagen, wie etwas ist: die freundliche Lehrerin.',
  ],
  woerter: [
    antippen(
      'tx-n',
      NOMEN_TIPPEN,
      'Am ersten Tag in Klasse 5 ist Lina sehr aufgeregt.',
      [2, 4, 7],
      undefined,
      WORTART_HILFE.Nomen,
    ),
    antippen(
      'tx-v',
      VERB_TIPPEN,
      'Schon früh steht sie vor der großen Schule.',
      [2],
      undefined,
      WORTART_HILFE.Verb,
    ),
    antippen(
      'tx-n',
      NOMEN_TIPPEN,
      'Schon früh steht sie vor der großen Schule.',
      [7],
      undefined,
      WORTART_HILFE.Nomen,
    ),
    antippen(
      'tx-n',
      NOMEN_TIPPEN,
      'Im Klassenraum trifft sie neue Kinder und eine freundliche Lehrerin.',
      [1, 5, 9],
      undefined,
      WORTART_HILFE.Nomen,
    ),
    antippen(
      'tx-a',
      ADJ_TIPPEN,
      'Im Klassenraum trifft sie neue Kinder und eine freundliche Lehrerin.',
      [4, 8],
      undefined,
      WORTART_HILFE.Adjektiv,
    ),
    antippen(
      'tx-v',
      VERB_TIPPEN,
      'Gemeinsam sprechen sie über die Fächer und die Regeln.',
      [1],
      undefined,
      WORTART_HILFE.Verb,
    ),
    antippen(
      'tx-n',
      NOMEN_TIPPEN,
      'In der Pause spielt Lina mit zwei Mädchen auf dem Schulhof.',
      [2, 4, 7, 10],
      undefined,
      WORTART_HILFE.Nomen,
    ),
    antippen(
      'tx-v',
      VERB_TIPPEN,
      'In der Pause spielt Lina mit zwei Mädchen auf dem Schulhof.',
      [3],
      undefined,
      WORTART_HILFE.Verb,
    ),
    antippen(
      'tx-a',
      ADJ_TIPPEN,
      'Am Ende des Tages ist sie müde, aber glücklich.',
      [6, 8],
      undefined,
      WORTART_HILFE.Adjektiv,
    ),
    antippen(
      'tx-n',
      NOMEN_TIPPEN,
      'Am Ende des Tages ist sie müde, aber glücklich.',
      [1, 3],
      undefined,
      WORTART_HILFE.Nomen,
    ),
  ],
};

// --- Satzarten (S. 8) ---------------------------------------------------------------------

type Satzart = 'Aussagesatz' | 'Fragesatz' | 'Aufforderungssatz' | 'Ausrufesatz';
const SATZARTEN: Satzart[] = ['Aussagesatz', 'Fragesatz', 'Aufforderungssatz', 'Ausrufesatz'];
const SATZART_HILFE: Record<Satzart, string> = {
  Aussagesatz: 'Ein Aussagesatz berichtet etwas. Am Ende steht ein Punkt.',
  Fragesatz: 'Ein Fragesatz fragt nach etwas. Am Ende steht ein Fragezeichen.',
  Aufforderungssatz:
    'Ein Aufforderungssatz fordert zu etwas auf, oft mit „bitte“. Am Ende steht meist ein Ausrufezeichen.',
  Ausrufesatz:
    'Ein Ausrufesatz drückt starke Gefühle aus, oft mit „Wie …!“. Am Ende steht ein Ausrufezeichen.',
};

function satzart(satz: string, art: Satzart): WaehlAufgabe {
  return waehlen('sa', 'Welche Satzart ist das?', satz, SATZARTEN, art, SATZART_HILFE[art]);
}

const SATZARTEN_THEMA: Thema = {
  id: 'de-satzarten',
  titel: 'Satzarten bestimmen',
  symbol: '💬',
  seiten: 'S. 8',
  merkwissen: [
    'Aussagesatz: berichtet etwas. Ich gehe heute in die Schule.',
    'Fragesatz: fragt nach etwas. Gehst du heute in die Schule?',
    'Aufforderungssatz: fordert zu etwas auf. Packe jetzt deine Schultasche!',
    'Ausrufesatz: drückt starke Gefühle aus. Wie spannend der erste Schultag ist!',
  ],
  woerter: [
    satzart('Komm bitte herein!', 'Aufforderungssatz'),
    satzart('Wo ist mein Heft?', 'Fragesatz'),
    satzart('Heute schreiben wir Deutsch.', 'Aussagesatz'),
    satzart('Wie schön dieser Klassenraum ist!', 'Ausrufesatz'),
    satzart('Heute lesen wir einen Text.', 'Aussagesatz'),
    satzart('Wo ist mein Radiergummi?', 'Fragesatz'),
    satzart('Räum bitte deinen Platz auf!', 'Aufforderungssatz'),
    satzart('Wie schön die Ferien waren!', 'Ausrufesatz'),
    satzart('Gehst du heute in die Schule?', 'Fragesatz'),
    satzart('Packe jetzt deine Schultasche!', 'Aufforderungssatz'),
    satzart('Wie spannend der erste Schultag ist!', 'Ausrufesatz'),
    satzart('Ich gehe heute in die Schule.', 'Aussagesatz'),
    satzart('Mach bitte das Fenster zu!', 'Aufforderungssatz'),
    satzart('Lina spielt mit ihren Freundinnen.', 'Aussagesatz'),
  ],
};

// --- Satzzeichen (S. 9) -------------------------------------------------------------------

const ZEICHEN = ['Punkt', 'Fragezeichen', 'Ausrufezeichen'];
function satzzeichen(satz: string, richtig: string[], hilfe: string): WaehlAufgabe {
  return waehlen(
    'sz',
    'Welches Satzzeichen gehört ans Ende?',
    `${satz} …`,
    ZEICHEN,
    richtig,
    hilfe,
  );
}

const SATZZEICHEN: Thema = {
  id: 'de-satzzeichen',
  titel: 'Satzzeichen setzen',
  symbol: '❗',
  seiten: 'S. 9',
  merkwissen: [
    'Aussagesatz → Punkt.',
    'Fragesatz → Fragezeichen.',
    'Aufforderungssatz → meist Ausrufezeichen.',
    'Ausrufesatz → Ausrufezeichen.',
  ],
  woerter: [
    satzzeichen('Wo liegt mein Deutschheft', ['Fragezeichen'], SATZART_HILFE.Fragesatz),
    satzzeichen(
      'Ich freue mich auf die neue Klasse',
      ['Punkt', 'Ausrufezeichen'],
      'Ein Aussagesatz bekommt einen Punkt. Ist die Freude sehr groß, passt auch ein Ausrufezeichen.',
    ),
    satzzeichen(
      'Komm bitte schnell her',
      ['Ausrufezeichen', 'Punkt'],
      SATZART_HILFE.Aufforderungssatz,
    ),
    satzzeichen('Wie aufregend dieser Tag ist', ['Ausrufezeichen'], SATZART_HILFE.Ausrufesatz),
    satzzeichen('Morgen haben wir Sport', ['Punkt'], SATZART_HILFE.Aussagesatz),
    satzzeichen('Hast du deinen Füller dabei', ['Fragezeichen'], SATZART_HILFE.Fragesatz),
    satzzeichen('Wann beginnt die Pause', ['Fragezeichen'], SATZART_HILFE.Fragesatz),
    satzzeichen('Hör mir bitte zu', ['Ausrufezeichen', 'Punkt'], SATZART_HILFE.Aufforderungssatz),
    satzzeichen('Lina packt ihre Tasche', ['Punkt'], SATZART_HILFE.Aussagesatz),
    satzzeichen('Wie toll das Fest war', ['Ausrufezeichen'], SATZART_HILFE.Ausrufesatz),
  ],
};

// --- Subjekt und Prädikat (S. 10) ---------------------------------------------------------

const SUBJEKT = 'Tippe das Subjekt an. Frag: Wer oder was?';
const PRAEDIKAT = 'Tippe das Prädikat an. Frag: Was tut jemand?';
const SUBJEKT_HILFE =
  'Frag: Wer oder was tut etwas? Die Antwort ist das Subjekt. Es muss nicht am Anfang stehen.';
const PRAEDIKAT_HILFE = 'Frag: Was tut jemand? Das Prädikat ist das Verb im Satz.';

function subjekt(satz: string, richtig: number[], kern?: number[]): AntippAufgabe {
  return antippen('sp-s', SUBJEKT, satz, richtig, kern, SUBJEKT_HILFE);
}
function praedikat(satz: string, richtig: number[]): AntippAufgabe {
  return antippen('sp-p', PRAEDIKAT, satz, richtig, undefined, PRAEDIKAT_HILFE);
}

const SUBJEKT_PRAEDIKAT: Thema = {
  id: 'de-subjekt-praedikat',
  titel: 'Subjekt und Prädikat',
  symbol: '🎯',
  seiten: 'S. 10',
  merkwissen: [
    'Subjekt: Frag „Wer oder was?“. Lena liest ein Buch. Wer liest? Lena.',
    'Prädikat: Frag „Was tut jemand?“. Was tut Lena? Sie liest.',
    'Das Subjekt steht nicht immer am Anfang: Am Morgen klingelt der Wecker.',
  ],
  woerter: [
    subjekt('Tim packt seinen Schulranzen.', [0]),
    praedikat('Tim packt seinen Schulranzen.', [1]),
    subjekt('Unsere Klasse liest einen Text.', [0, 1], [1]),
    praedikat('Unsere Klasse liest einen Text.', [2]),
    subjekt('Frau Berger erklärt die Aufgabe.', [0, 1], [1]),
    praedikat('Frau Berger erklärt die Aufgabe.', [2]),
    subjekt('Die Kinder spielen auf dem Schulhof.', [0, 1], [1]),
    praedikat('Die Kinder spielen auf dem Schulhof.', [2]),
    subjekt('Mein Freund schreibt einen Satz.', [0, 1], [1]),
    praedikat('Mein Freund schreibt einen Satz.', [2]),
    subjekt('Am Morgen klingelt der Wecker.', [3, 4], [4]),
    praedikat('Am Morgen klingelt der Wecker.', [2]),
    subjekt('Auf dem Schulhof spielen die Kinder Fangen.', [4, 5], [5]),
    subjekt('Im Deutschunterricht liest Mia laut vor.', [3]),
    subjekt('Lena liest ein spannendes Buch.', [0]),
    praedikat('Lena liest ein spannendes Buch.', [1]),
  ],
};

export const THEMEN: Thema[] = [
  WORTARTEN,
  NOMEN,
  VERBEN,
  ADJEKTIVE,
  IM_TEXT,
  SATZARTEN_THEMA,
  SATZZEICHEN,
  SUBJEKT_PRAEDIKAT,
];

export function aufgabeText(a: Aufgabe): string {
  return a.art === 'antippen' ? a.satz : a.inhalt;
}
