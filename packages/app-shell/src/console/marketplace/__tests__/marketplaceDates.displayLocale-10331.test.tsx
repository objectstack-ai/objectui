/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Two marketplace date faces read the DISPLAY locale, never the UI language
 * (objectui#10331).
 *
 * - `InstalledList`: the "Installed {{when}}" date was
 *   `toLocaleString(language || undefined)`, so it spoke the UI language, and
 *   the machine's locale when the language was empty.
 * - `MarketplacePage`: a package card's relative published time was
 *   `Intl.RelativeTimeFormat(language || 'en')`, the UI language again, with a
 *   literal `'en'` behind it.
 *
 * Both now take their tag from `useDisplayLocale()`. Every case below mounts
 * the real `I18nProvider` with an ENGLISH UI and declares the display locale
 * through `LocalizationProvider`, so the only thing that differs between a
 * `de-CH` session and an `en-US` one is the display locale. A face that still
 * read `language` renders the English form under `de-CH` and goes red.
 *
 * Each face carries: the `de-CH` pin (the literal form, plus equality with the
 * runtime's own `de-CH` rendering), the `en-US` control, the differential
 * between the two (a runner locale cannot satisfy both), and the runtime
 * tripwire over the argument the formatter actually received.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider, LocalizationProvider } from '@object-ui/i18n';
import { isMachineLocale, recordLocaleArgumentsAsync } from '@object-ui/test-support';

vi.mock('react-router-dom', () => {
  const navigate = () => {};
  const params = {};
  return { useNavigate: () => navigate, useParams: () => params };
});

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
}));

/** Noon UTC, so the calendar date is the same in every zone the suite could run in (it pins `TZ=UTC`). */
const INSTALLED_AT = '2020-03-04T12:00:00.000Z';

/** Three whole days before the render, so the relative face is "N days ago" and never the translated "today". */
const PUBLISHED = vi.hoisted(() => ({ at: '' }));

vi.mock('../marketplaceApi', () => ({
  listLocalInstalls: async () => [
    {
      packageId: 'pkg_1',
      versionId: 'v1',
      manifestId: 'com.acme.crm',
      version: '1.2.0',
      installedAt: '2020-03-04T12:00:00.000Z',
      installedBy: null,
    },
  ],
  listInstalledPackages: async () => ({ connected: false, items: [] }),
  listMarketplacePackages: async () => ({
    items: [
      {
        id: 'pkg_1',
        manifest_id: 'com.acme.crm',
        display_name: 'Acme CRM',
        description: 'A CRM.',
        latest_version: { id: 'v1', version: '1.2.0', published_at: PUBLISHED.at },
      },
    ],
  }),
  listOrgPackages: async () => ({ items: [] }),
  uninstallLocal: async () => ({}),
  installPackage: async () => ({}),
  installLocal: async () => ({}),
}));

vi.mock('../../../assistant/assistantBus', () => ({ emitMetadataRefresh: () => {} }));
vi.mock('../../../providers/MetadataProvider', () => ({ useMetadata: () => ({ refresh: () => {} }) }));

import { initRuntimeConfig, resetRuntimeConfigForTesting } from '../../../runtime-config';
import { InstalledList } from '../InstalledListWidget';
import { MarketplacePage } from '../MarketplacePage';

beforeEach(async () => {
  PUBLISHED.at = new Date(Date.now() - 3 * 86_400_000 - 3_600_000).toISOString();
  resetRuntimeConfigForTesting();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        cloudUrl: 'https://cloud.objectos.ai',
        singleEnvironment: true,
        features: { installLocal: true, marketplace: true, aiStudio: true, autoPublishAiBuilds: true },
        branding: { productName: 'ObjectOS', productShortName: 'ObjectOS' },
      }),
    })),
  );
  await initRuntimeConfig();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetRuntimeConfigForTesting();
});

/** An ENGLISH UI (the i18next language) with `locale` declared as the display locale. */
function underSession(locale: string, face: React.ReactElement) {
  return render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <LocalizationProvider value={{ locale }}>{face}</LocalizationProvider>
    </I18nProvider>,
  );
}

/** The installed card's "Installed …" line, under display locale `locale`. */
async function installedLine(locale: string): Promise<string> {
  underSession(locale, <InstalledList />);
  const text = (await screen.findByText(/^Installed /)).textContent ?? '';
  cleanup();
  return text;
}

/** The catalog card's relative published time, under display locale `locale`. */
async function relativeLine(locale: string): Promise<string> {
  underSession(locale, <MarketplacePage />);
  const card = await screen.findByTestId('marketplace-card-com.acme.crm');
  // The relative time is the card's last line; the version badge sits beside it.
  const text = card.querySelector('span.ml-auto')?.textContent ?? '';
  cleanup();
  return text;
}

describe('InstalledList — the install date follows the display locale (objectui#10331)', () => {
  it('formats as de-CH under an English UI with a de-CH display locale', async () => {
    const text = await installedLine('de-CH');
    // The sentence is the English UI's; the date inside it is de-CH's.
    expect(text, `got: ${text}`).toMatch(/^Installed /);
    expect(text, `got: ${text}`).toMatch(/4\.3\.2020/);
    expect(text).toBe(`Installed ${new Date(INSTALLED_AT).toLocaleString('de-CH')}`);
  });

  it('control: formats as en-US under an en-US display locale', async () => {
    const text = await installedLine('en-US');
    expect(text, `got: ${text}`).toMatch(/3\/4\/2020/);
    expect(text).toBe(`Installed ${new Date(INSTALLED_AT).toLocaleString('en-US')}`);
  });

  it('is a reading of the session, not of the machine', async () => {
    expect(await installedLine('de-CH')).not.toBe(await installedLine('en-US'));
  });

  it('the formatter receives the declared tag, never the machine locale', async () => {
    const calls = await recordLocaleArgumentsAsync(async () => {
      await installedLine('de-CH');
    });
    const dates = calls.filter((c) => c.api === 'Date.prototype.toLocaleString');
    expect(dates.length, `saw: ${JSON.stringify(calls).slice(0, 2000)}`).toBeGreaterThan(0);
    expect(dates.every((c) => c.locale === 'de-CH'), `saw: ${JSON.stringify(dates)}`).toBe(true);
    expect(calls.filter(isMachineLocale), 'these call sites formatted in the machine locale').toEqual([]);
  });
});

describe('MarketplacePage — the relative published time follows the display locale (objectui#10331)', () => {
  it('formats as de-CH under an English UI with a de-CH display locale', async () => {
    const text = await relativeLine('de-CH');
    expect(text).toBe('vor 3 Tagen');
    expect(text).toBe(new Intl.RelativeTimeFormat('de-CH', { numeric: 'auto' }).format(-3, 'day'));
  });

  it('control: formats as en-US under an en-US display locale', async () => {
    const text = await relativeLine('en-US');
    expect(text).toBe('3 days ago');
  });

  it('is a reading of the session, not of the machine', async () => {
    expect(await relativeLine('de-CH')).not.toBe(await relativeLine('en-US'));
  });

  it('the formatter receives the declared tag, never the machine locale', async () => {
    const calls = await recordLocaleArgumentsAsync(async () => {
      await relativeLine('de-CH');
    });
    const rtf = calls.filter((c) => c.api === 'Intl.RelativeTimeFormat');
    expect(rtf.length, `saw: ${JSON.stringify(calls).slice(0, 2000)}`).toBeGreaterThan(0);
    expect(rtf.every((c) => c.locale === 'de-CH'), `saw: ${JSON.stringify(rtf)}`).toBe(true);
    expect(calls.filter(isMachineLocale), 'these call sites formatted in the machine locale').toEqual([]);
  });
});
