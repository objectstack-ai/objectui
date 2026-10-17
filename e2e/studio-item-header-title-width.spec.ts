import { test, expect, type Page } from '@playwright/test';
import { compile } from 'tailwindcss';
import { build, type Plugin, type Rollup } from 'vite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * GEOMETRY pin for objectui#12791: in Studio's item header a long api-name
 * chip gives way before the title, so the title keeps at least 200 px.
 *
 * ## The defect
 *
 * The title row draws the title (`STUDIO_ITEM_TITLE`, `min-w-0 truncate`) and
 * then the api-name chip (`STUDIO_API_CHIP`). The chip was `shrink-0`, so a
 * long machine name kept its whole width and the title gave way to a few
 * characters ("Service T…", about 100 px at a 560 px row). objectui#12611's
 * order for this row is: the meta slot folds, the status chip's text folds,
 * and the title truncates last with at least 200 px. The api chip now sits in
 * that order before the title: it truncates first, its full name in its
 * tooltip.
 *
 * ## Why a Playwright spec and not a vitest test
 *
 * jsdom and happy-dom have no layout engine, so every rect there is 0x0. The
 * claims here are widths the flex row computes, and only a browser computes
 * them. Same reason as `e2e/record-header-title-width.spec.ts` (the record
 * page's title-width pin) and `e2e/dashboard-metric-tile-height.spec.ts`,
 * whose bundling this file follows.
 *
 * ## What is real here and what is a fixture
 *
 * REAL: `StudioItemHeader` and everything it imports (its tokens, the
 * `@object-ui/components` tooltip), bundled by Vite from their source files
 * and mounted in Chromium with React's client renderer. The stylesheet is real
 * Tailwind: `packages/components/src/index.css` (its `@theme` included),
 * compiled for exactly the classes the mounted page carries. Put `shrink-0`
 * back on the chip and the widths measured here change with it.
 *
 * FIXTURES, declared so nobody reads more into a green run than it says:
 *
 *   - The props are the Data pillar's header for a draft object, as
 *     `StudioDesignSurface` passes them: an icon, the label, the api name, the
 *     "Unpublished draft" status, a field-count meta and the "Last saved"
 *     hint as the actions. The icon is a plain square, not a Lucide glyph.
 *   - The row width is set by the box around the header (the header's own
 *     24 px side padding included), not by the console's rail and aside.
 *   - Fonts are whatever Chromium falls back to (`Inter` is named by the theme
 *     and not installed in the test lane). The assertions are the card's
 *     floor (200 px) and relations (clipped or whole, inside the row), and the
 *     widths themselves go to the report.
 */

const REPO_ROOT = (() => {
  // Rooted on this file, never on `process.cwd()` (AGENTS.md: tests read the
  // filesystem relative to their own file). Bare `import.meta.url`, walked up.
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

const source = (rel: string) => path.join(REPO_ROOT, rel);

const ITEM_HEADER = source('packages/app-shell/src/views/studio-design/StudioItemHeader.tsx');
const STUDIO_TOKENS = source('packages/app-shell/src/views/studio-design/studio-tokens.ts');
const THEME_CSS = source('packages/components/src/index.css');

/** The card's draft object label. */
const TITLE = 'Service Territory Assignment 105';
/** A 30-character api name (the card's acceptance 1). */
const LONG_API = 'service_territory_assignment_5';
/** The CONTROL: a short api name. */
const SHORT_API = 'account';

/** `px-6` on the header: the row is this much narrower than the header. */
const HEADER_SIDE_PADDING = 48;
/** The card's floor, from objectui#12611's target 2. */
const TITLE_FLOOR = 200;

interface Case {
  name: string;
  /** The title row's width, in px. */
  row: number;
  apiName: string;
  /** A kind chip in the `chips` slot (ruling: the chips stay whole). */
  kindChip?: boolean;
  /** The item label, when not the card's. */
  title?: string;
}

const CASES = {
  long560: { name: 'long560', row: 560, apiName: LONG_API },
  short560: { name: 'short560', row: 560, apiName: SHORT_API },
  // The card's 1024 px viewport: a 736 px row with the rail and the aside open.
  long736: { name: 'long736', row: 736, apiName: LONG_API },
  long1024: { name: 'long1024', row: 1024, apiName: LONG_API },
  long360: { name: 'long360', row: 360, apiName: LONG_API },
  chips736: { name: 'chips736', row: 736, apiName: LONG_API, kindChip: true },
  shortTitle560: { name: 'shortTitle560', row: 560, apiName: LONG_API, title: 'Account' },
} satisfies Record<string, Case>;

const ENTRY = '\0studio-item-header-width:entry';

/**
 * `@object-ui/<pkg>` to `packages/<pkg>/src`, and a subpath into that `src/`.
 * The one subpath whose file is not named for it is `types/zod`.
 */
function workspaceSources(): Plugin {
  return {
    name: 'studio-item-header-width-workspace-src',
    enforce: 'pre',
    async resolveId(id, importer) {
      const m = /^@object-ui\/([a-z0-9-]+)(?:\/(.+))?$/.exec(id);
      if (!m) return null;
      const [, pkg, sub] = m;
      const target =
        pkg === 'types' && sub === 'zod'
          ? source('packages/types/src/zod/index.zod.ts')
          : source(`packages/${pkg}/src${sub ? `/${sub}` : ''}`);
      const resolved = await this.resolve(target, importer, { skipSelf: true });
      if (!resolved) throw new Error(`${id} did not resolve to a source file under ${target}`);
      return resolved;
    },
  };
}

/** The page: the case named by `window.__case`, mounted with the client renderer. */
function entry(): Plugin {
  const code = `
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { StudioItemHeader } from ${JSON.stringify(ITEM_HEADER)};
import { STUDIO_KIND_CHIP } from ${JSON.stringify(STUDIO_TOKENS)};

const h = React.createElement;
const Icon = (props) => h('svg', { ...props, viewBox: '0 0 16 16', 'aria-hidden': 'true' }, h('rect', { x: 2, y: 2, width: 12, height: 12 }));
const c = window.__case;

createRoot(document.getElementById('root')).render(
  h('div', { id: 'frame', className: 'bg-background' },
    h(StudioItemHeader, {
      testId: 'hdr',
      icon: Icon,
      title: c.title ?? ${JSON.stringify(TITLE)},
      titleProps: { 'data-testid': 'hdr-title' },
      apiName: c.apiName,
      chips: c.kindChip ? h('span', { className: STUDIO_KIND_CHIP, 'data-testid': 'hdr-kind-chip' }, 'Custom') : undefined,
      status: { label: 'Unpublished draft' },
      meta: h('span', { 'data-testid': 'hdr-meta' }, '12 fields'),
      actions: h('span', { className: 'text-[11px] text-muted-foreground', 'data-testid': 'hdr-saved-at' }, 'Last saved 10:42'),
    })),
);
`;
  return {
    name: 'studio-item-header-width-entry',
    resolveId: (id) => (id === 'studio-item-header-width:entry' ? ENTRY : null),
    load: (id) => (id === ENTRY ? code : null),
  };
}

/** Bundle the page once, from source, to one ES module held in memory. */
async function bundlePage(): Promise<string> {
  const result = await build({
    configFile: false,
    root: REPO_ROOT,
    // Out of the tree: this run must leave nothing behind in the checkout.
    cacheDir: path.join(os.tmpdir(), 'objectui-studio-item-header-width'),
    logLevel: 'error',
    mode: 'production',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [workspaceSources(), entry()],
    build: {
      write: false,
      minify: false,
      target: 'es2022',
      modulePreload: false,
      reportCompressedSize: false,
      rollupOptions: {
        input: 'studio-item-header-width:entry',
        output: { format: 'es', codeSplitting: false },
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rollup.RollupOutput[];
  const chunks = outputs.flatMap((o) => o.output).filter((o): o is Rollup.OutputChunk => o.type === 'chunk');
  if (chunks.length !== 1) throw new Error(`expected one bundled chunk, got ${chunks.length}`);
  return chunks[0].code;
}

/** The real theme sheet, compiled for the given class candidates. */
async function tailwindFor(candidates: string[]): Promise<string> {
  const requireFromComponents = createRequire(source('packages/components/package.json'));
  const twEntry = requireFromComponents.resolve('tailwindcss/index.css');
  const compiler = await compile(readFileSync(THEME_CSS, 'utf8'), {
    base: path.dirname(THEME_CSS),
    loadStylesheet: async (id: string, base: string) => {
      const file = id === 'tailwindcss' ? twEntry : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') };
    },
    loadModule: async (id: string) => {
      const file = requireFromComponents.resolve(id);
      const mod = await import(pathToFileURL(file).href);
      return { path: file, base: path.dirname(file), module: mod.default ?? mod };
    },
  });
  const css = compiler.build(candidates);
  // A stylesheet missing the rules under test would measure an unstyled row
  // and could pass for the wrong reason: the row's container queries and the
  // chip's truncation have to be there.
  for (const needle of ['@container', 'text-overflow: ellipsis', '--color-muted']) {
    if (!css.includes(needle)) throw new Error(`Tailwind emitted nothing for ${needle}; the row would be unstyled.`);
  }
  return css;
}

interface Box {
  width: number;
  scrollWidth: number;
  /** The text is cut: its content is wider than its box. */
  clipped: boolean;
}

interface Reading {
  row: { width: number; scrollWidth: number };
  title: Box & { text: string };
  chip: Box & { text: string; tabIndex: number };
  kindChip: Box | null;
  status: { width: number; textShown: boolean };
  /** Every child of the row lies inside it. */
  childrenInsideRow: boolean;
  /** Title, api chip, chips: the order objectui#11665 and objectui#7254 pin. */
  identityOrder: string[];
  documentOverflowX: number;
}

let bundle = '';

async function mount(page: Page, c: Case): Promise<void> {
  await page.setViewportSize({ width: c.row + HEADER_SIDE_PADDING, height: 400 });
  await page.setContent('<!doctype html><html><head><style>html,body{margin:0}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate((value) => {
    (window as unknown as { __case: Case }).__case = value;
  }, c);
  await page.addScriptTag({ content: bundle, type: 'module' });
  await page.waitForSelector('[data-testid="hdr-title"]', { timeout: 30_000 });
  // The stylesheet is compiled for the classes on the page; compile until the
  // class set stops growing.
  const classesOnPage = () =>
    page.evaluate(() => [
      ...new Set(
        [...document.querySelectorAll('[class]')].flatMap((el) => (el.getAttribute('class') ?? '').split(/\s+/)).filter(Boolean),
      ),
    ]);
  const compiled = new Set<string>();
  for (let round = 0; ; round++) {
    const candidates = await classesOnPage();
    if (round > 0 && candidates.every((cls) => compiled.has(cls))) break;
    if (round === 5) throw new Error('the page kept adding classes; the stylesheet never caught up');
    candidates.forEach((cls) => compiled.add(cls));
    const css = await tailwindFor([...compiled]);
    await page.evaluate((text) => {
      let sheet = document.getElementById('tailwind');
      if (!sheet) {
        sheet = document.createElement('style');
        sheet.id = 'tailwind';
        document.head.appendChild(sheet);
      }
      sheet.textContent = text;
    }, css);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  await page.evaluate(() => document.fonts?.ready);
  // Settle: two consecutive frames with the same title and chip widths.
  // ⛔ Not `title width > 0`: a starved title can be 0 wide, and that reading
  // is the finding, not a reason to time out.
  await page.waitForFunction(
    () => {
      const title = document.querySelector('[data-testid="hdr-title"]');
      const chip = document.querySelector('[data-testid="studio-item-api-name"]');
      if (!title || !chip) return false;
      const sig = `${title.getBoundingClientRect().width},${chip.getBoundingClientRect().width}`;
      const w = window as unknown as { __sig?: string };
      const prev = w.__sig;
      w.__sig = sig;
      return prev === sig;
    },
    null,
    { polling: 'raf', timeout: 10_000 },
  );
}

async function measure(page: Page): Promise<Reading> {
  return page.evaluate(() => {
    const round = (n: number) => Math.round(n * 100) / 100;
    const boxOf = (el: HTMLElement): { width: number; scrollWidth: number; clipped: boolean } => {
      const width = el.getBoundingClientRect().width;
      return { width: round(width), scrollWidth: el.scrollWidth, clipped: el.scrollWidth > el.clientWidth };
    };
    const title = document.querySelector<HTMLElement>('[data-testid="hdr-title"]')!;
    const chip = document.querySelector<HTMLElement>('[data-testid="studio-item-api-name"]')!;
    const kind = document.querySelector<HTMLElement>('[data-testid="hdr-kind-chip"]');
    const status = document.querySelector<HTMLElement>('[data-testid="studio-item-status"]')!;
    const statusText = status.querySelector<HTMLElement>('[data-slot="status-text"]')!;
    const row = title.parentElement!;
    const rowRect = row.getBoundingClientRect();
    // The row's boxes: its children, and the children of a `contents` wrapper
    // (the identity chips), which draws no box of its own.
    const boxes = Array.from(row.children).flatMap((el) =>
      getComputedStyle(el).display === 'contents' ? Array.from(el.children) : [el],
    );
    const shown = boxes.filter((el) => getComputedStyle(el).display !== 'none');
    return {
      row: { width: round(rowRect.width), scrollWidth: row.scrollWidth },
      title: { ...boxOf(title), text: title.textContent ?? '' },
      chip: { ...boxOf(chip), text: chip.textContent ?? '', tabIndex: chip.tabIndex },
      kindChip: kind ? boxOf(kind) : null,
      status: { width: round(status.getBoundingClientRect().width), textShown: statusText.getBoundingClientRect().width > 1 },
      childrenInsideRow: shown.every((el) => {
        const r = el.getBoundingClientRect();
        return r.left >= rowRect.left - 0.5 && r.right <= rowRect.right + 0.5;
      }),
      identityOrder: boxes.flatMap((el) =>
        el === title ? ['title'] : el === chip ? ['api-chip'] : el === kind ? ['kind-chip'] : [],
      ),
      documentOverflowX: round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  });
}

async function read(page: Page, c: Case, testInfo: import('@playwright/test').TestInfo): Promise<Reading> {
  await mount(page, c);
  const r = await measure(page);
  // The readings go to the report: the numbers depend on the font.
  testInfo.annotations.push({ type: `studio-item-header@${c.name}`, description: JSON.stringify(r) });
  process.stdout.write(`[studio-item-header ${c.name}] ${JSON.stringify(r)}\n`);
  return r;
}

test.beforeAll(async () => {
  // Bundling the header's module graph is the slow part; once per worker.
  test.setTimeout(240_000);
  bundle = await bundlePage();
});

test.describe('the Studio item title keeps its room beside a long api name (objectui#12791)', () => {
  test('at a 560 px row with a 30-character api name: the title keeps 200 px, the chip truncates, its name in its tooltip', async ({
    page,
  }, testInfo) => {
    const r = await read(page, CASES.long560, testInfo);
    expect(LONG_API).toHaveLength(30);
    expect(r.row.width).toBe(560);

    // THE assertion: the card's floor, measured, not a class.
    expect(r.title.width, `title ${r.title.width}px; api chip ${r.chip.width}px of ${r.chip.scrollWidth}px`).toBeGreaterThanOrEqual(
      TITLE_FLOOR,
    );
    // The chip gave the room: it is cut, and still says the whole name.
    expect(r.chip.clipped, `chip ${r.chip.width}px for ${r.chip.scrollWidth}px of name`).toBe(true);
    expect(r.chip.text).toBe(LONG_API);
    // The chip keeps its place: right after the title.
    expect(r.identityOrder).toEqual(['title', 'api-chip']);
    // Nothing was bought by pushing a slot out of the row.
    expect(r.childrenInsideRow).toBe(true);
    expect(r.row.scrollWidth).toBeLessThanOrEqual(Math.ceil(r.row.width));

    // The whole name is the chip's tooltip, as the status chip's folded text is.
    expect(r.chip.tabIndex).toBe(0);
    await page.getByTestId('studio-item-api-name').hover();
    await expect(page.getByRole('tooltip')).toHaveText(LONG_API);
  });

  test('CONTROL: at a 560 px row with a short api name, the chip is whole', async ({ page }, testInfo) => {
    const r = await read(page, CASES.short560, testInfo);
    expect(r.chip.text).toBe(SHORT_API);
    expect(r.chip.clipped, `chip ${r.chip.width}px for ${r.chip.scrollWidth}px of name`).toBe(false);
    expect(r.title.width).toBeGreaterThanOrEqual(TITLE_FLOOR);
    expect(r.childrenInsideRow).toBe(true);
  });

  test("CONTROL: at a 736 px row (the card's 1024 px viewport) the title is whole, and the chip takes what is left", async ({
    page,
  }, testInfo) => {
    const r = await read(page, CASES.long736, testInfo);
    expect(r.title.clipped, `title ${r.title.width}px for ${r.title.scrollWidth}px of text`).toBe(false);
    expect(r.title.text).toBe(TITLE);
    expect(r.childrenInsideRow).toBe(true);
  });

  test('CONTROL: at a 1024 px row with the long api name, neither the title nor the chip is cut', async ({ page }, testInfo) => {
    const r = await read(page, CASES.long1024, testInfo);
    expect(r.title.clipped, `title ${r.title.width}px for ${r.title.scrollWidth}px of text`).toBe(false);
    expect(r.chip.clipped, `chip ${r.chip.width}px for ${r.chip.scrollWidth}px of name`).toBe(false);
    expect(r.childrenInsideRow).toBe(true);
  });

  test('CONTROL: a short title is not padded to 200 px; the chip takes the room it leaves', async ({ page }, testInfo) => {
    const r = await read(page, CASES.shortTitle560, testInfo);
    expect(r.title.text).toBe('Account');
    expect(r.title.clipped).toBe(false);
    // The title's box is its text, not the 200 px step: no gap before the chip.
    expect(r.title.width).toBeLessThanOrEqual(r.title.scrollWidth + 0.5);
    expect(r.title.width).toBeLessThan(TITLE_FLOOR);
    expect(r.childrenInsideRow).toBe(true);
  });

  test('the chips after the api name stay whole: only the api chip gives way', async ({ page }, testInfo) => {
    const r = await read(page, CASES.chips736, testInfo);
    expect(r.identityOrder).toEqual(['title', 'api-chip', 'kind-chip']);
    expect(r.kindChip?.clipped, `kind chip ${JSON.stringify(r.kindChip)}`).toBe(false);
    expect(r.chip.clipped).toBe(true);
    expect(r.title.width).toBeGreaterThanOrEqual(TITLE_FLOOR);
  });

  test('at a 360 px row nothing overflows: below the floor the title gives way last, inside the row', async ({
    page,
  }, testInfo) => {
    const r = await read(page, CASES.long360, testInfo);
    expect(r.row.width).toBe(360);
    expect(r.documentOverflowX, 'the header pushed the page sideways').toBe(0);
    expect(r.row.scrollWidth, `row ${r.row.width}px holds ${r.row.scrollWidth}px`).toBeLessThanOrEqual(Math.ceil(r.row.width));
    expect(r.childrenInsideRow).toBe(true);
    // The status chip's text has folded (below 480 px of row), and the chip
    // has truncated before the title did.
    expect(r.status.textShown).toBe(false);
    expect(r.chip.clipped).toBe(true);
  });
});
