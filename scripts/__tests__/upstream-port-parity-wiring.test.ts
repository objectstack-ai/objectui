import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { selfTestCases, stripAnsi, verdictCount } from './helpers/child-verdict';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const GATE = 'scripts/check-upstream-port-parity.mjs';
const PIN = 'scripts/upstream-port-pin.json';

/**
 * objectui#6642: `scripts/pm/check-half-states.mjs` was copied here from
 * objectstack (objectui#5791) and then drifted for months with nothing able to
 * see it. Measured the day this gate landed: 9,340 lines here against 12,948
 * upstream — a 4,637-line `diff` — and 1,116 self-test cases here against
 * upstream's 1,574. The patrol kept rendering a confident report with the
 * missing predicates' rows simply absent.
 *
 * The gate closes that. This file pins the gate to its WIRING, in the direction
 * that goes wrong quietly: a parity check nobody runs is indistinguishable from
 * a parity check that passes — which is exactly the state the ported sweeper
 * was already in, one level down.
 *
 * Deliberately NOT asserted here: any digest, any line count, or the number of
 * declared divergences. Those live in the pin, they move every time someone
 * re-syncs, and a copy of them here would be a second thing to keep honest —
 * the lesson `lint-workflow.test.ts` records at length for this same workflow.
 * What is asserted is that the mechanism is reachable, runs, and is not
 * vacuous.
 */
describe('check-upstream-port-parity is wired, not merely present', () => {
  const workflow = parseYaml(fs.readFileSync(path.join(ROOT, '.github/workflows/lint.yml'), 'utf8'));
  const steps: Array<Record<string, unknown>> = workflow.jobs.lint.steps;
  const gateSteps = steps.filter((s) => typeof s.run === 'string' && (s.run as string).includes(GATE));

  it('the gate script and its pin both exist', () => {
    expect(fs.existsSync(path.join(ROOT, GATE))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, PIN))).toBe(true);
  });

  it('package.json aliases it, and the alias points at the script that exists', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const alias = pkg.scripts['check:upstream-port-parity'];
    expect(alias).toBeTruthy();
    expect(alias).toContain(GATE);
  });

  it('lint.yml runs it — exactly one step, both legs', () => {
    expect(gateSteps).toHaveLength(1);
    const run = gateSteps[0].run as string;
    expect(run).toContain(`node ${GATE} --self-test`);
    expect(run.split('\n').some((l) => l.trim() === `node ${GATE}`)).toBe(true);
  });

  it('that step is not disabled — it runs whenever the job runs its other steps', () => {
    // The same guard the rest of the job uses, read off a sibling rather than
    // hard-coded: objectui#3523's shape may be renamed, and a test pinning the
    // literal would fail on a rename while a step commented out with
    // `if: false` would not.
    const condition = gateSteps[0].if;
    const others = steps
      .filter((s) => s !== gateSteps[0] && typeof s.uses !== 'undefined')
      .map((s) => s.if);
    expect(others).toContain(condition);
  });

  it('it runs BEFORE pnpm install, so an install failure cannot take it with it', () => {
    const gateIndex = steps.indexOf(gateSteps[0]);
    const installIndex = steps.findIndex(
      (s) => typeof s.run === 'string' && (s.run as string).includes('pnpm install'),
    );
    expect(installIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeLessThan(installIndex);
  });

  it('the pin really pins the ported sweeper — the file the card is about', () => {
    // The one content assertion, and it is about COVERAGE rather than about
    // values: a pin that stopped naming `check-half-states.mjs` would leave the
    // gate green while the drift it was written for resumed.
    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8'));
    const pinned = pin.files.map((f: { ported: string }) => f.ported);
    expect(pinned).toContain('scripts/pm/check-half-states.mjs');
    // …and its helper, which the patrol workflow's own `paths:` filter already
    // treats as part of the same unit.
    expect(pinned).toContain('scripts/invoked-as.mjs');
  });

  it("the patrol's own ported unit is pinned, in both directions", () => {
    // ⚠️ Re-scoped by objectui#7263, which registered the first entry OUTSIDE
    // `scripts/`. This assertion used to read `pinned ⊆ watched` — every pinned
    // file must appear in the patrol's paths filter — which silently encoded
    // "the ledger only ever pins the sweeper's unit". That was true of the two
    // entries that existed and is not a property of the ledger: the patrol runs
    // ONE ported program, and a hook self-test has no business in its filter.
    //
    // Both directions are kept, each scoped to the thing it is actually about:
    // a ported file the patrol watches but nothing pins drifts unwatched, and a
    // pinned file from the patrol's own unit that the patrol dropped is a stale
    // obligation. The reach of the pin BEYOND that unit is the next test's job.
    const patrol = parseYaml(
      fs.readFileSync(path.join(ROOT, '.github/workflows/half-state-patrol.yml'), 'utf8'),
    );
    const watched: string[] = patrol.on.pull_request.paths;
    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8'));
    const pinned: string[] = pin.files.map((f: { ported: string }) => f.ported);
    // forward: everything the patrol watches, other than the workflow file that
    // declares the watch, is a ported program and must be pinned.
    for (const p of watched.filter((w) => !w.startsWith('.github/'))) expect(pinned).toContain(p);
    // back: the patrol's own unit, identified by where the sweeper lives, must
    // still be in that filter.
    for (const p of pinned.filter((f) => f.startsWith('scripts/pm/'))) expect(watched).toContain(p);
  });

  it('every pinned file is one the gate actually runs on when it drifts', () => {
    // The wiring claim that had to exist once the ledger reached past
    // `scripts/` (objectui#7263). `lint.yml` runs this gate, and its `relevant`
    // step skips every step below it when a pull request touches ONLY the paths
    // it ignores. A ported file inside that ignore set would be pinned and
    // unwatched at the same time: the PR that drifts it is exactly the PR on
    // which the gate does not run, and the drift lands green — the failure this
    // whole mechanism exists to make impossible, one level up.
    const lintYml = fs.readFileSync(path.join(ROOT, '.github/workflows/lint.yml'), 'utf8');
    const relevant = lintYml.slice(lintYml.indexOf('id: relevant'));
    const ignored = [...relevant.matchAll(/':\(exclude,glob\)([^']+)'/g)].map((m) => m[1]);
    // Tokenised, not chained replaces: a chain rewrites the `*` it has already
    // emitted into a substitution, and the resulting pattern matches nothing —
    // an assertion that passes because it recognises nothing, which is the
    // shape this whole file is about.
    const matches = (glob: string, file: string) =>
      new RegExp(
        `^${glob
          .split(/(\*\*\/|\*\*|\*|\?)/)
          .map((tok) =>
            tok === '**/'
              ? '(?:.*/)?'
              : tok === '**'
                ? '.*'
                : tok === '*'
                  ? '[^/]*'
                  : tok === '?'
                    ? '[^/]'
                    : tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          )
          .join('')}$`,
      ).test(file);

    // The control leg: every glob in that list must actually recognise a file
    // it is there to ignore. Without this the loop below is green on a matcher
    // that never matches.
    expect(ignored).toEqual(expect.arrayContaining(['**/*.md', 'content/**', 'docs/**', '.changeset/**']));
    expect(ignored.filter((g) => matches(g, 'docs/adr/0001-example.md'))).toEqual(['**/*.md', 'docs/**']);
    expect(ignored.filter((g) => matches(g, 'content/docs/guide/a.md'))).toEqual(['**/*.md', 'content/**']);
    expect(ignored.filter((g) => matches(g, '.changeset/lucky-pans-smile.md'))).toEqual(['**/*.md', '.changeset/**']);

    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8'));
    const pinned: string[] = pin.files.map((f: { ported: string }) => f.ported);
    for (const file of pinned) {
      expect({ file, ignoredBy: ignored.filter((g) => matches(g, file)) }).toEqual({ file, ignoredBy: [] });
    }
  });

  it('the ref is per ENTRY, and the retired global one is gone (objectui#8288)', () => {
    // The schema half of the card. The pin used to carry ONE `upstream.ref`
    // beside per-file digests, and `--resync` set it on every run — so
    // re-syncing one file re-labelled the others with a ref their digests had
    // never been taken from (objectui#7749 did exactly that to
    // `check-half-states.mjs` and `invoked-as.mjs`). Both stayed GREEN, because
    // the digest is the assertion; only the provenance line was false.
    //
    // Asserted structurally, never by value: the refs themselves move on every
    // re-sync, and a copy of them here would be the second thing to keep honest
    // that this file's header already refuses.
    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8'));
    expect(pin.upstream.ref, 'the global ref is retired, not merely unread').toBeUndefined();
    expect(pin.files.length).toBeGreaterThan(0);
    for (const f of pin.files) {
      expect({ ported: f.ported, ref: f.ref }).toEqual({
        ported: f.ported,
        ref: expect.stringMatching(/^[0-9a-f]{40}$/),
      });
    }
  });

  it('the gate prints each file at ITS OWN ref, not one ref for all', () => {
    // The reporting half. This is the assertion that would have caught the card:
    // every printed provenance line must name the ref stored beside that file's
    // own digest. Relational — it reads the expected ref out of the pin — so it
    // survives any re-sync and fails the moment one file's line borrows
    // another's ref.
    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8')) as {
      files: Array<{ ported: string; ref: string }>;
    };
    const out = stripAnsi(execFileSync('node', [GATE], { cwd: ROOT, encoding: 'utf8' }));
    for (const f of pin.files) {
      const line = out.split('\n').find((l) => l.includes(f.ported));
      expect(line, `no verdict line for ${f.ported}`).toBeTruthy();
      expect({ ported: f.ported, namesOwnRef: line!.includes(f.ref.slice(0, 9)) }).toEqual({
        ported: f.ported,
        namesOwnRef: true,
      });
    }
    // The control leg: with more than one distinct ref pinned, a line must NOT
    // name a ref belonging to a different entry. Without this the loop above is
    // satisfied by a gate that prints every ref on every line.
    const distinct = [...new Set(pin.files.map((f) => f.ref))];
    if (distinct.length > 1) {
      for (const f of pin.files) {
        const line = out.split('\n').find((l) => l.includes(f.ported))!;
        const foreign = distinct.filter((r) => r !== f.ref && line.includes(r.slice(0, 9)));
        expect({ ported: f.ported, foreignRefs: foreign }).toEqual({ ported: f.ported, foreignRefs: [] });
      }
    }
  });

  it('its self-test passes — the half that makes a green comparison mean something', () => {
    const out = execFileSync('node', [GATE, '--self-test'], { cwd: ROOT, encoding: 'utf8' });
    // objectui#7897 — the COUNT, not the shape. `\d+ cases pass` is satisfied
    // by `0 cases pass`, so the old spelling passed for a self-test whose case
    // table had gone empty: the outcome it exists to refuse. `selfTestCases`
    // also strips ANSI, the second belt for a child that starts colouring.
    expect(stripAnsi(out)).toMatch(/check-upstream-port-parity self-test: \d+ cases pass/);
    expect(
      selfTestCases(out, 'check-upstream-port-parity'),
      'a self-test that ran no cases is not a passing self-test',
    ).toBeGreaterThan(0);
  });

  it('`--list` publishes each divergence at its real size, not one more (objectui#9922)', () => {
    // The emitter, not the helper. The gate's own self-test pins
    // `snippetLineCount` over fixtures; this pins the thing a reader actually
    // sees, because a correct counter that `list()` stopped calling would leave
    // that self-test green and the printed listing wrong.
    //
    // Relational, so it survives every re-sync: the expected size is re-derived
    // from the snippet stored in the pin. ⛔ No count is written down here —
    // the header's refusal of copied line counts stands, and this asserts an
    // agreement rather than a number.
    const pin = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8')) as {
      files: Array<{ ported: string; divergences?: Array<{ id: string; ported: string }> }>;
    };
    const out = stripAnsi(execFileSync('node', [GATE, '--list'], { cwd: ROOT, encoding: 'utf8' }));

    // `wc -l` semantics, spelled out here rather than imported from the gate: an
    // expectation that borrowed the gate's own counter would agree with it
    // however it counts, which is the shape this file exists to refuse. A
    // newline TERMINATES a line, so the terminators are the lines — plus a last
    // line for any text left dangling after the final one.
    const wcL = (text: string) => (text.match(/\n/g) ?? []).length + (text !== '' && !text.endsWith('\n') ? 1 : 0);

    // Ids repeat ACROSS files (they name the adaptation, not the site), so each
    // listing is read inside its own file's section.
    const sections = new Map<string, string[]>();
    let current: string[] | null = null;
    for (const line of out.split('\n')) {
      const header = /^(\S+)\s+<-\s+\S+\s*$/.exec(line);
      if (header) {
        current = [];
        sections.set(header[1], current);
      } else current?.push(line);
    }

    const all = pin.files.flatMap((f) => f.divergences ?? []);
    expect(all.length, 'a pin with no divergences would make the loop below vacuous').toBeGreaterThan(0);
    // The control leg, and it is the whole assertion's licence: the two
    // counters differ ONLY on a snippet that ends in a newline. With none in
    // the pin this test is green on the very defect it was written for.
    expect(
      all.filter((d) => d.ported.endsWith('\n')).length,
      'nothing here ends in a newline, so this test cannot tell a line from a terminator',
    ).toBeGreaterThan(0);

    // objectui#10006 — reconcile the CAPTURE against the count the gate itself
    // announces, before reading any single divergence out of it. A capture that
    // lost its tail used to fail in the loop below as `no listing line for ID
    // under FILE`: a specific, confident and FALSE claim about one divergence,
    // when what had actually happened is that this process received less than
    // the gate sent. Four unrelated pull requests were read that way. The
    // producer no longer truncates (`--list reaches its caller whole through a
    // pipe` pins that); this keeps the FAILURE honest if anything ever does
    // again, and it is three-way — the pin, the gate's own announcement, and
    // the lines that arrived must all agree.
    for (const f of pin.files) {
      const section = sections.get(f.ported);
      expect(section, `no listing section for ${f.ported}`).toBeTruthy();
      const announced = /declared divergences\s*:\s*(\d+)/.exec(section!.join('\n'))?.[1];
      const received = section!.filter((l) => /^\s*- \S+ \(\d+ line\(s\)/.test(l)).length;
      expect({ ported: f.ported, announced, received }).toEqual({
        ported: f.ported,
        announced: String((f.divergences ?? []).length),
        received: (f.divergences ?? []).length,
      });
    }

    for (const f of pin.files) {
      const section = sections.get(f.ported);
      expect(section, `no listing section for ${f.ported}`).toBeTruthy();
      for (const d of f.divergences ?? []) {
        const line = section!.find((l) => l.trimStart().startsWith(`- ${d.id} (`));
        expect(line, `no listing line for ${d.id} under ${f.ported}`).toBeTruthy();
        const printed = /\((\d+) line\(s\)/.exec(line!)?.[1];
        expect({ id: `${f.ported}#${d.id}`, printed }).toEqual({
          id: `${f.ported}#${d.id}`,
          printed: String(wcL(d.ported)),
        });
      }
    }
  });

  it('the gate never calls process.exit — the construct is gone, not merely unused (objectui#10006)', () => {
    // The repair order this repo states, at its first step: remove the
    // construct that PERMITS the error rather than add a check that detects it.
    // `process.exit(code)` ends the process while queued stdout is still
    // queued; `process.exitCode = code` lets the same code out through a normal
    // exit, after the streams drain. Nothing in this gate is asynchronous and
    // this is its last statement, so the two are equivalent in verdict and
    // differ only in what survives — proven path by path in the pull request
    // that landed this (clean / drift / unusable pin / uncaught throw / all
    // four `--resync` refusals: same code, same bytes).
    //
    // Pinned on the SOURCE, not on a behaviour, because a reintroduction is
    // silent: it only shows up as somebody else's pull request going red weeks
    // later. Comment lines are dropped first, so the block above the entrypoint
    // can name the construct it forbids.
    const src = fs.readFileSync(path.join(ROOT, GATE), 'utf8');
    const code = src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
    // The control leg, and it is what makes the emptiness below mean something:
    // a filter that had eaten the entrypoint would report "no process.exit"
    // about a file it can no longer see.
    expect(code.join('\n'), 'the comment filter dropped the entrypoint itself').toContain(
      'process.exitCode =',
    );
    expect(code.filter((l) => /process\.exit\s*\(/.test(l))).toEqual([]);
  });

  it('`--list` reaches its caller whole through a pipe, at any length (objectui#10006)', () => {
    // The producer half of this file's own flake, and the reason four unrelated
    // pull requests went red on a claim about `.claude/hooks/**` — including
    // one whose entire diff was comments, and one ejected from the merge queue.
    // Every assertion in this file reads the gate out of an `execFileSync`
    // capture, i.e. a PIPE, and a pipe is the one stdout Node writes
    // ASYNCHRONOUSLY on POSIX (files and TTYs are synchronous — which is why
    // this never reproduced by hand). The gate ended on `process.exit(...)`,
    // which discards what is still queued, so the listing arrived cut at a
    // point set by how fast the runner drained the pipe. Same commit
    // `0a4bf6deb`, no new commits, no rebase: red, then green.
    //
    // ⛔ This deliberately does NOT drive the shipped pin. That listing is
    // ~28 KB, it fits inside the 64 KiB a pipe holds, and a producer that never
    // flushes delivers it intact — so asserting on it cannot tell a fixed gate
    // from a lucky one. A SYNTHETIC pin makes the writer queue.
    //
    // The control is the same gate writing to a regular FILE: that channel is
    // synchronous on POSIX, so its capture is whole by construction, and the
    // pipe is measured against it rather than against a number written down
    // here. Measured on the unfixed gate over this shape: 96 KB / 175 KB /
    // 162 KB of the same 957 KB listing on three consecutive runs, exit 0 each
    // time.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upstream-port-parity-pipe-'));
    try {
      // The module closure is DERIVED, never listed: a hand-kept list goes
      // stale the day the gate grows an import, and the spawn below would then
      // fail as a module-resolution error — a red that says nothing about
      // truncation.
      const copied = new Set<string>();
      const copy = (rel: string) => {
        if (copied.has(rel)) return;
        copied.add(rel);
        const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
        fs.writeFileSync(path.join(dir, rel), text);
        for (const m of text.matchAll(/(?:from|import)\s*\(?\s*'(\.[^']+)'/g)) {
          copy(path.join(path.dirname(rel), m[1]));
        }
      };
      copy(GATE);
      expect(
        copied.size,
        'a closure of one means the import scan stopped recognising the gate\'s own imports',
      ).toBeGreaterThan(1);

      const count = 2500;
      const ids = Array.from({ length: count }, (_, i) => `synthetic-${String(i).padStart(5, '0')}`);
      fs.writeFileSync(path.join(dir, 'ported.txt'), 'the ported body\n');
      fs.writeFileSync(
        path.join(dir, PIN),
        JSON.stringify({
          upstream: { repo: 'objectstack-ai/objectstack' },
          files: [
            {
              ported: 'ported.txt',
              upstreamPath: 'upstream.txt',
              ref: 'a'.repeat(40),
              upstreamSha256: 'b'.repeat(64),
              divergences: ids.map((id, i) => ({
                id,
                upstream: `up-${i}`,
                ported: `po-${i}`,
                why: `${'w'.repeat(400)} #${i}`,
              })),
            },
          ],
        }),
      );

      const gate = path.join(dir, GATE);
      const onDisk = path.join(dir, 'listing.txt');
      const fd = fs.openSync(onDisk, 'w');
      let viaFile;
      try {
        viaFile = spawnSync('node', [gate, '--list'], { cwd: dir, stdio: ['ignore', fd, 'pipe'], encoding: 'utf8' });
      } finally {
        fs.closeSync(fd);
      }
      expect({ status: viaFile.status, stderr: viaFile.stderr }).toEqual({ status: 0, stderr: '' });
      const whole = fs.readFileSync(onDisk, 'utf8');
      // Non-vacuity: under the 64 KiB a pipe holds, the comparison below is
      // satisfied by the very defect it exists to refuse.
      expect(whole.length, 'the synthetic listing no longer exceeds what a pipe holds').toBeGreaterThan(
        1_000_000,
      );

      const piped = execFileSync('node', [gate, '--list'], {
        cwd: dir,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      // Digested rather than compared whole: a megabyte-wide diff in the
      // failure output helps nobody, and the byte count beside it says which
      // direction it went.
      const sha = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);
      expect({ chars: piped.length, sha: sha(piped) }).toEqual({ chars: whole.length, sha: sha(whole) });
      // Named explicitly because the tail is what a truncating writer loses:
      // the LAST divergence is the one that goes missing first.
      expect(
        piped.split('\n').some((l) => l.trimStart().startsWith(`- ${ids[count - 1]} (`)),
        'the last divergence in the listing did not survive the pipe',
      ).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('and the tree itself is at parity right now', () => {
    // Not a duplicate of the CI step: this is the assertion that the pin
    // shipped in this commit describes the files shipped in this commit. A pin
    // updated without its file, or the reverse, fails here at review time
    // rather than on someone else's branch.
    const out = execFileSync('node', [GATE], { cwd: ROOT, encoding: 'utf8' });
    // objectui#7897 — `/ported file\(s\) match/` is satisfied by `0 ported
    // file(s) match`: an EMPTY pin, checked against nothing, reads exactly like
    // a tree at parity. The count is read out of the verdict and reconciled
    // with the pin shipped in this commit, so the two cannot drift apart
    // silently. ANSI is stripped as the second belt (this gate does not colour).
    const pinned = JSON.parse(fs.readFileSync(path.join(ROOT, PIN), 'utf8')) as { files: unknown[] };
    expect(pinned.files.length, 'a pin with no files would make the verdict below vacuous').toBeGreaterThan(0);
    expect(verdictCount(out, /(\d+) ported file\(s\) match/, 'ported file count')).toBe(pinned.files.length);
  });
});
