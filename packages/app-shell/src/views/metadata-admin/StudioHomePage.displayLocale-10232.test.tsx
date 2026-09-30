/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Studio home's "recently viewed" times read the DISPLAY locale, not the
 * designer's string-table language (objectui#10232).
 *
 * The page carries a `locale` of its own — `useMetadataLocale()`, which picks
 * one of the metadata-admin `t()` tables and is therefore `'en-US'` for every
 * language that is not zh. `relativeTime` used to be handed that value, so a
 * de-DE session read "3 days ago". The face now formats with
 * `useDisplayLocale()`, the channel objectui#9909's surfaces already use.
 *
 * Each session is read with the UI language `en` on both sides, so the
 * string-table language is `'en-US'` in both and only the declared display
 * locale differs: a reading that still followed `useMetadataLocale()` says the
 * same thing twice.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider, LocalizationProvider } from '@object-ui/i18n';
import { isMachineLocale, recordLocaleArgumentsAsync } from '@object-ui/test-support';

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

vi.mock('./useMetadata.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataClient: () => ({ list: async () => [] }),
  useMetadataTypes: () => ({ loading: false, entries: [] }),
  useGlobalDiagnostics: () => ({ summary: { total: 0 }, countsByType: {}, packagesByType: {}, loading: false }),
}));

vi.mock('./QuickFind.js', () => ({ MetadataQuickFind: () => null }));

vi.mock('../../context/RecentItemsProvider.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRecentItems: () => ({
    recentItems: [
      {
        id: 'object:account',
        label: 'Account',
        href: '/studio/object/account',
        type: 'object',
        visitedAt: new Date(Date.now() - THREE_DAYS).toISOString(),
      },
    ],
    addRecentItem: () => {},
    clearRecentItems: () => {},
  }),
}));

import { StudioHomePage } from './StudioHomePage';

afterEach(cleanup);

/** Mounts the page under a declared display `locale` and returns the recent item's time. */
async function readVisitTime(locale: string): Promise<string> {
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <LocalizationProvider value={{ locale }}>
        <MemoryRouter>
          <StudioHomePage />
        </MemoryRouter>
      </LocalizationProvider>
    </I18nProvider>,
  );
  const label = await screen.findByText('Account');
  const text = label.parentElement?.textContent ?? '';
  cleanup();
  return text.replace(/\s+/g, ' ');
}

describe('Studio home — recently viewed times follow the display locale (objectui#10232)', () => {
  it('says the de-DE face under a de-DE session', async () => {
    const text = await readVisitTime('de-DE');
    expect(text, `got: ${text}`).toMatch(/vor 3 Tagen/);
  });

  it('keeps the en face under an en session', async () => {
    const text = await readVisitTime('en');
    expect(text, `got: ${text}`).toMatch(/3 days ago/);
  });

  it('is a reading of the display locale, not of the string-table language', async () => {
    expect(await readVisitTime('de-DE')).not.toBe(await readVisitTime('en'));
  });

  it('every locale-taking call receives the declared tag', async () => {
    const calls = await recordLocaleArgumentsAsync(async () => {
      await readVisitTime('de-DE');
    });
    expect(calls.some((c) => c.locale === 'de-DE'), `saw: ${JSON.stringify(calls).slice(0, 2000)}`).toBe(true);
    expect(calls.filter(isMachineLocale), 'these call sites formatted in the machine locale').toEqual([]);
  });
});
