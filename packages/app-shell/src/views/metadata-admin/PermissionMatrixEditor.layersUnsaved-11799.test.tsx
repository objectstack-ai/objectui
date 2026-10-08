// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11799 — under the package door, the permission matrix asks
 * `GET …/layers` for no set that was never published.
 *
 * The Studio Access pillar's "+ New" creates a set as a package draft. Until a
 * publish it has a draft and no layer, and the framework answers `/layers`
 * with a 404 for it. The editor read the layered envelope beside the draft on
 * every open. Under the package door that envelope is used only without a
 * pending draft (the draft wins for display, and the artifact tier applies at
 * environment scope only), and the editor already reads the published set
 * list. So a set that list does not hold is not asked while its draft is in
 * hand.
 *
 * The REAL editor over a REAL `MetadataClient`, whose transport is an
 * in-memory server answering as the framework does: 404 for `/layers` with no
 * layer and for `?state=draft` with no draft. Requests are counted on it.
 *
 * Pinned:
 *  - a never-published set with a draft sends no `/layers` on open, and the
 *    matrix shows its draft exactly as before (the 404 answer was never used);
 *  - CONTROL: a published set is read exactly as before, with a draft and
 *    without one: one `/layers` on open;
 *  - CONTROL: the published set list is read once, by the editor's own read
 *    of it; the load sends no second one.
 *
 * Not covered, said here so it does not read as covered: the package door's
 * SAVE still re-reads `/layers` first, and gets the 404 for such a set. That
 * read decides what other packages' rows a save must keep, and the draft in
 * hand does not say the set was never published; the list read at open is not
 * re-asked there.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetadataClient } from '@object-ui/data-objectstack';

const PKG = 'app.a';

const server = {
  active: new Map<string, Record<string, unknown>>(),
  drafts: new Map<string, Record<string, unknown>>(),
  requests: [] as Array<{ method: string; path: string; search: string; status: number }>,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function serve(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = new URL(String(input), 'http://studio.test');
  const q = url.searchParams;
  let status = 200;
  let body: unknown = [];
  const meta = url.pathname.match(/^\/api\/v1\/meta\/(.+)$/);
  if (meta) {
    const seg = meta[1].split('/').map(decodeURIComponent);
    const key = `${seg[0]}/${seg[1]}`;
    if (seg[0] === '_drafts') {
      body = { drafts: [...server.drafts.keys()].map((k) => ({ type: k.split('/')[0], name: k.split('/')[1], packageId: PKG })) };
    } else if (seg.length === 1 && seg[0] === 'object') {
      body = { items: [{ name: 'a_account' }] };
    } else if (seg.length === 1) {
      body = { items: [...server.active.entries()].filter(([k]) => k.startsWith(`${seg[0]}/`)).map(([, v]) => v) };
    } else if (seg.length === 3 && seg[2] === 'layers') {
      const row = server.active.get(key);
      if (row) body = { code: null, overlay: row, overlayScope: 'env', effective: row };
      else [status, body] = [404, { error: { code: 'NOT_FOUND', message: 'absent' } }];
    } else if (seg.length === 2) {
      const draftRead = q.get('state') === 'draft';
      const row = (draftRead ? server.drafts : server.active).get(key);
      if (row) body = { type: seg[0], name: seg[1], item: draftRead ? { ...row, _draft: true } : row };
      else [status, body] = [404, { error: { code: draftRead ? 'NO_DRAFT' : 'NOT_FOUND', message: 'absent' } }];
    }
  }
  server.requests.push({ method, path: url.pathname, search: url.search, status });
  return json(status, body);
}

const client = new MetadataClient({ baseUrl: '', fetch: vi.fn(serve) as unknown as typeof fetch });

vi.mock('./useMetadata', () => ({
  useMetadataClient: () => client,
  useMetadataTypes: () => ({
    loading: false,
    error: null,
    entries: [{ type: 'permission', label: 'Permission', allowOrgOverride: false, allowRuntimeCreate: true }],
  }),
}));
vi.mock('./AssignedUsersSection', () => ({ AssignedUsersSection: () => null }));

import { PermissionMatrixEditPage } from './PermissionMatrixEditor';

const set = (label: string, read: boolean) => ({
  name: 'sales_perms',
  label,
  objects: { a_account: { allowRead: read, allowCreate: !read } },
  fields: {},
});

const layersAsked = () => server.requests.filter((r) => r.method === 'GET' && r.path === '/api/v1/meta/permission/sales_perms/layers').length;
const setListsAsked = () => server.requests.filter((r) => r.method === 'GET' && r.path === '/api/v1/meta/permission').length;

async function openSet() {
  render(
    <MemoryRouter>
      <PermissionMatrixEditPage type="permission" name="sales_perms" packageId={PKG} embedded />
    </MemoryRouter>,
  );
  await screen.findByText('a_account', undefined, { timeout: 8000 });
  await act(async () => {
    for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
  });
}

const granted = (action: 'Read' | 'Create') => screen.getByRole('checkbox', { name: `a_account ${action}` });

beforeEach(() => {
  server.active.clear();
  server.drafts.clear();
  server.requests = [];
});
afterEach(cleanup);

describe('PermissionMatrixEditPage — a never-published set is not asked for /layers (objectui#11799)', () => {
  it('a set "+ New" created (a draft, not in the published list) sends no /layers, and the matrix shows its draft as before', async () => {
    server.drafts.set('permission/sales_perms', set('Sales (draft)', true));
    await openSet();

    expect(layersAsked()).toBe(0);
    expect(server.requests.filter((r) => r.status === 404)).toEqual([]);
    expect(granted('Read')).toHaveAttribute('aria-checked', 'true');
    expect(granted('Create')).toHaveAttribute('aria-checked', 'false');
    // CONTROL: the list the gate reads is the editor's own read of it.
    expect(setListsAsked()).toBe(1);
  });

  it('CONTROL: a published set with a draft is read as before: one /layers, and the draft is shown', async () => {
    server.active.set('permission/sales_perms', set('Sales', false));
    server.drafts.set('permission/sales_perms', set('Sales (draft)', true));
    await openSet();

    expect(layersAsked()).toBe(1);
    expect(granted('Read')).toHaveAttribute('aria-checked', 'true');
    expect(setListsAsked()).toBe(1);
  });

  it('CONTROL: a published set with no draft is read as before: one /layers, and the published grants are shown', async () => {
    server.active.set('permission/sales_perms', set('Sales', false));
    await openSet();

    expect(layersAsked()).toBe(1);
    expect(granted('Read')).toHaveAttribute('aria-checked', 'false');
    expect(granted('Create')).toHaveAttribute('aria-checked', 'true');
  });
});
