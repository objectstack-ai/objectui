/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The MEMBERS of `object-grid.grouping`, pinned at what the RENDERER reads
 * (objectui#8071 slice 17).
 *
 * The registration declares an `object` arm and describes the WHOLE key in one
 * sentence — "Group rows by one or more fields into collapsible sections" —
 * while `GroupingConfigSchema` is `strict` over one member, `fields`, whose
 * entries are `strict` over THREE: `field`, `order`, `collapsed`. All three are
 * read, and the two the sentence elides decide what the reader sees first.
 *
 * PRIOR ART, stated rather than credited: `groupingProjection-7179` pins that a
 * grouping field reaches `$select`, `groupingNullEntry-7217` pins that a `null`
 * hole does not take the grid down, `groupedBooleanLabel` pins the Yes/No
 * fallback, `groupedPagination` and `groupedPartialDisclosure-7189` pin the
 * paging around groups. None of them states the member set, and none says what
 * `order` or `collapsed` do.
 *
 * ⭐ **`grouping` and `columns` ARE NOT DISJOINT, and this file is where that
 * shows.** `groupValueFormatter` derives the group-header labels from
 * `schema.grouping` AND `schema.columns` in one memo: the column override for a
 * grouped field decides how its value is SPELLED in the header. Slice 16
 * measured the four `object-grid` keys as separable and recorded exactly this
 * qualification; the two cases below are it, in behaviour.
 *
 * ⚠️ **One of those two reads a member `ListColumnSchema` REFUSES.** The memo
 * reads `columns[].options`, which is not among `ListColumn`'s fourteen
 * declared members — a strict object, so an author who writes it is refused at
 * publish with `unrecognized_keys` while this renderer honours it. That is the
 * `declared != enforced` split AGENTS.md #0.1 exists to stop, and it is the
 * same family objectui#6458 retired from `generateColumns()`'s cell branch;
 * `columnReadBoundary-6458` bounds THAT branch to the empty set and this memo
 * is outside it. ⛔ It is pinned below AS BEHAVIOUR and reported as a finding —
 * ⛔ not repaired here, because the repair is a retirement decision with its own
 * authors measurement, not a member pin.
 *
 * ⛔ What a declaration can never publish:
 *
 *   - **`order` sorts the group HEADERS by their rendered LABEL, not by the
 *     stored value.** So the same member produces a different order once a
 *     column override renames the values it sorts.
 *   - **`collapsed` is a DEFAULT, not a state.** It decides what an untouched
 *     group looks like, and the first click inverts that default rather than
 *     setting it.
 *   - **An unusable entry is DROPPED, not coerced and not fatal** — and the
 *     entries the grid groups by are exactly the entries the projection asks
 *     the server for, which is what keeps a grouped field from arriving
 *     `undefined` on every row.
 *
 * DIRECTION, predicted before running: every row below is RED against the
 * plausible "simplification" of the read site it covers, and green as written.
 * The per-pin ablation is recorded in the PR body.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SchemaRenderer, SchemaRendererProvider, ActionProvider } from '@object-ui/react';

import { ObjectGrid } from '../ObjectGrid';
// Registers `object-grid` and its `view:grid` alias, for the `SchemaRenderer`
// leg below.
import '../index';
import { registerAllFields } from '@object-ui/fields';

registerAllFields();

const ROWS = [
  { id: '1', name: 'Ada', stage: 'won', flag: 'true' },
  { id: '2', name: 'Grace', stage: 'lost', flag: 'false' },
  { id: '3', name: 'Alan', stage: 'won', flag: 'false' },
];

/** Render a grouped `object-grid` over inline rows — no host, no dataSource. */
function renderGrouped(
  grouping: unknown,
  columns: unknown[] = [{ field: 'name', label: 'Name' }],
) {
  return render(
    <ActionProvider>
      <ObjectGrid
        schema={{
          type: 'object-grid',
          data: { provider: 'value', items: ROWS },
          columns,
          grouping,
        } as any}
      />
    </ActionProvider>,
  );
}

/** Every group header label, in render order. */
const groupLabels = (): string[] =>
  Array.from(document.querySelectorAll('.group-label')).map((el) => (el.textContent ?? '').trim());

/** The toggle button of the group whose label is `label`. */
function groupToggle(label: string): HTMLElement {
  const pill = Array.from(document.querySelectorAll('.group-label')).find(
    (el) => (el.textContent ?? '').trim() === label,
  );
  expect(pill, `group \`${label}\``).toBeDefined();
  const button = pill!.closest('button');
  expect(button, `toggle of group \`${label}\``).not.toBeNull();
  return button as HTMLElement;
}

const settled = async () => {
  await waitFor(() => expect(groupLabels().length).toBeGreaterThan(0));
};

function makeAdapter() {
  return {
    find: vi.fn().mockResolvedValue({ data: ROWS, total: ROWS.length }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({
      name: 'account',
      fields: {
        id: { type: 'text' },
        name: { type: 'text' },
        stage: { type: 'text' },
      },
    }),
  };
}

/** Render through a dataSource and hand back the params of the first `find`. */
async function findParamsFor(schema: Record<string, unknown>) {
  const adapter = makeAdapter();
  render(
    <SchemaRendererProvider dataSource={adapter as any}>
      <SchemaRenderer schema={schema as any} />
    </SchemaRendererProvider>,
  );
  await waitFor(() => expect(adapter.find).toHaveBeenCalled());
  return (adapter.find.mock.calls[0] as [string, any])[1];
}

afterEach(() => {
  cleanup();
});

describe('object-grid `grouping.fields[]` members (objectui#8071)', () => {
  it('LIT CONTROL: `field` alone groups the rows, one header per distinct value', async () => {
    // The non-vacuity row for everything below: if grouping stopped happening,
    // every "member X changes the grouping" assertion would pass on an empty
    // list of labels.
    renderGrouped({ fields: [{ field: 'stage' }] });
    await settled();
    expect(groupLabels()).toEqual(['lost', 'won']);
  });

  it('`order: "desc"` reverses the header order — and its absence is `asc`', async () => {
    renderGrouped({ fields: [{ field: 'stage', order: 'desc' }] });
    await settled();
    expect(groupLabels()).toEqual(['won', 'lost']);
    cleanup();
    renderGrouped({ fields: [{ field: 'stage', order: 'asc' }] });
    await settled();
    expect(groupLabels()).toEqual(['lost', 'won']);
  });

  it('`collapsed: true` is the DEFAULT state, and the first click inverts it', async () => {
    renderGrouped({ fields: [{ field: 'stage', collapsed: true }] });
    await settled();
    expect(groupToggle('won').getAttribute('aria-expanded')).toBe('false');
    // The rows of a collapsed group are not on screen at all.
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();

    fireEvent.click(groupToggle('won'));
    expect(groupToggle('won').getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());

    cleanup();
    // Control: the same grouping without the member starts expanded.
    renderGrouped({ fields: [{ field: 'stage' }] });
    await settled();
    expect(groupToggle('won').getAttribute('aria-expanded')).toBe('true');
  });

  it('`fields` is ORDERED — a second entry nests inside the first', async () => {
    renderGrouped({ fields: [{ field: 'stage' }, { field: 'flag' }] });
    await settled();
    // `lost` holds one row (`false`), `won` holds two (`false`, `true`), and
    // the nesting order is the array order: stage outside, flag inside. Each
    // level sorts on its OWN entry's `order`, which is why the inner pair reads
    // ascending inside a `won` that came second.
    expect(groupLabels()).toEqual(['lost', 'false', 'won', 'false', 'true']);
  });

  it('an entry with no usable `field` is DROPPED, never coerced and never fatal', async () => {
    // A `null` hole, a bare string (the natural shorthand the spec's strict
    // object refuses) and an empty name — none of the three names a field, and
    // the usable entry beside them still groups.
    renderGrouped({ fields: [null, 'stage', { field: '   ' }, { field: 'stage' }] } as any);
    await settled();
    expect(groupLabels()).toEqual(['lost', 'won']);
  });
});

describe('object-grid `grouping` reaches the QUERY, not just the screen (objectui#8071)', () => {
  it('unions a grouped field the columns never mention into `$select`', async () => {
    const params = await findParamsFor({
      type: 'object-grid',
      objectName: 'account',
      columns: [{ field: 'name' }],
      grouping: { fields: [{ field: 'stage' }] },
    });
    // Without this the server never returns `stage`, `useGroupedData` reads
    // `undefined` on every row, and ONE `(empty)` group holds every record —
    // a plausible, wrong statement about the data (objectui#7179).
    expect(params.$select).toEqual(['id', 'name', 'stage']);
  });

  it('asks for exactly the entries it groups by — an unusable one is in neither set', async () => {
    const params = await findParamsFor({
      type: 'object-grid',
      objectName: 'account',
      columns: [{ field: 'name' }],
      grouping: { fields: [{ order: 'desc' }, { field: 'stage' }] },
    });
    expect(params.$select).toEqual(['id', 'name', 'stage']);
    expect(JSON.stringify(params.$select)).not.toContain('undefined');
  });
});

describe('object-grid `grouping` × `columns` — the SHARED memo (objectui#8071)', () => {
  it('`columns[].type` decides how a grouped value is SPELLED in the header', async () => {
    // `flag` holds the strings `"true"` / `"false"`, so nothing about the VALUE
    // makes it a boolean. The column override is what does.
    renderGrouped({ fields: [{ field: 'flag' }] }, [{ field: 'flag', label: 'Flag' }]);
    await settled();
    expect(groupLabels()).toEqual(['false', 'true']);
    cleanup();
    renderGrouped({ fields: [{ field: 'flag' }] }, [
      { field: 'flag', label: 'Flag', type: 'boolean' },
    ]);
    await settled();
    expect(groupLabels()).toEqual(['No', 'Yes']);
  });

  it('⚠️ an UNDECLARED `columns[].options` decides the header label too — pinned as behaviour', async () => {
    // `options` is NOT a member of `ListColumnSchema`, which is strict: an
    // author who writes it is refused at publish. This memo reads it anyway,
    // and the header is where it shows. Pinned as the behaviour that is there,
    // reported as a finding, ⛔ not repaired here.
    renderGrouped({ fields: [{ field: 'stage' }] }, [
      {
        field: 'stage',
        label: 'Stage',
        options: [
          { value: 'won', label: 'Closed Won' },
          { value: 'lost', label: 'Closed Lost' },
        ],
      },
    ]);
    await settled();
    expect(groupLabels()).toEqual(['Closed Lost', 'Closed Won']);
    cleanup();
    // The control that makes the row above a reading of the MEMBER rather than
    // of the values: the same grouping, the same column, no `options`.
    renderGrouped({ fields: [{ field: 'stage' }] }, [{ field: 'stage', label: 'Stage' }]);
    await settled();
    expect(groupLabels()).toEqual(['lost', 'won']);
  });

  it('`order` sorts the RENDERED labels, so a column override moves the groups', async () => {
    // `lost` < `won` on the stored values; `Closed Won` < `Zeta` on the
    // rendered ones. Same `order: 'asc'`, different order — which is only
    // visible because the two members are read in one memo.
    renderGrouped({ fields: [{ field: 'stage', order: 'asc' }] }, [
      {
        field: 'stage',
        label: 'Stage',
        options: [
          { value: 'won', label: 'Closed Won' },
          { value: 'lost', label: 'Zeta' },
        ],
      },
    ]);
    await settled();
    expect(groupLabels()).toEqual(['Closed Won', 'Zeta']);
  });
});
