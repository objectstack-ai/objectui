/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `record:history` REFUSES a row cap the contract rejects, and falls back to
 * its own default — it does not repair one (objectui#10005).
 *
 * `@objectstack/spec` declares this block's member a POSITIVE INTEGER:
 * `RecordHistoryProps.limit` is `z.number().int().positive().optional()`,
 * described there as "Maximum history entries displayed, and the `$top` of the
 * self-fetch query (renderer default: 50)". So a negative and a fractional cap
 * are not spellings this renderer may interpret; they are values the contract
 * refuses.
 *
 * Before this pin the derivation was `Number(...) || 50` with a
 * `Math.max(1, limit)` at the wire. `||` caught `0`, `NaN` and `''`, but a
 * negative is TRUTHY and survived it — `Math.max` then REPAIRED `-5` into a
 * one-row window, and forwarded a fractional `2.5` untouched as `$top`. Both
 * reached the adapter with no cause named anywhere.
 *
 * ⭐ Why this file exists at all: the sibling `record:activity` answers the
 * same question through `normalizeLimit` and its answer IS pinned
 * (`recordActivityFeed.test.ts`, `normalizeLimit(0)` / `(-3)` / `(undefined)` /
 * `('lots')`). `record:history`'s was pinned by nothing, which is why only this
 * one rotted. This pin therefore covers the sibling's whole value set PLUS the
 * two it does not cover: a NON-INTEGER, and the pass-through control.
 *
 * ⛔ The assertions read the `$top` that reaches `DataSource.find()`, not an
 * exported helper: a normalizer that refuses correctly is defeated by a
 * `Math.max(1, …)` re-appearing at the call site, and only the wire sees both.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { RecordContextProvider } from '@object-ui/react';
import { RecordHistoryRenderer } from '../record-history';

/**
 * Spelled here rather than imported so this pin fails if the renderer's default
 * MOVES. `record:history` defaults to 50 and `record:activity` to 20; they
 * differ deliberately and objectui#10005 is not where they get unified.
 */
const RENDERER_DEFAULT = 50;

/** The `$top` the self-fetch put on the wire for one authored node. */
async function topFor(schema: Record<string, unknown>): Promise<unknown> {
  const dataSource = { find: vi.fn(async () => ({ data: [], total: 0 })) } as any;
  render(
    <RecordContextProvider
      objectName="crm_account"
      recordId="rec-alpha"
      data={{ id: 'rec-alpha', name: 'Alpha' }}
      dataSource={dataSource}
    >
      <RecordHistoryRenderer schema={schema as any} />
    </RecordContextProvider>,
  );
  await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
  return (dataSource.find.mock.calls[0][1] as any).$top;
}

beforeEach(() => {
  cleanup();
});

describe('record:history — a refused row cap falls back, it is not repaired (objectui#10005)', () => {
  it('refuses a NEGATIVE cap — ⛔ not a one-row window', async () => {
    const top = await topFor({ limit: -5 });
    expect(top).toBe(RENDERER_DEFAULT);
    // The defect's exact signature, named so a re-introduced `Math.max(1, …)`
    // cannot pass this file by agreeing with it.
    expect(top).not.toBe(1);
  });

  it('refuses a NON-INTEGER cap — ⛔ not a fractional `$top`, ⛔ not a floor', async () => {
    const top = await topFor({ limit: 2.5 });
    expect(top).toBe(RENDERER_DEFAULT);
    expect(top).not.toBe(2.5);
    expect(Number.isInteger(top)).toBe(true);
  });

  it('refuses `0`', async () => {
    expect(await topFor({ limit: 0 })).toBe(RENDERER_DEFAULT);
  });

  it('refuses a NaN cap', async () => {
    expect(await topFor({ limit: Number.NaN })).toBe(RENDERER_DEFAULT);
  });

  it('refuses a non-numeric string', async () => {
    expect(await topFor({ limit: 'lots' })).toBe(RENDERER_DEFAULT);
  });

  it('an ABSENT cap is not a refusal — it is the renderer default', async () => {
    expect(await topFor({})).toBe(RENDERER_DEFAULT);
  });

  it('CONTROL — a usable cap passes through UNCHANGED', async () => {
    // The card's own control row: if this one moves, the harness is wrong
    // rather than the renderer.
    expect(await topFor({ limit: 10 })).toBe(10);
  });

  it('CONTROL — a numeric string still resolves, as it does on the sibling', async () => {
    // `normalizeLimit('5')` is pinned to `5` on `record:activity`; this
    // refusal narrows what is admitted to the contract's value set, it does
    // not change how a node's value is read.
    expect(await topFor({ limit: '5' })).toBe(5);
  });

  it('the `properties` read point answers identically — refused', async () => {
    expect(await topFor({ properties: { limit: -5 } })).toBe(RENDERER_DEFAULT);
  });

  it('the `properties` read point answers identically — honoured', async () => {
    expect(await topFor({ properties: { limit: 7 } })).toBe(7);
  });
});

describe('record:history — the refusal is SILENT, matching its sibling (objectui#10005)', () => {
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
   * MEASURED on this harness: rendering the timeline emits an unrelated
   * `react-i18next` `NO_I18NEXT_INSTANCE` warning, and whether it lands inside
   * this spy's window depends on which OTHER tests in the file ran first — so a
   * blanket assertion pins test ORDER, not this renderer's silence, and goes red
   * for anyone who runs this one test alone. The filter is kept wide enough that
   * a real diagnostic cannot slip through it: any message naming the authored
   * value, `limit`, a row cap, or this renderer counts.
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
      return /limit|row cap|record:history|RecordHistory|-5/i.test(text);
    });
  }

  /**
   * ⭐ This is a DECISION recorded as a pin, not an inevitability. The sibling
   * this card was told to match — `normalizeLimit` in `recordActivityFeed` —
   * refuses in silence, so this renderer does too. The three read points
   * objectui#9925 repaired (`object-kanban`, `object-timeline`,
   * `record:reference_rail`) refuse LOUDLY instead, so the family currently
   * holds two answers on loudness. Whoever rules that question changes this
   * pin deliberately rather than discovering the silence by accident.
   */
  it('names nothing on the developer channel when it refuses', async () => {
    expect(await topFor({ limit: -5 })).toBe(RENDERER_DEFAULT);
    expect(rowCapDiagnostics(warn)).toEqual([]);
    expect(rowCapDiagnostics(error)).toEqual([]);
  });
});
