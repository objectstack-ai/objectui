/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The MEMBERS of `object-grid`'s two object-armed toolbar keys — `pagination`
 * and `selection` — pinned at what the RENDERER reads (objectui#8071).
 *
 * One file for two keys because they are one read. Both are resolved in the
 * single fold that assembles `dataTableSchema`, both land on adjacent props of
 * the same `data-table` node (`pagination` / `pageSize` / `pageSizeOptions`
 * beside `selectable`), and both are the CANONICAL half of a canonical-vs-
 * deprecated pair whose precedence nothing asserted: `pagination` against the
 * flat `pageSize` / `showPagination`, `selection` against `selectable`.
 *
 * ⛔ What a declaration can never publish, which is why each row below is a
 * behaviour rather than a restatement of the registration:
 *
 *   - **The two keys read their own presence in OPPOSITE ways.** `pagination`
 *     is read as `schema.pagination !== undefined`, so the OBJECT's presence
 *     alone turns paging on. `selection` is read as `schema.selection?.type`,
 *     so the object's presence alone does NOTHING — only the `type` member
 *     counts. Two adjacent object keys on one block, opposite rules, and
 *     nothing in either description says so.
 *   - **`type: 'none'` is not "no opinion".** It is an explicit off that beats
 *     BOTH fallback arms, including the one that auto-enables multi-select
 *     when the schema declares bulk actions. An author who writes
 *     `bulkActions: ['approve']` and `selection: { type: 'none' }` gets a grid
 *     with no checkbox in it: the bulk bar they declared can never be reached,
 *     nothing is thrown, and no diagnostic is emitted.
 *   - **`pageSizeOptions` REPLACES the built-in rows-per-page list, it does not
 *     extend it.** An author who adds `pageSizeOptions: [200]` to offer one
 *     larger step silently deletes 5 / 10 / 20 / 50 / 100 from the selector.
 *     The consequence is the same shape as slice 12's silent style drop: the
 *     control still renders, still works, and simply no longer offers what it
 *     offered yesterday.
 *   - **The canonical key wins even when the deprecated one says otherwise.**
 *     `showPagination: false` beside a `pagination` object is IGNORED, and
 *     `selectable: true` beside a `selection` object is IGNORED. Half-migrated
 *     metadata therefore behaves as the canonical key alone says, which is the
 *     direction a reader is least likely to guess.
 *
 * DIRECTION, predicted before running: every row is RED against the plausible
 * "improvement" of the read site it covers and green as written. The two
 * mutations are recorded in the PR body.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { ObjectGrid } from '../ObjectGrid';
import { registerAllFields } from '@object-ui/fields';
import { ActionProvider } from '@object-ui/react';

registerAllFields();

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as any;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn() as any;
  }
});

/** 12 rows, so a `pageSize` of 5 gives three pages and a partial last one. */
const ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Row ${String(i + 1).padStart(2, '0')}`,
  status: 'open',
}));

function renderGrid(opts: Record<string, unknown>) {
  const schema: any = {
    type: 'object-grid',
    objectName: 'task',
    columns: [
      { field: 'name', label: 'Name' },
      { field: 'status', label: 'Status' },
    ],
    data: { provider: 'value', items: ROWS },
    ...opts,
  };
  return render(
    <ActionProvider>
      <ObjectGrid schema={schema} />
    </ActionProvider>,
  );
}

const bodyRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('tbody tr'));

/** The flat pager's page readout, or `null` when no pager is rendered. */
const pageInfo = () => screen.queryByText(/^Page \d+ of \d+$/);

describe('object-grid `pagination` members reach the pager (objectui#8071)', () => {
  it('`pageSize` sizes the page — the member, not the row total', async () => {
    const { container } = renderGrid({ pagination: { pageSize: 5 } });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(bodyRows(container)).toHaveLength(5);
    expect(pageInfo()).toHaveTextContent('Page 1 of 3');
  });

  it('`pagination.pageSize` WINS over the deprecated flat `pageSize`', async () => {
    // Both authored, disagreeing. A grid that read the flat key would show all
    // twelve rows on one page and render no pager at all.
    const { container } = renderGrid({ pagination: { pageSize: 5 }, pageSize: 100 });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(bodyRows(container)).toHaveLength(5);
    expect(pageInfo()).toHaveTextContent('Page 1 of 3');
  });

  it('the OBJECT\'s presence enables paging, overruling `showPagination: false`', async () => {
    const { container } = renderGrid({
      pagination: { pageSize: 5 },
      showPagination: false,
    });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(bodyRows(container)).toHaveLength(5);
    expect(pageInfo(), 'the deprecated boolean must not be consulted when `pagination` is authored')
      .toHaveTextContent('Page 1 of 3');
  });

  it('CONTROL — with no `pagination` object the deprecated boolean IS honoured', async () => {
    // The other half of the row above. Without this, "the pager rendered" is
    // consistent with a grid that ignores `showPagination` entirely.
    const { container } = renderGrid({ pageSize: 5, showPagination: false });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(bodyRows(container)).toHaveLength(12);
    expect(pageInfo()).toBeNull();
  });

  it('`pageSizeOptions` REPLACES the built-in rows-per-page list', async () => {
    renderGrid({ pagination: { pageSize: 5, pageSizeOptions: [5, 200] } });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());

    const trigger = screen.getAllByRole('combobox')[0];
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const offered = await waitFor(() => {
      const options = screen.getAllByRole('option').map((o) => o.textContent);
      expect(options.length, 'the rows-per-page dropdown never opened').toBeGreaterThan(0);
      return options;
    });
    // Exactly the authored members — the built-in 10 / 20 / 50 / 100 are GONE.
    expect(offered).toEqual(['5', '200']);
  });

  it('CONTROL — with no `pageSizeOptions` the built-in list is what is offered', async () => {
    renderGrid({ pagination: { pageSize: 5 } });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());

    const trigger = screen.getAllByRole('combobox')[0];
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const offered = await waitFor(() => {
      const options = screen.getAllByRole('option').map((o) => o.textContent);
      expect(options.length, 'the rows-per-page dropdown never opened').toBeGreaterThan(0);
      return options;
    });
    expect(offered).toEqual(['5', '10', '20', '50', '100']);
  });
});

describe('object-grid `selection.type` is the only member read (objectui#8071)', () => {
  const paged = { pagination: { pageSize: 5 } };

  it('`multiple` renders per-row checkboxes AND the select-all header', async () => {
    renderGrid({ ...paged, selection: { type: 'multiple' } });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    // 5 rows on the page + the header select-all.
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });

  it('`single` renders per-row checkboxes and NO select-all header', async () => {
    renderGrid({ ...paged, selection: { type: 'single' } });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('`none` is an explicit OFF that beats the bulk-action auto-enable', async () => {
    // `bulkActions` alone auto-enables multi-select (the row below proves it),
    // so this is the member deciding against a declaration that asks for the
    // opposite — and the author is told nothing.
    renderGrid({ ...paged, selection: { type: 'none' }, bulkActions: ['approve'] });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('CONTROL — the same schema WITHOUT the member auto-enables multi-select', async () => {
    renderGrid({ ...paged, bulkActions: ['approve'] });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });

  it('`none` also beats the deprecated `selectable: true`', async () => {
    renderGrid({ ...paged, selection: { type: 'none' }, selectable: true });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('CONTROL — with no `selection` object the deprecated `selectable` IS honoured', async () => {
    renderGrid({ ...paged, selectable: true });
    await waitFor(() => expect(screen.getByText('Row 01')).toBeInTheDocument());
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });
});
