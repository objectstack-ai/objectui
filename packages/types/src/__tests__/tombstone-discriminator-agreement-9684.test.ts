/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Agreement pin — the retire-vs-remove discriminator (objectui#9684).
 *
 * The rule this file guards is the one the precedent changesets state
 * (objectui#5941, #7526) in the form objectui#7678 amended it to: a `?: never`
 * tombstone is available only on a SURVIVING CARRIER, and on such a carrier it
 * is used when either prong holds. ⛔ This file does not restate the rule
 * either — `../complex.ts` states it, at FOUR sites, and the statement
 * `../mobile.ts` cites is the one on `ChatbotSchema`; the `describe` blocks
 * below fail if that one moves, and if the four stop agreeing.
 *
 * ## Why a pin and not a comment
 *
 * The rule was written out in full at eight sites across `../complex.ts` and
 * `../mobile.ts`. objectui#7678's amendment then had to be applied by hand at
 * every one of them, and the sites do not reference each other — so a missed
 * site went RED nowhere. Measured on objectui#9684's base: two of the eight
 * still lacked the precondition, both in `../mobile.ts`, and the finding that
 * measured the drift enumerated the population with a literal-phrase grep over
 * two hand-picked files and named neither of them — one is a paraphrase the
 * grep cannot see. ⇒ the failure mode is silence, and silence is what this
 * file removes.
 *
 * ## What it enforces, and what it cannot
 *
 * 1. Any comment block in this package that states the rule GENERICALLY must
 *    also carry the surviving-carrier precondition. That is the exact drift
 *    objectui#7678 created and objectui#9684 measured twice.
 * 2. `../mobile.ts` cites the rule and never restates it, so its four
 *    retirement notes are outside the amendment surface entirely.
 * 3. The citation target still exists and still states the rule.
 * 4. The four surviving statements carry exactly the clauses `CLAUSES` names,
 *    per the roster in `SURVIVING_STATEMENTS`. ⭐ 1 alone does NOT give this:
 *    measured at the in-seat review of objectui#9684, a third prong added to
 *    the `ChatbotSchema` statement and nowhere else passed this file 12/12,
 *    because 1 guards ONE clause. 4 is what makes an amendment that lands at
 *    one of the four go red at the other three — for a clause `CLAUSES` can
 *    name, and ⛔ for no other.
 *
 * ⚠️ What re-derives what: the population below is derived at run time from
 * the source, so a site added later is covered without anyone remembering this
 * file. But it is derived by MARKERS, and a statement that paraphrases past all
 * of them is invisible here exactly as it was to the grep on the card. The
 * vacuity control is what keeps that honest in one direction: the population is
 * asserted to still contain the published statements, so markers that stop
 * matching fail loudly instead of passing on an empty set. ⛔ Nothing detects a
 * NEW paraphrase; if you add a site, add a marker.
 *
 * ⚠️ Markers are matched against the block with its comment punctuation and
 * line wrapping flattened. Matching raw lines is what makes a phrase probe miss
 * a hit that happens to wrap — measured on this card: `a ?: never tombstone is
 * available only on a SURVIVING` / `CARRIER` wraps mid-phrase at two of the
 * four published sites, and `grep -inE` over that file reports them as misses.
 * Which spans are comment at all is answered by `scripts/js-comment-mask.mjs`,
 * the one scanner in this tree that knows a string literal from a comment, and
 * ⛔ never by a private regex over the source.
 *
 * ## The `.d.ts` asymmetry this pin records structurally
 *
 * `../complex.ts` states the rule in JSDoc on exported members, which
 * declaration emit carries into the published `.d.ts`; `../mobile.ts`'s notes
 * are `//` comments at module scope, which it does not. That is why the two
 * files are treated differently — a citation costs a consumer of the published
 * declarations nothing in one file and a jump in the other. The structural half
 * of that contrast (JSDoc vs `//`) is asserted below. ⛔ The reading of the
 * emitted `.d.ts` itself is NOT re-derived by anything here or in CI: it was
 * taken once, on objectui#9684, and the PR body prints the command to re-take
 * it.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error -- plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { scanSource } from '../../../../scripts/js-comment-mask.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '..');

/** A comment block, with the file it came from and its 1-based line span. */
interface Block {
  file: string;
  line: number;
  /** 1-based line the block's last line sits on. */
  endLine: number;
  kind: 'jsdoc' | 'line';
  /** Comment punctuation and line wrapping flattened to single spaces. */
  flat: string;
}

/**
 * A generic statement of the rule. Every alternative is a phrase that only
 * appears when the rule itself is being written out, never when a note merely
 * names which prong it relies on (`ai.ts` cites "PRONG 2 of the discriminator"
 * and is deliberately out of the population).
 */
const STATES_THE_RULE =
  /tombstone is available only on a|\beither prong\b|\bboth prongs\b|authors to a named live replacement|keeps? loud a key the docs taught as working|keep loud a key the docs taught as working|two-prong discriminator/i;

/** The precondition objectui#7678 added — the clause that kept being missed. */
const CARRIES_PRECONDITION = /surviving[- ]carrier|no carrier/i;

/** The two prongs written out verbatim, which `mobile.ts` must no longer do. */
const WRITES_THE_PRONGS_OUT =
  /authors to a named live replacement|keeps? loud a key the docs taught as working|keep loud a key the docs taught as working/i;

const flatten = (source: string): string =>
  source
    .replace(/^\s*(\/\*\*|\*\/|\*|\/\/)/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sourceFiles = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== '__tests__') sourceFiles(path, out);
    } else if (path.endsWith('.ts') && !path.endsWith('.test.ts')) {
      out.push(path);
    }
  }
  return out;
};

/**
 * Comment blocks, where "is this span a comment" is answered by the shared
 * scanner and never by a private regex — a `/*` inside a string opens a phantom
 * comment for a regex, and the reader then reports clean over source it never
 * looked at (`scripts/js-comment-mask.mjs` states the class).
 *
 * A block is a maximal run of CONSECUTIVE lines that are entirely comment: one
 * JSDoc, or one paragraph of `//` lines. A blank line ends a run on purpose —
 * joining across one would let a drifted note inherit a compliant neighbour's
 * precondition and pass.
 */
const blocksOf = (file: string, text: string): Block[] => {
  const { comment } = scanSource(text);
  const out: Block[] = [];
  let run: { line: number; text: string } | null = null;
  let offset = 0;
  let lineNumber = 0;

  for (const line of text.split('\n')) {
    lineNumber += 1;
    let flagged = 0;
    let bare = 0;
    for (let i = 0; i < line.length; i += 1) {
      if (/\s/.test(line[i])) continue;
      if (comment[offset + i]) flagged += 1;
      else bare += 1;
    }
    const commentOnly = flagged > 0 && bare === 0;

    if (commentOnly) {
      if (!run) run = { line: lineNumber, text: '' };
      run.text += `${line}\n`;
    } else if (run) {
      out.push(close(file, run, lineNumber - 1));
      run = null;
    }
    offset += line.length + 1;
  }
  if (run) out.push(close(file, run, lineNumber));

  return out;
};

const close = (file: string, run: { line: number; text: string }, endLine: number): Block => ({
  file,
  line: run.line,
  endLine,
  kind: kindOf(run.text),
  flat: flatten(run.text),
});

const kindOf = (blockText: string): Block['kind'] => (blockText.trimStart().startsWith('//') ? 'line' : 'jsdoc');

const allBlocks: Block[] = sourceFiles(SRC).flatMap((file) =>
  blocksOf(file.slice(SRC.length + 1), readFileSync(file, 'utf8')),
);
const statements = allBlocks.filter((block) => STATES_THE_RULE.test(block.flat));
const label = (block: Block): string => `${block.file} (block opening on line ${block.line})`;

/**
 * The clauses of the rule this pin can name, one regex each.
 *
 * ⚠️ This list is what "the four agree" means here, and it is ⛔ not "every
 * clause a future amendment could add": a clause worded past all six is
 * invisible, exactly as `MobileComponentConfig`'s paraphrase was to the probe
 * on objectui#9684. `a-prong-beyond-the-two` exists because the measured
 * escape was a THIRD prong added at one site and nowhere else — it catches
 * that in this file's own numbering, and nothing catches it in prose that
 * numbers nothing. Add a clause here when you add one to the rule.
 */
const CLAUSES: Readonly<Record<string, RegExp>> = {
  'available-only-on-a-surviving-carrier': /tombstone is available only on a surviving[- ]carrier/i,
  'a-whole-type-name-has-no-carrier': /whole exported type name has no carrier/i,
  'used-when-either-prong-holds': /when either prong/i,
  'prong-1-a-named-live-replacement': /authors to a named live replacement/i,
  'prong-2-keeps-loud-a-taught-key': /keeps? loud a key the docs taught as working/i,
  'a-prong-beyond-the-two': /\bprong 3\b|\bthird prong\b|\(3\) it\b/i,
};

const clausesOf = (block: Block): string[] =>
  Object.entries(CLAUSES)
    .filter(([, pattern]) => pattern.test(block.flat))
    .map(([name]) => name)
    .sort();

/**
 * The statements that SURVIVE in `complex.ts`, and the clause set each carries.
 *
 * Derived from the tree, not guessed, and recorded here on purpose: this is the
 * roster the next amendment has to move through. Amend one statement and its
 * set stops matching, so the edit cannot land at one site while its three peers
 * go quiet — which is the failure this whole card is about, and which the
 * precondition assertion alone does NOT catch (a clause added at one site and
 * nowhere else passes it).
 *
 * ⇒ when the rule is genuinely amended, this roster is the ONE place that has
 * to change, and changing it means looking at all four.
 */
const SURVIVING_STATEMENTS: ReadonlyArray<{ name: string; anchor: string; carries: string[] }> = [
  {
    name: 'KanbanColumn.color',
    anchor: 'RETIRED with the declarative face (objectui#7664',
    carries: [
      'a-whole-type-name-has-no-carrier',
      'available-only-on-a-surviving-carrier',
      'prong-1-a-named-live-replacement',
      'prong-2-keeps-loud-a-taught-key',
      'used-when-either-prong-holds',
    ],
  },
  {
    name: 'ChatbotSchema (the statement this package cites)',
    anchor: 'Chatbot component — the authoring face',
    carries: [
      'a-whole-type-name-has-no-carrier',
      'available-only-on-a-surviving-carrier',
      'prong-1-a-named-live-replacement',
      'prong-2-keeps-loud-a-taught-key',
      'used-when-either-prong-holds',
    ],
  },
  {
    name: 'displayMode',
    anchor: 'ADR-0049 RETIREMENT TOMBSTONE — `displayMode`',
    // ⚠️ Records a real asymmetry rather than hiding it: this statement does not
    // carry the whole-type-name half. Bringing it into line edits published
    // JSDoc, which is the open decision on objectui#9684.
    carries: [
      'available-only-on-a-surviving-carrier',
      'prong-1-a-named-live-replacement',
      'prong-2-keeps-loud-a-taught-key',
      'used-when-either-prong-holds',
    ],
  },
  {
    name: 'triggerIcon',
    anchor: 'ADR-0049 RETIREMENT TOMBSTONE — `triggerIcon`',
    // ⚠️ Same: this one abbreviates the prongs to "either prong holds" and names
    // only the one that applies, so it carries neither prong clause.
    carries: [
      'a-whole-type-name-has-no-carrier',
      'available-only-on-a-surviving-carrier',
      'used-when-either-prong-holds',
    ],
  },
];

/** The clauses every surviving statement carries — the agreement floor. */
const SHARED_BY_ALL = ['available-only-on-a-surviving-carrier', 'used-when-either-prong-holds'];

describe('objectui#9684 — the detector can fail, and does not fire on everything', () => {
  // A control that cannot fail is the instrument this card was filed about.
  const unamended =
    '// Removed outright rather than tombstoned, on this package\n' +
    '// two-prong discriminator: a tombstone exists (1) to steer\n' +
    '// authors to a named live replacement KEY, or (2) to keep\n' +
    '// loud a key the docs taught as working.\n';
  const amended =
    '// Removed outright: a `?: never` tombstone is available only on a\n' +
    '// SURVIVING CARRIER, and on such a carrier it is used when either\n' +
    '// prong holds.\n';
  const merelyMentions =
    '// RETIRED (objectui#0000): the key is gone. A tombstone would have\n' +
    '// kept the refusal loud, and this retirement did not need one.\n';

  it('a statement that omits the precondition is caught, even though it wraps mid-phrase', () => {
    const [block] = blocksOf('synthetic.ts', unamended);
    expect(STATES_THE_RULE.test(block.flat)).toBe(true);
    expect(CARRIES_PRECONDITION.test(block.flat)).toBe(false);
  });

  it('a statement that carries the precondition passes, wrapping and all', () => {
    const [block] = blocksOf('synthetic.ts', amended);
    expect(STATES_THE_RULE.test(block.flat)).toBe(true);
    expect(CARRIES_PRECONDITION.test(block.flat)).toBe(true);
  });

  it('prose that merely mentions a tombstone is not in the population', () => {
    const [block] = blocksOf('synthetic.ts', merelyMentions);
    expect(STATES_THE_RULE.test(block.flat)).toBe(false);
  });
});

describe('objectui#9684 — every statement of the rule carries its precondition', () => {
  it('VACUITY CONTROL: the published statements in `complex.ts` are still found', () => {
    // If a marker stops matching, this goes red instead of the agreement
    // assertion passing on an empty set. The four are the `KanbanColumn.color`
    // tombstone, the `ChatbotSchema` interface note, and the `displayMode` and
    // `triggerIcon` tombstones; they are JSDoc on exported members, so they are
    // what a `.d.ts` consumer reads.
    const inComplex = statements.filter((block) => block.file === 'complex.ts');
    expect(
      inComplex.length,
      `expected the four published statements in complex.ts, found ${inComplex.length}: ` +
        `${inComplex.map(label).join(', ')}. Either a site was converted to a citation — ` +
        'update this roster deliberately — or a marker in STATES_THE_RULE no longer matches.',
    ).toBeGreaterThanOrEqual(4);
    expect(inComplex.every((block) => block.kind === 'jsdoc')).toBe(true);
  });

  it('no statement omits the surviving-carrier precondition (objectui#7678)', () => {
    const drifted = statements.filter((block) => !CARRIES_PRECONDITION.test(block.flat));
    expect(
      drifted.map(label),
      'these blocks state the retire-vs-remove rule without the precondition objectui#7678 ' +
        'added — a reader landing there concludes a whole exported type name is a tombstone ' +
        'candidate, which is what the amendment exists to deny',
    ).toEqual([]);
  });
});

describe('objectui#9684 — `mobile.ts` cites the rule instead of restating it', () => {
  const mobile = readFileSync(resolve(SRC, 'mobile.ts'), 'utf8');
  const mobileBlocks = blocksOf('mobile.ts', mobile);
  const retirements = ['MobileResponsiveConfig', 'MobileOverrides', 'GestureConfig', 'MobileComponentConfig'];

  const noteFor = (name: string): Block | undefined =>
    mobileBlocks.find(
      (block) => block.kind === 'line' && /RETIRED \(objectui#/.test(block.flat) && block.flat.includes(name),
    );

  it.each(retirements)('the `%s` note cites the statement on `ChatbotSchema`', (name) => {
    const note = noteFor(name);
    expect(note, `no retirement note naming ${name} found in mobile.ts`).toBeDefined();
    expect(note!.flat).toMatch(/`ChatbotSchema` in `complex\.ts`/);
  });

  it('none of the four writes the prongs out — they are off the amendment surface', () => {
    const restating = mobileBlocks.filter((block) => WRITES_THE_PRONGS_OUT.test(block.flat));
    expect(
      restating.map(label),
      'mobile.ts states the rule again: every amendment is now an N-site hand edit once more',
    ).toEqual([]);
  });

  it('the notes are `//` comments at module scope, which declaration emit does not carry', () => {
    // The structural half of the `.d.ts` asymmetry the header describes: this
    // is why a citation is free here and is a jump in `complex.ts`.
    for (const name of retirements) {
      expect(noteFor(name)!.kind).toBe('line');
    }
  });
});

describe('objectui#9684 — the citation target is where the citations say it is', () => {
  const complex = readFileSync(resolve(SRC, 'complex.ts'), 'utf8');
  const complexBlocks = blocksOf('complex.ts', complex);

  it('`ChatbotSchema`’s own JSDoc states the rule, precondition included', () => {
    const declarationLine = complex.slice(0, complex.indexOf('export interface ChatbotSchema')).split('\n').length;
    expect(complex).toContain('export interface ChatbotSchema');

    // The block that ENDS on the line above the declaration is its JSDoc. Found
    // through the shared scanner like every other block here, never by a
    // private docblock regex over raw source — this file forbids that answer to
    // "is this span a comment" in its own header, and a lookup is no exception.
    const doc = complexBlocks.find((block) => block.endLine === declarationLine - 1);
    expect(doc, '`ChatbotSchema` has no JSDoc block directly above it to carry the rule').toBeDefined();
    expect(doc!.kind).toBe('jsdoc');
    expect(STATES_THE_RULE.test(doc!.flat)).toBe(true);
    expect(CARRIES_PRECONDITION.test(doc!.flat)).toBe(true);
  });
});

describe('objectui#9684 — the four surviving statements move together, or go red', () => {
  const survivors = statements.filter((block) => block.file === 'complex.ts');

  it.each(SURVIVING_STATEMENTS)('the $name statement carries exactly its recorded clauses', ({ anchor, carries }) => {
    const block = survivors.find((candidate) => candidate.flat.includes(anchor));
    expect(block, `no statement in complex.ts opens with ${anchor}`).toBeDefined();
    expect(
      clausesOf(block!),
      'this statement of the rule no longer carries the clauses the roster records. If the ' +
        'rule was amended, amend all four and move the roster once — an amendment that lands ' +
        'at one site and leaves its peers alone is the exact failure objectui#9684 was filed ' +
        'for, and it is silent everywhere else.',
    ).toEqual([...carries].sort());
  });

  it('every surviving statement carries the clauses they all share', () => {
    const missing = survivors
      .filter((block) => !SHARED_BY_ALL.every((clause) => CLAUSES[clause].test(block.flat)))
      .map(label);
    expect(missing, 'these statements no longer agree with their peers on the shared clauses').toEqual([]);
  });

  it('VACUITY CONTROL: the roster still resolves to four distinct blocks', () => {
    // Without this, an anchor that stops matching would take its assertion out
    // of the run rather than fail it.
    const resolved = SURVIVING_STATEMENTS.map(({ anchor }) => survivors.find((b) => b.flat.includes(anchor))?.line);
    expect(resolved.filter((line) => line !== undefined)).toHaveLength(SURVIVING_STATEMENTS.length);
    expect(new Set(resolved).size).toBe(SURVIVING_STATEMENTS.length);
  });
});
