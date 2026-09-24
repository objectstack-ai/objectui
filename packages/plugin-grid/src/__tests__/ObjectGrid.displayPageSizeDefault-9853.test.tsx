/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9853, ruling C-prime — ONE display page size, read from the
 * protocol, and a fetch batch that is a different quantity.
 *
 * Before the ruling this component fell back to three page-size literals: a
 * page of rows in the client-paged table, a page of groups in the grouped
 * view, and a "server window" that sized both the `$top` of every fetch AND the
 * visible page of the server-paged table. The ruling:
 *
 *  1. the fetch batch size is not a page size, and no display path reads it;
 *  2. an undeclared display page size is the default `@objectstack/spec`
 *     declares for `pagination.pageSize`, read from the spec rather than
 *     restated;
 *  3. a declared `pageSize` is honoured as before, and a refused one keeps the
 *     loud warning (pinned row by row in
 *     `ObjectGrid.pageSizeNonPositive-9853.test.tsx`).
 *
 * Every display surface is read OFF THE SCREEN (rows or groups rendered), and
 * the fetch side off the WIRE (`$top` the data source received), so a pin that
 * only compares constants cannot pass for this one.
 *
 * `../ObjectGrid` is imported relatively and the root vitest config aliases
 * `@object-ui/*` to each package's `src`, so no build step stands between an
 * edit and this run.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PaginationConfigSchema } from '@objectstack/spec/ui';

import { ObjectGrid } from '../ObjectGrid';
import { registerAllFields } from '@object-ui/fields';
import { ActionProvider } from '@object-ui/react';

registerAllFields();

/** The protocol's answer, read the way the renderer reads it. */
const SPEC_DISPLAY_DEFAULT: number = PaginationConfigSchema.parse({}).pageSize;

/**
 * The grouped view's fetch batch. Pinned by value because the ruling keeps
 * the value; what matters for the ruling is that it is NOT the display default.
 */
const FETCH_BATCH = 50;

const OBJECT = 'duly_task';
const OBJECT_FIELDS = {
  id: { type: 'text', label: 'Id' },
  subject: { type: 'text', label: 'Subject' },
  unit: { type: 'text', label: 'Unit' },
};

/** More rows than either number, every row its own group. */
const ROW_COUNT = 80;
const ROWS = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: `r-${i}`,
  subject: `Task ${String(i).padStart(3, '0')}`,
  unit: `Unit ${String(i).padStart(3, '0')}`,
}));

const makeDataSource = () => {
  const calls: Array<Record<string, unknown>> = [];
  return {
    calls,
    find: vi.fn(async (_object: string, params: Record<string, unknown>) => {
      calls.push(params);
      const skip = (params.$skip as number | undefined) ?? 0;
      const top = (params.$top as number | undefined) ?? ROWS.length;
      return { data: ROWS.slice(skip, skip + top), total: ROWS.length };
    }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => ({ name: OBJECT, fields: OBJECT_FIELDS })),
  };
};

const renderGrid = (schema: Record<string, unknown>, dataSource?: unknown) =>
  render(
    <ActionProvider>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ObjectGrid schema={schema as any} {...(dataSource ? { dataSource: dataSource as any } : {})} />
    </ActionProvider>,
  );

const fetchedSchema = (extra: Record<string, unknown> = {}) => ({
  type: 'object-grid',
  objectName: OBJECT,
  columns: ['subject'],
  ...extra,
});
const groupedSchema = (extra: Record<string, unknown> = {}) =>
  fetchedSchema({ grouping: { fields: [{ field: 'unit' }] }, ...extra });
const inlineSchema = (extra: Record<string, unknown> = {}) => ({
  type: 'object-grid',
  objectName: OBJECT,
  columns: [{ field: 'subject', label: 'Subject' }],
  data: { provider: 'value', items: ROWS },
  ...extra,
});

const bodyRows = (container: HTMLElement) => Array.from(container.querySelectorAll('tbody tr'));
const groupRows = () => [...document.querySelectorAll('[data-testid^="group-row-"]')];

let warnings: string[] = [];
beforeEach(() => {
  warnings = [];
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const paginationWarnings = () => warnings.filter((w) => w.includes('ObjectGrid pagination'));

describe('ObjectGrid — one display page size from the spec, and a distinct fetch batch (objectui#9853)', () => {
  it('the spec declares a usable display default, and it is not the fetch batch', () => {
    // If a spec upgrade stops declaring the default, this is the row that says
    // so first — the renderer refuses to invent one.
    expect(Number.isInteger(SPEC_DISPLAY_DEFAULT) && SPEC_DISPLAY_DEFAULT > 0).toBe(true);
    expect(FETCH_BATCH).not.toBe(SPEC_DISPLAY_DEFAULT);
  });

  it('every display surface shows the spec default when nothing is declared', async () => {
    // Server-paged table: the page on screen, and the `$top` that fetched it.
    const flatDs = makeDataSource();
    const flat = renderGrid(fetchedSchema(), flatDs);
    await vi.waitFor(() => expect(bodyRows(flat.container).length).toBeGreaterThan(0));
    const serverPaged = bodyRows(flat.container).length;
    const serverTop = flatDs.calls.at(-1)?.$top;
    cleanup();

    // Client-paged table over inline rows.
    const inline = renderGrid(inlineSchema());
    await vi.waitFor(() => expect(bodyRows(inline.container).length).toBeGreaterThan(0));
    const clientPaged = bodyRows(inline.container).length;
    cleanup();

    // Grouped view: a page of groups.
    const groupedDs = makeDataSource();
    renderGrid(groupedSchema(), groupedDs);
    await vi.waitFor(() => expect(groupRows().length).toBeGreaterThan(0));
    const groupsShown = groupRows().length;

    // ONE assertion over the three surfaces, so a surface that keeps a
    // default of its own shows up as the odd one out.
    expect({ serverPaged, serverTop, clientPaged, groupsShown }).toEqual({
      serverPaged: SPEC_DISPLAY_DEFAULT,
      serverTop: SPEC_DISPLAY_DEFAULT,
      clientPaged: SPEC_DISPLAY_DEFAULT,
      groupsShown: SPEC_DISPLAY_DEFAULT,
    });
    expect(paginationWarnings()).toHaveLength(0);
  });

  it('the grouped view FETCHES the batch, which no display path reads', async () => {
    const ds = makeDataSource();
    renderGrid(groupedSchema(), ds);
    await vi.waitFor(() => expect(groupRows().length).toBeGreaterThan(0));
    // The batch left on the wire, and the groups on screen are still a page
    // of the display default — two quantities, two numbers.
    expect(ds.calls.map((p) => p.$top)).toContain(FETCH_BATCH);
    expect(ds.calls.map((p) => p.$top)).not.toContain(SPEC_DISPLAY_DEFAULT);
    expect(groupRows()).toHaveLength(SPEC_DISPLAY_DEFAULT);
  });

  it('the grouped pager\'s size selector shows the size in force', async () => {
    renderGrid(groupedSchema(), makeDataSource());
    await vi.waitFor(() => expect(groupRows().length).toBeGreaterThan(0));
    // The display default is not one of the selector's fixed steps; without
    // the active size merged in, the control would display a size that is not
    // the one on screen.
    const select = document.querySelector('select') as HTMLSelectElement | null;
    expect(select).toBeTruthy();
    expect(select!.value).toBe(String(SPEC_DISPLAY_DEFAULT));
  });

  it('CONTROL — a declared page size is honoured on every surface, and on the grouped fetch as before', async () => {
    const declared = { pagination: { pageSize: 7 } };

    const flatDs = makeDataSource();
    const flat = renderGrid(fetchedSchema(declared), flatDs);
    await vi.waitFor(() => expect(bodyRows(flat.container).length).toBeGreaterThan(0));
    expect(bodyRows(flat.container)).toHaveLength(7);
    expect(flatDs.calls.map((p) => p.$top)).toContain(7);
    cleanup();

    const inline = renderGrid(inlineSchema(declared));
    await vi.waitFor(() => expect(bodyRows(inline.container).length).toBeGreaterThan(0));
    expect(bodyRows(inline.container)).toHaveLength(7);
    cleanup();

    const groupedDs = makeDataSource();
    renderGrid(groupedSchema(declared), groupedDs);
    await vi.waitFor(() => expect(groupRows().length).toBeGreaterThan(0));
    expect(groupRows()).toHaveLength(7);
    expect(groupedDs.calls.map((p) => p.$top)).toContain(7);
    expect(paginationWarnings()).toHaveLength(0);
  });

  it('CONTROL — a refused page size still warns, then falls back to the spec default', async () => {
    const ds = makeDataSource();
    const flat = renderGrid(fetchedSchema({ pagination: { pageSize: 0 } }), ds);
    await vi.waitFor(() => expect(bodyRows(flat.container).length).toBeGreaterThan(0));
    await vi.waitFor(() => expect(paginationWarnings().length).toBeGreaterThan(0));
    expect(bodyRows(flat.container)).toHaveLength(SPEC_DISPLAY_DEFAULT);
    expect(ds.calls.map((p) => p.$top)).not.toContain(0);
  });
});
