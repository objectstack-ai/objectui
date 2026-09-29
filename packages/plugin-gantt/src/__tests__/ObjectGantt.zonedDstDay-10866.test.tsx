/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10866, slice 5 — a chart with a business `timeZone` reads and
 * writes a stored date-only day as that day on a DST change.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * `GanttView` re-bases every `Date` it is handed through `makeTzShift(zone).to`
 * and hands every emitted change back through `.from`. `ObjectGantt` handed a
 * day in as `.from` of its local midnight and wrote a dropped `date` field as
 * the day `.to` of the emitted date fell on. Each of `.to` and `.from` reads
 * the two zones' offsets at the instant it is handed, so the round trip is
 * exact only while both readings agree. On a DST day of one zone and not the
 * other they did not: an `America/Los_Angeles` viewer of an
 * `America/New_York` chart saw a stored `2026-03-08` drawn from 23:00 on March
 * 7th, and a drop onto March 8th wrote `2026-03-07`; `2026-11-01` was drawn
 * from 01:00. A `Europe/Berlin` viewer of the same chart saw `2026-03-29`, the
 * European change, drawn from 23:00 on March 28th. An `Asia/Shanghai` viewer
 * keeps no DST and New York's own change never met a Shanghai midnight, so
 * those rows are the control and passed before the repair.
 *
 * `ObjectGantt` now inverts the shim exactly for a day: it hands the view the
 * instant `.to` maps onto the day's local midnight, and writes the day of the
 * display date `.from` was handed (`invertTo` / `invertFrom` in `../tzShift`).
 * A `datetime` value still goes through the shim unchanged: the control rows
 * hold its instant to the millisecond.
 *
 * ── ⚠️ The zone cases run ONLY when driven, in a FORKS child ────────────────
 * `process.env.TZ` written inside a test of the normal run does not move the
 * zone (the root config runs `pool: 'threads'`), so the zone cases are
 * skipped there and `scripts/__tests__/date-only-zone-pins-10183.test.ts`
 * runs them on the forks pool and fails unless every one ran and passed. Each
 * zone opens with a rig case, so a child whose zone did not move reds instead
 * of going quietly green.
 *
 * `GanttView` is mocked to a probe that hands back the props `ObjectGantt`
 * gives it, the pattern of `ObjectGantt.dateOnlyZone-10866.test.tsx`.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import type { DataSource } from '@object-ui/types';
import type { GanttTask, GanttViewProps } from '../GanttView';
import { makeTzShift } from '../tzShift';

const probe = vi.hoisted(() => ({ view: null as GanttViewProps | null }));

vi.mock('../GanttView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../GanttView')>();
  return {
    ...actual,
    GanttView: (props: GanttViewProps) => {
      probe.view = props;
      return <div data-testid="gantt-view">{props.tasks.length}</div>;
    },
  };
});

// Imported after the mock is declared (vitest hoists `vi.mock` anyway).
import { ObjectGantt } from '../ObjectGantt';

const DRIVEN = process.env.OBJECTUI_DATE_ZONE_CHILD === '1';

/** The chart's business zone: springs forward at 07:00Z on March 8th, 2026. */
const CHART = 'America/New_York';
/** Springs forward at 10:00Z on March 8th and falls back at 09:00Z on November 1st, 2026. */
const WEST = 'America/Los_Angeles';
/** Springs forward at 01:00Z on March 29th, 2026. */
const EUROPE = 'Europe/Berlin';
/** No DST — the control. */
const EAST = 'Asia/Shanghai';

const OBJECT_SCHEMA = {
  fields: {
    name: { type: 'text' },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    plan_start: { type: 'date' },
    plan_end: { type: 'date' },
    begins_at: { type: 'datetime' },
    ends_at: { type: 'datetime' },
  },
};

afterEach(() => {
  cleanup();
  probe.view = null;
});

function enter(zone: string): void {
  process.env.TZ = zone;
}

/** Local calendar parts of a `Date`: year, month (1-based), day, hour. */
const parts = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()];

interface Mounted {
  update: ReturnType<typeof vi.fn>;
  /** The task the view was last handed. */
  task: GanttTask;
}

/** A `date` row by default; `datetime` binds `begins_at` / `ends_at`. */
async function mount(row: Record<string, unknown>, kind: 'date' | 'datetime' = 'date'): Promise<Mounted> {
  const ds = {
    find: vi.fn().mockResolvedValue({ data: [{ id: 't1', name: 'Build', ...row }] }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue(OBJECT_SCHEMA),
  };
  const gantt =
    kind === 'date'
      ? {
          titleField: 'name',
          startDateField: 'start_date',
          endDateField: 'end_date',
          baselineStartField: 'plan_start',
          baselineEndField: 'plan_end',
        }
      : { titleField: 'name', startDateField: 'begins_at', endDateField: 'ends_at' };
  const schema = {
    type: 'gantt',
    gantt: { ...gantt, timeZone: CHART },
    data: { provider: 'object', object: 'task' },
  } as unknown as React.ComponentProps<typeof ObjectGantt>['schema'];
  render(<ObjectGantt schema={schema} dataSource={ds as unknown as DataSource} />);
  await waitFor(() => expect(probe.view?.tasks?.length).toBe(1));
  // The object-schema fetch re-arms the loader once; wait for the call volume
  // to go quiet, as `ObjectGantt.readback.test.tsx` does, so the write
  // handler below is the one that has read the field types.
  let calls = ds.find.mock.calls.length;
  await waitFor(() => {
    const now = ds.find.mock.calls.length;
    if (now !== calls) {
      calls = now;
      throw new Error('still loading');
    }
  });
  return { update: ds.update, task: probe.view!.tasks[0] };
}

/** Drive the view's LATEST write callback and hand back the patch it produced. */
async function written(m: Mounted, changes: Partial<Pick<GanttTask, 'start' | 'end'>>): Promise<Record<string, unknown>> {
  probe.view!.onTaskUpdate!(probe.view!.tasks[0], changes);
  await waitFor(() => expect(m.update).toHaveBeenCalledTimes(1));
  return m.update.mock.calls[0][2] as Record<string, unknown>;
}

/** Where `GanttView` draws a `Date` it is handed: re-based into the chart zone. */
const drawn = (d: Date) => parts(makeTzShift(CHART).to(d));
/** `2026-03-08` → local midnight of that day, where a day stands in the view's display space. */
const midnight = (day: string) => {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d);
};
/** What `GanttView` hands back for a drop onto a day: its display midnight, re-based out. */
const dropOn = (day: string) => makeTzShift(CHART).from(midnight(day));

/**
 * The day cases for one viewer zone: March 8th, New York's change, and
 * November 1st, its change back, plus `extra`. Each day is read, then dropped
 * onto.
 */
function dayCases(zone: string, extra: string) {
  it('rig: the zone really moved', () => {
    enter(zone);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zone);
  });

  const days = ['2026-03-08', '2026-11-01', extra];
  it.each(days)('`%s` is drawn from that day\'s midnight, baselines too', async (day) => {
    enter(zone);
    const m = await mount({ start_date: day, end_date: day, plan_start: day, plan_end: day });
    const want = parts(midnight(day));
    expect(want[3]).toBe(0);
    expect(drawn(m.task.start)).toEqual(want);
    expect(drawn(m.task.end)).toEqual(want);
    expect(drawn(m.task.baselineStart!)).toEqual(want);
    expect(drawn(m.task.baselineEnd!)).toEqual(want);
  });

  it.each(days)('a drop onto `%s` writes that day', async (day) => {
    enter(zone);
    const m = await mount({ start_date: '2026-06-01', end_date: '2026-06-02' });
    expect(await written(m, { start: dropOn(day), end: dropOn(day) })).toEqual({ start_date: day, end_date: day });
  });

  it('control: a `datetime` row keeps its instant both ways, across the change', async () => {
    enter(zone);
    // 00:00 in New York on March 8th, then 00:00 on the 9th: the change lies between.
    const begins = '2026-03-08T05:00:00.000Z';
    const moved = '2026-03-09T04:00:00.000Z';
    const m = await mount({ begins_at: begins, ends_at: moved }, 'datetime');
    expect(m.task.start.getTime()).toBe(Date.parse(begins));
    expect(m.task.end.getTime()).toBe(Date.parse(moved));
    expect(await written(m, { start: new Date(moved) })).toEqual({ begins_at: moved });
  });
}

describe.runIf(DRIVEN)(`ObjectGantt zoned ${CHART}, viewed from ${WEST} (objectui#10866)`, () => {
  it('fixture validity: the shim round trip of March 8th\'s midnight is 23:00 on the 7th here', () => {
    enter(WEST);
    const shift = makeTzShift(CHART);
    expect(parts(shift.to(shift.from(new Date(2026, 2, 8))))).toEqual([2026, 3, 7, 23]);
  });

  // November 1st is also this viewer's own change; March 9th is a plain day.
  dayCases(WEST, '2026-03-09');
});

describe.runIf(DRIVEN)(`ObjectGantt zoned ${CHART}, viewed from ${EUROPE} (objectui#10866)`, () => {
  it('fixture validity: the chart zone\'s own midnight is drawn at 23:00 on the day before here', () => {
    enter(EUROPE);
    // Why a day is not handed in as the chart zone's midnight: `.to` of New
    // York's midnight on March 29th reads Berlin's offset before its change.
    expect(parts(makeTzShift(CHART).to(new Date('2026-03-29T04:00:00.000Z')))).toEqual([2026, 3, 28, 23]);
  });

  // March 29th is this viewer's own change.
  dayCases(EUROPE, '2026-03-29');
});

describe.runIf(DRIVEN)(`ObjectGantt zoned ${CHART}, viewed from ${EAST}, the control (objectui#10866)`, () => {
  dayCases(EAST, '2026-03-09');
});
