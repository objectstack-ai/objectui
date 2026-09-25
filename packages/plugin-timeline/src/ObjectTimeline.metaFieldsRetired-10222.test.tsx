/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10222 — `ObjectTimeline` reads no `timeline.metaFields` list.
 *
 * Ruling batch #223 item 5b, letter A (comment 5824012155 on the card): the
 * undeclared `metaFields` reads are deleted in both packages. The spec's
 * `TimelineConfigSchema` is a strict object that declares no such member and
 * refuses one, so an author could only reach this read through a stored view's
 * unjudged `options` bag (objectui#10380). The chips beside each title are now
 * always the built-in `status` / `priority` pair, limited to the fields the
 * object declares. ⛔ `cardFields` is the reserved spelling if a producer ever
 * asks for authored chip fields; nothing is declared here.
 *
 * Behaviour change, named in the changeset: a stored interface-page view that
 * carries `options.timeline.metaFields` falls back to the default chips.
 * `plugin-list`'s `ListView.timelineMetaFieldsRetired-10222.test.tsx` pins the
 * projection half, which keeps fetching status / priority for every timeline.
 *
 * `./renderer` is deliberately NOT mocked: the chips are read off the real
 * `TimelineRenderer` output, the surface a user sees. Harness as in
 * `__tests__/timeline-shared-safe-field-label-5623.test.tsx`.
 */
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectTimeline } from './ObjectTimeline';

vi.mock('@object-ui/react', async (importOriginal) => {
  const actual = await (importOriginal() as Promise<Record<string, unknown>>);
  return {
    ...actual,
    useDataScope: () => undefined,
    useNavigationOverlay: () => ({
      isOverlay: false,
      handleClick: vi.fn(),
      selectedRecord: null,
      isOpen: false,
      close: vi.fn(),
      setIsOpen: vi.fn(),
      mode: 'overlay',
      view: undefined,
    }),
  };
});

afterEach(() => cleanup());

const OBJECT_DEF = {
  fields: {
    status: { type: 'select', options: [{ value: 'open', label: 'Open' }] },
    priority: { type: 'select', options: [{ value: 'high', label: 'High' }] },
    region: { type: 'select', options: [{ value: 'emea', label: 'EMEA' }] },
  },
};

const ROWS = [
  { id: '1', name: 'Item 1', date: '2024-01-01', status: 'open', priority: 'high', region: 'emea' },
];

function makeDataSource() {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => OBJECT_DEF),
  };
}

/** `MetaChip`'s own classes; the title, date and markers carry none of them. */
const chipTexts = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll('span.rounded-full.border.text-xs')).map((el) => el.textContent ?? '');

/** Mount with this `timeline` block and return the chip labels once the object definition has landed. */
async function chipsFor(timeline: Record<string, unknown>): Promise<string[]> {
  const props = {
    schema: { type: 'object-timeline', objectName: 'lead', titleField: 'name', timeline },
    data: ROWS,
    dataSource: makeDataSource(),
  } as unknown as React.ComponentProps<typeof ObjectTimeline>;
  const { container, unmount } = render(<ObjectTimeline {...props} />);
  // The chips appear only after `getObjectSchema` resolves; the title is there
  // from the first render, so wait on a chip rather than on `Item 1`.
  await waitFor(() => expect(chipTexts(container).length).toBeGreaterThan(0));
  const chips = chipTexts(container);
  expect(screen.getByText('Item 1'), 'the row itself rendered').toBeDefined();
  unmount();
  return chips;
}

const BLOCK = { startDateField: 'date' };

describe('ObjectTimeline — the `metaFields` read is retired (objectui#10222)', () => {
  it('CONTROL: with no `metaFields`, the built-in status / priority chips render', async () => {
    expect(await chipsFor(BLOCK)).toEqual(['Open', 'High']);
  });

  it('RENDER: a block carrying `metaFields` renders the SAME chips as one without', async () => {
    const without = await chipsFor(BLOCK);
    const withKey = await chipsFor({ ...BLOCK, metaFields: ['region'] });
    expect(
      withKey,
      'the key is undeclared on the spec timeline block; the chips must not change with it',
    ).toEqual(without);
    expect(withKey, 'the field named by the retired key must not become a chip').not.toContain('EMEA');
  });
});

// ── SOURCE: no `metaFields` read left in this package ─────────────────────

/** Rooted at THIS file, never at `process.cwd()`. */
const SRC = dirname(fileURLToPath(import.meta.url));
const RETIRED = 'metaFields';

/** Every non-test `.ts` / `.tsx` file under `src/`. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__') continue;
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * The 1-based lines where `name` is used as CODE: an identifier (`x.name`,
 * `x?.name`, `{ name }`, `name:`) or a string literal (`x['name']`,
 * `'name' in x`). Comments are trivia, not tokens, so prose naming the retired
 * key is not a read.
 */
function codeUses(text: string, file: string, name: string): number[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: number[] = [];
  const walk = (node: ts.Node): void => {
    if ((ts.isIdentifier(node) || ts.isStringLiteralLike(node)) && node.text === name) {
      hits.push(sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1);
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return hits;
}

describe('SOURCE: no `metaFields` read remains in plugin-timeline (objectui#10222)', () => {
  const files = sourceFiles(SRC);
  const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');

  it('POPULATION: the scan covers ObjectTimeline.tsx, the file that held the read', () => {
    expect(files.map(rel)).toContain('ObjectTimeline.tsx');
  });

  it('no non-test source names `metaFields` as code', () => {
    // The location string is computed here for the failure message only.
    const hits = files.flatMap((f) =>
      codeUses(readFileSync(f, 'utf8'), rel(f), RETIRED).map((line) => `${rel(f)} line ${line}`));
    expect(hits, 'a `metaFields` read came back; the key is undeclared (objectui#10222)').toEqual([]);
  });

  it('FIRING CONTROL: the same scanner finds `colorField`, read beside it in ObjectTimeline.tsx', () => {
    const timeline = files.find((f) => rel(f) === 'ObjectTimeline.tsx')!;
    expect(codeUses(readFileSync(timeline, 'utf8'), 'ObjectTimeline.tsx', 'colorField').length).toBeGreaterThan(0);
  });

  it('FIRING CONTROL: the scanner catches the shape the retired read took, and skips comments', () => {
    const probe = [
      '// metaFields in a comment is prose',
      'const a = (timelineConfig as any)?.metaFields;',
      "const b = timelineConfig['metaFields'];",
    ].join('\n');
    expect(codeUses(probe, 'probe.ts', RETIRED), 'the probe lines, 1-based').toEqual([2, 3]);
  });
});
