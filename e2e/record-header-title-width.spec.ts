import { test, expect, type Page } from '@playwright/test';
import { compile } from 'tailwindcss';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * GEOMETRY pin for the record-header title/action width arbitration on the two
 * headers objectui#7281 covers — `packages/plugin-detail/src/DetailView.tsx`
 * and `packages/layout/src/PageHeader.tsx`. Sibling of
 * `packages/components/src/__tests__/page-header-title-width.test.tsx`, which
 * pins objectui#7244's fix on `page:header`.
 *
 * ⚠️ WHY THIS FILE IS A PLAYWRIGHT SPEC AND NOT A VITEST TEST. jsdom and
 * happy-dom have no layout engine — every `getBoundingClientRect()` there is
 * 0x0 and `clientWidth` is 0 — so the sibling pin had to settle for
 * CLASS-SHAPE assertions, and a class-shape assertion passes against a floor
 * that does nothing. This file asserts the widths themselves, in Chromium,
 * which is the only place the arbitration actually happens.
 *
 * ## What is real here and what is a fixture
 *
 * REAL, read out of the source files at run time: the header row's class
 * string, the title column's class string, the action tail's class string and
 * the h1's class string, for both headers — plus real Tailwind, compiled from
 * the installed `tailwindcss` for exactly those candidates. Delete
 * `sm:min-w-64` from DetailView or `min-w-48` from PageHeader and the string
 * this file measures changes with it.
 *
 * FIXTURE: the action tail's CONTENT is three or four fixed-width boxes rather
 * than real `<Button>`s, so the tail's width is a constant instead of a
 * font-metric. The element tree around them is transcribed from the two
 * sources.
 *
 * ## Calibration against the running app (Chromium, console dev server,
 * `type: 'detail'` and `<PageHeader actions={…}>`, three labelled
 * `record_header` actions, viewport 799px, objectui#7281):
 *
 *   DetailView  before: h1  6.17px of a 218px scrollWidth, tail 724.83px
 *               after:  h1 218.39px, tail wrapped to its own line
 *   PageHeader  before: h1 170.59px of a 265px scrollWidth, tail 564.41px
 *               after:  h1 751.00px, tail wrapped to its own line
 *
 * The fixture tails below (722px / 592px) are sized to that measured
 * neighbourhood, so the geometry this file reproduces is the geometry the app
 * produces, not a worst case invented to make a floor look necessary.
 */

const REPO_ROOT = (() => {
  // Rooted on this file, never on `process.cwd()` — AGENTS.md's
  // "tests read the filesystem relative to their own file" rule. Bare
  // `import.meta.url`, walked up; never `new URL(<relative>, import.meta.url)`.
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    try {
      readFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'utf8');
      return dir;
    } catch {
      dir = path.dirname(dir);
    }
  }
  throw new Error('could not locate the repo root from ' + import.meta.url);
})();

const read = (rel: string) => readFileSync(path.join(REPO_ROOT, rel), 'utf8');

/**
 * Pull a literal `className="…"` out of a source file, anchored on a nearby
 * landmark so the walk cannot silently drift onto a neighbouring element.
 * `mustContain` is a token the extracted string has to carry that is NOT the
 * floor under test, so a drifted walk throws instead of measuring the wrong
 * element and passing.
 */
function classAt(
  source: string,
  file: string,
  anchor: string,
  nth: number,
  mustContain: string[],
): string {
  const at = source.indexOf(anchor);
  if (at < 0) throw new Error(`${file}: anchor not found: ${anchor}`);
  const re = /className="([^"]+)"/g;
  re.lastIndex = at;
  let hit: RegExpExecArray | null = null;
  for (let i = 0; i < nth; i++) {
    hit = re.exec(source);
    if (!hit) throw new Error(`${file}: only ${i} className literals after ${anchor}`);
  }
  const cls = hit![1];
  for (const token of mustContain) {
    if (!cls.split(/\s+/).includes(token)) {
      throw new Error(
        `${file}: className #${nth} after "${anchor}" is "${cls}", which does not carry "${token}" — ` +
          'the extraction walked onto the wrong element, so this measurement would be meaningless.',
      );
    }
  }
  return cls;
}

/** Same, but the last literal BEFORE the anchor. */
function classBefore(source: string, file: string, anchor: string, mustContain: string[]): string {
  const at = source.indexOf(anchor);
  if (at < 0) throw new Error(`${file}: anchor not found: ${anchor}`);
  const head = source.slice(0, at);
  const all = [...head.matchAll(/className="([^"]+)"/g)];
  if (all.length === 0) throw new Error(`${file}: no className literal before ${anchor}`);
  const cls = all[all.length - 1][1];
  for (const token of mustContain) {
    if (!cls.split(/\s+/).includes(token)) {
      throw new Error(
        `${file}: last className before "${anchor}" is "${cls}", which does not carry "${token}".`,
      );
    }
  }
  return cls;
}

const DETAIL_FILE = 'packages/plugin-detail/src/DetailView.tsx';
const PAGE_FILE = 'packages/layout/src/PageHeader.tsx';

const detailSrc = read(DETAIL_FILE);
const pageSrc = read(PAGE_FILE);

const DETAIL = {
  // `{schema.showHeader !== false && (` opens the header this card is about —
  // the one that renders when the host does NOT supply a `page:header`.
  row: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 1, ['border-b', 'justify-between']),
  titleColumn: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 2, ['flex-1', 'min-w-0']),
  backButton: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 3, ['shrink-0']),
  // #4 is the back button's own `<ArrowLeft className="h-4 w-4" />`.
  innerColumn: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 5, ['flex-1', 'min-w-0']),
  titleRow: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 6, ['flex-wrap']),
  h1: classAt(detailSrc, DETAIL_FILE, '{schema.showHeader !== false && (', 7, ['truncate']),
  // The action tail opens immediately before this comment.
  tail: classBefore(detailSrc, DETAIL_FILE, '{/* Prev/Next Record Navigation */}', ['shrink-0']),
};

const PAGE = {
  row: classBefore(pageSrc, PAGE_FILE, 'aria-label="Back to list"', ['flex-wrap', 'items-center']),
  backButton: classAt(pageSrc, PAGE_FILE, 'aria-label="Back to list"', 1, ['flex-shrink-0']),
  titleColumn: classBefore(pageSrc, PAGE_FILE, '{resolvedTitle ? (', ['flex-1', 'flex-col']),
  h1: classAt(pageSrc, PAGE_FILE, '{resolvedTitle ? (', 1, ['truncate']),
  slot: classAt(pageSrc, PAGE_FILE, '{slot && <div className=', 1, ['ml-auto']),
};

/** The measured render size of `<Button size="icon">` in both headers. */
const ICON_BUTTON = 'h-10 w-10 shrink-0';
/** A tail box wide enough to reproduce the measured app tails (see header). */
const TAIL_BOX = 'h-9 w-48 shrink-0';

/**
 * Long enough that the h1's own text is never the binding constraint at the
 * crowded viewport — what is being measured is the width the arbitration
 * LEAVES the title, not how long this particular string happens to be — and
 * still short enough to fit unclipped at the roomy viewport, which is what the
 * regression guard reads.
 */
const TITLE = 'Specimen — Full Assembly Record';

async function tailwindFor(candidates: string[]): Promise<string> {
  const twEntry = fileURLToPath(import.meta.resolve('tailwindcss/index.css'));
  const twBase = path.dirname(twEntry);
  const compiler = await compile('@import "tailwindcss";', {
    base: twBase,
    loadStylesheet: async (id: string, base: string) => {
      const file = id === 'tailwindcss' ? twEntry : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') };
    },
  });
  const css = compiler.build(candidates);
  if (!css.includes('@media')) {
    throw new Error('Tailwind produced no media queries — the responsive variants under test would be inert.');
  }
  return css;
}

/** `<div class="…">` nested left-to-right, innermost last. */
const box = (cls: string, inner = '') => `<div class="${cls}">${inner}</div>`;

const DETAIL_FIXTURE = box(
  DETAIL.row,
  box(
    DETAIL.titleColumn,
    `<button class="${DETAIL.backButton} ${ICON_BUTTON}"></button>` +
      box(DETAIL.innerColumn, box(DETAIL.titleRow, `<h1 class="${DETAIL.h1}">${TITLE}</h1>`)),
  ) +
    box(DETAIL.tail, Array.from({ length: 4 }, () => box(TAIL_BOX)).join('')),
);

const PAGE_FIXTURE = box(
  PAGE.row,
  `<button class="${PAGE.backButton} ${ICON_BUTTON}"></button>` +
    box(PAGE.titleColumn, `<h1 class="${PAGE.h1}">${TITLE}</h1>`) +
    box(PAGE.slot, Array.from({ length: 3 }, () => box(TAIL_BOX)).join('')),
);

const ALL_CANDIDATES = [
  ...Object.values(DETAIL),
  ...Object.values(PAGE),
  ICON_BUTTON,
  TAIL_BOX,
]
  .join(' ')
  .split(/\s+/)
  .filter(Boolean);

type Reading = {
  h1Width: number;
  h1ScrollWidth: number;
  h1Clipped: boolean;
  rowWidth: number;
  rowRight: number;
  titleColumnWidth: number;
  tailWidth: number;
  tailWithinRow: boolean;
  tailOnOwnLine: boolean;
  documentOverflowX: number;
};

async function readGeometry(page: Page, fixture: string, css: string, width: number): Promise<Reading> {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(`<style>${css}</style><div id="host">${fixture}</div>`, {
    waitUntil: 'load',
  });
  // ⛔ Not asserted immediately: a rect read in the same task as `setContent`
  // can precede the first layout+paint. Wait for the h1 rect to be identical
  // across two animation frames, then for fonts, then read.
  await page.waitForFunction(
    () => {
      const h1 = document.querySelector('h1');
      const row = document.querySelector('#host > div');
      // The ROW is what proves layout has run — it always fills the viewport.
      // ⛔ Deliberately NOT `h1 width > 0`: an ablated floor can drive the h1
      // to exactly 0, and that reading is the finding, not a reason to hang
      // until the wait times out and hides it behind a TimeoutError.
      if (!h1 || !row || row.getBoundingClientRect().width <= 0) return false;
      const w = h1.getBoundingClientRect().width;
      const prev = (window as unknown as { __w?: number }).__w;
      (window as unknown as { __w?: number }).__w = w;
      return prev !== undefined && Math.abs(prev - w) < 0.01;
    },
    null,
    { polling: 'raf', timeout: 10_000 },
  );
  await page.evaluate(() => document.fonts?.ready);
  return page.evaluate(() => {
    const round = (n: number) => Math.round(n * 100) / 100;
    const h1 = document.querySelector('h1')!;
    const row = document.querySelector('#host > div')!;
    const kids = Array.from(row.children);
    const titleIdx = kids.findIndex((k) => k.contains(h1));
    const titleColumn = kids[titleIdx] as HTMLElement;
    const tail = kids.slice(titleIdx + 1) as HTMLElement[];
    const rowRect = row.getBoundingClientRect();
    const h1Rect = h1.getBoundingClientRect();
    return {
      h1Width: round(h1Rect.width),
      h1ScrollWidth: h1.scrollWidth,
      h1Clipped: h1.scrollWidth > Math.ceil(h1Rect.width),
      rowWidth: round(rowRect.width),
      rowRight: round(rowRect.right),
      titleColumnWidth: round(titleColumn.getBoundingClientRect().width),
      tailWidth: round(tail.reduce((sum, t) => sum + t.getBoundingClientRect().width, 0)),
      tailWithinRow: tail.every((t) => {
        const r = t.getBoundingClientRect();
        return r.left >= rowRect.left - 0.5 && r.right <= rowRect.right + 0.5;
      }),
      tailOnOwnLine:
        tail.length > 0 &&
        Math.round(tail[0].getBoundingClientRect().top) >
          Math.round(titleColumn.getBoundingClientRect().top),
      documentOverflowX: round(
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    };
  });
}

/**
 * The readable floor objectui#7244 established for the h1 itself. DetailView's
 * column floor is larger than this because the back button and its gap live
 * INSIDE that column; PageHeader's is this value exactly.
 */
const READABLE_H1_FLOOR = 192;
/** The reproducing viewport from objectui#7244 and from this card's readings. */
const CROWDED = 799;
/** Wide enough that the tail was never in contention — the regression guard. */
const ROOMY = 1440;

let css = '';
test.beforeAll(async () => {
  css = await tailwindFor(ALL_CANDIDATES);
});

test.describe('record header title width arbitration (objectui#7281)', () => {
  for (const [name, fixture] of [
    ['DetailView (plugin-detail)', () => DETAIL_FIXTURE],
    ['PageHeader (layout)', () => PAGE_FIXTURE],
  ] as const) {
    test(`${name}: the title keeps a readable width at ${CROWDED}px`, async ({ page }) => {
      const r = await readGeometry(page, fixture(), css, CROWDED);
      // THE assertion. Not `toHaveClass('sm:min-w-48')` — a floor that does
      // nothing would pass that and fail this.
      expect(
        r.h1Width,
        `h1 is ${r.h1Width}px of a ${r.h1ScrollWidth}px title; title column ${r.titleColumnWidth}px, tail ${r.tailWidth}px`,
      ).toBeGreaterThanOrEqual(READABLE_H1_FLOOR);
      // …and the floor must not have bought that width by pushing a button
      // out of reach: a squeezed title truncates visibly, an action tail
      // hanging off the header edge does not.
      expect(r.tailWithinRow, `tail escaped the header box (row right ${r.rowRight})`).toBe(true);
      expect(r.documentOverflowX, 'the header overflowed the document horizontally').toBe(0);
    });

    test(`${name}: the roomy viewport is unchanged at ${ROOMY}px`, async ({ page }) => {
      const r = await readGeometry(page, fixture(), css, ROOMY);
      // Regression guard: a header whose tail already fits must keep the tail
      // on the title's line and the title unclipped, exactly as before the
      // floor existed.
      expect(r.tailOnOwnLine, 'the tail wrapped at a viewport where it used to fit').toBe(false);
      expect(r.h1Clipped, `h1 ${r.h1Width}px vs scrollWidth ${r.h1ScrollWidth}px`).toBe(false);
      expect(r.tailWithinRow).toBe(true);
      expect(r.documentOverflowX).toBe(0);
    });
  }

  test('the tail stays unshrinkable — squeezing the buttons is not the fix', async () => {
    // Kept as a class-shape check on purpose: it states WHY the title needed a
    // floor, and it is not what the geometry assertions above rest on.
    expect(DETAIL.tail.split(/\s+/)).toContain('shrink-0');
  });
});
