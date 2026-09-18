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
 * either — it is stated on `ChatbotSchema` in `../complex.ts`, and the last
 * `describe` below fails if it stops being there.
 *
 * ## Why a pin and not a comment
 *
 * The rule was written out in full at eight sites across `../complex.ts` and
 * `../mobile.ts`. objectui#7678's amendment then had to be applied by hand at
 * every one of them, and the sites do not reference each other — so a missed
 * site went RED nowhere. The amendment reached five; the review that found the
 * sixth (objectui#9684) enumerated the population with a literal-phrase grep
 * over two hand-picked files and missed two more, one of them a paraphrase the
 * grep could not see. ⇒ the failure mode is silence, and silence is what this
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

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '..');

/** A comment block, with the file it came from and its 1-based start line. */
interface Block {
  file: string;
  line: number;
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

const blocksOf = (file: string, text: string): Block[] => {
  const lineAt = (index: number): number => text.slice(0, index).split('\n').length;
  const out: Block[] = [];

  for (const match of text.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    out.push({ file, line: lineAt(match.index), kind: 'jsdoc', flat: flatten(match[0]) });
  }

  // Consecutive `//` lines are one block: these notes are paragraphs, and a
  // per-line reading would split every sentence the rule spans.
  let run: { start: number; text: string } | null = null;
  let offset = 0;
  for (const line of text.split('\n')) {
    if (/^\s*\/\//.test(line)) {
      if (!run) run = { start: offset, text: '' };
      run.text += `${line}\n`;
    } else if (run) {
      out.push({ file, line: lineAt(run.start), kind: 'line', flat: flatten(run.text) });
      run = null;
    }
    offset += line.length + 1;
  }
  if (run) out.push({ file, line: lineAt(run.start), kind: 'line', flat: flatten(run.text) });

  return out;
};

const allBlocks: Block[] = sourceFiles(SRC).flatMap((file) =>
  blocksOf(file.slice(SRC.length + 1), readFileSync(file, 'utf8')),
);
const statements = allBlocks.filter((block) => STATES_THE_RULE.test(block.flat));
const label = (block: Block): string => `${block.file} (block opening on line ${block.line})`;

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

  it.each(retirements)('the `%s` note cites the one statement of the rule', (name) => {
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

  it('`ChatbotSchema`’s own JSDoc states the rule, precondition included', () => {
    const declaration = complex.indexOf('export interface ChatbotSchema');
    expect(declaration, '`ChatbotSchema` is no longer declared in complex.ts').toBeGreaterThan(-1);

    const doc = [...complex.slice(0, declaration).matchAll(/\/\*\*[\s\S]*?\*\//g)].at(-1);
    expect(doc, '`ChatbotSchema` has no JSDoc block to carry the rule').toBeDefined();

    const flat = flatten(doc![0]);
    expect(STATES_THE_RULE.test(flat)).toBe(true);
    expect(CARRIES_PRECONDITION.test(flat)).toBe(true);
  });
});
