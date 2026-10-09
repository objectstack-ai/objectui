// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11773 — two editors of one object in Studio's Data pillar no longer
 * overwrite each other's draft in silence.
 *
 * The defect, as filed: tab A saved a field, tab B (opened earlier) saved its
 * stale copy, and the server draft lost A's field with no 409, banner or toast,
 * because no draft save sent the version it was built on.
 *
 * The server double answers the way the `/meta` draft door of
 * `@objectstack/*` 17.7.0 was measured to (readings on the pull request): a
 * draft save returns its `version`; an `If-Match` that is not the current
 * draft's version is `409 METADATA_CONFLICT`; a save with no `If-Match` is
 * last-writer-wins; the draft READ serves no version. Its refusal is parsed by
 * the REAL `MetadataClient`, so the error the pillar catches is production's.
 *
 * Every editor below has saved at least once before the race. The FIRST save
 * after a load has no version to send — the draft read serves none on 17.7.0 —
 * which is the half of the card this suite cannot pin and the pull request
 * names as the server's.
 *
 * The two editors are two mounted `DataPillar`s over one server double: each
 * pillar holds its own buffer and its own version, exactly as two tabs do.
 * The records grid is a double that hands the pillar a column order through
 * the grid's own authoring context (the drag mechanics are the data table's).
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetadataClient, type MetadataError } from '@object-ui/data-objectstack';

const PKG = 'com.acme.app';

const OBJECT = {
  name: 'acme_task',
  label: 'Task',
  fields: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
};

interface SaveCall {
  type: string;
  name: string;
  body: Record<string, unknown>;
  ifMatch: string | undefined;
}

const server = vi.hoisted(() => ({
  active: new Map<string, Record<string, unknown>>(),
  drafts: new Map<string, { body: Record<string, unknown>; version: string }>(),
  saves: [] as SaveCall[],
  seq: 0,
}));

/**
 * The 409 the door answers, run through the real client's error parser. The
 * prose is the door's own; nothing in the guard reads it.
 */
async function conflictRefusal(type: string, name: string, head: string | null): Promise<MetadataError> {
  const client = new MetadataClient({
    baseUrl: 'http://localhost:3000',
    fetch: (async () =>
      new Response(
        JSON.stringify({
          error: `${type}/${name} has been modified since you loaded it. The version token sent is not the current version (current is ${head}).`,
          code: 'METADATA_CONFLICT',
        }),
        { status: 409, headers: { 'content-type': 'application/json' } },
      )) as unknown as typeof fetch,
  });
  return client.save(type, name, {}, { mode: 'draft' }).then(
    () => {
      throw new Error('the stub door accepted the save');
    },
    (e: unknown) => e as MetadataError,
  );
}

const mockClient = vi.hoisted(() => {
  const k = (type: string, name: string) => `${type}/${name}`;
  return {
    list: vi.fn(async (type: string) =>
      [...server.active.entries()]
        .filter(([key]) => key.startsWith(`${type}/`))
        .map(([, row]) => ({ name: row.name, label: row.label ?? row.name })),
    ),
    listDrafts: vi.fn(async () => []),
    listTypes: vi.fn(async () => ({ entries: [] })),
    get: vi.fn(async () => null),
    references: vi.fn(async () => []),
    layered: vi.fn(async (type: string, name: string) => {
      const eff = server.active.get(k(type, name)) ?? null;
      return { code: null, overlay: eff, overlayScope: eff ? 'env' : null, effective: eff, editable: true, deletable: true, resettable: false, lock: 'none' };
    }),
    // The draft read serves the body and NO version (measured on 17.7.0).
    getDraft: vi.fn(async (type: string, name: string) => {
      const draft = server.drafts.get(k(type, name));
      if (draft) return { type, name, item: JSON.parse(JSON.stringify(draft.body)) as Record<string, unknown> };
      throw Object.assign(new Error(`No pending draft exists for ${type}/${name}.`), { code: 'NO_DRAFT', status: 404 });
    }),
    save: vi.fn(async (type: string, name: string, item: unknown, options?: { ifMatch?: string }) => {
      const body = JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
      const ifMatch = options?.ifMatch;
      server.saves.push({ type, name, body, ifMatch });
      const head = server.drafts.get(k(type, name))?.version ?? null;
      if (ifMatch !== undefined && ifMatch !== head) throw await conflictRefusal(type, name, head);
      server.seq += 1;
      const version = `hmac-sha256:v${server.seq}`;
      server.drafts.set(k(type, name), { body, version });
      return { success: true, version, seq: server.seq, state: 'draft', message: `Saved ${type} '${name}' [seq=${server.seq}]` };
    }),
    publish: vi.fn(async () => ({ success: true })),
    reset: vi.fn(async () => ({})),
  };
});

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../metadata-admin/useMetadata')>();
  return { ...mod, useMetadataClient: () => mockClient, useMetadataTypes: () => ({ entries: [] }) };
});

vi.mock('./packages-io', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./packages-io')>();
  return { ...mod, fetchPackages: vi.fn(async () => []) };
});

vi.mock('@object-ui/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@object-ui/react')>();
  return { ...mod, useAdapter: () => dataSource };
});

// The records grid: a double that reverses the columns it was handed through
// the grid's authoring context, the way a header drag reorders them.
vi.mock('@object-ui/plugin-view', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  const { useGridFieldAuthoring } = await import('@object-ui/components');
  function GridDouble({ schema }: { schema?: { table?: { fields?: string[] } } }) {
    const authoring = useGridFieldAuthoring();
    const cols = schema?.table?.fields ?? [];
    return (
      <button type="button" onClick={() => authoring?.onReorderFields?.([...cols].reverse())}>
        Reverse columns
      </button>
    );
  }
  return { ...mod, ObjectView: GridDouble };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), dismiss: vi.fn() } }));

import { DataPillar } from './StudioDesignSurface';
import { createEmptyDataSource } from './__tests__/emptyDataSource';
import { readFields } from '../metadata-admin/previews/object-fields-io';

const dataSource = createEmptyDataSource();

beforeEach(() => {
  server.active.clear();
  server.drafts.clear();
  server.saves.length = 0;
  server.seq = 0;
  for (const fn of Object.values(mockClient)) (fn as unknown as { mockClear: () => void }).mockClear();
  server.active.set(`object/${OBJECT.name}`, JSON.parse(JSON.stringify(OBJECT)));
});

afterEach(cleanup);

/** One editor: a mounted Data pillar, as one browser tab holds it. */
function openEditor(): HTMLElement {
  const { container } = render(
    <MemoryRouter initialEntries={[`/studio/${PKG}/data`]}>
      <DataPillar packageId={PKG} />
    </MemoryRouter>,
  );
  return container;
}

const fieldNames = (body: Record<string, unknown>) => readFields(body.fields).entries.map((e) => e.name);
const fieldCount = (editor: HTMLElement) => within(editor).getByText(/^\d+ fields$/).textContent;
const serverDraftFields = () => fieldNames(server.drafts.get(`object/${OBJECT.name}`)!.body);

async function loaded(editor: HTMLElement, count: string): Promise<void> {
  await waitFor(() => expect(fieldCount(editor)).toBe(count), { timeout: 8000 });
}

/** Add a field and wait until the autosave carrying it has landed. */
async function addFieldAndSave(editor: HTMLElement): Promise<void> {
  const before = server.saves.length;
  fireEvent.click(within(editor).getByTitle(/^Add a field/));
  await waitFor(() => expect(server.saves.length).toBe(before + 1), { timeout: 8000 });
  await waitFor(() => expect(within(editor).queryByTestId('data-autosaving')).toBeNull(), { timeout: 8000 });
}

/** Reverse the grid's columns (a save the pillar sends itself) and wait for it. */
async function reorderAndSave(editor: HTMLElement): Promise<void> {
  const before = server.saves.length;
  fireEvent.click(await within(editor).findByRole('button', { name: 'Reverse columns' }, { timeout: 8000 }));
  await waitFor(() => expect(server.saves.length).toBe(before + 1), { timeout: 8000 });
  await waitFor(() => expect(within(editor).queryByTestId('data-autosaving')).toBeNull(), { timeout: 8000 });
}

/**
 * The race, with both editors past their first save: A saves, B opens on A's
 * draft and saves its own change, then A — still holding the copy it saved —
 * edits again.
 */
async function raceTwoEditors(): Promise<{ a: HTMLElement; b: HTMLElement }> {
  const a = openEditor();
  await loaded(a, '2 fields');
  await addFieldAndSave(a); // A: + field_3
  const b = openEditor();
  await loaded(b, '3 fields');
  await reorderAndSave(b); // B: status before title
  expect(serverDraftFields()).toEqual(['status', 'title', 'field_3']);
  fireEvent.click(within(a).getByTitle(/^Add a field/)); // A's stale copy + field_4
  await screen.findByTestId('draft-conflict-dialog', undefined, { timeout: 8000 });
  return { a, b };
}

describe('Data pillar — a draft saved elsewhere is not overwritten in silence (objectui#11773)', () => {
  it('one editor: every autosave after the first sends the version the one before it received', async () => {
    const a = openEditor();
    await loaded(a, '2 fields');
    await addFieldAndSave(a);
    await addFieldAndSave(a);
    await reorderAndSave(a);
    expect(server.saves.map((s) => s.ifMatch)).toEqual([undefined, 'hmac-sha256:v1', 'hmac-sha256:v2']);
    expect(screen.queryByTestId('draft-conflict-dialog')).toBeNull();
  });

  it('two editors: the stale save is refused with the conflict dialog, and the other editor\'s change survives', async () => {
    const { a } = await raceTwoEditors();
    const refused = server.saves[server.saves.length - 1]!;
    expect(refused.ifMatch).toBe('hmac-sha256:v1');
    expect(fieldNames(refused.body)).toEqual(['title', 'status', 'field_3', 'field_4']);
    // Nothing was written over B's draft.
    expect(serverDraftFields()).toEqual(['status', 'title', 'field_3']);
    expect(screen.getByTestId('draft-conflict-dialog')).toHaveTextContent('acme_task');

    fireEvent.click(screen.getByTestId('draft-conflict-cancel'));
    await waitFor(() => expect(screen.queryByTestId('draft-conflict-dialog')).toBeNull(), { timeout: 8000 });
    // Keep editing: A's edit stays on screen, unsaved, and the refusal says so.
    expect(fieldCount(a)).toBe('4 fields');
    expect(within(a).getByText(/^Not saved:/)).toBeInTheDocument();
    expect(serverDraftFields()).toEqual(['status', 'title', 'field_3']);
  });

  it('"reload" replaces the stale buffer with the saved draft, and the next save is unpinned', async () => {
    const { a } = await raceTwoEditors();
    const savesBefore = server.saves.length;
    fireEvent.click(screen.getByTestId('draft-conflict-reload'));
    await waitFor(() => expect(screen.queryByTestId('draft-conflict-dialog')).toBeNull(), { timeout: 8000 });
    await loaded(a, '3 fields');
    expect(server.saves.length).toBe(savesBefore);

    await addFieldAndSave(a);
    const next = server.saves[server.saves.length - 1]!;
    expect(next.ifMatch).toBeUndefined();
    // Built on B's draft: B's column order is kept.
    expect(fieldNames(next.body)).toEqual(['status', 'title', 'field_3', 'field_4']);
  });

  it('"overwrite" asks again, then re-sends without If-Match and wins; the next save is pinned to it', async () => {
    const { a } = await raceTwoEditors();
    fireEvent.click(screen.getByTestId('draft-conflict-overwrite'));
    // The second, explicit confirmation — nothing is sent until it is given.
    const savesBefore = server.saves.length;
    expect(await screen.findByTestId('draft-conflict-overwrite-confirm')).toBeInTheDocument();
    expect(server.saves.length).toBe(savesBefore);
    await act(async () => {
      fireEvent.click(screen.getByTestId('draft-conflict-overwrite-confirm'));
    });
    await waitFor(() => expect(server.saves.length).toBe(savesBefore + 1), { timeout: 8000 });
    const overwrite = server.saves[server.saves.length - 1]!;
    expect(overwrite.ifMatch).toBeUndefined();
    expect(serverDraftFields()).toEqual(['title', 'status', 'field_3', 'field_4']);
    await waitFor(() => expect(within(a).queryByTestId('data-autosaving')).toBeNull(), { timeout: 8000 });

    await addFieldAndSave(a);
    expect(server.saves[server.saves.length - 1]!.ifMatch).toBe(`hmac-sha256:v${server.seq - 1}`);
  });
});

describe('Data pillar — a create sends no If-Match (objectui#11773)', () => {
  it('the new object\'s skeleton is sent unpinned; its first edit after the load is unpinned, the next is pinned', async () => {
    server.active.clear();
    const a = openEditor();
    fireEvent.click(await within(a).findByTestId('empty-state-new-object', undefined, { timeout: 8000 }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(dialog.querySelectorAll('input')[0]!, { target: { value: 'Ticket' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save as draft/i }));
    await waitFor(() => expect(server.saves).toHaveLength(1), { timeout: 8000 });
    expect(server.saves[0]!.ifMatch).toBeUndefined();

    await loaded(a, '1 fields');
    await addFieldAndSave(a);
    await addFieldAndSave(a);
    expect(server.saves.map((s) => s.ifMatch)).toEqual([undefined, undefined, 'hmac-sha256:v2']);
  });
});
