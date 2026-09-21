/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9050 step 2 — `ObjectGrid` renders a malformed-filter state that
 * NAMES the operator, for BOTH of its entries into the lowering, and queries
 * nothing.
 *
 * ## The two entries are not the same case, and that is measured
 *
 *   - `schema.filter` is read in a RENDER-time `useMemo`. Before this card a
 *     refusal there threw out of render: contained by `SchemaErrorBoundary`
 *     when the grid was schema-rendered, and escaping to the host when it was
 *     not — `apps/console/src/dev/DevRowActions.tsx` mounts `<ObjectGrid>`
 *     directly today, and `plugin-grid` carries zero non-test `ErrorBoundary`
 *     hits of its own.
 *   - `schema.defaultFilters` is read INSIDE the load effect, already wrapped
 *     by that effect's own `try`. It never threw out of render, and it never
 *     will — what it did was report an authoring mistake under the heading
 *     "Error loading grid", over the converter's English paragraph. So the
 *     assertion for that leg is about the DIAGNOSIS, not about containment: a
 *     pin that only asked "did the page survive" would have been green before
 *     this card on that leg.
 *
 * Both legs land on one render branch, which is why one `data-testid` covers
 * them: it is one sentence about one authored value.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ObjectGrid } from '../ObjectGrid';

function makeDataSource() {
  return {
    find: vi.fn(async () => ({ data: [], total: 0 })),
    getObjectSchema: vi.fn(async () => ({
      name: 'invoice',
      fields: { tags: { type: 'text', label: 'Tags' }, amount: { type: 'number', label: 'Amount' } },
    })),
  } as any;
}

const COLUMNS = [{ accessorKey: 'amount', header: 'Amount' }];

let ds: any;
beforeEach(() => {
  ds = makeDataSource();
});

describe('objectui#9050 — ObjectGrid names a refused filter', () => {
  it('schema.filter: renders the named state instead of throwing out of render', async () => {
    render(
      <ObjectGrid
        schema={{
          type: 'object-grid',
          objectName: 'invoice',
          columns: COLUMNS,
          // A stored view rule the converter refuses: `equals` is
          // single-valued (objectui#8557).
          filter: [{ field: 'tags', operator: 'equals', value: ['a', 'b'] }],
        } as any}
        dataSource={ds}
      />,
    );

    const alert = await screen.findByTestId('grid-malformed-filter');
    expect(alert.textContent).toContain('equals');
    expect(alert.textContent).toMatch(/filter is malformed/i);
    // Nothing was asked of the data layer — the refusal is not "no filter".
    await waitFor(() => expect(ds.find).not.toHaveBeenCalled());
  });

  it('defaultFilters: the load-path refusal is diagnosed, not reported as a load failure', async () => {
    render(
      <ObjectGrid
        schema={{
          type: 'object-grid',
          objectName: 'invoice',
          columns: COLUMNS,
          // `filter` absent on purpose — that is the only way this deprecated
          // leg is read at all.
          defaultFilters: { note: { $regex: 'a.c' } },
        } as any}
        dataSource={ds}
      />,
    );

    const alert = await screen.findByTestId('grid-malformed-filter');
    expect(alert.textContent).toContain('$regex');
    // The half that was NOT green before this card. The generic load heading is
    // what this path used to show, and it names nothing an author can act on.
    expect(document.body.textContent).not.toMatch(/error loading grid/i);
  });

  it('positive control — a well-formed filter still queries and shows no refusal', async () => {
    render(
      <ObjectGrid
        schema={{
          type: 'object-grid',
          objectName: 'invoice',
          columns: COLUMNS,
          filter: [{ field: 'tags', operator: 'equals', value: 'a' }],
        } as any}
        dataSource={ds}
      />,
    );
    await waitFor(() => expect(ds.find).toHaveBeenCalled());
    expect(screen.queryByTestId('grid-malformed-filter')).toBeNull();
  });
});
