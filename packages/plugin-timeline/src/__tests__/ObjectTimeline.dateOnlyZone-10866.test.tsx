/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10866 — `ObjectTimeline` buckets, orders and dates a stored
 * date-only day as that day, in every zone.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * Three reads of the record's start value, across two files, used the
 * engine's own `Date` parse, which reads a date-only `2026-10-06` as UTC
 * midnight:
 *
 *  - the date bucket (`startOfDay(new Date(raw))`), so west of UTC an item
 *    due today sat under "Overdue" and one due tomorrow under "Today";
 *  - the sort (`new Date(a.startDate).getTime()`), which placed a date-only
 *    day at UTC midnight among instants;
 *  - the renderer's item date (`formatDate`), whose default `short` face read
 *    `10/5/2026` for it.
 *
 * All three now take the shared step, `toDisplayDate` (`@object-ui/core`, the
 * objectui#10183 convention), which tells the two shapes apart by the value:
 * a date-only string is local midnight of the day it names, and a value with
 * a time part keeps its instant. The sort case holds one of each, because
 * only a mix can show the sort and the buckets disagreeing: the vertical
 * renderer groups ADJACENT items, so an order that disagrees with the buckets
 * reads as "Today" above "Earlier" (the past-day bucket, objectui#11676).
 *
 * ── ⚠️ The zone cases run ONLY when driven, in a FORKS child ────────────────
 * `process.env.TZ` written inside a test of the normal run does not move the
 * zone (the root config runs `pool: 'threads'`), so the zone cases are
 * skipped there and `scripts/__tests__/date-only-zone-pins-10183.test.ts`
 * runs them on the forks pool and fails unless every one ran and passed. Each
 * zone opens with a rig case, so a child whose zone did not move reds instead
 * of going quietly green. The suite-zone cases run in the normal run too; they
 * cannot tell the repair from its absence, because UTC is the one offset where
 * the two parses agree.
 *
 * `Asia/Shanghai` is the control: east of UTC the UTC-midnight parse already
 * landed on the named day, and an hour-offset "repair" would break it.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocalizationProvider } from '@object-ui/i18n';
import { ObjectTimeline } from '../ObjectTimeline';

vi.mock('@object-ui/react', async (importOriginal) => {
  const actual = await (importOriginal() as Promise<Record<string, unknown>>);
  return {
    ...actual,
    useDataScope: () => undefined,
    useNavigationOverlay: () => ({
      isOverlay: false,
      handleClick: vi.fn(),
      selectedRecord: null,
      isOpen: false,
      close: vi.fn(),
      setIsOpen: vi.fn(),
      mode: 'overlay',
      view: undefined,
    }),
  };
});

const DRIVEN = process.env.OBJECTUI_DATE_ZONE_CHILD === '1';

/** UTC-7 in October — the card's direction. */
const WEST = 'America/Los_Angeles';
/** UTC+8 — the control. */
const EAST = 'Asia/Shanghai';

/** 05:00 on October 6th in the west, 20:00 on October 6th in the east: "today" is the 6th in both. */
const CLOCK = '2026-10-06T12:00:00.000Z';
/** A fixed instant: 21:00 on the 5th in the west, 12:00 on the 6th in the east. */
const INSTANT = '2026-10-06T04:00:00.000Z';

const TODAY = '2026-10-06';
const TOMORROW = '2026-10-07';

/** Freeze the clock, moving this forked process into `zone` first when given. */
function enter(zone?: string): void {
  if (zone) process.env.TZ = zone;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CLOCK));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type Row = { id: string; name: string; when: string };

/**
 * Mount the timeline over `rows`, bound to `when`, and read back each bucket
 * as `Bucket: title (date face), …` in render order.
 */
function feed(rows: Row[]): string[] {
  // `data` is an undeclared passthrough prop on ObjectTimelineProps (the
  // component reads it off the rest args, which is how ListView feeds it).
  const props = {
    schema: {
      type: 'object-timeline',
      objectName: 'task',
      titleField: 'name',
      timeline: { startDateField: 'when', titleField: 'name' },
    },
    data: rows,
  } as unknown as React.ComponentProps<typeof ObjectTimeline>;
  render(
    <LocalizationProvider value={{ locale: 'en-US' }}>
      <ObjectTimeline {...props} />
    </LocalizationProvider>,
  );
  screen.getByText(rows[0].name);
  const out = Array.from(document.querySelectorAll('section')).map((section) => {
    const bucket = section.querySelector('header > span:first-child')?.textContent ?? '';
    const items = Array.from(section.querySelectorAll('h3')).map((h3) => {
      const time = h3.parentElement?.querySelector('time')?.textContent ?? '';
      return `${h3.textContent} (${time})`;
    });
    return `${bucket}: ${items.join(', ')}`;
  });
  cleanup();
  return out;
}

const DAYS: Row[] = [
  { id: '1', name: 'Ship', when: TODAY },
  { id: '2', name: 'Review', when: TOMORROW },
];

/** One date-only day and one instant that falls on the day before it west of UTC. */
const MIXED: Row[] = [
  { id: '1', name: 'Day', when: TODAY },
  { id: '2', name: 'Instant', when: INSTANT },
];

describe('ObjectTimeline date-only days, in the suite zone (objectui#10866)', () => {
  it('a date-only value buckets and dates as the day it stores', () => {
    enter();
    expect(feed(DAYS)).toEqual(['Today: Ship (10/6/2026)', 'Tomorrow: Review (10/7/2026)']);
  });
});

describe.runIf(DRIVEN)('ObjectTimeline date-only days west of UTC (objectui#10866)', () => {
  it('rig: the zone really moved', () => {
    enter(WEST);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(WEST);
    expect(new Date(INSTANT).getHours()).toBe(21);
  });

  it('fixture validity: the engine parse of the string lands on the day before here', () => {
    enter(WEST);
    // Without this the cases below would be green for free.
    expect(new Date(TODAY).getDate()).toBe(5);
  });

  it('an item due today sits under "Today" and reads the 6th, one due tomorrow under "Tomorrow"', () => {
    enter(WEST);
    expect(feed(DAYS)).toEqual(['Today: Ship (10/6/2026)', 'Tomorrow: Review (10/7/2026)']);
  });

  it('control: an instant alone keeps its local day, the evening of the 5th', () => {
    enter(WEST);
    expect(feed([MIXED[1]])).toEqual(['Earlier: Instant (10/5/2026)']);
  });

  it('the sort agrees with the buckets: an instant of the evening before comes first', () => {
    enter(WEST);
    expect(feed(MIXED)).toEqual(['Earlier: Instant (10/5/2026)', 'Today: Day (10/6/2026)']);
  });
});

describe.runIf(DRIVEN)('ObjectTimeline date-only days east of UTC, the control (objectui#10866)', () => {
  it('rig: the zone really moved', () => {
    enter(EAST);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(EAST);
    expect(new Date(INSTANT).getHours()).toBe(12);
  });

  it('an item due today sits under "Today" and reads the 6th, as it already did', () => {
    enter(EAST);
    expect(feed(DAYS)).toEqual(['Today: Ship (10/6/2026)', 'Tomorrow: Review (10/7/2026)']);
  });

  it('control: an instant alone keeps its local day, the 6th', () => {
    enter(EAST);
    expect(feed([MIXED[1]])).toEqual(['Today: Instant (10/6/2026)']);
  });

  it('the day and the instant are both today, the day first', () => {
    enter(EAST);
    expect(feed(MIXED)).toEqual(['Today: Day (10/6/2026), Instant (10/6/2026)']);
  });
});
