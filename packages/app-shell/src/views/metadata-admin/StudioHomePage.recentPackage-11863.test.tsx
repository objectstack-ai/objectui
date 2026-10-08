/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The metadata-admin app's home leaves a recent Studio PACKAGE entry out of its
 * "Recently viewed" list (objectui#11863).
 *
 * A package entry stores the package's identity only and is labelled from the
 * package list. This page's own list holds the writable bases only
 * (`buildPackageScopeOptions`), so a read-only package would be drawn as its
 * raw id, the regression objectui#11678 retired. The Studio landing lists
 * recent packages instead; the other kinds are listed here as before.
 *
 * Harness: `StudioHomePage.displayLocale-10232.test.tsx`'s.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@object-ui/i18n';

const recent = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock('./useMetadata.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  // The page's own package list: a writable base, the only kind it holds.
  useMetadataClient: () => ({
    list: async () => [{ manifest: { id: 'com.acme.crm', name: 'Acme CRM', scope: 'project' } }],
  }),
  useMetadataTypes: () => ({ loading: false, entries: [] }),
  useGlobalDiagnostics: () => ({ summary: { total: 0 }, countsByType: {}, packagesByType: {}, loading: false }),
}));

vi.mock('./QuickFind.js', () => ({ MetadataQuickFind: () => null }));

vi.mock('../../context/RecentItemsProvider.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRecentItems: () => ({ recentItems: recent.items, addRecentItem: () => {}, clearRecentItems: () => {} }),
}));

import { StudioHomePage } from './StudioHomePage';

afterEach(() => {
  cleanup();
  recent.items = [];
});

const at = new Date().toISOString();
const PACKAGE = { id: 'package:com.example.showcase', type: 'package', name: 'com.example.showcase', href: '/studio/com.example.showcase', visitedAt: at };
const METADATA = { id: 'metadata:object:Account', type: 'metadata', label: 'Account', href: '/studio/metadata/object/Account', visitedAt: at };

function renderPage() {
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <MemoryRouter>
        <StudioHomePage />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('metadata-admin home — a recent package is not drawn as its id (objectui#11863)', () => {
  it('lists the other kinds and leaves the package entry out', async () => {
    recent.items = [PACKAGE, METADATA];
    renderPage();

    expect(await screen.findByText('Account')).toBeInTheDocument();
    expect(screen.queryByText('com.example.showcase')).not.toBeInTheDocument();
    expect(document.querySelector(`a[href="${PACKAGE.href}"]`)).toBeNull();
  });

  it('with only package entries the list reads as empty', async () => {
    recent.items = [PACKAGE];
    renderPage();

    expect(await screen.findByText('Nothing here yet — items you open will appear for quick access.')).toBeInTheDocument();
    expect(screen.queryByText('com.example.showcase')).not.toBeInTheDocument();
  });
});
