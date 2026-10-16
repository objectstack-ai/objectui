/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12529: the record header's system entries (Edit, favorites, Share,
 * Delete) declare icons through the same `icon` key the app's actions use, so
 * the `⋯` menu draws one kind of row; Delete is last, behind a separator; and
 * when the app's own actions fill the header row, so Edit folds into the `⋯`,
 * an icon-only Edit button stays beside the `⋯` and opens the same edit
 * session the folded `Edit` entry opens.
 *
 * CONTROL: with room in the row, Edit is today's labelled button and no icon
 * button is drawn.
 *
 * Harness: the `RecordDetailView.favoritesEntry-12427` mount (the real record
 * page under a real `I18nProvider`, a metadata context and the real
 * `FavoritesProvider`), so every system entry is present.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: null, activeOrganization: null }),
  createAuthenticatedFetch: () => vi.fn(),
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRecordPresence: () => [],
  PresenceAvatars: () => null,
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('./ActionParamDialog', () => ({ ActionParamDialog: () => null }));
vi.mock('./ActionResultDialog', () => ({ ActionResultDialog: () => null }));
vi.mock('./FlowRunner', () => ({ FlowRunner: () => null }));
vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));

import { I18nProvider } from '@object-ui/i18n';
import { MetadataCtx } from '@object-ui/react';
import { RecordDetailView } from './RecordDetailView';
import { FavoritesProvider } from '../context/FavoritesProvider';

const OBJECT_NAME = 'crm_lead';
const RECORD_ID = 'rec-lead-1';
const RECORD_PATH = `/apps/crm/${OBJECT_NAME}/record/${RECORD_ID}`;

const appAction = (name: string, label: string) => ({
  name,
  label,
  type: 'url',
  target: `https://example.com/${name}`,
  locations: ['record_header'],
});

function objectsWith(actions: unknown[]) {
  return [
    {
      name: OBJECT_NAME,
      label: 'Lead',
      // The permissive bucket: edit + delete both default open.
      managedBy: 'platform',
      fields: {
        id: { type: 'text', label: 'Id' },
        name: { type: 'text', label: 'Name' },
      },
      actions,
    },
  ];
}

/** Three app actions: exactly the header's three inline slots. */
const FULL_ROW = [
  appAction('convert_lead', 'Convert Lead'),
  appAction('schedule_follow_up', 'Schedule Follow-up'),
  appAction('log_call', 'Log a Call'),
];

async function mountRecordPage(actions: unknown[]) {
  const objects = objectsWith(actions);
  const metadata = {
    objects,
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => [],
    getItem: async () => null,
    getItemsByType: () => [],
  } as any;
  const dataSource = {
    find: vi.fn(async () => ({ data: [] })),
    findOne: vi.fn(async () => ({ id: RECORD_ID, name: 'Ada Lovelace' })),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
  const onEdit = vi.fn();
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <MetadataCtx.Provider value={metadata}>
        <FavoritesProvider>
          <MemoryRouter initialEntries={[RECORD_PATH]}>
            <Routes>
              <Route
                path="/apps/:appName/:objectName/record/:recordId"
                element={<RecordDetailView dataSource={dataSource} objects={objects} onEdit={onEdit} />}
              />
            </Routes>
          </MemoryRouter>
        </FavoritesProvider>
      </MetadataCtx.Provider>
    </I18nProvider>,
  );
  await waitFor(() => expect(dataSource.findOne).toHaveBeenCalled());
  await waitFor(() => expect(document.querySelector('[role="toolbar"]')).toBeTruthy());
  return { onEdit };
}

function toolbar(): HTMLElement {
  return document.querySelector('[role="toolbar"]') as HTMLElement;
}

async function openOverflow(): Promise<HTMLElement> {
  const trigger = screen.getByRole('button', { name: 'More actions' });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument());
  return screen.getByRole('menu');
}

const text = (el: Element) => (el.textContent ?? '').trim();

/** The menu's rows and separators, in document order. */
function menuRows(menu: HTMLElement): string[] {
  return Array.from(menu.querySelectorAll('[role="menuitem"], [role="separator"]')).map((el) =>
    el.getAttribute('role') === 'separator' ? '---' : text(el),
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('record header ⋯ menu: iconed system entries, Delete set apart, an Edit icon button when the row is full (objectui#12529)', () => {
  it('each of the four system entries carries its icon', async () => {
    await mountRecordPage(FULL_ROW);
    const menu = await openOverflow();
    const expected: Record<string, string> = {
      Edit: 'lucide-pencil',
      'Add to favorites': 'lucide-star',
      Share: 'lucide-share',
      Delete: 'lucide-trash',
    };
    for (const [label, iconClass] of Object.entries(expected)) {
      const item = Array.from(menu.querySelectorAll('[role="menuitem"]')).find((el) => text(el) === label);
      expect(item, label).toBeTruthy();
      await waitFor(() => expect(item!.querySelector(`svg.${iconClass}`), label).not.toBeNull());
    }
  });

  it('Edit leads the system group, and Delete is last, after a separator', async () => {
    await mountRecordPage(FULL_ROW);
    const menu = await openOverflow();
    expect(menuRows(menu)).toEqual(['Edit', 'Add to favorites', 'Share', '---', 'Delete']);
  });

  it('with three app actions in the header, an icon-only Edit button sits beside the ⋯ and opens the session the folded Edit entry opens', async () => {
    const { onEdit } = await mountRecordPage(FULL_ROW);
    const bar = toolbar();
    const buttons = Array.from(bar.querySelectorAll(':scope > button, :scope > span > button'));
    const names = buttons.map((b) => b.getAttribute('aria-label') ?? text(b));
    expect(names).toEqual(['Convert Lead', 'Schedule Follow-up', 'Log a Call', 'Edit', 'More actions']);

    const editIcon = screen.getByRole('button', { name: 'Edit' });
    // Icon-only: no visible text, the pencil is all it draws.
    expect(text(editIcon)).toBe('');
    await waitFor(() => expect(editIcon.querySelector('svg.lucide-pencil')).not.toBeNull());

    fireEvent.click(editIcon);
    expect(onEdit).toHaveBeenCalledTimes(1);
    const fromIcon = onEdit.mock.calls[0];

    await openOverflow();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(2);
    expect(onEdit.mock.calls[1]).toEqual(fromIcon);
  });

  it('CONTROL: with room in the row, Edit is the labelled button it was and no icon button is drawn', async () => {
    await mountRecordPage([appAction('convert_lead', 'Convert Lead')]);
    const bar = toolbar();
    const edit = screen.getByRole('button', { name: 'Edit' });
    expect(text(edit)).toBe('Edit');
    expect(bar.querySelector('[data-folded-header-action]')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);

    // The ⋯ then holds only the menu-pinned system entries.
    const menu = await openOverflow();
    expect(menuRows(menu)).toEqual(['Add to favorites', 'Share', '---', 'Delete']);
  });
});
