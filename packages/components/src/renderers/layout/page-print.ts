/**
 * ObjectUI — the print stylesheet of a page that declares `print`
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#11958, card ② of the ruling of record on objectstack#8346 (letter
 * B′): "The template is a `page`. … The page gains an optional `print`
 * declaration … mapped to print CSS (`@page`, repeated table heads,
 * `break-inside`)."
 *
 * `PageRenderer` mounts the sheet this module builds only for a page whose
 * `print` is an object, and every rule sits inside `@media print`, so the page
 * on screen is drawn exactly as before. One rule per declared key, each as
 * the key's own `.describe()` in `@objectstack/spec` names it:
 *
 *  - `paperSize` / `orientation` → `@page { size }` (A4 and portrait when
 *    omitted, as the spec states);
 *  - `margins` → `@page { margin-top | -right | -bottom | -left }`, in
 *    millimetres, one descriptor per declared side; a side left out keeps the
 *    console's default sheet margin (`styles.css` in `@object-ui/app-shell`);
 *  - `pageNumbers` → the `@page` bottom-right margin box with `counter(page)`
 *    and `counter(pages)`;
 *  - `repeatHeader` / `repeatFooter` → the page's own `header` / `footer`
 *    region drawn as a table header / footer group, which the browser repeats
 *    on every sheet the page runs onto and reserves room for;
 *  - `repeatTableHeaders` (on when omitted) → `thead { display:
 *    table-header-group }`; set to `false` it is `table-row-group`, which does
 *    not repeat;
 *  - `avoidBreakInside` → `break-inside: avoid` on every block of a region.
 *
 * Besides the keys, two rules every print page needs: everything on the
 * document that is not the print page, an ancestor of it, or inside it is
 * hidden on paper (the console chrome, and the record view's own panels
 * around the page), and the ancestors' viewport-height clipping is released
 * so the page runs onto as many sheets as it needs.
 *
 * ⚠️ Values are WRITTEN INTO A STYLESHEET, so only the spec's own values pass:
 * an enum member for `paperSize` / `orientation`, a finite non-negative number
 * for a margin. Anything else is treated as not declared. This is the
 * stylesheet's injection boundary, not a second contract: `PageSchema` refuses
 * every such value at parse, at the authoring doors.
 */

import type { PageNodeSchema } from '@object-ui/types';

/** The page's `print` declaration, as the node type carries it from the spec by reference. */
export type PagePrintDeclaration = NonNullable<PageNodeSchema['print']>;

/** The DOM attribute `PageRenderer` stamps on the root of a print page; every rule below is scoped to it. */
export const PRINT_PAGE_ATTRIBUTE = 'data-print-page';

const PAPER_SIZES: ReadonlySet<string> = new Set(['A4', 'A5', 'Letter', 'Legal']);
const ORIENTATIONS: ReadonlySet<string> = new Set(['portrait', 'landscape']);
const MARGIN_SIDES = ['top', 'right', 'bottom', 'left'] as const;

/** True when `value` is a `print` declaration object — the one condition under which a page is a print page. */
export function isPagePrintDeclaration(value: unknown): value is PagePrintDeclaration {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function millimetres(value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? `${value}mm` : null;
}

/** The `@page` rule: sheet size and orientation, declared margins, and the page-number box. */
function pageRule(print: PagePrintDeclaration): string {
  const size = PAPER_SIZES.has(print.paperSize as string) ? print.paperSize : 'A4';
  const orientation = ORIENTATIONS.has(print.orientation as string) ? print.orientation : 'portrait';
  const lines = [`size: ${size} ${orientation};`];
  const margins = (print.margins ?? {}) as Partial<Record<(typeof MARGIN_SIDES)[number], unknown>>;
  for (const side of MARGIN_SIDES) {
    const mm = millimetres(margins[side]);
    if (mm) lines.push(`margin-${side}: ${mm};`);
  }
  if (print.pageNumbers === true) {
    lines.push('@bottom-right { content: counter(page) " / " counter(pages); font-size: 9pt; }');
  }
  return `@page { ${lines.join(' ')} }`;
}

/**
 * The running header and footer: the region's parent is drawn as a table, the
 * region as its header (footer) group and every sibling as a row group. A
 * table header / footer group is what the browser repeats on each sheet.
 */
function runningRegionRules(print: PagePrintDeclaration, page: string): string[] {
  const running: Array<['header' | 'footer', 'table-header-group' | 'table-footer-group']> = [];
  if (print.repeatHeader === true) running.push(['header', 'table-header-group']);
  if (print.repeatFooter === true) running.push(['footer', 'table-footer-group']);
  if (running.length === 0) return [];
  const parent = `${page} :has(${running.map(([name]) => `> [data-region="${name}"]`).join(', ')})`;
  return [
    `${parent} { display: table !important; width: 100%; }`,
    `${parent} > * { display: table-row-group !important; }`,
    ...running.map(([name, group]) => `${page} [data-region="${name}"] { display: ${group} !important; }`),
  ];
}

/**
 * Build the print stylesheet for a page that declares `print`. Pure: the same
 * declaration always yields the same text, so it is pinned as text.
 */
export function buildPagePrintStylesheet(print: PagePrintDeclaration): string {
  const page = `[${PRINT_PAGE_ATTRIBUTE}]`;
  const rules: string[] = [
    pageRule(print),
    // Only the print page reaches paper: an element that neither is the page,
    // holds it, nor sits inside it is hidden.
    `body :not(:has(${page})):not(${page}):not(${page} *) { display: none !important; }`,
    // Release the viewport-height chain above the page, which otherwise clips
    // it to one screen on paper.
    `:has(${page}) { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; position: static !important; }`,
    // The sheet margin is the page's inset on paper, so the screen padding and
    // the centred max-width are dropped.
    `${page} { padding: 0 !important; min-height: 0 !important; }`,
    `${page} > div { max-width: none !important; }`,
    ...runningRegionRules(print, page),
    `${page} thead { display: ${print.repeatTableHeaders === false ? 'table-row-group' : 'table-header-group'} !important; }`,
  ];
  if (print.avoidBreakInside === true) {
    rules.push(`${page} [data-region] > * { break-inside: avoid; }`);
  }
  return `@media print {\n  ${rules.join('\n  ')}\n}\n`;
}
