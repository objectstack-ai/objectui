/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * "Is empty" / "Is not empty" write a criteria every objectstack filter face
 * accepts (objectui#10790).
 *
 * The widget used to store them as `{ FIELD: { $in: [null, ''] } }` and
 * `{ FIELD: { $nin: [null, ''] } }`. A `null` list member is refused by the
 * shared comparand-shape face (`assertListComparandShapes`, `INVALID_FILTER` /
 * 400, ruled 2026-08-31) in every position, so a related list, roll-up or
 * sharing rule authored with either operator failed when it was evaluated. The
 * stored shapes are now the ones that refusal prescribes:
 *
 *   - "Is empty":     `{ $or: [{ FIELD: { $in: [''] } }, { FIELD: { $null: true } }] }`
 *   - "Is not empty": `{ FIELD: { $nin: [''], $null: false } }` — its complement.
 *
 * What is pinned is the DOCUMENT the widget hands `onChange` — the string a
 * `relatedListFilter`, a roll-up filter or a `criteria_json` ends up holding —
 * judged by the objectstack faces themselves, imported from the installed
 * `@objectstack/spec`: the query face (`assertListComparandShapes`) and the
 * save door (`FilterConditionSchema`). The exact bytes are pinned too, so a
 * shape that merely passes the faces but means something else is still red.
 *
 * Four blocks:
 *
 *   1. WRITER — each operator on each field type that offers it (text, number,
 *      date, select, lookup: `operatorsForFieldType` in `@object-ui/components`),
 *      driven through the REAL dropdowns. The `equals` rows are the control:
 *      the same harness and the same faces, green before and after.
 *   2. READER — the old shape AND the new shape each open as the same single
 *      builder row, and opening one emits nothing (no rewrite on read alone).
 *   3. RE-SAVE — an old rule is written in the new shape the next time any row
 *      of it is edited.
 *   4. GROUPS — the new "is empty" entry is a `$or` key, so it is pinned in an
 *      AND group (merged beside field keys), beside a second "is empty" (the
 *      `$and` form) and inside an OR group, each read back as the rows written.
 *
 * DIRECTION, predicted before running: on the base tree block 1's two operator
 * rows are red (the old bytes, and the face's refusal), block 2's new-shape rows
 * are red ("is empty" opens as two OR rows, "is not empty" as raw JSON), block 3
 * and block 4 are red, and block 2's old-shape rows and every `equals` control
 * are green.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { assertListComparandShapes, FilterConditionSchema } from '@objectstack/spec/data';
import { FilterConditionField } from '../FilterConditionField';

/**
 * One column per field type that is offered the two operators. `name` is first,
 * so it is the column a fresh row is seeded with.
 */
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

/**
 * The two objectstack faces this criteria is stored behind, asked about the
 * document itself. The query face answers by throwing; its message is what the
 * failure prints, so a red row quotes the refusal.
 */
function expectAcceptedByTheFaces(stored: string) {
  const criteria = JSON.parse(stored);
  expect(() => assertListComparandShapes(criteria)).not.toThrow();
  const parsed = FilterConditionSchema.safeParse(criteria);
  expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(true);
}

const isEmpty = (f: string) => ({ $or: [{ [f]: { $in: [''] } }, { [f]: { $null: true } }] });
const isNotEmpty = (f: string) => ({ [f]: { $nin: [''], $null: false } });

const TYPES: ReadonlyArray<{ type: string; field: string; label: string }> = [
  { type: 'text', field: 'name', label: 'Name' },
  { type: 'number', field: 'amount', label: 'Amount' },
  { type: 'date', field: 'due_on', label: 'Due on' },
  { type: 'select', field: 'stage', label: 'Stage' },
  { type: 'lookup', field: 'account', label: 'Account' },
];

/** A fresh row on `label`'s column, still on the seed operator (`equals`). */
async function freshRowOn(label: string) {
  const utils = renderWidget('');
  await addRow();
  if (label !== 'Name') await pickFrom(0, label);
  return utils;
}

describe('WRITER — each operator on each offered field type writes the accepted shape (objectui#10790)', () => {
  it.each(TYPES)('"Is empty" on a $type column', async ({ field, label }) => {
    const { onChange } = await freshRowOn(label);
    await pickFrom(1, 'Is empty');
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify(isEmpty(field)));
    expectAcceptedByTheFaces(stored);
  });

  it.each(TYPES)('"Is not empty" on a $type column', async ({ field, label }) => {
    const { onChange } = await freshRowOn(label);
    await pickFrom(1, 'Is not empty');
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify(isNotEmpty(field)));
    expectAcceptedByTheFaces(stored);
  });

  it.each(TYPES)('CONTROL: the seed "equals" row on a $type column is untouched', async ({ field, label }) => {
    // Green before and after: the same harness and the same faces answer
    // "accepted" for an arm this change does not touch, so a red operator row
    // above is about the operator and not about the harness.
    const { onChange } = await freshRowOn(label);
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify({ [field]: '' }));
    expectAcceptedByTheFaces(stored);
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

describe('READER — the old and the new shape open as the same builder row (objectui#10790)', () => {
  const CASES: ReadonlyArray<{ name: string; stored: unknown; operator: string }> = [
    { name: 'old "is empty" ($in: [null, \'\'])', stored: { name: { $in: [null, ''] } }, operator: 'Is empty' },
    { name: 'old "is not empty" ($nin: [null, \'\'])', stored: { name: { $nin: [null, ''] } }, operator: 'Is not empty' },
    { name: 'new "is empty"', stored: isEmpty('name'), operator: 'Is empty' },
    { name: 'new "is not empty"', stored: isNotEmpty('name'), operator: 'Is not empty' },
  ];

  it.each(CASES)('$name opens as one "$operator" row and is not rewritten', async ({ stored, operator }) => {
    const { onChange } = renderWidget(JSON.stringify(stored));
    await expectOneRow('Name', operator);
    // No rewrite on read alone: opening a stored rule emits nothing, so the
    // form keeps the bytes it loaded until the admin edits the criteria.
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RE-SAVE — an old rule is written in the new shape once it is edited (objectui#10790)', () => {
  it.each([
    { name: '"is empty"', old: { name: { $in: [null, ''] } }, fresh: isEmpty('name') },
    { name: '"is not empty"', old: { name: { $nin: [null, ''] } }, fresh: isNotEmpty('name') },
  ])('an old $name row is rewritten when ANOTHER row is edited', async ({ old, fresh }) => {
    const { onChange } = renderWidget(JSON.stringify({ ...old, amount: 5 }));
    const box = await screen.findByDisplayValue('5');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: '6' } });
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify({ ...fresh, amount: 6 }));
    expectAcceptedByTheFaces(stored);
  });
});

describe('GROUPS — the "is empty" entry round-trips inside a group (objectui#10790)', () => {
  it('beside a field key (AND, merged): written, accepted, and read back as the two rows', async () => {
    const { onChange } = await freshRowOn('Name');
    await pickFrom(1, 'Is empty');
    await addRow();
    await pickFrom(2, 'Amount');
    const stored = lastEmitted(onChange);
    expect(stored).toBe(JSON.stringify({ ...isEmpty('name'), amount: '' }));
    expectAcceptedByTheFaces(stored);

    // What it wrote reopens as the rows it was written from.
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.map((t) => t.textContent)).toEqual(['Name', 'Is empty', 'Amount', 'Equals']);
  });

  it('beside a second "is empty" (the $and form): read back as two rows', async () => {
    const stored = { $and: [isEmpty('name'), isEmpty('amount')] };
    expectAcceptedByTheFaces(JSON.stringify(stored));
    const { onChange } = renderWidget(JSON.stringify(stored));
    await waitFor(() => {
      const triggers = screen.getAllByRole('combobox');
      expect(triggers.map((t) => t.textContent)).toEqual(['Name', 'Is empty', 'Amount', 'Is empty']);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('inside an OR group: read back as an OR group of the two rows, and re-written unchanged', async () => {
    const stored = { $or: [{ amount: 5 }, isEmpty('name')] };
    expectAcceptedByTheFaces(JSON.stringify(stored));
    const { onChange } = renderWidget(JSON.stringify(stored));
    const box = await screen.findByDisplayValue('5');
    expect(screen.getAllByRole('combobox').map((t) => t.textContent)).toEqual([
      'Amount', 'Equals', 'Name', 'Is empty',
    ]);
    fireEvent.change(box, { target: { value: '6' } });
    expect(lastEmitted(onChange)).toBe(JSON.stringify({ $or: [{ amount: 6 }, isEmpty('name')] }));
  });

  it('CONTROL: an OR of the two halves in the OTHER order stays the OR group it is', async () => {
    // Only the exact entry the builder writes is folded into one row; the same
    // predicate spelled another way is not guessed at.
    // A select column, whose bucket offers both `is_null` and `in`.
    const stored = { $or: [{ stage: { $null: true } }, { stage: { $in: [''] } }] };
    renderWidget(JSON.stringify(stored));
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').slice(0, 4).map((t) => t.textContent)).toEqual([
        'Stage', 'Is null', 'Stage', 'In',
      ]);
    });
  });
});
