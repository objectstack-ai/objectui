/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10183 — `data-table`'s default cell face hands the shared
 * formatters the STRING, so a date-only value renders the day it names west
 * of UTC.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * `formatCellValue` ran `Date.parse` and handed `formatDate` a `new Date(ts)`.
 * The shared parse step (`toDisplayDate`, objectui#10110) rebuilds a
 * date-only STRING at local midnight, but leaves a `Date` alone — it is
 * already an instant — so the table's date-only cells kept the UTC-midnight
 * parse: `2026-08-01` rendered `Jul 31` in `America/Los_Angeles` and `Aug 1`
 * in UTC. `data-table-date-convention-7620.test.tsx` was green throughout: it
 * runs in UTC, the one offset where the two spellings agree.
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
 * moving the zone reds instead of going quietly green.
 *
 * `Asia/Shanghai` is the control: east of UTC the UTC-midnight parse already
 * landed on the right day, so an hour-offset "repair" breaks it. The datetime
 * row is the other control — an instant must keep converting into the
 * viewer's zone, onto another calendar day included.
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
import { ComponentRegistry, formatDate } from '@object-ui/core';
import { I18nProvider } from '@object-ui/i18n';
import { childVitestEnv } from '../../../../scripts/__tests__/helpers/child-vitest-env';
// Registers the renderers at module scope, NOT inside a hook (objectui#3010).
import '../renderers';

/** UTC-7 in August — the card's zone. */
const WEST = 'America/Los_Angeles';
/** UTC+8 — the control, where the UTC-midnight parse was already harmless. */
const EAST = 'Asia/Shanghai';

/** Frozen so `2026` is the current year and `formatDate` drops it. */
const CLOCK = '2026-09-03T10:35:00.000Z';
const DATE_ONLY = '2026-08-01';
/** A fixed instant: 20:00 the day before in the west, 11:00 in the east. */
const INSTANT = '2026-08-01T03:00:00.000Z';

/** The one case the spawned child runs; kept a plain string, it is a regex filter. */
const CHILD_CASE = 'zone child reads the data-table cells in each zone';
const PROBE_OUT = process.env.OBJECTUI_ZONE_PROBE_OUT;
const IS_CHILD = PROBE_OUT !== undefined;

interface Reading {
  zone: string;
  localHourOfInstant: number;
  /** Fixture validity: what the pre-repair spelling renders in this zone. */
  preParsed: string;
  cells: string[];
}

function readHere(): Reading {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CLOCK));
  try {
    const Table = ComponentRegistry.get('data-table')!;
    const schema = {
      type: 'data-table',
      columns: [{ header: 'When', accessorKey: 'when' }],
      data: [
        { id: 'date-only', when: DATE_ONLY },
        { id: 'instant', when: INSTANT },
      ],
    } as any;
    const { container } = render(
      <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
        <Table schema={schema} />
      </I18nProvider>,
    );
    const cells = Array.from(container.querySelectorAll('tbody tr td')).map((td) => td.textContent ?? '');
    cleanup();
    return {
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localHourOfInstant: new Date(INSTANT).getHours(),
      preParsed: formatDate(new Date(Date.parse(DATE_ONLY)), undefined, { locale: 'en' }),
      cells,
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

describe.skipIf(IS_CHILD)('data-table date-only cells, west and east of UTC (objectui#10183)', { timeout: 360_000 }, () => {
  it('the rig: each reading comes from the zone it names, and the zone really moved', () => {
    const r = readings();
    expect(r[WEST].zone).toBe(WEST);
    expect(r[EAST].zone).toBe(EAST);
    expect(r[WEST].localHourOfInstant).toBe(20);
    expect(r[EAST].localHourOfInstant).toBe(11);
  });

  it('fixture validity: west of UTC, the pre-parsed spelling lands on the day before', () => {
    // Without this the WEST case below would be green for free.
    expect(readings()[WEST].preParsed).toBe('Jul 31');
    expect(readings()[EAST].preParsed).toBe('Aug 1');
  });

  it('renders `2026-08-01` as Aug 1 west of UTC, where it read Jul 31', () => {
    expect(readings()[WEST].cells[0]).toBe('Aug 1');
  });

  it('and east of UTC, where it was already right', () => {
    expect(readings()[EAST].cells[0]).toBe('Aug 1');
  });

  it('keeps converting an instant into the viewer zone, onto another day included', () => {
    expect(readings()[WEST].cells[1]).toBe('Jul 31, 2026, 08:00 PM');
    expect(readings()[EAST].cells[1]).toBe('Aug 1, 2026, 11:00 AM');
  });
});
