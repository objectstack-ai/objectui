/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12376 — a list tinted by a field projects that field.
 *
 * `ListView`'s `$select` builder adds the view bindings, the grouping fields
 * and the predicate operands to the columns, each through `addSpeculative`.
 * It had no arm for `rowColor.field`, and the spec's `ListViewSchema.rowColor`
 * sets no column requirement on it. A list whose `rowColor.field` is not a
 * column therefore fetched rows without that field, and `useRowColor`, which
 * looks `row[field]` up in the `colors` map, painted no row — no error, no
 * warning. The twin of objectui#10370 (the same harvest's `map` arm, pinned in
 * `ListView.mapLocationSelect-10370.test.tsx`).
 *
 * What is pinned:
 *   - a non-column `rowColor.field` is in `$select`;
 *   - a field the viewer may not read is not (the FLS gate inside
 *     `addSpeculative`, objectui#7216), nor is a name the object does not
 *     declare;
 *   - the projection follows `rowColorConfig`, the state a toolbar pick
 *     replaces: picking another field re-reads the rows with that field.
 */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, cleanup } from '@testing-library/react';

/**
 * Same stub shape as `ListView.mapLocationSelect-10370.test.tsx`: swapped by
 * IDENTITY, because the fetch effect names `perms` in its dependency list.
 */
const { holder, makePerms } = vi.hoisted(() => {
  const makePerms = (isLoaded: boolean, denied: string[]) => ({
    isLoaded,
    checkField: (_object: string, field: string, action: string) =>
      action === 'read' ? !denied.includes(field) : true,
    check: () => ({ allowed: true }),
    getFieldPermissions: () => [],
    getRowFilter: () => undefined,
    getObjectApiOperations: () => undefined,
    roles: [],
    userId: null,
    systemPermissions: undefined,
    hasCapabilities: () => true,
    can: () => true,
    cannot: () => false,
  });
  return { holder: { current: makePerms(true, []) }, makePerms };
});

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  return { ...actual, usePermissions: () => holder.current as any };
});

import { ListView } from '../ListView';
import { SchemaRendererProvider } from '@object-ui/react';

const OBJECT = 'crm_case';

const objectDef = {
  name: OBJECT,
  label: 'Case',
  fields: {
    id: { name: 'id', type: 'text' },
    subject: { name: 'subject', type: 'text', label: 'Subject' },
    is_sla_violated: { name: 'is_sla_violated', type: 'boolean', label: 'SLA violated' },
    is_escalated: { name: 'is_escalated', type: 'boolean', label: 'Escalated' },
    secret_flag: { name: 'secret_flag', type: 'boolean', label: 'Secret flag' },
  },
};

/** Fields the principal may NOT read. */
const DENIED = ['secret_flag'];

const makeDataSource = () =>
  ({
    find: vi.fn(async () => ({ data: [], total: 0 })),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async (name: string) => (name === OBJECT ? objectDef : null)),
  }) as any;

function mount(schemaExtra: Record<string, unknown>) {
  const dataSource = makeDataSource();
  const schema: any = {
    type: 'list-view',
    objectName: OBJECT,
    viewType: 'grid',
    columns: ['subject'],
    ...schemaExtra,
  };
  render(
    <SchemaRendererProvider dataSource={dataSource}>
      <ListView schema={schema} dataSource={dataSource} />
    </SchemaRendererProvider>,
  );
  return dataSource;
}

/** Mount a list view and return the params of the LAST request it sent. */
async function paramsFor(schemaExtra: Record<string, unknown>): Promise<Record<string, unknown>> {
  const dataSource = mount(schemaExtra);
  await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
  return (dataSource.find.mock.calls.at(-1)?.[1] ?? {}) as Record<string, unknown>;
}

const sorted = (v: unknown) => [...((v as string[] | undefined) ?? [])].sort();

beforeEach(() => {
  vi.clearAllMocks();
  holder.current = makePerms(true, DENIED);
});
afterEach(() => cleanup());

describe('ListView — a row colour on a non-column field is projected (objectui#12376)', () => {
  it('projects `rowColor.field` when the columns omit it', async () => {
    const params = await paramsFor({ rowColor: { field: 'is_sla_violated', colors: { true: 'red' } } });
    expect(sorted(params.$select)).toEqual(['id', 'is_sla_violated', 'subject']);
  });

  it('control: a `rowColor.field` that is a column is sent once', async () => {
    const params = await paramsFor({
      columns: ['subject', 'is_sla_violated'],
      rowColor: { field: 'is_sla_violated', colors: { true: 'red' } },
    });
    expect(sorted(params.$select)).toEqual(['id', 'is_sla_violated', 'subject']);
  });

  it('does not request a `rowColor.field` the viewer may not read', async () => {
    const params = await paramsFor({ rowColor: { field: 'secret_flag', colors: { true: 'red' } } });
    expect(sorted(params.$select)).toEqual(['id', 'subject']);
  });

  it('does not send a `rowColor.field` the object does not declare', async () => {
    const params = await paramsFor({ rowColor: { field: 'no_such_field', colors: { x: 'red' } } });
    expect(sorted(params.$select)).toEqual(['id', 'subject']);
  });

  it('follows a toolbar pick of another field: the rows are re-read with it', async () => {
    const dataSource = mount({
      userActions: { rowColor: true },
      rowColor: { field: 'is_sla_violated', colors: { true: 'red' } },
    });
    await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
    expect(sorted(dataSource.find.mock.calls.at(-1)?.[1]?.$select)).toEqual(['id', 'is_sla_violated', 'subject']);
    const callsBefore = dataSource.find.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /^color/i }));
    const trigger = await screen.findByTestId('color-field-select');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const listbox = await screen.findByRole('listbox');
    const option = within(listbox).getAllByRole('option').find((o) => o.textContent === 'Escalated');
    if (!option) throw new Error('the Color picker lists no "Escalated"');
    fireEvent.click(option);

    await waitFor(() => expect(dataSource.find.mock.calls.length).toBeGreaterThan(callsBefore));
    await waitFor(() =>
      expect(sorted(dataSource.find.mock.calls.at(-1)?.[1]?.$select)).toEqual(['id', 'is_escalated', 'subject']),
    );
  });
});
