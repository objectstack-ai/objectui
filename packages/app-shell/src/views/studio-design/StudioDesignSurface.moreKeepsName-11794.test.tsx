// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11794 — the Studio header's *More* trigger keeps its own name.
 *
 * The defect: with an overflow pillar open (today *Access*, the one entry of
 * `OVERFLOW_PILLARS`, objectui#5813), the trigger renamed itself to that
 * pillar ("Access ▾"), so the word that says this control is the overflow menu
 * was gone. The same rule the Data pillar's *Advanced* trigger follows now
 * holds here: the trigger always reads *More*. Where the author is still shows
 * twice — the trigger takes the active pillar styling while one of its pillars
 * is open, and inside the menu that pillar's link is the current page
 * (`aria-current="page"`).
 *
 * The active styling is read as the class tokens an open PRIMARY pillar link
 * carries, and each test that asserts them on the trigger also reads them on
 * that link (or reads their absence there), so the tokens are shown to be the
 * active marker rather than assumed to be one.
 *
 * Rendered through the real `StudioDesignSurface` and its real Radix Popover,
 * as `createAppOpensInterfaces-11794` is; only data I/O and heavy docks are
 * doubled.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

let clientImpl: ReturnType<typeof makeClient>;

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMetadataClient: () => clientImpl,
    useMetadataTypes: () => ({
      loading: false,
      error: null,
      entries: [{ type: 'permission', label: 'Permission', allowOrgOverride: true }],
    }),
  };
});

vi.mock('./packages-io', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    fetchPackages: vi.fn(async () => [{ id: 'app.a', name: 'App A', writable: true, namespace: 'a' }]),
  };
});

vi.mock('../../components/SuggestedBindingsPanel', () => ({ SuggestedBindingsPanel: () => null }));
vi.mock('../metadata-admin/AccessExplainPanel', () => ({ AccessExplainPanel: () => null }));
vi.mock('./StudioAiCopilot', () => ({ StudioChatDock: () => null }));
vi.mock('../../preview/DraftChangesPanel', () => ({ DraftChangesPanel: () => null }));

import { StudioDesignSurface } from './StudioDesignSurface';
import { t } from '../metadata-admin/i18n';

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

(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

function makeClient() {
  return {
    list: vi.fn(async (type: string) => {
      if (type === 'permission') return [{ name: 'set_a', label: 'Set A' }];
      if (type === 'object') return [{ name: 'a_account' }];
      return [];
    }),
    listDrafts: vi.fn(async () => []),
    layered: vi.fn(async (_type: string, name: string) => ({
      effective: name === 'set_a' ? { name: 'set_a', label: 'Set A', objects: { a_account: { allowRead: true } }, fields: {} } : null,
      code: null,
      overlay: null,
      overlayScope: null,
    })),
    getDraft: vi.fn(async () => null),
    get: vi.fn(async (type: string) => (type === 'object' ? { fields: [{ name: 'name', label: 'Name' }] } : null)),
    save: vi.fn(async (_type: string, _name: string, body: Record<string, unknown>) => body),
  };
}

const MORE = t('engine.studio.more', 'en');
const ACCESS = t('engine.studio.pillar.access', 'en');
const INTERFACES = t('engine.studio.pillar.interfaces', 'en');
/** The class tokens an open pillar link carries in the header row. */
const ACTIVE = ['bg-primary/10', 'font-medium', 'text-primary'];

beforeEach(() => {
  clientImpl = makeClient();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })) as unknown as typeof fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderOn(pillar: 'access' | 'interfaces') {
  render(
    <MemoryRouter initialEntries={[`/studio/app.a/${pillar}`]}>
      <Routes>
        <Route path="/studio/:packageId/:tab" element={<StudioDesignSurface />} />
      </Routes>
    </MemoryRouter>,
  );
  const header = await screen.findByRole('banner');
  if (pillar === 'access') await screen.findByText('a_account');
  return { header, trigger: within(header).getByTestId('studio-nav-more') };
}

/** Open the More popover and return its Access link. */
async function accessLinkInMenu(trigger: HTMLElement) {
  fireEvent.click(trigger);
  const menu = await screen.findByRole('dialog');
  return within(menu).getByRole('link', { name: ACCESS });
}

describe('the Studio header’s More trigger keeps its own name (objectui#11794)', () => {
  it('with Access open the trigger reads More (not Access) and takes the active pillar styling', async () => {
    const { header, trigger } = await renderOn('access');

    // THE PIN: the trigger's own name, whichever of its pillars is open.
    expect(trigger).toHaveTextContent(MORE);
    expect(trigger).not.toHaveTextContent(ACCESS);
    expect(trigger).toHaveClass(...ACTIVE);
    // No primary pillar link is the open one.
    expect(within(header).getByRole('link', { name: INTERFACES })).not.toHaveClass('bg-primary/10');
  });

  it('control: with a primary pillar open the trigger reads More with no active styling, which the open pillar link has', async () => {
    const { header, trigger } = await renderOn('interfaces');

    expect(trigger).toHaveTextContent(MORE);
    expect(trigger).not.toHaveClass('bg-primary/10');
    expect(trigger).not.toHaveClass('text-primary');
    // Lit control: the same tokens mark the open primary pillar.
    expect(within(header).getByRole('link', { name: INTERFACES })).toHaveClass(...ACTIVE);
  });

  it('the menu marks the open pillar: Access is the current page while it is open, and not from a primary pillar', async () => {
    const onAccess = await renderOn('access');
    const openLink = await accessLinkInMenu(onAccess.trigger);
    expect(openLink).toHaveAttribute('aria-current', 'page');
    expect(openLink).toHaveClass(...ACTIVE);
    cleanup();

    const onInterfaces = await renderOn('interfaces');
    const closedLink = await accessLinkInMenu(onInterfaces.trigger);
    expect(closedLink).not.toHaveAttribute('aria-current');
    expect(closedLink).not.toHaveClass('bg-primary/10');
    await waitFor(() => expect(closedLink).toHaveAttribute('href', '/studio/app.a/access'));
  });
});
