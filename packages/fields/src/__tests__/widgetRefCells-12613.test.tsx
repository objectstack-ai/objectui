/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12613 — a field's declared `widget` picks its READ cell, so a list
 * names what an `object-ref` / `recipient-picker` value references instead of
 * printing the api name.
 *
 * The platform declares both hints on `sys_sharing_rule` (`object_name` is
 * `Field.text({ widget: 'object-ref' })`, `recipient_id` is
 * `Field.text({ widget: 'recipient-picker' })`), and before this change
 * `resolveCellRendererType` read `type` and `format` only: both columns drew
 * through the text cell, so the Sharing Rules list read `crm_account` and
 * `sales_manager` where the edit form reads "Account" and "Sales Manager".
 *
 * Every case carries its control:
 *   - the promotion is driven by the DECLARED widget, never by the value: the
 *     same value under a plain `text` field still draws as text;
 *   - the reads are the edit widgets' reads, made once per page, not once per
 *     cell — each batching case counts the calls;
 *   - a value nothing could name draws muted, never blank, and a cell that
 *     could not ask (no row, no data source) draws the text it drew before.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetadataCtx, SchemaRendererProvider, type MetadataContextValue } from '@object-ui/react';
import { getCellRenderer, resolveCellRendererType, TextCellRenderer } from '../index';

afterEach(() => cleanup());

const POSITIONS = [
  { name: 'sales_manager', label: 'Sales Manager' },
  { name: 'eu_sales_lead', label: 'EU Sales Lead' },
];

function metadataStore(items: unknown[]): MetadataContextValue & { ensureType: ReturnType<typeof vi.fn> } {
  return {
    apps: [], objects: [], dashboards: [], reports: [], pages: [],
    loading: false, error: null,
    refresh: async () => {}, invalidate: () => {},
    ensureType: vi.fn().mockResolvedValue(items),
    getItem: async () => null,
    getItemsByType: () => [],
  } as any;
}

interface CellCase {
  value: unknown;
  dependentValues?: Record<string, unknown>;
}

/** Draw one cell per case, through the renderer the declared widget resolves to. */
function renderCells(
  widget: string,
  cells: CellCase[],
  { dataSource, store }: { dataSource?: any; store?: MetadataContextValue | null } = {},
) {
  const key = resolveCellRendererType({ type: 'text', widget });
  const Renderer = getCellRenderer(key);
  const body = (
    <SchemaRendererProvider dataSource={dataSource ?? null}>
      {cells.map((c, i) => (
        <div key={i} data-testid={`cell-${i}`}>
          <Renderer value={c.value} field={{ name: 'f', type: key } as any} dependentValues={c.dependentValues} />
        </div>
      ))}
    </SchemaRendererProvider>
  );
  return render(store ? <MetadataCtx.Provider value={store}>{body}</MetadataCtx.Provider> : body);
}

const cell = (i: number) => screen.getByTestId(`cell-${i}`);
const unresolvedMark = (i: number) => cell(i).querySelector('[data-slot="unresolved-reference"]');

describe('objectui#12613 — the declared widget picks the cell', () => {
  it('promotes a textual field declaring `object-ref` / `recipient-picker` to that cell, and nothing else', () => {
    expect(resolveCellRendererType({ type: 'text', widget: 'object-ref' })).toBe('object-ref');
    expect(resolveCellRendererType({ type: 'text', widget: 'recipient-picker' })).toBe('recipient-picker');
    // Controls: no widget, a widget with no read cell of its own, and a
    // non-textual base type keep the answer they had.
    expect(resolveCellRendererType({ type: 'text' })).toBe('text');
    expect(resolveCellRendererType({ type: 'textarea', widget: 'filter-condition' })).toBe('textarea');
    expect(resolveCellRendererType({ type: 'select', widget: 'object-ref' })).toBe('select');
    // The widget wins over a `format` hint on the same text field: it names
    // what the value IS, the hint only how plain text is drawn.
    expect(resolveCellRendererType({ type: 'text', format: 'url', widget: 'object-ref' })).toBe('object-ref');
    expect(getCellRenderer('object-ref')).not.toBe(TextCellRenderer);
    expect(getCellRenderer('recipient-picker')).not.toBe(TextCellRenderer);
  });
});

describe('objectui#12613 — the `object-ref` cell', () => {
  function catalogSource() {
    return {
      getObjects: vi.fn(async () => [
        { name: 'crm_account', label: 'Account' },
        { name: 'crm_contact', label: 'Contact' },
      ]),
    };
  }

  it("draws the object's label, with the api name in the tooltip, from ONE catalog read", async () => {
    const ds = catalogSource();
    renderCells('object-ref', [{ value: 'crm_account' }, { value: 'crm_contact' }, { value: 'crm_account' }], {
      dataSource: ds,
    });

    await waitFor(() => expect(cell(0)).toHaveTextContent('Account'));
    expect(cell(0)).not.toHaveTextContent('crm_account');
    expect(cell(0).querySelector('[title]')?.getAttribute('title')).toBe('Account (crm_account)');
    expect(cell(1)).toHaveTextContent('Contact');
    expect(cell(2)).toHaveTextContent('Account');
    expect(ds.getObjects, 'one catalog read for every row, not one per cell').toHaveBeenCalledTimes(1);
  });

  it('draws a name the catalog does not list as the raw value, muted — never blank', async () => {
    renderCells('object-ref', [{ value: 'crm_account' }, { value: 'crm_retired' }], { dataSource: catalogSource() });

    await waitFor(() => expect(cell(0)).toHaveTextContent('Account'));
    expect(cell(1)).toHaveTextContent('crm_retired');
    expect(unresolvedMark(1), 'the unknown name wears the unresolved mark').not.toBeNull();
    expect(unresolvedMark(0), 'the resolved one does not').toBeNull();
  });

  it('draws the stored text exactly as before when there is no data source to ask', () => {
    renderCells('object-ref', [{ value: 'crm_account' }]);
    expect(cell(0)).toHaveTextContent('crm_account');
    expect(unresolvedMark(0)).toBeNull();
  });

  it('control: the same value under a plain `text` field is not named', async () => {
    const ds = catalogSource();
    const Text = getCellRenderer(resolveCellRendererType({ type: 'text' }));
    render(
      <SchemaRendererProvider dataSource={ds as any}>
        <div data-testid="plain">
          <Text value="crm_account" field={{ name: 'f', type: 'text' } as any} />
        </div>
      </SchemaRendererProvider>,
    );
    expect(screen.getByTestId('plain')).toHaveTextContent('crm_account');
    expect(ds.getObjects).not.toHaveBeenCalled();
  });
});

describe('objectui#12613 — the `recipient-picker` cell', () => {
  it('names a position recipient through the registry: `sales_manager` reads "Sales Manager"', async () => {
    const store = metadataStore(POSITIONS);
    renderCells(
      'recipient-picker',
      [
        { value: 'sales_manager', dependentValues: { recipient_type: 'position' } },
        { value: 'eu_sales_lead', dependentValues: { recipient_type: 'position' } },
      ],
      { dataSource: { find: vi.fn() }, store },
    );

    await waitFor(() => expect(cell(0)).toHaveTextContent('Sales Manager'));
    expect(cell(0)).not.toHaveTextContent('sales_manager');
    expect(cell(1)).toHaveTextContent('EU Sales Lead');
    expect(store.ensureType).toHaveBeenCalledTimes(1);
    expect(store.ensureType).toHaveBeenCalledWith('position');
  });

  it('names record recipients with ONE `$in` query per directory object, and marks the one it could not find', async () => {
    const find = vi.fn(async (_object: string, _params: any) => ({
      data: [
        { id: 'team_eu', name: 'EU Sales' },
        { id: 'team_us', name: 'US Sales' },
      ],
    }));
    renderCells(
      'recipient-picker',
      [
        { value: 'team_eu', dependentValues: { recipient_type: 'team' } },
        { value: 'team_us', dependentValues: { recipient_type: 'team' } },
        { value: 'team_gone', dependentValues: { recipient_type: 'team' } },
      ],
      { dataSource: { find } },
    );

    await waitFor(() => expect(cell(0)).toHaveTextContent('EU Sales'));
    expect(cell(1)).toHaveTextContent('US Sales');
    await waitFor(() => expect(unresolvedMark(2)).not.toBeNull());
    expect(cell(2)).toHaveTextContent('team_gone');

    expect(find, 'one query for the three rows, not one per cell').toHaveBeenCalledTimes(1);
    const [object, params] = find.mock.calls[0];
    expect(object).toBe('sys_team');
    expect(params.$filter.id.$in.sort()).toEqual(['team_eu', 'team_gone', 'team_us']);
  });

  it("names a `field` recipient by the shared object's user column label", async () => {
    const getObjectSchema = vi.fn(async () => ({
      name: 'crm_case',
      fields: {
        escalated_from: { type: 'user', label: 'Escalated from' },
        subject: { type: 'text', label: 'Subject' },
      },
    }));
    renderCells(
      'recipient-picker',
      [
        { value: 'escalated_from', dependentValues: { recipient_type: 'field', object_name: 'crm_case' } },
        // Not a user column: the evaluator grants nobody for it, so it is not
        // named as one.
        { value: 'subject', dependentValues: { recipient_type: 'field', object_name: 'crm_case' } },
      ],
      { dataSource: { find: vi.fn(), getObjectSchema } },
    );

    await waitFor(() => expect(cell(0)).toHaveTextContent('Escalated from'));
    await waitFor(() => expect(unresolvedMark(1)).not.toBeNull());
    expect(cell(1)).toHaveTextContent('subject');
    expect(getObjectSchema).toHaveBeenCalledTimes(1);
    expect(getObjectSchema).toHaveBeenCalledWith('crm_case');
  });

  it('draws a read the viewer is refused as the raw value, muted', async () => {
    const find = vi.fn(async () => {
      throw new Error('OBJECT_API_DISABLED');
    });
    renderCells('recipient-picker', [{ value: 'usr_1', dependentValues: { recipient_type: 'user' } }], {
      dataSource: { find },
    });

    await waitFor(() => expect(unresolvedMark(0)).not.toBeNull());
    expect(cell(0)).toHaveTextContent('usr_1');
  });

  it('draws the stored text exactly as before when the call site passes no row', () => {
    const find = vi.fn();
    renderCells('recipient-picker', [{ value: 'sales_manager' }], { dataSource: { find } });
    expect(cell(0)).toHaveTextContent('sales_manager');
    expect(unresolvedMark(0)).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
});
