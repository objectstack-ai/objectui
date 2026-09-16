import { afterAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { audit, namedFiles, paragraphNaming, resolveNamed, treeIndex } from '../check-changeset-claims.mjs';

/**
 * objectui#9003 — a pending changeset's prose is judged by nothing.
 *
 * A `.changeset/*.md` body publishes VERBATIM into the CHANGELOG at the next
 * release, and between authoring and release nothing re-reads it when a later
 * merge falsifies it. This gate does not judge whether the prose is true — it
 * judges whether the body NAMES a file this change touches, and hands the
 * paragraph to the one seat that can answer the truth question cheaply.
 *
 * What this file pins, in the order the gate can fail:
 *
 *  1. **It can start on the pull request that needs it.** The falsifying change
 *     is an ordinary source change, so the gate lives in the workflow with NO
 *     path filter. That absence is the load-bearing property and is pinned here:
 *     adding a `paths:` filter to that workflow would blind this gate silently,
 *     which is the exact failure mode `changeset-guard.yml` can afford and this
 *     one cannot.
 *  2. **Both directions of the verdict**, against throwaway repositories rather
 *     than this one's history, so they stay decidable when the history moves. A
 *     report that fires, and a FIRING CONTROL — the same fixture with the named
 *     file left alone — so a green can never come from the gate looking at
 *     nothing.
 *  3. **The exclusions are deliberate, not accidents.** A changeset this change
 *     ADDS is never reported (which is also why the gate is blind to a BORN
 *     FALSE claim — objectui#8759 — and that limit is pinned as a limit). A
 *     changeset declaring no bump is never reported: its body never publishes.
 *     An ambiguously-named file is never reported: a span resolving to many
 *     files names none of them.
 *  4. **It can never block.** There is no enforcing switch, deliberately: a
 *     pending changeset naming a file you edited is usually still true.
 *  5. **Every missing input fails LOUD.** Report-only means the gate declines to
 *     fail on its FINDINGS — never that it passes without looking
 *     (objectstack#4928, objectui#4690).
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GATE = 'scripts/check-changeset-claims.mjs';
const WORKFLOW = '.github/workflows/changeset-presence.yml';

/**
 * A workflow's YAML with whole-line comments removed.
 *
 * Required, not cosmetic: this workflow's header discusses its own trigger set
 * at length, so a scan that counted the prose would report filter entries the
 * file does not have. Same helper, same reason, as in the sibling changeset
 * gate tests.
 */
function withoutComments(yaml: string): string {
  return yaml
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

const workflowYaml = withoutComments(fs.readFileSync(path.join(repoRoot, WORKFLOW), 'utf8'));

// ── fixture repositories ─────────────────────────────────────────────────────

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

interface Fixture {
  root: string;
  git: (...args: string[]) => string;
  write: (rel: string, body: string) => void;
  remove: (rel: string) => void;
  commit: (message: string) => string;
}

/**
 * A throwaway repository carrying pending changesets and the files they name.
 *
 * The package is `@fixture/alpha` on purpose: if the gate ever stopped reading
 * the tree and fell back to a hard-coded `@object-ui/*` surface, every
 * expectation below would flip.
 */
function fixtureRepo(label: string): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `changeset-claims-${label}-`));
  fixtures.push(root);

  const git = (...args: string[]): string =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

  const write = (rel: string, body: string): void => {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  };
  const remove = (rel: string): void => fs.rmSync(path.join(root, rel));
  const commit = (message: string): string => {
    execFileSync('git', ['add', '-A', '-f'], { cwd: root });
    execFileSync('git', ['commit', '-q', '-m', message], { cwd: root });
    return git('rev-parse', 'HEAD');
  };

  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'fixture@example.com');
  git('config', 'user.name', 'Fixture');

  write('.changeset/config.json', JSON.stringify({ fixed: [['@fixture/alpha']], ignore: [] }, null, 2));
  // Documentation, not a declaration. It matches `.changeset/*.md` and names a
  // file on purpose — it must still never be reported.
  write('.changeset/README.md', '# Changesets\n\nSee `reconciliation.test.ts` for an example.\n');

  // The shape of objectui#8617: a pending declaration whose body makes a
  // present-tense claim, in a paragraph, about a named file.
  write(
    '.changeset/6794-declared-default.md',
    '---\n' +
      "'@fixture/alpha': patch\n" +
      '---\n\n' +
      'The inspector now declares the default.\n\n' +
      'A reconciliation assertion in `reconciliation.test.ts` keeps the two sides pinned.\n' +
      'It reads the expected value out of the installed contract rather than pinning a literal.\n\n' +
      'The sibling controller is a separate card whose default flips on a bump still ahead.\n',
  );
  // Declares nothing: an empty-frontmatter no-release declaration. Its body
  // never reaches a CHANGELOG, so there is no verbatim publication to protect.
  write('.changeset/6800-internal-only.md', '---\n---\n\nInternal only; see `reconciliation.test.ts`.\n');
  // Names a file whose basename is ambiguous in this tree.
  write(
    '.changeset/6900-ambiguous.md',
    '---\n' + "'@fixture/alpha': patch\n" + '---\n\n' + 'Both barrels changed; see `index.ts`.\n',
  );

  write('packages/alpha/package.json', JSON.stringify({ name: '@fixture/alpha', version: '1.0.0' }));
  write('packages/alpha/src/index.ts', 'export const alpha = 1;\n');
  write('packages/alpha/src/reconciliation.test.ts', 'export const pinned = true;\n');
  write('packages/alpha/src/untouched.ts', 'export const untouched = true;\n');
  // The second `index.ts`, which is what makes that basename ambiguous.
  write('packages/beta/src/index.ts', 'export const beta = 1;\n');
  commit('base');

  return { root, git, write, remove, commit };
}

interface Run {
  status: number;
  output: string;
}

/**
 * Runs the real gate against a fixture, capturing status and both streams.
 *
 * BOTH streams on the success path too, not just on failure: this gate warns on
 * stderr while still exiting 0 — losing the DELIVERY hand-off is a warning, not
 * a verdict — and a harness that reads only stdout on a green run cannot see
 * that half of the output. In the job log the two streams are interleaved
 * anyway, so this is what a reader actually gets.
 */
function runGate(root: string, args: string[] = [], env: Record<string, string> = {}): Run {
  const run = spawnSync('node', [path.join(repoRoot, GATE), '--root', root, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
  return { status: run.status ?? -1, output: `${run.stdout ?? ''}${run.stderr ?? ''}` };
}

/** base..head for a fixture's last commit. */
function lastCommitRange(fixture: Fixture): string[] {
  return ['--base', fixture.git('rev-parse', 'HEAD~1'), '--head', fixture.git('rev-parse', 'HEAD')];
}

// ── 1. the gate can start on the pull request that needs it ──────────────────

describe('changeset-presence.yml — where this gate has to live', () => {
  it('exists, and the workflow runs it', () => {
    expect(fs.existsSync(path.join(repoRoot, GATE)), `${GATE} must exist for the workflow to run it`).toBe(true);
    expect(workflowYaml).toMatch(new RegExp(`run:\\s*node\\s+${GATE.replace(/[.]/g, '\\.')}`));
  });

  it('gives the job the history its diff needs', () => {
    // The gate compares this change against its MERGE BASE. checkout's default
    // is a depth-1 clone where `git merge-base` has nothing to find, and an
    // unresolvable base is exit 1 in the script rather than a skip — so getting
    // this wrong is a red build, not a silent pass. Pinned so it stays that way.
    expect(workflowYaml).toMatch(/fetch-depth:\s*0/);
  });

  it('carries NO paths filter — the property this gate depends on', () => {
    // `changeset-guard.yml` can afford a `paths: ['.changeset/**']` filter
    // because a change that modifies a changeset touches `.changeset/**` BY
    // DEFINITION. This gate's subject is the opposite: an ordinary source change
    // that falsifies somebody else's pending claim, which is under no obligation
    // to touch `.changeset/**` at all. A path filter added here would blind the
    // gate with no red anywhere, so its ABSENCE is pinned.
    expect(workflowYaml).not.toMatch(/^\s*paths(-ignore)?:/m);
  });
});

// ── 1b. the finding is DELIVERED, not archived (objectui#9140) ───────────────

describe('delivery — the ruling that the finding reaches the pull request', () => {
  // objectui#9140 measured the "REQUEST TO READ" at zero answers out of four
  // live instances, because it was addressed to a job log nobody opens on a
  // green check. The director's ruling (maintainer 「同意」) moves WHERE the
  // finding is read and ⛔ nothing else: exit 0, not a required context,
  // nothing blocks.
  it('hands this run\'s finding set to the renderer instead of re-measuring it', () => {
    // One measurement, two consumers. A report that re-derives its own subject
    // can disagree with the log it claims to report, and the disagreement is
    // invisible to both sides.
    expect(workflowYaml).toMatch(/node\s+scripts\/check-changeset-claims\.mjs\s+--json\s+claims\.json/);
    expect(workflowYaml).toMatch(
      /node\s+scripts\/render-changeset-claims-comment\.mjs\s+--from\s+claims\.json/,
    );
  });

  it('posts through the channel the Console Performance Budget report uses', () => {
    expect(workflowYaml).toMatch(/uses:\s*actions\/github-script@/);
    const budget = withoutComments(
      fs.readFileSync(path.join(repoRoot, '.github/workflows/performance-budget.yml'), 'utf8'),
    );
    expect(budget).toMatch(/uses:\s*actions\/github-script@/);
  });

  it('holds `pull-requests: write` on the JOB, leaving the declaration gate with a read-only token', () => {
    // A job-level block REPLACES the workflow-level one, so `contents: read`
    // has to be named again or checkout loses it. The workflow-level block must
    // stay read-only: the declaration gate above needs nothing but a checkout,
    // and a grant it does not use is a grant nobody is auditing.
    expect(workflowYaml).toMatch(/permissions:\n\s+contents: read\n\s+pull-requests: write/);
    expect(workflowYaml).toMatch(/^permissions:\n\s+contents: read\n/m);
    expect(workflowYaml).not.toMatch(/^permissions:\n\s+contents: read\n\s+pull-requests/m);
  });

  it('⛔ never subscribes `pull_request_target`, which would run this on a fork\'s branch with a write token', () => {
    expect(workflowYaml).not.toMatch(/pull_request_target/);
  });

  it('comments only on a pull request', () => {
    // A `merge_group` build has no pull request to comment on, and the gate
    // still has to REPORT there — so the delivery steps are conditioned and the
    // measuring step is not.
    const conditions = workflowYaml.match(/if: \$\{\{ github\.event_name == 'pull_request' \}\}/g) ?? [];
    expect(conditions.length).toBe(2);
  });

  it('cannot paint this job red by failing to post', () => {
    // A fork's pull request gets a read-only token and the API call fails for a
    // reason that says nothing about changesets. Report-only means the gate
    // declines to fail on its FINDINGS; it must not start failing on its
    // PLUMBING either.
    expect(workflowYaml).toMatch(/continue-on-error: true/);
  });
});

// ── 2. both directions of the verdict ────────────────────────────────────────

describe('a change that edits a file a pending changeset NAMES', () => {
  const fixture = fixtureRepo('names-edited');
  fixture.write('packages/alpha/src/reconciliation.test.ts', 'export const pinned = false;\n');
  fixture.write('.changeset/7000-this-change.md', '---\n' + "'@fixture/alpha': patch\n" + '---\n\nThis change.\n');
  fixture.commit('fix(alpha): flip the reconciliation pin');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('reports the changeset that names it', () => {
    expect(run.output).toContain('.changeset/6794-declared-default.md');
    expect(run.output).toContain('names `reconciliation.test.ts`');
    expect(run.output).toContain('packages/alpha/src/reconciliation.test.ts');
    expect(run.output).toContain('edited by this change');
  });

  it('quotes the PARAGRAPH, not the line (objectui#8617)', () => {
    // Both false halves of that card's claim sat in ONE paragraph, and
    // correcting either alone would have left the paragraph asserting the same
    // wrong thing. A reader handed one line corrects one line.
    expect(run.output).toContain('A reconciliation assertion in `reconciliation.test.ts` keeps the two sides pinned.');
    expect(run.output).toContain('It reads the expected value out of the installed contract');
  });

  it('says out loud that it is NOT calling the paragraph false', () => {
    expect(run.output).toContain('NOT a claim that any of those paragraphs is false');
  });

  it('names the correction path and the gate that will report it', () => {
    // Triage fenced weakening the discouragement gate. The answer is an
    // EXPLICIT path, not a hole: the report says the correction is precedented,
    // that the overwrite gate reports it, and that the report is that gate's own
    // legitimate case.
    expect(run.output).toContain('CORRECT THE BODY');
    expect(run.output).toContain('check-changeset-overwrite.mjs');
    expect(run.output).toContain('legitimate');
  });

  it('does not block', () => {
    expect(run.status).toBe(0);
  });

  it('is not coupled to the overwrite gate\'s enforcement switch', () => {
    // That switch belongs to a different gate. If flipping it ever failed this
    // one, a maintainer revisiting the overwrite measurement would silently
    // acquire a blocking prose gate nobody decided on.
    const enforced = runGate(fixture.root, lastCommitRange(fixture), { OS_CHANGESET_OVERWRITE_ENFORCE: '1' });
    expect(enforced.status).toBe(0);
  });
});

describe('the firing control — the same fixture with the named file left alone', () => {
  const fixture = fixtureRepo('firing-control');
  fixture.write('packages/alpha/src/untouched.ts', 'export const untouched = false;\n');
  fixture.write('.changeset/7001-elsewhere.md', '---\n' + "'@fixture/alpha': patch\n" + '---\n\nElsewhere.\n');
  fixture.commit('fix(alpha): change a file nothing pending names');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is green, and green because it LOOKED', () => {
    // The whole point of pairing this with the case above: a silent run must be
    // provably a silent run over a read population, not a run that read nothing.
    // The identical fixture reports when the named file is the one edited.
    expect(run.output).toContain('No pending changeset names a file this change touches');
    expect(run.status).toBe(0);
  });

  it('states the population it read', () => {
    expect(run.output).toMatch(/read against 2 pending declaration\(s\) that publish a body \(3 pending in total\)/);
  });
});

// ── 3. the exclusions, each one deliberate ───────────────────────────────────

describe('a changeset THIS change adds', () => {
  const fixture = fixtureRepo('own-changeset');
  fixture.write('packages/alpha/src/untouched.ts', 'export const untouched = false;\n');
  fixture.write(
    '.changeset/7002-mine.md',
    '---\n' + "'@fixture/alpha': patch\n" + '---\n\nRewrote `untouched.ts` entirely.\n',
  );
  fixture.commit('fix(alpha): rewrite untouched');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is never reported — and that is the BORN-FALSE blind spot, pinned as a limit', () => {
    // objectui#8759 was born false: authored against the merge base while
    // describing the head. Excluding a change's own changesets is what makes the
    // gate readable at all (they name their own files by construction), and it
    // is exactly why this gate cannot see that sub-shape. It says so in its own
    // output rather than letting a reader assume coverage.
    expect(run.output).toContain('No pending changeset names a file this change touches');
    expect(run.status).toBe(0);
  });
});

describe('a changeset that declares no bump', () => {
  const fixture = fixtureRepo('no-release');
  fixture.write('packages/alpha/src/reconciliation.test.ts', 'export const pinned = false;\n');
  fixture.remove('.changeset/6794-declared-default.md');
  fixture.commit('chore(alpha): leave only the empty-frontmatter declaration');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is never reported — its body never publishes', () => {
    // 427 of the 1,384 pending in this repository are these. They declare "no
    // release"; nothing in them reaches a CHANGELOG, so there is no verbatim
    // publication to protect.
    expect(run.output).not.toContain('6800-internal-only');
    expect(run.output).toContain('No pending changeset names a file this change touches');
  });
});

describe('a file named ambiguously', () => {
  const fixture = fixtureRepo('ambiguous');
  fixture.write('packages/alpha/src/index.ts', 'export const alpha = 2;\n');
  fixture.commit('fix(alpha): edit one of the two barrels');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is never reported — a span resolving to many files names none of them', () => {
    // Picking one would invent a claim the author did not make. Dropping
    // ambiguity is also the filter that keeps the report readable: `package.json`
    // resolves to 47 files in this workspace and therefore names nothing.
    expect(run.output).not.toContain('6900-ambiguous');
    expect(run.output).toContain('No pending changeset names a file this change touches');
  });
});

describe('a file the change DELETES', () => {
  const fixture = fixtureRepo('deleted');
  fixture.remove('packages/alpha/src/reconciliation.test.ts');
  fixture.write('.changeset/7003-retire.md', '---\n' + "'@fixture/alpha': patch\n" + '---\n\nRetired.\n');
  fixture.commit('refactor(alpha): retire the reconciliation pin');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is reported at the louder severity', () => {
    // The named path will not exist after this change, so the sentence names
    // something that is not there. Still report-only: a changeset that retired a
    // file names it correctly and the file is correctly gone.
    expect(run.output).toContain('.changeset/6794-declared-default.md');
    expect(run.output).toContain('THIS CHANGE LEAVES NO SUCH FILE');
    expect(run.status).toBe(0);
  });
});

describe('.changeset/README.md', () => {
  const fixture = fixtureRepo('readme');
  fixture.write('packages/alpha/src/reconciliation.test.ts', 'export const pinned = false;\n');
  fixture.commit('fix(alpha): flip the pin');
  const run = runGate(fixture.root, lastCommitRange(fixture));

  it('is documentation, never a declaration', () => {
    expect(run.output).not.toContain('README.md');
  });
});

// ── 4. never silent ──────────────────────────────────────────────────────────

describe('an input the gate cannot read', () => {
  const fixture = fixtureRepo('unreadable');

  it('is exit 1, never a quiet pass', () => {
    // Report-only means this gate declines to fail on its FINDINGS. It never
    // means it passes without looking (objectstack#4928, objectui#4690).
    const run = runGate(fixture.root, ['--base', 'refs/heads/no-such-base-ref']);
    expect(run.status).toBe(1);
    expect(run.output).toContain('Cannot resolve the commit to compare against');
    expect(run.output).toContain('never that it passes without looking');
  });
});

// ── 5. the readers, in isolation ─────────────────────────────────────────────

describe('namedFiles', () => {
  it('reads backticked file names and nothing else', () => {
    const source = 'Touches `evaluator.ts` and `flow-node-config.spec-reconciliation.test.ts`.';
    expect(namedFiles(source)).toEqual(['evaluator.ts', 'flow-node-config.spec-reconciliation.test.ts']);
  });

  it('ignores an unbackticked mention', () => {
    // An unbackticked phrase has no boundary a parser can trust, and widening to
    // bare words is how this becomes a symbol matcher — the shape measured at
    // 191 paragraphs per commit and rejected.
    expect(namedFiles('Touches evaluator.ts in passing.')).toEqual([]);
  });

  it('ignores a symbol, a package name and a prose span', () => {
    expect(namedFiles('`evaluateCondition` in `@object-ui/permissions` returns `true`.')).toEqual([]);
  });
});

describe('paragraphNaming', () => {
  const body = 'First claim about `a.ts`.\n\nSecond paragraph, two sentences. It also mentions `b.ts` here.\n';

  it('returns the whole paragraph, not the sentence', () => {
    expect(paragraphNaming(body, 'b.ts')).toBe('Second paragraph, two sentences. It also mentions `b.ts` here.');
  });

  it('returns null when the span is not in the body', () => {
    expect(paragraphNaming(body, 'c.ts')).toBeNull();
  });
});

describe('resolveNamed', () => {
  const index = treeIndex(repoRoot, null);

  it('resolves an unambiguous basename in this repository', () => {
    expect(resolveNamed(index, 'check-changeset-claims.mjs')).toBe(GATE);
  });

  it('sees a file that is written but not committed yet', () => {
    // Without untracked files in the listing, this gate would resolve a name
    // to nothing locally and to something in CI — disagreeing with itself
    // depending on who ran it. The gate's own source is the case: it is
    // untracked in the worktree that writes it and tracked by the time CI
    // reads it, and it must resolve either way.
    expect(resolveNamed(index, 'check-changeset-overwrite.mjs')).toBe('scripts/check-changeset-overwrite.mjs');
  });

  it('refuses an ambiguous one, with no hand-maintained denylist', () => {
    // `package.json` resolves to dozens of tracked files here. Precision comes
    // from resolution against the tree, not from a list somebody has to keep.
    expect(resolveNamed(index, 'package.json')).toBeNull();
  });
});

// ── 6. the blind spot is COUNTED, not hand-counted per incident ──────────────

/**
 * objectui#9140 — the shape this gate cannot see, made measurable.
 *
 * objectui#9065 was five WENT-FALSE claims at once; the gate named four and was
 * blind to the fifth. The fifth's body names no file at all — it coordinates
 * itself by SYMBOL — so no diff can make the diff-mode check speak about it.
 * That was established by counting backticked spans BY HAND, once, on one card.
 *
 * `--audit` now counts the population instead, so the size of the blind spot is
 * re-derived on every run rather than written down (AGENTS.md rule #9). What is
 * pinned here is the COUNTER, in both directions:
 *
 *   - a symbol-coordinated body is counted as outside the reach (it fires), and
 *   - the FIRING NEGATIVE CONTROL: the same body with one resolvable file name
 *     added is NOT counted there. Without that leg, "the census sees it" cannot
 *     be told apart from "the census counts everything".
 *
 * The limit itself is pinned too: even when the change edits the very file the
 * symbol-only body is about, the diff-mode gate still reports nothing about it.
 * ⛔ That is the card's finding, pinned AS A LIMIT — not a bug to be fixed by
 * loosening the coordinate, which objectui#9140 measured and left open.
 */
describe('objectui#9140 — bodies this gate can never reach', () => {
  /** A fixture carrying one symbol-coordinated pending body. */
  function blindFixture(label: string, body: string): Fixture {
    const fixture = fixtureRepo(label);
    fixture.write('.changeset/9140-symbol-coordinated.md', body);
    fixture.commit('a pending declaration that coordinates itself by symbol');
    return fixture;
  }

  // The shape of `.changeset/7165-grid-dependent-values.md`: every coordinate it
  // offers is a symbol, and not one of them is spelled as a file name.
  const SYMBOL_ONLY =
    '---\n' +
    "'@fixture/alpha': patch\n" +
    '---\n\n' +
    'The inline editor now supplies `dependentValues`, so a `dependsOn` column is\n' +
    'no longer permanently uneditable. `renderCellEditor` passes the saved row.\n';

  it('counts a symbol-coordinated body as outside the reach', () => {
    const fixture = blindFixture('blind', SYMBOL_ONLY);
    const totals = audit(fixture.root, null);

    expect(totals.silent, 'a body naming no file is outside the diff-mode reach').toBeGreaterThanOrEqual(1);
    expect(totals.blind.join('\n')).toContain('.changeset/9140-symbol-coordinated.md');
  });

  it('FIRING NEGATIVE CONTROL — the same body naming one resolvable file is NOT counted there', () => {
    // Known direction, and it must move: the ONLY edit between the two fixtures
    // is one added backticked file name that resolves to exactly one tracked
    // file. If the census counted every body, this leg would read identically
    // to the one above and prove nothing.
    const blind = audit(blindFixture('blind-ctl-a', SYMBOL_ONLY).root, null);
    const seeing = audit(
      blindFixture('blind-ctl-b', SYMBOL_ONLY.replace('the saved row.', 'the saved row, in `reconciliation.test.ts`.'))
        .root,
      null,
    );

    const named = '.changeset/9140-symbol-coordinated.md';
    expect(blind.blind.join('\n'), 'the symbol-only body IS in the blind list').toContain(named);
    expect(seeing.blind.join('\n'), 'adding one resolvable file name takes it OUT').not.toContain(named);
    // Non-empty guard: both runs must have looked at the same publishing
    // population, so the difference above cannot come from one side reading
    // nothing at all.
    expect(seeing.publishing, 'both runs read the same publishing population').toBe(blind.publishing);
    expect(blind.publishing).toBeGreaterThan(0);
    expect(seeing.silent, 'the control body left the silent population').toBe(blind.silent - 1);
  });

  it('pins the LIMIT: the diff-mode gate stays silent even when the change edits the file that body is about', () => {
    const fixture = blindFixture('blind-limit', SYMBOL_ONLY);
    // `renderCellEditor` is a symbol this body names. Edit the file that
    // declares it — the exact shape of the falsifying merge on objectui#9065.
    fixture.write('packages/alpha/src/reconciliation.test.ts', 'export const renderCellEditor = () => null;\n');
    fixture.commit('edit the file the symbol-only body is about');

    const run = runGate(fixture.root, lastCommitRange(fixture));

    expect(run.status, 'report-only: still exit 0').toBe(0);
    expect(run.output, 'the symbol-coordinated body is never reported').not.toContain(
      '9140-symbol-coordinated.md',
    );
    // Control with a known direction that HITS in this same run: the gate did
    // look, and it can still speak about a body that names that same file.
    expect(run.output, 'the gate was not simply silent about everything').toContain(
      '.changeset/6794-declared-default.md',
    );
  });
});

// ── 6. the delivery hand-off is a real artefact of the real run ──────────────

describe('--json, the hand-off the pull request comment is rendered from', () => {
  const fixture = fixtureRepo('json-handoff');
  fixture.write('packages/alpha/src/reconciliation.test.ts', 'export const pinned = false;\n');
  fixture.commit('fix(alpha): flip the reconciliation pin');
  const handOff = path.join(fixture.root, 'claims.json');
  const run = runGate(fixture.root, [...lastCommitRange(fixture), '--json', handOff]);

  it('writes the finding set this run measured', () => {
    const written = JSON.parse(fs.readFileSync(handOff, 'utf8'));
    expect(written.findings).toHaveLength(1);
    expect(written.findings[0].changeset).toBe('.changeset/6794-declared-default.md');
    expect(written.findings[0].file).toBe('packages/alpha/src/reconciliation.test.ts');
    expect(written.findings[0].paragraph).toContain('keeps the two sides pinned');
  });

  it('carries the population the log reports, so the comment cannot contradict it', () => {
    const written = JSON.parse(fs.readFileSync(handOff, 'utf8'));
    expect(run.output).toContain(`read against ${written.considered} pending declaration(s)`);
    expect(run.output).toContain(`(${written.pending} pending in total)`);
  });

  it('still exits 0 — delivery moved where the finding is read, never what the gate does', () => {
    expect(run.status).toBe(0);
  });

  it('writes an EMPTY finding list rather than no file, so the renderer can resolve a stale request', () => {
    const quiet = fixtureRepo('json-handoff-quiet');
    quiet.write('packages/alpha/src/untouched.ts', 'export const untouched = false;\n');
    quiet.commit('fix(alpha): change a file nothing pending names');
    const quietHandOff = path.join(quiet.root, 'claims.json');
    const quietRun = runGate(quiet.root, [...lastCommitRange(quiet), '--json', quietHandOff]);
    expect(quietRun.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(quietHandOff, 'utf8')).findings).toEqual([]);
  });

  it('⛔ never fails the gate over its own plumbing', () => {
    // An unwritable hand-off loses the DELIVERY. The verdict is the log and it
    // is already printed, so exit 1 here would be this gate failing a build
    // over a broken pipe — the one thing report-only forbids.
    const broken = runGate(fixture.root, [
      ...lastCommitRange(fixture),
      '--json',
      path.join(fixture.root, 'no-such-directory', 'claims.json'),
    ]);
    expect(broken.status).toBe(0);
    expect(broken.output).toContain('Could not write');
  });
});
