/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A settled deadline is not overdue on the record page (objectui#12726).
 *
 * The record page draws a date field through the same cell as the grid, so a
 * returned loan's due date read "Overdue Nd" in red here too. The object
 * field's `settledWhen` (`@objectstack/spec`: "while it holds, no overdue
 * wording or colour applies") is judged against the record, and a settled
 * record hands the cell `dueLike: false`. The stage option's `kind` alone
 * settles nothing: the spec says "nothing reads an option's `kind` to settle a
 * deadline".
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as React from 'react';
import { DetailSection } from '../DetailSection';
import type { DetailViewSection } from '@object-ui/types';

beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
});
afterEach(cleanup);

/** A local calendar day `n` days back, date-only, as a `date` field stores it. */
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const SECTION = {
  title: 'Loan',
  fields: [
    { name: 'due_date', label: 'Due' },
    { name: 'returned_on', label: 'Returned on' },
  ],
} as unknown as DetailViewSection;

const objectSchemaWith = (dueDate: Record<string, unknown>) => ({
  name: 'library_loan',
  stageField: 'status',
  fields: {
    status: {
      name: 'status',
      type: 'select',
      options: [
        { value: 'borrowed', label: 'Borrowed', kind: 'open' },
        { value: 'returned', label: 'Returned', kind: 'won' },
        { value: 'lost', label: 'Lost', kind: 'lost' },
      ],
    },
    due_date: { name: 'due_date', type: 'date', ...dueDate },
    returned_on: { name: 'returned_on', type: 'date' },
  },
});

const SETTLED = { dueLike: true, settledWhen: "record.status in ['returned', 'lost']" };

const recordWith = (status: string) => ({ status, due_date: daysAgo(3), returned_on: daysAgo(3) });

/** The date cells the page drew, in section order: [due_date, returned_on]. */
function dateCells(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('span.tabular-nums[title]'));
}

function expectOverdue(cell: HTMLElement | undefined) {
  expect(cell?.textContent).toContain('Overdue');
  expect(cell?.className).toContain('text-red-600');
}

function expectNeutral(cell: HTMLElement | undefined) {
  // By value first: an absent affordance means nothing on a cell that drew nothing.
  expect(cell?.textContent).toContain('days ago');
  expect(cell?.textContent).not.toContain('Overdue');
  expect(cell?.className).not.toContain('text-red-600');
}

function mount(dueDate: Record<string, unknown>, status: string) {
  render(<DetailSection section={SECTION} data={recordWith(status)} objectSchema={objectSchemaWith(dueDate)} />);
  return dateCells();
}

describe('a settled deadline is not overdue on the record page (objectui#12726)', () => {
  it('a won record whose `settledWhen` holds draws no overdue wording and no red', () => {
    expectNeutral(mount(SETTLED, 'returned')[0]);
  });

  it('a lost record whose `settledWhen` holds draws no overdue wording and no red', () => {
    expectNeutral(mount(SETTLED, 'lost')[0]);
  });

  it('an open record, where `settledWhen` does not hold, stays overdue and red', () => {
    expectOverdue(mount(SETTLED, 'borrowed')[0]);
  });

  it('CONTROL: with no `settledWhen`, a won stage option alone settles nothing (renders as before)', () => {
    expectOverdue(mount({ dueLike: true }, 'returned')[0]);
  });

  it('CONTROL: a date that is no deadline stays neutral', () => {
    expectNeutral(mount(SETTLED, 'borrowed')[1]);
  });
});
