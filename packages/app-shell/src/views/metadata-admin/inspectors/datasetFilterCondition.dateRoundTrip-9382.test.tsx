// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * A dataset filter built with `After` on a date column reads back as an
 * operator that column offers (objectui#9382).
 *
 * ## The defect
 *
 * `OP_TO_MONGO` writes `$gt` for BOTH `greaterThan` and `after`, and the spec's
 * filter vocabulary has one token for "strictly greater" — there is no
 * `$after`. So the stored filter is correct and filters correctly; what the
 * fixed read-back table lost was the LABEL. A `$gt` came back as `greaterThan`,
 * which the date bucket does not list, and Radix draws a blank trigger for a
 * value no mounted item carries.
 *
 * ## DIRECTION, predicted before running
 *
 * On the pre-fix tree:
 *
 *   - `the operator a date column reads back is one it offers` — RED, for
 *     `after` and `before`, on each of `date` / `datetime` / `time`;
 *   - `the panel names the operator the author picked` — RED, trigger is `""`;
 *   - `every pair the dropdown can build survives the round trip` — RED on
 *     exactly those 6 pairs and green on the other 116;
 *   - everything under `controls` and `boundaries the repair must not cross` —
 *     GREEN in both directions, by construction. They are not pins: a suite
 *     built only on them could not fail.
 *
 * ## The control this card's own body insists on
 *
 * `greaterThan` IS a member of the number bucket. That is what makes "the date
 * bucket does not contain it" a reading about DATES rather than a lookup that
 * answers `false` for everything, and it is asserted here rather than assumed.
 * The same guard runs on the identity of the answers: the round trip must yield
 * a NON-EMPTY operator and the bucket must be NON-EMPTY, so the membership test
 * can never pass by comparing two absences.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterBuilder, operatorsForFieldType } from '@object-ui/components';
import { groupToCondition, conditionToGroup, type BuilderFieldDef } from './datasetFilterCondition';

/** Every field type whose bucket the dataset inspector can draw. */
const PROBE_FIELD_TYPES = [
  'text', 'number', 'currency', 'percent', 'rating',
  'date', 'datetime', 'time', 'boolean',
  'select', 'status', 'lookup', 'master_detail', 'user',
] as const;

/** The bucket the dropdown actually lists — no opt-in extras, as the inspector mounts it. */
const offeredBy = (type: string): string[] => operatorsForFieldType(type).map((o) => o.value);

/**
 * A value each operator's row is complete with.
 *
 * `between` carries two DAYS: the builder offers it on the date bucket only,
 * and since objectui#10062 it is stored, so its bounds reach the round trip.
 */
function probeValue(operator: string): unknown {
  if (operator === 'between') return ['2026-01-01', '2026-03-31'];
  if (operator === 'in' || operator === 'notIn') return ['a'];
  return '2026-01-01';
}

/**
 * The whole author gesture, end to end: build the row the way the panel builds
 * it, store what the inspector stores, then reopen it the way the inspector
 * reopens it. Deliberately NOT a lookup in either table — a pin that asserted
 * the mapping directly would pass on a repair that never reached the round trip.
 */
function roundTrip(field: string, operator: string, fields: readonly BuilderFieldDef[]) {
  const built = { id: 'g', logic: 'and' as const, conditions: [{ id: 'c1', field, operator, value: probeValue(operator) }] };
  const stored = groupToCondition(built);
  const { group, representable } = conditionToGroup(stored, fields);
  return { stored, representable, readBack: group.conditions[0]?.operator };
}

const FIELDS: BuilderFieldDef[] = [
  { value: 'closed_at', label: 'Closed at', type: 'date' },
  { value: 'logged_at', label: 'Logged at', type: 'datetime' },
  { value: 'starts_at', label: 'Starts at', type: 'time' },
  { value: 'amount', label: 'Amount', type: 'number' },
];

describe('the operator a date column reads back is one it offers (objectui#9382)', () => {
  it.each([
    { field: 'closed_at', type: 'date', operator: 'after', token: '$gt' },
    { field: 'closed_at', type: 'date', operator: 'before', token: '$lt' },
    { field: 'logged_at', type: 'datetime', operator: 'after', token: '$gt' },
    { field: 'logged_at', type: 'datetime', operator: 'before', token: '$lt' },
    { field: 'starts_at', type: 'time', operator: 'after', token: '$gt' },
    { field: 'starts_at', type: 'time', operator: 'before', token: '$lt' },
  ])('$type column filtered with $operator reopens as $operator', ({ field, type, operator, token }) => {
    const { stored, representable, readBack } = roundTrip(field, operator, FIELDS);

    // The stored bytes are the collapse and stay the collapse — this repair is
    // on the READ half and gives `after` no new token of its own.
    expect(stored).toEqual({ [field]: { [token]: '2026-01-01' } });
    expect(representable).toBe(true);

    // Two absences must not compare equal: the answer has to be a real operator.
    expect(typeof readBack).toBe('string');
    expect(readBack).not.toBe('');

    expect(readBack).toBe(operator);
    expect(offeredBy(type)).toContain(readBack);
  });

  it('every pair the dropdown can build survives the round trip into that same bucket', () => {
    const broken: string[] = [];
    let checked = 0;
    for (const type of PROBE_FIELD_TYPES) {
      const offered = offeredBy(type);
      expect(offered.length, `${type} bucket is empty — the membership test would be vacuous`).toBeGreaterThan(0);
      for (const operator of offered) {
        const fields: BuilderFieldDef[] = [{ value: 'f', type }];
        const { stored, readBack } = roundTrip('f', operator, fields);
        // Every operator a bucket offers is stored now — `between` was the
        // last one skipped here, and objectui#10062 maps it — so a dropped row
        // is a break, not something to step over.
        if (stored === undefined) { broken.push(`${type}/${operator} -> dropped`); continue; }
        checked++;
        if (!readBack || !offered.includes(readBack)) broken.push(`${type}/${operator} -> ${String(readBack)}`);
      }
    }
    // The denominator is asserted too, so a suite that silently stopped
    // building rows could not read as a clean sweep.
    expect(checked).toBeGreaterThan(100);
    expect(broken).toEqual([]);
  });
});

describe('a date range reopens as the range the author built (objectui#10062)', () => {
  it.each([
    { field: 'closed_at', type: 'date' },
    { field: 'logged_at', type: 'datetime' },
    { field: 'starts_at', type: 'time' },
  ])('$type column filtered with between stores $between and reopens as between, bounds intact', ({ field, type }) => {
    const { stored, representable, readBack } = roundTrip(field, 'between', FIELDS);

    expect(stored).toEqual({ [field]: { $between: ['2026-01-01', '2026-03-31'] } });
    expect(representable).toBe(true);
    expect(readBack).toBe('between');
    expect(offeredBy(type)).toContain(readBack);
    // The bounds come back as the pair, in order — not as one bound or a string.
    expect(conditionToGroup(stored, FIELDS).group.conditions[0].value).toEqual(['2026-01-01', '2026-03-31']);
  });

  it('the panel draws the stored range: "Between", both bounds on screen, nothing written back', () => {
    const { group } = conditionToGroup({ closed_at: { $between: ['2026-01-01', '2026-03-31'] } }, FIELDS);
    const onChange = vi.fn();
    render(<FilterBuilder fields={FIELDS as never} value={group as never} onChange={onChange} />);

    expect(screen.getAllByRole('combobox')[1]?.textContent).toBe('Between');
    expect(screen.getByDisplayValue('2026-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-03-31')).toBeInTheDocument();
    // A COMPLETE pair: neither bound is marked as the missing one.
    expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    cleanup();
  });
});

describe('the panel names the operator the author picked', () => {
  /** What the operator trigger DISPLAYS. Blank is the symptom this card is about. */
  const operatorTriggerText = () => screen.getAllByRole('combobox')[1]?.textContent;

  it.each([
    { operator: 'after', label: 'After' },
    { operator: 'before', label: 'Before' },
  ])('a date filter stored from $operator reopens showing "$label"', ({ operator, label }) => {
    const { group } = conditionToGroup(
      groupToCondition({ id: 'g', logic: 'and', conditions: [{ id: 'c1', field: 'closed_at', operator, value: '2026-01-01' }] }),
      FIELDS,
    );
    const onChange = vi.fn();
    render(<FilterBuilder fields={FIELDS as never} value={group as never} onChange={onChange} />);

    expect(operatorTriggerText()).toBe(label);
    // Reopening a stored filter must not itself write one back.
    expect(onChange).not.toHaveBeenCalled();
    cleanup();
  });
});

describe('controls — these are lit in BOTH directions and are not pins', () => {
  it('greaterThan IS a member of the number bucket', () => {
    // Without this, "the date bucket does not contain greaterThan" could be a
    // lookup that answers false for every word.
    expect(offeredBy('number')).toContain('greaterThan');
    expect(offeredBy('date')).not.toContain('greaterThan');
    expect(offeredBy('date')).toContain('after');
  });

  it('a number column still round-trips greaterThan / lessThan unchanged', () => {
    expect(roundTrip('amount', 'greaterThan', FIELDS).readBack).toBe('greaterThan');
    expect(roundTrip('amount', 'lessThan', FIELDS).readBack).toBe('lessThan');
  });
});

describe('boundaries the repair must not cross', () => {
  it('reads back through the fixed table when no fields are supplied', () => {
    // The pure spec-shape callers pass no field list; they must keep the
    // unchanged default rather than get an invented answer.
    expect(conditionToGroup({ closed_at: { $gt: '2026-01-01' } }).group.conditions[0].operator).toBe('greaterThan');
  });

  it('reads back through the fixed table when the field is not in the list', () => {
    expect(conditionToGroup({ mystery: { $gt: 1 } }, FIELDS).group.conditions[0].operator).toBe('greaterThan');
  });

  it('leaves the unambiguous tokens alone on a date column', () => {
    expect(roundTrip('closed_at', 'equals', FIELDS).readBack).toBe('equals');
    expect(roundTrip('closed_at', 'notEquals', FIELDS).readBack).toBe('notEquals');
    expect(roundTrip('closed_at', 'isNull', FIELDS).readBack).toBe('isNull');
    expect(roundTrip('closed_at', 'isNotNull', FIELDS).readBack).toBe('isNotNull');
    expect(roundTrip('closed_at', 'isEmpty', FIELDS).readBack).toBe('isEmpty');
    expect(roundTrip('closed_at', 'isNotEmpty', FIELDS).readBack).toBe('isNotEmpty');
  });

  it('does not widen what the bridge accepts', () => {
    // An operator no bucket writes is still non-representable, and a
    // multi-operator object is still refused.
    expect(conditionToGroup({ f: { $nope: 1 } }, FIELDS).representable).toBe(false);
    expect(conditionToGroup({ f: { $gt: 1, $lt: 9 } }, FIELDS).representable).toBe(false);
  });
});
