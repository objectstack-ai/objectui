/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10636 — the console `ObjectView`'s record-count footer
 * (`data-testid="record-count-footer"`, drawn beside the record in split
 * navigation) read `1 records` in `en` at one record. It rendered one key,
 * `console.objectView.recordCount`, at every count: no singular key and no
 * switch, while the list view's record-count bar and the record picker's count
 * beside it both pick a `…One` key at exactly one.
 *
 * ## The repair: the form objectui#10425 settled for those two counters
 *
 * The call site picks `console.objectView.recordCountOne` at exactly one and
 * `console.objectView.recordCount` at every other count, the same two-key
 * switch as `ListView`'s `list.recordCount` / `list.recordCountOne`. In `ru`
 * (one: 1, 21…; few: 2-4…; many: 0, 5-20…) and `ar` (zero, one, two, few 3-10,
 * many 11-99, other 100+) two slots cannot give a noun the right form, so the
 * count-not-one half is a count label — a label, a colon, then the number —
 * as objectui#10024, objectui#10242 and objectui#10425 ruled. Every pack's pair
 * reads the way its `list.recordCount` pair does, so the footer and the list
 * bar count the same records in the same words. ⛔ No i18next `_one` / `_few`
 * suffixes: `all-locales-key-parity.test.ts` holds every pack to `en`'s key set.
 *
 * ## What this file measures
 *
 * The footer text a user reads, from a real `ObjectView` mount inside a real
 * i18next instance booted in the language under test; `t` is not mocked. The
 * count is the `total` the view's own `$top: 0` count query returns. `en` at 3
 * is the control.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createI18n, I18nProvider } from '@object-ui/i18n';
import { builtInLocales } from '@object-ui/i18n/locales';

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  // Stable identities — `ListView` names `perms` in its fetch dependencies.
  const perms = {
    check: () => ({ allowed: true }),
    checkField: () => true,
    getFieldPermissions: () => [],
    getRowFilter: () => undefined,
    getObjectApiOperations: () => undefined,
    roles: [],
    isLoaded: false,
    hasCapabilities: () => true,
    can: () => true,
    cannot: () => false,
  };
  const fieldPerms = { canRead: () => true, canWrite: () => true, permissions: [] };
  return { ...actual, usePermissions: () => perms, useFieldPermissions: () => fieldPerms };
});

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada' }, activeOrganization: null }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
  createAuthenticatedFetch: () => vi.fn(),
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRealtimeSubscription: () => ({ lastMessage: null }),
  useConflictResolution: () => ({ hasConflicts: false, resolveAllConflicts: () => {} }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));
// The split pane's right half: the record is not what this file reads.
vi.mock('./RecordDetailView', () => ({ RecordDetailView: () => null }));

vi.mock('./metadata-admin/useMetadata', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataClient: () => ({ save: vi.fn(async () => ({})), get: vi.fn(async () => null) }),
}));

import { ObjectView } from './ObjectView';
import { ExpressionProvider } from '../providers/ExpressionProvider';

type Lang = 'en' | 'ru' | 'ar';

const OBJECT_NAME = 'duly_task';
const VIEW_ID = `${OBJECT_NAME}.all`;

// Split navigation is the one layout that draws the footer: the list sits in
// the left pane with the footer under it, the open record in the right pane.
const OBJECTS = [
  {
    name: OBJECT_NAME,
    label: 'Task',
    fields: {
      id: { type: 'text', label: 'Id' },
      name: { type: 'text', label: 'Name' },
    },
    listViews: {
      [VIEW_ID]: {
        name: VIEW_ID,
        label: 'Everything',
        type: 'grid',
        columns: ['name'],
        navigation: { mode: 'split' },
      },
    },
  },
];

beforeEach(() => {
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
  cleanup();
  vi.unstubAllGlobals();
});

function boot(lang: Lang) {
  const i18n = createI18n({ defaultLanguage: lang, detectBrowserLanguage: false });
  // The instance really booted in the language under test; otherwise every
  // string below would be `en` read through `fallbackLng`.
  expect(i18n.language).toBe(lang);
  return i18n;
}

/** The footer text with `count` records, as the view's count query reports it. */
async function footer(lang: Lang, count: number): Promise<string> {
  // Every query answers with no rows and the total: the footer reads the
  // total, and no row means the list's own record-count bar stays out of it.
  const dataSource = {
    find: vi.fn(async () => ({ data: [], total: count })),
    findOne: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as never;
  render(
    <I18nProvider instance={boot(lang)}>
      <ExpressionProvider user={{ id: 'u1', name: 'Ada', profile: 'user' }}>
        {/* `?recordId=` opens the split pane, the way a row click does. */}
        <MemoryRouter initialEntries={[`/apps/demo/${OBJECT_NAME}/view/${VIEW_ID}?recordId=r1`]}>
          <Routes>
            <Route
              path="/apps/:appName/:objectName/view/:viewId"
              element={<ObjectView dataSource={dataSource} objects={OBJECTS} onEdit={() => {}} />}
            />
          </Routes>
        </MemoryRouter>
      </ExpressionProvider>
    </I18nProvider>,
  );
  const node = await screen.findByTestId('record-count-footer', undefined, { timeout: 5000 });
  const text = node.textContent ?? '';
  cleanup();
  return text;
}

type Rows = Record<Lang, Array<[number, string]>>;

/**
 * Every footer string this file expects. `ru` 2 is few and 21 is one; `ar` 2
 * is two and 11 is many — the categories a single count-not-one noun got wrong.
 */
const FOOTER: Rows = {
  en: [
    [1, '1 record'],
    [3, '3 records'],
  ],
  ru: [
    [1, '1 запись'],
    [2, 'Записей: 2'],
    [21, 'Записей: 21'],
  ],
  ar: [
    [1, '1 سجل'],
    [2, 'عدد السجلات: 2'],
    [11, 'عدد السجلات: 11'],
  ],
};

const at = (lang: string, dotted: string) =>
  dotted
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      (builtInLocales as Record<string, unknown>)[lang],
    );

describe('ObjectView record-count footer reads right at one and at every other count (objectui#10636)', () => {
  it('the representative counts reach the categories the count-not-one half serves', () => {
    const ru = new Intl.PluralRules('ru');
    const ar = new Intl.PluralRules('ar');
    expect([1, 2, 21].map((n) => ru.select(n))).toEqual(['one', 'few', 'one']);
    expect([1, 2, 11].map((n) => ar.select(n))).toEqual(['one', 'two', 'many']);
  });

  describe.each(Object.keys(FOOTER) as Lang[])('footer, %s', (lang) => {
    it.each(FOOTER[lang])('at %i', async (count, line) => {
      expect(await footer(lang, count)).toBe(line);
    });
  });

  it('en no longer reads a plural noun at one record', async () => {
    // The shipped defect, named as the string an English user read.
    expect(await footer('en', 1)).not.toBe('1 records');
  });

  it('every pack words the footer the way it words the list bar', () => {
    // The footer and the list view's record-count bar count the same records;
    // a pack that words one of them differently reads as two different counts.
    const packs = Object.keys(builtInLocales);
    expect(packs.length).toBeGreaterThanOrEqual(10);
    for (const lang of packs) {
      expect(at(lang, 'console.objectView.recordCount'), `${lang} recordCount`).toBe(
        at(lang, 'list.recordCount'),
      );
      expect(at(lang, 'console.objectView.recordCountOne'), `${lang} recordCountOne`).toBe(
        at(lang, 'list.recordCountOne'),
      );
    }
  });

  it('in ru and ar the count-not-one half is count-invariant: it ends in the number, after a colon', () => {
    for (const lang of ['ru', 'ar'] as const) {
      const value = at(lang, 'console.objectView.recordCount');
      expect(value, `${lang} console.objectView.recordCount`).toMatch(/: \{\{count\}\}$/);
      expect(value, `${lang} equals its One half`).not.toBe(at(lang, 'console.objectView.recordCountOne'));
    }
  });
});
