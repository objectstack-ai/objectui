/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A declared `dueLike: false` wins over the field-name convention
 * (objectui#12726).
 *
 * `@objectstack/spec` reads `dueLike` as "Absent or FALSE: not a deadline".
 * It is also the carrier a host uses for a row whose deadline is settled: the
 * grid and the record page judge the field's `settledWhen` against the row and
 * hand a settled row `dueLike: false`. Before, only `true` was read, so a
 * settled `due_date` fell through to the name convention and stayed red.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateCellRenderer, DateTimeCellRenderer } from '../index';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('a declared `dueLike: false` wins over the name convention (objectui#12726)', () => {
  it('date: a past `due_date` declared `dueLike: false` draws neutral text, not red', () => {
    render(<DateCellRenderer value={daysAgo(6)} field={{ type: 'date', name: 'due_date', dueLike: false } as any} />);
    const el = screen.getByText('6 days ago');
    expect(el.className).not.toMatch(/text-red-600/);
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('datetime: a past `due_date` declared `dueLike: false` draws no overdue red', () => {
    const { container } = render(
      <DateTimeCellRenderer value={daysAgo(6)} field={{ type: 'datetime', name: 'due_date', dueLike: false } as any} />,
    );
    expect(container.textContent).not.toContain('Overdue');
    expect(container.querySelector('.text-red-600')).toBeNull();
  });

  it('CONTROL: the same `due_date` with no key is still overdue by the name convention', () => {
    render(<DateCellRenderer value={daysAgo(6)} field={{ type: 'date', name: 'due_date' } as any} />);
    expect(screen.getByText('Overdue 6d').className).toMatch(/text-red-600/);
  });

  it('CONTROL: the same `due_date` datetime with no key is red by the name convention', () => {
    const { container } = render(
      <DateTimeCellRenderer value={daysAgo(6)} field={{ type: 'datetime', name: 'due_date' } as any} />,
    );
    expect(container.querySelector('.text-red-600')).not.toBeNull();
  });
});
