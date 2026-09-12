/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9170 — the board's empty state announces "no cards" and nothing else.
 *
 * ## The defect, measured in the DOM on objectui#9169's branch
 *
 * `KanbanImpl` composed the board-level empty state's description by
 * CONCATENATION — the lane count, a space, then the pack's `kanban.columns`
 * unit word, a bare plural with no singular form. Reading the live region's own
 * `textContent` at three lane counts:
 *
 *   ZERO: "No cards0 columns"   ← grammatical (English takes the plural at 0)
 *   ONE:  "No cards1 columns"   ← the defect
 *   TWO:  "No cards2 columns"   ← grammatical
 *
 * `DataEmptyState` there is `role="status" aria-live="polite"`, so this is read
 * ALOUD, not merely printed.
 *
 * ## ⭐ Why the string was safe until objectui#9169 and is not any more
 *
 * The bare plural was not a latent bug — it was CORRECT for every board that
 * could reach it. The empty state used to require `boardColumns.length > 1`, so
 * the count in front of `columns` was never 1. objectui#9169 removed that
 * conjunct so a zero-lane and a one-lane board announce at all — that widening
 * IS the accessibility fix — and the one-lane form became reachable with it.
 *
 * ## The repair, and what it is NOT
 *
 * The maintainer's ruling on objectui#9170 (2026-09-12) took the third of the
 * card's three routes: the region's job is "no cards", the lane count is already
 * visible on the board, and read aloud it is noise. The description is removed,
 * so the announcement carries NO NUMBER AT ALL.
 *
 * ⛔ It is not the plural-family route (that was ruled against), and ⛔ it is not
 * a retreat to the `> 1` predicate — the zero- and one-lane boards still
 * announce, which is the whole of objectui#9045 and is asserted here as its own
 * leg rather than assumed.
 *
 * ## Why "no digit" and not just "equals No cards"
 *
 * The three rows below are asserted three ways on purpose. Byte equality pins
 * today's copy; the EQUALITY ACROSS the three rows is the claim the card's
 * measurement actually makes — the same string at every lane count; and the
 * absence of any digit is the one that survives a copy change, catching a count
 * that comes back in a spelling nobody predicted. A repair that reworded the
 * title would fail the first and still be held by the other two.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, act, cleanup } from '@testing-library/react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { I18nProvider } from '@object-ui/i18n';
// Registers `object-kanban`.
import '../index';
// The board renders inside `KanbanRenderer`'s `React.lazy` boundary; importing
// the chunk at module scope bills the cold transform to the import phase
// instead of racing a `waitFor` budget (objectui#3010).
import '../KanbanImpl';

const ONE_LANE = [{ id: 'todo', title: 'To Do' }];
const TWO_LANES = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
];

/** The lane shapes the card measured, in its own order. */
const SHAPES: Array<[row: string, schema: Record<string, unknown>]> = [
  ['ZERO', { type: 'object-kanban' }],
  ['ONE', { type: 'object-kanban', groupBy: 'status', columns: ONE_LANE }],
  ['TWO', { type: 'object-kanban', groupBy: 'status', columns: TWO_LANES }],
];

/**
 * The board's only live region — `role="status" aria-live="polite"`. Queried off
 * `document` rather than a render container so a portalled subtree could not
 * read as an absence.
 */
const liveRegion = () => document.querySelector('[role="status"][aria-live="polite"]');

/** What assistive technology is handed: the region's own text, whole. */
const announcement = () => (liveRegion()?.textContent ?? '');

/**
 * Pump the event loop inside `act` until `pred()` holds or the budget expires,
 * and REPORT whether it did — a rig that never completed must not read as an
 * absence.
 */
async function pumpUntil(pred: () => boolean, budgetMs = 3000): Promise<boolean> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    if (pred()) return true;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
  return pred();
}

/**
 * Render an empty board at a given lane shape. `language` mounts a real
 * `I18nProvider` — the path the console takes; `null` mounts none, which is the
 * `createSafeTranslation` fallback path an embedder gets, and the path the
 * card's original three-lane measurement was taken on.
 */
function renderEmptyBoard(schema: Record<string, unknown>, language: string | null, rows: unknown[] = []) {
  const find = vi.fn(() => Promise.resolve({ data: rows, total: rows.length }));
  const dataSource = { find, findOne: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const board = (
    <SchemaRendererProvider dataSource={dataSource as never}>
      <SchemaRenderer schema={{ objectName: 'deal', cardTitle: 'name', ...schema } as never} />
    </SchemaRendererProvider>
  );
  const result = render(
    language === null ? (
      board
    ) : (
      <I18nProvider config={{ defaultLanguage: language, detectBrowserLanguage: false }}>{board}</I18nProvider>
    ),
  );
  return { ...result, find };
}

/**
 * Settle the board and PROVE it settled, then wait for the live region to carry
 * text — a reading taken before either would be about a board mid-flight.
 */
async function settledAnnouncement(find: ReturnType<typeof vi.fn>): Promise<string> {
  await waitFor(() => expect(find).toHaveBeenCalled());
  // Non-empty rather than an English needle: the title comes from the pack, so a
  // needle would make every non-`en` leg fail as a rig failure instead of as the
  // reading it is. The exact text is asserted by the caller.
  const painted = await pumpUntil(() => announcement().trim().length > 0);
  expect(painted, 'RIG SELF-CHECK: the live region must have painted before it is read').toBe(true);
  return announcement();
}

/** Read all three lane shapes in one language, one render each. */
async function readAllThree(language: string | null): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [row, schema] of SHAPES) {
    const { find } = renderEmptyBoard(schema, language);
    out[row] = await settledAnnouncement(find);
    cleanup();
  }
  return out;
}

afterEach(cleanup);

describe('objectui#9170 — zero, one and two lanes announce the SAME numberless string', () => {
  it('en, through the provider', async () => {
    const read = await readAllThree('en');
    // 1. today's copy, byte for byte
    expect(read).toEqual({ ZERO: 'No cards', ONE: 'No cards', TWO: 'No cards' });
    // 2. ⭐ the card's own claim: the same string at every lane count. Stated as
    //    an equality rather than three literals, so it keeps holding if the copy
    //    is reworded and stops holding the moment the rows diverge again.
    expect(new Set(Object.values(read)).size, 'the three lane counts no longer read alike').toBe(1);
    // 3. the leg that survives a copy change: no digit, in any spelling
    for (const [row, text] of Object.entries(read)) {
      expect(/\d/.test(text), `${row} put a number back into the live region: ${text}`).toBe(false);
    }
    // …and the exact string this card was filed on is named, so the defect is
    // refused rather than merely absent.
    expect(read.ONE).not.toBe('No cards1 columns');
  });

  it('provider-less — the path the card measured, and an embedder gets', async () => {
    // ⛔ NOT a second copy of the case above: this is the `createSafeTranslation`
    // fallback, which resolves its own defaults table and never sees the pack.
    // Route 3 is the only one of the card's three routes that is correct on BOTH
    // paths at once, because a path with no number needs no plural logic — and
    // `fallbackT` has none (it reads `defaults[key]` literally and never appends
    // a suffix; see `packages/plugin-detail/src/useDetailTranslation.ts`).
    const read = await readAllThree(null);
    expect(read).toEqual({ ZERO: 'No cards', ONE: 'No cards', TWO: 'No cards' });
    expect(new Set(Object.values(read)).size).toBe(1);
    for (const [row, text] of Object.entries(read)) {
      expect(/\d/.test(text), `${row}: ${text}`).toBe(false);
    }
  });

  it('ru — the numberless claim is language-independent, which is what route 3 buys', async () => {
    // The route the ruling refused would have needed a plural family per pack,
    // with `ru` reaching `few` at the everyday two-to-four lanes. With no number
    // in the region there is nothing for any language's plural rules to act on,
    // and that is visible here rather than argued: three lane counts, one string,
    // in Russian.
    const read = await readAllThree('ru');
    expect(read).toEqual({ ZERO: 'Нет карточек', ONE: 'Нет карточек', TWO: 'Нет карточек' });
    expect(new Set(Object.values(read)).size).toBe(1);
    for (const [row, text] of Object.entries(read)) {
      expect(/\d/.test(text), `${row}: ${text}`).toBe(false);
    }
    // …and it really is the pack answering, not an English fallback.
    expect(read.ONE).not.toContain('No cards');
  });
});

describe('objectui#9170 — the rows above are readings, not an empty probe', () => {
  it('LIT CONTROL — a board WITH cards paints no live region at all', async () => {
    // Without this, "no digit in the live region" would also be true of a board
    // that never rendered one. ⛔ Not evidence of this card: it is what makes the
    // three rows above evidence.
    const { find, container } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: ONE_LANE },
      'en',
      [{ id: '1', name: 'Alpha', status: 'todo' }],
    );
    await waitFor(() => expect(find).toHaveBeenCalled());
    await waitFor(() => expect(container.textContent).toContain('Alpha'));
    expect(liveRegion(), 'a board holding a card is not empty, whatever its lane count').toBeNull();
  });

  it('⛔ objectui#9045 is NOT undone — one lane still announces, it just says less', async () => {
    // Route 3 removes the NUMBER, never the announcement. A repair that restored
    // the `> 1` predicate would satisfy every "no digit" leg above by making the
    // region vanish on the two shapes objectui#9045 exists to serve.
    for (const row of ['ZERO', 'ONE'] as const) {
      const schema = SHAPES.find(([name]) => name === row)![1];
      const { find } = renderEmptyBoard(schema, 'en');
      const text = await settledAnnouncement(find);
      expect(text, `${row} lanes: the board must still announce`).toBe('No cards');
      cleanup();
    }
  });
});
