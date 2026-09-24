/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10183 — the record History tab renders a date-only value as the
 * day it names west of UTC.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * `formatAuditValue`'s `date` branch formatted `new Date(value)` itself, so a
 * date-only value was UTC midnight read back in the viewer's zone:
 * `2026-08-01` rendered `7/31/2026` (en-US) in `America/Los_Angeles` and
 * `8/1/2026` in UTC. It now takes its `Date` from `toDisplayDate`, the shared
 * parse step (objectui#10110); both faces stay this helper's own.
 *
 * The `datetime` arm shares that one parse, so it follows the shared path's
 * rule too: the split is the VALUE's shape, never the field's type. An
 * instant keeps converting into the viewer's zone; a date-only value stored
 * on a `datetime` field reads as local midnight of its day, exactly as
 * `formatDateTime` renders the same string.
 *
 * ── Why the zone is driven in a CHILD vitest on the FORKS pool ─────────────
 * ⚠️ `process.env.TZ` written inside a test of the normal run does NOT move
 * the zone: the root config runs `pool: 'threads'`, a worker thread's
 * `process.env` is a plain copy with no native setter, and `Intl` keeps
 * reading UTC. A forked worker is a real process's MAIN thread, where Node's
 * `TZ` setter does reset the zone. So the normal run spawns one vitest over
 * this file, `--pool=forks`, filtered to {@link CHILD_CASE}; that child
 * switches the zone per reading and writes its readings to a file this run
 * asserts on. Each reading carries its own rig check (the zone `Intl`
 * resolved, and the local hour of a fixed INSTANT), so a rig that stopped
 * moving the zone reds instead of going quietly green. `Asia/Shanghai` is the
 * control an hour-offset "repair" breaks.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';
import { childVitestEnv } from '../../../../../scripts/__tests__/helpers/child-vitest-env';
import { formatAuditValue } from '../auditHistoryDisplay';

/** UTC-7 in August — the card's zone. */
const WEST = 'America/Los_Angeles';
/** UTC+8 — the control, where the UTC-midnight parse was already harmless. */
const EAST = 'Asia/Shanghai';

const DATE_ONLY = '2026-08-01';
/** A fixed instant: 20:00 the day before in the west, 11:00 in the east. */
const INSTANT = '2026-08-01T03:00:00.000Z';

/** The one case the spawned child runs; kept a plain string, it is a regex filter. */
const CHILD_CASE = 'zone child reads the audit faces in each zone';
const PROBE_OUT = process.env.OBJECTUI_ZONE_PROBE_OUT;
const IS_CHILD = PROBE_OUT !== undefined;

interface Reading {
  zone: string;
  localHourOfInstant: number;
  date: string;
  datetimeInstant: string;
  datetimeDateOnly: string;
}

function readHere(): Reading {
  const ctx = { locale: 'en-US' };
  return {
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localHourOfInstant: new Date(INSTANT).getHours(),
    date: formatAuditValue({ type: 'date' }, DATE_ONLY, ctx),
    datetimeInstant: formatAuditValue({ type: 'datetime' }, INSTANT, ctx),
    datetimeDateOnly: formatAuditValue({ type: 'datetime' }, DATE_ONLY, ctx),
  };
}

it.runIf(IS_CHILD)(CHILD_CASE, () => {
  const readings: Record<string, Reading> = {};
  for (const zone of [WEST, EAST]) {
    process.env.TZ = zone;
    readings[zone] = readHere();
  }
  fs.writeFileSync(PROBE_OUT!, JSON.stringify(readings));
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
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

describe.skipIf(IS_CHILD)('audit history date faces, west and east of UTC (objectui#10183)', { timeout: 360_000 }, () => {
  it('the rig: each reading comes from the zone it names, and the zone really moved', () => {
    const r = readings();
    expect(r[WEST].zone).toBe(WEST);
    expect(r[EAST].zone).toBe(EAST);
    expect(r[WEST].localHourOfInstant).toBe(20);
    expect(r[EAST].localHourOfInstant).toBe(11);
  });

  it('a `date` value `2026-08-01` reads 8/1/2026 west of UTC, where it read 7/31/2026', () => {
    expect(readings()[WEST].date).toBe('8/1/2026');
  });

  it('and east of UTC, where it was already right', () => {
    expect(readings()[EAST].date).toBe('8/1/2026');
  });

  it('a `datetime` instant keeps converting into the viewer zone, onto another day included', () => {
    expect(readings()[WEST].datetimeInstant).toBe('Jul 31, 2026, 8:00 PM');
    expect(readings()[EAST].datetimeInstant).toBe('Aug 1, 2026, 11:00 AM');
  });

  it('a date-only value on a `datetime` field reads as local midnight of its day, in both zones', () => {
    expect(readings()[WEST].datetimeDateOnly).toBe('Aug 1, 2026, 12:00 AM');
    expect(readings()[EAST].datetimeDateOnly).toBe('Aug 1, 2026, 12:00 AM');
  });
});
