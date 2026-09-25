import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { childVitestEnv } from './helpers/child-vitest-env';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/**
 * objectui#10183 — drives the date-only zone pins, which cannot drive
 * themselves.
 *
 * ## What the pins are
 *
 * objectui#10110 moved the date-only repair into the shared parse step
 * (`toDisplayDate` in `@object-ui/core`). Four sites never reached it, and
 * each read `2026-08-01` as July 31st west of UTC: `data-table`'s default
 * cell face (and through it a related list with no child schema), the record
 * summary chip, the History tab's date faces and the `date` cell's overdue
 * colouring. Each has a pin beside it, listed in {@link PINS}.
 * objectui#10293 added a fifth under the same convention: the `ui:calendar`
 * primitive's selected date, which the renderer now coerces through the same
 * shared step.
 *
 * ## Why a driver, and why the forks pool
 *
 * The zone is those pins' input, and this suite runs in UTC — the one offset
 * where the defect is invisible (`vitest.config.mts` pins it, objectui#8366).
 * ⚠️ Writing `process.env.TZ` inside a test of the normal run does NOT move
 * the zone: the root config runs `pool: 'threads'`, a worker thread's
 * `process.env` is a plain copy with no native setter, and `Intl` keeps
 * reading UTC. Measured while writing these pins: the same assignment in the
 * same test file resolved `America/Los_Angeles` on `--pool=forks` and `UTC`
 * on the default pool. A forked worker is a real process's MAIN thread, where
 * Node's `TZ` setter resets the zone. ⚠️ Nor can the zone be handed to a child
 * vitest in its environment: loading the root config re-pins `UTC` before any
 * worker starts, which is exactly what `vitest-timezone-pin-8366.test.ts`
 * spawns a vitest to prove. So the pins set the zone themselves, per case,
 * and only a forked child can run them.
 *
 * Each pin is therefore skipped in the normal run and runs only here: one
 * vitest over every file in {@link PINS}, `--pool=forks`, with
 * `OBJECTUI_DATE_ZONE_CHILD=1`. Every zone in every pin opens with a rig case
 * — the zone `Intl` resolved, and the local hour of a fixed instant — so a
 * child whose zone did not move reds inside the child.
 *
 * ## What this file asserts, and why "ran" is half of it
 *
 * Reading the child's JSON report, per pin: the file was collected, it ran at
 * least one case, and every case PASSED — skipped counts as failure. A child
 * that stopped honouring the flag would skip every case, exit 0 and say
 * nothing; that is the silent shape this rules out. One spawn, not one per pin,
 * because the spawn is the whole cost.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** The pins this file drives, relative to the repository root. */
const PINS = [
  'packages/components/src/__tests__/data-table.dateOnlyZone-10183.test.tsx',
  'packages/plugin-detail/src/__tests__/summaryChip.dateOnlyZone-10183.test.tsx',
  'packages/app-shell/src/utils/__tests__/auditHistoryDisplay.dateOnlyZone-10183.test.ts',
  'packages/fields/src/__tests__/dateCell.overdueZone-10183.test.tsx',
  // objectui#10293: the `ui:calendar` primitive's selected date, the same
  // date-only convention at a fifth read site.
  'packages/components/src/renderers/form/__tests__/calendar.dateValueZone-10293.test.tsx',
] as const;

/** The vitest CLI entry, resolved rather than assumed at a `node_modules` path. */
const vitestCli = (() => {
  const require = createRequire(path.join(repoRoot, 'noop.js'));
  const pkgPath = require.resolve('vitest/package.json');
  const bin = (JSON.parse(fs.readFileSync(pkgPath, 'utf8')).bin as { vitest: string }).vitest;
  return path.resolve(path.dirname(pkgPath), bin);
})();

interface AssertionResult {
  title: string;
  status: string;
  failureMessages: string[];
}
interface FileResult {
  name: string;
  assertionResults: AssertionResult[];
}
interface Run {
  status: number | null;
  output: string;
  files: FileResult[];
}

let cached: Run | undefined;

/** One child for all the pins, memoized. */
function run(): Run {
  if (cached) return cached;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'date-zone-10183-'));
  const report = path.join(dir, 'report.json');
  try {
    const env = childVitestEnv({ OBJECTUI_DATE_ZONE_CHILD: '1' });
    const child = spawnSync(
      process.execPath,
      [vitestCli, 'run', ...PINS, '--pool=forks', '--reporter=json', '--outputFile', report],
      { cwd: repoRoot, encoding: 'utf8', env, timeout: 300_000 },
    );
    const output = `${child.stdout ?? ''}${child.stderr ?? ''}`;
    const files = fs.existsSync(report)
      ? (JSON.parse(fs.readFileSync(report, 'utf8')) as { testResults: FileResult[] }).testResults
      : [];
    cached = { status: child.status, output, files };
    return cached;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('objectui#10183 — the date-only zone pins, driven on the forks pool', { timeout: 360_000 }, () => {
  it.each(PINS)('%s ran every case in its zone, and every case passed', (pin) => {
    const { files, output } = run();
    const file = files.find((f) => path.relative(repoRoot, f.name) === pin);
    expect(file, `the child did not collect ${pin}\n${output}`).toBeDefined();
    const cases = file!.assertionResults;
    const notPassed = cases
      .filter((c) => c.status !== 'passed')
      .map((c) => `${c.status}: ${c.title}\n${c.failureMessages.join('\n')}`);
    expect(cases.length, `${pin} ran no case at all`).toBeGreaterThan(0);
    expect(notPassed, `${pin}: cases that did not pass in the forked child`).toEqual([]);
  });

  it('the child run itself exited 0', () => {
    const { status, output } = run();
    expect(status, output).toBe(0);
  });
});
