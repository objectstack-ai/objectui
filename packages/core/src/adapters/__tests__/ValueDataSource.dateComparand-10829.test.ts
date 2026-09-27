/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10829 — `ValueDataSource.find`'s object arm reads a `Date`
 * condition as implicit equality, the way its lowered array answers.
 *
 * ## What was wrong
 *
 * `matchesFilter` sent any object condition that is not an array to its
 * operator branch. A `Date` has no own keys, so the operator loop ran zero
 * times and the field added NO constraint: `{ status: 'a', created: someDate }`
 * answered the same rows as `{ status: 'a' }`, with no console line.
 * `convertFiltersToAST` lowers the same filter to
 * `['and', ['status', '=', 'a'], ['created', '=', someDate]]` (objectui#8555),
 * because `@objectstack/spec`'s `ACCEPTED_FILTER_COMPARAND_TYPES` includes
 * `Date`. One filter, two fates on one face.
 *
 * ## What the repair is (triage 5858941931)
 *
 * The Date takes the simple-equality branch, compared the way the AST arm's
 * `=` compares it, so the object filter answers what its lowered array
 * answers. The gate is the spec's `isAcceptedFilterComparand`, the predicate
 * the converter lowers a Date through.
 *
 * ## What the assertions are
 *
 * - §1 — the object filter and its lowered array answer the same rows, over
 *   one row per stored shape: the same instant as a `Date`, as an ISO string
 *   and as epoch milliseconds, a different instant, and a missing value. The
 *   array answer is read live, never transcribed, so the pin follows the AST
 *   arm. The shared answer is also written down AS-IS; see §1's note.
 * - §2 — an invalid `Date` is lowered by the converter, not refused, and this
 *   face answers what the lowered array answers.
 * - §3 — controls, the same on the base and the head: `{ status: 'a' }`, a
 *   string and a number equality, and the `$` operators on a Date comparand,
 *   which already answered what their AST twins answer.
 *
 * ABLATION — direction predicted BEFORE running, from the committed fix, by
 * removing the `isAcceptedFilterComparand` gate from `matchesFilter`: every
 * case in §1 and §2 goes RED (the base answers every row the siblings allow,
 * with no warning) and every case in §3 stays GREEN.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { QueryParams } from '@object-ui/types';
import { ValueDataSource } from '../ValueDataSource';
import { convertFiltersToAST, toFilterNodeSafely } from '../../utils/filter-converter';

/** The instant the card filters on. */
const INSTANT = new Date(0);

/** A row: an id, a status, and `created` in one of the stored shapes. */
type Row = { id: string; status: string; created?: unknown };

/** One row per stored shape. Every row but `b` has status `'a'`. */
const ROWS: Row[] = [
  { id: 'date', status: 'a', created: new Date(0) },
  { id: 'iso', status: 'a', created: new Date(0).toISOString() },
  { id: 'ms', status: 'a', created: 0 },
  { id: 'other', status: 'a', created: new Date(1000) },
  { id: 'missing', status: 'a' },
  { id: 'b', status: 'b', created: new Date(0) },
];

async function query(filter: unknown, items: Row[] = ROWS) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const ds = new ValueDataSource<Row>({ items });
    const result = await ds.find('rows', { $filter: filter as QueryParams['$filter'] });
    return {
      ids: result.data.map((r) => r.id),
      total: result.total,
      warns: warn.mock.calls.map((c) => String(c[0])),
    };
  } finally {
    warn.mockRestore();
  }
}

/** The lowered array form of an object filter, as `find`'s array arm receives it. */
function lowered(filter: Record<string, unknown>): unknown {
  const result = toFilterNodeSafely(filter);
  if (!result.ok) throw new Error(`the converter refused ${String(Object.keys(filter))}`);
  return result.node;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('objectui#10829 §1 — a Date condition answers what its lowered array answers', () => {
  it('the converter lowers the card filter to an equality on the Date instance', () => {
    const ast = convertFiltersToAST({ status: 'a', created: INSTANT });
    expect(ast).toEqual(['and', ['status', '=', 'a'], ['created', '=', INSTANT]]);
    expect((ast as unknown[][])[2][2]).toBeInstanceOf(Date);
  });

  it('{ status: a, created: Date } answers the lowered array’s rows, not every status-a row', async () => {
    const filter = { status: 'a', created: INSTANT };
    const objectAnswer = await query(filter);
    expect(objectAnswer).toEqual(await query(lowered(filter)));
    // AS-IS, not endorsed: the AST arm's `=` compares a Date by identity, and
    // the constructor clones every row, so no stored shape equals the
    // comparand, not even the same instant held as a Date. That reading is
    // recorded on objectui#10829's PR and not changed here; the live equality
    // above is the pin that follows it if it changes.
    expect(objectAnswer).toEqual({ ids: [], total: 0, warns: [] });
  });

  it('{ created: Date } alone answers the lowered array’s rows, not every row', async () => {
    const filter = { created: INSTANT };
    const objectAnswer = await query(filter);
    expect(objectAnswer).toEqual(await query(lowered(filter)));
    expect(objectAnswer).toEqual({ ids: [], total: 0, warns: [] });
  });

  it.each(ROWS.filter((row) => row.status === 'a').map((row) => [row.id, row] as const))(
    'the %s row alone answers what the lowered array answers',
    async (_id, row) => {
      const filter = { status: 'a', created: INSTANT };
      const objectAnswer = await query(filter, [row]);
      expect(objectAnswer).toEqual(await query(lowered(filter), [row]));
      expect(objectAnswer.warns).toEqual([]);
    },
  );
});

describe('objectui#10829 §2 — an invalid Date is lowered, and answered like its lowered array', () => {
  it('the converter lowers new Date(NaN) rather than refusing it', () => {
    const result = toFilterNodeSafely({ status: 'a', created: new Date(NaN) });
    expect(result.ok).toBe(true);
    const leaf = (result.ok ? (result.node as unknown[][])[2] : [])[2];
    expect(leaf).toBeInstanceOf(Date);
    expect(Number.isNaN((leaf as Date).getTime())).toBe(true);
  });

  it('{ status: a, created: Invalid Date } answers the lowered array’s rows', async () => {
    const filter = { status: 'a', created: new Date(NaN) };
    const objectAnswer = await query(filter);
    expect(objectAnswer).toEqual(await query(lowered(filter)));
    expect(objectAnswer).toEqual({ ids: [], total: 0, warns: [] });
  });
});

describe('objectui#10829 §3 — controls: the same answer on the base and the head', () => {
  it('{ status: a } answers every status-a row', async () => {
    expect(await query({ status: 'a' })).toEqual({
      ids: ['date', 'iso', 'ms', 'other', 'missing'],
      total: 5,
      warns: [],
    });
  });

  it('a string equality matches the ISO row only, on both arms', async () => {
    const filter = { status: 'a', created: new Date(0).toISOString() };
    const objectAnswer = await query(filter);
    expect(objectAnswer).toEqual({ ids: ['iso'], total: 1, warns: [] });
    expect(objectAnswer).toEqual(await query(lowered(filter)));
  });

  it('a number equality matches the epoch-milliseconds row only, on both arms', async () => {
    const filter = { status: 'a', created: 0 };
    const objectAnswer = await query(filter);
    expect(objectAnswer).toEqual({ ids: ['ms'], total: 1, warns: [] });
    expect(objectAnswer).toEqual(await query(lowered(filter)));
  });

  it.each([
    ['$eq', '='],
    ['$ne', '!='],
    ['$gt', '>'],
    ['$gte', '>='],
    ['$lt', '<'],
    ['$lte', '<='],
  ])('{ created: { %s: Date } } answers what its AST twin %s answers', async (dollar, ast) => {
    expect(await query({ created: { [dollar]: INSTANT } }))
      .toEqual(await query(['created', ast, INSTANT]));
  });

  it('{ created: { $in: [Date] } } answers what its AST twin answers', async () => {
    expect(await query({ created: { $in: [INSTANT] } }))
      .toEqual(await query(['created', 'in', [INSTANT]]));
  });
});
