// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * "Clone to customize" — the locked permission matrix's primary action
 * (objectui#5987, the UI half of objectstack#11513).
 *
 * ## What is pinned
 *
 * The artifact tier (`isArtifactBackedLayer`, objectui#4518 / #4526) locks a set
 * a code package ships. The maintainer's ruling on objectstack#11513 — 「同意
 * 第一步(创业阶段,Salesforce 式)」: lock the base, clone to customize — makes
 * cloning the sanctioned edit path, and the server's own `403 not_overridable`
 * refusal names the `clone_permission_set` action as the remedy. This suite pins
 * that the editor:
 *
 *   1. renders "Clone to customize" as the locked editor's PRIMARY action, in
 *      the slot Save would occupy, and names cloning FIRST in its guidance
 *      (en-US and zh-CN);
 *   2. runs the PUBLISHED `clone_permission_set` action — the one declared on
 *      the `sys_permission_set` object the console holds — through the shared
 *      action runner, with THIS set's row as its identity, never a clone
 *      assembled from create / update calls;
 *   3. opens the returned clone, which loads with no code layer and is
 *      writable;
 *   4. shows no clone prompt on an org-owned set, a type-locked set or a
 *      host-locked package (the controls);
 *   5. surfaces the same guidance when a save that reached the server is
 *      refused `403 NOT_OVERRIDABLE` (the card's item 3), keyed on the code.
 *
 * ## Red-first
 *
 * Every case below that asserts the clone affordance fails on the base this
 * branch was cut from (`origin/main` at `a2f361b8c1`): the locked editor offered
 * no clone action, its guidance never named cloning, and a `NOT_OVERRIDABLE`
 * refusal rendered the transport's message alone.
 *
 * ## The action fixture is the shipped declaration
 *
 * `@objectstack/plugin-security` is not a dependency of this repo, so the Clone
 * action cannot be imported. `CLONE_ACTION` below is transcribed from the
 * `clone_permission_set` action on `SysPermissionSet`
 * (`sys-permission-set.object.ts` in that package, identical at the published
 * tag `@objectstack/plugin-security@17.4.0` and on `main` when read). The suite
 * asserts the DISPATCH carries that declaration — not a list of this editor's
 * own — which is what "wired to the published action" means here.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';

/* ── The shipped declaration ─────────────────────────────────────────────── */

const SYS_PERMISSION_SET = 'sys_permission_set';
const BASE_SET = 'showcase_contributor';
const CLONE_NAME = 'my_clone';

/** The five facets the shipped action declares `carryOver` on. */
const CARRIED = [
  'object_permissions',
  'field_permissions',
  'system_permissions',
  'row_level_security',
  'tab_permissions',
] as const;

/** `clone_permission_set`, as `SysPermissionSet` declares it. */
const CLONE_ACTION = {
  name: 'clone_permission_set',
  label: 'Clone',
  icon: 'copy',
  variant: 'secondary',
  mode: 'custom',
  locations: ['list_item', 'record_header'],
  type: 'api',
  method: 'POST',
  target: '/api/v1/data/sys_permission_set',
  bodyExtra: { active: true },
  description:
    'Copies this set\'s permissions into a new organization-owned set you can edit. '
    + 'Delegated-admin scope is not copied — grant it deliberately on the new set if it needs one.',
  successMessage: 'Permission set cloned',
  refreshAfter: true,
  params: [
    { name: 'label', label: 'New Display Name', type: 'text', required: true },
    { name: 'name', label: 'New API Name', type: 'text', required: true, helpText: 'snake_case machine name, unique per organization' },
    { field: 'description', defaultFromRow: true },
    { field: 'object_permissions', defaultFromRow: true, carryOver: true },
    { field: 'field_permissions', defaultFromRow: true, carryOver: true },
    { field: 'system_permissions', defaultFromRow: true, carryOver: true },
    { field: 'row_level_security', defaultFromRow: true, carryOver: true },
    { field: 'tab_permissions', defaultFromRow: true, carryOver: true },
  ],
};

/** The object the action is declared on, as the console's metadata store holds it. */
const SYS_PERMISSION_SET_DEF = {
  name: SYS_PERMISSION_SET,
  label: 'Permission Set',
  fields: {
    label: { type: 'text', label: 'Display Name', required: true },
    name: { type: 'text', label: 'API Name', required: true },
    description: { type: 'textarea', label: 'Description' },
    object_permissions: { type: 'textarea', label: 'Object Permissions' },
    field_permissions: { type: 'textarea', label: 'Field Permissions' },
    system_permissions: { type: 'textarea', label: 'System Permissions' },
    row_level_security: { type: 'textarea', label: 'Row-Level Security' },
    tab_permissions: { type: 'textarea', label: 'Tab Permissions' },
  },
  actions: [CLONE_ACTION],
};

/** The set's `sys_permission_set` row — the identity the clone runs against. */
const ROW = {
  id: 'ps_1',
  name: BASE_SET,
  label: 'Contributor',
  description: 'Ships with the showcase',
  managed_by: 'package',
  object_permissions: JSON.stringify({ a_account: { allowRead: true, allowCreate: true } }),
  field_permissions: '{}',
  system_permissions: '[]',
  row_level_security: '{}',
  tab_permissions: '{}',
};

/* ── Fakes ───────────────────────────────────────────────────────────────── */

// Which sets a code package ships, by name: the layered envelope's `code` slot.
let codeLayerByName: Record<string, Record<string, unknown> | null> = {};
// What `client.save` does — the default resolves; item 3 makes it refuse.
let saveImpl: (type: string, name: string, payload: Record<string, unknown>) => Promise<unknown> =
  async (_t, _n, payload) => payload;

const SET_BODY = {
  label: 'Contributor',
  objects: { a_account: { allowRead: true, allowCreate: true } },
  fields: {},
} as Record<string, unknown>;

function makeClient() {
  return {
    layered: vi.fn(async (_type: string, name: string) => ({
      effective: { ...SET_BODY, name },
      code: codeLayerByName[name] ?? null,
      overlay: null,
      overlayScope: null,
    })),
    getDraft: async () => null,
    list: async (type: string) =>
      type === 'object' ? [{ item: { name: 'a_account', label: 'Account' } }] : [],
    get: async (type: string) =>
      type === 'object' ? { fields: [{ name: 'name', label: 'Name' }] } : null,
    save: async (type: string, name: string, payload: Record<string, unknown>) => saveImpl(type, name, payload),
  } as any;
}

// The stock-boot `permission` shape (objectstack#6483) unless a case says otherwise.
let typeFlags: { allowOrgOverride?: boolean; allowRuntimeCreate?: boolean } = {
  allowOrgOverride: false,
  allowRuntimeCreate: true,
};
let clientImpl: any;

vi.mock('./useMetadata', () => ({
  useMetadataClient: () => clientImpl,
  useMetadataTypes: () => ({
    loading: false,
    error: null,
    entries: [{ type: 'permission', label: 'Permission', ...typeFlags }],
  }),
}));

let localeFixture: 'en-US' | 'zh-CN' = 'en-US';
vi.mock('./i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataLocale: () => localeFixture,
}));

// The console's record adapter and metadata store, as the editor reaches them
// through `@object-ui/react`. `ActionProvider` / `useAction` stay REAL: the
// dispatch under test goes through the genuine runner.
let rows: Array<Record<string, unknown>> = [ROW];
const adapterFind = vi.fn(async (object: string, params: { $filter?: { name?: string } }) => ({
  data: object === SYS_PERMISSION_SET ? rows.filter((r) => r.name === params?.$filter?.name) : [],
}));
let objectDefs: Array<Record<string, unknown>> = [SYS_PERMISSION_SET_DEF];
const ensureType = vi.fn(async (type: string) => (type === 'object' ? objectDefs : []));

vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/react')>()),
  useAdapter: () => ({ find: adapterFind }),
  useMetadata: () => ({
    apps: [],
    objects: objectDefs,
    dashboards: [],
    reports: [],
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType,
    getItem: async () => null,
    getItemsByType: () => [],
    getTypeStatus: () => 'ready' as const,
  }),
}));

import { ActionProvider } from '@object-ui/react';
import { PermissionMatrixEditPage } from './PermissionMatrixEditor';

/* ── The runner's seams ──────────────────────────────────────────────────── */

// What the console api handler would answer for the POST — the data door's
// `CreateDataResponse` (`{ object, id, record }`) after the handler unwraps the
// `{ success, data }` envelope.
let apiResult: { success: boolean; data?: unknown; error?: string } = {
  success: true,
  data: { object: SYS_PERMISSION_SET, id: 'ps_2', record: { id: 'ps_2', name: CLONE_NAME, label: 'My clone' } },
};
// Snapshots of what the api handler was handed: the runner rewrites
// `action.params` in place after collection, so the object is copied at the
// moment of the call.
const dispatched: any[] = [];
const apiHandler = vi.fn(async (action: any, _ctx: any) => {
  dispatched.push(JSON.parse(JSON.stringify(action)));
  return apiResult;
});
// The param dialog: records the definitions it was asked to render and answers
// with the two typed values plus the seeded carry-overs, as the real dialog's
// serialization would.
let paramAnswer: Record<string, unknown> | null = {
  label: 'My clone',
  name: CLONE_NAME,
  description: ROW.description,
  ...Object.fromEntries(CARRIED.map((f) => [f, ROW[f]])),
};
const paramCollection = vi.fn(async (_params: any[], _action?: any) => paramAnswer);
const toastSpy = vi.fn();

function RoutedEditor() {
  const { name = '' } = useParams<{ name?: string }>();
  return <PermissionMatrixEditPage type="permission" name={name} />;
}

/**
 * The routed metadata admin: `metadata/:type/:name`, the one surface where the
 * artifact tier engages (environment scope, no `packageId`), wrapped in the
 * real `ActionProvider` with the console runtime's three seams faked.
 */
async function renderRouted() {
  clientImpl = makeClient();
  render(
    <MemoryRouter initialEntries={[`/apps/setup/metadata/permission/${BASE_SET}`]}>
      <ActionProvider onParamCollection={paramCollection} onToast={toastSpy} handlers={{ api: apiHandler }}>
        <Routes>
          <Route path="/apps/:appName/metadata/:type/:name" element={<RoutedEditor />} />
        </Routes>
      </ActionProvider>
    </MemoryRouter>,
  );
  await screen.findByText('Account');
}

async function renderPlain(props?: { packageId?: string; readOnly?: boolean; embedded?: boolean }) {
  clientImpl = makeClient();
  render(
    <MemoryRouter>
      <ActionProvider onParamCollection={paramCollection} onToast={toastSpy} handlers={{ api: apiHandler }}>
        <PermissionMatrixEditPage type="permission" name={BASE_SET} {...props} />
      </ActionProvider>
    </MemoryRouter>,
  );
  await screen.findByText('Account');
}

const CLONE_EN = /^Clone to customize$/;
const CLONE_ZH = /^克隆后自定义$/;
const cloneButtons = () => screen.queryAllByRole('button', { name: CLONE_EN });
const saveButton = () => screen.queryByRole('button', { name: /^Save$/ });

beforeEach(() => {
  codeLayerByName = { [BASE_SET]: { _packageId: 'com.example.showcase', name: BASE_SET } };
  saveImpl = async (_t, _n, payload) => payload;
  typeFlags = { allowOrgOverride: false, allowRuntimeCreate: true };
  localeFixture = 'en-US';
  rows = [ROW];
  objectDefs = [SYS_PERMISSION_SET_DEF];
  apiResult = {
    success: true,
    data: { object: SYS_PERMISSION_SET, id: 'ps_2', record: { id: 'ps_2', name: CLONE_NAME, label: 'My clone' } },
  };
  paramAnswer = {
    label: 'My clone',
    name: CLONE_NAME,
    description: ROW.description,
    ...Object.fromEntries(CARRIED.map((f) => [f, ROW[f]])),
  };
  dispatched.length = 0;
  apiHandler.mockClear();
  paramCollection.mockClear();
  adapterFind.mockClear();
  ensureType.mockClear();
  toastSpy.mockClear();
});

afterEach(() => {
  cleanup();
});

/* ────────────────────────────────────────────────────────────────────────── */

describe('PermissionMatrixEditPage — the locked editor offers Clone to customize (objectui#5987)', () => {
  it('renders "Clone to customize" as the primary action where Save would be, and no Save', async () => {
    await renderRouted();

    expect(saveButton()).toBeNull();
    const [clone] = cloneButtons();
    expect(clone).toBeInTheDocument();
    expect(clone).toBeEnabled();
    // Its hint names the published action it runs.
    expect(clone).toHaveAttribute('title', expect.stringContaining('clone_permission_set'));
    // The visible locked-state guidance names cloning.
    expect(screen.getByRole('note')).toHaveTextContent(/Clone to customize/);
  });

  it('the artifact badge hint names cloning FIRST; the former remedies follow as secondary routes', async () => {
    await renderRouted();

    const badge = screen.getByText(/provided by a code package/);
    const hint = badge.getAttribute('title') ?? '';
    const clone = hint.indexOf('Clone to customize');
    expect(clone).toBeGreaterThan(-1);
    for (const secondary of ['redeploy', 'new runtime set', 'OS_METADATA_WRITABLE']) {
      const at = hint.indexOf(secondary);
      expect(at, `"${secondary}" must be in the hint`).toBeGreaterThan(-1);
      expect(clone, `cloning must come before "${secondary}"`).toBeLessThan(at);
    }
    // The server's own reason and code are still stated (objectui#4518's pins
    // on this hint are unchanged).
    expect(hint).toContain('allowOrgOverride');
    expect(hint).toContain('not_overridable');
  });

  it('zh-CN: the same primary action and guidance', async () => {
    localeFixture = 'zh-CN';
    await renderRouted();

    expect(screen.getByRole('button', { name: CLONE_ZH })).toBeInTheDocument();
    expect(cloneButtons()).toHaveLength(0);
    expect(screen.getByRole('note')).toHaveTextContent(/克隆后自定义/);
    // Exact: the guidance note above also says 由代码包提供.
    const badge = screen.getByText('只读（该权限集由代码包提供）', { exact: true });
    const hint = badge.getAttribute('title') ?? '';
    expect(hint.indexOf('克隆后自定义')).toBeGreaterThan(-1);
    expect(hint.indexOf('克隆后自定义')).toBeLessThan(hint.indexOf('重新部署'));
  });
});

describe('PermissionMatrixEditPage — Clone to customize runs the PUBLISHED clone_permission_set action (objectui#5987)', () => {
  it('dispatches the action declared on sys_permission_set, with THIS set\'s row as its identity', async () => {
    await renderRouted();
    fireEvent.click(cloneButtons()[0]);

    await waitFor(() => expect(apiHandler).toHaveBeenCalledTimes(1));

    // The identity was read off the set's own record, by name.
    expect(adapterFind).toHaveBeenCalledWith(SYS_PERMISSION_SET, { $filter: { name: BASE_SET }, $top: 1 });
    // The action was resolved off the object definition the console holds.
    expect(ensureType).toHaveBeenCalledWith('object');

    // The dialog was asked to render the DECLARED params — the shipped list,
    // carry-overs included — not a list of this editor's own.
    expect(paramCollection).toHaveBeenCalledTimes(1);
    const [askedParams, askedAction] = paramCollection.mock.calls[0];
    expect(askedParams.map((p: any) => p.name ?? p.field)).toEqual(
      CLONE_ACTION.params.map((p: any) => p.name ?? p.field),
    );
    expect(askedAction.name).toBe('clone_permission_set');

    // What reached the api handler IS the published declaration…
    const [action] = dispatched;
    expect(action.name).toBe('clone_permission_set');
    expect(action.type).toBe('api');
    expect(action.method).toBe('POST');
    expect(action.target).toBe('/api/v1/data/sys_permission_set');
    expect(action.objectName).toBe(SYS_PERMISSION_SET);
    expect(action.bodyExtra).toEqual({ active: true });
    expect(action.actionParams.map((p: any) => p.name ?? p.field)).toEqual(
      CLONE_ACTION.params.map((p: any) => p.name ?? p.field),
    );
    // …carrying the set's identity and the collected values.
    expect(action.params._rowRecord).toEqual(ROW);
    expect(action.params.name).toBe(CLONE_NAME);
    expect(action.params.label).toBe('My clone');
    for (const facet of CARRIED) expect(action.params[facet]).toBe(ROW[facet]);
  });

  it('the returned clone opens writable: the route hops to it, and it offers Save with no clone prompt', async () => {
    await renderRouted();
    fireEvent.click(cloneButtons()[0]);

    // The clone loads with no code layer (`codeLayerByName` names only the
    // base), so the artifact tier does not engage.
    const save = await screen.findByRole('button', { name: /^Save$/ });
    expect(save).toBeEnabled();
    expect(cloneButtons()).toHaveLength(0);
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByText(/provided by a code package/)).toBeNull();
    // The editor is on the clone, not the base: it read the clone's envelope.
    expect(clientImpl.layered.mock.calls.some((c: unknown[]) => c[1] === CLONE_NAME)).toBe(true);
  });

  it('an embedded host has no route: the clone is announced by name instead', async () => {
    await renderPlain({ embedded: true });
    fireEvent.click(cloneButtons()[0]);

    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent(new RegExp(`Cloned as ${CLONE_NAME}`));
  });

  it('a cancelled dialog runs nothing and shows no error', async () => {
    paramAnswer = null;
    await renderRouted();
    fireEvent.click(cloneButtons()[0]);

    await waitFor(() => expect(paramCollection).toHaveBeenCalledTimes(1));
    expect(apiHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
    // Still on the locked base.
    expect(cloneButtons()).toHaveLength(1);
  });

  it('⛔ no fallback clone: an object that publishes no clone action is a refusal, not a create call', async () => {
    objectDefs = [{ ...SYS_PERMISSION_SET_DEF, actions: [] }];
    await renderRouted();
    fireEvent.click(cloneButtons()[0]);

    await screen.findByText(/publishes no clone_permission_set action/);
    expect(apiHandler).not.toHaveBeenCalled();
    expect(paramCollection).not.toHaveBeenCalled();
  });

  it('⛔ no fallback clone: a set with no sys_permission_set row is a refusal naming the set', async () => {
    rows = [];
    await renderRouted();
    fireEvent.click(cloneButtons()[0]);

    await screen.findByText(new RegExp(`no sys_permission_set record named ${BASE_SET}`));
    expect(apiHandler).not.toHaveBeenCalled();
    expect(paramCollection).not.toHaveBeenCalled();
  });
});

describe('PermissionMatrixEditPage — no clone prompt where the artifact tier is not the gate (objectui#5987)', () => {
  it('an org-owned set (no code layer) is writable and shows no clone prompt', async () => {
    codeLayerByName = {};
    await renderRouted();

    expect(saveButton()).toBeInTheDocument();
    expect(cloneButtons()).toHaveLength(0);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('a published org set (the sys_metadata sentinel) is writable and shows no clone prompt', async () => {
    codeLayerByName = { [BASE_SET]: { _packageId: 'sys_metadata', name: BASE_SET } };
    await renderRouted();

    expect(saveButton()).toBeInTheDocument();
    expect(cloneButtons()).toHaveLength(0);
  });

  it('a type with no runtime write channel is locked by the TYPE tier: nothing to clone into', async () => {
    typeFlags = { allowOrgOverride: false, allowRuntimeCreate: false };
    await renderRouted();

    expect(screen.getByText(/no runtime write channel/)).toBeInTheDocument();
    expect(cloneButtons()).toHaveLength(0);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('a host-locked package (readOnly) shows the package lock, not a clone prompt', async () => {
    await renderPlain({ readOnly: true, packageId: 'com.example.showcase' });

    expect(screen.getByText('Read-only', { exact: true })).toBeInTheDocument();
    expect(cloneButtons()).toHaveLength(0);
  });
});

describe('PermissionMatrixEditPage — a save the server refuses as a packaged set shows the same guidance (objectui#5987 item 3)', () => {
  const SERVER_TEXT =
    "Metadata item 'permission/showcase_contributor' is provided by a code package and the type has not "
    + 'opted into per-org overlay writes (allowOrgOverride=false). Edit the source artifact and redeploy, '
    + 'or set OS_METADATA_WRITABLE to grant a runtime escape hatch.';

  it('403 NOT_OVERRIDABLE at the environment door: guidance names cloning, the primary action is offered, the server sentence is kept', async () => {
    // The client reads this set as writable (no code layer) — the server's
    // answer is the truth the editor must surface.
    codeLayerByName = {};
    saveImpl = async () => {
      throw Object.assign(new Error(SERVER_TEXT), { status: 403, code: 'NOT_OVERRIDABLE' });
    };
    await renderRouted();
    fireEvent.click(saveButton()!);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Save refused \(403 not_overridable\)/);
    expect(alert).toHaveTextContent(/Clone to customize instead/);
    expect(within(alert).getByRole('button', { name: CLONE_EN })).toBeEnabled();
    // The server's own sentence is kept for diagnosis, not shown alone.
    expect(within(alert).getByText(SERVER_TEXT)).toBeInTheDocument();
    // …and it is not ALSO rendered as the generic red strip.
    expect(screen.getAllByText(SERVER_TEXT)).toHaveLength(1);

    // The offered action is the same dispatch as the lock's.
    fireEvent.click(within(alert).getByRole('button', { name: CLONE_EN }));
    await waitFor(() => expect(apiHandler).toHaveBeenCalledTimes(1));
    expect(dispatched[0].name).toBe('clone_permission_set');
    expect(dispatched[0].params._rowRecord).toEqual(ROW);
  });

  it('the refusal is keyed on the CODE: the lowercase spelling an older server emits is the same refusal', async () => {
    codeLayerByName = {};
    saveImpl = async () => {
      throw Object.assign(new Error(SERVER_TEXT), { status: 403, code: 'not_overridable' });
    };
    await renderRouted();
    fireEvent.click(saveButton()!);

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('button', { name: CLONE_EN })).toBeInTheDocument();
  });

  it('control: any other refusal stays the generic strip, with no clone prompt', async () => {
    codeLayerByName = {};
    saveImpl = async () => {
      throw Object.assign(new Error('[Security] Access denied'), { status: 403, code: 'PERMISSION_DENIED' });
    };
    await renderRouted();
    fireEvent.click(saveButton()!);

    await screen.findByText('[Security] Access denied');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(cloneButtons()).toHaveLength(0);
  });

  it('control: under the package door the same code is not the artifact lock, so no clone prompt', async () => {
    codeLayerByName = {};
    saveImpl = async () => {
      throw Object.assign(new Error(SERVER_TEXT), { status: 403, code: 'NOT_OVERRIDABLE' });
    };
    await renderPlain({ packageId: 'com.example.showcase' });
    fireEvent.click(saveButton()!);

    await screen.findByText(SERVER_TEXT);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(cloneButtons()).toHaveLength(0);
  });
});
