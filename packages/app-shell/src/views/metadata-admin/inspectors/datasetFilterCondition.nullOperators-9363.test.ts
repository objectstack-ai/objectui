// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `Is null` must not ERASE the stored dataset filter (objectui#9363).
 *
 * ## The mechanism, and why it is data loss rather than a wrong result set
 *
 * `groupToCondition` returns `undefined` when no row survives serialization,
 * and the Studio dataset inspector commits on EVERY change — the filter popover
 * mounts the shared `FilterBuilder` and hands each emitted group straight to
 * `onCommit(groupToCondition(g))`, which lands as `onPatch({ filter })` and is
 * spread over the draft. So an author with a working `dataset.filter` who opens
 * the inspector and switches the single condition's operator to **Is null**
 * commits `undefined`: the persisted key is destroyed, nothing errors, and the
 * panel still shows the condition.
 *
 * The inspector passes no `extraOperators`, so `isNull` / `isNotNull` are
 * ordinary entries in the default menu — not opt-in ones. The parity block at
 * the bottom of this file reads that offering from the builder's own exported
 * bucket function rather than restating it.
 *
 * ## The distinction this file exists to keep
 *
 * The `continue` these two operators fell into is a DELIBERATE decision for
 * operators the bridge does not map: dropping beats emitting a filter that
 * means something else. That behaviour is kept, and pinned below, because a
 * repair that made the fallback stop dropping everything it cannot map would
 * emit wrong filters — a worse defect than this one.
 *
 * `isNull` / `isNotNull` are a different case and that is the whole repair: the
 * dialect CAN express them (the spec's own `$null`, asserted below against
 * `FILTER_OPERATORS` rather than assumed), the builder draws them as COMPLETE
 * rows with no value input, and this inspector offers them. The drop was an
 * unhandled operator falling into the fallback's path, not the fallback doing
 * its job. Both readings are pinned so they stay distinguishable.
 *
 * ## Red-first
 *
 * Before the repair, the two `$null` expectations fail with `undefined` while
 * the `equals` control in the same run passes — a table of all-`undefined`
 * answers and a dead function are otherwise indistinguishable.
 */
import { describe, it, expect } from 'vitest';
import { FILTER_OPERATORS, FieldOperatorsSchema } from '@objectstack/spec/data';
import {
  FILTER_BUILDER_OPERATORS,
  VALUELESS_FILTER_BUILDER_OPERATORS,
  operatorsForFieldType,
} from '@object-ui/components';
import { groupToCondition, conditionToGroup } from './datasetFilterCondition';
import type { BuilderGroup } from './datasetFilterCondition';

/** One condition row, as the builder emits it. */
const row = (operator: string, value: unknown = ''): BuilderGroup => ({
  id: 'g',
  logic: 'and',
  conditions: [{ id: 'c1', field: 'closed_at', operator, value }],
});

describe('groupToCondition — the null predicates this inspector offers (objectui#9363)', () => {
  it('CONTROL: a mapped operator still serializes, so an empty answer below is about that operator', () => {
    expect(groupToCondition(row('equals', 'acme'))).toEqual({ closed_at: { $eq: 'acme' } });
  });

  it('isNull serializes to the dialect\'s null predicate instead of vanishing', () => {
    expect(
      groupToCondition(row('isNull')),
      'an `Is null` row serialized to nothing; committing that ERASES dataset.filter',
    ).toEqual({ closed_at: { $null: true } });
  });

  it('isNotNull serializes to the same predicate negated', () => {
    expect(groupToCondition(row('isNotNull'))).toEqual({ closed_at: { $null: false } });
  });

  it('keeps a null row alongside a complete one instead of dropping either', () => {
    expect(groupToCondition({
      id: 'g',
      logic: 'and',
      conditions: [
        { id: 'c1', field: 'stage', operator: 'equals', value: 'won' },
        { id: 'c2', field: 'closed_at', operator: 'isNull', value: '' },
      ],
    })).toEqual({ $and: [{ stage: { $eq: 'won' } }, { closed_at: { $null: true } }] });
  });

  it('THE DEFECT: switching the only row of a stored filter to Is null no longer commits `undefined`', () => {
    // The exact author gesture: a dataset that already has a filter, opened in
    // the inspector, one operator change. `undefined` here is not "unchanged" —
    // it is what the host spreads over the draft as `{ filter: undefined }`,
    // the same patch shape `objectChangePatch` uses to CLEAR the filter.
    const stored = { stage: { $eq: 'won' } };
    const { group, representable } = conditionToGroup(stored);
    expect(representable).toBe(true);
    const edited: BuilderGroup = {
      ...group,
      conditions: [{ ...group.conditions[0], operator: 'isNull', value: '' }],
    };
    expect(
      groupToCondition(edited),
      'the commit for this gesture was `undefined`, which erases the stored filter',
    ).toEqual({ stage: { $null: true } });
  });

  it('leaves the $exists pair exactly as it was', () => {
    expect(groupToCondition(row('isEmpty'))).toEqual({ closed_at: { $exists: false } });
    expect(groupToCondition(row('isNotEmpty'))).toEqual({ closed_at: { $exists: true } });
  });

  it('still drops an operator it does not map, rather than emitting a wrong filter', () => {
    // Deliberate, and kept: see this file's header.
    //
    // objectui#9372 took the other three of the four this listed — the
    // `notContains` / `startsWith` / `endsWith` rows are asserted as EMITTED
    // in `datasetFilterCondition.unmappedInert-9372`, with the conformance
    // reading behind each — and made the remaining drop inert. `between` is
    // what is left: still offered, still dropped, and no longer destructive.
    expect(groupToCondition(row('between', [1, 5]))).toBeUndefined();
  });

  it('an empty group is still `undefined` — that is the author CLEARING the filter', () => {
    expect(groupToCondition({ id: 'g', logic: 'and', conditions: [] })).toBeUndefined();
  });
});

describe('the emitted token is the spec\'s, not a local invention (objectui#9363)', () => {
  it('`$null` is a member of the spec\'s filter operator vocabulary', () => {
    expect(FILTER_OPERATORS).toContain('$null');
    // Negative control: membership is a real reading, not a list that contains
    // everything. A plausible-looking spelling this bridge could have invented
    // is NOT in it.
    expect(FILTER_OPERATORS).not.toContain('$isNull');
  });

  it('the spec\'s field-operator door accepts the boolean comparand and refuses a wrong one', () => {
    expect(FieldOperatorsSchema.safeParse({ $null: true }).success).toBe(true);
    expect(FieldOperatorsSchema.safeParse({ $null: false }).success).toBe(true);
    // Negative control: this door judges the VALUE, so a string comparand is
    // refused — without this leg the assertion above would pass for a schema
    // that accepts anything.
    expect(FieldOperatorsSchema.safeParse({ $null: 'yes' }).success).toBe(false);
  });
});

describe('conditionToGroup — the read half round-trips the new shape (objectui#9363)', () => {
  it('reads a stored $null back as the operator the author picked', () => {
    expect(conditionToGroup({ closed_at: { $null: true } })).toEqual({
      group: { id: 'g', logic: 'and', conditions: [{ id: 'c0', field: 'closed_at', operator: 'isNull', value: '' }] },
      representable: true,
    });
    expect(conditionToGroup({ closed_at: { $null: false } }).group.conditions[0].operator)
      .toBe('isNotNull');
  });

  it('round-trips condition → group → condition', () => {
    for (const c of [{ closed_at: { $null: true } }, { closed_at: { $null: false } }]) {
      const { group, representable } = conditionToGroup(c);
      expect(representable, `${JSON.stringify(c)} fell back to the source editor`).toBe(true);
      expect(groupToCondition(group)).toEqual(c);
    }
  });
});

/**
 * Offered ⇄ expressible parity for THIS inspector.
 *
 * The direction that broke: every guard in the repo sweeps spec → objectui,
 * asking whether an operator an author may DECLARE can be rendered. None asks
 * whether an operator this dropdown OFFERS can be stored by the consumer that
 * mounted it — and that is the direction where an unmapped operator becomes
 * silent data loss rather than a rendering gap.
 *
 * The offering is read from the builder's own bucket function with NO
 * `extraOperators`, which is exactly what `DatasetFilterField` passes, so a
 * future opt-in granted at that call site has to come through here.
 */
const PROBE_FIELD_TYPES: ReadonlyArray<string | undefined> = [
  undefined, 'text', 'a_type_this_builder_has_never_heard_of', 'number', 'currency',
  'percent', 'rating', 'boolean', 'date', 'datetime', 'time', 'select', 'status',
  'lookup', 'master_detail', 'user',
];

function offeredAcrossBuckets(extra: readonly string[]): string[] {
  const ids = new Set<string>();
  for (const type of PROBE_FIELD_TYPES) for (const op of operatorsForFieldType(type, extra)) ids.add(op.value);
  return [...ids].sort();
}

/** What the dataset inspector's filter popover offers. */
const OFFERED = offeredAcrossBuckets([]);

/**
 * Offered, and deliberately NOT expressible by this bridge today.
 *
 * Each one drops on commit. ⚠️ That drop used to ERASE the stored filter when
 * no other row survived — the same mechanism objectui#9363 fixed for the null
 * pair — and objectui#9372 ended that: the caller now tells "nothing survived"
 * apart from "the author cleared", so a drop is inert
 * (`datasetFilterCondition.unmappedInert-9372`). Being on this list is now a
 * missing capability, not data loss.
 *
 * objectui#9372 also took three of the four this listed. `between` is what
 * remains, and it remains for a reason that is about THIS bridge rather than
 * the spec's vocabulary: the builder pads a half-typed pair with `''` and the
 * spec's comparand door accepts `[1, '']`, so it needs a both-bounds-present
 * rule before it can be emitted at all. Mapping it is what makes this list
 * shrink — and this assertion go red until it is updated.
 */
const DECLARED_UNEXPRESSIBLE = ['between'];

/** A value that keeps a row from being dropped as INCOMPLETE, per operator. */
function probeValue(operator: string): unknown {
  if (VALUELESS_FILTER_BUILDER_OPERATORS.has(operator)) return '';
  if (operator === 'in' || operator === 'notIn') return ['a', 'b'];
  if (operator === 'between') return [1, 5];
  return 'x';
}

describe('every operator this inspector OFFERS is either expressible or declared (objectui#9363)', () => {
  it('the probe types cover every bucket, so the offering below is the whole dropdown', () => {
    // Granting every id as an opt-in yields the full drawable vocabulary only
    // if the probe list reaches every bucket. Without this, a bucket added
    // later would silently shrink what the partition below is asserted over.
    expect(offeredAcrossBuckets(FILTER_BUILDER_OPERATORS)).toEqual([...FILTER_BUILDER_OPERATORS].sort());
  });

  it('partitions the offering exactly — no operator is silently unhandled', () => {
    const expressible: string[] = [];
    const dropped: string[] = [];
    for (const operator of OFFERED) {
      (groupToCondition(row(operator, probeValue(operator))) === undefined ? dropped : expressible)
        .push(operator);
    }
    expect(dropped.sort()).toEqual(DECLARED_UNEXPRESSIBLE);
    // The other half of the equality: every remaining offered id serializes.
    expect(expressible.sort()).toEqual(OFFERED.filter((o) => !DECLARED_UNEXPRESSIBLE.includes(o)));
    // And the null pair is on the expressible side — the card's defect, stated
    // as a fact about the offering rather than about two literals.
    expect(expressible).toContain('isNull');
    expect(expressible).toContain('isNotNull');
  });
});
