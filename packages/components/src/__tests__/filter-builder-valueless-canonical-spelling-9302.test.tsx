/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The value-input gate reads the operator through the same fold the rest of
 * this component already uses, so BOTH spellings of one value-less operator
 * draw the SAME row (objectui#9302).
 *
 * ## The one site
 *
 * `needsValueInput` did a raw `has()` against
 * `VALUELESS_FILTER_BUILDER_OPERATORS`, whose members are this builder's six
 * camelCase dropdown ids. A row carrying the spec's canonical spelling
 * (`is_null`) missed the set and was treated as value-taking, so it drew a
 * value box next to a trigger that reads `Is null` — two spellings of ONE
 * operator drawing two different rows.
 *
 * This is the same CLASS as objectui#7561 and not the same site: that card
 * repaired the operator trigger's identity comparison, this is the value-input
 * gate. The component already imports `normalizeFilterOperator` and already
 * folds through it in `filterValueArity` and `reconcileOperatorForField`, so
 * the repair is one more site joining a fold this file already performs.
 *
 * ## What the repair deliberately does NOT do (the PM ruling on this card)
 *
 *   - ⛔ the EXPORTED set is not widened. Its stated job is *which rows this
 *     builder leaves value-less* — a fact about the dropdown's own six ids —
 *     and two other layers read it: `plugin-list`'s `convertFilterGroupToAST`
 *     (what the live grid QUERIES) and `app-shell`'s
 *     `foldFilterGroupToSpecRules` (what a saved view PERSISTS, documented as
 *     this set PLUS the canonical spellings only that layer sees). Widening
 *     here would make another layer's deliberate compensation redundant by
 *     side effect, in a file nobody is editing.
 *   - ⛔ no row's stored `operator` is rewritten; rendering is not an edit.
 *   - ⛔ no second spelling joins the dropdown; the emitted vocabulary is
 *     unchanged.
 *
 * ⛔ Out of scope, and untouched here: WHICH operator vocabulary wins
 * (objectui#7561's open question, filed as decision card objectui#9306). It
 * carries a hard constraint recorded on objectui#7379 — `AST_OPERATOR_MAP`
 * holds that `contains` / `icontains` "must never be folded onto" each other,
 * "That is a semantic boundary, not two spellings of one thing." The boundary
 * guard below pins that the fold this repair routes through does not cross it.
 *
 * ## DIRECTION, predicted before running
 *
 * On the unmodified tree the four CANONICAL rows (`is_empty`, `is_not_empty`,
 * `is_null`, `is_not_null`) are RED — each draws 1 value input where 0 is
 * required. Everything else is GREEN in both directions and is carried for a
 * named reason, not for coverage:
 *
 *   - the six DROPDOWN ids draw 0 today and must keep drawing 0 — the
 *     over-reach guard. A repair that folded only one direction, or that
 *     replaced the set's members with canonical spellings, moves these;
 *   - `equals` is the FIRING CONTROL. It really does take a value and must
 *     draw exactly 1 both before and after. Without it "0 inputs everywhere"
 *     and a broken renderer are the same reading;
 *   - `exists` / `notExists` are builder-only ids with no canonical twin in
 *     the spec's vocabulary, so the fold returns them verbatim. They pin that
 *     routing the lookup through the fold did not drop the two members that
 *     have nothing to fold to.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { normalizeFilterOperator } from '@objectstack/spec/ui';
import {
  FilterBuilder,
  VALUELESS_FILTER_BUILDER_OPERATORS,
} from '../custom/filter-builder';

/** One `text` column — the card's reproduction shape. */
const FIELDS = [{ value: 'title', label: 'Title', type: 'text' }];

/**
 * One condition row. `value: ''` is the seed `addCondition` writes and what a
 * row still carries after the operator dropdown is changed, i.e. the exact
 * state the panel holds while the user edits.
 *
 * The `value` prop is hoisted out of the JSX because the builder re-seeds its
 * internal state when that prop's IDENTITY changes.
 */
function renderRow(operator: string, extraOperators: readonly string[] = []) {
  const onChange = vi.fn();
  const value = {
    id: 'root',
    logic: 'and',
    conditions: [{ id: 'c1', field: 'title', operator, value: '' }],
  };
  const utils = render(
    <FilterBuilder
      fields={FIELDS as never}
      value={value as never}
      onChange={onChange}
      extraOperators={extraOperators}
    />,
  );
  return { ...utils, onChange };
}

/**
 * The value input is the only `<input>` the row draws — the field and operator
 * pickers are Radix selects, i.e. buttons. Counting elements rather than
 * matching a placeholder keeps this independent of the active locale.
 */
const valueInputCount = (container: HTMLElement) => container.querySelectorAll('input').length;

/** What the operator trigger DISPLAYS — the label the stray box contradicts. */
const operatorTriggerText = () => screen.getAllByRole('combobox')[1].textContent;

/**
 * The card's acceptance table, measured through the real `FilterBuilder`.
 *
 * `dialect` is load-bearing for reading a failure, not decoration:
 *   - `dropdown` — one of this builder's own camelCase ids, i.e. a member of
 *     the exported set. 0 inputs today and after: the over-reach guard;
 *   - `canonical` — `@objectstack/spec`'s snake_case spelling of the SAME
 *     operator, which a stored view carries. 1 input today (the defect), 0
 *     after: the firing cases;
 *   - `control` — really does take a value. 1 input in both directions.
 */
const ROWS: ReadonlyArray<{
  operator: string;
  label: string;
  inputs: number;
  dialect: 'dropdown' | 'canonical' | 'control';
  /** `OPT_IN_OPERATORS` ids the consumer must grant before they are mounted. */
  extraOperators?: readonly string[];
}> = [
  { operator: 'isNull', label: 'Is null', inputs: 0, dialect: 'dropdown' },
  { operator: 'is_null', label: 'Is null', inputs: 0, dialect: 'canonical' },
  { operator: 'isNotNull', label: 'Is not null', inputs: 0, dialect: 'dropdown' },
  { operator: 'is_not_null', label: 'Is not null', inputs: 0, dialect: 'canonical' },
  { operator: 'isEmpty', label: 'Is empty', inputs: 0, dialect: 'dropdown' },
  { operator: 'is_empty', label: 'Is empty', inputs: 0, dialect: 'canonical' },
  { operator: 'isNotEmpty', label: 'Is not empty', inputs: 0, dialect: 'dropdown' },
  { operator: 'is_not_empty', label: 'Is not empty', inputs: 0, dialect: 'canonical' },
  // No canonical twin exists for these two — the spec's vocabulary has no
  // `exists` member and its alias table deliberately has no row for one.
  //
  // They are `OPT_IN_OPERATORS` (objectui#4736), so a consumer that does not
  // grant them never mounts their `SelectItem` and the trigger reads blank.
  // Granting them here is what makes this a reading about the value gate
  // rather than about the opt-in gate — measured: without the grant the
  // trigger is `''`, which is the documented opt-in behaviour and not a defect.
  {
    operator: 'exists',
    label: 'Is set',
    inputs: 0,
    dialect: 'dropdown',
    extraOperators: ['exists', 'notExists'],
  },
  {
    operator: 'notExists',
    label: 'Is not set',
    inputs: 0,
    dialect: 'dropdown',
    extraOperators: ['exists', 'notExists'],
  },
  // THE FIRING CONTROL, in the same render as the rest.
  { operator: 'equals', label: 'Equals', inputs: 1, dialect: 'control' },
];

describe('objectui#9302 — one operator, one row, whichever spelling it arrives in', () => {
  it.each(ROWS)(
    '$dialect `$operator` draws "$label" and $inputs value input(s)',
    ({ operator, label, inputs, extraOperators }) => {
      const { container } = renderRow(operator, extraOperators);
      // Read the trigger in the same render: a row that draws no value input
      // under a BLANK trigger is a different (and worse) outcome than the one
      // this card asks for, and only reading both can tell them apart.
      expect(operatorTriggerText()).toBe(label);
      expect(
        valueInputCount(container),
        `the builder drew ${valueInputCount(container)} value input(s) for "${operator}" `
          + `but the row reads "${label}". Two spellings of one operator must draw one row`,
      ).toBe(inputs);
    },
  );

  it('the firing cases really can fire — they are outside the exported set', () => {
    // The instrument standard: a table built only on spellings the raw `has()`
    // already matched would be green before ANY fix and would measure nothing.
    const canonical = ROWS.filter((r) => r.dialect === 'canonical');
    expect(canonical.length).toBeGreaterThanOrEqual(4);
    for (const row of canonical) {
      // Not a member — so the raw lookup could not have matched it literally…
      expect(VALUELESS_FILTER_BUILDER_OPERATORS.has(row.operator)).toBe(false);
      // …and it folds ONTO a member, which is what makes the repair reach it.
      const foldedMembers = new Set(
        [...VALUELESS_FILTER_BUILDER_OPERATORS].map(normalizeFilterOperator),
      );
      expect(foldedMembers.has(normalizeFilterOperator(row.operator))).toBe(true);
    }
    // …and the control is in neither, which is why it keeps its input.
    expect(VALUELESS_FILTER_BUILDER_OPERATORS.has('equals')).toBe(false);
    expect(normalizeFilterOperator('equals')).toBe('equals');
  });
});

describe('objectui#9302 — ⛔ the repair moves nothing but the gate', () => {
  it('the EXPORTED set keeps its dropdown-only membership', () => {
    // Acceptance criterion 3, and the ruling's whole point: two other layers
    // read this set, and one of them already compensates for the canonical
    // spellings. Widening it would make that layer's deliberate half redundant
    // by side effect. Green in both directions by construction — it fails only
    // for a repair that widened the export instead of folding at the gate.
    expect([...VALUELESS_FILTER_BUILDER_OPERATORS].sort()).toEqual([
      'exists',
      'isEmpty',
      'isNotEmpty',
      'isNotNull',
      'isNull',
      'notExists',
    ]);
  });

  it.each(['is_null', 'isNull'])('a row spelled `%s` is not migrated on render', (operator) => {
    // Rendering is not an edit. A "repair" that rewrote the stored id to the
    // dropdown's spelling would also make the table above green, and would be
    // the wrong fix — it changes what a saved view carries.
    const { onChange } = renderRow(operator);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('an unknown operator still draws a value input', () => {
    // The gate's default must stay "takes a value". A fold that swallowed
    // unknown spellings into the value-less set would hide the input on a row
    // nobody can then fill in — the objectui#4744 failure, inverted.
    expect(normalizeFilterOperator('totally_unknown')).toBe('totally_unknown');
    const { container } = renderRow('totally_unknown');
    expect(valueInputCount(container)).toBe(1);
  });
});

describe('objectui#9302 — ⛔ the fold does not cross the `contains` boundary', () => {
  it('`contains` and `icontains` are not folded onto each other', () => {
    // objectui#7379 / objectstack#7536: `AST_OPERATOR_MAP` holds that these
    // "must never be folded onto" each other — "That is a semantic boundary,
    // not two spellings of one thing." The gate now routes through
    // `normalizeFilterOperator`, so pin that this fold leaves the boundary
    // standing. A seat that folds those two has broken a ruling, not fixed a
    // bug. Green in both directions by construction — a boundary guard, not a
    // control.
    expect(normalizeFilterOperator('contains')).toBe('contains');
    expect(normalizeFilterOperator('icontains')).toBe('icontains');
    expect(normalizeFilterOperator('contains')).not.toBe(normalizeFilterOperator('icontains'));
    // …and neither is value-less under either spelling, so the gate this card
    // repairs never had an opinion about them.
    for (const op of ['contains', 'icontains', 'containsCaseInsensitive']) {
      expect(VALUELESS_FILTER_BUILDER_OPERATORS.has(op)).toBe(false);
      expect(
        new Set([...VALUELESS_FILTER_BUILDER_OPERATORS].map(normalizeFilterOperator)).has(
          normalizeFilterOperator(op),
        ),
      ).toBe(false);
    }
  });
});
