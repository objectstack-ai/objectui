/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A settled deadline is not overdue in the grid (objectui#12726).
 *
 * Walked on an AI-built loan list: the due date of a RETURNED loan read
 * "Overdue 2d" in red, because the date cell decided the overdue form from the
 * field alone and never saw the record.
 *
 * `@objectstack/spec` declares when a deadline stops mattering for one record:
 * the field's `settledWhen`, a per-record CEL predicate. "While it holds, no
 * overdue wording or colour applies", and the host "evaluates `settledWhen`
 * against the row and hands the cell one boolean". The grid judges it per row
 * and hands a settled row `dueLike: false`.
 *
 * The same spec text says "nothing reads an option's `kind` to settle a
 * deadline", so the stage option's `won` / `lost` kind alone settles nothing:
 * the CONTROL below pins that too.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { registerAllFields } from '@object-ui/fields';
import { ActionProvider } from '@object-ui/react';
import { ObjectGrid } from '../ObjectGrid';

registerAllFields();

afterEach(() => cleanup());

/** A local calendar day `n` days back, date-only, as a `date` column stores it. */
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const OBJECT = 'library_loan';
const STATUS = {
  name: 'status',
  type: 'select',
  label: 'Status',
  options: [
    { value: 'borrowed', label: 'Borrowed', kind: 'open' },
    { value: 'returned', label: 'Returned', kind: 'won' },
    { value: 'lost', label: 'Lost', kind: 'lost' },
  ],
};

const fieldsWith = (dueDate: Record<string, unknown>) => ({
  name: { name: 'name', type: 'text', label: 'Loan' },
  status: STATUS,
  due_date: { name: 'due_date', type: 'date', label: 'Due', ...dueDate },
  returned_on: { name: 'returned_on', type: 'date', label: 'Returned on' },
});

const SETTLED = { dueLike: true, settledWhen: "record.status in ['returned', 'lost']" };

const ROWS = [
  { id: 'l1', name: 'Open loan', status: 'borrowed', due_date: daysAgo(3), returned_on: daysAgo(3) },
  { id: 'l2', name: 'Won loan', status: 'returned', due_date: daysAgo(3), returned_on: daysAgo(3) },
  { id: 'l3', name: 'Lost loan', status: 'lost', due_date: daysAgo(3), returned_on: daysAgo(3) },
];

type Shape = { columns?: unknown[]; inline?: boolean };

function mount(dueDate: Record<string, unknown>, { columns, inline }: Shape) {
  const dataSource = {
    find: async () => ({ data: ROWS, total: ROWS.length }),
    findOne: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => true,
    getObjectSchema: async () => ({ name: OBJECT, stageField: 'status', fields: fieldsWith(dueDate) }),
  };
  return render(
    <ActionProvider>
      <ObjectGrid
        schema={{
          type: 'object-grid',
          objectName: OBJECT,
          ...(columns ? { columns } : { fields: ['name', 'status', 'due_date', 'returned_on'] }),
          ...(inline && { data: { provider: 'value', items: ROWS } }),
        } as never}
        dataSource={dataSource as never}
      />
    </ActionProvider>,
  );
}

/** The date cell (the span carrying the ISO `title`) of `column` on the row named `rowName`. */
function dateCell(rowName: string, columnIndex: number): HTMLElement {
  const row = screen.getByText(rowName).closest('tr');
  if (!row) throw new Error(`no row for ${rowName}`);
  const spans = Array.from(row.querySelectorAll<HTMLElement>('span.tabular-nums[title]'));
  const cell = spans[columnIndex];
  if (!cell) throw new Error(`row ${rowName} drew ${spans.length} date cells`);
  return cell;
}

const DUE = 0;
const RETURNED_ON = 1;

function expectOverdue(cell: HTMLElement) {
  expect(cell.textContent).toContain('Overdue');
  expect(cell).toHaveClass('text-red-600');
}

function expectNeutral(cell: HTMLElement) {
  // By value first: an absent affordance means nothing on a cell that drew nothing.
  expect(cell.textContent).toContain('days ago');
  expect(cell.textContent).not.toContain('Overdue');
  expect(cell).not.toHaveClass('text-red-600');
}

/** Each of the grid's column builders, which hand the cell its field separately. */
const SHAPES: Array<[string, Shape]> = [
  ['authored column objects', { columns: [{ field: 'name' }, { field: 'status' }, { field: 'due_date' }, { field: 'returned_on' }] }],
  ['authored column names', { columns: ['name', 'status', 'due_date', 'returned_on'] }],
  ['inline rows', { inline: true }],
  ['object field list', {}],
];

describe('a settled deadline is not overdue in the grid (objectui#12726)', () => {
  for (const [shape, shapeOpts] of SHAPES) {
    describe(shape, () => {
      it('a won record whose `settledWhen` holds draws no overdue wording and no red', async () => {
        mount(SETTLED, shapeOpts);
        await waitFor(() => expect(screen.getByText('Won loan')).toBeInTheDocument());
        expectNeutral(dateCell('Won loan', DUE));
      });

      it('a lost record whose `settledWhen` holds draws no overdue wording and no red', async () => {
        mount(SETTLED, shapeOpts);
        await waitFor(() => expect(screen.getByText('Lost loan')).toBeInTheDocument());
        expectNeutral(dateCell('Lost loan', DUE));
      });

      it('an open record, where `settledWhen` does not hold, stays overdue and red', async () => {
        mount(SETTLED, shapeOpts);
        await waitFor(() => expect(screen.getByText('Open loan')).toBeInTheDocument());
        expectOverdue(dateCell('Open loan', DUE));
      });

      it('CONTROL: with no `settledWhen`, a won stage option alone settles nothing (renders as before)', async () => {
        mount({ dueLike: true }, shapeOpts);
        await waitFor(() => expect(screen.getByText('Won loan')).toBeInTheDocument());
        expectOverdue(dateCell('Won loan', DUE));
        expectOverdue(dateCell('Open loan', DUE));
      });

      it('CONTROL: a date that is no deadline stays neutral on every row', async () => {
        mount(SETTLED, shapeOpts);
        await waitFor(() => expect(screen.getByText('Open loan')).toBeInTheDocument());
        for (const name of ['Open loan', 'Won loan', 'Lost loan']) expectNeutral(dateCell(name, RETURNED_ON));
      });
    });
  }
});
