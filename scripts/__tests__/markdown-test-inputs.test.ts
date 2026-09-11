/**
 * The firing control for objectui#8861 — a markdown-only pull request must now
 * run the shard that reads the markdown.
 *
 * ## Why a green run is not evidence here
 *
 * The defect this file guards is invisible in the one way that matters: it makes
 * CI green. objectui#8857 changed exactly one file,
 * `packages/plugin-dashboard/README.md`, and the test that reads that README
 * extracts its fences and evaluates them. Every check on the pull request page
 * was green — `Test (shard 1/4)` reported success in ten seconds having run
 * nothing — and the merge_group build then failed the same shard in 907 seconds
 * and dequeued the pull request.
 *
 * ⇒ a test that only checks the NEW behaviour cannot tell a working trigger from
 * one that always says `true`, and a test that runs the class derivation without
 * running the workflow cannot tell a correct class from a step that never asks
 * it. So this file drives the REAL step, extracted from `ci.yml` and executed by
 * bash against a real git repository, and it drives it in THREE directions:
 *
 *   fires   the objectui#8857 shape — one package README a test reads — now
 *           yields `should_run=true`.
 *   before  the SAME input through the `type-check` job's copy of the same step,
 *           which is the unwidened shape, yields `should_run=false`. That copy
 *           is not a reconstruction: `ci.yml` carries three copies of this step
 *           and the other two are untouched by this change, so the "before"
 *           answer is a real one taken from the file rather than from history.
 *   inert   a markdown document nothing reads still yields `should_run=false`,
 *           through the WIDENED step. Without this leg, deleting the exclusions
 *           entirely would pass every other assertion in this file.
 *
 * The inert leg uses a markdown document the pull request ADDS, which is inert by
 * construction: nothing in the tree can read a file that did not exist.
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADJUDICATED,
  auditTree,
  declaredEntries,
  deriveCandidates,
  markdownTestInputsAmong,
  missingDocuments,
} from '../markdown-test-inputs.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CI_YML = path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml');

/** The document objectui#8857 changed, and the test that reads it. */
const INSTANCE_DOCUMENT = 'packages/plugin-dashboard/README.md';
const INSTANCE_READER =
  'packages/plugin-dashboard/src/__tests__/readme-dashboard-examples-spec-valid.test.ts';

/* ── extracting the real step ────────────────────────────────────────────── */

const STEP_HEADER =
  '      - name: Decide whether this change needs a full run\n        id: relevant\n        run: |\n';

/**
 * The `run:` bodies of every copy of the decision step, in file order.
 *
 * Textual rather than YAML-parsed for the same reason `workflow-checks.ts` gives:
 * what is under test is the bytes CI runs, and a parser that normalised them
 * would be testing its own normalisation.
 */
function decisionSteps(yaml: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (;;) {
    const at = yaml.indexOf(STEP_HEADER, from);
    if (at === -1) break;
    const start = at + STEP_HEADER.length;
    const body: string[] = [];
    for (const line of yaml.slice(start).split('\n')) {
      if (line.trim() === '') {
        body.push(line);
        continue;
      }
      if (!line.startsWith('          ')) break;
      body.push(line);
    }
    out.push(`${body.join('\n').trimEnd()}\n`);
    from = start;
  }
  return out;
}

const YAML = readFileSync(CI_YML, 'utf8');
const STEPS = decisionSteps(YAML);
/** `ci.yml` declares the gated jobs in this order. */
const [TYPE_CHECK_STEP, TEST_STEP, E2E_STEP] = STEPS;

/* ── a real repository, a real bash run ──────────────────────────────────── */

type Outcome = { shouldRun: string; log: string };

let scratch = '';

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

/**
 * Build a repository whose pull request changes exactly `files`, and run one
 * copy of the step against it.
 *
 * The scripts the step calls are copied in AFTER both commits, so they are
 * untracked and cannot appear in the diff the step reads — the pull request
 * under test really does change nothing but `files`.
 */
function runStep(step: string, files: Record<string, string>): Outcome {
  const repo = mkdtempSync(path.join(scratch, 'pr-'));
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.email', 'ci@example.invalid');
  git(repo, 'config', 'user.name', 'CI');
  writeFileSync(path.join(repo, 'seed.txt'), 'base\n');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();

  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.join(repo, path.dirname(rel)), { recursive: true });
    writeFileSync(path.join(repo, rel), body);
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'pull request');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();

  mkdirSync(path.join(repo, 'scripts'), { recursive: true });
  for (const name of ['markdown-test-inputs.mjs', 'invoked-as.mjs', 'js-comment-mask.mjs']) {
    copyFileSync(path.join(REPO_ROOT, 'scripts', name), path.join(repo, 'scripts', name));
  }

  const script = step
    .split('${{ github.event_name }}')
    .join('pull_request')
    .split('${{ github.event.pull_request.base.sha }}')
    .join(base)
    .split('${{ github.event.pull_request.head.sha }}')
    .join(head);
  const scriptPath = path.join(repo, 'step.sh');
  writeFileSync(scriptPath, script);
  const outputPath = path.join(repo, 'github-output');
  writeFileSync(outputPath, '');

  // `bash -e {0}` is the shell GitHub runs a `run:` block with on Linux.
  const log = execFileSync('bash', ['-e', scriptPath], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_OUTPUT: outputPath },
  });
  const written = readFileSync(outputPath, 'utf8').trim();
  return { shouldRun: written.replace(/^should_run=/, ''), log };
}

beforeAll(() => {
  scratch = mkdtempSync(path.join(tmpdir(), 'markdown-test-inputs-'));
});
afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

/* ── the step this file is about ─────────────────────────────────────────── */

describe('the decision step, as `ci.yml` writes it', () => {
  it('carries three copies, and only the `test` job asks about markdown inputs', () => {
    expect(STEPS).toHaveLength(3);
    expect(TEST_STEP).toContain('scripts/markdown-test-inputs.mjs');
    expect(TYPE_CHECK_STEP).not.toContain('markdown-test-inputs');
    expect(E2E_STEP).not.toContain('markdown-test-inputs');
  });

  it('asks the markdown question only AFTER the unwidened diff came back empty', () => {
    // Order is the optimisation. If the markdown stage ran first, or ran
    // unconditionally, every pull request would pay for it.
    const exclusions = TEST_STEP.indexOf(":(exclude,glob)**/*.md'");
    const markdown = TEST_STEP.indexOf('markdown-test-inputs.mjs');
    expect(exclusions).toBeGreaterThan(-1);
    expect(markdown).toBeGreaterThan(exclusions);
  });

  it('fails toward the full run, in both of the new failure branches', () => {
    // The posture this step already had (objectstack#4928): a question that
    // cannot be answered means RUN. Every `if !` capture in the widened step
    // must reach a `should_run=true`, never a skip.
    const failures = TEST_STEP.split('\n').filter((line) => /^\s*if ! /.test(line));
    expect(failures.length).toBeGreaterThanOrEqual(3);
    for (const failure of failures) {
      const at = TEST_STEP.indexOf(failure);
      const branch = TEST_STEP.slice(at, TEST_STEP.indexOf('fi', at));
      expect(branch, `${failure.trim()} must run everything when it fails`).toContain(
        "echo 'should_run=true'",
      );
    }
  });
});

/* ── the firing control, all three directions ────────────────────────────── */

describe('the objectui#8857 pull request shape', () => {
  const FILES = { [INSTANCE_DOCUMENT]: '# Dashboard\n\nA fence a test evaluates.\n' };

  it('FIRES: the widened `test` step runs everything, and says which document', () => {
    const outcome = runStep(TEST_STEP, FILES);
    expect(outcome.shouldRun).toBe('true');
    expect(outcome.log).toContain(INSTANCE_DOCUMENT);
  });

  it('BEFORE: the same input through the unwidened copy of the step still skips', () => {
    // Not a reconstruction of the old step — the `type-check` job's copy IS the
    // shape the `test` job's copy had, and this change left it alone.
    const outcome = runStep(TYPE_CHECK_STEP, FILES);
    expect(outcome.shouldRun).toBe('false');
  });

  it('INERT: a markdown document nothing reads still skips, through the WIDENED step', () => {
    // Added by the pull request, so inert by construction. Without this leg a
    // step that answered `true` unconditionally would pass everything above.
    const outcome = runStep(TEST_STEP, {
      'packages/plugin-grid/NOTES.md': '# Notes\n\nNothing reads this.\n',
      '.changeset/quiet-owls-tickle.md': '---\n---\n\nNo release.\n',
    });
    expect(outcome.shouldRun).toBe('false');
  });

  it('CONTROL: the widened step still runs everything for an ordinary source change', () => {
    // The harness has to be able to say `true` for the boring reason, or the
    // `false` legs above prove nothing about the harness.
    const outcome = runStep(TEST_STEP, { 'packages/plugin-grid/src/index.ts': 'export {};\n' });
    expect(outcome.shouldRun).toBe('true');
  });
});

/* ── the derivation behind the answer ────────────────────────────────────── */

describe('the derived class', () => {
  it('names the objectui#8857 document and the test that reads it', () => {
    const verdict = ADJUDICATED.get(INSTANCE_READER);
    expect(verdict, `${INSTANCE_READER} must be adjudicated`).toBeDefined();
    expect(verdict?.reads).toContain(INSTANCE_DOCUMENT);
    expect(markdownTestInputsAmong([INSTANCE_DOCUMENT]).map((hit) => hit.path)).toEqual([
      INSTANCE_DOCUMENT,
    ]);
  });

  it('every candidate the scanner finds has been adjudicated, and every entry exists', () => {
    const candidates = deriveCandidates();
    // A collapsed scan reads as a pass — assert the population, not just the
    // verdict (objectui#8468).
    expect(candidates.size).toBeGreaterThan(20);
    expect(candidates.has(INSTANCE_READER)).toBe(true);
    expect(auditTree(candidates)).toEqual([]);
    expect(missingDocuments()).toEqual([]);
    expect(declaredEntries().length).toBeGreaterThan(0);
  });

  it('the audit can FAIL — an unadjudicated reader is a finding, not a shrug', () => {
    const planted = new Map([
      ['packages/plugin-grid/src/__tests__/invented.test.ts', { documents: ['README.md'], walks: false }],
    ]);
    const findings = auditTree(planted);
    expect(findings.map((finding) => finding.kind)).toContain('unadjudicated-test');
  });

  it('the audit can fail the other way — a rejected candidate is recorded, not dropped', () => {
    const planted = new Map([
      [INSTANCE_READER, { documents: [INSTANCE_DOCUMENT, 'ROADMAP.md'], walks: false }],
    ]);
    const findings = auditTree(planted);
    expect(findings.map((finding) => finding.kind)).toContain('unadjudicated-document');
  });

  it('a declared tree covers a document added inside it, and nothing outside it', () => {
    expect(declaredEntries()).toContain('content/docs/**');
    expect(markdownTestInputsAmong(['content/docs/guide/a-page-added-today.md'])).toHaveLength(1);
    expect(markdownTestInputsAmong(['content/docs/guide/a-page-added-today.json'])).toHaveLength(0);
    expect(markdownTestInputsAmong(['packages/plugin-grid/README.md'])).toHaveLength(0);
  });
});
