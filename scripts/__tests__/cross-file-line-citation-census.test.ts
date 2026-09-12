/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Pins for `scripts/cross-file-line-citation-census.mjs` (objectui#8875).
 *
 * Every assertion below corresponds to a way this instrument can lie, and all
 * of them lie in the SAME DIRECTION: a citation the scanner cannot see is a
 * citation the census reports as absent, with exit 0 and no error. That is the
 * defect objectui#8875 is about, arriving one level up in the tool written to
 * measure it — the filing seat's own first probe was a single-syntax grep, and
 * the dispatching seat's own first grep was path-restricted and returned a
 * confident zero.
 *
 * Three groups, failing for three different reasons:
 *
 * 1. THE SYNTAXES. One case per spelling the card measured, plus the
 *    continuation address no basename-anchored probe can match. A regression
 *    here silently shrinks the population.
 * 2. THE JUDGEMENT. The verdict rules, including the asymmetry between
 *    positive and negative evidence. A regression here moves the number without
 *    changing what was scanned.
 * 3. THE CARVE-OUTS AND CONTROLS. Released changelog sections stay out; the
 *    control pair stays addressed by content rather than by line number, which
 *    is what stops the controls from being an instance of the defect.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  scanFile,
  resolveCited,
  anchorsFor,
  locateAnchors,
  judge,
  inTestTitle,
  evaluateClassifier,
  evaluateControls,
  finalVerdict,
  bucketOf,
  CONTROLS,
  FALSE_VERDICTS,
  MAX_ANCHOR_LINES,
  CONT_WINDOW,
} from '../cross-file-line-citation-census.mjs';

const REPO_ROOT = join(__dirname, '..', '..');

type Hit = {
  syntax: string;
  citedWritten: string;
  citedLine: number;
  line: number;
  inTestName: boolean;
};

const scan = (text: string, path = 'packages/demo/src/demo.ts') =>
  scanFile(path, text) as { hits: Hit[]; carvedOut: Hit[]; lines: string[] };

const shapes = (text: string, path?: string) =>
  scan(text, path).hits.map((h) => `${h.syntax} ${h.citedWritten}:${h.citedLine}`);

describe('the scanner sees every syntax the card measured', () => {
  it('reads the dominant `path:line` spelling, with directories or as a bare basename', () => {
    expect(shapes('// see packages/core/src/actions/ActionRunner.ts:112 for the vocabulary'))
      .toEqual(['colon packages/core/src/actions/ActionRunner.ts:112']);
    expect(shapes('// see ActionRunner.ts:112 for the vocabulary'))
      .toEqual(['colon ActionRunner.ts:112']);
  });

  it('reads the permalink spelling, which a `path:line` probe cannot see', () => {
    // REGRESSION GUARD: one of the card's own 73 hits was this shape, and the
    // filing seat's first probe was `path:line` only. A single-syntax census
    // under-reads this class by construction.
    // The captured span starts after the URL scheme, because a written path
    // cannot contain `:` — that character is what syntax 1 is made of. It costs
    // nothing: resolution takes the longest matching suffix, so the `blob/REF/`
    // prefix and the scheme are discarded either way.
    expect(shapes('[x](https://github.com/o/r/blob/main/packages/core/README.md#L42)'))
      .toEqual(['permalink //github.com/o/r/blob/main/packages/core/README.md:42']);
  });

  it('reads the address written before the name, and after it', () => {
    expect(shapes('at line 856 of `ListView.tsx`.')).toEqual(['line-before-name ListView.tsx:856']);
    expect(shapes('`ListView.tsx` line 856 is the dependency array.'))
      .toEqual(['name-before-line ListView.tsx:856']);
  });

  it('matches the FULL extension — a naive alternation truncates `.tsx` to `.ts`', () => {
    // REGRESSION: with `ts|tsx` ordered naively, the syntaxes that end at the
    // name (`line NNN of NAME`) stopped at `.ts`, and the one instance of that
    // shape in the repository was scored against a `ListView.ts` that does not
    // exist. The `path:line` syntaxes hid it: their required `:` forces the
    // engine to backtrack into `tsx`, so only the unanchored syntax was wrong.
    expect(shapes('at line 856 of `ListView.tsx`.')[0]).toContain('ListView.tsx');
    expect(shapes('at line 12 of `page.mdx`.')[0]).toContain('page.mdx');
  });

  it('reads the CONTINUATION address, which carries no filename at all', () => {
    // The shape the card names as the one no `basename:[0-9]+` probe can match.
    expect(shapes('// `ActionRunner.ts:1788` and `:1794` are the two writes'))
      .toEqual(['colon ActionRunner.ts:1788', 'continuation ActionRunner.ts:1794']);
  });

  it('lets a continuation reach across a wrapped comment, but not indefinitely', () => {
    expect(shapes(['// `Registry.ts:194`', '// and the fallback at `:226`'].join('\n')))
      .toEqual(['colon Registry.ts:194', 'continuation Registry.ts:226']);
    const farApart = ['// `Registry.ts:194`', '//', '//', '//', '// stray `:226`'].join('\n');
    expect(shapes(farApart)).toEqual(['colon Registry.ts:194']);
  });

  it('does not invent a citation out of a clock time, a version or a host:port', () => {
    expect(shapes('// runs at 12:30, version 1.2.3, on example.com:3000')).toEqual([]);
    // A bare `:NNN` with no address in scope is a colon and a number.
    expect(shapes('// the budget is :400')).toEqual([]);
  });

  it('never double-counts one address under two syntaxes', () => {
    // Both `colon` and the continuation matcher can reach the same characters.
    const hits = scan('// `ActionRunner.ts:1788`').hits;
    expect(hits).toHaveLength(1);
    expect(hits[0].syntax).toBe('colon');
  });
});

describe('a written path beats a bare basename, and ambiguity is reported as ambiguity', () => {
  const index = new Map<string, string[]>([
    ['index.ts', ['packages/a/src/index.ts', 'packages/b/src/index.ts']],
    ['ActionRunner.ts', ['packages/core/src/actions/ActionRunner.ts']],
    ['README.md', ['packages/core/README.md']],
  ]);

  it('resolves the longest matching suffix', () => {
    expect(resolveCited('packages/b/src/index.ts', index)).toEqual({
      kind: 'resolved',
      path: 'packages/b/src/index.ts',
    });
    expect(resolveCited('b/src/index.ts', index)).toEqual({
      kind: 'resolved',
      path: 'packages/b/src/index.ts',
    });
  });

  it('resolves the tail of a permalink URL, stripping the `blob/REF/` prefix', () => {
    expect(resolveCited('https://github.com/o/r/blob/main/packages/core/README.md', index)).toEqual({
      kind: 'resolved',
      path: 'packages/core/README.md',
    });
  });

  it('refuses to guess when a bare basename names several tracked files', () => {
    // Silently picking one would manufacture a verdict about a file the author
    // may never have meant, in a census whose whole subject is confident wrong
    // answers.
    expect(resolveCited('index.ts', index).kind).toBe('ambiguous-basename');
  });

  it('reports a path that matches nothing as unresolved, not as false', () => {
    // Dominated by citations into build artifacts (`types/dist/overlay.d.ts`),
    // which are untracked and regenerated. Nothing has been shown wrong there.
    expect(resolveCited('packages/types/dist/overlay.d.ts', index).kind).toBe('no-such-file');
  });
});

describe('the verdict is decided against the tree as it is today, never against what moved', () => {
  const cited = ['const a = 1;', '', ' */', 'export interface ActionDef {', '  type: string;'];
  const hit = (citedLine: number, anchors: string[]) => ({
    file: 'scripts/demo.mjs',
    citedWritten: 'packages/core/src/actions/ActionRunner.ts',
    citedLine,
    anchors,
  });
  const index = new Map<string, string[]>([
    ['ActionRunner.ts', ['packages/core/src/actions/ActionRunner.ts']],
  ]);
  const cache = new Map<string, string[] | null>([
    ['packages/core/src/actions/ActionRunner.ts', cited],
  ]);
  const run = (citedLine: number, anchors: string[]) =>
    judge(hit(citedLine, anchors), REPO_ROOT, index, cache) as { verdict: string; actualLine?: number };

  it('calls a line past the end of the cited file out of range', () => {
    expect(run(99, ['ActionDef']).verdict).toBe('out-of-range');
  });

  it('calls a line carrying nothing but delimiters non-substantive', () => {
    // This is the shape of the card's own off-by-one: the docblock closes on
    // the cited line and the declaration opens on the next one.
    expect(run(3, ['ActionDef']).verdict).toBe('non-substantive');
    expect(run(2, ['ActionDef']).verdict).toBe('non-substantive');
  });

  it('calls a citation whose content sits elsewhere in the file drifted, and says where', () => {
    const verdict = run(5, ['ActionDef']);
    expect(verdict.verdict).toBe('drifted');
    expect(verdict.actualLine).toBe(4);
  });

  it('calls a citation whose content is ON the cited line resolved', () => {
    expect(run(4, ['ActionDef']).verdict).toBe('resolves');
  });

  it('judges nothing when the prose offered no anchor at all', () => {
    expect(run(4, []).verdict).toBe('no-anchor');
  });

  it('treats positive and negative evidence ASYMMETRICALLY', () => {
    // REGRESSION: requiring a DISCRIMINATING anchor in both directions failed
    // the census's own non-firing control. An anchor on the cited line is
    // direct positive evidence however common it is; claiming DRIFT asserts the
    // content moved, so it needs a witness that can actually locate something.
    const wide = Array.from({ length: MAX_ANCHOR_LINES + 3 }, () => 'type: string;');
    const wideCache = new Map<string, string[] | null>([
      ['packages/core/src/actions/ActionRunner.ts', wide],
    ]);
    const onLine = judge(hit(1, ['string']), REPO_ROOT, index, wideCache) as { verdict: string };
    expect(onLine.verdict).toBe('resolves');

    const elsewhereOnly = ['// nothing here', ...wide];
    const spreadCache = new Map<string, string[] | null>([
      ['packages/core/src/actions/ActionRunner.ts', elsewhereOnly],
    ]);
    // `string` is on more than MAX_ANCHOR_LINES lines, so it cannot witness drift.
    expect((judge(hit(1, ['string']), REPO_ROOT, index, spreadCache) as { verdict: string }).verdict)
      .toBe('anchor-absent');
  });

  it('keeps a promiscuous anchor from witnessing drift, and a rare one from being ignored', () => {
    const lines = ['type: string;', 'type: string;', 'const ActionDef = 1;'];
    expect(locateAnchors(lines, ['ActionDef'])).toEqual([{ anchor: 'ActionDef', lines: [3] }]);
    const flooded = Array.from({ length: MAX_ANCHOR_LINES + 2 }, () => 'string');
    expect(locateAnchors(flooded, ['string'])).toEqual([]);
  });
});

describe('content anchors come from where this tree writes code, not from English', () => {
  const lines = [
    ' * `ActionDef.type` passed to `useActionRunner().execute(...)` -- a',
    ' * RunnableActionType, declared at packages/core/src/actions/ActionRunner.ts:112.',
    ' * An action being run, not a node being rendered.',
  ];

  it('takes atoms out of backticked spans and cased identifiers', () => {
    const anchors = anchorsFor(lines, 1, 'packages/core/src/actions/ActionRunner.ts');
    expect(anchors).toContain('ActionDef');
    expect(anchors).toContain('useActionRunner');
    expect(anchors).toContain('RunnableActionType');
  });

  it('drops atoms belonging to the cited path itself', () => {
    // A file's own name is on its own lines, so scoring against it would mark
    // very nearly every citation as resolving.
    const anchors = anchorsFor(lines, 1, 'packages/core/src/actions/ActionRunner.ts');
    expect(anchors).not.toContain('ActionRunner');
    expect(anchors).not.toContain('actions');
    expect(anchors).not.toContain('packages');
  });

  it('drops short and uncased words instead of keeping an English stopword list', () => {
    const anchors = anchorsFor([' * the `run` mode at `x.ts:1`'], 0, 'x.ts');
    expect(anchors).not.toContain('run');
    expect(anchors).not.toContain('the');
  });
});

describe('released changelog sections are carved out, and the carve-out is visible', () => {
  const changelog = [
    '# @object-ui/plugin-form',
    '',
    '## Unreleased',
    '',
    '- pending note citing `form.tsx:1652`',
    '',
    '## 17.6.0',
    '',
    '- released note citing `form.tsx:1428`',
  ].join('\n');

  it('excludes everything at or after the first released version heading', () => {
    // A changelog entry is a DATED RECORD of what was true at that release,
    // regenerated from changesets. Re-addressing it to today's tree would make
    // it false AS HISTORY.
    const r = scan(changelog, 'packages/plugin-form/CHANGELOG.md');
    expect(r.hits.map((h) => h.citedLine)).toEqual([1652]);
    expect(r.carvedOut.map((h) => h.citedLine)).toEqual([1428]);
  });

  it('carves out ONLY changelogs — a released heading elsewhere means nothing', () => {
    const r = scan(changelog, 'content/docs/guide/versions.md');
    expect(r.hits.map((h) => h.citedLine)).toEqual([1652, 1428]);
    expect(r.carvedOut).toEqual([]);
  });
});

describe('the test-name classifier, whose zero is only a reading if it is shown firing', () => {
  it('passes its own control pair on every census run', () => {
    // REGRESSION: the first predicate merely asked whether the line contained
    // something shaped like `it(`. It reported 27 hits on this tree, every one
    // of them prose — including this census's own subject file quoting the
    // false positive it was written to avoid.
    for (const c of evaluateClassifier() as { ok: boolean; name: string }[]) {
      expect(c.ok, c.name).toBe(true);
    }
  });

  it('anchors the declaration at the start of the statement', () => {
    const title = "  it('renders x.ts:1', () => {});";
    expect(inTestTitle(title, title.indexOf('x.ts:1'), title.indexOf('x.ts:1') + 6)).toBe(true);
    const prose = ' * declare it (`x.ts:1`), so the doc keeps it.';
    expect(inTestTitle(prose, prose.indexOf('x.ts:1'), prose.indexOf('x.ts:1') + 6)).toBe(false);
  });
});

type Control = { id: string; from: string; to: string; subject: string; want: string };
type Scored = { ok: boolean; detail: string };

/** A row as the census hands one to `evaluateControls`, for the control `c`. */
const rowFor = (c: Control, verdict: string, over: Partial<Record<string, unknown>> = {}) => ({
  file: c.from,
  citedPath: c.to,
  line: 10,
  citedLine: 20,
  text: `* the prose that says ${c.subject} and cites a line`,
  verdict,
  ...over,
});

describe('the controls are addressed by CONTENT, and the tree still satisfies them', () => {
  it('names no line number of its own — a control pinned by line address is the defect', () => {
    for (const c of CONTROLS as Control[]) {
      expect(`${c.from} ${c.to} ${c.subject}`).not.toMatch(/:\d+/);
    }
  });

  it('gives every control a subject — a FILE PAIR is not a citation', () => {
    // REGRESSION objectui#9081: the controls were addressed by file pair alone.
    // `packages/types/src/crud.ts` addresses `plugin-detail/src/index.tsx` from
    // two epitaphs, so the pair named two rows and never one citation.
    for (const c of CONTROLS as Control[]) {
      expect(c.subject, `${c.id} has no subject`).toBeTruthy();
    }
  });

  it('is not sunk by a SECOND citation between the same two files', () => {
    // REGRESSION objectui#9081: `evaluateControls` required that NO row matching
    // the pair be false, so one unrelated rotted sentence refused every run of
    // the whole census — for some 580 commits of `main`.
    const nonFiring = (CONTROLS as Control[]).find((c) => c.want !== 'false') as Control;
    const subject = rowFor(nonFiring, 'resolves');
    const sibling = rowFor(nonFiring, 'drifted', {
      line: 400,
      text: '* an unrelated sentence citing the same file',
    });
    const scored = (evaluateControls([subject, sibling]) as Scored[])
      .find((_, i) => (CONTROLS as Control[])[i].id === nonFiring.id) as Scored;
    expect(scored.ok).toBe(true);
  });

  it('does not let a sibling citation satisfy a FIRING control on its behalf', () => {
    // The other direction of the same fold, and the quieter one: `some` over the
    // pair meant any rotted neighbour reported the instrument as proven while the
    // case the control was written for had stopped firing.
    const firing = (CONTROLS as Control[]).find((c) => c.want === 'false') as Control;
    const subject = rowFor(firing, 'resolves');
    const sibling = rowFor(firing, 'drifted', {
      line: 700,
      text: '* an unrelated sentence citing the same file',
    });
    const [scored] = evaluateControls([subject, sibling]) as Scored[];
    expect(scored.ok).toBe(false);
  });

  it('refuses when its subject names more than one citation', () => {
    const firing = (CONTROLS as Control[]).find((c) => c.want === 'false') as Control;
    const [scored] = evaluateControls([
      rowFor(firing, 'drifted'),
      rowFor(firing, 'drifted', { line: 11 }),
    ]) as Scored[];
    expect(scored.ok).toBe(false);
    expect(scored.detail).toContain('AMBIGUOUS');
  });

  it('takes positive evidence only — a verdict the census declined to reach is not a pass', () => {
    // objectui#9081: `anchor-absent` is this census refusing to judge. The
    // retired `crud.ts` pair carried exactly that on one of its two rows while
    // the address was rotted, so `not-false` would have passed on it.
    const nonFiring = (CONTROLS as Control[]).find((c) => c.want !== 'false') as Control;
    for (const verdict of ['anchor-absent', 'no-anchor', 'drifted']) {
      const scored = (evaluateControls([rowFor(nonFiring, verdict)]) as Scored[])
        .find((_, i) => (CONTROLS as Control[])[i].id === nonFiring.id) as Scored;
      expect(scored.ok, `${nonFiring.id} passed on ${verdict}`).toBe(false);
    }
  });

  it('says so when the pair still carries citations but none of them is the subject', () => {
    const firing = (CONTROLS as Control[]).find((c) => c.want === 'false') as Control;
    const [scored] = evaluateControls([
      rowFor(firing, 'drifted', { text: '* a sentence that is not this control' }),
    ]) as Scored[];
    expect(scored.ok).toBe(false);
    expect(scored.detail).toContain('NOT FOUND');
    expect(scored.detail).toContain('none carries this subject');
  });

  it('still reproduces the card off-by-one, verified by content rather than by number', () => {
    // objectui#8875: `check-doc-component-types.mjs` cites the action vocabulary
    // at `ActionRunner.ts:112`; that line closes the docblock and `ActionDef`
    // opens on the next one. Read here rather than asserted as a number, so a
    // future edit to that file makes this test explain itself.
    const runner = readFileSync(
      join(REPO_ROOT, 'packages/core/src/actions/ActionRunner.ts'),
      'utf8',
    ).split('\n');
    const declaration = runner.findIndex((l) => l.startsWith('export interface ActionDef'));
    expect(declaration).toBeGreaterThan(0);
    expect(runner[declaration - 1].trim()).toBe('*/');

    const citing = readFileSync(join(REPO_ROOT, 'scripts/check-doc-component-types.mjs'), 'utf8');
    const cited = /packages\/core\/src\/actions\/ActionRunner\.ts:(\d+)/.exec(citing);
    expect(cited, 'the firing control citation is gone from the tree').not.toBeNull();
    expect(Number(cited?.[1])).not.toBe(declaration + 1);
  });

  it('reports a control as failed when the census cannot see it at all', () => {
    // The blind-instrument direction: an empty population must not read as a
    // satisfied non-firing control.
    const [firing, nonFiring] = evaluateControls([]) as { ok: boolean; detail: string }[];
    expect(firing.ok).toBe(false);
    expect(nonFiring.ok).toBe(false);
    expect(firing.detail).toContain('NOT FOUND');
  });

  it('keeps the false verdicts to the three that assert something', () => {
    expect([...FALSE_VERDICTS].sort()).toEqual(['drifted', 'non-substantive', 'out-of-range']);
  });
});

type Verdict = { exit: number; certification: string | null; refusal: string[] | null };

describe('a run certifies itself LAST, after every refusal has been consulted', () => {
  const held = [{ ok: true }, { ok: true }];
  const verdict = (controls: { ok: boolean }[], populationSize: number) =>
    finalVerdict({ controls, classifier: held, populationSize }) as Verdict;

  it('refuses an EMPTY population without certifying anything first', () => {
    // REGRESSION objectui#9081: the `IS a reading` line was first printed under
    // the control check and ABOVE this guard, so a blind run announced a reading
    // and then exited 1 on the next line. A grep keying on that string took a
    // certificate off a run that had refused — in the one script whose subject
    // is that an instrument must not report a reading it did not take.
    const v = verdict(held, 0);
    expect(v.exit).toBe(1);
    expect(v.certification).toBeNull();
    expect(JSON.stringify(v)).not.toContain('IS a reading');
    expect(v.refusal?.join('\n')).toContain('Empty population');
  });

  it('DOES certify a healthy population — the control leg, so the absence above is a barrier', () => {
    const v = verdict(held, 1);
    expect(v.exit).toBe(0);
    expect(v.refusal).toBeNull();
    expect(v.certification).toContain('IS a reading');
  });

  it('refuses a failed control without certifying, whatever the population', () => {
    const v = verdict([{ ok: true }, { ok: false }], 1274);
    expect(v.exit).toBe(1);
    expect(v.certification).toBeNull();
    expect(JSON.stringify(v)).not.toContain('IS a reading');
    expect(v.refusal?.join('\n')).toContain('NOT a reading');
  });
});

describe('reporting buckets', () => {
  it('splits packages and apps one level deep, and keeps the root visible', () => {
    expect(bucketOf('packages/plugin-form/README.md')).toBe('packages/plugin-form');
    expect(bucketOf('apps/console/src/x.ts')).toBe('apps/console');
    expect(bucketOf('scripts/pm/check-half-states.mjs')).toBe('scripts/pm');
    expect(bucketOf('scripts/check-doc-links.mjs')).toBe('scripts');
    expect(bucketOf('ROADMAP.md')).toBe('(repo root)');
  });
});

/**
 * objectui#9026 — the continuation form the charter claimed and the code could
 * not read.
 *
 * ⭐ THE WHOLE POINT IS THAT GREEN WAS THE WRONG ANSWER. `ObjectKanbanSchema`
 * carried six bare addresses into `plugin-kanban`'s renderer; every one of them
 * had rotted by ~370 lines, and this scanner reported the docblock EMPTY. So a
 * passing run of the assertions below proves nothing on its own — each one is
 * written so that removing the mechanism it names sends it back to that zero,
 * and the two `⛔` cases do exactly that ablation inline.
 *
 * The fixture is the real docblock, recovered from the commit that replaced it,
 * ⛔ not a paraphrase — the shape is the finding.
 */
describe('a bare filename opens the continuation scope, not only a full address', () => {
  const DOCBLOCK = [
    '   * The lane key the `object-kanban` renderer actually reads —',
    '   * `packages/plugin-kanban/src/ObjectKanban.tsx` reads `schema.groupBy` at',
    '   * thirteen sites: lane materialisation (`:601`, `:625`, `:640`), card moves',
    '   * (`:747`, `:865`) and their effect deps. Undeclared here until',
    '   * objectui#7322, so an authored value reached the renderer only through',
    "   * {@link BaseSchema}'s `[key: string]: any` — admitted, never examined.",
    '   *',
    '   * REQUIRED, as the retired `groupField` was: a board is a grouping of records',
    "   * by one field. The renderer's `if (!schema.groupBy)` branches (`:601`,",
    '   * `:613`) are defensive early-returns, not a lane-less mode — every',
    '   * documented and tested `object-kanban` node authors this key.',
  ].join('\n');

  const NAMES_THE_FILE = '`packages/plugin-kanban/src/ObjectKanban.tsx` reads `schema.groupBy` at';
  const cited = (text: string) =>
    scan(text, 'packages/types/src/objectql.ts').hits.map((h) => h.citedLine);

  it('reads the addresses that sit under the line naming the file', () => {
    const seen = cited(DOCBLOCK);
    // Reported against the file the prose names, ⛔ never against the citing file.
    for (const h of scan(DOCBLOCK, 'packages/types/src/objectql.ts').hits) {
      expect(h.syntax).toBe('continuation');
      expect(h.citedWritten).toBe('packages/plugin-kanban/src/ObjectKanban.tsx');
    }
    expect(seen).toEqual([601, 625, 640, 747, 865]);
  });

  it('⛔ ABLATION — take the filename away and the same docblock reads zero again', () => {
    // The trigger is the whole defect: scope used to open ONLY on a full
    // `NAME:NNN`, so a filename carrying no number of its own put nothing in
    // scope and every address below it was a colon and a number. This is that
    // state, reconstructed — and it is the zero the census actually reported.
    const noFilename = DOCBLOCK.replace(NAMES_THE_FILE, 'reads `schema.groupBy` at');
    expect(noFilename).not.toContain('ObjectKanban.tsx');
    expect(cited(noFilename)).toEqual([]);
  });

  it('⛔ ABLATION — the proximity window was never the binding constraint', () => {
    // ⚠️ Reading the ±2 window as the cause is the tempting wrong turn, and it
    // is measurably wrong: with the trigger absent, that docblock reads 0 of 6
    // at ANY window, because no window can carry a file that never entered
    // scope. Here is the same fact locally — the first address sits ONE line
    // under the filename, well inside the window that was already shipped.
    const lines = DOCBLOCK.split('\n');
    const namesFileAt = lines.findIndex((l) => l.includes('ObjectKanban.tsx'));
    const firstAddressAt = lines.findIndex((l) => l.includes(':601'));
    expect(firstAddressAt - namesFileAt).toBeLessThanOrEqual(CONT_WINDOW);
    // ⇒ the window admitted it and the scanner still refused it. So the window
    // stays where it shipped; ⛔ widening it is not this fix.
    expect(CONT_WINDOW).toBe(2);
  });

  it('⚠️ leaves the restated address BLIND, and says so rather than implying coverage', () => {
    // The sixth address is restated in a second paragraph, eight lines below the
    // only filename and with none of its own. It is NOT read, and that is the
    // deliberate guard doing its job, ⛔ not an oversight to quietly widen: on
    // this tree, reaching it costs 14 more rows of which 3 are a port, a cron
    // minute and a Chinese enumeration. Pinned by name so no reader can cite
    // this syntax as covering an address that drifted out of its scope.
    expect(DOCBLOCK).toContain(':613');
    expect(cited(DOCBLOCK)).not.toContain(613);
  });

  it('gives an address to the file named to its LEFT, not to the line’s last match', () => {
    // REGRESSION: scope used to be whatever the line's LAST match left behind,
    // so a line naming two files gave its bare addresses to the wrong one —
    // silently, and with a verdict attached. Both belong to the file written
    // before them.
    const twoFiles = '// (`ViewTabBar.tsx:564`, `:667`; `ManageViewsDialog.tsx:300`, `:361`)';
    expect(shapes(twoFiles)).toEqual([
      'colon ViewTabBar.tsx:564',
      'colon ManageViewsDialog.tsx:300',
      'continuation ViewTabBar.tsx:667',
      'continuation ManageViewsDialog.tsx:361',
    ]);
  });

  it('does not let a filename in one paragraph capture a number in the next', () => {
    // A blank line ends the prose unit. Without this, a filename in one
    // sentence adopts the port number in the next one — measured on this tree
    // as three readings, two of them a port and one a cron minute.
    const acrossBlank = ['see `apps/console/vite.config.ts`', '', 'the backend runs on :3000'].join('\n');
    expect(shapes(acrossBlank)).toEqual([]);
    // FIRING CONTROL for the same code path: without the blank line it IS read,
    // so the empty result above is the barrier and ⛔ not a scanner that failed.
    const sameParagraph = ['see `apps/console/vite.config.ts`', 'the backend runs on :3000'].join('\n');
    expect(shapes(sameParagraph)).toEqual(['continuation apps/console/vite.config.ts:3000']);
  });
});
