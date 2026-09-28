/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10866, slice 3 — `DATEADD`, `DATEDIFF` and `DATEFORMAT` do their
 * day arithmetic on the UTC calendar, the server's (ADR-0053 D1), in every
 * zone.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * The three functions read a date-only `2026-09-01` with the engine's own
 * parse, which is UTC midnight, and then moved and read it with LOCAL setters
 * and getters:
 *
 *  - `DATEFORMAT('2026-09-01', 'YYYY-MM-DD')` printed `2026-08-31` west of
 *    UTC; `DATEDIFF('2025-12-31', '2026-01-01', 'year')` answered 0 there;
 *  - `DATEADD` across a DST change moved an hour off midnight
 *    (`2026-11-02T01:00:00.000Z` for a day after `2026-11-01` in Los Angeles),
 *    and a month from `2026-09-01` landed on October 2nd there;
 *  - `DATEADD('2026-01-31', 1, 'month')` overflowed into March
 *    (`2026-03-03T00:00:00.000Z`) in EVERY zone, UTC included, where the
 *    server's `addMonths` clamps to February 28th;
 *  - `DATEADD` handed a date-only argument back as an instant string, which
 *    the display path (`toDisplayDate`) then reads as an instant.
 *
 * Now a calendar day is UTC midnight of that day, moved with UTC setters
 * (months clamped to the target month's last day, as objectstack's
 * `@objectstack/formula` stdlib `addMonthsUtc` does), read with UTC getters,
 * and a real date-only argument comes back as `YYYY-MM-DD`. A value with a
 * time part keeps its instant and comes back as an instant. `TODAY()` is NOT
 * changed (objectui#10903, ruling A): the last cases pin that it still names
 * the UTC day, and that `DATEFORMAT(NOW(), 'YYYY-MM-DD')` now names the same
 * day, which it did not west of UTC.
 *
 * ── ⚠️ The zone cases run ONLY when driven, in a FORKS child ────────────────
 * `process.env.TZ` written inside a test of the normal run does not move the
 * zone (the root config runs `pool: 'threads'`), so the zone cases are
 * skipped there and `scripts/__tests__/date-only-zone-pins-10183.test.ts`
 * runs them on the forks pool and fails unless every one ran and passed. Each
 * zone opens with a rig case, so a child whose zone did not move reds instead
 * of going quietly green. The suite-zone cases run in the normal run too; the
 * month clamp and the output shape are red on the base there as well.
 *
 * `Asia/Shanghai` is the control: east of UTC the local getters of a UTC
 * midnight already read the named day, and an hour-offset "repair" would
 * break it.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormulaFunctions } from '../FormulaFunctions';

const DRIVEN = process.env.OBJECTUI_DATE_ZONE_CHILD === '1';

/** UTC-7 in September, and the zone whose DST changes the day cases cross. */
const WEST = 'America/Los_Angeles';
/** UTC+8, no DST — the control. */
const EAST = 'Asia/Shanghai';

/** A fixed instant: 20:00 on August 31st in the west, 11:00 on September 1st in the east. */
const INSTANT = '2026-09-01T03:00:00.000Z';

/** 22:30 on the 27th in the west, 13:30 on the 28th in the east; the UTC day is the 28th. */
const CLOCK = '2026-09-28T05:30:00.000Z';

/** Move this forked process into `zone`. */
function enter(zone: string): void {
  process.env.TZ = zone;
}

afterEach(() => {
  vi.useRealTimers();
});

const formulas = new FormulaFunctions();
const DATEADD = formulas.get('DATEADD')!;
const DATEDIFF = formulas.get('DATEDIFF')!;
const DATEFORMAT = formulas.get('DATEFORMAT')!;
const TODAY = formulas.get('TODAY')!;
const NOW = formulas.get('NOW')!;

/** `TODAY()` and `DATEFORMAT(NOW(), 'YYYY-MM-DD')` at {@link CLOCK}. */
function todayPair(): { today: string; formattedNow: string } {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CLOCK));
  return { today: TODAY(), formattedNow: DATEFORMAT(NOW(), 'YYYY-MM-DD') };
}

/**
 * The cases that must read the same in every zone, the suite's UTC included.
 * `zone` is entered at the top of each case; the suite-zone block passes none.
 */
function everyZoneCases(zone?: string): void {
  const at = (title: string, body: () => void) =>
    it(title, () => {
      if (zone) enter(zone);
      body();
    });

  at('a month from January 31st clamps to February 28th, as the server\'s `addMonths` does', () => {
    expect(DATEADD('2026-01-31', 1, 'month')).toBe('2026-02-28');
    expect(DATEADD('2024-01-31', 1, 'month')).toBe('2024-02-29');
    expect(DATEADD('2026-03-31', -1, 'months')).toBe('2026-02-28');
  });

  at('a year from February 29th clamps to February 28th, twelve months on the same rule', () => {
    expect(DATEADD('2024-02-29', 1, 'year')).toBe('2025-02-28');
  });

  at('a date-only argument comes back as the day, `YYYY-MM-DD`', () => {
    expect(DATEADD('2026-09-01', 1, 'day')).toBe('2026-09-02');
    expect(DATEADD('2026-09-01', 1, 'month')).toBe('2026-10-01');
    expect(DATEADD('2026-12-31', 1, 'days')).toBe('2027-01-01');
  });

  at('a day crosses a DST change as a whole day, and stays a day', () => {
    // America/Los_Angeles leaves DST on 2026-11-01 and enters it on 2026-03-08.
    expect(DATEADD('2026-11-01', 1, 'day')).toBe('2026-11-02');
    expect(DATEADD('2026-03-08', 1, 'day')).toBe('2026-03-09');
  });

  at('a sub-day unit on a day gives an instant: UTC midnight of the day, moved', () => {
    expect(DATEADD('2026-09-01', 3, 'hours')).toBe('2026-09-01T03:00:00.000Z');
    expect(DATEADD('2026-09-01', 90, 'minutes')).toBe('2026-09-01T01:30:00.000Z');
  });

  at('an instant keeps its instant: moved on the UTC calendar, clamped the same way, and handed back as an instant', () => {
    expect(DATEADD('2026-01-31T12:00:00.000Z', 1, 'month')).toBe('2026-02-28T12:00:00.000Z');
    // 05:00 on October 31st in Los Angeles, the day before its DST change:
    // a day later is 24 hours later, as the server's `addDays` answers.
    expect(DATEADD('2026-10-31T12:00:00.000Z', 1, 'day')).toBe('2026-11-01T12:00:00.000Z');
  });

  at('`DATEFORMAT` prints the stored day, and the UTC clock of an instant', () => {
    expect(DATEFORMAT('2026-09-01', 'YYYY-MM-DD')).toBe('2026-09-01');
    expect(DATEFORMAT('2026-09-01', 'DD/MM/YY HH:mm:ss')).toBe('01/09/26 00:00:00');
    expect(DATEFORMAT(INSTANT, 'YYYY-MM-DD HH:mm')).toBe('2026-09-01 03:00');
  });

  at('`DATEDIFF` counts calendar months and years between two days', () => {
    expect(DATEDIFF('2025-12-31', '2026-01-01', 'year')).toBe(1);
    expect(DATEDIFF('2026-08-31', '2026-09-01', 'month')).toBe(1);
    expect(DATEDIFF('2026-03-01', '2026-03-31', 'days')).toBe(30);
    expect(DATEDIFF('2026-11-01', '2026-11-02', 'hours')).toBe(24);
  });

  at('`TODAY()` still names the UTC day (objectui#10903), and `DATEFORMAT(NOW())` names the same day', () => {
    expect(todayPair()).toEqual({ today: '2026-09-28', formattedNow: '2026-09-28' });
  });

  at('control: a value that is not a date still throws the named error', () => {
    expect(() => DATEADD('invalid', 1, 'day')).toThrow('DATEADD: Invalid date "invalid"');
    expect(() => DATEDIFF('2026-09-01', 'invalid', 'day')).toThrow('DATEDIFF: Invalid date "invalid"');
    expect(() => DATEFORMAT('invalid', 'YYYY')).toThrow('DATEFORMAT: Invalid date "invalid"');
  });
}

describe('formula date functions, in the suite zone (objectui#10866)', () => {
  everyZoneCases();
});

describe.runIf(DRIVEN)('formula date functions west of UTC (objectui#10866)', () => {
  it('rig: the zone really moved', () => {
    enter(WEST);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(WEST);
    expect(new Date(INSTANT).getHours()).toBe(20);
  });

  it('fixture validity: local getters of the engine parse read the day before here', () => {
    enter(WEST);
    // Without this the cases below would be green for free.
    expect(new Date('2026-09-01').getDate()).toBe(31);
    expect(new Date('2026-01-01').getFullYear()).toBe(2025);
  });

  everyZoneCases(WEST);
});

describe.runIf(DRIVEN)('formula date functions east of UTC, the control (objectui#10866)', () => {
  it('rig: the zone really moved', () => {
    enter(EAST);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(EAST);
    expect(new Date(INSTANT).getHours()).toBe(11);
  });

  everyZoneCases(EAST);
});
