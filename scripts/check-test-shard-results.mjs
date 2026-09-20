#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * check-test-shard-results -- the `Test` aggregator's verdict, taken one shard
 * at a time instead of from the matrix rollup.
 *
 *   node scripts/check-test-shard-results.mjs --shards 8 --job-name 'Test'
 *   node scripts/check-test-shard-results.mjs --shards 8 --fixture <path>
 *
 * Exit: 0 = a reading was taken and every shard reported `success`
 *       2 = the reading COULD NOT BE TAKEN -- never a pass
 *       3 = BREACH: a shard is missing, or did not report `success`
 *
 * ## Why this exists (objectui#9499, director ruling letter C)
 *
 * `.github/workflows/ci.yml`'s `test` job is a matrix, and until this file the
 * repository's required-check set named its legs one by one -- `Test (shard
 * 1/4)` … `Test (shard 4/4)`. That welds the SHARD COUNT to repository
 * settings: changing 4 to 8 renames four live required contexts, every pull
 * request then blocks forever on a check that can no longer report, and every
 * queue build burns the ruleset's 60-minute status-check timeout. One
 * aggregator context instead lets the matrix width move without a settings
 * edit -- which is what objectui#9499 needed, because at four shards the job
 * had grown into its own `timeout-minutes: 20` and was being CANCELLED.
 *
 * ## ⛔ The rollup is not the reading, and that is this file's whole subject
 *
 * The obvious aggregator asserts `needs.test.result == 'success'`. That
 * expression is a single ROLLUP over every leg of the matrix, and a rollup
 * cannot distinguish "all eight ran green" from "five ran green and three were
 * SKIPPED". A shard dropped from the matrix, or given a job-level `if:` that
 * is false, would therefore leave the one required test context GREEN while a
 * fraction of the suite never ran -- the objectui#8857 / objectui#3523 shape, a
 * check reporting success having run nothing.
 *
 * So the verdict is taken from the Actions API instead: this run's own job
 * list, each expected shard found BY NAME, and each one's OWN `conclusion`
 * read. `skipped` is not `success` here, which is the acceptance the ruling
 * names.
 *
 * ## An unreadable answer is never a pass
 *
 * A missing token, a 403, a truncated page: all exit 2 and a red context.
 * ⛔ And a verdict is refused entirely over a job list that does not contain
 * the aggregator's OWN job -- the control that the reading reached this run at
 * all. `GET /actions/runs/{id}/attempts/{n}/jobs` answers 200 with an empty
 * list for a run id that does not exist, so "no shards found" is otherwise
 * indistinguishable from "every shard was removed", and the second reading is
 * exactly the breach this gate is for.
 *
 * ## The shard COUNT is passed in, and pinned against the matrix
 *
 * `--shards` is the one number this file does not derive. Deriving it from the
 * workflow would mean a second YAML parser answering a question
 * `scripts/__tests__/workflow-checks.ts` already answers; instead
 * `scripts/__tests__/check-test-shard-results.test.ts` pins the argument
 * written in `ci.yml` against that same file's `shard: [...]` matrix, so the
 * two declarations cannot drift apart silently.
 */

import fs from 'node:fs';

import { isEntrypoint } from './invoked-as.mjs';

export const EXIT_OK = 0;
export const EXIT_CANNOT_RUN = 2;
export const EXIT_BREACHED = 3;

/** Verdicts, in the order they are decided. */
export const VERDICTS = Object.freeze(['unreadable', 'breached', 'intact']);

/**
 * The check-run names the `test` matrix produces at a given width.
 *
 * One spelling of `Test (shard N/M)` lives here and one lives in `ci.yml`'s
 * `name:`; the test file pins them against each other.
 *
 * @param {number} shards
 * @returns {string[]}
 */
export function shardContexts(shards) {
  if (!Number.isInteger(shards) || shards < 1) {
    throw new Error(`--shards must be a positive integer, got ${JSON.stringify(shards)}`);
  }
  return Array.from({ length: shards }, (_, i) => `Test (shard ${i + 1}/${shards})`);
}

/**
 * Judge one reading. Pure: no clock, no network, no process exit.
 *
 * @param {{ jobs: unknown, shards: number, selfJobName: string }} input
 */
export function evaluate({ jobs, shards, selfJobName }) {
  if (!Array.isArray(jobs)) {
    throw new Error(`the jobs endpoint answered ${typeof jobs}, not an array of jobs`);
  }
  if (!selfJobName) {
    throw new Error('selfJobName is required: it is the control that the reading reached this run');
  }

  /** @type {Map<string, string|null>} */
  const byName = new Map();
  for (const job of jobs) {
    if (!job || typeof job !== 'object') continue;
    const name = /** @type {{ name?: unknown }} */ (job).name;
    // ⛔ Never fall back to a neighbouring field. A job whose `name` this
    // cannot read is a job this gate did not see, and counting it as seen is
    // how a membership test goes vacuous.
    if (typeof name !== 'string') continue;
    const conclusion = /** @type {{ conclusion?: unknown }} */ (job).conclusion;
    byName.set(name, typeof conclusion === 'string' ? conclusion : null);
  }

  const expected = shardContexts(shards);
  const observed = expected.map((name) => ({ name, present: byName.has(name), conclusion: byName.get(name) ?? null }));
  const missing = observed.filter((s) => !s.present).map((s) => s.name);
  const notSuccess = observed.filter((s) => s.present && s.conclusion !== 'success').map((s) => `${s.name} (${s.conclusion ?? 'no conclusion'})`);

  const selfSeen = byName.has(selfJobName);
  const verdict = !selfSeen ? 'unreadable' : missing.length > 0 || notSuccess.length > 0 ? 'breached' : 'intact';

  const reading = { verdict, shards, selfJobName, selfSeen, jobCount: byName.size, observed, missing, notSuccess };
  assertGrounded(reading);
  return reading;
}

/**
 * Refuse a verdict the reading underneath it does not support. The direction
 * that matters is `intact`: a clean verdict over a job list this gate could not
 * find itself in is the silent pass it exists to make impossible.
 *
 * @param {ReturnType<typeof evaluate>} reading
 */
export function assertGrounded(reading) {
  if (!VERDICTS.includes(reading.verdict)) {
    throw new Error(`ungrounded: unknown verdict ${JSON.stringify(reading.verdict)}`);
  }
  if (reading.verdict === 'intact') {
    if (!reading.selfSeen) throw new Error('ungrounded: an intact verdict over a job list this job is not in');
    if (reading.observed.length === 0) throw new Error('ungrounded: an intact verdict over zero shards');
    if (reading.missing.length > 0 || reading.notSuccess.length > 0) {
      throw new Error('ungrounded: an intact verdict with a shard missing or not green');
    }
  }
  if (reading.verdict === 'breached' && reading.missing.length === 0 && reading.notSuccess.length === 0) {
    throw new Error('ungrounded: a breach with nothing missing and nothing red');
  }
}

/** @param {ReturnType<typeof evaluate>} reading */
export function exitCodeFor(reading) {
  if (reading.verdict === 'intact') return EXIT_OK;
  if (reading.verdict === 'unreadable') return EXIT_CANNOT_RUN;
  return EXIT_BREACHED;
}

/**
 * The lines a reading prints. Every shard is named with its own conclusion,
 * green or not: a verdict nobody can check against the run it judges is the
 * thing that sends a reader to the jobs API by hand.
 *
 * @param {ReturnType<typeof evaluate>} reading
 */
export function renderReading(reading) {
  const lines = [`read ${reading.jobCount} job(s) from this run; expecting ${reading.shards} test shard(s)`];
  for (const shard of reading.observed) {
    lines.push(`  ${shard.present ? (shard.conclusion ?? 'no conclusion') : 'ABSENT'}  ${shard.name}`);
  }
  if (reading.verdict === 'unreadable') {
    lines.push(
      `::error title=Test::could not take a reading -- this run's job list does not contain ` +
        `'${reading.selfJobName}', so the answer is not about this run. Refusing to report a verdict.`,
    );
  }
  if (reading.missing.length > 0) {
    lines.push(
      `::error title=Test::${reading.missing.length} test shard(s) produced no job at all: ` +
        `${reading.missing.join(', ')}. The matrix in ci.yml and the --shards argument to this ` +
        `gate have come apart; a shard nobody ran is a quarter of the suite nothing judged.`,
    );
  }
  if (reading.notSuccess.length > 0) {
    lines.push(
      `::error title=Test::${reading.notSuccess.length} test shard(s) did not report success: ` +
        `${reading.notSuccess.join(', ')}. ⛔ 'skipped' is not a pass here -- that is the whole ` +
        `reason this gate reads each shard instead of the matrix rollup (objectui#9499).`,
    );
  }
  if (reading.verdict === 'intact') lines.push(`all ${reading.shards} shards reported success`);
  return lines.join('\n');
}

/**
 * Every job of one workflow run ATTEMPT. The attempt is named explicitly: a
 * re-run creates a second attempt, and the run-level endpoint answers with the
 * jobs of the latest one, which on a re-run of a subset is not the set this
 * job is a member of.
 *
 * @param {{ token?: string, apiUrl?: string, repository?: string, runId?: string, attempt?: string, fetchImpl?: typeof fetch }} input
 */
export async function fetchRunJobs({
  token = process.env.GITHUB_TOKEN ?? '',
  apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com',
  repository = process.env.GITHUB_REPOSITORY ?? '',
  runId = process.env.GITHUB_RUN_ID ?? '',
  attempt = process.env.GITHUB_RUN_ATTEMPT ?? '1',
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!repository) throw new Error('GITHUB_REPOSITORY is not set');
  if (!runId) throw new Error('GITHUB_RUN_ID is not set');

  /** @type {Array<object>} */
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const route = `/repos/${repository}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100&page=${page}`;
    const res = await fetchImpl(`${apiUrl}${route}`, {
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GET ${route} -> HTTP ${res.status}`);
    const body = await res.json();
    const jobs = body?.jobs ?? [];
    all.push(...jobs);
    if (jobs.length < 100) break;
  }
  return all;
}

/**
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const at = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const shards = Number(at('--shards'));
  return { shards, jobName: at('--job-name') ?? 'Test', fixture: at('--fixture') };
}

/** @param {string[]} argv */
export async function main(argv) {
  const { shards, jobName, fixture } = parseArgs(argv);
  if (!Number.isInteger(shards) || shards < 1) {
    console.error('usage: node scripts/check-test-shard-results.mjs --shards <n> [--job-name <name>] [--fixture <path>]');
    return EXIT_CANNOT_RUN;
  }

  /** @type {unknown} */
  let jobs;
  try {
    jobs = fixture ? JSON.parse(fs.readFileSync(fixture, 'utf8')).jobs : await fetchRunJobs();
  } catch (error) {
    console.error(`::error title=Test::could not read this run's job list: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CANNOT_RUN;
  }

  const reading = evaluate({ jobs, shards, selfJobName: jobName });
  console.log(renderReading(reading));
  return exitCodeFor(reading);
}

if (isEntrypoint(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
