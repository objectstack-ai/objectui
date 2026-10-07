// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Installed Apps reads an entry the runtime refused to load as NOT LOADED, names
 * the reason, and keeps Uninstall on it (objectui#11645).
 *
 * ## The defect
 *
 * After a restart whose startup rehydrate refused a protocol-incompatible
 * package, `GET /api/v1/marketplace/install-local` still lists it (so DELETE and
 * a compatible re-install stay reachable), and since objectstack#21822 (PR
 * objectstack#21833, `@objectstack/*` 17.7.0) it marks the entry with
 * `notLoaded: { code, requiredRange }` IN PLACE of `withSampleData`.
 * `InstalledList` drew every listed entry as installed, so the console said
 * "installed" for a package the runtime holds none of.
 *
 * ## Why the cases drive the WIRE
 *
 * `marketplaceApi` is NOT mocked. One stubbed `fetch` answers by path with the
 * listing body the server landed, verbatim in shape, over a stateful ledger, so
 * "Uninstall works" means a DELETE left for that manifest id and the re-read
 * listing no longer carries the row — the card's own acceptance.
 *
 * ## What the cases assert about text
 *
 * The rendered line is compared with the PACK's value for its key, read from
 * the pack and interpolated here, never with a sentence copied into this file:
 * the claim is which key renders, with which values, through the real
 * `I18nProvider`, in `en` and in `zh`. Wording stays the translators'.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '@object-ui/i18n';
import { en, zh } from '@object-ui/i18n/locales';

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

/** `{{name}}` interpolation, as i18next applies it to these keys (no escaping: the console sets `escapeValue: false`). */
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);

/**
 * The refused entry exactly as objectstack PR #21833's wire shape gives it to an
 * operator (`manage_metadata`): `notLoaded` closed to `code` + `requiredRange`,
 * and NO `withSampleData` key — omitted, not `false`.
 */
const REFUSED = {
  packageId: 'com.example.crm',
  versionId: 'ver_crm_3',
  manifestId: 'com.example.crm',
  version: '3.2.0',
  installedAt: '2026-10-05T09:00:00.000Z',
  notLoaded: { code: 'OS_PROTOCOL_INCOMPATIBLE', requiredRange: '^16' },
  installedBy: 'admin@objectos.ai',
};

/** A loaded entry, byte-identical to the listing before #21833: `withSampleData`, no `notLoaded` key. */
const LOADED = {
  packageId: 'com.example.todo',
  versionId: 'ver_todo_1',
  manifestId: 'com.example.todo',
  version: '1.0.0',
  installedAt: '2026-10-05T09:00:00.000Z',
  withSampleData: true,
  installedBy: 'admin@objectos.ai',
};

/** The same refused entry as a narrowed caller (no `manage_metadata`) reads it: no `installedBy`, marker kept. */
const { installedBy: _operatorOnly, ...REFUSED_NARROWED } = REFUSED;

interface WireCall { path: string; method: string }
let calls: WireCall[] = [];
let ledger: Array<Record<string, unknown>> = [];
let confirmed: string[] = [];

const answer = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: '',
  json: async () => body,
});

/** Serve the install-local doors over `entries`, statefully: DELETE removes the entry, as the server's ledger does. */
function serve(entries: Array<Record<string, unknown>>) {
  ledger = entries.map((e) => ({ ...e }));
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: { method?: string }) => {
      const path = new URL(String(input), 'http://console.test').pathname;
      const method = (init?.method ?? 'GET').toUpperCase();
      calls.push({ path, method });
      // Not cloud-bound: the widget falls back to the local listing.
      if (path === '/api/v1/cloud-connection/installed') return answer(404, {});
      if (path === '/api/v1/marketplace/install-local' && method === 'GET') {
        return answer(200, { success: true, data: { items: ledger, total: ledger.length } });
      }
      const del = /^\/api\/v1\/marketplace\/install-local\/([^/]+)$/.exec(path);
      if (del && method === 'DELETE') {
        const manifestId = decodeURIComponent(del[1]);
        ledger = ledger.filter((e) => e.manifestId !== manifestId);
        return answer(200, { success: true, data: { manifestId, cleanups: [] } });
      }
      return answer(404, { success: false, error: { code: 'NOT_FOUND', message: `no route ${method} ${path}` } });
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

/** A row's title: the `CardTitle` naming `manifestId` (the row's `<code>` also prints the package id, so the selector is what tells them apart). */
const TITLE = { selector: 'div.font-semibold' } as const;

/** The card whose title names `manifestId`. */
async function card(manifestId: string): Promise<HTMLElement> {
  const title = await screen.findByText(manifestId, TITLE);
  const el = title.closest('div.rounded-lg');
  if (!el) throw new Error(`no card around ${manifestId}`);
  return el as HTMLElement;
}

beforeEach(() => {
  confirmed = [];
  vi.stubGlobal('confirm', (question: string) => {
    confirmed.push(question);
    return true;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe.each([
  ['en', EN, en as Pack],
  ['zh', ZH, zh as unknown as Pack],
])('InstalledList — a refused entry reads not loaded, with its reason (objectui#11645) [%s]', (_lang, config, pack) => {
  const badge = pack.marketplace.notLoaded.badge;
  const reason = fill(pack.marketplace.notLoaded.protocolIncompatible, { requiredRange: '^16' });

  it('the operator\'s refused entry carries the not-loaded badge and the protocol reason, naming the range', async () => {
    serve([REFUSED, LOADED]);
    renderList(config);

    const row = await card('com.example.crm');
    expect(within(row).getByText(badge)).toBeInTheDocument();
    expect(within(row).getByText(reason)).toBeInTheDocument();
    // Uninstall is still offered on the row, and enabled.
    expect(within(row).getByRole('button', { name: pack.marketplace.action.uninstall })).toBeEnabled();
  });

  it('a narrowed caller\'s entry (no `installedBy`) still reads not loaded, with its reason', async () => {
    serve([REFUSED_NARROWED]);
    renderList(config);

    const row = await card('com.example.crm');
    expect(within(row).getByText(badge)).toBeInTheDocument();
    expect(within(row).getByText(reason)).toBeInTheDocument();
    // Lit control: the operator-only line is the thing absent, not the row.
    expect(within(row).queryByText(fill(pack.marketplace.installedBy, { user: 'admin@objectos.ai' }))).toBeNull();
  });

  it('a loaded entry carries neither the badge nor a reason', async () => {
    // A preservation pin: it holds on both sides of the fix. The cases above
    // are what show these queries find the badge and the reason when present.
    serve([REFUSED, LOADED]);
    renderList(config);

    const row = await card('com.example.todo');
    expect(within(row).queryByText(badge)).toBeNull();
    // The static head of either reason sentence (the text before its placeholder).
    for (const template of [pack.marketplace.notLoaded.protocolIncompatible, pack.marketplace.notLoaded.otherReason]) {
      const head = template.split('{{')[0];
      expect(head.length).toBeGreaterThan(3);
      expect(row.textContent).not.toContain(head);
    }
    expect(within(row).getByRole('button', { name: pack.marketplace.action.uninstall })).toBeEnabled();
  });
});

describe('InstalledList — Uninstall works from the not-loaded row (objectui#11645)', () => {
  it('confirms in not-loaded terms, issues DELETE for the manifest id, and the re-read listing drops the row', async () => {
    serve([REFUSED, LOADED]);
    renderList(EN);

    const row = await card('com.example.crm');
    fireEvent.click(within(row).getByRole('button', { name: en.marketplace.action.uninstall }));

    await waitFor(() =>
      expect(calls).toContainEqual({ path: '/api/v1/marketplace/install-local/com.example.crm', method: 'DELETE' }),
    );
    expect(confirmed).toEqual([
      fill(en.marketplace.uninstall.confirmNotLoaded, { manifestId: 'com.example.crm', version: '3.2.0' }),
    ]);
    expect(
      await screen.findByText(fill(en.marketplace.uninstall.successNotLoaded, { manifestId: 'com.example.crm' })),
    ).toBeInTheDocument();
    // The listing was read again after the DELETE, and no longer has the row.
    await waitFor(() => expect(screen.queryByText('com.example.crm', TITLE)).toBeNull());
    expect(calls.filter((c) => c.path === '/api/v1/marketplace/install-local' && c.method === 'GET')).toHaveLength(2);
    expect(screen.getByText('com.example.todo', TITLE)).toBeInTheDocument();
  });

  it('control: a loaded row keeps the loaded package\'s confirm and result', async () => {
    serve([REFUSED, LOADED]);
    renderList(EN);

    const row = await card('com.example.todo');
    fireEvent.click(within(row).getByRole('button', { name: en.marketplace.action.uninstall }));

    await waitFor(() =>
      expect(calls).toContainEqual({ path: '/api/v1/marketplace/install-local/com.example.todo', method: 'DELETE' }),
    );
    expect(confirmed).toEqual([
      fill(en.marketplace.uninstall.confirm, { manifestId: 'com.example.todo', version: '1.0.0' }),
    ]);
    expect(
      await screen.findByText(fill(en.marketplace.uninstall.successInList, { manifestId: 'com.example.todo' })),
    ).toBeInTheDocument();
  });
});

describe('InstalledList — a refusal code the console has no sentence for (objectui#11645)', () => {
  it('still reads not loaded, names the code, and keeps the row and its Uninstall', async () => {
    serve([{ ...REFUSED, notLoaded: { code: 'OS_SOME_LATER_REFUSAL', requiredRange: '^18' } }]);
    renderList(EN);

    const row = await card('com.example.crm');
    expect(within(row).getByText(en.marketplace.notLoaded.badge)).toBeInTheDocument();
    expect(within(row).getByText(fill(en.marketplace.notLoaded.otherReason, { code: 'OS_SOME_LATER_REFUSAL' }))).toBeInTheDocument();
    // The protocol sentence is the one code's, never a guess for another.
    expect(row.textContent).not.toContain('^18');
    expect(within(row).getByRole('button', { name: en.marketplace.action.uninstall })).toBeEnabled();
  });
});
