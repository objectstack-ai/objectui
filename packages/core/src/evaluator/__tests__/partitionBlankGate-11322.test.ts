/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11322 — `partitionRowsByPredicate` asks the repo's one "is a gate
 * declared?" definition, `hasDeclaredPredicate`, instead of a test of its own.
 *
 * The fold used to open with `pred == null || pred === ''`. A whitespace-only
 * predicate, or an envelope whose `source` is blank, therefore counted as
 * DECLARED, was evaluated, failed closed for every record and left nothing
 * eligible — which is how the grid's selection bar hid a bulk action that the
 * row menu and the toolbars of the same grid show.
 *
 * ## What each row pins
 *
 *   - The premise: the definition answers "not declared" for both blank
 *     spellings and "declared" for a boolean. If that stops being true, the
 *     fold's answer moves with it, which is the point of asking it.
 *   - The verdict: every row comes back BY REFERENCE with `skipped: 0`, the
 *     fold's documented "not declared" answer, not merely an equal array.
 *   - The diagnosis: a blank is still said, once (ADR-0137 D4), read by the
 *     `[blank]` tag and never by its prose.
 *   - The controls: no key and `''` were already "not declared"; `false` is a
 *     declared gate that excludes everything; a real predicate partitions.
 *
 * ## Fresh module graph per case
 *
 * The one-time blank report dedupes on MODULE state and the `unit` project runs
 * with `isolate: false`, so a spelling another file already reported would read
 * as silence here. `vi.resetModules()` + fresh imports give every case its own
 * dedupe — the shape `blankGateDiagnosed-11262.test.ts` uses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let partitionRowsByPredicate: typeof import('../listConditional.js').partitionRowsByPredicate;
let hasDeclaredPredicate: typeof import('../declaredPredicate.js').hasDeclaredPredicate;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  vi.resetModules();
  ({ partitionRowsByPredicate } = await import('../listConditional.js'));
  ({ hasDeclaredPredicate } = await import('../declaredPredicate.js'));
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

const blankLines = (): string[] =>
  warn.mock.calls.map((call: unknown[]) => String(call[0])).filter((w: string) => w.includes('[blank]'));

const ROWS = [
  { id: 'r1', done: false },
  { id: 'r2', done: true },
  { id: 'r3', done: false },
];

/** The blank shapes the selection bar used to read as a declared gate. */
const BLANKS = [
  ['a whitespace-only string', '   '],
  ['an envelope whose `source` is whitespace', { dialect: 'cel', source: '   ' }],
  ['an envelope whose `source` is empty', { dialect: 'cel', source: '' }],
] as const;

describe('partitionRowsByPredicate asks the one "declared?" definition (objectui#11322)', () => {
  it('the premise: blank text in either spelling is not declared, a boolean is', () => {
    expect(hasDeclaredPredicate('   ')).toBe(false);
    expect(hasDeclaredPredicate({ dialect: 'cel', source: '   ' })).toBe(false);
    expect(hasDeclaredPredicate(false)).toBe(true);
    expect(hasDeclaredPredicate(true)).toBe(true);
  });

  it.each(BLANKS)('%s: returns every row, by reference', (_label, pred) => {
    const { eligible, skipped } = partitionRowsByPredicate(pred as never, ROWS);
    expect(eligible).toBe(ROWS);
    expect(skipped).toBe(0);
  });

  it.each(BLANKS)('%s: is said once, not answered in silence (ADR-0137 D4)', (_label, pred) => {
    partitionRowsByPredicate(pred as never, ROWS);
    partitionRowsByPredicate(pred as never, ROWS);
    expect(blankLines()).toHaveLength(1);
  });

  describe('controls', () => {
    it('no predicate: every row, by reference, and nothing to report', () => {
      expect(partitionRowsByPredicate(undefined, ROWS)).toEqual({ eligible: ROWS, skipped: 0 });
      expect(partitionRowsByPredicate(undefined, ROWS).eligible).toBe(ROWS);
      expect(partitionRowsByPredicate(null, ROWS).eligible).toBe(ROWS);
      expect(blankLines()).toHaveLength(0);
    });

    it("`''`: every row, by reference, as before", () => {
      const { eligible, skipped } = partitionRowsByPredicate('', ROWS);
      expect(eligible).toBe(ROWS);
      expect(skipped).toBe(0);
    });

    it('`false` is a declared gate: no row qualifies', () => {
      expect(partitionRowsByPredicate(false, ROWS)).toEqual({ eligible: [], skipped: ROWS.length });
    });

    it('`true` is a declared gate that admits every row, by reference', () => {
      expect(partitionRowsByPredicate(true, ROWS).eligible).toBe(ROWS);
    });

    it('a real predicate still partitions per record', () => {
      const { eligible, skipped } = partitionRowsByPredicate('record.done', ROWS);
      expect(eligible.map((r) => r.id)).toEqual(['r2']);
      expect(skipped).toBe(2);
    });
  });
});
