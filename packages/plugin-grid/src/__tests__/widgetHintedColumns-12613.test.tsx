/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12613 — a grid column whose field declares `widget: 'object-ref'`
 * or `widget: 'recipient-picker'` names what the stored value references, on
 * EVERY column path `ObjectGrid` can pick.
 *
 * The Sharing Rules list is the measured case: the platform's `sys_sharing_rule`
 * declares `object_name` with `widget: 'object-ref'` and `recipient_id` with
 * `widget: 'recipient-picker'` (`dependsOn: ['recipient_type', 'object_name']`),
 * and its list views name those columns as strings. The grid resolved each
 * column from `type` and `format` alone, so both drew through the text cell and
 * the list read `crm_account` / `sales_manager` where the edit form reads
 * "Account" / "Sales Manager".
 *
 * The object here is NOT `sys_sharing_rule`, on purpose: the cell is chosen by
 * the declared widget, so a neutral object declaring the same two hints is the
 * honest subject, and nothing in the grid may key on an object or field name.
 *
 * ## The control
 *
 * `note` is a plain `text` column holding the SAME strings the two hinted
 * columns hold (`sales_manager`, `crm_account`). It must still print them raw:
 * the naming is driven by the declaration, not by the value. And the recipient
 * cell needs the ROW (its `recipient_type`), which only a call site holding the
 * row can hand it — so each path below is its own case (the paths are listed in
 * `formatHintedColumnRenderer-8920.test.tsx`).
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  assertNoOtherNetworkEscape,
  installRecordSecurityExplainDouble,
} from '@object-ui/test-support';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { registerAllFields } from '@object-ui/fields';
import { ActionProvider, MetadataCtx, SchemaRendererProvider } from '@object-ui/react';
import { ObjectGrid } from '../ObjectGrid';

registerAllFields();

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as any;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn() as any;
  }
});

// The record overlay's explain call is served from a double, as in
// `formatHintedColumnRenderer-8920.test.tsx`; nothing here reads it.
beforeEach(() => installRecordSecurityExplainDouble(vi));
afterEach(() => {
  assertNoOtherNetworkEscape(expect);
  cleanup();
  vi.unstubAllGlobals();
});

const RULE_SCHEMA = {
  name: 'access_rule',
  label: 'Access Rule',
  fields: {
    label: { type: 'text', label: 'Label' },
    object_name: { type: 'text', label: 'Object', widget: 'object-ref' },
    recipient_type: {
      type: 'select',
      label: 'Recipient Type',
      options: [
        { value: 'position', label: 'Position' },
        { value: 'team', label: 'Team' },
      ],
    },
    recipient_id: {
      type: 'text',
      label: 'Recipient',
      widget: 'recipient-picker',
      dependsOn: ['recipient_type', 'object_name'],
    },
    note: { type: 'text', label: 'Note' },
  },
};

const ROWS = [
  {
    id: 'r-1',
    label: 'Account managers',
    object_name: 'crm_account',
    recipient_type: 'position',
    recipient_id: 'sales_manager',
    note: 'sales_manager',
  },
  {
    id: 'r-2',
    label: 'EU team',
    object_name: 'crm_account',
    recipient_type: 'team',
    recipient_id: 'team_eu',
    note: 'crm_account',
  },
];

function makeDataSource() {
  return {
    find: vi.fn(async (object: string) => {
      if (object === 'sys_team') return { data: [{ id: 'team_eu', name: 'EU Sales' }] };
      return { data: ROWS, total: ROWS.length };
    }),
    getObjectSchema: vi.fn(async () => RULE_SCHEMA),
    getObjects: vi.fn(async () => [{ name: 'crm_account', label: 'Account' }]),
  } as any;
}

function metadataStore() {
  return {
    apps: [], objects: [], dashboards: [], reports: [], pages: [],
    loading: false, error: null,
    refresh: async () => {}, invalidate: () => {},
    ensureType: vi.fn(async (type: string) =>
      type === 'position' ? [{ name: 'sales_manager', label: 'Sales Manager' }] : [],
    ),
    getItem: async () => null,
    getItemsByType: () => [],
  } as any;
}

const COLUMN_NAMES = ['label', 'object_name', 'recipient_type', 'recipient_id', 'note'];

function renderGrid(schemaOverrides: Record<string, unknown>, props: Record<string, unknown> = {}) {
  const dataSource = makeDataSource();
  const utils = render(
    <SchemaRendererProvider dataSource={dataSource}>
      <MetadataCtx.Provider value={metadataStore()}>
        <ActionProvider>
          <ObjectGrid
            schema={{ type: 'object-grid', objectName: 'access_rule', ...schemaOverrides } as never}
            dataSource={dataSource}
            {...props}
          />
        </ActionProvider>
      </MetadataCtx.Provider>
    </SchemaRendererProvider>,
  );
  return { ...utils, dataSource };
}

/**
 * Both hinted columns named on both rows, and the control printing the same
 * strings raw. `getAllByText` counts TEXT nodes, not attributes, so the
 * tooltips carrying the api name do not count toward the raw-string tallies.
 */
async function expectReferencesNamed(dataSource: any) {
  await waitFor(() => expect(screen.getByText('Sales Manager')).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText('EU Sales')).toBeInTheDocument());
  await waitFor(() => expect(screen.getAllByText('Account')).toHaveLength(2));

  const account = screen.getAllByText('Account')[0];
  expect(account.getAttribute('title'), 'the api name stays one hover away').toBe('Account (crm_account)');

  // The control column: the same strings, undeclared, print raw — once each.
  expect(screen.getAllByText('sales_manager')).toHaveLength(1);
  expect(screen.getAllByText('crm_account')).toHaveLength(1);
  expect(screen.queryByText('team_eu'), 'the team id is named, not printed').toBeNull();

  // One catalog read and one team query for the whole grid, not one per row.
  expect(dataSource.getObjects).toHaveBeenCalledTimes(1);
  expect(dataSource.find.mock.calls.filter(([object]: [string]) => object === 'sys_team')).toHaveLength(1);
}

describe('objectui#12613 — every ObjectGrid path names an `object-ref` / `recipient-picker` value', () => {
  it('A: object `columns`', async () => {
    const { dataSource } = renderGrid({
      columns: COLUMN_NAMES.map((field) => ({ field })),
      data: { provider: 'value', items: ROWS },
    });
    await waitFor(() => expect(screen.getByText('Account managers')).toBeInTheDocument());
    await expectReferencesNamed(dataSource);
  });

  it('B: string `columns` — the shape the platform list views declare', async () => {
    const { dataSource } = renderGrid({
      columns: COLUMN_NAMES,
      data: { provider: 'value', items: ROWS },
    });
    await waitFor(() => expect(screen.getByText('Account managers')).toBeInTheDocument());
    await expectReferencesNamed(dataSource);
  });

  it('C: inline-data projection (`fields`, no `columns`)', async () => {
    const { dataSource } = renderGrid({
      fields: COLUMN_NAMES,
      data: { provider: 'value', items: ROWS },
    });
    await waitFor(() => expect(screen.getByText('Account managers')).toBeInTheDocument());
    await expectReferencesNamed(dataSource);
  });

  it('D: object-schema default columns (rows handed down, no projection)', async () => {
    const { dataSource } = renderGrid({}, { data: ROWS });
    await waitFor(() => expect(screen.getByText('Account managers')).toBeInTheDocument());
    await expectReferencesNamed(dataSource);
  });
});
