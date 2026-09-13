/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The drill "escape hatch" and the empty bucket — the THIRD consumer of
 * `buildDatasetDrillFilter`, measured for objectui#9085.
 *
 * `buildDatasetDrillFilter`'s output has three consumers. Two of them
 * (`ObjectDataTable`, and the report drill's `SchemaRenderer` path, which wraps
 * the filter in an `$and`) lower it through `convertFiltersToAST`, where
 * objectui#9085's `{ $null: true }` becomes `['field','is_null',true]` and the
 * empty bucket selects its own rows. This is the third: the host's
 * `openRecordList`, which does NOT go through that converter — it serializes
 * the same object into `filter[...]` URL params for the bare data surface.
 *
 * ## The measured boundary, recorded rather than closed
 *
 * ⚠️ This dialect has NO spelling for is-null. Its whole operator vocabulary is
 * equality plus four range bounds (`URL_FILTER_OPS` / `RANGE_OP_PARAM` name
 * them), so there is no param shape that carries "this dimension is empty" and
 * no suffix `parseUrlFilterTriples` would read back as one. An empty-bucket
 * drill escalated to the list page has therefore ALWAYS landed on a superset,
 * and it still does.
 *
 * ⇒ objectui#9085 changes NOTHING here, and that is the claim these assertions
 * exist to hold: the new spelling produces the byte-identical query string the
 * bare `null` produced, so the escape hatch neither improves nor regresses.
 * Closing it needs a URL-dialect operator on BOTH the write and the read side
 * (plus a chip rendering for it), which is a separate card — ⛔ not folded in
 * here, where it would be an unpinned new URL contract riding along with a
 * one-expression producer fix.
 */

import { describe, it, expect } from 'vitest';
import { buildDatasetDrillFilter } from '@object-ui/core';
import {
  serializeDrillFilterParams,
  parseUrlFilterTriples,
  URL_FILTER_OPS,
  RANGE_OP_PARAM,
} from './drillUrlFilters';

const DIMENSION_FIELDS = { stage: 'stage', owner: 'owner' };

/** What the producer wrote BEFORE objectui#9085 — the shape being replaced. */
const PREVIOUS_EMPTY_SPELLING = null;

describe('drill escape hatch vs the empty bucket (objectui#9085)', () => {
  it('the URL dialect has no is-null operator at all', () => {
    // Stated as the two exported maps rather than as prose, so the day someone
    // adds one, this assertion is where the claim above stops being true.
    expect(Object.keys(URL_FILTER_OPS)).toEqual(['gte', 'lte', 'gt', 'lt']);
    expect(Object.keys(RANGE_OP_PARAM)).toEqual(['$gte', '$lte', '$gt', '$lt']);
  });

  it('the new spelling serializes byte-identically to the bare null it replaced', () => {
    const now = buildDatasetDrillFilter({ stage: 'won', owner: '' }, ['stage', 'owner'], DIMENSION_FIELDS);
    const before = { stage: 'won', owner: PREVIOUS_EMPTY_SPELLING };

    expect(now).toEqual({ stage: 'won', owner: { $null: true } });
    expect(serializeDrillFilterParams(now).toString())
      .toBe(serializeDrillFilterParams(before).toString());
    // And the surviving condition is the NON-empty one, which is what makes
    // this a superset rather than an empty list.
    expect(parseUrlFilterTriples(new URLSearchParams(serializeDrillFilterParams(now).toString())))
      .toEqual([['stage', '=', 'won']]);
  });

  it('an empty-bucket-only drill serializes to nothing, before and after', () => {
    const now = buildDatasetDrillFilter({ owner: '' }, ['owner'], DIMENSION_FIELDS);
    expect(serializeDrillFilterParams(now).toString()).toBe('');
    expect(serializeDrillFilterParams({ owner: PREVIOUS_EMPTY_SPELLING }).toString()).toBe('');
  });

  it('CONTROL: a NON-empty drill still reaches the URL, so an empty result set above is the boundary and not a broken serializer', () => {
    const composed = buildDatasetDrillFilter({ owner: 'alice' }, ['owner'], DIMENSION_FIELDS);
    expect(serializeDrillFilterParams(composed).toString()).toBe('filter%5Bowner%5D=alice');
  });

  it('CONTROL: a date-bucket RANGE drill still reaches the URL', () => {
    const composed = buildDatasetDrillFilter({}, [], {}, undefined, {
      closed: { field: 'closed_at', gte: '2026-01-01', lt: '2026-04-01' },
    });
    expect(parseUrlFilterTriples(new URLSearchParams(serializeDrillFilterParams(composed).toString())))
      .toEqual([
        ['closed_at', '>=', '2026-01-01'],
        ['closed_at', '<', '2026-04-01'],
      ]);
  });
});
