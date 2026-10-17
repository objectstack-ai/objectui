// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * CloudOnboardingNext resolves `hasProductionEnv` from the entitlements summary
 * and shows the right primary next-step: "Create your environment" when the org
 * has none, "Open" once it does, and a graceful both-actions fallback
 * when the signal can't be resolved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const navigateMock = vi.fn();
let fetchImpl: (url: string, init?: any) => Promise<any>;

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ activeOrganization: { id: 'org_1' } }),
  createAuthenticatedFetch: () => (url: string, init?: any) => fetchImpl(url, init),
}));

import { I18nProvider } from '@object-ui/i18n';
import { CloudOnboardingNext } from '../CloudOnboardingNext';

/**
 * The CTA labels resolve from the locale packs (objectui#2871), so these
 * renders need a real i18n context — without one `t()` returns the raw key and
 * these assertions would pass against nothing. Pinned to `en` with browser
 * detection off so the expectations stay deterministic.
 */
const renderOnboarding = (ui: React.ReactElement, language: 'en' | 'zh' = 'en') =>
  render(
    <I18nProvider config={{ defaultLanguage: language, detectBrowserLanguage: false }}>
      {ui}
    </I18nProvider>,
  );

function summary(hasProductionEnv: boolean) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: { hasProductionEnv } }),
  };
}

const PROPS = {
  properties: {
    openProductionUrl: '/api/v1/cloud/environments/production/sso-open',
    environmentsRoute: '/apps/cloud_control/sys_environment',
  },
};

describe('CloudOnboardingNext', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('shows "Create your environment" when the org has no production env', async () => {
    fetchImpl = async () => summary(false);
    renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    const create = await screen.findByText('Create your environment');
    expect(create).toBeTruthy();
    expect(screen.queryByText('Open')).toBeNull();

    fireEvent.click(create);
    // Deep-links into the create dialog (#844): the environments list consumes
    // `runAction=create_environment` and auto-opens its create action.
    expect(navigateMock).toHaveBeenCalledWith(
      '/apps/cloud_control/sys_environment?runAction=create_environment',
    );
  });

  it('shows "Open" once the org has a production env', async () => {
    fetchImpl = async () => summary(true);
    renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    expect(await screen.findByText('Open')).toBeTruthy();
    expect(screen.queryByText('Create your environment')).toBeNull();
  });

  it('degrades to the Open actions when the signal cannot be resolved', async () => {
    fetchImpl = async () => ({ ok: false, status: 500, json: async () => null });
    renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    // Unknown state is fail-safe: it must NEVER strand a real user behind a
    // wrong "create" CTA, so it shows Open + Manage environments.
    expect(await screen.findByText('Open')).toBeTruthy();
    expect(screen.getByText('Manage environments')).toBeTruthy();
    expect(screen.queryByText('Create your environment')).toBeNull();
  });

  // Strict envelope pins (#3352): the control plane wraps success bodies as
  // `{ success, data }`, so a BARE body is a producer contract violation and
  // must NOT produce a usable summary. It resolves to `unknown` (both actions
  // work) instead of being read field-by-field off the wrong shape.
  it('does NOT read a bare (un-enveloped) body as a usable summary', async () => {
    fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ hasProductionEnv: true }),
    });
    const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    await waitFor(() =>
      expect(container.querySelector('[data-onboarding="unknown"]')).toBeTruthy(),
    );
    expect(container.querySelector('[data-onboarding="ready"]')).toBeNull();
  });

  it('never strands a user behind a wrong "create" CTA when the envelope is missing', async () => {
    // The silent-degradation case the strict read exists to kill: an
    // un-enveloped body whose `hasProductionEnv` reads as absent used to
    // resolve to `ready:false` and show "Create your environment" to an org
    // that already HAS a production env.
    fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ hasProductionEnv: false }),
    });
    const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    expect(await screen.findByText('Open')).toBeTruthy();
    expect(screen.queryByText('Create your environment')).toBeNull();
    expect(container.querySelector('[data-onboarding="unknown"]')).toBeTruthy();
  });

  // objectui#11659 ruling 1: the cloud home's primary button names the place in
  // the customer's words. A new customer has exactly one environment, and
  // "production" is operator vocabulary, so neither the button nor the hint
  // under it says it. The destination is unchanged: the same sso-open URL.
  describe('the ready state opens the environment, and never says production (objectui#11659, objectui#12851)', () => {
    it('zh: the primary button reads 打开 and the block never says 生产环境', async () => {
      fetchImpl = async () => summary(true);
      const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />, 'zh');

      const open = await screen.findByRole('button', { name: '打开' });
      expect(container.querySelector('[data-onboarding="ready"]')).toBeTruthy();
      expect(container.textContent).not.toContain('生产环境');

      // Destination unchanged: the button still navigates to the page's sso-open URL.
      const assign = vi.fn();
      const original = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...original, set href(v: string) { assign(v); }, get href() { return original.href; } },
      });
      try {
        fireEvent.click(open);
      } finally {
        Object.defineProperty(window, 'location', { configurable: true, value: original });
      }
      expect(assign).toHaveBeenCalledWith(PROPS.properties.openProductionUrl);
    });

    it('en: the primary button reads "Open" and the block never says production', async () => {
      fetchImpl = async () => summary(true);
      const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />);

      expect(await screen.findByRole('button', { name: 'Open' })).toBeTruthy();
      expect(container.textContent ?? '').not.toMatch(/production/i);
    });
  });

  // objectui#12851 (ruling on objectstack-ai/cloud#2939, letter A): the running
  // instance is 「环境」, and the hint under the buttons says in one line what an
  // environment is. 「工作区」 is retired from this block in both states.
  describe('the hint says what an environment is (objectui#12851)', () => {
    it('zh: the create-state hint defines 环境 and never says 工作区', async () => {
      fetchImpl = async () => summary(false);
      const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />, 'zh');

      expect(await screen.findByText('环境是运行你的应用的独立实例，有自己的网址、数据库和套餐。')).toBeTruthy();
      expect(container.textContent).not.toContain('工作区');
    });

    it('zh: the ready-state hint says the environment is ready, beside the 打开 button', async () => {
      fetchImpl = async () => summary(true);
      const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />, 'zh');

      expect(await screen.findByRole('button', { name: '打开' })).toBeTruthy();
      expect(screen.getByText('你的环境已就绪——它是运行你的应用的独立实例，有自己的网址、数据库和套餐。')).toBeTruthy();
      expect(container.textContent).not.toContain('工作区');
    });

    it('en (control): the ready-state hint names the environment and never says workspace', async () => {
      fetchImpl = async () => summary(true);
      const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />);

      expect(await screen.findByRole('button', { name: 'Open' })).toBeTruthy();
      expect(
        screen.getByText('Your environment is ready — a private instance that runs your apps, with its own URL, database, and plan.'),
      ).toBeTruthy();
      expect(container.textContent ?? '').not.toMatch(/workspace/i);
    });
  });

  it('renders a non-CTA skeleton while the signal is still loading', async () => {
    let resolveFetch: (v: any) => void = () => {};
    fetchImpl = () => new Promise((r) => { resolveFetch = r; });
    const { container } = renderOnboarding(<CloudOnboardingNext {...PROPS} />);

    // Before the fetch resolves: no CTA text, just the skeleton placeholder.
    expect(screen.queryByText('Open')).toBeNull();
    expect(screen.queryByText('Create your environment')).toBeNull();
    expect(container.querySelector('[data-onboarding="loading"]')).toBeTruthy();

    resolveFetch(summary(true));
    await waitFor(() => expect(screen.getByText('Open')).toBeTruthy());
  });
});
