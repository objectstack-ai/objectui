/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11675 — `firstDayOfWeek(locale)` reads the locale's week info.
 *
 * Ruling B on the card: the first day of the week follows the user's locale,
 * and the card's pins are that `en-US` starts on Sunday while `zh-CN` and
 * `en-GB` start on Monday, from the locale's week info. The calendar and the
 * timeline both read this one function, so its two paths are pinned here:
 *
 *  - the ENGINE path, `Intl.Locale`'s own week info (`getWeekInfo()`, else the
 *    `weekInfo` accessor), which Node 22, this suite's runtime, provides as the
 *    accessor only;
 *  - the TABLE path, CLDR's region table, for an engine with neither spelling.
 *    It is reached here by removing both spellings from `Intl.Locale.prototype`
 *    for the length of one call, and putting them back exactly.
 *
 * The parity case is what re-derives the table: region by region, it compares
 * the table's answer with this runtime's own week data, so a CLDR release that
 * moves a region reds here, naming the region.
 *
 * ⚠️ This file runs in the `unit` project, which shares one global object
 * between files (`isolate: false`). Every removal is undone in a `finally`, and
 * the last case checks that both spellings are exactly what they were when the
 * file started.
 */

import { afterAll, describe, expect, it } from 'vitest';
import { firstDayOfWeek } from '../index';

const SUNDAY = 0;
const MONDAY = 1;
const FRIDAY = 5;
const SATURDAY = 6;

const proto: object = Intl.Locale.prototype;
const SPELLINGS = ['getWeekInfo', 'weekInfo'] as const;
const ORIGINAL = SPELLINGS.map((name) => Object.getOwnPropertyDescriptor(proto, name));

interface EngineWeekInfo {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

/** This runtime's own first day for `tag`, read off the engine, as `getDay` numbers it. */
function engineReading(tag: string): number | undefined {
  const locale: Intl.Locale & EngineWeekInfo = new Intl.Locale(tag);
  const info = typeof locale.getWeekInfo === 'function' ? locale.getWeekInfo() : locale.weekInfo;
  return info ? info.firstDay % 7 : undefined;
}

function restore(): void {
  SPELLINGS.forEach((name, i) => {
    const descriptor = ORIGINAL[i];
    if (descriptor) Object.defineProperty(proto, name, descriptor);
    else Reflect.deleteProperty(proto, name);
  });
}

/** `body`'s answer with the engine's week info removed, both spellings put back after. */
function withoutEngineWeekInfo<T>(body: () => T): T {
  for (const name of SPELLINGS) Reflect.deleteProperty(proto, name);
  try {
    const probe = new Intl.Locale('en-US');
    expect('getWeekInfo' in probe || 'weekInfo' in probe, 'the engine week info was not removed').toBe(false);
    return body();
  } finally {
    restore();
  }
}

/** `body`'s answer with a `getWeekInfo()` that answers `isoFirstDay` for every tag. */
function withGetWeekInfo<T>(isoFirstDay: number, body: () => T): T {
  Object.defineProperty(proto, 'getWeekInfo', {
    configurable: true,
    writable: true,
    value: () => ({ firstDay: isoFirstDay, weekend: [6, 7], minimalDays: 1 }),
  });
  try {
    return body();
  } finally {
    restore();
  }
}

/** Every region code this runtime names, in the canonical spelling `Intl.Locale` reports. */
function canonicalRegions(): string[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' });
  const regions = new Set<string>();
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (names.of(code) === code) continue;
      const region = new Intl.Locale(`und-${code}`).region;
      if (region) regions.add(region);
    }
  }
  return [...regions].sort();
}

afterAll(restore);

describe('firstDayOfWeek — the engine path (objectui#11675)', () => {
  it('rig: this runtime provides week info, so the cases below read the engine', () => {
    expect(engineReading('en-US'), 'this runtime has no Intl.Locale week info').toBeDefined();
  });

  it("the card's pins: en-US starts on Sunday, en-GB and zh-CN on Monday", () => {
    expect(firstDayOfWeek('en-US')).toBe(SUNDAY);
    expect(firstDayOfWeek('en-GB')).toBe(MONDAY);
    expect(firstDayOfWeek('zh-CN')).toBe(MONDAY);
  });

  it('a UI language with no region reads the region CLDR gives it: `en` Sunday, `zh` Monday', () => {
    expect(firstDayOfWeek('en')).toBe(SUNDAY);
    expect(firstDayOfWeek('zh')).toBe(MONDAY);
  });

  it('it is not a Sunday/Monday switch: ar-EG starts on Saturday', () => {
    expect(firstDayOfWeek('ar-EG')).toBe(SATURDAY);
  });

  it('the engine is what answers: a `-u-fw-` keyword, which only the engine reads, moves the day', () => {
    expect(firstDayOfWeek('en-US-u-fw-mon')).toBe(MONDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('en-US-u-fw-mon'))).toBe(SUNDAY);
  });

  it('`getWeekInfo()` is read before the `weekInfo` accessor, and its ISO 7 is Sunday', () => {
    expect(withGetWeekInfo(3, () => firstDayOfWeek('en-US'))).toBe(3);
    expect(withGetWeekInfo(7, () => firstDayOfWeek('en-GB'))).toBe(SUNDAY);
  });

  it('a tag `Intl` refuses is refused, not guessed', () => {
    expect(() => firstDayOfWeek('en_US')).toThrow(RangeError);
  });
});

describe('firstDayOfWeek — where the engine has no week info, CLDR\'s table answers (objectui#11675)', () => {
  it("the card's pins hold on the table path too", () => {
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('en-US'))).toBe(SUNDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('en-GB'))).toBe(MONDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('zh-CN'))).toBe(MONDAY);
  });

  it('a tag with no region reads the region CLDR gives it', () => {
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('en'))).toBe(SUNDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('zh'))).toBe(MONDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('ar'))).toBe(SATURDAY);
  });

  it('a Saturday and a Friday region, and a region the table does not list, which reads Monday', () => {
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('ar-EG'))).toBe(SATURDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('dv-MV'))).toBe(FRIDAY);
    expect(withoutEngineWeekInfo(() => firstDayOfWeek('de-CH'))).toBe(MONDAY);
  });

  it('PARITY: for every region this runtime names, the table answers what its week data answers', () => {
    const regions = canonicalRegions();
    // A collapsed enumeration would make the comparison below vacuous.
    expect(regions.length, `only ${regions.length} regions enumerated`).toBeGreaterThan(200);
    const engine = new Map(regions.map((region) => [region, engineReading(`und-${region}`)]));
    expect([...new Set(engine.values())].sort(), 'the regions do not reach every first day CLDR uses').toEqual([
      SUNDAY,
      MONDAY,
      FRIDAY,
      SATURDAY,
    ]);
    const table = withoutEngineWeekInfo(
      () => new Map(regions.map((region) => [region, firstDayOfWeek(`und-${region}`)])),
    );
    const drift = regions
      .filter((region) => table.get(region) !== engine.get(region))
      .map((region) => `${region}: engine ${engine.get(region)}, table ${table.get(region)}`);
    expect(
      drift,
      `the CLDR table in utils/first-day-of-week.ts no longer matches this runtime's week data ` +
        `(CLDR ${process.versions.cldr ?? 'unknown'}); regenerate it from the engine`,
    ).toEqual([]);
  });

  it('both spellings are back exactly as the file found them', () => {
    SPELLINGS.forEach((name, i) => {
      expect(Object.getOwnPropertyDescriptor(proto, name), name).toEqual(ORIGINAL[i]);
    });
  });
});
