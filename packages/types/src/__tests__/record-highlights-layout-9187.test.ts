/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9187 — `RecordHighlightsComponentProps.layout` offered THREE values
 * where the contract declares two.
 *
 * The defect: this package declared `'horizontal' | 'vertical' | 'grid'` while
 * `@objectstack/spec` declares `z.enum(['horizontal','vertical'])` behind a
 * `.default('horizontal')`. So `{ layout: 'grid' }` type-checked here and was
 * refused at publish with `invalid_value` — a green local build and a
 * rejection at the only layer that matters. Direction is contract-first
 * (Commandment #0.1, and triage's ruling on the card): the declaration moves
 * to the contract, the contract is not widened.
 *
 * ── Three instruments, and they do NOT see the same thing ──────────────────
 *
 *   - `tsc` sees the `@ts-expect-error` leg and the `Equal` assertions. That
 *     is the half that reaches a TypeScript author, and it means nothing
 *     unless `type-check` runs — vitest strips types.
 *   - vitest runs the `safeParse` legs against the INSTALLED published spec
 *     artifact, each with a control that would have fired. ⚠️ Those legs read
 *     the SPEC ONLY: they were green before this change and are green after,
 *     so they are the PREMISE, never the evidence. They are labelled PREMISE
 *     below so nobody counts them as the fix.
 *   - vitest ALSO reads this package's own declaration as TEXT, so the
 *     reintroduction of a third value is caught even by a run that never
 *     type-checks. Its control is the sibling interface one screen up, whose
 *     `layout` is still a three-value union (objectui#9040, open by ruling):
 *     the same matcher finds THAT one, so an empty result on the highlights
 *     key is a reading rather than a regex that cannot match anything.
 *
 * ⛔ The sibling is not this card's to fix, and this file must not grow into
 * a pin that demands it: `RecordDetailsComponentProps.layout` is a tombstone
 * the contract refuses BY NAME, with an in-repo consumer triage ruled out of
 * scope. It appears here only as a firing control.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { z } from 'zod';
import { RecordHighlightsProps } from '@objectstack/spec/ui';
import type { RecordHighlightsComponentProps } from '../record-components';

/** Rooted at THIS file, never at `process.cwd()` — the two differ per invocation. */
const HERE = dirname(fileURLToPath(import.meta.url));
const DECLARATION_PATH = join(HERE, '..', 'record-components.ts');

/** What an author writes for the spec's `record:highlights` props bag. */
type SpecProps = z.input<typeof RecordHighlightsProps>;

/** Invariant type equality. `A extends B` is NOT this: `never` and `any` pass that. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The only assertion form used here — its constraint is what refuses `false`. */
type Expect<T extends true> = T;

/* ── Direction proofs: a broken instrument makes THIS file red ─────────────── */

// @ts-expect-error objectui#9187 — `Expect` must refuse `false`. Widen its constraint and this directive goes unused (TS2578).
type _ExpectRefusesFalse = Expect<false>;

// @ts-expect-error objectui#9187 — `never` must NOT read as equal to `true`. An `extends`-shaped comparison would let it through.
type _EqualRefusesNever = Expect<Equal<never, true>>;

// @ts-expect-error objectui#9187 — `any` must NOT read as equal to `true`, for the same reason.
type _EqualRefusesAny = Expect<Equal<any, true>>;

/* ── The fix: the declared union IS the contract's, member for member ─────── */

/**
 * RED before objectui#9187 (three values against the contract's two), green
 * after. This is the pin that fails if a third value is reintroduced — in
 * either direction, because `Equal` is invariant: adding `grid` back here
 * fails, and so would dropping `vertical`.
 */
type _LayoutMatchesContract = Expect<
  Equal<RecordHighlightsComponentProps['layout'], SpecProps['layout']>
>;

/** The neighbouring keys were already right, and the narrowing must not move them. */
type _FieldsUntouched = Expect<
  Equal<RecordHighlightsComponentProps['fields'] extends unknown[] ? true : false, true>
>;

/* ── Literals: what a TypeScript author can and cannot write ───────────────── */

/**
 * ⭐ THE LIT CONTROL for the `tsc` instrument: a value the spec DOES accept,
 * on the same interface, in the same position. It compiles. Without it, the
 * refusal below is indistinguishable from a declaration that refuses
 * everything (or from a `layout` key that stopped existing).
 */
const horizontalAccepted: RecordHighlightsComponentProps = {
  fields: ['name'],
  layout: 'horizontal',
};

/** The other accepted member, so "closed set of two" is not read as "one". */
const verticalAccepted: RecordHighlightsComponentProps = {
  fields: ['name'],
  layout: 'vertical',
};

/**
 * The card's repro. `grid` compiled before objectui#9187 and was refused at
 * publish; now `tsc` refuses it here, which is the whole point of the change.
 * Reintroduce the third value and this directive goes unused (TS2578).
 */
const gridRefused: RecordHighlightsComponentProps = {
  fields: ['name'],
  // @ts-expect-error objectui#9187 — the contract's set is `'horizontal' | 'vertical'`; `grid` is refused at publish with `invalid_value`.
  layout: 'grid',
};

/** Any other value outside the closed set is refused the same way. */
const nonsenseRefused: RecordHighlightsComponentProps = {
  fields: ['name'],
  // @ts-expect-error objectui#9187 — outside the contract's closed set.
  layout: 'zzzNonsense',
};

describe('objectui#9187 — record:highlights `layout` against the installed spec', () => {
  it('PREMISE: the contract declares exactly two members, read off the live schema', () => {
    // Read off the schema object rather than transcribed, so a spec that adds
    // or drops a member fails HERE first — before the pins above start
    // asserting a shape the contract no longer has.
    const layout = RecordHighlightsProps.def.shape.layout;
    const entries = Object.keys(layout.def.innerType.def.entries).sort();
    expect(entries).toEqual(['horizontal', 'vertical']);
    expect(Object.keys(RecordHighlightsProps.def.shape).sort()).toEqual([
      'aria',
      'fields',
      'layout',
    ]);
  });

  it("PREMISE: `grid` is refused with `invalid_value` at `layout` — the card's repro", () => {
    const refused = RecordHighlightsProps.safeParse({ fields: ['name'], layout: 'grid' });
    expect(refused.success).toBe(false);
    const issue = refused.error?.issues.find((i) => i.path.join('.') === 'layout');
    expect(issue?.code).toBe('invalid_value');

    // CONTROL A — an arbitrary value is refused with the SAME code, so `grid`
    // is not special-cased by some bespoke branch.
    const arbitrary = RecordHighlightsProps.safeParse({ fields: ['name'], layout: 'zzzNonsense' });
    expect(arbitrary.success).toBe(false);
    expect(arbitrary.error?.issues.find((i) => i.path.join('.') === 'layout')?.code).toBe(
      'invalid_value',
    );

    // CONTROL B — the values the contract accepts parse green and survive, and
    // an omitted key takes the schema default. A refusal with no control that
    // would have fired is not a measurement; it is also what a schema that
    // refused everything would produce.
    const accepted = RecordHighlightsProps.safeParse({ fields: ['name'], layout: 'vertical' });
    expect(accepted.success).toBe(true);
    expect(accepted.data?.layout).toBe('vertical');
    const omitted = RecordHighlightsProps.safeParse({ fields: ['name'] });
    expect(omitted.success).toBe(true);
    expect(omitted.data?.layout).toBe('horizontal');
  });

  it('the DECLARATION carries the contract’s two members and no third', () => {
    const source = readFileSync(DECLARATION_PATH, 'utf8');

    // Anchor on the interface so the match cannot drift onto another `layout`.
    const block = source.slice(source.indexOf('interface RecordHighlightsComponentProps'));
    expect(block).not.toBe('');
    const declared = /^\s*layout\?: (.+);$/m.exec(block)?.[1];
    expect(declared).toBe("'horizontal' | 'vertical'");

    // ⭐ THE LIT CONTROL for this instrument: the SAME matcher, run against the
    // sibling interface one screen up, finds a three-value union there
    // (objectui#9040, open by ruling — ⛔ not this card's to fix). So the
    // assertion above is a reading, not a matcher that can never see a third
    // member. If #9040 ever lands, this control moves to another three-value
    // union or becomes a literal fixture — it must never be deleted outright.
    const siblingBlock = source.slice(source.indexOf('interface RecordDetailsComponentProps'));
    const siblingDeclared = /^\s*layout\?: (.+);$/m.exec(siblingBlock)?.[1];
    expect(siblingDeclared?.split('|')).toHaveLength(3);
  });

  it('the literals above are real values, not type-only decoration', () => {
    // vitest strips types, so these expectations are NOT the assertion — the
    // annotations are. They exist so the file also fails visibly if the
    // literals are ever silently emptied out.
    expect(horizontalAccepted.layout).toBe('horizontal');
    expect(verticalAccepted.layout).toBe('vertical');
    expect(gridRefused.layout as unknown).toBe('grid');
    expect(nonsenseRefused.layout as unknown).toBe('zzzNonsense');
  });
});
