/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `record:activity` REFUSES a NON-INTEGER row cap — it does not FLOOR one
 * (objectui#10096).
 *
 * `@objectstack/spec` declares the member a POSITIVE INTEGER:
 * `RecordActivityProps.limit` is `z.number().int().positive().default(20)`,
 * described there as "Number of items to load per page". So a fractional cap is
 * not a spelling this renderer may interpret; it is a value the contract
 * REFUSES — `RecordActivityProps.safeParse({ limit: 2.5 })` answers
 * `invalid_type` / "expected int, received number".
 *
 * Before this pin `normalizeLimit` read `Math.floor(Number(value))` and then
 * admitted anything `Number.isFinite` and positive — so an authored `2.5` was
 * REPAIRED into a two-row window and handed back as a result. The author asked
 * for something the contract rejects, got a silently different number, and no
 * channel named it.
 *
 * ## ⭐ Why the block already pinned four values and still rotted
 *
 * The existing set in `recordActivityFeed.test.ts` ("coerces `limit` to a
 * positive integer, defaulting to the spec default") is `0`, `-3`, `undefined`
 * and `'lots'` — and it contains NO non-integer. Every one of those four is
 * zero-or-negative-or-NaN after the floor, so all four reach the default on the
 * DEFECT and on the FIX alike: they cannot fail in either direction. The one
 * input that discriminates is the one nobody pinned. That is what this file
 * adds, and it is the whole reason this card exists.
 *
 * ## The assertions read the WIRE as well as the helper
 *
 * A normalizer that refuses correctly is defeated by a `Math.max(1, …)` or a
 * second floor re-appearing downstream, and only the `$top` that reaches
 * `DataSource.find()` sees both. The sibling `record:history` pin
 * (`record-history.rowLimitRefusal-10005.test.tsx`) reads its wire for the same
 * reason.
 *
 * ## ⛔ Three things this file deliberately does NOT change
 *
 * - The DEFAULT stays 20. `record:history` defaults to 50; they differ on
 *   purpose and unifying them is a product decision reserved elsewhere.
 * - Numeric-STRING coercion stays. `normalizeLimit('5')` is still `5`; what
 *   narrows is the admitted value SET, not how a node's value is read. Pinned
 *   below as a control.
 * - The refusal stays SILENT, matching the sibling it was told to match.
 *   Whether this family should warn instead is an open decision on its own
 *   card; the silence is pinned here so whoever rules it changes this file
 *   deliberately rather than discovering the answer by accident.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { RecordContextProvider } from '@object-ui/react';
import type { FeedItem } from '@object-ui/types';
import { RecordActivityRenderer } from '../record-activity';
import {
  applyFeedConfig,
  normalizeLimit,
  DEFAULT_ACTIVITY_LIMIT,
} from '../recordActivityFeed';

/**
 * Spelled here rather than imported so this pin fails if the renderer's default
 * MOVES. `record:activity` defaults to 20 and `record:history` to 50; they
 * differ deliberately and objectui#10096 is not where they get unified.
 */
const RENDERER_DEFAULT = 20;

/** Six comments, oldest first — enough rows that a two-row window is visible. */
const SIX: FeedItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `c${i + 1}`,
  type: 'comment',
  actor: 'Ada',
  createdAt: `2026-01-0${i + 1}T00:00:00.000Z`,
})) as FeedItem[];

/** The `$top` the self-fetch put on the wire for one authored node. */
async function topFor(schema: Record<string, unknown>): Promise<unknown> {
  const dataSource = { find: vi.fn().mockResolvedValue({ data: [] }) } as any;
  render(
    <RecordContextProvider
      objectName="crm_account"
      recordId="rec-alpha"
      data={{ id: 'rec-alpha', name: 'Alpha' }}
      dataSource={dataSource}
    >
      <RecordActivityRenderer schema={schema as any} />
    </RecordContextProvider>,
  );
  await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
  return (dataSource.find.mock.calls[0][1] as any).$top;
}

beforeEach(() => {
  cleanup();
});

describe('record:activity — a NON-INTEGER row cap is refused, not floored (objectui#10096)', () => {
  it('the renderer default still agrees with the spec default', () => {
    expect(DEFAULT_ACTIVITY_LIMIT).toBe(RENDERER_DEFAULT);
  });

  it('refuses a fractional cap — ⛔ not a floor', () => {
    expect(normalizeLimit(2.5)).toBe(RENDERER_DEFAULT);
    // The defect's exact signature, named so a re-introduced floor cannot pass
    // this file by agreeing with it.
    expect(normalizeLimit(2.5)).not.toBe(2);
    expect(normalizeLimit(19.9)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(19.9)).not.toBe(19);
  });

  it('refuses a fractional cap written as a numeric STRING, having read it', () => {
    // The string is still READ as a number — that is the coercion this card
    // keeps. What refuses it is the value it reads to, which the contract
    // rejects exactly as it rejects the bare `2.5`.
    expect(normalizeLimit('2.5')).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit('2.5')).not.toBe(2);
  });

  it('CONTROL — a usable cap still passes through UNCHANGED', () => {
    expect(normalizeLimit(5)).toBe(5);
    expect(normalizeLimit(1)).toBe(1);
  });

  it('CONTROL — numeric-string coercion is UNCHANGED', () => {
    // objectui#10093 kept this deliberately on the sibling; the narrowing is of
    // the admitted value set, ⛔ not of how a node's value is read.
    expect(normalizeLimit('5')).toBe(5);
    expect(normalizeLimit(' 7 ')).toBe(7);
  });

  it('the four values that were ALREADY pinned still answer the default', () => {
    // ⚠️ Restated here to record what they are worth, not to add coverage:
    // every one of them answers the default on the DEFECT and on the FIX, so
    // as a set they cannot tell the two apart. They are controls for this
    // file's non-integer cases, never a substitute for them.
    expect(normalizeLimit(0)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(-3)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(undefined)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit('lots')).toBe(RENDERER_DEFAULT);
  });

  it('swapping the finiteness test for an integer test keeps NaN and Infinity refused', () => {
    // `Number.isInteger` is false for both, so the values the old
    // `Number.isFinite` arm refused are refused by the new one too — the
    // narrowing only removes the fractional admissions.
    expect(normalizeLimit(Number.NaN)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(Number.POSITIVE_INFINITY)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(Number.NEGATIVE_INFINITY)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit(null)).toBe(RENDERER_DEFAULT);
    expect(normalizeLimit({})).toBe(RENDERER_DEFAULT);
  });
});

describe('record:activity — the refusal reaches the WIRE, not just the helper (objectui#10096)', () => {
  it('a fractional cap never becomes a fractional or floored `$top`', async () => {
    const top = await topFor({ limit: 2.5 });
    // One row past the window, so "Load more" can be offered honestly.
    expect(top).toBe(RENDERER_DEFAULT + 1);
    expect(top).not.toBe(3); // floor(2.5) = 2, +1 — the defect's answer
    expect(Number.isInteger(top)).toBe(true);
  });

  it('CONTROL — an absent cap is not a refusal, it is the renderer default', async () => {
    expect(await topFor({})).toBe(RENDERER_DEFAULT + 1);
  });

  it('CONTROL — a usable cap still reaches the wire unchanged', async () => {
    expect(await topFor({ limit: 10 })).toBe(11);
  });

  it('CONTROL — a numeric string still resolves at the wire', async () => {
    expect(await topFor({ limit: '5' })).toBe(6);
  });

  it('the `properties` read point answers identically', async () => {
    expect(await topFor({ properties: { limit: 2.5 } })).toBe(RENDERER_DEFAULT + 1);
    expect(await topFor({ properties: { limit: 10 } })).toBe(11);
  });
});

/**
 * ⭐ The card's THIRD site, settled here rather than left unmentioned.
 *
 * `applyFeedConfig` ends its pipeline on
 * `Math.max(1, Math.floor(pageSize) || DEFAULT_ACTIVITY_LIMIT)` — the same
 * `Math.max(1, …)` expression objectui#10093 removed from `record:history`. It
 * is NOT the same defect, and the reading that makes it an internal clamp is
 * this: `pageSize` is not an authored member. It is the paging WINDOW, and both
 * call sites compute it the same way — `record-activity.tsx` and
 * `record-chatter.tsx` each hold `const pageSize = limit * (extraPages + 1)`,
 * where `limit` is already `normalizeLimit(...)`'s answer and `extraPages` is a
 * `React.useState(0)` whose only writer is `setExtraPages((n) => n + 1)`.
 * `applyFeedConfig` is exported from this module but NOT from the package
 * barrel, so those two are the whole production population.
 *
 * ⇒ a positive integer times a positive integer: every value that can reach the
 * clamp is already a positive integer, on which `Math.floor` is the identity,
 * `|| DEFAULT_ACTIVITY_LIMIT` never fires, and `Math.max(1, …)` never lifts.
 * There is no refused authored value for it to repair, which is precisely what
 * `Math.max(1, limit)` was doing on the sibling — there it sat between an
 * UNNORMALIZED author value and the wire.
 *
 * ⚠️ That reading rests on `normalizeLimit` returning an INTEGER. The first
 * test below is the one that ties the two sites together: it goes red if the
 * resolver ever starts handing a fraction downstream again, because then the
 * clamp's floor — not the resolver — would be the thing deciding the window.
 */
describe('applyFeedConfig — its `pageSize` clamp is an internal clamp, settled (objectui#10096)', () => {
  it('a refused cap widens the window to the default rather than narrowing it', () => {
    // The composed statement: resolver AND clamp, in the call shape both
    // renderers use on every render.
    const applied = applyFeedConfig(SIX, {}, normalizeLimit(2.5) * 1);
    expect(applied.items).toHaveLength(6);
    expect(applied.hasMore).toBe(false);
    // The defect's answer was a two-row page with "Load more" still offered.
    expect(applied.items).not.toHaveLength(2);
  });

  it('the clamp is the IDENTITY on every window the two call sites can produce', () => {
    for (const authored of [5, '5', 2.5, '2.5', 0, -3, undefined, 'lots', 1, 19.9]) {
      const limit = normalizeLimit(authored);
      for (const pages of [1, 2, 3]) {
        const pageSize = limit * pages; // verbatim the call sites' expression
        expect(Number.isInteger(pageSize)).toBe(true);
        expect(pageSize).toBeGreaterThanOrEqual(1);
        // No floor to apply, no `||` arm to fire, nothing for `Math.max` to
        // lift: the window is exactly the page size, capped by what exists.
        expect(applyFeedConfig(SIX, {}, pageSize).items).toHaveLength(
          Math.min(SIX.length, pageSize),
        );
      }
    }
  });
});

describe('record:activity — the refusal is SILENT, matching its sibling (objectui#10096)', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanup();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    error.mockRestore();
  });

  /**
   * Calls on a developer channel that are ABOUT this renderer's row cap.
   *
   * ⚠️ Deliberately a FILTER rather than a blanket `not.toHaveBeenCalled()`.
   * This tree emits unrelated developer-channel noise while a timeline renders
   * (a `react-i18next` instance warning among it), and whether any given one
   * lands inside this spy's window depends on which OTHER tests ran first — so
   * a blanket assertion pins test ORDER rather than this renderer's silence,
   * and goes red for anyone who runs one test alone. The filter is kept wide
   * enough that a real diagnostic cannot slip through it: any message naming
   * the authored value, `limit`, a row cap, or this renderer counts.
   */
  function rowCapDiagnostics(spy: ReturnType<typeof vi.spyOn>): unknown[][] {
    return (spy.mock.calls as unknown[][]).filter((args) => {
      const text = args
        .map((a) => {
          if (typeof a === 'string') return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ');
      return /limit|row cap|record:activity|RecordActivity|2\.5/i.test(text);
    });
  }

  /**
   * ⭐ A DECISION recorded as a pin, not an inevitability. The sibling this
   * card was told to match — `normalizeHistoryLimit` on `record:history` —
   * refuses in silence, so this resolver does too. Three further read points
   * (`object-kanban`, `object-timeline`, `record:reference_rail`) refuse
   * LOUDLY instead, so the family currently holds two answers on loudness.
   * Whoever rules that question changes this pin deliberately.
   */
  it('names nothing on the developer channel when it refuses', () => {
    expect(normalizeLimit(2.5)).toBe(RENDERER_DEFAULT);
    expect(rowCapDiagnostics(warn)).toEqual([]);
    expect(rowCapDiagnostics(error)).toEqual([]);
  });
});
