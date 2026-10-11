/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12081 item 2 — a calendar view hosted by a list view draws every
 * record in the window it shows, not the first 100 of the object.
 *
 * Measured on `objectstack-ai/hotclm#87` (17.7.0): the Console's calendar over
 * `clm_contract` sent `GET …?top=100&select=…,end_date` with no date window, so
 * with 122 contracts up to 22 were never drawn, and the only signal was this
 * view's "Showing first 100 records" note. The 100 is this component's ONE
 * unpaged fetch (`DEFAULT_LIST_FETCH_BATCH_SIZE`), handed to the calendar as
 * `data`.
 *
 * The direction (triage, objectui#12081 comment 6093502833): fetch the visible
 * date window, filtered on the calendar's date field, and page through it;
 * ⛔ no bigger cap. The fetch batch stays 100 (objectui#9853, ruling
 * 5824040487), and the walk stops at the platform ceiling with its loud
 * footnote (objectui#7210, ruling a′).
 *
 * ## Test-source note
 *
 * `plugin-calendar` is not a dependency of `plugin-list`, so the calendar here
 * is a registry stub that records what this view hands it and can report a
 * visible range through the `onVisibleRangeChange` host callback, the way the
 * real `ObjectCalendar` does. The records live in a `ValueDataSource`, which
 * evaluates `$filter`, `$skip` and `$top` the way a backend does, so a window
 * that is not sent cannot select the right rows by accident. The real calendar
 * under the real list is pinned one package over, in
 * `packages/app-shell/src/__tests__/listCalendarDateWindow-12081.test.tsx`.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PaginationConfigSchema } from '@objectstack/spec/ui';
import { ComponentRegistry, NON_GRID_ROW_CEILING, ValueDataSource } from '@object-ui/core';
import { SchemaRendererProvider } from '@object-ui/react';
import { ListView } from '../ListView';

/** The unpaged views' fetch batch (objectui#9853): the step every request takes. */
const FETCH_BATCH = 100;

/** "Today" for every case here: the calendar opens on October 2026. */
const NOW = new Date(2026, 9, 14, 10, 0, 0);

type Row = Record<string, unknown>;

/** `count` contracts ending on days of `month` (0-based) in 2026, at most four a day. */
function contractsIn(month: number, count: number, prefix: string): Row[] {
  const days = new Date(2026, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => {
    const day = (i % days) + 1;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return { id: `${prefix}-${i}`, name: `${prefix} ${i}`, end_date: `2026-${mm}-${dd}`, status: 'active' };
  });
}

let lastCalendarProps: any = null;
let lastGridProps: any = null;
let lastKanbanProps: any = null;

const STUBBED = ['object-calendar', 'object-grid', 'object-kanban'] as const;
const previous = new Map<string, unknown>();
beforeAll(() => {
  for (const type of STUBBED) {
    previous.set(type, ComponentRegistry.get(type));
    ComponentRegistry.register(type, (props: any) => {
      if (type === 'object-calendar') lastCalendarProps = props;
      if (type === 'object-grid') lastGridProps = props;
      if (type === 'object-kanban') lastKanbanProps = props;
      return <div data-testid={`${type}-stub`} />;
    });
  }
});
afterAll(() => {
  for (const type of STUBBED) {
    const prev = previous.get(type);
    if (prev) ComponentRegistry.register(type, prev as any);
    else ComponentRegistry.unregister(type);
  }
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  lastCalendarProps = null;
  lastGridProps = null;
  lastKanbanProps = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** A data source over `rows` that records every query it was asked. */
function makeDataSource(rows: Row[]) {
  const store = new ValueDataSource<Row>({ items: rows });
  const calls: Array<Record<string, any>> = [];
  return {
    calls,
    find: vi.fn(async (object: string, params: any) => {
      calls.push(params);
      return store.find(object, params);
    }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: async (name: string) => ({
      name,
      fields: {
        id: { type: 'text' },
        name: { type: 'text' },
        end_date: { type: 'date' },
        start_date: { type: 'date' },
        status: { type: 'select', options: [{ label: 'Active', value: 'active' }] },
      },
    }),
  } as any;
}

const CALENDAR_VIEW = {
  viewType: 'calendar',
  calendar: { startDateField: 'end_date', titleField: 'name' },
};

const renderList = (schemaExtra: Record<string, unknown>, ds: any) =>
  render(
    <SchemaRendererProvider dataSource={ds}>
      <ListView
        schema={{
          type: 'list-view',
          objectName: 'clm_contract',
          columns: ['name', 'status'],
          ...schemaExtra,
        } as any}
        dataSource={ds}
      />
    </SchemaRendererProvider>,
  );

/** The ids the calendar was last handed. */
const handedIds = (): string[] => ((lastCalendarProps?.data ?? []) as Row[]).map((r) => String(r.id));

describe('ListView — a hosted calendar is handed every record of its visible window (objectui#12081 item 2)', () => {
  it('(a) a visible month holding more than one fetch batch hands the calendar every record in it', async () => {
    // 122 in October (the hotclm count), with 40 in September and 40 in
    // November around them. The month cannot be drawn from one batch.
    const october = contractsIn(9, 122, 'oct');
    const rows = [...contractsIn(8, 40, 'sep'), ...october, ...contractsIn(10, 40, 'nov')];
    const ds = makeDataSource(rows);
    renderList(CALENDAR_VIEW, ds);

    await waitFor(() => {
      for (const r of october) expect(handedIds()).toContain(r.id);
    });
    // Paged in fetch-batch steps: no request asks for more than the batch.
    for (const params of ds.calls) expect(params.$top).toBeLessThanOrEqual(FETCH_BATCH);
    // …and paged through, not capped: the walk took more than one step.
    expect(ds.calls.length).toBeGreaterThan(1);
  });
});
