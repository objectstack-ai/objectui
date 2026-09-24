/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The lookup dropdown previews only the columns the user may read —
 * objectui#10373.
 *
 * Under the renderer-side FLS rulings (objectui#7215 / objectui#7230, applied
 * by the objectui#7429 sweep) field-level security gates the OUTPUT.
 * `RelatedList` gates both its `$expand` and the columns it draws
 * (`keepReadableColumns`); the lookup dropdown gated only its `$expand`
 * (objectui#10223), so a column the policy denies was still previewed under
 * every candidate, and a denied RELATION column, left out of `$expand`, arrived
 * as a bare key that the lookup cell renderer then resolved with a read of its
 * own.
 *
 * What is pinned, against the real `PermissionProvider` (not a stub):
 *
 *  - a preview column the loaded policy denies is not rendered, and a denied
 *    relation column is neither rendered nor resolved row by row;
 *  - the readable preview columns still render (the pin reads a FILTER, not a
 *    preview that vanished);
 *  - with no policy loaded (no provider: `isLoaded` is false) nothing is
 *    filtered;
 *  - a policy that denies the display field drops no option: every candidate
 *    is still listed, and choosing one commits its id.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaRendererContext } from '@object-ui/react';
import { PermissionProvider } from '@object-ui/permissions';
import { LookupField } from './LookupField';
// Registers the cell-renderer bridge the preview renders through.
import '../index';

const CANDIDATES = 5;

const ACCOUNT_FIELDS: Record<string, any> = {
  name: { type: 'text', label: 'Name' },
  code: { type: 'text', label: 'Code' },
  secret: { type: 'text', label: 'Secret' },
  region: { type: 'lookup', label: 'Region', reference_to: 'region' },
};

/**
 * A backend that does NOT strip denied keys (ObjectStack's `FieldMasker`
 * would) — the case this gate defends. It honours `$expand`.
 */
function makeBackend(prefix: string) {
  const regions: Record<string, { id: string; name: string }> = {};
  const rows: Record<string, any>[] = [];
  for (let i = 0; i < CANDIDATES; i++) {
    const regionId = `${prefix}_region_${i}`;
    regions[regionId] = { id: regionId, name: `Region ${i}` };
    rows.push({ id: `${prefix}_acct_${i}`, name: `Account ${i}`, code: `C-${i}`, secret: `S-${i}`, region: regionId });
  }
  const find = vi.fn(async (objectName: string, params?: Record<string, any>) => {
    if (objectName !== 'account') return { data: [], total: 0 };
    const expand: string[] = Array.isArray(params?.$expand) ? params!.$expand : [];
    const data = rows.map((r) => {
      const row = { ...r };
      if (expand.includes('region')) row.region = regions[r.region];
      return row;
    });
    return { data, total: rows.length };
  });
  const findOne = vi.fn(async (objectName: string, id: string) =>
    objectName === 'region' ? regions[id] ?? null : null,
  );
  const getObjectSchema = vi.fn(async (objectName: string) => {
    if (objectName === 'account') {
      return { name: 'account', fields: ACCOUNT_FIELDS, highlightFields: ['code', 'secret', 'region'] };
    }
    if (objectName === 'region') {
      return { name: 'region', fields: { name: { type: 'text', label: 'Name' } } };
    }
    return undefined;
  });
  return { find, findOne, getObjectSchema } as any;
}

type Backend = ReturnType<typeof makeBackend>;

/** Reads that are not the candidate query: per-row resolution of `region`. */
function perRowReads(ds: Backend): number {
  const finds = ds.find.mock.calls.filter(([objectName]: [string]) => objectName !== 'account').length;
  return finds + ds.findOne.mock.calls.length;
}

type Wrap = (node: React.ReactElement) => React.ReactElement;
const bare: Wrap = (node) => node;

/** The real role-based provider, denying the named `account` fields to `viewer`. */
function denying(...fields: string[]): Wrap {
  return (node) => (
    <PermissionProvider
      roles={[]}
      userRoles={['viewer']}
      permissions={[
        {
          object: 'account',
          roles: {
            viewer: { actions: ['read'], fieldPermissions: fields.map((field) => ({ field, read: false })) },
          },
        },
      ]}
    >
      {node}
    </PermissionProvider>
  );
}

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function openDropdown(ds: Backend, wrap: Wrap, onChange: (v: unknown) => void = () => {}): Promise<void> {
  render(
    wrap(
      <SchemaRendererContext.Provider value={{ dataSource: ds } as any}>
        <LookupField
          value={undefined}
          onChange={onChange}
          dataSource={ds}
          field={{ reference_to: 'account' } as never}
        />
      </SchemaRendererContext.Provider>,
    ),
  );
  await waitFor(() => expect(ds.getObjectSchema).toHaveBeenCalledWith('account'));
  await settle();
  await act(async () => {
    fireEvent.click(screen.getByTestId('lookup-trigger'));
  });
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(CANDIDATES));
  await settle();
}

function previews(field: string): string[] {
  return Array.from(document.querySelectorAll(`[data-lookup-preview="${field}"]`)).map(
    (el) => el.textContent ?? '',
  );
}

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch {
    /* no storage in this environment */
  }
});

describe('LookupField — the dropdown previews only readable columns (objectui#10373)', () => {
  it('a preview column the loaded policy denies is not rendered; the readable one still is', async () => {
    const ds = makeBackend('deny');
    await openDropdown(ds, denying('secret'));

    expect(previews('secret')).toEqual([]);
    expect(previews('code')).toHaveLength(CANDIDATES);
    expect(previews('code')[0]).toBe('C-0');
    // The readable relation is still previewed, expanded, with no per-row read.
    expect(previews('region')[0]).toBe('Region 0');
  });

  it('a denied relation column is neither rendered nor resolved row by row', async () => {
    const ds = makeBackend('rel');
    await openDropdown(ds, denying('region'));

    const candidateQuery = ds.find.mock.calls.find(([o]: [string]) => o === 'account')![1];
    expect(candidateQuery.$expand).toBeUndefined();
    expect(previews('region')).toEqual([]);
    expect(perRowReads(ds)).toBe(0);
    expect(previews('secret')).toHaveLength(CANDIDATES);
  });

  it('control: with no policy loaded (no provider) nothing is filtered', async () => {
    const ds = makeBackend('none');
    await openDropdown(ds, bare);

    expect(previews('secret')).toHaveLength(CANDIDATES);
    expect(previews('code')).toHaveLength(CANDIDATES);
    expect(previews('region')[0]).toBe('Region 0');
  });

  it('a policy denying the display field drops no option, and choosing one commits its id', async () => {
    const ds = makeBackend('title');
    const onChange = vi.fn();
    await openDropdown(ds, denying('name'), onChange);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(CANDIDATES);
    await act(async () => {
      fireEvent.click(options[2]);
    });
    expect(onChange).toHaveBeenCalledWith('title_acct_2');
  });
});
