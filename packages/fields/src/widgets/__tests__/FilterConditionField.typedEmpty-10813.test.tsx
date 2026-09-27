/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * "Is empty" / "Is not empty" send the `''` member only to a column whose
 * stored value can be `''` (objectui#10813, step 2).
 *
 * Since objectui#10790 the widget stores "is empty" as
 * `{ $or: [{ F: { $in: [''] } }, { F: { $null: true } }] }` and its complement
 * as `{ F: { $nin: [''], $null: false } }` on EVERY field type the dropdown
 * offers them on — number and date included. On a numeric, boolean or temporal
 * column the SQL driver binds that `''` as-is, so it reached the column as
 * `IN ('')` / `NOT IN ('')`, a comparand a strict backend has to cast. Those
 * columns now get the `$null` half alone.
 *
 * What is pinned, and why each block exists:
 *
 *   1. WRITER — a number and a date column, driven through the REAL dropdowns,
 *      write `{ F: { $null: true } }` / `{ F: { $null: false } }`: no `''`.
 *   2. CONTROL — a text, a select and a lookup column write today's bytes,
 *      unchanged. `''` is a value those columns can hold (an edit form sends a
 *      cleared text box as `''` and the platform stores it), so dropping the
 *      member there would re-scope a stored sharing rule — objectui#10813's
 *      stop valve, not this step.
 *   3. CLASSES — `condToMongo` over every member of the protocol's value
 *      classes it keys on, read from the installed `@objectstack/spec`, plus
 *      the string-stored classes and an unknown type as the other side.
 *   4. READER — a rule stored in either OLDER shape on a number column still
 *      opens as the same "is empty" / "is not empty" row and is not rewritten
 *      by opening it; it takes the new shape only when an admin edits it. The
 *      new shape reopens as a row the builder draws (under the `is_null` /
 *      `is_not_null` label it shares), never the raw-JSON fallback.
 *
 * DIRECTION, predicted before running: on the base tree blocks 1 and 3's
 * typed rows are red (the `''` member is there), the "is empty" RE-SAVE row is
 * red, and every CONTROL, every old-shape READER row and the unknown-type row
 * are green.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  assertListComparandShapes,
  FilterConditionSchema,
  NUMERIC_VALUE_TYPES,
  BOOLEAN_VALUE_TYPES,
  CALENDAR_DATE_TYPES,
  INSTANT_TYPES,
  CLOCK_TIME_TYPES,
  STRING_VALUE_TYPES,
  SINGLE_OPTION_TYPES,
  REFERENCE_VALUE_TYPES,
} from '@objectstack/spec/data';
import { FilterConditionField, condToMongo } from '../FilterConditionField';

/** One column per class under test. `name` is first: a fresh row is seeded on it. */
const OBJECT_SCHEMA = {
  name: 'deal',
  fields: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'due_on', label: 'Due on', type: 'date' },
    {
      name: 'stage',
      label: 'Stage',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'won', label: 'Won' },
      ],
    },
    { name: 'account', label: 'Account', type: 'lookup', reference: 'account' },
  ],
};

const dataSource = {
  getObjectSchema: async () => OBJECT_SCHEMA,
  find: async () => ({ data: [], total: 0 }),
};

/** The widget under its real contract: a parent that stores what it emits. */
function renderWidget(initial: string | object = '') {
  const onChange = vi.fn();
  function Harness() {
    const [value, setValue] = React.useState<string | object>(initial);
    return (
      <FilterConditionField
        value={value}
        onChange={(next: string | object) => {
          onChange(next);
          setValue(next);
        }}
        dataSource={dataSource}
        dependentValues={{ object_name: 'deal' }}
        field={{ name: 'criteria_json', type: 'textarea' }}
      />
    );
  }
  const utils = render(<Harness />);
  return { ...utils, onChange };
}

function lastEmitted(onChange: ReturnType<typeof vi.fn>): string {
  const calls = onChange.mock.calls;
  expect(calls.length, 'the widget never called onChange').toBeGreaterThan(0);
  return String(calls[calls.length - 1][0]);
}

/** Wait for `getObjectSchema` to resolve — the Add button is disabled until it does. */
async function addRow() {
  const add = await screen.findByRole('button', { name: /add filter/i });
  await waitFor(() => expect(add).not.toBeDisabled());
  fireEvent.click(add);
}

/** Drive a REAL Radix dropdown by its trigger's index in the document. */
async function pickFrom(index: number, label: string) {
  const triggers = screen.getAllByRole('combobox');
  expect(triggers.length, 'the builder row is not on screen').toBeGreaterThan(index);
  fireEvent.keyDown(triggers[index], { key: 'ArrowDown' });
  const option = await waitFor(() => {
    const found = screen.getAllByRole('option').find((o) => o.textContent === label);
    expect(found, `no "${label}" option in the dropdown`).toBeTruthy();
    return found!;
  });
  fireEvent.click(option);
}

/** A fresh row on `label`'s column, still on the seed operator (`equals`). */
async function freshRowOn(label: string) {
  const utils = renderWidget('');
  await addRow();
  if (label !== 'Name') await pickFrom(0, label);
  return utils;
}

/** The two objectstack faces this criteria is stored behind, asked about the document. */
function expectAcceptedByTheFaces(stored: string) {
  const criteria = JSON.parse(stored);
  expect(() => assertListComparandShapes(criteria)).not.toThrow();
  const parsed = FilterConditionSchema.safeParse(criteria);
  expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(true);
}

/** Does the document carry an empty-string comparand anywhere? */
const carriesEmptyString = (stored: string) => /(^|[[,:])""/.test(stored);

/** The two shapes a string-stored column keeps (objectui#10790). */
const withEmptyString = {
  is_empty: (f: string) => ({ $or: [{ [f]: { $in: [''] } }, { [f]: { $null: true } }] }),
  is_not_empty: (f: string) => ({ [f]: { $nin: [''], $null: false } }),
};
/** The two shapes a numeric, boolean or temporal column gets (objectui#10813). */
const nullOnly = {
  is_empty: (f: string) => ({ [f]: { $null: true } }),
  is_not_empty: (f: string) => ({ [f]: { $null: false } }),
};

const OPERATORS = [
  { id: 'is_empty', label: 'Is empty' },
  { id: 'is_not_empty', label: 'Is not empty' },
] as const;

describe('WRITER — a number and a date column get no `\'\'` member (objectui#10813)', () => {
  const TYPED = [
    { type: 'number', field: 'amount', label: 'Amount' },
    { type: 'date', field: 'due_on', label: 'Due on' },
  ];
  describe.each(TYPED)('$type column', ({ field, label }) => {
    it.each(OPERATORS)('"$label" writes the $null half alone', async ({ id, label: op }) => {
      const { onChange } = await freshRowOn(label);
      await pickFrom(1, op);
      const stored = lastEmitted(onChange);
      expect(stored).toBe(JSON.stringify(nullOnly[id](field)));
      expect(carriesEmptyString(stored)).toBe(false);
      expectAcceptedByTheFaces(stored);
    });
  });
});

describe('CONTROL — a string-stored column writes today\'s bytes (objectui#10813)', () => {
  const STRING_STORED = [
    { type: 'text', field: 'name', label: 'Name' },
    { type: 'select', field: 'stage', label: 'Stage' },
    { type: 'lookup', field: 'account', label: 'Account' },
  ];
  describe.each(STRING_STORED)('$type column', ({ field, label }) => {
    it.each(OPERATORS)('"$label" keeps the `\'\'` member', async ({ id, label: op }) => {
      const { onChange } = await freshRowOn(label);
      await pickFrom(1, op);
      const stored = lastEmitted(onChange);
      expect(stored).toBe(JSON.stringify(withEmptyString[id](field)));
      expectAcceptedByTheFaces(stored);
    });
  });
});

describe('CLASSES — the protocol value classes decide which shape a column gets (objectui#10813)', () => {
  const row = (operator: string) => ({ id: 'c1', field: 'f', operator, value: '' });
  const typed = [
    ...NUMERIC_VALUE_TYPES,
    ...BOOLEAN_VALUE_TYPES,
    ...CALENDAR_DATE_TYPES,
    ...INSTANT_TYPES,
    ...CLOCK_TIME_TYPES,
  ];
  const stringStored = [...STRING_VALUE_TYPES, ...SINGLE_OPTION_TYPES, ...REFERENCE_VALUE_TYPES];

  it('the classes are not empty — a vacuous sweep would pass on any tree', () => {
    // The installed spec is what both sides read; an empty class would make
    // every `it.each` below run zero cases and report green.
    for (const t of ['number', 'currency', 'percent', 'boolean', 'toggle', 'date', 'datetime', 'time']) {
      expect(typed, t).toContain(t);
    }
    for (const t of ['text', 'textarea', 'email', 'select', 'lookup', 'user']) {
      expect(stringStored, t).toContain(t);
    }
  });

  it.each(typed)('a %s column: no `\'\'` member on either operator', (type) => {
    for (const { id } of OPERATORS) {
      expect(condToMongo(row(id), () => type)).toEqual(nullOnly[id]('f'));
    }
  });

  it.each(stringStored)('CONTROL: a %s column keeps the `\'\'` member', (type) => {
    for (const { id } of OPERATORS) {
      expect(condToMongo(row(id), () => type)).toEqual(withEmptyString[id]('f'));
    }
  });

  it('CONTROL: a column whose type the widget does not know keeps the `\'\'` member', () => {
    // The schema has not loaded, or the field is hidden or absent from it —
    // guessing a type would re-scope a rule the admin can see on screen.
    for (const { id } of OPERATORS) {
      expect(condToMongo(row(id), () => undefined)).toEqual(withEmptyString[id]('f'));
    }
  });
});

/** The single row the widget drew for a stored criteria, read off the DOM. */
async function expectOneRow(fieldLabel: string, operatorLabel: string) {
  await waitFor(() => {
    const triggers = screen.getAllByRole('combobox');
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toHaveTextContent(fieldLabel);
    expect(triggers[1]).toHaveTextContent(operatorLabel);
  });
  // Not the raw-JSON fallback the widget drops into for a criteria it cannot draw.
  expect(screen.queryByPlaceholderText(/"type": "customer"/)).toBeNull();
}

describe('READER — a stored rule on a number column reopens on the same operator (objectui#10813)', () => {
  const OLD: ReadonlyArray<{ name: string; stored: unknown; operator: string }> = [
    {
      name: 'the objectui#10790 "is empty"',
      stored: withEmptyString.is_empty('amount'),
      operator: 'Is empty',
    },
    {
      name: 'the objectui#10790 "is not empty"',
      stored: withEmptyString.is_not_empty('amount'),
      operator: 'Is not empty',
    },
    { name: 'the pre-objectui#10790 "is empty"', stored: { amount: { $in: [null, ''] } }, operator: 'Is empty' },
    { name: 'the pre-objectui#10790 "is not empty"', stored: { amount: { $nin: [null, ''] } }, operator: 'Is not empty' },
  ];

  it.each(OLD)('$name opens as one "$operator" row and is not rewritten', async ({ stored, operator }) => {
    const { onChange } = renderWidget(JSON.stringify(stored));
    await expectOneRow('Amount', operator);
    // Opening a stored rule emits nothing — not even once the schema has
    // loaded and `amount` is known to be a number.
    await screen.findByRole('button', { name: /add filter/i });
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    { name: '"is empty"', old: withEmptyString.is_empty('amount'), fresh: nullOnly.is_empty('amount') },
    { name: '"is not empty"', old: withEmptyString.is_not_empty('amount'), fresh: nullOnly.is_not_empty('amount') },
  ])('an old $name row on a number column takes the new shape when ANOTHER row is edited', async ({ old, fresh }) => {
    const { onChange } = renderWidget(JSON.stringify({ ...old, name: 'acme' }));
    const box = await screen.findByDisplayValue('acme');
    // The schema has to have loaded for `amount` to be known as a number.
    const add = await screen.findByRole('button', { name: /add filter/i });
    await waitFor(() => expect(add).not.toBeDisabled());
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: 'acme2' } });
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify({ ...fresh, name: 'acme2' }));
    expectAcceptedByTheFaces(stored);
  });

  it.each([
    { name: '"is empty"', stored: nullOnly.is_empty('amount'), operator: 'Is null' },
    { name: '"is not empty"', stored: nullOnly.is_not_empty('amount'), operator: 'Is not null' },
  ])('the new $name shape reopens as a drawn row ("$operator", the same predicate on this column)', async ({ stored, operator }) => {
    const { onChange } = renderWidget(JSON.stringify(stored));
    await expectOneRow('Amount', operator);
    expect(onChange).not.toHaveBeenCalled();
  });
});
