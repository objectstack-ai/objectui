/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11001 — the record page's Delete asks through the console's own
 * confirm dialog, never the browser's native `window.confirm`.
 *
 * The header's `sys_delete` overflow item used to call `window.confirm(msg)`.
 * The list view's delete asks the same kind of question through the in-app
 * `ActionConfirmDialog` (the action runner hands its question to the confirm
 * handler, which opens that dialog), and so does every other destructive
 * action in the console. The native box cannot be themed, and headless
 * automation dismisses it, so the button reads as dead in any test that does
 * not register a dialog handler.
 *
 * ## What makes these pins discriminating
 *
 * - `ActionConfirmDialog` is the REAL component here, not a double: the
 *   subject is that the dialog a user sees opens, so the assertions read the
 *   rendered `alertdialog` and press its own buttons.
 * - `window.confirm` is installed as a spy that ANSWERS YES. Against the
 *   native-box code that answer deletes at once with no dialog, so "the dialog
 *   is open and nothing is deleted yet" is red there, not vacuously green.
 * - The strings are read from the `en` pack by KEY, not written out: the pin
 *   is that the dialog carries the page's own `detail.deleteConfirmation`
 *   question and the dialog's default `actionConfirm.*` buttons (the same
 *   ones the list view's delete shows), not what those keys say today.
 * - Cancel is judged on three observables — no delete call, no success toast,
 *   and the router location unchanged — because "nothing happened" is also
 *   what a click that never reached the handler looks like; the confirm case
 *   beside it, on the same mount shape, is what shows the click does reach it.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { builtInLocales } from '@object-ui/i18n/locales';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada', image: null }, activeOrganization: null }),
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

// Orthogonal chrome. `ActionConfirmDialog` is deliberately NOT doubled — it is
// the subject.
vi.mock('./ActionParamDialog', () => ({ ActionParamDialog: () => null }));
vi.mock('./ActionResultDialog', () => ({ ActionResultDialog: () => null }));
vi.mock('./FlowRunner', () => ({ FlowRunner: () => null }));
vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));

import { toast } from 'sonner';
import { I18nProvider } from '@object-ui/i18n';
import { MetadataCtx } from '@object-ui/react';
import { RecordDetailView } from './RecordDetailView';

const OBJECT_NAME = 'crm_call';
const RECORD_ID = 'rec-call-1';
const START_PATH = `/apps/crm/${OBJECT_NAME}/${RECORD_ID}`;

/** The `en` pack, read by key — see the header on why nothing is written out. */
const EN = builtInLocales.en as unknown as {
  detail: { delete: string; deleteConfirmation: string };
  actionConfirm: { confirm: string; cancel: string };
};

const OBJECTS = [
  {
    name: OBJECT_NAME,
    label: 'Call',
    // The permissive bucket: edit + delete both default open, so the header
    // offers Delete without any further declaration.
    managedBy: 'platform',
    fields: {
      id: { type: 'text', label: 'Id' },
      name: { type: 'text', label: 'Name' },
    },
  },
];

const METADATA = {
  objects: OBJECTS,
  pages: [],
  loading: false,
  error: null,
  refresh: async () => {},
  invalidate: () => {},
  ensureType: async () => [],
  getItem: async () => null,
  getItemsByType: () => [],
} as any;

function makeDataSource() {
  return {
    find: vi.fn(async () => ({ data: [] })),
    findOne: vi.fn(async () => ({ id: RECORD_ID, name: 'Intro call' })),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
}

/** Where the router is — the observable for "the page was left alone". */
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="router-location">{location.pathname}</output>;
}

function currentPath(): string {
  return screen.getByTestId('router-location').textContent ?? '';
}

/** Mount the real record page and wait for its header toolbar. */
async function mountRecordPage() {
  const dataSource = makeDataSource();
  // Under a real `I18nProvider` in `en`, as the console mounts it: the dialog's
  // own title and buttons are pack keys with no inline default, so without a
  // provider they would render as the bare key names.
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <MemoryRouter initialEntries={[START_PATH]}>
        <MetadataCtx.Provider value={METADATA}>
          <RecordDetailView
            dataSource={dataSource}
            objects={OBJECTS}
            onEdit={() => {}}
            objectNameOverride={OBJECT_NAME}
            recordIdOverride={RECORD_ID}
          />
        </MetadataCtx.Provider>
        <LocationProbe />
      </MemoryRouter>
    </I18nProvider>,
  );
  await waitFor(() => expect(dataSource.findOne).toHaveBeenCalled());
  await waitFor(() => expect(document.querySelector('[role="toolbar"]')).toBeTruthy());
  return dataSource;
}

/** Open the header's overflow and choose Delete — the user's path to it. */
async function chooseHeaderDelete() {
  const trigger = screen.getByRole('button', { name: /more actions/i });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument());
  const item = screen
    .getAllByRole('menuitem')
    .find((el) => (el.textContent ?? '').trim() === EN.detail.delete);
  expect(item).toBeTruthy();
  fireEvent.click(item!);
}

let nativeConfirm: ReturnType<typeof vi.fn>;
/** The window's own `confirm` slot as it was, so the file hands it back. */
let ownConfirmBefore: PropertyDescriptor | undefined;

beforeEach(() => {
  cleanup();
  // A spy that answers YES: the native-box code would delete on the spot.
  ownConfirmBefore = Object.getOwnPropertyDescriptor(window, 'confirm');
  nativeConfirm = vi.fn(() => true);
  Object.defineProperty(window, 'confirm', { value: nativeConfirm, configurable: true, writable: true });
  // Unrelated chrome (approvals, favourites, the record-explain probe) reaches
  // for the platform API; answer locally so the record read is the only
  // asynchrony before the header renders.
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
  if (ownConfirmBefore) Object.defineProperty(window, 'confirm', ownConfirmBefore);
  else Reflect.deleteProperty(window, 'confirm');
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('record page Delete asks through the in-app confirm dialog (objectui#11001)', () => {
  it('opens the in-app dialog with the record page question, never the native box', async () => {
    const dataSource = await mountRecordPage();
    await chooseHeaderDelete();

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(EN.detail.deleteConfirmation)).toBeInTheDocument();
    // The list view's delete shows the dialog's default buttons; so does this.
    expect(within(dialog).getByRole('button', { name: EN.actionConfirm.confirm })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: EN.actionConfirm.cancel })).toBeInTheDocument();

    expect(nativeConfirm).not.toHaveBeenCalled();
    // Nothing is deleted while the question is still open.
    expect(dataSource.delete).not.toHaveBeenCalled();
    expect(currentPath()).toBe(START_PATH);
  });

  it('confirming in the dialog runs the existing delete path', async () => {
    const dataSource = await mountRecordPage();
    await chooseHeaderDelete();

    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: EN.actionConfirm.confirm }));

    await waitFor(() => expect(dataSource.delete).toHaveBeenCalledTimes(1));
    expect(dataSource.delete).toHaveBeenCalledWith(OBJECT_NAME, RECORD_ID);
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    // …and leaves the deleted record's page for the object's list.
    await waitFor(() => expect(currentPath()).toBe(`/${OBJECT_NAME}`));
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it('cancelling in the dialog deletes nothing and leaves the record page where it was', async () => {
    const dataSource = await mountRecordPage();
    await chooseHeaderDelete();

    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: EN.actionConfirm.cancel }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    // Let any continuation the cancel could have scheduled run before judging.
    await act(async () => {
      await Promise.resolve();
    });
    expect(dataSource.delete).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(currentPath()).toBe(START_PATH);
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});
