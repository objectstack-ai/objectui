/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The record picker's display column reads its title through
 * `@object-ui/core`'s `withoutDeniedFields`, the one field-read rule every
 * display surface calls (objectui#10594). The picker's module-private copy is
 * gone.
 *
 * Pinned against the real dialog and the production policy provider
 * (`MePermissionsProvider`, an authenticated session: an object the payload
 * does not name is denied, #2926 ④):
 *
 *  - a named object: a field the loaded policy denies is not in the display
 *    column's title, and the declared `idField` is kept in the row the title
 *    reads even when the policy denies it (the `[idField]` this site hands the
 *    export), so the title still shows it and a row click still commits it;
 *  - an empty object name: the export passes the row through where the old
 *    copy judged every field against `''` (ruling 5861445694 on
 *    objectui#10594). The picker reads nothing without an object name, so
 *    there is no row to judge: no read is issued and no row is drawn, although
 *    the backend here answers for any object name.
 *
 * `RecordPickerDialog.displayFls-10373.test.tsx` pins the column gates (which
 * columns are headed and drawn) against the role-based provider.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaRendererContext } from '@object-ui/react';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';
import { RecordPickerDialog } from './RecordPickerDialog';
import { getCellRenderer } from '../index';

const ACCOUNT_FIELDS: Record<string, any> = {
  name: { type: 'text', label: 'Name' },
  code: { type: 'text', label: 'Code' },
  secret: { type: 'text', label: 'Secret' },
};

/**
 * A backend that does NOT strip denied keys (ObjectStack's `FieldMasker`
 * would), and that answers for ANY object name, so a read issued for an empty
 * name would put rows on screen.
 */
function makeBackend(prefix: string) {
  const rows = [0, 1, 2].map((i) => ({
    id: `${prefix}_acct_${i}`,
    code: `C-${prefix}-${i}`,
    name: `Account ${i}`,
    secret: `S-${prefix}-${i}`,
  }));
  const find = vi.fn(async () => ({ data: rows.map((r) => ({ ...r })), total: rows.length }));
  return { find, findOne: vi.fn(async () => null) } as any;
}

/**
 * An authenticated `/me/permissions` payload: `account` is readable, and each
 * named `account` field is not.
 */
function policyDenying(...fields: string[]): MePermissionsResponse {
  return {
    authenticated: true,
    userId: 'u1',
    tenantId: null,
    roles: ['viewer'],
    permissionSets: [],
    objects: { account: { allowRead: true } },
    fields: Object.fromEntries(fields.map((f) => [`account.${f}`, { readable: false }])),
  };
}

function Picker({
  ds,
  objectName,
  onSelect = () => {},
}: {
  ds: ReturnType<typeof makeBackend>;
  objectName: string;
  onSelect?: (v: unknown) => void;
}) {
  return (
    <SchemaRendererContext.Provider value={{ dataSource: ds } as any}>
      <RecordPickerDialog
        open
        onOpenChange={() => {}}
        dataSource={ds}
        objectName={objectName}
        idField="code"
        onSelect={onSelect}
        cellRenderer={getCellRenderer}
        fieldsMeta={ACCOUNT_FIELDS}
        objectSchema={{ name: 'account', fields: ACCOUNT_FIELDS, titleFormat: '{name} - {code} - {secret}' }}
      />
    </SchemaRendererContext.Provider>
  );
}

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

function cells(field: string): string[] {
  return Array.from(document.querySelectorAll(`[data-lookup-cell="${field}"]`)).map(
    (el) => el.textContent ?? '',
  );
}

afterEach(() => {
  cleanup();
});

describe('RecordPickerDialog — the display title reads the shared field-read rule (objectui#10594)', () => {
  it('a named object: a denied field is not in the title; the declared id field is kept even when denied, and a row click commits it', async () => {
    const ds = makeBackend('named');
    const onSelect = vi.fn();
    render(
      <MePermissionsProvider initialPermissions={policyDenying('secret', 'code')}>
        <Picker ds={ds} objectName="account" onSelect={onSelect} />
      </MePermissionsProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('record-row-C-named-1')).toBeInTheDocument());
    await settle();

    expect(cells('name')).toEqual([
      'Account 0 - C-named-0',
      'Account 1 - C-named-1',
      'Account 2 - C-named-2',
    ]);
    expect(document.body.textContent).not.toContain('S-named-');
    await act(async () => {
      fireEvent.click(screen.getByTestId('record-row-C-named-1'));
    });
    expect(onSelect).toHaveBeenCalledWith('C-named-1');
  });

  it('an empty object name under a loaded policy: no read is issued and no row is drawn', async () => {
    const ds = makeBackend('empty');
    render(
      <MePermissionsProvider initialPermissions={policyDenying('secret')}>
        <Picker ds={ds} objectName="" />
      </MePermissionsProvider>,
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await settle();

    expect(ds.find).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[data-testid^="record-row-"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-lookup-cell]')).toHaveLength(0);
    expect(document.body.textContent).not.toContain('Account 0');
  });
});
