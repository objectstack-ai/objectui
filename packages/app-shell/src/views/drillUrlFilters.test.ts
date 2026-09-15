/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import {
  parseUrlFilterTriples,
  serializeDrillFilterParams,
  deleteFieldFilterParams,
  groupFilterChips,
  type FilterTriple,
} from './drillUrlFilters';

const parse = (qs: string) => parseUrlFilterTriples(new URLSearchParams(qs));

describe('parseUrlFilterTriples', () => {
  it('parses the equality shorthand', () => {
    expect(parse('filter[status]=open')).toEqual([['status', '=', 'open']]);
  });

  it('parses range/comparison operators into ObjectQL ops', () => {
    expect(parse('filter[close_date][gte]=2026-04-01&filter[close_date][lt]=2026-07-01')).toEqual([
      ['close_date', '>=', '2026-04-01'],
      ['close_date', '<', '2026-07-01'],
    ]);
  });

  it('keeps relationship-path field names intact', () => {
    expect(parse('filter[account.region]=NA')).toEqual([['account.region', '=', 'NA']]);
  });

  it('ignores an unknown operator (never downgrades it to equality)', () => {
    expect(parse('filter[x][bogus]=1')).toEqual([]);
  });

  it('skips empty values', () => {
    expect(parse('filter[status]=')).toEqual([]);
  });
});

describe('serializeDrillFilterParams', () => {
  it('serializes an equality value', () => {
    expect(serializeDrillFilterParams({ status: 'open' }).toString()).toBe('filter%5Bstatus%5D=open');
  });

  it('serializes an ObjectQL range operator object to gte/lt params', () => {
    const qs = serializeDrillFilterParams({ close_date: { $gte: '2026-04-01', $lt: '2026-07-01' } });
    expect(qs.get('filter[close_date][gte]')).toBe('2026-04-01');
    expect(qs.get('filter[close_date][lt]')).toBe('2026-07-01');
  });

  it('skips null/undefined and never stringifies an unknown object to "[object Object]"', () => {
    const qs = serializeDrillFilterParams({ a: null, b: undefined, weird: { nope: 1 } });
    expect(qs.toString()).toBe('');
  });
});

describe('serializeDrillFilterParams — a COMPOSED drill filter (objectui#8944)', () => {
  /**
   * `composeDrillFilter` lowers `widget.filter ∧ click context` to
   * `{ $and: […] }` whenever both sources survive. Before this branch existed
   * that value fell to the `String(value)` path — `$and` holds an ARRAY, so it
   * was neither null nor a non-array object — and produced a bogus
   * `filter[$and]=[object Object],[object Object]` while BOTH real conditions
   * vanished, i.e. the list landed scoped by nothing the user clicked.
   */
  it('flattens a top-level $and into the params of each child', () => {
    const qs = serializeDrillFilterParams({ $and: [{ region: 'emea' }, { stage: 'won' }] });
    expect(qs.get('filter[region]')).toBe('emea');
    expect(qs.get('filter[stage]')).toBe('won');
    // The hazard, named: no key spells the combinator, and nothing stringified.
    expect(qs.get('filter[$and]')).toBeNull();
    expect(qs.toString()).not.toContain('object%20Object');
  });

  it('walks a NESTED $and, which is what composing an array arm produces', () => {
    // `[['stage','=','won'],['amount','>',100]]` conjoined with a click context
    // lowers to an $and whose first child is itself an $and.
    const qs = serializeDrillFilterParams({
      $and: [{ $and: [{ stage: 'won' }, { amount: { $gt: 100 } }] }, { region: 'emea' }],
    });
    expect(qs.get('filter[stage]')).toBe('won');
    expect(qs.get('filter[amount][gt]')).toBe('100');
    expect(qs.get('filter[region]')).toBe('emea');
  });

  it('a composed filter survives the URL round-trip as a conjunction of triples', () => {
    // The read side ANDs its triples, so the conjunction is preserved in
    // meaning, not just in bytes.
    const triples = parseUrlFilterTriples(
      serializeDrillFilterParams({
        $and: [{ region: 'emea' }, { close_date: { $gte: '2026-06-01', $lt: '2026-07-01' } }],
      }),
    );
    expect(triples).toEqual<FilterTriple[]>([
      ['region', '=', 'emea'],
      ['close_date', '>=', '2026-06-01'],
      ['close_date', '<', '2026-07-01'],
    ]);
  });

  it('skips a bare ARRAY comparand rather than stringifying it', () => {
    // The same promise the unknown-object case makes, for the shape that used
    // to escape it.
    expect(serializeDrillFilterParams({ tags: ['a', 'b'] }).toString()).toBe('');
  });
});

describe('round-trip: serialize → parse (write and read sides agree)', () => {
  it('a mixed equality + date-range drill filter survives the URL round-trip', () => {
    const filter = { stage: 'qualification', close_date: { $gte: '2026-06-01', $lt: '2026-07-01' } };
    const triples = parseUrlFilterTriples(serializeDrillFilterParams(filter));
    expect(triples).toEqual<FilterTriple[]>([
      ['stage', '=', 'qualification'],
      ['close_date', '>=', '2026-06-01'],
      ['close_date', '<', '2026-07-01'],
    ]);
  });
});

describe('deleteFieldFilterParams', () => {
  it('removes the equality AND both range-bound params for a field, leaving others', () => {
    const params = new URLSearchParams(
      'filter[close_date][gte]=2026-06-01&filter[close_date][lt]=2026-07-01&filter[stage]=qualification',
    );
    deleteFieldFilterParams(params, 'close_date');
    expect(params.toString()).toBe('filter%5Bstage%5D=qualification');
  });
});

describe('groupFilterChips', () => {
  it('collapses a date range into a single from → to chip', () => {
    expect(
      groupFilterChips([
        ['close_date', '>=', '2026-04-01'],
        ['close_date', '<', '2026-07-01'],
      ]),
    ).toEqual([{ field: 'close_date', text: '2026-04-01 → 2026-07-01' }]);
  });

  it('renders an equality chip and preserves field order', () => {
    expect(
      groupFilterChips([
        ['stage', '=', 'qualification'],
        ['close_date', '>=', '2026-04-01'],
        ['close_date', '<', '2026-07-01'],
      ]),
    ).toEqual([
      { field: 'stage', text: '= qualification' },
      { field: 'close_date', text: '2026-04-01 → 2026-07-01' },
    ]);
  });
});

/**
 * The is-null operator (objectui#9159) — the one member of this vocabulary
 * whose URL value is a FLAG rather than a comparand.
 *
 * The escape-hatch defect it closes is pinned end to end, through the real
 * `openRecordList`, in `drillEmptyBucketEscapeHatch-9159.test.tsx`; these are
 * the module's own write/read/chip/delete obligations for it.
 */
describe('the is-null operator: `filter[<field>][null]=true`', () => {
  it('writes the flag for the `{ $null: true }` an empty-bucket drill produces', () => {
    const qs = serializeDrillFilterParams({ owner: { $null: true } });
    expect(qs.get('filter[owner][null]')).toBe('true');
  });

  it('reads the flag back as an is-null triple', () => {
    expect(parse('filter[owner][null]=true')).toEqual([['owner', 'is_null', true]]);
  });

  it('survives the round-trip beside an equality condition', () => {
    const filter = { stage: 'won', owner: { $null: true } };
    expect(parseUrlFilterTriples(serializeDrillFilterParams(filter))).toEqual<FilterTriple[]>([
      ['stage', '=', 'won'],
      ['owner', 'is_null', true],
    ]);
  });

  it('carries the flag alongside range bounds on the same field, as the AST converter does', () => {
    // `convertFiltersToAST` emits BOTH conditions for this object, so the URL
    // dialect emits both params rather than picking a winner.
    const qs = serializeDrillFilterParams({ score: { $null: true, $gte: '5' } });
    expect(parseUrlFilterTriples(qs)).toEqual<FilterTriple[]>([
      ['score', 'is_null', true],
      ['score', '>=', '5'],
    ]);
  });

  it('drops `{ $null: false }` — this dialect has no "is not null" to write it to', () => {
    // Degrading to a superset is the posture this module already takes for an
    // operator it cannot spell; inventing the inverse operator on the read side
    // would be a second, unpinned contract.
    expect(serializeDrillFilterParams({ owner: { $null: false } }).toString()).toBe('');
  });

  it('drops `[null]=false` on the read side instead of inventing an operator', () => {
    expect(parse('filter[owner][null]=false')).toEqual([]);
    // Not an equality against the string "false" either — that is the "wrong
    // answer wearing a right answer's shape" this module refuses elsewhere.
    expect(parse('filter[owner][null]=false').length).toBe(0);
  });

  it('drops an empty flag value, exactly as it drops any empty value', () => {
    expect(parse('filter[owner][null]=')).toEqual([]);
  });

  it('renders a chip that carries the operator KEY instead of `= true` or an English literal', () => {
    // objectui#9159 round 2: the arm used to finish the string as the literal
    // `'is null'`. A user-facing literal in a renderer is unlocalized for every
    // reader on every locale, so the chip now travels as the filter builder's
    // existing operator key and the render site resolves it — pinned against a
    // real non-English render in `ObjectDataPage.filterChipI18n-9159.test.tsx`.
    expect(groupFilterChips([['owner', 'is_null', true]])).toEqual([
      { field: 'owner', textKey: 'filterBuilder.operators.isNull' },
    ]);
    // And it finishes NO text of its own, so nothing can render that bare
    // `true` even if the render site forgot the key.
    expect(groupFilterChips([['owner', 'is_null', true]])[0].text).toBeUndefined();
  });

  it('leaves the range and equality arms finishing their own text, since a comparand is the user\'s own', () => {
    // The CONTROL for the split above: these carry no `textKey`, because there
    // is nothing in them a catalogue could translate.
    expect(groupFilterChips([['stage', '=', 'won']])).toEqual([{ field: 'stage', text: '= won' }]);
    expect(
      groupFilterChips([
        ['close_date', '>=', '2026-04-01'],
        ['close_date', '<', '2026-07-01'],
      ]),
    ).toEqual([{ field: 'close_date', text: '2026-04-01 → 2026-07-01' }]);
  });

  it('removing the chip clears the flag param', () => {
    const params = new URLSearchParams('filter[owner][null]=true&filter[stage]=won');
    deleteFieldFilterParams(params, 'owner');
    expect(params.toString()).toBe('filter%5Bstage%5D=won');
  });
});
