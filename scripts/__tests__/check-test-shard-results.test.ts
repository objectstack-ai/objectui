import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXIT_BREACHED,
  EXIT_CANNOT_RUN,
  EXIT_OK,
  REREAD_LIMIT,
  REREAD_WAIT_MS,
  evaluate,
  exitCodeFor,
  fetchJob,
  renderReading,
  settleReading,
  shardContexts,
  unconcludedShards,
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

/**
 * objectui#10931 — the recorded false red, as the fixture.
 *
 * `run-36042402511-attempt-1.json` is that merge-group run's job table as the
 * endpoint `fetchRunJobs()` calls answers it now: all eight shards `success`.
 * The aggregator read the same table at 2026-09-24T18:47:14Z and its log
 * printed `no conclusion  Test (shard 6/8)` with every other shard `success`,
 * so the as-read view below differs from the fixture in that one shard's
 * conclusion. The log did not print the shard's `status`, so that field is
 * dropped from the as-read record rather than guessed.
 */
type RecordedJob = { id: number; name: string; status: string; conclusion: string | null };
const recorded = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'scripts/__tests__/fixtures/test-shard-results/run-36042402511-attempt-1.json'), 'utf8'),
) as { jobs: RecordedJob[] };
const LATE = 'Test (shard 6/8)';
const lateJob = recorded.jobs.find((job) => job.name === LATE)!;

function asRead(jobs: RecordedJob[] = recorded.jobs): Record<string, unknown>[] {
  return jobs.map((job) => {
    if (job.name !== LATE) return job;
    const copy: Record<string, unknown> = { ...job, conclusion: null };
    delete copy.status;
    return copy;
  });
}

/** `settleReading` with a scripted re-read answer, no clock, and every call recorded. */
function settle(jobs: unknown[], answer: (jobId: number) => unknown) {
  const reread: number[] = [];
  const slept: number[] = [];
  const logged: string[] = [];
  const result = settleReading({
    jobs,
    shards: 8,
    selfJobName: 'Test',
    rereadJob: async (jobId: number) => {
      reread.push(jobId);
      return answer(jobId);
    },
    sleep: async (ms: number) => {
      slept.push(ms);
    },
    log: (line: string) => {
      logged.push(line);
    },
  });
  return { result, reread, slept, logged };
}

const settled = (jobId: number) => recorded.jobs.find((job) => job.id === jobId);
const withConclusion = (name: string, conclusion: string | null) =>
  recorded.jobs.map((job) => (job.name === name ? { ...job, conclusion } : job));

describe('check-test-shard-results — a present shard with no conclusion is re-read (objectui#10931)', () => {
  it('reproduces the recorded false red from the recorded job table', () => {
    // The control first: the fixture is the settled answer, and it is green.
    expect(recorded.jobs).toHaveLength(16);
    expect(read(recorded.jobs).verdict).toBe('intact');

    // One field changed, the one the log names: that is the ejection.
    const reading = read(asRead());
    expect(reading.verdict).toBe('breached');
    expect(exitCodeFor(reading)).toBe(EXIT_BREACHED);
    expect(reading.notSuccess).toEqual([`${LATE} (no conclusion)`]);
    expect(unconcludedShards(reading).map((s) => s.jobId)).toEqual([lateJob.id]);
  });

  it('⭐ re-reads only that shard, by its job id, and the settled answer is intact', async () => {
    const run = settle(asRead(), settled);
    const { reading, rereads } = await run.result;

    expect(reading.verdict).toBe('intact');
    expect(exitCodeFor(reading)).toBe(EXIT_OK);
    expect(rereads).toBe(1);
    expect(run.reread).toEqual([lateJob.id]);
    expect(run.slept).toEqual([REREAD_WAIT_MS]);
    expect(run.logged).toHaveLength(1);
    expect(run.logged[0]).toContain(String(lateJob.id));
  });

  it('⛔ never reads null as success: a shard that never answers stays red after the bound', async () => {
    const run = settle(asRead(), (jobId) => ({ ...settled(jobId), conclusion: null }));
    const { reading, rereads } = await run.result;

    expect(reading.verdict).toBe('breached');
    expect(exitCodeFor(reading)).toBe(EXIT_BREACHED);
    expect(reading.notSuccess).toEqual([`${LATE} (no conclusion)`]);
    expect(rereads).toBe(REREAD_LIMIT);
    expect(run.reread).toEqual(Array.from({ length: REREAD_LIMIT }, () => lateJob.id));
    expect(run.slept).toHaveLength(REREAD_LIMIT);
    expect(unconcludedShards(reading).map((s) => s.name)).toEqual([LATE]);
  });

  it('judges the re-read answer as it stands: a late `failure` is a failure', async () => {
    const run = settle(asRead(), (jobId) => ({ ...settled(jobId), conclusion: 'failure' }));
    const { reading, rereads } = await run.result;

    expect(reading.verdict).toBe('breached');
    expect(reading.notSuccess).toEqual([`${LATE} (failure)`]);
    expect(rereads).toBe(1);
  });

  it('⛔ never re-reads a shard that answered, `skipped` included — no blanket retry', async () => {
    for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped']) {
      const run = settle(withConclusion('Test (shard 3/8)', conclusion), settled);
      const { reading, rereads } = await run.result;

      expect(reading.verdict, `a ${conclusion} shard must stay red`).toBe('breached');
      expect(reading.notSuccess).toEqual([`Test (shard 3/8) (${conclusion})`]);
      expect(rereads).toBe(0);
      expect(run.reread).toEqual([]);
      expect(run.slept).toEqual([]);
    }
  });

  it('re-reads the late shard only, while a real failure beside it keeps the run red', async () => {
    const jobs = asRead(withConclusion('Test (shard 3/8)', 'failure'));
    const run = settle(jobs, settled);
    const { reading } = await run.result;

    expect(run.reread).toEqual([lateJob.id]);
    expect(reading.verdict).toBe('breached');
    expect(reading.notSuccess).toEqual(['Test (shard 3/8) (failure)']);
  });

  it('does not re-read an absent shard: that is drift, not a late answer', async () => {
    const run = settle(recorded.jobs.filter((job) => job.name !== 'Test (shard 8/8)'), settled);
    const { reading, rereads } = await run.result;

    expect(reading.missing).toEqual(['Test (shard 8/8)']);
    expect(rereads).toBe(0);
    expect(run.reread).toEqual([]);
  });

  it('does not re-read a reading that is not about this run', async () => {
    const run = settle(asRead().filter((job) => job.name !== 'Test'), settled);
    const { reading, rereads } = await run.result;

    expect(reading.verdict).toBe('unreadable');
    expect(exitCodeFor(reading)).toBe(EXIT_CANNOT_RUN);
    expect(rereads).toBe(0);
    expect(run.reread).toEqual([]);
  });

  it('re-reads one job by id on the single-job endpoint, and an HTTP error is not an answer', async () => {
    const urls: string[] = [];
    const reply = (status: number, body: unknown) =>
      (async (url: string | URL | Request) => {
        urls.push(String(url));
        return new Response(JSON.stringify(body), { status });
      }) as typeof fetch;
    const input = { repository: 'objectstack-ai/objectui', apiUrl: 'https://api.test', token: 't' };

    expect(await fetchJob(lateJob.id, { ...input, fetchImpl: reply(200, lateJob) })).toEqual(lateJob);
    expect(urls).toEqual([`https://api.test/repos/objectstack-ai/objectui/actions/jobs/${lateJob.id}`]);
    await expect(fetchJob(lateJob.id, { ...input, fetchImpl: reply(404, {}) })).rejects.toThrow(/HTTP 404/);
  });

  it('refuses a re-read that answers about another job, and a shard with no id to re-read', async () => {
    const shardOne = recorded.jobs.find((job) => job.name === 'Test (shard 1/8)');
    await expect(settle(asRead(), () => shardOne).result).rejects.toThrow(/not that job/);

    const withoutId = asRead().map((job) => {
      if (job.name !== LATE) return job;
      const copy = { ...job };
      delete copy.id;
      return copy;
    });
    await expect(settle(withoutId, settled).result).rejects.toThrow(/no job id/);
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

  it('keeps the re-read bound inside the job\'s own budget (objectui#10931)', () => {
    // The worst case is every re-read spent on a shard that never answers. It
    // must leave at least half of `timeout-minutes` for the checkout, the
    // reads themselves and the dist-pin step: a job killed by its timeout
    // reports `cancelled`, which the merge queue reads as a failure.
    const timeout = aggregate.match(/^ {4}timeout-minutes: (\d+)$/m);
    expect(timeout, '`test-aggregate` must declare its own `timeout-minutes`').toBeTruthy();
    expect(REREAD_LIMIT).toBeGreaterThan(0);
    expect(REREAD_LIMIT * REREAD_WAIT_MS).toBeLessThanOrEqual((Number(timeout![1]) * 60_000) / 2);
  });

  it('asserts the dist-pin job too, so nothing in the lane is left ungated', () => {
    expect(aggregate).toContain('needs.test-dist-pins.result');
    expect(aggregate).toMatch(/!= 'success'/);
  });
});
