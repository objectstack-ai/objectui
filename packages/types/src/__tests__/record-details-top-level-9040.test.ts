/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9040 — `RecordDetailsComponentProps`'s TOP LEVEL against the
 * contract, in both directions. objectui#8583 reconciled `sections[]`
 * member-for-member and objectui#8604 fixed the top-level `columns` type; the
 * top-level KEY SET had never been reconciled, and it diverged both ways.
 *
 * Direction 1 — OMISSIONS (fixed here). `hideFields`, `inlineEdit` and
 * `showHeader` are declared by `@objectstack/spec`, read by
 * `RecordDetailsRenderer`, and published as inputs by
 * `@object-ui/plugin-detail`'s registry manifest (objectui#3808 for
 * `hideFields`, objectui#4668 for the other two). Every layer declared them
 * except this published TypeScript face, so a spec-valid, renderer-honoured,
 * registry-published document was refused by `tsc` with `TS2353`.
 *
 * Direction 2 — the RETIRED `layout` (NOT fixed here; ledgered). The contract
 * refuses it by name. Removing it from this interface is a published-surface
 * retirement that breaks an in-repo consumer (`p1-spec-alignment.test.ts`),
 * and triage on objectui#9040 ruled that consumer out of this card's scope.
 * So this file pins the divergence as OPEN rather than pretending it is shut:
 * the legs below fail when the key is removed, which is how the remover finds
 * the rest of the work (move the consumer, ship the `minor` retirement
 * changeset) instead of discovering it from CI.
 *
 * ── Two instruments, and only ONE of them can see direction 1 ───────────────
 *   - `tsc` sees the `@ts-expect-error` legs and the `Equal` assertions. That
 *     is the ONLY half that discriminates the fix from the defect, because the
 *     defect was a TypeScript-only refusal. It means nothing unless
 *     `type-check` runs — vitest strips types.
 *   - vitest runs the `safeParse` legs against the INSTALLED published spec
 *     artifact (17.4.0 at the time of writing), each with a control that would
 *     have fired. ⚠️ Those legs read the SPEC ONLY: they were green before this
 *     change and are green after, so they are the PREMISE, never the evidence.
 *     They are labelled PREMISE below so nobody counts them as the fix.
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import { RecordDetailsProps } from '@objectstack/spec/ui';
import type { RecordDetailsComponentProps } from '../record-components';

/** What an author writes for the spec's `record:details` props bag. */
type SpecProps = z.input<typeof RecordDetailsProps>;

/** Invariant type equality. `A extends B` is NOT this: `never` and `any` pass that. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The only assertion form used here — its constraint is what refuses `false`. */
type Expect<T extends true> = T;

/* ── Direction proofs: a broken instrument makes THIS file red ─────────────── */

// @ts-expect-error objectui#9040 — `Expect` must refuse `false`. Widen its constraint and this directive goes unused (TS2578).
type _ExpectRefusesFalse = Expect<false>;

// @ts-expect-error objectui#9040 — `never` must NOT read as equal to `true`. An `extends`-shaped comparison would let it through.
type _EqualRefusesNever = Expect<Equal<never, true>>;

// @ts-expect-error objectui#9040 — `any` must NOT read as equal to `true`, for the same reason.
type _EqualRefusesAny = Expect<Equal<any, true>>;

/* ── Direction 1: the three omitted keys carry the contract's own types ────── */

/** RED before objectui#9040 (the key did not exist here), green after. */
type _HideFields = Expect<
  Equal<RecordDetailsComponentProps['hideFields'], SpecProps['hideFields']>
>;
type _InlineEdit = Expect<
  Equal<RecordDetailsComponentProps['inlineEdit'], SpecProps['inlineEdit']>
>;
type _ShowHeader = Expect<
  Equal<RecordDetailsComponentProps['showHeader'], SpecProps['showHeader']>
>;

/**
 * Spelled out as well as derived. `Equal` against `SpecProps` would also be
 * satisfied if BOTH faces drifted to the same wrong type; these say what the
 * type actually is, so a spec that widened `hideFields` to accept the `{name}`
 * dialect the renderer tolerates cannot pull this declaration along silently.
 */
type _HideFieldsIsBareNames = Expect<
  Equal<RecordDetailsComponentProps['hideFields'], string[] | undefined>
>;
type _InlineEditIsBoolean = Expect<
  Equal<RecordDetailsComponentProps['inlineEdit'], boolean | undefined>
>;
type _ShowHeaderIsBoolean = Expect<
  Equal<RecordDetailsComponentProps['showHeader'], boolean | undefined>
>;

/**
 * The card's repro, as a literal. Every key here is spec-valid and honoured by
 * `RecordDetailsRenderer`; before objectui#9040 this object did not compile
 * (`TS2353`, three times over) while the contract accepted the document.
 */
const omittedKeysAccepted: RecordDetailsComponentProps = {
  hideFields: ['name'],
  inlineEdit: false,
  showHeader: true,
};

/**
 * The value fences, in the direction the contract holds.
 *
 * ⚠️ NOT evidence for direction 1: an unknown key is `TS2353` too, so these
 * directives were "used" before the fix as well and cannot tell the two worlds
 * apart. The `Equal` assertions above are what do that. These exist so the new
 * keys cannot later be loosened to `any` / `unknown` without a red line.
 */
const hideFieldsRefusesTheTolerantDialect: RecordDetailsComponentProps = {
  // @ts-expect-error objectui#9040 — `hideFields` is `z.array(z.string())`: bare field names, never the `{name}` objects the renderer tolerates at its read site.
  hideFields: [{ name: 'amount' }],
};

const inlineEditRefusesStrings: RecordDetailsComponentProps = {
  // @ts-expect-error objectui#9040 — `inlineEdit` is a boolean on both faces; the string is refused here and with `invalid_type` at publish.
  inlineEdit: 'yes',
};

/* ── Direction 2: the retired `layout`, ledgered as an OPEN divergence ─────── */

/**
 * The TS face still declares `layout`; the contract's face accepts nothing
 * there (`z.never()` under its optional wrapper, so the authoring type is
 * `undefined`). The two faces DISAGREE, and that is the defect this asserts —
 * it is a ledger entry, ⛔ not an endorsement.
 *
 * Remove the key and this line stops compiling (`TS2339`), which is the point:
 * the removal is a retirement with its own obligations, and this is where its
 * checklist lives.
 */
type _LayoutFacesDisagree = Expect<
  Equal<Equal<RecordDetailsComponentProps['layout'], SpecProps['layout']>, false>
>;

/** What each face actually says, so "disagree" is not satisfied by two unknowns. */
type _LayoutOnTheTsFace = Expect<
  Equal<RecordDetailsComponentProps['layout'], 'stacked' | 'inline' | 'compact' | undefined>
>;
type _LayoutOnTheContractFace = Expect<Equal<SpecProps['layout'], undefined>>;

/**
 * The trap, as a literal: `tsc` is green on a document the contract refuses.
 * ⛔ Do not author this. When the retirement lands, this `const` is deleted
 * together with the key.
 */
const layoutCompilesButIsRefusedAtPublish: RecordDetailsComponentProps = {
  layout: 'stacked',
};

describe('objectui#9040 — record:details top level, against the installed spec', () => {
  it('PREMISE (spec-only): the three keys are live members that judge their values', () => {
    // Spec-only: green before and after objectui#9040. It is here so a spec
    // that retires one of the three fails HERE, naming the key, instead of
    // leaving the declarations above asserting a shape the contract dropped.
    for (const [payload, expected] of [
      [{ hideFields: ['secret'] }, { hideFields: ['secret'] }],
      [{ inlineEdit: true }, { inlineEdit: true }],
      [{ inlineEdit: false }, { inlineEdit: false }],
      [{ showHeader: true }, { showHeader: true }],
    ] as const) {
      const parsed = RecordDetailsProps.safeParse(payload);
      // A FULL green parse, not merely "no unrecognized_keys": these legs are
      // about the key being real AND its value being judged.
      expect(parsed.success, `the contract refused ${JSON.stringify(payload)}`).toBe(true);
      expect(parsed.data).toMatchObject(expected);
    }

    // The other half: each key judges VALUES, so "accepted" above is not the
    // same reading an open bag would produce.
    for (const [key, bad] of [
      ['hideFields', 'notAnArray'],
      ['inlineEdit', 'yes'],
      ['showHeader', 'yes'],
    ] as const) {
      const refused = RecordDetailsProps.safeParse({ [key]: bad });
      expect(refused.success, `${key} accepted a wrongly-typed value`).toBe(false);
      const issue = refused.error?.issues.find((i) => i.path.join('.') === key);
      expect(issue?.code, `${key} was refused, but not at its own path`).toBe('invalid_type');
    }

    // THE CONTROL, on the same instrument: an undeclared key is refused with a
    // DIFFERENT code, so the greens above are about these three keys and not
    // about a schema that accepts anything.
    const nonsense = RecordDetailsProps.safeParse({ zzzNonsenseKey: 'whatever' });
    expect(nonsense.success).toBe(false);
    expect(nonsense.error?.issues[0]?.code).toBe('unrecognized_keys');
  });

  it('PREMISE (spec-only): `layout` is refused BY NAME, not swept up as an unknown key', () => {
    // The distinction this leg exists for: a tombstone is still a declared
    // member typed `never`, so it fails with `invalid_type` at its own path
    // and carries the removal prescription. An undeclared key fails with
    // `unrecognized_keys` at the root. Reading them as the same failure is how
    // a retired key gets mistaken for a typo.
    for (const value of ['stacked', 'inline', 'compact', 'auto', 'custom']) {
      const refused = RecordDetailsProps.safeParse({ layout: value });
      expect(refused.success, `the contract accepted layout: ${value}`).toBe(false);
      const issue = refused.error?.issues.find((i) => i.path.join('.') === 'layout');
      expect(issue?.code).toBe('invalid_type');
      expect(issue?.message).toContain('was removed in @objectstack/spec 17.0.0');
    }

    // CONTROL A — a near-miss typo of the same key gets the OTHER code, which
    // is what makes "by name" a reading rather than a claim.
    const typo = RecordDetailsProps.safeParse({ layoutt: 'compact' });
    expect(typo.success).toBe(false);
    expect(typo.error?.issues[0]?.code).toBe('unrecognized_keys');

    // CONTROL B — a live key on the same instrument parses green, so the
    // refusals above are not a schema refusing everything.
    expect(RecordDetailsProps.safeParse({ columns: '2' }).success).toBe(true);
  });

  it('CONTROL: the keys that were ALREADY correct stay correct on both faces', () => {
    // The live control for the ablation of this change: `columns`, `fields`,
    // `sections` and `aria` are green whether or not objectui#9040 is applied.
    // A leg that cannot tell the two worlds apart is named as such and is not
    // counted as evidence — this one exists to catch an over-broad revert that
    // takes the whole interface with it.
    const alreadyCorrect: RecordDetailsComponentProps = {
      columns: '2',
      fields: ['name'],
      sections: [{ label: 'Info', fields: ['name'] }],
      aria: { ariaLabel: 'Account Details' },
    };
    expect(alreadyCorrect.columns).toBe('2');

    const parsed = RecordDetailsProps.safeParse({
      columns: '2',
      fields: ['name'],
      sections: [{ label: 'Info', fields: ['name'] }],
      aria: { ariaLabel: 'Account Details' },
    });
    expect(parsed.success).toBe(true);
  });

  it('the literals above are real values, not type-only decoration', () => {
    // vitest strips types, so these expectations are NOT the assertion — the
    // annotations are. They exist so the file also fails visibly if the
    // literals are ever silently emptied out.
    expect(omittedKeysAccepted.hideFields).toEqual(['name']);
    expect(omittedKeysAccepted.inlineEdit).toBe(false);
    expect(omittedKeysAccepted.showHeader).toBe(true);
    expect(hideFieldsRefusesTheTolerantDialect.hideFields as unknown).toEqual([{ name: 'amount' }]);
    expect(inlineEditRefusesStrings.inlineEdit as unknown).toBe('yes');
    expect(layoutCompilesButIsRefusedAtPublish.layout).toBe('stacked');
  });

  it('the whole document the three keys make possible is accepted by the contract', () => {
    // End to end, in the shape a page actually authors: the omitted-keys fix is
    // only worth anything if the keys compose with the ones already declared.
    const authored: RecordDetailsComponentProps = {
      columns: '2',
      fields: ['name', 'amount', 'stage'],
      hideFields: ['name'],
      inlineEdit: false,
      showHeader: true,
      sections: [{ name: 'info', label: 'Info', fields: ['amount'], columns: 2 }],
      aria: { ariaLabel: 'Opportunity Details' },
    };

    const parsed = RecordDetailsProps.safeParse(authored);
    expect(
      parsed.success,
      `the contract refused a document this type now accepts: ${JSON.stringify(
        parsed.success ? [] : parsed.error.issues,
      )}`,
    ).toBe(true);
  });
});
