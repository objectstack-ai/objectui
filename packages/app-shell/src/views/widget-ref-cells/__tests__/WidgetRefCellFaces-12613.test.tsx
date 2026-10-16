/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12613 — the console's faces for `@object-ui/fields`' widget-hinted
 * reference keys name what the stored value references.
 *
 * Every case carries its control:
 *   - the reads are the edit widgets' reads, made once per page, not once per
 *     cell — each case counts the calls;
 *   - a value nothing could name draws muted, never blank, and a face that
 *     could not ask (no row, no data source) draws the text it drew before;
 *   - the registration case goes through the REAL key a declared widget
 *     resolves to, so a face that is registered under the wrong key, or not at
 *     all, fails here rather than in a browser.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetadataCtx, SchemaRendererProvider, type MetadataContextValue } from '@object-ui/react';
import { getCellRenderer, resolveCellRendererType, type CellRendererProps } from '@object-ui/fields';
// The faces are what the registration loads lazily; imported at module scope
// so the lazy factory below resolves at once (AGENTS.md, flaky-test rule).
import { ObjectRefCellFace, RecipientCellFace } from '../WidgetRefCellFaces';
import { ObjectRefCell, RecipientCell } from '../widget-ref-cell-renderers';

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

function renderFaces(
  Face: React.FC<CellRendererProps>,
  cells: CellCase[],
  { dataSource, store }: { dataSource?: any; store?: MetadataContextValue | null } = {},
) {
  const body = (
    <SchemaRendererProvider dataSource={dataSource ?? null}>
      {cells.map((c, i) => (
        <div key={i} data-testid={`cell-${i}`}>
          <Face value={c.value} field={{ name: 'f', type: 'text' } as any} dependentValues={c.dependentValues} />
        </div>
      ))}
    </SchemaRendererProvider>
  );
  return render(store ? <MetadataCtx.Provider value={store}>{body}</MetadataCtx.Provider> : body);
}

const cell = (i: number) => screen.getByTestId(`cell-${i}`);
const unresolvedMark = (i: number) => cell(i).querySelector('[data-slot="unresolved-reference"]');

function catalogSource() {
  return {
    getObjects: vi.fn(async () => [
      { name: 'crm_account', label: 'Account' },
      { name: 'crm_contact', label: 'Contact' },
    ]),
  };
}

describe('objectui#12613 — the registered faces, through the key a declared widget resolves to', () => {
  it('registers both faces under the widget keys', () => {
    expect(getCellRenderer(resolveCellRendererType({ type: 'text', widget: 'object-ref' }))).toBe(ObjectRefCell);
    expect(getCellRenderer(resolveCellRendererType({ type: 'text', widget: 'recipient-picker' }))).toBe(RecipientCell);
  });

  it('a rule with recipient `sales_manager` renders "Sales Manager", and its object renders "Account"', async () => {
    const store = metadataStore(POSITIONS);
    const ds = { ...catalogSource(), find: vi.fn() };
    const ObjectCell = getCellRenderer(resolveCellRendererType({ type: 'text', widget: 'object-ref' }));
    const Recipient = getCellRenderer(resolveCellRendererType({ type: 'text', widget: 'recipient-picker' }));
    const row = { object_name: 'crm_account', recipient_type: 'position', recipient_id: 'sales_manager' };
    render(
      <MetadataCtx.Provider value={store}>
        <SchemaRendererProvider dataSource={ds as any}>
          <div data-testid="object">
            <ObjectCell value={row.object_name} field={{ name: 'object_name', type: 'object-ref' } as any} dependentValues={row} />
          </div>
          <div data-testid="recipient">
            <Recipient value={row.recipient_id} field={{ name: 'recipient_id', type: 'recipient-picker' } as any} dependentValues={row} />
          </div>
        </SchemaRendererProvider>
      </MetadataCtx.Provider>,
    );

    await waitFor(() => expect(screen.getByTestId('recipient')).toHaveTextContent('Sales Manager'));
    await waitFor(() => expect(screen.getByTestId('object')).toHaveTextContent('Account'));
    expect(screen.getByTestId('object').querySelector('[title]')?.getAttribute('title')).toBe('Account (crm_account)');
  });
});

describe('objectui#12613 — the `object-ref` face', () => {
  it("draws the object's label, with the api name in the tooltip, from ONE catalog read", async () => {
    const ds = catalogSource();
    renderFaces(ObjectRefCellFace, [{ value: 'crm_account' }, { value: 'crm_contact' }, { value: 'crm_account' }], {
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
    renderFaces(ObjectRefCellFace, [{ value: 'crm_account' }, { value: 'crm_retired' }], { dataSource: catalogSource() });

    await waitFor(() => expect(cell(0)).toHaveTextContent('Account'));
    await waitFor(() => expect(unresolvedMark(1), 'the unknown name wears the unresolved mark').not.toBeNull());
    expect(cell(1)).toHaveTextContent('crm_retired');
    expect(unresolvedMark(0), 'the resolved one does not').toBeNull();
  });

  it('draws the stored text exactly as before when there is no data source to ask', () => {
    renderFaces(ObjectRefCellFace, [{ value: 'crm_account' }]);
    expect(cell(0)).toHaveTextContent('crm_account');
    expect(unresolvedMark(0)).toBeNull();
  });
});

describe('objectui#12613 — the `recipient-picker` face', () => {
  it('names position recipients through the registry, with one store read', async () => {
    const store = metadataStore(POSITIONS);
    renderFaces(
      RecipientCellFace,
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

  it("names record recipients from ONE read of the picker's own candidate query, and marks the one it does not list", async () => {
    const find = vi.fn(async (_object: string, _params: any) => ({
      data: [
        { id: 'team_eu', name: 'EU Sales' },
        { id: 'team_us', name: 'US Sales' },
      ],
    }));
    renderFaces(
      RecipientCellFace,
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
    // The picker's query, so the list names exactly what the open picker offers.
    expect(params).toEqual({ $top: 500, $orderby: { name: 'asc' } });
  });

  it("names a `field` recipient by the shared object's user column label", async () => {
    const getObjectSchema = vi.fn(async () => ({
      name: 'crm_case',
      fields: {
        escalated_from: { type: 'user', label: 'Escalated from' },
        subject: { type: 'text', label: 'Subject' },
      },
    }));
    renderFaces(
      RecipientCellFace,
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
    renderFaces(RecipientCellFace, [{ value: 'usr_1', dependentValues: { recipient_type: 'user' } }], {
      dataSource: { find },
    });

    await waitFor(() => expect(unresolvedMark(0)).not.toBeNull());
    expect(cell(0)).toHaveTextContent('usr_1');
  });

  it('draws the stored text exactly as before when the call site passes no row', () => {
    const find = vi.fn();
    renderFaces(RecipientCellFace, [{ value: 'sales_manager' }], { dataSource: { find } });
    expect(cell(0)).toHaveTextContent('sales_manager');
    expect(unresolvedMark(0)).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
});
