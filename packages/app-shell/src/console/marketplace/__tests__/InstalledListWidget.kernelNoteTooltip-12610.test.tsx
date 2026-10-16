// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Installed Apps' kernel note rides the Uninstall it qualifies, as a tooltip,
 * instead of a paragraph under the list (objectui#12610).
 *
 * The settings walk measured the "kernel API is additive only" paragraph under
 * the EMPTY state, where there is nothing to uninstall. The note says what
 * Uninstall does to a loaded package (the running kernel keeps it until
 * restart), so it belongs on that action, and only where it applies:
 *
 *   - the empty state carries no note;
 *   - a loaded local row's Uninstall is described by the note and opens a
 *     tooltip with it, as plain text — no markup is drawn literally;
 *   - a not-loaded row's Uninstall carries no note: that package left nothing
 *     in the running kernel (objectui#11645);
 *   - every pack's value is plain text, since a tooltip renders it as text.
 *
 * The wire is stubbed `fetch` against the REAL `marketplaceApi`, as the
 * not-loaded file beside this one does; text is the PACK's value for its key,
 * through the real `I18nProvider`, never a sentence copied into this file.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@object-ui/i18n';
import { builtInLocales, en, zh } from '@object-ui/i18n/locales';

vi.mock('react-router-dom', () => {
  const navigate = () => {};
  const params = {};
  return { useNavigate: () => navigate, useParams: () => params };
});

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
}));

import { InstalledList } from '../InstalledListWidget';

type Pack = typeof en;
const EN = { defaultLanguage: 'en', detectBrowserLanguage: false } as const;
const ZH = { defaultLanguage: 'zh', detectBrowserLanguage: false } as const;

const LOADED = {
  packageId: 'com.example.todo',
  versionId: 'ver_todo_1',
  manifestId: 'com.example.todo',
  version: '1.0.0',
  installedAt: '2026-10-05T09:00:00.000Z',
  withSampleData: true,
  installedBy: 'admin@objectos.ai',
};

const REFUSED = {
  packageId: 'com.example.crm',
  versionId: 'ver_crm_3',
  manifestId: 'com.example.crm',
  version: '3.2.0',
  installedAt: '2026-10-05T09:00:00.000Z',
  notLoaded: { code: 'OS_PROTOCOL_INCOMPATIBLE', requiredRange: '^16' },
  installedBy: 'admin@objectos.ai',
};

const answer = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: '',
  json: async () => body,
});

/** Not cloud-bound: the widget lists the local install cache, `entries`. */
function serveLocal(entries: Array<Record<string, unknown>>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const path = new URL(String(input), 'http://console.test').pathname;
      if (path === '/api/v1/cloud-connection/installed') return answer(404, {});
      if (path === '/api/v1/marketplace/install-local') {
        return answer(200, { success: true, data: { items: entries, total: entries.length } });
      }
      return answer(404, {});
    }),
  );
}

function renderList(config: typeof EN | typeof ZH) {
  return render(
    <I18nProvider config={config} persistLanguage={false}>
      <InstalledList />
    </I18nProvider>,
  );
}

const TITLE = { selector: 'div.font-semibold' } as const;

async function card(manifestId: string): Promise<HTMLElement> {
  const title = await screen.findByText(manifestId, TITLE);
  const el = title.closest('div.rounded-lg');
  if (!el) throw new Error(`no card around ${manifestId}`);
  return el as HTMLElement;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe.each([
  ['en', EN, en as Pack],
  ['zh', ZH, zh as unknown as Pack],
])('InstalledList — the kernel note is the Uninstall tooltip (objectui#12610) [%s]', (_lang, config, pack) => {
  const note = pack.marketplace.installedAdditiveNote;

  it('the empty state carries no kernel note', async () => {
    serveLocal([]);
    renderList(config);
    expect(await screen.findByText(pack.marketplace.installedEmpty)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(note);
  });

  it('a loaded row\'s Uninstall is described by the note, and hovering it opens a tooltip with it', async () => {
    const user = userEvent.setup();
    serveLocal([LOADED]);
    renderList(config);

    const row = await card('com.example.todo');
    const uninstall = within(row).getByRole('button', { name: pack.marketplace.action.uninstall });
    expect(uninstall).toHaveAccessibleDescription(note);
    // The note is not a paragraph on the page any more: the only copy outside
    // the tooltip is the one the button's description points at.
    const described = document.getElementById(uninstall.getAttribute('aria-describedby') as string);
    expect(described).toHaveClass('sr-only');

    await user.hover(uninstall);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(note);
    // Plain text: no tag drawn literally, no element injected from the value.
    expect(tooltip.textContent).not.toMatch(/<\/?[a-z]/i);
    expect(tooltip.querySelector('strong')).toBeNull();
  });

  it('a not-loaded row\'s Uninstall carries no note — that package left nothing in the kernel', async () => {
    serveLocal([REFUSED]);
    renderList(config);

    const row = await card('com.example.crm');
    const uninstall = within(row).getByRole('button', { name: pack.marketplace.action.uninstall });
    expect(uninstall).not.toHaveAttribute('aria-describedby');
    expect(document.body.textContent).not.toContain(note);
  });
});

describe('every pack\'s kernel note is plain text (objectui#12610)', () => {
  const packs = Object.entries(builtInLocales) as Array<[string, Pack]>;

  it('the walk below reads all ten packs', () => {
    expect(packs.map(([lang]) => lang).sort()).toEqual(
      ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh'],
    );
  });

  it.each(packs)('%s: `marketplace.installedAdditiveNote` carries no markup', (_lang, pack) => {
    const note = pack.marketplace.installedAdditiveNote;
    expect(note.length).toBeGreaterThan(20);
    expect(note).not.toMatch(/<\/?[a-z][^>]*>/i);
  });
});
