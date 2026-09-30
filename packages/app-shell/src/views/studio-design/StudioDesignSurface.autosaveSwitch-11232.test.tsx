// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11232 — a switch to another item inside the draft autosave's
 * debounce never writes the previous item's buffer into the newly opened one.
 *
 * `useDraftAutoSave`'s timer was keyed on the dirty flag, the blocked flag and
 * the buffer's snapshot only. A switch to another flow or page changed none
 * of them, and the save the timer called was read through a ref that already
 * addressed the newly opened item, while the buffer still held the previous
 * item's document until the new load landed. With a load slower than what was
 * left of the debounce, the timer sent the previous item's whole document as
 * the new item's draft. Measured on the Automations pillar (flow
 * `notify_owner` into `nightly_digest`) and the Interfaces page inspector
 * (page `home` into `landing`).
 *
 * The hook now binds a dirty period to the item that was open when it began.
 * After a switch it sends nothing until the caller's dirty flag has fallen
 * (the new item's load installs its own buffer and clears it), and a save's
 * claim on its buffer reads moved once the item has changed. The previous
 * item's pending edit is dropped, which is what the Data pillar's switch has
 * always done, and what every pillar did whenever the new load landed inside
 * the debounce. The Data pillar is the control.
 *
 * objectui#11203 (folded in): a package switch keeps the Interfaces pillar
 * mounted, so the nav editor's dirty flag and open editing survived into the
 * next package; its load installed that package's app over the buffer and the
 * autosave sent it, unedited, as a draft. The pillar is now keyed by package:
 * a confirmed discard drops the edit and every piece of editor state with it.
 *
 * The canvases and inspectors are the REAL registered `FlowPreview` /
 * `FlowInspector` and `PagePreview` / `PageBlockInspector` /
 * `PageDefaultInspector`. The client is a server double that records every
 * save and can hold an item's load (a slow load).
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const PKG = 'com.acme.app';
const PKG_B = 'com.beta.app';

const nodes = (start: string) => [
  { id: 'start', type: 'start', label: start },
  { id: 'end', type: 'end', label: 'End' },
];
const NOTIFY = {
  name: 'notify_owner',
  label: 'Notify owner',
  type: 'autolaunched',
  status: 'active',
  nodes: nodes('Start'),
  edges: [{ id: 'e1', source: 'start', target: 'end' }],
};
const DIGEST = {
  name: 'nightly_digest',
  label: 'Nightly digest',
  type: 'autolaunched',
  status: 'active',
  nodes: nodes('Begin'),
  edges: [{ id: 'e1', source: 'start', target: 'end' }],
};

const TASK = {
  name: 'acme_task',
  label: 'Task',
  fields: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
};
const NOTE = { name: 'acme_note', label: 'Note', fields: [{ name: 'body', label: 'Body', type: 'text' }] };

const APP = {
  name: 'acme_app',
  label: 'Acme',
  navigation: [
    { id: 'nav_home', type: 'page', label: 'Home menu', pageName: 'home' },
    { id: 'nav_landing', type: 'page', label: 'Landing menu', pageName: 'landing' },
  ],
};
const BETA_APP = {
  name: 'beta_app',
  label: 'Beta',
  navigation: [{ id: 'nav_board', type: 'page', label: 'Board menu', pageName: 'board' }],
};
/** A block page: the first leaf the pillar opens, its page form in the rail. */
const HOME = {
  name: 'home',
  label: 'Home',
  type: 'app',
  regions: [{ name: 'main', components: [{ id: 'hello', type: 'element:text', properties: { content: 'Hello' } }] }],
};
const LANDING = { name: 'landing', label: 'Landing', type: 'app', regions: [{ name: 'main', components: [] }] };
const BOARD = { name: 'board', label: 'Board', type: 'app', regions: [{ name: 'main', components: [] }] };

const server = vi.hoisted(() => ({
  /** `type/name` → the row as published, and the package that owns it. */
  active: new Map<string, { pkg: string; row: Record<string, unknown> }>(),
  drafts: new Map<string, Record<string, unknown>>(),
  /** Every save, as the server received it. */
  saves: [] as Array<{ type: string; name: string; packageId: unknown; body: Record<string, unknown> }>,
  /** `type/name` → while set, that item's load waits on it (a slow load). */
  loadHold: new Map<string, Promise<void>>(),
  /** While set, the next save waits on it (a save held in flight). */
  saveHold: null as Promise<void> | null,
}));

// A server double: a save lands as the item's draft, and a later load serves it.
const mockClient = vi.hoisted(() => {
  const k = (type: string, name: string) => `${type}/${name}`;
  return {
    list: vi.fn(async (type: string, opts?: { packageId?: string }) =>
      [...server.active.entries()]
        .filter(([key, { pkg }]) => key.startsWith(`${type}/`) && (!opts?.packageId || pkg === opts.packageId))
        .map(([, { row }]) => ({ name: row.name, label: row.label ?? row.name })),
    ),
    listDrafts: vi.fn(async () => []),
    listTypes: vi.fn(async () => ({ entries: [] })),
    get: vi.fn(async () => null),
    references: vi.fn(async () => []),
    layered: vi.fn(async (type: string, name: string) => {
      const hold = server.loadHold.get(k(type, name));
      if (hold) await hold;
      const eff = server.active.get(k(type, name))?.row ?? null;
      return { code: null, overlay: eff, overlayScope: eff ? 'env' : null, effective: eff, editable: true, deletable: true, resettable: false, lock: 'none' };
    }),
    getDraft: vi.fn(async (type: string, name: string) => {
      const draft = server.drafts.get(k(type, name));
      if (draft) return { item: JSON.parse(JSON.stringify(draft)) as Record<string, unknown> };
      throw Object.assign(new Error(`No pending draft exists for ${type}/${name}.`), { code: 'NO_DRAFT', status: 404 });
    }),
    save: vi.fn(async (type: string, name: string, item: unknown, opts?: { packageId?: string }) => {
      const body = JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
      server.saves.push({ type, name, packageId: opts?.packageId, body });
      const hold = server.saveHold;
      server.saveHold = null;
      if (hold) await hold;
      server.drafts.set(k(type, name), body);
      return { type, name, item };
    }),
    publish: vi.fn(async () => ({ success: true })),
    reset: vi.fn(async () => ({})),
  };
});

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../metadata-admin/useMetadata')>();
  return { ...mod, useMetadataClient: () => mockClient, useMetadataTypes: () => ({ loading: false, error: null, entries: [] }) };
});

// The package list is the surface's write-state probe and the switcher's list:
// both packages are writable.
vi.mock('./packages-io', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./packages-io')>();
  return {
    ...mod,
    fetchPackages: vi.fn(async () => [
      { id: 'com.acme.app', name: 'Acme', writable: true, namespace: 'acme' },
      { id: 'com.beta.app', name: 'Beta', writable: true, namespace: 'beta' },
    ]),
  };
});

vi.mock('@object-ui/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@object-ui/react')>();
  return { ...mod, useAdapter: () => dataSource };
});

// The Data pillar's records grid is not what this suite reads.
vi.mock('@object-ui/plugin-view', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return { ...mod, ObjectView: () => null };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), dismiss: vi.fn() },
  Toaster: () => null,
}));

// Rail siblings / docks the whole-surface cases do not read.
vi.mock('../../components/SuggestedBindingsPanel', () => ({ SuggestedBindingsPanel: () => null }));
vi.mock('../metadata-admin/AccessExplainPanel', () => ({ AccessExplainPanel: () => null }));
vi.mock('./StudioAiCopilot', () => ({ StudioChatDock: () => null }));
vi.mock('../../preview/DraftChangesPanel', () => ({ DraftChangesPanel: () => null }));

import { AutomationsPillar, DataPillar, InterfacesPillar, StudioDesignSurface } from './StudioDesignSurface';
import { createEmptyDataSource } from './__tests__/emptyDataSource';
import { registerMetadataPreview } from '../metadata-admin/preview-registry';
import { registerMetadataInspector } from '../metadata-admin/inspector-registry';
import { registerMetadataDefaultInspector } from '../metadata-admin/default-inspector-registry';
import { FlowPreview } from '../metadata-admin/previews/FlowPreview';
import { FlowInspector } from '../metadata-admin/inspectors/FlowInspector';
import { PagePreview } from '../metadata-admin/previews/PagePreview';
import { PageBlockInspector } from '../metadata-admin/inspectors/PageBlockInspector';
import { PageDefaultInspector } from '../metadata-admin/inspectors/PageDefaultInspector';
import { readFields } from '../metadata-admin/previews/object-fields-io';

const dataSource = createEmptyDataSource();

registerMetadataPreview('flow', FlowPreview);
registerMetadataInspector('flow', FlowInspector);
registerMetadataPreview('page', PagePreview);
registerMetadataInspector('page', PageBlockInspector);
registerMetadataDefaultInspector('page', PageDefaultInspector);

// The surface's viewport hooks and Radix's floating-ui measurement need these.
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ??
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

const key = (type: string, name: string) => `${type}/${name}`;

// This environment ships no window.confirm: the surface's discard prompt.
let confirmSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  server.active.clear();
  server.drafts.clear();
  server.saves.length = 0;
  server.loadHold.clear();
  server.saveHold = null;
  for (const fn of Object.values(mockClient)) (fn as unknown as { mockClear: () => void }).mockClear();
  const seed = (pkg: string, type: string, row: Record<string, unknown>) =>
    server.active.set(key(type, String(row.name)), { pkg, row: JSON.parse(JSON.stringify(row)) });
  seed(PKG, 'flow', NOTIFY);
  seed(PKG, 'flow', DIGEST);
  seed(PKG, 'object', TASK);
  seed(PKG, 'object', NOTE);
  seed(PKG, 'app', APP);
  seed(PKG, 'page', HOME);
  seed(PKG, 'page', LANDING);
  seed(PKG_B, 'app', BETA_APP);
  seed(PKG_B, 'page', BOARD);
  confirmSpy = vi.fn();
  window.confirm = confirmSpy as unknown as typeof window.confirm;
  // The Automations pillar's `/automation/_status` probe, the flow inspector's
  // action catalog and the surface's pending-drafts counter all read the
  // global `fetch`; one double answers "absent" so each keeps its fallback.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('null', { status: 404, headers: { 'content-type': 'application/json' } })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Holds an item's load until the returned release is called. */
function holdLoad(type: string, name: string): () => Promise<void> {
  let release!: () => void;
  server.loadHold.set(key(type, name), new Promise<void>((r) => (release = r)));
  return async () => {
    await act(async () => {
      release();
      server.loadHold.delete(key(type, name));
      await new Promise((r) => setTimeout(r, 0));
    });
  };
}

/** Holds the next save in flight until the returned release is called. */
function holdNextSave(): () => Promise<void> {
  let release!: () => void;
  server.saveHold = new Promise<void>((r) => (release = r));
  return async () => {
    await act(async () => {
      release();
      await new Promise((r) => setTimeout(r, 0));
    });
  };
}

/** Waits past the autosave's debounce: what was sent by then is what will be. */
async function pastDebounce(ms = 2500): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

function savesOf(type: string, name: string): Array<Record<string, unknown>> {
  return server.saves.filter((s) => s.type === type && s.name === name).map((s) => s.body);
}

function editText(el: HTMLElement, value: string): void {
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
}

const SLOW = { timeout: 8000 };

describe('Automations pillar — a flow switch inside the debounce (objectui#11232)', () => {
  function startLabel(body: Record<string, unknown>): string {
    return String((body.nodes as Array<{ id: string; label?: string }>).find((n) => n.id === 'start')?.label);
  }
  async function openStartNode(): Promise<HTMLElement> {
    fireEvent.click(document.querySelector('[data-node-id="start"] [role="button"]') as HTMLElement);
    return within(screen.getByRole('complementary')).findByLabelText('Label', undefined, SLOW);
  }

  it('sends nothing to the newly opened flow; the edit after its load saves to it', async () => {
    render(
      <MemoryRouter initialEntries={[`/studio/${PKG}/automations`]}>
        <AutomationsPillar packageId={PKG} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(document.querySelector('[data-node-id="start"]')).toHaveTextContent('Start'), SLOW);

    editText(await openStartNode(), 'Kick-off');
    const release = holdLoad('flow', 'nightly_digest');
    fireEvent.click(screen.getByRole('button', { name: /Nightly digest/ }));
    await pastDebounce();

    // Nothing is written to the flow the author only opened, and the previous
    // flow's pending edit is dropped with the switch, as the Data pillar's is.
    expect(savesOf('flow', 'nightly_digest')).toEqual([]);
    expect(server.saves).toEqual([]);

    await release();
    await waitFor(() => expect(document.querySelector('[data-node-id="start"]')).toHaveTextContent('Begin'), SLOW);
    await pastDebounce(1800);
    expect(server.saves).toEqual([]);

    // The control: an edit after the switch saves normally, to its own flow.
    editText(await openStartNode(), 'Go');
    await waitFor(() => expect(server.saves).toHaveLength(1), SLOW);
    expect(savesOf('flow', 'nightly_digest').map((b) => [b.label, startLabel(b)])).toEqual([['Nightly digest', 'Go']]);
  }, 30000);
});

describe('Interfaces page inspector — a page switch inside the debounce (objectui#11232)', () => {
  const pageLabel = () => within(screen.getByRole('complementary')).findByLabelText(/^Label/, undefined, SLOW);

  it('sends nothing to the newly opened page; the edit after its load saves to it', async () => {
    render(
      <MemoryRouter initialEntries={[`/studio/${PKG}/interfaces`]}>
        <InterfacesPillar packageId={PKG} />
      </MemoryRouter>,
    );
    await screen.findByRole('button', { name: 'Select hello' }, SLOW);

    editText(await pageLabel(), 'Welcome');
    const release = holdLoad('page', 'landing');
    fireEvent.click(screen.getByRole('button', { name: /Landing menu/ }));
    await pastDebounce();

    expect(savesOf('page', 'landing')).toEqual([]);
    expect(server.saves).toEqual([]);

    await release();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Select hello' })).toBeNull(), SLOW);
    await waitFor(async () => expect(await pageLabel()).toHaveValue('Landing'), SLOW);
    await pastDebounce(1800);
    expect(server.saves).toEqual([]);

    // The control: an edit after the switch saves normally, to its own page.
    editText(await pageLabel(), 'Landing two');
    await waitFor(() => expect(server.saves).toHaveLength(1), SLOW);
    expect(savesOf('page', 'landing').map((b) => [b.label, b.regions])).toEqual([['Landing two', LANDING.regions]]);
  }, 30000);
});

describe('Interfaces page inspector — a save in flight across a page switch (objectui#11232)', () => {
  const pageLabel = () => within(screen.getByRole('complementary')).findByLabelText(/^Label/, undefined, SLOW);

  it("the save lands on its own page, and its claim does not clear the page opened since", async () => {
    render(
      <MemoryRouter initialEntries={[`/studio/${PKG}/interfaces`]}>
        <InterfacesPillar packageId={PKG} />
      </MemoryRouter>,
    );
    await screen.findByRole('button', { name: 'Select hello' }, SLOW);

    const releaseSave = holdNextSave();
    editText(await pageLabel(), 'Welcome');
    await screen.findByTestId('if-autosaving', undefined, SLOW);
    const releaseLoad = holdLoad('page', 'landing');
    fireEvent.click(screen.getByRole('button', { name: /Landing menu/ }));
    // The save of `home` lands while `landing` is still loading.
    await releaseSave();
    // The rail still holds `home`'s document; an edit typed there is not
    // `landing`'s, and the dirty period that `home`'s save left standing
    // keeps it from being sent there.
    editText(await pageLabel(), 'Typed during load');
    await pastDebounce();
    expect(server.saves.map((s) => [s.type, s.name, s.body.label])).toEqual([['page', 'home', 'Welcome']]);

    await releaseLoad();
    await waitFor(async () => expect(await pageLabel()).toHaveValue('Landing'), SLOW);
    await pastDebounce(1800);
    expect(server.saves.map((s) => [s.type, s.name, s.body.label])).toEqual([['page', 'home', 'Welcome']]);
  }, 30000);
});

describe('Data pillar — an object switch inside the debounce, the control (objectui#11232)', () => {
  it('sends nothing to the newly opened object, as it always has', async () => {
    render(
      <MemoryRouter initialEntries={[`/studio/${PKG}/data`]}>
        <DataPillar packageId={PKG} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/^\d+ fields$/)).toHaveTextContent('2 fields'), SLOW);

    fireEvent.click(screen.getByTitle(/^Add a field/));
    const release = holdLoad('object', 'acme_note');
    fireEvent.click(screen.getByRole('button', { name: /Note/ }));
    await pastDebounce();

    expect(savesOf('object', 'acme_note')).toEqual([]);
    expect(server.saves).toEqual([]);

    await release();
    await waitFor(() => expect(screen.getByText(/^\d+ fields$/)).toHaveTextContent('1 fields'), SLOW);
    await pastDebounce(1800);
    expect(server.saves).toEqual([]);
    // The control's own control: an edit on the opened object saves to it.
    fireEvent.click(screen.getByTitle(/^Add a field/));
    await waitFor(() => expect(server.saves).toHaveLength(1), SLOW);
    expect(savesOf('object', 'acme_note').map((b) => readFields(b.fields).entries.map((e) => e.name))).toEqual([
      ['body', 'field_2'],
    ]);
  }, 30000);
});

describe('Studio surface — a package switch over an unsaved nav edit (objectui#11203, folded in)', () => {
  function surfaceTree() {
    return (
      <MemoryRouter initialEntries={[`/studio/${PKG}/interfaces`]}>
        <Routes>
          <Route path="/studio/:packageId/:tab" element={<StudioDesignSurface />} />
        </Routes>
      </MemoryRouter>
    );
  }
  const railText = () => document.body.textContent ?? '';
  const addedItems = () => railText().match(/nav_item_\d+/g)?.length ?? 0;
  const navEditingOpen = () => screen.queryAllByRole('button', { name: /Add nav item/ }).length > 0;
  async function openEditing(): Promise<void> {
    fireEvent.click(screen.getByTitle(/^Edit navigation/));
    await screen.findByRole('button', { name: /Add nav item/ }, SLOW);
  }
  const addItem = () => fireEvent.click(screen.getByRole('button', { name: /Add nav item/ }));
  async function switchTo(name: RegExp, confirmed: boolean): Promise<void> {
    fireEvent.click(await screen.findByTitle('Switch / create package', undefined, SLOW));
    confirmSpy.mockReturnValueOnce(confirmed);
    fireEvent.click(await screen.findByRole('button', { name }, SLOW));
  }
  const savedNav = (body: Record<string, unknown>) =>
    (body.navigation as Array<Record<string, unknown>>).map((n) =>
      Object.prototype.hasOwnProperty.call(n, 'label') ? String(n.label) : { id: n.id },
    );

  it('a confirmed discard sends nothing to the new package; an edit after the switch saves normally', async () => {
    render(surfaceTree());
    await screen.findByRole('button', { name: /Landing menu/ }, SLOW);
    await openEditing();
    addItem();
    expect(addedItems()).toBe(1);

    await switchTo(/Beta/, true);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    await screen.findByRole('button', { name: /Board menu/ }, SLOW);
    await pastDebounce(3500);

    expect(server.saves.filter((s) => s.type === 'app')).toEqual([]);
    // The discarded edit went with the package: editing is closed and nothing is held.
    expect(navEditingOpen()).toBe(false);
    expect(addedItems()).toBe(0);

    // The control: an edit made after the switch saves normally, to the new package's app.
    await openEditing();
    addItem();
    await waitFor(() => expect(server.saves.filter((s) => s.type === 'app')).toHaveLength(1), SLOW);
    expect(server.saves.map((s) => [s.type, s.name, s.packageId])).toEqual([['app', 'beta_app', PKG_B]]);
    expect(savedNav(server.saves[0].body)).toEqual(['Board menu', { id: 'nav_item_2' }]);
  }, 30000);

  it("a confirmed discard with the new package's app slow to load sends nothing either", async () => {
    render(surfaceTree());
    await screen.findByRole('button', { name: /Landing menu/ }, SLOW);
    await openEditing();
    addItem();

    const release = holdLoad('app', 'beta_app');
    await switchTo(/Beta/, true);
    await pastDebounce();
    expect(server.saves).toEqual([]);

    await release();
    await screen.findByRole('button', { name: /Board menu/ }, SLOW);
    await pastDebounce(3500);
    expect(server.saves).toEqual([]);
  }, 30000);

  it("the page inspector: a package switch opens the new package's page, and an edit saves to it", async () => {
    render(surfaceTree());
    await screen.findByRole('button', { name: 'Select hello' }, SLOW);

    // No nav edit, so no prompt: page edits are not what the guard holds.
    await switchTo(/Beta/, true);
    expect(confirmSpy).not.toHaveBeenCalled();
    await screen.findByRole('button', { name: /Board menu/ }, SLOW);
    // The previous package's page does not stay open on the new package.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Select hello' })).toBeNull(), SLOW);

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Properties/ }));
    const label = await screen.findByLabelText(/^Label/, undefined, SLOW);
    expect(label).toHaveValue('Board');
    editText(label, 'Board two');
    await waitFor(() => expect(server.saves).toHaveLength(1), SLOW);
    expect(server.saves.map((s) => [s.type, s.name, s.packageId, s.body.label])).toEqual([
      ['page', 'board', PKG_B, 'Board two'],
    ]);
  }, 30000);

  it('a cancelled discard keeps package A and its edit, which then saves to A', async () => {
    render(surfaceTree());
    await screen.findByRole('button', { name: /Landing menu/ }, SLOW);
    await openEditing();
    addItem();

    await switchTo(/Beta/, false);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Switch / create package')).toHaveTextContent('Acme');
    expect(addedItems()).toBe(1);

    await waitFor(() => expect(server.saves).toHaveLength(1), SLOW);
    expect(server.saves.map((s) => [s.type, s.name, s.packageId])).toEqual([['app', 'acme_app', PKG]]);
    expect(savedNav(server.saves[0].body)).toEqual(['Home menu', 'Landing menu', { id: 'nav_item_3' }]);
  }, 30000);
});
