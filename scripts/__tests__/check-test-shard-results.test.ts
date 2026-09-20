import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXIT_BREACHED,
  EXIT_CANNOT_RUN,
  EXIT_OK,
  evaluate,
  exitCodeFor,
  renderReading,
  shardContexts,
} from '../check-test-shard-results.mjs';
import { checkNames, readWorkflows } from './workflow-checks.js';

/**
 * objectui#9499 — the aggregator that replaced four required shard contexts.
 *
 * `ci.yml`'s `test` job is a matrix bounded by `timeout-minutes: 20`, and at
 * four shards it had grown into that bound: the longest SUCCEEDING shard-1 job
 * measured 1199 s against the 1200 s ceiling, and two runs crossed it and were
 * CANCELLED — one of them dequeuing a pull request whose tests had passed,
 * because the merge queue cannot tell `cancelled` from `failure`. Widening the
 * matrix was blocked on the required-check set naming the legs one by one:
 * 4 → 8 renames four live required contexts, which no workflow edit can do.
 *
 * ## ⭐ What these cases are actually for
 *
 * The aggregator's whole risk is that it is EASIER to write wrong than right. A
 * matrix job's `needs.<job>.result` is one rollup over every leg, and it reads
 * `success` when some legs succeeded and the rest were SKIPPED. An aggregator
 * built on that expression is a check that reports success having run nothing —
 * objectui#8857 and objectui#3523 in one line of YAML.
 *
 * So the ruling's acceptance is the case below named for it: a shard forced to
 * `skipped` must turn the aggregator RED. It is asserted here against the pure
 * evaluator, and demonstrated end to end in the pull request against a real
 * Actions run.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ciYaml = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

/** A jobs-API answer: every shard green, plus the aggregator's own in-flight job. */
function greenRun(shards = 8) {
  return [
    { name: 'Type Check', conclusion: 'success' },
    ...shardContexts(shards).map((name) => ({ name, conclusion: 'success' })),
    { name: 'Test (dist pins)', conclusion: 'success' },
    { name: 'Test', conclusion: null },
  ];
}

const read = (jobs: unknown[], shards = 8) => evaluate({ jobs, shards, selfJobName: 'Test' });

describe('check-test-shard-results — the shard names it expects', () => {
  it('spells them the way ci.yml names the matrix job', () => {
    // Both sides derived, neither retyped: `checkNames` is the same parser
    // `dependabot-merge-gate.test.ts` partitions the produced check set with,
    // so this compares the gate's expectation against the workflow itself.
    const workflow = readWorkflows().find((w) => w.file === 'ci.yml');
    expect(workflow, 'ci.yml must still be a workflow').toBeTruthy();

    const produced = checkNames(workflow!);
    const shards = produced.filter((name) => /^Test \(shard \d+\/\d+\)$/.test(name));
    expect(shards.length, 'ci.yml no longer produces a `Test (shard N/M)` matrix').toBeGreaterThan(1);

    expect(
      shardContexts(shards.length),
      "the gate's shard-name spelling has drifted from ci.yml's `name:` template",
    ).toEqual(shards);
  });

  it('refuses a width that is not a positive integer', () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) expect(() => shardContexts(bad)).toThrow(/positive integer/);
  });
});

describe('check-test-shard-results — the verdict', () => {
  it('is intact when every shard reported success', () => {
    const reading = read(greenRun());
    expect(reading.verdict).toBe('intact');
    expect(exitCodeFor(reading)).toBe(EXIT_OK);
    expect(renderReading(reading)).toContain('all 8 shards reported success');
  });

  it('⭐ is BREACHED when one shard was SKIPPED — the objectui#9499 acceptance', () => {
    // The rollup's blind spot, and the reason this gate reads conclusions one
    // at a time. `needs.test.result` over this same run answers `success`.
    const jobs = greenRun().map((job) => (job.name === 'Test (shard 3/8)' ? { ...job, conclusion: 'skipped' } : job));
    const reading = read(jobs);

    expect(reading.verdict).toBe('breached');
    expect(exitCodeFor(reading)).toBe(EXIT_BREACHED);
    expect(reading.notSuccess).toEqual(['Test (shard 3/8) (skipped)']);
    expect(renderReading(reading)).toContain("'skipped' is not a pass here");

    // The control, same evaluator, same run, one field changed back: the red
    // above is the `skipped` conclusion speaking and not some other difference.
    expect(read(greenRun()).verdict).toBe('intact');
  });

  it('is BREACHED when a shard produced no job at all', () => {
    const jobs = greenRun().filter((job) => job.name !== 'Test (shard 8/8)');
    const reading = read(jobs);

    expect(reading.verdict).toBe('breached');
    expect(reading.missing).toEqual(['Test (shard 8/8)']);
    expect(renderReading(reading)).toContain('produced no job at all');
  });

  it('is BREACHED when the matrix is narrower than the gate was told', () => {
    // The drift this gate is exposed to: ci.yml's matrix loses legs and the
    // `--shards` argument does not follow. Every name it looked for is absent,
    // which is loud rather than vacuous.
    const reading = read(greenRun(4).map((j) => j), 8);
    expect(reading.verdict).toBe('breached');
    expect(reading.missing).toHaveLength(8);
  });

  it('is BREACHED on a failed or cancelled shard — the timeout kill included', () => {
    for (const conclusion of ['failure', 'cancelled', 'timed_out', null]) {
      const jobs = greenRun().map((job) => (job.name === 'Test (shard 1/8)' ? { ...job, conclusion } : job));
      const reading = read(jobs);
      expect(reading.verdict, `a ${String(conclusion)} shard must not pass`).toBe('breached');
    }
  });
});

describe('check-test-shard-results — an unreadable answer is never a pass', () => {
  it('refuses a verdict over a job list this job is not in', () => {
    // `GET /actions/runs/{id}/attempts/{n}/jobs` answers 200 with an empty list
    // for a run id that does not exist, so without this control "no shards
    // found" and "every shard was removed" are the same reading — and the
    // second one is the breach.
    const reading = read(greenRun().filter((job) => job.name !== 'Test'));
    expect(reading.verdict).toBe('unreadable');
    expect(exitCodeFor(reading)).toBe(EXIT_CANNOT_RUN);
    expect(renderReading(reading)).toContain('not about this run');
  });

  it('refuses an empty answer', () => {
    const reading = read([]);
    expect(reading.verdict).toBe('unreadable');
    expect(exitCodeFor(reading)).toBe(EXIT_CANNOT_RUN);
  });

  it('never reports a clean exit code for anything but `intact`', () => {
    expect(exitCodeFor(read(greenRun()))).toBe(EXIT_OK);
    expect(exitCodeFor(read([]))).not.toBe(EXIT_OK);
    expect(exitCodeFor(read(greenRun().filter((j) => j.name !== 'Test (shard 2/8)')))).not.toBe(EXIT_OK);
  });

  it('ignores a job whose name it cannot read rather than counting it as seen', () => {
    const jobs = [...greenRun().filter((j) => j.name !== 'Test (shard 5/8)'), { conclusion: 'success' }];
    expect(read(jobs).missing).toEqual(['Test (shard 5/8)']);
  });

  it('throws rather than guessing when the answer is not a list', () => {
    expect(() => evaluate({ jobs: { jobs: [] }, shards: 8, selfJobName: 'Test' })).toThrow(/not an array/);
  });
});

describe('ci.yml wires the gate to its own matrix (#9499)', () => {
  /** The `test-aggregate` job block, comments stripped. */
  const aggregate = (() => {
    const body = ciYaml.slice(ciYaml.search(/^jobs:[ \t]*$/m));
    const at = body.search(/^ {2}test-aggregate:[ \t]*$/m);
    expect(at, 'ci.yml must still define a `test-aggregate:` job').toBeGreaterThan(-1);
    const rest = body.slice(at + 1);
    const next = rest.search(/^ {2}\S/m);
    return (next === -1 ? rest : rest.slice(0, next))
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n');
  })();

  it('passes the gate the width ci.yml actually runs', () => {
    // The one number this script does not derive. Pinning it here is what keeps
    // the matrix and the `--shards` argument from drifting apart silently —
    // locally and loudly, which is the difference from the repository-settings
    // surface the shard count used to be welded to.
    const declared = ciYaml.match(/^ {8}shard: \[([^\]]+)\]/m);
    expect(declared, 'ci.yml must still declare a `shard:` matrix').toBeTruthy();
    const width = declared![1].split(',').filter((s) => s.trim()).length;

    const passed = aggregate.match(/check-test-shard-results\.mjs --shards (\d+)/);
    expect(passed, '`test-aggregate` must still run the shard-results gate').toBeTruthy();
    expect(Number(passed![1]), 'the --shards argument and ci.yml\'s matrix have drifted apart').toBe(width);
  });

  it('tells the gate the name of the job it is running in', () => {
    // The gate refuses any verdict over a job list not containing this name, so
    // a wrong value here fails closed (exit 2, red) rather than vacuously green.
    const name = aggregate.match(/^ {4}name: (.+)$/m);
    expect(name, '`test-aggregate` must declare a `name:`').toBeTruthy();
    expect(aggregate).toContain(`--job-name '${name![1].trim()}'`);
  });

  it('needs every job whose result it speaks for, and reports whatever they did', () => {
    expect(aggregate).toMatch(/^ {4}needs: \[test, test-dist-pins\]$/m);
    // `always()` — without it a red or skipped shard SKIPS this job, and a
    // skipped required context counts as SUCCESS in branch protection.
    expect(aggregate).toMatch(/^ {4}if: always\(\) && github\.event_name != 'push'$/m);
    // `actions: read` is what the API read needs; a `permissions:` block sets
    // every unlisted scope to `none`, so its absence is a 403 and exit 2.
    expect(aggregate).toMatch(/^ {6}actions: read$/m);
  });

  it('asserts the dist-pin job too, so nothing in the lane is left ungated', () => {
    expect(aggregate).toContain('needs.test-dist-pins.result');
    expect(aggregate).toMatch(/!= 'success'/);
  });
});
