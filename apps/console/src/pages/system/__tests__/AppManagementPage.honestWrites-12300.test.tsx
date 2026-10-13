// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12300 — the Applications page reports what the server did with a
 * write, not what it asked for.
 *
 * Two writes answered 200 while changing nothing the page shows, and the page
 * said they had worked (both reproduced twice on the card, against a stock
 * showcase server):
 *
 * - **Delete** on an app a code package ships: the door answered `reset:
 *   false` ("No customization overlay found … already at artifact default."),
 *   the page toasted "Showcase deleted", and the row stayed.
 * - **Disable** on an app in a writable package: the save named no package, so
 *   the door wrote a package-less row the reader never serves. The page toasted
 *   "disabled" and the app stayed active.
 *
 * ## The fake server, and why it is not a bag of spies
 *
 * Asserting the call alone would pin the page's half and leave the outcome to
 * belief. So the client here is a small model of the door, built from the two
 * answers the card measured: a save of a package-owned app that names a
 * different package (or none) answers 200 and lands on a row nobody serves,
 * and a delete with no customization row answers `reset: false` with a
 * sentence. `refresh` re-reads from that model, so a row's badge after a write
 * is the served state, exactly as on the real page.
 *
 * ## Ablation
 *
 * Dropping the package scope from the page's `saveApp` (both branches call the
 * three-argument form) turns every case that saves a packaged app red: both
 * packaged Disables, both Set default cases and the bulk toggle, on the call
 * and on the row after the re-read. The package-less and sentinel cases stay
 * green, as they must. Ignoring `reset` in the delete handler (toast "deleted"
 * whatever it says) turns the two `reset: false` cases red.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

type Row = Record<string, unknown> & { name: string; _packageId?: string };
type SaveOptions = { packageId?: string };

const h = vi.hoisted(() => {
  /** What `GET /meta/app` serves, by app name. */
  const served = new Map<string, Row>();
  /** Apps that carry a customization overlay row a reset would remove. */
  const overlays = new Set<string>();
  /** Saves that answered 200 onto a package-less row the reader never serves. */
  const unserved: Array<{ name: string; body: Row }> = [];
  /** When set, saves answer 200 and change nothing at all. */
  const ignoreSaves = { value: false };

  function ownerOf(row: Row | undefined): string | undefined {
    const id = row?._packageId;
    return id && id !== 'sys_metadata' ? id : undefined;
  }

  const saveItem = vi.fn(
    async (_type: string, name: string, body: Row, options?: SaveOptions) => {
      if (ignoreSaves.value) return { success: true, state: 'active' };
      const owner = ownerOf(served.get(name));
      if (owner && options?.packageId !== owner) {
        // The silent half the card measured: 200, and a row nobody serves.
        unserved.push({ name, body });
        return { success: true, state: 'active' };
      }
      served.set(name, { ...body });
      overlays.add(name);
      return { success: true, state: 'active' };
    },
  );

  const deleteItem = vi.fn(async (_type: string, name: string) => {
    if (!overlays.has(name)) {
      return {
        success: true,
        reset: false,
        message: `No customization overlay found for app/${name} — already at artifact default.`,
      };
    }
    overlays.delete(name);
    // A package-less app IS its overlay row, so the reset removes it.
    if (!ownerOf(served.get(name))) served.delete(name);
    return { success: true, reset: true };
  });

  const apps = { value: [] as Row[] };
  const refresh = vi.fn(async () => {
    apps.value = [...served.values()].map((row) => ({ ...row }));
  });

  return {
    served,
    overlays,
    unserved,
    ignoreSaves,
    saveItem,
    deleteItem,
    apps,
    refresh,
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    toastInfo: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: { success: h.toastSuccess, error: h.toastError, info: h.toastInfo },
}));

// Echo the call site's own `defaultValue` with its holes filled, the console
// convention the sister mutation suite uses: these cases pin the WRITE and
// what is reported about it, and the keying is pinned in the i18n suite.
vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
        String(options?.[name] ?? ''),
      ),
  }),
}));

vi.mock('@object-ui/app-shell', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadata: () => ({ apps: h.apps.value, refresh: h.refresh }),
  useAdapter: () => ({
    getClient: () => ({ meta: { saveItem: h.saveItem, deleteItem: h.deleteItem } }),
  }),
}));

const { AppManagementPage } = await import('../AppManagementPage');

/** Shipped by a code package, with no customization row (the card's Case 1). */
const SHOWCASE: Row = { name: 'showcase_app', label: 'Showcase', active: true, _packageId: 'com.example.showcase' };
/** In a writable package (the card's Case 2 fixture). */
const LANEB: Row = { name: 'lanebapp_app', label: 'QA LaneB App', active: true, isDefault: true, _packageId: 'com.qa.lanebapp' };
/** No package at all. */
const OPS: Row = { name: 'ops_app', label: 'Ops', active: true };
/** Bound to no package, and served with the server's package-less sentinel. */
const LOCAL: Row = { name: 'local_app', label: 'Local', active: true, _packageId: 'sys_metadata' };

function seed(...rows: Row[]) {
  h.served.clear();
  h.overlays.clear();
  h.unserved.length = 0;
  h.ignoreSaves.value = false;
  for (const row of rows) {
    h.served.set(row.name, { ...row });
    // A package-less app exists only as its stored row.
    if (!row._packageId || row._packageId === 'sys_metadata') h.overlays.add(row.name);
  }
  h.apps.value = rows.map((row) => ({ ...row }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AppManagementPage />
    </MemoryRouter>,
  );
}

function card(name: string) {
  return within(screen.getByTestId(`app-card-${name}`));
}

beforeEach(() => {
  vi.clearAllMocks();
  seed(SHOWCASE, LANEB, OPS, LOCAL);
});

describe('Delete answered `reset: false` (objectui#12300)', () => {
  it('shows the server sentence as neutral information, never "deleted", and the row stays', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Delete Showcase'));
    await user.click(screen.getByLabelText('Confirm delete Showcase'));

    await waitFor(() => expect(h.toastInfo).toHaveBeenCalledTimes(1));
    expect(h.toastInfo).toHaveBeenCalledWith(
      'Nothing to delete for Showcase: No customization overlay found for app/showcase_app — already at artifact default.',
    );
    expect(h.toastSuccess).not.toHaveBeenCalled();
    expect(h.toastError).not.toHaveBeenCalled();

    // Re-read, and the server still serves it: the row is there, still active.
    await waitFor(() => expect(h.refresh).toHaveBeenCalled());
    expect(card('showcase_app').getByText('Active')).toBeInTheDocument();
  });

  it('says what `reset: false` means when the server gives no sentence', async () => {
    h.deleteItem.mockResolvedValueOnce({ success: true, reset: false });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Delete Showcase'));
    await user.click(screen.getByLabelText('Confirm delete Showcase'));

    await waitFor(() => expect(h.toastInfo).toHaveBeenCalledTimes(1));
    expect(h.toastInfo).toHaveBeenCalledWith(
      'Nothing to delete for Showcase: it is already at its package default',
    );
    expect(h.toastSuccess).not.toHaveBeenCalled();
  });

  it('still reports a reset that removed a row, and the row leaves only because the server stopped serving it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Delete Ops'));
    await user.click(screen.getByLabelText('Confirm delete Ops'));

    await waitFor(() => expect(h.toastSuccess).toHaveBeenCalledWith('Ops deleted'));
    expect(h.toastInfo).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId('app-card-ops_app')).toBeNull());
  });
});

describe('Disable sends the owning package (objectui#12300)', () => {
  it('names the writable package on the save, and the row reads Inactive after the re-read', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Disable QA LaneB App'));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(1));
    expect(h.saveItem).toHaveBeenCalledWith(
      'app',
      'lanebapp_app',
      expect.objectContaining({ active: false }),
      { packageId: 'com.qa.lanebapp' },
    );
    expect(h.unserved).toEqual([]);
    await waitFor(() => expect(card('lanebapp_app').getByText('Inactive')).toBeInTheDocument());
  });

  it('names the code package too: an overlay of a shipped app names the package it customizes', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Disable Showcase'));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(1));
    expect(h.saveItem.mock.calls[0]![3]).toEqual({ packageId: 'com.example.showcase' });
    await waitFor(() => expect(card('showcase_app').getByText('Inactive')).toBeInTheDocument());
  });

  it('leaves a package-less app’s toggle unchanged: three arguments, no scope', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Disable Ops'));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(1));
    expect(h.saveItem.mock.calls[0]).toEqual([
      'app',
      'ops_app',
      expect.objectContaining({ name: 'ops_app', active: false }),
    ]);
    await waitFor(() => expect(card('ops_app').getByText('Inactive')).toBeInTheDocument());
  });

  it('never sends the server’s package-less sentinel as a package', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Disable Local'));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(1));
    expect(h.saveItem.mock.calls[0]).toHaveLength(3);
  });

  it('⛔ shows the served state, not the requested one, when a 200 changed nothing', async () => {
    // No optimistic row state: if the server answers 200 and serves the same
    // row, the page must not paint the toggle it asked for.
    h.ignoreSaves.value = true;
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Disable Ops'));

    await waitFor(() => expect(h.refresh).toHaveBeenCalled());
    expect(card('ops_app').getByText('Active')).toBeInTheDocument();
    expect(card('ops_app').queryByText('Inactive')).toBeNull();
  });
});

describe('Set default sends each app’s own package (objectui#12300)', () => {
  it('demotes and promotes in the scope each app is served from', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Set Showcase as default'));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(2));
    expect(h.saveItem.mock.calls[0]).toEqual([
      'app',
      'lanebapp_app',
      expect.objectContaining({ isDefault: false }),
      { packageId: 'com.qa.lanebapp' },
    ]);
    expect(h.saveItem.mock.calls[1]).toEqual([
      'app',
      'showcase_app',
      expect.objectContaining({ isDefault: true }),
      { packageId: 'com.example.showcase' },
    ]);
    // The Default badge moved, on the served rows.
    await waitFor(() => expect(card('showcase_app').getByText('Default')).toBeInTheDocument());
    expect(card('lanebapp_app').queryByText('Default')).toBeNull();
  });

  it('re-reads after a failure too: a demotion that landed is shown, not hidden', async () => {
    const realSave = h.saveItem.getMockImplementation()!;
    h.saveItem
      .mockImplementationOnce(realSave)
      .mockRejectedValueOnce(new Error('forbidden: manage_metadata required'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Set Showcase as default'));

    await waitFor(() => expect(h.toastError).toHaveBeenCalled());
    expect(h.toastSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(h.refresh).toHaveBeenCalled());
    // The demotion landed and the promotion did not: no app is the default.
    await waitFor(() => expect(screen.queryByText('Default')).toBeNull());
  });
});

describe('Bulk toggle sends each app’s own package (objectui#12300)', () => {
  it('scopes the packaged app, leaves the package-less one bare, and both read Inactive', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Select QA LaneB App'));
    await user.click(screen.getByLabelText('Select Ops'));
    await user.click(screen.getByRole('button', { name: 'Disable' }));

    await waitFor(() => expect(h.saveItem).toHaveBeenCalledTimes(2));
    const byName = new Map(h.saveItem.mock.calls.map((call) => [call[1], call]));
    expect(byName.get('lanebapp_app')![3]).toEqual({ packageId: 'com.qa.lanebapp' });
    expect(byName.get('ops_app')).toHaveLength(3);
    expect(h.unserved).toEqual([]);
    expect(h.toastSuccess).toHaveBeenCalledWith('2 apps disabled');
    await waitFor(() => expect(card('lanebapp_app').getByText('Inactive')).toBeInTheDocument());
    expect(card('ops_app').getByText('Inactive')).toBeInTheDocument();
  });
});
