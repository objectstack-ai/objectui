// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12808 — one `GET /cloud/environment-entitlements` per organisation,
 * however many readers are mounted.
 *
 * The Cloud pricing page mounts three `cloud:plan-status` nodes (one per plan
 * card) and the Welcome page mounts `cloud:onboarding-next` beside
 * `cloud:workspace-timezone-notice`. Each used to issue its own GET, and Chrome
 * serialises identical in-flight GETs, so the requests cost one round trip each,
 * in series. Every reader now shares one organisation-keyed resource.
 *
 * The count is taken at the one seam every reader's request goes through
 * (`createAuthenticatedFetch`), with the five real widgets mounted together.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act, renderHook } from '@testing-library/react';
import React from 'react';

let orgId = 'org_1';
const entitlementGets: string[] = [];

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ activeOrganization: { id: orgId } }),
  createAuthenticatedFetch: () => async (url: string) => {
    if (url.includes('/cloud/environment-entitlements')) entitlementGets.push(url);
    const org = new URL(url, 'http://x.test').searchParams.get('organizationId');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          plan: org === 'org_2' ? 'pro' : 'free',
          hasProductionEnv: true,
          workspaceTimezoneSeed: 'Asia/Shanghai',
        },
      }),
    };
  },
}));

import { I18nProvider } from '@object-ui/i18n';
import { AdapterCtx } from '@object-ui/react';
import { CloudPlanStatus } from '../../console/home/CloudPlanStatus';
import { CloudOnboardingNext } from '../../console/home/CloudOnboardingNext';
import { CloudWorkspaceTimezoneNotice } from '../../console/home/CloudWorkspaceTimezoneNotice';
import { useEnvironmentEntitlements } from '../useEnvironmentEntitlements';

const adapter = { find: vi.fn().mockResolvedValue([]) };

function Page() {
  return (
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      <AdapterCtx.Provider value={adapter as never}>
        <CloudPlanStatus properties={{ plan: 'free' }} />
        <CloudPlanStatus properties={{ plan: 'pro' }} />
        <CloudPlanStatus properties={{ plan: 'enterprise' }} />
        <CloudOnboardingNext properties={{}} />
        <CloudWorkspaceTimezoneNotice />
      </AdapterCtx.Provider>
    </I18nProvider>
  );
}

/** Let any request a mount would still start get started and settled. */
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

afterEach(() => {
  cleanup();
  entitlementGets.length = 0;
  orgId = 'org_1';
});

describe('one entitlements request per organisation (objectui#12808)', () => {
  it('five readers mounted together issue one GET, and every reader gets the answer', async () => {
    render(<Page />);

    expect(await screen.findByText('Current plan')).toBeTruthy();
    expect(await screen.findByText(/Asia\/Shanghai/)).toBeTruthy();
    await waitFor(() => expect(document.querySelector('[data-onboarding="ready"]')).toBeTruthy());
    await flush();

    expect(entitlementGets).toEqual(['/api/v1/cloud/environment-entitlements?organizationId=org_1']);
  });

  it('CONTROL: an organisation change issues exactly one more', async () => {
    const view = render(<Page />);
    await screen.findByText('Current plan');
    await flush();
    expect(entitlementGets).toHaveLength(1);

    orgId = 'org_2';
    view.rerender(<Page />);
    // The `pro` card is the one marked now: every reader moved to org_2's answer.
    await waitFor(() =>
      expect(document.querySelectorAll('[data-plan-status="current"]')).toHaveLength(1),
    );
    await flush();

    expect(entitlementGets).toEqual([
      '/api/v1/cloud/environment-entitlements?organizationId=org_1',
      '/api/v1/cloud/environment-entitlements?organizationId=org_2',
    ]);
  });

  it('CONTROL: a refreshKey change re-resolves once, for every reader', async () => {
    const authFetch = (await import('@object-ui/auth')).createAuthenticatedFetch();
    const opts = { enabled: true, dataSource: adapter, authFetch, apiBase: '' };
    const other = renderHook(() => useEnvironmentEntitlements(opts));
    const list = renderHook(({ refreshKey }) => useEnvironmentEntitlements({ ...opts, refreshKey }), {
      initialProps: { refreshKey: 0 },
    });
    await waitFor(() => expect(list.result.current?.source).toBe('summary'));
    await flush();
    expect(entitlementGets).toHaveLength(1);
    const before = other.result.current;

    list.rerender({ refreshKey: 1 });
    await waitFor(() => expect(other.result.current).not.toBe(before));
    await flush();

    expect(entitlementGets).toHaveLength(2);
    expect(list.result.current).toBe(other.result.current);
  });

  it('CONTROL: the answer does not outlive its readers — a later mount asks again', async () => {
    const first = render(<Page />);
    await screen.findByText('Current plan');
    await flush();
    first.unmount();
    await flush();

    render(<Page />);
    await screen.findByText('Current plan');
    await flush();

    expect(entitlementGets).toHaveLength(2);
  });
});
