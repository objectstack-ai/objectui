/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9170 — the board's empty state agrees with its own lane count.
 *
 * ## The defect, measured in the DOM on objectui#9169's branch
 *
 * `KanbanImpl` composed the board-level empty state's description by
 * CONCATENATION — the lane count, a space, then `t('kanban.columns')`, which
 * every pack declared as a bare plural unit word with no singular form. Reading
 * the live region's own `textContent` at three lane counts:
 *
 *   ZERO: "No cards0 columns"   ← grammatical (English takes the plural at 0)
 *   ONE:  "No cards1 columns"   ← the defect
 *   TWO:  "No cards2 columns"   ← CONTROL, grammatical
 *
 * `DataEmptyState` there is `role="status" aria-live="polite"`, so this is read
 * ALOUD, not merely printed.
 *
 * ## ⭐ Why the string was safe until objectui#9169 and is not any more
 *
 * The bare plural was not a latent bug that nobody noticed — it was CORRECT for
 * every board that could reach it. The empty state used to require
 * `boardColumns.length > 1`, so the count in front of `columns` was never 1.
 * objectui#9169 removed that conjunct so a zero-lane and a one-lane board
 * announce at all — that widening IS the accessibility fix — and the one-lane
 * form became reachable with it. The repair is the plural family, ⛔ never a
 * retreat to the old predicate.
 *
 * ## What is a CONTROL here and what is evidence
 *
 * `TWO LANES` is the control: it is unchanged by this card and it is what makes
 * the `ONE LANE` reading a fact about the plural form rather than about a probe
 * that reads the wrong node. `ZERO LANES` is a second control for the same
 * reason — English takes the plural at zero, so it too must be unchanged.
 * ⇒ Only the `ONE LANE` row is evidence of this repair.
 *
 * ## ⚠️ The provider-LESS path is deliberately pinned as it is, not as we want it
 *
 * `KanbanImpl` binds `createSafeTranslation`, whose `fallbackT` resolves
 * `defaults[key]` literally and NEVER appends a plural suffix — the mechanism
 * `packages/plugin-detail/src/useDetailTranslation.ts` records for
 * `detail.showEmptyRelated` (objectui#3863). With no `I18nProvider` mounted the
 * inline `defaultValue` answers and one lane still reads "1 columns". That is
 * unchanged by this card, is no worse than before it, and belongs to
 * objectui#3865's family rather than to this one. It is pinned below so the
 * boundary of this repair is legible instead of assumed — ⭐ if a later card
 * teaches `fallbackT` plural lookup, that pin SHOULD go red and be updated to
 * "1 column"; it is not a statement that the fallback is right.
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
const THREE_LANES = [...TWO_LANES, { id: 'done', title: 'Done' }];

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
 * `I18nProvider`, which is the path the console takes and the only path on which
 * a plural family can resolve at all; `null` mounts none, which is the
 * `fallbackT` path pinned at the bottom of this file.
 */
function renderEmptyBoard(schema: Record<string, unknown>, language: string | null) {
  const find = vi.fn(() => Promise.resolve({ data: [], total: 0 }));
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
  // Non-empty rather than "contains No cards": the title is the pack's, so an
  // English needle here would make every non-`en` leg fail as a rig failure
  // instead of as the reading it is. The exact text is asserted by the caller.
  const painted = await pumpUntil(() => announcement().trim().length > 0);
  expect(painted, 'RIG SELF-CHECK: the live region must have painted before it is read').toBe(true);
  return announcement();
}

afterEach(cleanup);

describe('objectui#9170 — the live region agrees with its own lane count (en, through the provider)', () => {
  it('ZERO LANES — ⛔ CONTROL, unchanged: English takes the plural at zero', async () => {
    const { find } = renderEmptyBoard({ type: 'object-kanban' }, 'en');
    expect(await settledAnnouncement(find)).toBe('No cards0 columns');
  });

  it('ONE LANE — ⭐ THE REPAIR: "1 column", where this branch used to say "1 columns"', async () => {
    const { find } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: ONE_LANE },
      'en',
    );
    const text = await settledAnnouncement(find);
    expect(text).toBe('No cards1 column');
    // Stated the other way round too, so the defect is named rather than merely
    // absent: this is the exact string objectui#9170 was filed on.
    expect(text, 'the bare plural is back at one lane').not.toBe('No cards1 columns');
  });

  it('TWO LANES — ⛔ CONTROL, unchanged: this is what makes the ONE row a reading', async () => {
    const { find } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: TWO_LANES },
      'en',
    );
    expect(await settledAnnouncement(find)).toBe('No cards2 columns');
  });
});

describe('objectui#9170 — the family lands IN LANGUAGE, not through an English fallback', () => {
  // ⭐ `ru` is where the shape decision is visible. Its BASE key is not its
  // `_other` form: the base is the slot every CLDR category a pack does not
  // enumerate lands on, and a kanban board's everyday 2-4 lanes are exactly
  // `ru`'s `few`. Spelling the base as the numeral form ("{{count}} колонок")
  // renders "3 колонок" — a genitive plural after a numeral that governs the
  // genitive singular — and a `_few` key cannot be added because `en` lacks it
  // and `all-locales-key-parity` fails a key `en` lacks by design.
  it('ONE LANE in ru resolves the singular', async () => {
    const { find } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: ONE_LANE },
      'ru',
    );
    expect(await settledAnnouncement(find)).toBe('Нет карточек1 колонка');
  });

  it('THREE LANES in ru lands on the category-neutral base, not on English', async () => {
    const { find } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: THREE_LANES },
      'ru',
    );
    const text = await settledAnnouncement(find);
    expect(text).toBe('Нет карточекКолонок: 3');
    expect(text, 'ru fell through fallbackLng to English at `few`').not.toContain('columns');
  });
});

describe('objectui#9170 — ⚠️ the provider-LESS path is objectui#3865/#3863 territory, pinned as-is', () => {
  it('one lane without a provider still reads "1 columns" — fallbackT cannot pluralise', async () => {
    // ⛔ NOT evidence of this repair, and ⛔ not a claim that this is correct.
    // `createSafeTranslation`'s `fallbackT` resolves `defaults[key]` literally and
    // never appends a plural suffix, so the inline `defaultValue` answers whole.
    // This is byte-for-byte what the branch already did before objectui#9170, so
    // the repair costs this path nothing; it simply does not reach it.
    const { find } = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: ONE_LANE },
      null,
    );
    expect(await settledAnnouncement(find)).toBe('No cards1 columns');
  });

  it('…and the inline default is byte-identical to the en pack base, so the two paths agree above 1', async () => {
    // The equivalence objectui#3546 slice seven established for this key, still
    // true: at any count the family does not special-case, both paths say the
    // same thing. Two lanes is that count.
    const withProvider = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: TWO_LANES },
      'en',
    );
    expect(await settledAnnouncement(withProvider.find)).toBe('No cards2 columns');
    cleanup();
    const without = renderEmptyBoard(
      { type: 'object-kanban', groupBy: 'status', columns: TWO_LANES },
      null,
    );
    expect(await settledAnnouncement(without.find)).toBe('No cards2 columns');
  });
});
