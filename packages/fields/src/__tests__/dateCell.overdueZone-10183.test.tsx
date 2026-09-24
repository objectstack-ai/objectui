/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10183 — the `date` cell's overdue colouring takes its DAY from the
 * shared parse step, so a deadline falling today is not red west of UTC.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * The text half was already right: `DateCellRenderer` hands the raw value to
 * `formatDate`, which goes through `toDisplayDate` (objectui#10110). The red
 * half was not: `isOverdueInstant` was fed `new Date(safe)`, which for a
 * date-only value is UTC midnight, and compared it with the LOCAL start of
 * today. A due-type `2026-09-03` on the clock `2026-09-03T10:35Z` read `Today`
 * in every zone, and was `text-red-600` in `America/Los_Angeles` only.
 *
 * ── Why the zone is driven in a CHILD vitest on the FORKS pool ─────────────
 * ⚠️ `process.env.TZ` written inside a test of the normal run does NOT move
 * the zone: the root config runs `pool: 'threads'`, a worker thread's
 * `process.env` is a plain copy with no native setter, and `Intl` keeps
 * reading UTC — every assertion here would pass for the wrong reason. A
 * forked worker is a real process's MAIN thread, where Node's `TZ` setter
 * does reset the zone. So the normal run spawns one vitest over this file,
 * `--pool=forks`, filtered to {@link CHILD_CASE}; that child switches the zone
 * per reading and writes its readings to a file this run asserts on.
 *
 * ⭐ Every reading carries its own rig check — the zone `Intl` resolved, and
 * the local hour of a fixed INSTANT, which differs between the two zones only
 * if the zone really moved. A rig that stopped working reds instead of going
 * quietly green.
 *
 * ── Why a zone EAST of UTC too ─────────────────────────────────────────────
 * East of UTC the UTC-midnight parse lands on or after local midnight, so the
 * defect is invisible there; `Asia/Shanghai` is the control that any
 * hour-offset "repair" breaks. Yesterday's deadline is the second control: it
 * must stay red in both zones, so a repair that simply stopped colouring
 * cannot pass either.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { childVitestEnv } from '../../../../scripts/__tests__/helpers/child-vitest-env';
import { DateCellRenderer } from '../index';

/** UTC-7 on the card's clock — where the deadline turned red a day early. */
const WEST = 'America/Los_Angeles';
/** UTC+8 — the control, where the UTC-midnight parse was already harmless. */
const EAST = 'Asia/Shanghai';

/** The card's clock: `Thu Sep 3` in both zones (03:35 PDT, 18:35 CST). */
const CARD_CLOCK = '2026-09-03T10:35:00.000Z';
const DUE_TODAY = '2026-09-03';
const DUE_YESTERDAY = '2026-09-02';
/** A fixed instant: 20:00 the day before in the west, 11:00 in the east. */
const INSTANT = '2026-08-01T03:00:00.000Z';

/** The one case the spawned child runs; kept a plain string, it is a regex filter. */
const CHILD_CASE = 'zone child reads the date cell in each zone';
const PROBE_OUT = process.env.OBJECTUI_ZONE_PROBE_OUT;
const IS_CHILD = PROBE_OUT !== undefined;

interface Cell {
  text: string;
  red: boolean;
}
interface Reading {
  zone: string;
  localHourOfInstant: number;
  /** Fixture validity: the pre-repair parse lands before local midnight here. */
  utcMidnightBeforeLocalToday: boolean;
  today: Cell;
  yesterday: Cell;
}

function cellAt(value: string): Cell {
  const { container } = render(
    <DateCellRenderer value={value} field={{ name: 'due_date', type: 'date' } as any} />,
  );
  const span = container.querySelector('span');
  const cell = { text: span?.textContent ?? '', red: (span?.className ?? '').includes('text-red-600') };
  cleanup();
  return cell;
}

function readHere(): Reading {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CARD_CLOCK));
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localHourOfInstant: new Date(INSTANT).getHours(),
      utcMidnightBeforeLocalToday: new Date(DUE_TODAY) < startOfToday,
      today: cellAt(DUE_TODAY),
      yesterday: cellAt(DUE_YESTERDAY),
    };
  } finally {
    vi.useRealTimers();
  }
}

it.runIf(IS_CHILD)(CHILD_CASE, () => {
  const readings: Record<string, Reading> = {};
  for (const zone of [WEST, EAST]) {
    process.env.TZ = zone;
    readings[zone] = readHere();
  }
  fs.writeFileSync(PROBE_OUT!, JSON.stringify(readings));
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const selfPath = path.relative(repoRoot, fileURLToPath(import.meta.url));

/** The vitest CLI entry, resolved rather than assumed at a `node_modules` path. */
const vitestCli = (() => {
  const require = createRequire(path.join(repoRoot, 'noop.js'));
  const pkgPath = require.resolve('vitest/package.json');
  const bin = (JSON.parse(fs.readFileSync(pkgPath, 'utf8')).bin as { vitest: string }).vitest;
  return path.resolve(path.dirname(pkgPath), bin);
})();

let cached: Record<string, Reading> | undefined;

/** One child for the whole file, memoized: the spawn is this file's entire cost. */
function readings(): Record<string, Reading> {
  if (cached) return cached;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zone-10183-'));
  const out = path.join(dir, 'readings.json');
  try {
    const env = childVitestEnv({ OBJECTUI_ZONE_PROBE_OUT: out });
    const child = spawnSync(
      process.execPath,
      [vitestCli, 'run', selfPath, '--pool=forks', '--testNamePattern', CHILD_CASE],
      { cwd: repoRoot, encoding: 'utf8', env, timeout: 300_000 },
    );
    expect(child.status, `${child.stdout ?? ''}${child.stderr ?? ''}`).toBe(0);
    cached = JSON.parse(fs.readFileSync(out, 'utf8')) as Record<string, Reading>;
    return cached;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe.skipIf(IS_CHILD)('the date cell overdue colouring, west and east of UTC (objectui#10183)', { timeout: 360_000 }, () => {
  it('the rig: each reading comes from the zone it names, and the zone really moved', () => {
    const r = readings();
    expect(r[WEST].zone).toBe(WEST);
    expect(r[EAST].zone).toBe(EAST);
    expect(r[WEST].localHourOfInstant).toBe(20);
    expect(r[EAST].localHourOfInstant).toBe(11);
  });

  it('fixture validity: west of UTC, the UTC-midnight parse of today lands before local midnight', () => {
    // Without this the WEST case below would be green for free.
    expect(readings()[WEST].utcMidnightBeforeLocalToday).toBe(true);
    expect(readings()[EAST].utcMidnightBeforeLocalToday).toBe(false);
  });

  it('a deadline falling today reads Today and is NOT red west of UTC', () => {
    expect(readings()[WEST].today).toEqual({ text: 'Today', red: false });
  });

  it('and east of UTC, where it was already right', () => {
    expect(readings()[EAST].today).toEqual({ text: 'Today', red: false });
  });

  it("yesterday's deadline stays red in both zones", () => {
    expect(readings()[WEST].yesterday).toEqual({ text: 'Yesterday', red: true });
    expect(readings()[EAST].yesterday).toEqual({ text: 'Yesterday', red: true });
  });
});
