/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The layout guide's page snippets DRAW THE HEADING THEY SHOW (objectui#11423).
 *
 * ## The defect
 *
 * `PageRenderer` reads `pageType`, which defaults to `'record'`, to decide who
 * draws the page's `h1`. A record page leaves the heading to a `page:header`
 * block and never draws `description`. Every other page type draws `title` as
 * the `h1` and `description` under it. Four passages of
 * `content/docs/guide/layout.md` (Page Component's Basic Usage, With Action
 * Buttons, Detail Page with Actions, Best Practices 3) taught a `page` node with
 * a `title` and no `pageType`, so a reader who copied one got a record page.
 * Rendered through the real `SchemaRenderer`, it drew no heading, and the
 * `description` the first one showed was not drawn either.
 *
 * ## What this file asserts
 *
 * Every `type: "page"` JSON fence in the guide that authors a heading, as the
 * page's `title` or as a titled `page:header` block in its children, renders
 * through the real `SchemaRenderer` and the real renderers, and draws exactly
 * ONE `h1` with that text. A fence with a `description` draws it too. The four
 * corrected sections are pinned by heading text, so the population cannot shrink
 * to an empty list and pass.
 *
 * A static read sits beside the render. No fence may write `title` or
 * `description` on a page whose effective `pageType` is `record`, because there
 * neither key draws anything. That is the defect's own shape, and it needs no DOM.
 *
 * Two LIVE CONTROLS replay the shapes the card was filed on. Without them, "one
 * `h1` with this text" would also pass on a renderer that drew `title` on every
 * page type, and the assertion could not fail for the reason it exists.
 *
 * ## Placement
 *
 * `content/docs/**` is excluded from `ci.yml`'s full-run decision on
 * `pull_request`, so a docs-only edit to the guide does not run this file there.
 * `scripts/markdown-test-inputs.mjs` records this file as a reader of the guide,
 * which is what puts it back in that run. The file sits in the package the
 * renderer lives in, beside `guide-layout-page-buttons-7926.test.tsx`, which
 * renders the same guide's action passages.
 *
 * The renderers are imported at module scope, not in `beforeAll`, per AGENTS.md's
 * flaky-test discipline: registering them is an unbounded module load and must
 * not be billed to a bounded hook timeout.
 */
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../renderers';
import { SchemaRenderer } from '@object-ui/react';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const GUIDE_PATH = path.join(repoRoot, 'content/docs/guide/layout.md');

type Doc = Record<string, unknown>;

/** One `json` fence of the guide carrying a `type: "page"` document, with the heading it sits under. */
interface PageFence {
  heading: string;
  doc: Doc;
}

function pageFences(src: string): PageFence[] {
  const lines = src.split('\n');
  const out: PageFence[] = [];
  let heading = '';
  for (let i = 0; i < lines.length; i++) {
    const h = /^#{2,3} (.+)$/.exec(lines[i]);
    if (h) {
      heading = h[1];
      continue;
    }
    if (lines[i] !== '```json') continue;
    const end = lines.indexOf('```', i + 1);
    if (end === -1) break;
    let doc: unknown;
    try {
      doc = JSON.parse(lines.slice(i + 1, end).join('\n'));
    } catch {
      doc = undefined;
    }
    if (doc && typeof doc === 'object' && (doc as Doc).type === 'page') {
      out.push({ heading, doc: doc as Doc });
    }
    i = end;
  }
  return out;
}

/** The literal `properties.title` of the first `page:header` block among a node list, at any depth. */
function headerTitle(nodes: unknown): string | null {
  const list = Array.isArray(nodes) ? nodes : nodes ? [nodes] : [];
  for (const n of list) {
    if (!n || typeof n !== 'object') continue;
    const node = n as Doc;
    if (node.type === 'page:header') {
      const title = (node.properties as Doc | undefined)?.title;
      if (typeof title === 'string' && title.trim() !== '') return title;
    }
    const nested = headerTitle(node.children);
    if (nested) return nested;
  }
  return null;
}

/** The heading a fence SHOWS a reader, and which element is meant to draw it. */
function authoredHeading(doc: Doc): { text: string; by: 'page' | 'page:header' } | null {
  const fromHeader = headerTitle(doc.children);
  if (fromHeader) return { text: fromHeader, by: 'page:header' };
  return typeof doc.title === 'string' ? { text: doc.title, by: 'page' } : null;
}

const effectivePageType = (doc: Doc) => (doc.pageType as string | undefined) ?? 'record';

/** What the real renderers put on screen for this document. */
function drawn(doc: unknown) {
  const { container } = render(<SchemaRenderer schema={doc as never} />);
  const h1s = Array.from(container.querySelectorAll('h1')).map((h) => ({
    text: h.textContent?.trim() ?? '',
    inHeaderBlock: !!h.closest('header'),
  }));
  const paragraphs = Array.from(container.querySelectorAll('p')).map(
    (p) => p.textContent?.trim() ?? '',
  );
  const buttons = Array.from(container.querySelectorAll('button')).map(
    (b) => b.textContent?.trim() ?? '',
  );
  cleanup();
  return { h1s, paragraphs, buttons };
}

const GUIDE = readFileSync(GUIDE_PATH, 'utf8');
const FENCES = pageFences(GUIDE);
const HEADED = FENCES.flatMap((f) => {
  const heading = authoredHeading(f.doc);
  return heading ? [{ ...f, expected: heading }] : [];
});

/** The four passages the card names, found by heading text rather than by line. */
const CORRECTED = [
  'Basic Usage',
  'With Action Buttons',
  'Detail Page with Actions',
  '3. Action Buttons at the Top of the Body',
];

const fenceUnder = (heading: string) => {
  const fence = FENCES.find((f) => f.heading === heading);
  expect({ heading, found: !!fence }).toEqual({ heading, found: true });
  return fence!.doc;
};

describe('objectui#11423 — the layout guide’s page snippets draw the heading they show', () => {
  it('LIT CONTROL — the guide is readable and its page fences are found', () => {
    // A broken reader would hand every assertion below an empty list.
    expect(GUIDE.length).toBeGreaterThan(1000);
    expect(FENCES.length).toBeGreaterThan(4);
  });

  it('the four corrected passages each carry a page fence that authors a heading', () => {
    // Derived, but PINNED: a passage that loses its fence or its heading would
    // otherwise drop out of the render population below without a sound.
    const headed = new Set(HEADED.map((f) => f.heading));
    for (const heading of CORRECTED) {
      expect({ heading, headed: headed.has(heading) }).toEqual({ heading, headed: true });
    }
  });

  it.each(HEADED.map((f) => [f.heading, f.expected.text, f.expected.by, f.doc] as const))(
    'draws exactly one h1 with its heading: %s ("%s", drawn by %s)',
    (_heading, text, by, doc) => {
      const { h1s } = drawn(doc);
      expect(h1s.map((h) => h.text)).toEqual([text]);
      // Who draws it is the mechanism this card is about: a record page's
      // heading is the `page:header` block's own `h1`; every other page draws
      // `title` itself, outside any header block.
      expect(h1s[0].inHeaderBlock).toBe(by === 'page:header');
    },
  );

  it('a fence that shows a `description` draws it', () => {
    const described = FENCES.filter((f) => typeof f.doc.description === 'string');
    // Basic Usage is the passage that shows one; without it this test would
    // pass over an empty list.
    expect(described.map((f) => f.heading)).toContain('Basic Usage');
    for (const f of described) {
      const { paragraphs } = drawn(f.doc);
      expect({ heading: f.heading, drawn: paragraphs.includes(f.doc.description as string) }).toEqual({
        heading: f.heading,
        drawn: true,
      });
    }
  });

  it('no fence writes `title` or `description` on a record page, where neither draws', () => {
    // The defect's own shape, read without a DOM. A record page's heading is a
    // `page:header` block, and its `description` has no reader on screen.
    const offenders = FENCES.filter(
      (f) => effectivePageType(f.doc) === 'record' && ('title' in f.doc || 'description' in f.doc),
    ).map((f) => f.heading);
    expect(offenders).toEqual([]);
  });

  it('LIVE CONTROL — Basic Usage without its `pageType` draws neither heading nor description', () => {
    // The reading objectui#11423 was filed on: the same document as a record
    // page. If this ever draws the title, a record page started drawing `title`
    // and every assertion above stopped telling the page types apart.
    const { pageType, ...asRecordPage } = fenceUnder('Basic Usage');
    expect(pageType).toBeDefined();
    const { h1s, paragraphs } = drawn(asRecordPage);
    expect(h1s).toEqual([]);
    expect(paragraphs).not.toContain(asRecordPage.description);
  });

  it('LIVE CONTROL — Detail Page with its heading back on the page node draws no h1', () => {
    // The shape that passage had: `title` on a record page, no `page:header`.
    // The buttons are read too, so "no h1" is about the heading and not about
    // this test being unable to render the document at all.
    const detail = fenceUnder('Detail Page with Actions');
    const heading = authoredHeading(detail);
    expect(heading?.by).toBe('page:header');
    const children = (detail.children as Doc[]).filter((n) => n.type !== 'page:header');
    const { h1s, buttons } = drawn({ ...detail, title: heading!.text, children });
    expect(h1s).toEqual([]);
    expect(buttons).toEqual(expect.arrayContaining(['Edit', 'Delete']));
  });
});
