import { expect, type Page } from '@playwright/test';

// Geometrische Layout-Prüfung im Browser – bewusst ohne Bildvergleich, weil Schriften und
// Kantenglättung unter Windows (Entwicklung) und Linux (CI) verschieden sind.
// Geprüft wird nur, was auf jedem System falsch wäre:
// - die Seite scrollt nicht seitlich
// - kein sichtbarer Text wird von einem Vorfahren mit overflow hidden/clip abgeschnitten
// - kein Text ragt aus seinem Kasten heraus
// - Bedienelemente, Überschriften und Absätze überdecken einander nicht
// - Bedienelemente sind mindestens 48 × 48 px groß
// Ist ein Dialog offen, wird nur der oberste Dialog geprüft (der Rest liegt darunter).

export type LayoutOptionen = {
  // Mindestgröße für Touch-Flächen; 0 schaltet die Prüfung ab
  minTouch?: number;
};

export async function pruefeLayout(page: Page, optionen: LayoutOptionen = {}): Promise<string[]> {
  // Schriften (OpenDyslexic) und Bilder müssen geladen sein, sonst misst man das Falsche
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return page.evaluate(
    ({ minTouch }) => {
      const TOLERANZ = 1;
      const probleme: string[] = [];
      const breite = document.documentElement.clientWidth;

      const name = (el: Element) => {
        const cls = [...el.classList].map((c) => `.${c}`).join('');
        const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return `<${el.tagName.toLowerCase()}${cls}>${text ? ` „${text}“` : ''}`;
      };
      const px = (n: number) => `${Math.round(n)}px`;

      // Für Menschen unsichtbar (auch .unsichtbar für Screenreader) oder nicht gerendert
      const versteckt = (el: Element): boolean => {
        // Erfasst auch den Inhalt geschlossener <details> (content-visibility: hidden)
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return true;
        for (let e: Element | null = el; e; e = e.parentElement) {
          const s = getComputedStyle(e);
          if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) {
            return true;
          }
          if (s.clipPath !== 'none' || (s.clip && s.clip !== 'auto')) return true;
          const r = e.getBoundingClientRect();
          if (r.width <= 1 || r.height <= 1) return true;
        }
        return false;
      };

      // Wurzel: oberster offener Dialog, sonst die ganze Seite
      const dialoge = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(
        (d) => !versteckt(d),
      );
      const wurzel: Element = dialoge.at(-1) ?? document.body;

      // 1. Seitliches Scrollen
      const sw = document.documentElement.scrollWidth;
      if (sw > breite + TOLERANZ) {
        const hinweis = wurzel === document.body ? '' : ' (Seite unter dem Dialog)';
        probleme.push(
          `Seite scrollt seitlich${hinweis}: Inhalt ${px(sw)} breit, Bildschirm ${px(breite)}`,
        );
      }
      for (const el of wurzel.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > breite + TOLERANZ && !versteckt(el)) {
          // Nur das äußerste herausragende Element melden
          const eltern = el.parentElement?.getBoundingClientRect();
          if (eltern && eltern.right > breite + TOLERANZ) continue;
          // Innerhalb eines Vorfahren mit overflow ≠ visible: das meldet die Text-Prüfung
          let eingesperrt = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (s.overflowX !== 'visible') eingesperrt = true;
          }
          if (eingesperrt) continue;
          probleme.push(`${name(el)} ragt rechts über den Bildschirm (${px(r.right - breite)})`);
        }
      }

      // 2. + 3. Text abgeschnitten oder aus dem Kasten
      const walker = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
      const gemeldet = new Set<Element>();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        const eltern = n.parentElement!;
        if (gemeldet.has(eltern) || versteckt(eltern)) continue;
        const bereich = document.createRange();
        bereich.selectNodeContents(n);
        const rects = [...bereich.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
        if (rects.length === 0) continue;
        const text = `„${n.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)}“`;

        let kasten: Element | null = eltern;
        // Reine Inline-Elemente haben keinen eigenen Kasten; inline-block/-flex schon
        while (kasten && ['inline', 'contents'].includes(getComputedStyle(kasten).display)) {
          kasten = kasten.parentElement;
        }
        for (
          let a: Element | null = eltern;
          a && a !== document.documentElement;
          a = a.parentElement
        ) {
          const s = getComputedStyle(a);
          const r = a.getBoundingClientRect();
          // Gewollte Kürzung mit „…“ ist kein Fehler
          if (s.textOverflow === 'ellipsis' || s.webkitLineClamp !== 'none') break;
          const clipX = s.overflowX === 'hidden' || s.overflowX === 'clip';
          const clipY = s.overflowY === 'hidden' || s.overflowY === 'clip';
          const istKasten = a === kasten;
          if (!clipX && !clipY && !istKasten) continue;
          // Sichtbarer Bereich: bei overflow hidden der Innenbereich, sonst der Rahmen
          const innen = {
            links: r.left + a.clientLeft,
            oben: r.top + a.clientTop,
            rechts: r.left + a.clientLeft + a.clientWidth,
            unten: r.top + a.clientTop + a.clientHeight,
          };
          const grenze =
            clipX || clipY
              ? innen
              : { links: r.left, oben: r.top, rechts: r.right, unten: r.bottom };
          // Bei sichtbarem Überlauf stehen Glyphen (Emoji, große Überschriften) oft etwas über die
          // Zeilenhöhe hinaus; das ist harmlos. Herausgelaufener Text ist mindestens eine Zeile.
          const spielraumY = clipY ? 0 : 0.75 * parseFloat(getComputedStyle(eltern).fontSize);
          let ueber = 0;
          let seite = '';
          for (const t of rects) {
            const pruefeX = clipX || istKasten;
            const pruefeY = clipY || istKasten;
            const kandidaten: [number, string][] = [
              [pruefeX ? grenze.links - t.left : 0, 'links'],
              [pruefeX ? t.right - grenze.rechts : 0, 'rechts'],
              [pruefeY ? grenze.oben - t.top - spielraumY : 0, 'oben'],
              [pruefeY ? t.bottom - grenze.unten - spielraumY : 0, 'unten'],
            ];
            for (const [wert, wo] of kandidaten) {
              if (wert > ueber) {
                ueber = wert;
                seite = wo;
              }
            }
          }
          if (ueber > TOLERANZ) {
            gemeldet.add(eltern);
            probleme.push(
              clipX || clipY
                ? `Text ${text} wird von ${name(a)} abgeschnitten (${seite} ${px(ueber)})`
                : `Text ${text} ragt aus ${name(a)} heraus (${seite} ${px(ueber)})`,
            );
            break;
          }
          // Text innerhalb eines Scroll-Bereichs ist erreichbar; weiter oben nicht mehr prüfen
          if (
            ['auto', 'scroll'].includes(s.overflowX) ||
            ['auto', 'scroll'].includes(s.overflowY)
          ) {
            break;
          }
        }
      }

      // 4. Überdeckung wichtiger Elemente
      const WICHTIG =
        'a, button, input, select, textarea, summary, [role="button"], [role="radio"], [role="checkbox"], [role="switch"], [role="tab"], h1, h2, h3, h4, h5, h6, p, label, progress';
      const fest = (el: Element) => {
        for (let e: Element | null = el; e && e !== wurzel; e = e.parentElement) {
          const p = getComputedStyle(e).position;
          if (p === 'fixed' || p === 'sticky') return true;
        }
        return false;
      };
      const wichtige = [...wurzel.querySelectorAll(WICHTIG)].filter(
        (el) => !versteckt(el) && !fest(el),
      );
      const boxen = wichtige.map((el) => el.getBoundingClientRect());
      for (let i = 0; i < wichtige.length; i++) {
        for (let j = i + 1; j < wichtige.length; j++) {
          const a = wichtige[i]!;
          const b = wichtige[j]!;
          if (a.contains(b) || b.contains(a)) continue;
          // label gehört zu seinem Feld (for=…)
          if (a instanceof HTMLLabelElement && a.control === b) continue;
          if (b instanceof HTMLLabelElement && b.control === a) continue;
          const ra = boxen[i]!;
          const rb = boxen[j]!;
          // Gewollt aufgesetzt: ein absolut platziertes Element ganz innerhalb eines anderen
          // (z. B. Vorlese-Knopf in der Ecke einer Kachel)
          const innerhalb = (k: DOMRect, g: DOMRect) =>
            k.left >= g.left - TOLERANZ &&
            k.right <= g.right + TOLERANZ &&
            k.top >= g.top - TOLERANZ &&
            k.bottom <= g.bottom + TOLERANZ;
          const absolut = (el: Element, anderes: Element) => {
            for (let e: Element | null = el; e && !e.contains(anderes); e = e.parentElement) {
              if (getComputedStyle(e).position === 'absolute') return true;
            }
            return false;
          };
          if ((absolut(a, b) && innerhalb(ra, rb)) || (absolut(b, a) && innerhalb(rb, ra))) {
            continue;
          }
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (x > TOLERANZ && y > TOLERANZ) {
            probleme.push(`${name(a)} und ${name(b)} überdecken sich (${px(x)} × ${px(y)})`);
          }
        }
      }

      // 5. Touch-Flächen
      if (minTouch > 0) {
        const BEDIENBAR =
          'a[href], button, select, summary, input:not([type="hidden"]), textarea, [role="button"], [role="radio"], [role="checkbox"], [role="switch"], [role="tab"]';
        for (const el of wurzel.querySelectorAll(BEDIENBAR)) {
          if (versteckt(el)) continue;
          // Kästchen/Radio im <label>: die ganze Beschriftung ist die Touch-Fläche
          const ziel =
            el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)
              ? (el.closest('label') ?? el)
              : el;
          const r = ziel.getBoundingClientRect();
          if (r.width < minTouch - 0.5 || r.height < minTouch - 0.5) {
            probleme.push(
              `${name(ziel)} ist zu klein zum Tippen (${px(r.width)} × ${px(r.height)})`,
            );
          }
        }
      }

      return [...new Set(probleme)];
    },
    { minTouch: optionen.minTouch ?? 48 },
  );
}

// Bequem für Tests: keine Probleme erwartet, sonst die Liste in der Fehlermeldung
export async function erwarteSauberesLayout(page: Page, wo: string, optionen?: LayoutOptionen) {
  const probleme = await pruefeLayout(page, optionen);
  expect(probleme, `Layout-Probleme auf ${wo}:\n${probleme.join('\n')}`).toEqual([]);
}

export type Darstellung = 'standard' | 'maximal';

// Größte Schrift, weiter Abstand, OpenDyslexic – schreibt die Einstellungen direkt in IndexedDB
// (Datenbank „miapp“, Speicher „einstellungen“, Schlüssel „geraet“) und lädt neu
export async function setzeDarstellung(page: Page, darstellung: Darstellung) {
  if (darstellung === 'standard') return;
  await page.evaluate(
    () =>
      new Promise<void>((fertig, fehler) => {
        const anfrage = indexedDB.open('miapp');
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          const tx = db.transaction('einstellungen', 'readwrite');
          tx.objectStore('einstellungen').put({
            id: 'geraet',
            schriftgroesse: 'sehr-gross',
            abstand: 'weit',
            hintergrund: 'creme',
            schrift: 'opendyslexic',
            tempo: 0.9,
          });
          tx.oncomplete = () => {
            db.close();
            fertig();
          };
          tx.onerror = () => fehler(tx.error);
        };
      }),
  );
  await page.reload();
}
