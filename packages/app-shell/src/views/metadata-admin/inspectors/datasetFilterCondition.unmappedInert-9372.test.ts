// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * An operator this bridge cannot express must be INERT, never destructive
 * (objectui#9372).
 *
 * ## The defect, and the split that carries it
 *
 * objectui#9363 repaired `isNull` / `isNotNull` one operator at a time. This
 * card is the same destruction four more times — `between`, `endsWith`,
 * `notContains`, `startsWith`, every one of them an ordinary entry in this
 * inspector's menu — and it separates two questions the card's own option list
 * ran together:
 *
 *   (i)  WHICH operators map to the dialect — a per-operator conformance
 *        question, answered below for three of the four.
 *   (ii) What happens when one does NOT map — not an open question. Erasing
 *        the author's stored filter is wrong whatever (i) answers.
 *
 * (ii) is what this file exists for, and it is fixed unconditionally: the
 * mechanism is that `undefined` out of {@link groupToCondition} means BOTH
 * "the author cleared the filter" AND "nothing survived serialization", and the
 * caller treated both as clear. That conflation is what makes an unmapped
 * operator destructive rather than inert.
 *
 * ## The second route, which needs no operator at all
 *
 * The conflation is reachable by blanking the VALUE of the only row — an
 * incomplete row is dropped by the same `continue`, the last part disappears,
 * and the function answers `undefined`. Pinned below beside the operator
 * route, because it is the same defect and a repair aimed only at operators
 * would leave it standing.
 *
 * ## What "leave it alone" is, and what it is deliberately not
 *
 * {@link isClearedGroup} answers the one question the caller could not ask
 * before: was `undefined` the author's CLEAR gesture? Only then is `undefined`
 * committed. Otherwise the caller patches nothing and the stored filter is
 * untouched.
 *
 * ⚠️ NOT "emit something". Emitting a filter in a spelling that means something
 * else is worse than dropping — that is the whole reason the unmapped arm
 * exists, and it survives this repair intact. `between` is still dropped
 * below, and now dropped inertly.
 *
 * ## Red-first
 *
 * Predicted before running, on the unmodified tree: the (ii) block fails at
 * `isClearedGroup` not being a function, and the three (i) mappings fail with
 * `undefined`, while the `equals` control in the SAME run passes — a table of
 * all-`undefined` answers and a dead function look identical otherwise.
 */
import { describe, it, expect } from 'vitest';
import {
  FILTER_OPERATORS,
  FieldOperatorsSchema,
  FILTER_TEXT_CASES,
  TEXT_OPERATOR_DOOR_CASES,
} from '@objectstack/spec/data';
import { filterValueArity, operatorsForFieldType } from '@object-ui/components';
import { groupToCondition, conditionToGroup, isClearedGroup } from './datasetFilterCondition';
import type { BuilderGroup } from './datasetFilterCondition';

/** One condition row, as the builder emits it. */
const row = (operator: string, value: unknown = ''): BuilderGroup => ({
  id: 'g',
  logic: 'and',
  conditions: [{ id: 'c1', field: 'name', operator, value }],
});

/** The author's stored filter, before they touch anything. */
const STORED = { name: { $eq: 'acme' } };

/**
 * The commit decision, spelled exactly as `DatasetFilterField` spells it.
 *
 * Returned rather than asserted inline so each gesture below reads as "what
 * would this commit", and so the HOLD case is a value rather than the absence
 * of a call.
 */
function commitFor(group: BuilderGroup): { hold: true } | { hold: false; filter: unknown } {
  const next = groupToCondition(group);
  if (next === undefined && !isClearedGroup(group)) return { hold: true };
  return { hold: false, filter: next };
}

describe('(ii) an operator this bridge cannot express is inert, not destructive (objectui#9372)', () => {
  it('CONTROL: a mapped operator still serializes, so an empty answer below is about that operator', () => {
    expect(groupToCondition(row('equals', 'acme'))).toEqual({ name: { $eq: 'acme' } });
  });

  it('tells the author\'s CLEAR gesture apart from a serialization that produced nothing', () => {
    // No rows at all is the clear gesture — "Clear all", or removing the last
    // row. `undefined` is the right commit for it and stays that way.
    expect(isClearedGroup({ id: 'g', logic: 'and', conditions: [] })).toBe(true);
    expect(isClearedGroup(undefined)).toBe(true);
    // A row with no field picked is not yet a row — `groupToCondition` filters
    // it out before anything else, so the two must agree here.
    expect(isClearedGroup(row('equals', 'acme'))).toBe(false);
    expect(isClearedGroup({ id: 'g', logic: 'and', conditions: [{ id: 'c1', field: '', operator: 'equals', value: 'x' }] })).toBe(true);
  });

  it('THE GESTURE, operator route: switching the only row to an unmapped operator commits NOTHING', () => {
    // The exact author gesture the card describes: a dataset that already has
    // a filter, opened in the inspector, one operator change. Before this
    // repair the commit was `undefined`, which the host spreads over the draft
    // as `{ filter: undefined }` — the same patch shape `objectChangePatch`
    // uses deliberately to CLEAR the filter.
    const { group, representable } = conditionToGroup(STORED);
    expect(representable).toBe(true);
    const edited: BuilderGroup = {
      ...group,
      conditions: [{ ...group.conditions[0], operator: 'between', value: [1, 5] }],
    };
    expect(groupToCondition(edited)).toBeUndefined();
    expect(
      commitFor(edited),
      'this gesture used to commit `undefined`, which ERASES the stored filter',
    ).toEqual({ hold: true });
  });

  it('THE GESTURE, blank-value route: blanking the only row\'s value commits NOTHING — no operator needed', () => {
    // The same defect reached without touching the operator menu at all: an
    // incomplete row is dropped by the same `continue`, the last part goes,
    // and the answer is `undefined`.
    const { group } = conditionToGroup(STORED);
    const blanked: BuilderGroup = {
      ...group,
      conditions: [{ ...group.conditions[0], value: '' }],
    };
    expect(groupToCondition(blanked)).toBeUndefined();
    expect(
      commitFor(blanked),
      'blanking the only row used to erase the stored filter, with no operator involved',
    ).toEqual({ hold: true });
  });

  it('a partly-edited group still commits the rows that DID survive', () => {
    // Holding is only for "nothing survived". One good row and one blank one
    // must still commit the good row, exactly as before.
    const mixed: BuilderGroup = {
      id: 'g',
      logic: 'and',
      conditions: [
        { id: 'c1', field: 'stage', operator: 'equals', value: 'won' },
        { id: 'c2', field: 'name', operator: 'between', value: [1, 5] },
      ],
    };
    expect(commitFor(mixed)).toEqual({ hold: false, filter: { stage: { $eq: 'won' } } });
  });

  it('the author CLEARING the filter still clears it — the repair does not strand a stale filter', () => {
    // The other half of the equality, and the reason this is a disambiguation
    // rather than a blanket "never commit undefined": with no rows left there
    // is no edit to preserve, and `undefined` is the author's own gesture.
    expect(commitFor({ id: 'g', logic: 'and', conditions: [] })).toEqual({ hold: false, filter: undefined });
  });
});

describe('(i) the three text operators this bridge now expresses (objectui#9372)', () => {
  const MAPPED: ReadonlyArray<readonly [string, string]> = [
    ['notContains', '$notContains'],
    ['startsWith', '$startsWith'],
    ['endsWith', '$endsWith'],
  ];

  it('serializes each one to the spec\'s own token', () => {
    for (const [operator, token] of MAPPED) {
      expect(groupToCondition(row(operator, 'ac')), `${operator} serialized to nothing`)
        .toEqual({ name: { [token]: 'ac' } });
    }
  });

  it('reads each one back as the operator the author picked', () => {
    for (const [operator, token] of MAPPED) {
      const { group, representable } = conditionToGroup({ name: { [token]: 'ac' } });
      expect(representable, `${token} fell back to the Source tab`).toBe(true);
      expect(group.conditions[0].operator).toBe(operator);
      expect(groupToCondition(group)).toEqual({ name: { [token]: 'ac' } });
    }
  });

  it('PREMISE, re-measured: the dialect CAN express all four — the file\'s comment was stale', () => {
    // The `unmapped (e.g. notContains/between)` comment read as "operators this
    // dialect genuinely cannot express". Measured against the pinned spec, all
    // four are members of its filter vocabulary, so the premise is false for
    // every one of them: they were not inexpressible, they were unmapped.
    for (const token of ['$notContains', '$startsWith', '$endsWith', '$between']) {
      expect(FILTER_OPERATORS).toContain(token);
    }
    // Negative control: membership is a real reading, not a list that contains
    // everything. A plausible spelling this bridge could have invented is not
    // in it.
    expect(FILTER_OPERATORS).not.toContain('$beginsWith');
  });

  it('CONFORMANCE: each one carries canonical driver cases, and `$between` is not in that table', () => {
    // The reading `$null` has and these were said to lack. `FILTER_TEXT_CASES`
    // is the Filter Protocol's text-operator standard — the table every filter
    // backend is checked against — and it carries rows for all three.
    const covered = new Set<string>();
    for (const c of FILTER_TEXT_CASES) {
      for (const ops of Object.values(c.filter as Record<string, unknown>)) {
        if (ops && typeof ops === 'object') for (const k of Object.keys(ops)) covered.add(k);
      }
    }
    for (const [, token] of MAPPED) expect(covered, `${token} has no text-conformance rows`).toContain(token);
    // Negative control: this is a reading of one table, not of "every operator
    // is covered". `$between` is a range operator and is NOT in it — which is
    // why the conformance answer for `between` has to be sought elsewhere, and
    // is not what this assertion supplies.
    expect(covered).not.toContain('$between');
  });

  it('CONFORMANCE: the spec\'s declared-type door passes all three over text and refuses them over number', () => {
    // The authoring half. This bridge only ever emits these three from the
    // builder's TEXT bucket (asserted below), which is the side the door
    // passes; the refusals are what make the pass a reading rather than a
    // table that says yes to everything.
    for (const [, token] of MAPPED) {
      const forText = TEXT_OPERATOR_DOOR_CASES.filter((c) => c.operator === token && c.declaredType === 'text');
      expect(forText.length, `${token} has no door case over text`).toBeGreaterThan(0);
      for (const c of forText) expect(c.verdict, `${token} over text`).toBe('passes');
      const forNumber = TEXT_OPERATOR_DOOR_CASES.filter((c) => c.operator === token && c.declaredType === 'number');
      expect(forNumber.length, `${token} has no door case over number`).toBeGreaterThan(0);
      for (const c of forNumber) expect(c.verdict, `${token} over number`).toBe('door-refusal');
    }
  });

  it('CONFORMANCE: the comparand door accepts the string this builder types and refuses a number', () => {
    for (const [, token] of MAPPED) {
      expect(FieldOperatorsSchema.safeParse({ [token]: 'ac' }).success, `${token} refused a string`).toBe(true);
      // Negative control: this door judges the VALUE, so without this leg the
      // assertion above would pass for a schema that accepts anything.
      expect(FieldOperatorsSchema.safeParse({ [token]: 5 }).success, `${token} accepted a number`).toBe(false);
    }
  });

  it('the builder only OFFERS these three on text-like fields, which is the side the door passes', () => {
    // The two halves have to meet: the door refuses these operators over
    // `number` / `date` / `boolean`, so mapping them is only safe while the
    // dropdown never offers them there. Read from the builder's own bucket
    // function rather than restated.
    const offered = (type: string | undefined) => operatorsForFieldType(type, []).map((o) => o.value);
    for (const [operator] of MAPPED) {
      expect(offered('text'), `${operator} is not offered on text`).toContain(operator);
      for (const type of ['number', 'currency', 'percent', 'rating', 'date', 'datetime', 'time', 'boolean']) {
        expect(offered(type), `${operator} is offered on ${type}, where the spec's door refuses it`)
          .not.toContain(operator);
      }
    }
  });
});

describe('`between` stays unmapped — and is now unmapped INERT (objectui#9372)', () => {
  it('is still dropped rather than emitted', () => {
    expect(groupToCondition(row('between', [1, 5]))).toBeUndefined();
  });

  it('the reason it stays out, measured: nothing downstream catches a half-filled pair', () => {
    // The builder pads a pair with `""` when only one bound is typed
    // (`reshapeFilterValue`), and the row is two entries long, so this bridge's
    // completeness check — which only rejects `null` / `''` / `[]` — would let
    // it through. The spec's comparand door does not catch it either: a bound
    // of `''` parses. So emitting `between` today would emit a filter that
    // means something the author did not ask for, which is exactly what the
    // unmapped arm exists to prevent. A both-bounds-present rule is the
    // precondition, and it is a separate decision.
    expect(filterValueArity('between')).toBe('pair');
    expect(FieldOperatorsSchema.safeParse({ $between: [1, 5] }).success).toBe(true);
    expect(
      FieldOperatorsSchema.safeParse({ $between: [1, ''] }).success,
      'if the spec refused a half-filled pair, this bridge could lean on it instead of a local rule',
    ).toBe(true);
  });

  it('but picking it no longer erases the stored filter', () => {
    // The whole point of the (i)/(ii) split: an operator can stay unmapped
    // without staying destructive.
    expect(commitFor(row('between', [1, 5]))).toEqual({ hold: true });
  });
});
