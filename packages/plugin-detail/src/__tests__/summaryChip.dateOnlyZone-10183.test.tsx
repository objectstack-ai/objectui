/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10183 — two detail-page surfaces render a date-only value as the
 * day it names west of UTC: the summary chip beside the record H1, and a
 * related list whose child schema is unavailable.
 *
 * ── What was measured ───────────────────────────────────────────────────────
 * The summary chip's `date` branch formatted `new Date(val)` itself, so a
 * date-only value was UTC midnight read back in the viewer's zone:
 * `2026-08-01` rendered `2026年7月31日` (zh-CN) in `America/Los_Angeles`.
 * It now takes its `Date` from `toDisplayDate`, the shared parse step
 * (objectui#10110). The chip's own `dateStyle: 'medium'` face is unchanged —
 * `summaryChip.displayLocale-9453.test.tsx`'s `EN_CONTROL_ROWS` hold it.
 *
 * `RelatedList` renders its cells through `data-table`'s default face when
 * the child object's schema is unavailable (no `getObjectSchema`, or a
 * rejected read), and that face pre-parsed the value before the shared
 * formatter: `2026-09-01` read `Aug 31` west of UTC. Repaired in
 * `data-table` itself (`data-table.dateOnlyZone-10183.test.tsx`); this is the
 * same repair reached through the detail page.
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
 * control an hour-offset "repair" breaks; the `datetime` chip is the control
 * that an instant keeps converting.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import '@object-ui/components';
import { I18nProvider, LocalizationProvider } from '@object-ui/i18n';
import type { DetailViewSchema } from '@object-ui/types';
import { childVitestEnv } from '../../../../scripts/__tests__/helpers/child-vitest-env';
import { DetailView } from '../DetailView';
import { RelatedList } from '../RelatedList';

/** UTC-7 in August — the card's zone. */
const WEST = 'America/Los_Angeles';
/** UTC+8 — the control, where the UTC-midnight parse was already harmless. */
const EAST = 'Asia/Shanghai';

/** Frozen so `2026` is the current year for the related-list face. */
const CLOCK = '2026-09-03T10:35:00.000Z';
const CHIP_DATE = '2026-08-01';
const ROW_DATE = '2026-09-01';
/** A fixed instant: 20:00 the day before in the west, 11:00 in the east. */
const INSTANT = '2026-08-01T03:00:00.000Z';

/** The one case the spawned child runs; kept a plain string, it is a regex filter. */
const CHILD_CASE = 'zone child reads the detail surfaces in each zone';
const PROBE_OUT = process.env.OBJECTUI_ZONE_PROBE_OUT;
const IS_CHILD = PROBE_OUT !== undefined;

interface Reading {
  zone: string;
  localHourOfInstant: number;
  chipZh: string;
  chipEn: string;
  chipInstantEn: string;
  relatedRow: string;
}

function chip(type: 'date' | 'datetime', stored: string, locale: string): string {
  const { container } = render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <LocalizationProvider value={{ locale }}>
        <DetailView
          schema={
            {
              type: 'record:details',
              objectName: 'account',
              summaryFields: ['closed_on'],
              fields: [{ name: 'closed_on', label: 'Closed on', type }],
              data: { id: 'A9', name: 'Acme', closed_on: stored },
            } as unknown as DetailViewSchema
          }
        />
      </LocalizationProvider>
    </I18nProvider>,
  );
  const text = container.querySelector('[data-summary-chip="closed_on"]')?.textContent ?? '';
  cleanup();
  return text;
}

async function relatedRow(): Promise<string> {
  // No `dataSource` at all, so no child schema: the cell is `data-table`'s own.
  const { container } = render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <RelatedList title="Tasks" type="table" data={[{ id: 't1', due: ROW_DATE }]} columns={[{ accessorKey: 'due', header: 'Due' }]} />
    </I18nProvider>,
  );
  await waitFor(() => expect(container.querySelector('tbody tr td')).not.toBeNull());
  const text = container.querySelector('tbody tr td')?.textContent ?? '';
  cleanup();
  return text;
}

async function readHere(): Promise<Reading> {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CLOCK));
  try {
    return {
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localHourOfInstant: new Date(INSTANT).getHours(),
      chipZh: chip('date', CHIP_DATE, 'zh-CN'),
      chipEn: chip('date', CHIP_DATE, 'en'),
      chipInstantEn: chip('datetime', INSTANT, 'en'),
      relatedRow: await relatedRow(),
    };
  } finally {
    vi.useRealTimers();
  }
}

it.runIf(IS_CHILD)(CHILD_CASE, async () => {
  // `useRecordEditable` falls back to the global fetch with no provider in the
  // tree; served from a double so no reading depends on the network.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ record: { visible: true } }) })));
  try {
    const readings: Record<string, Reading> = {};
    for (const zone of [WEST, EAST]) {
      process.env.TZ = zone;
      readings[zone] = await readHere();
    }
    fs.writeFileSync(PROBE_OUT!, JSON.stringify(readings));
  } finally {
    vi.unstubAllGlobals();
  }
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

describe.skipIf(IS_CHILD)('detail-page date-only faces, west and east of UTC (objectui#10183)', { timeout: 360_000 }, () => {
  it('the rig: each reading comes from the zone it names, and the zone really moved', () => {
    const r = readings();
    expect(r[WEST].zone).toBe(WEST);
    expect(r[EAST].zone).toBe(EAST);
    expect(r[WEST].localHourOfInstant).toBe(20);
    expect(r[EAST].localHourOfInstant).toBe(11);
  });

  it('the summary chip reads `2026-08-01` as August 1st west of UTC, where it read July 31st', () => {
    expect(readings()[WEST].chipZh).toBe('2026年8月1日');
    expect(readings()[WEST].chipEn).toBe('Aug 1, 2026');
  });

  it('and east of UTC, where it was already right', () => {
    expect(readings()[EAST].chipZh).toBe('2026年8月1日');
    expect(readings()[EAST].chipEn).toBe('Aug 1, 2026');
  });

  it('a `datetime` chip keeps converting its instant into the viewer zone', () => {
    expect(readings()[WEST].chipInstantEn).toBe('Jul 31, 2026, 8:00 PM');
    expect(readings()[EAST].chipInstantEn).toBe('Aug 1, 2026, 11:00 AM');
  });

  it('a related list with no child schema reads `2026-09-01` as Sep 1 in both zones', () => {
    expect(readings()[WEST].relatedRow).toBe('Sep 1');
    expect(readings()[EAST].relatedRow).toBe('Sep 1');
  });
});
