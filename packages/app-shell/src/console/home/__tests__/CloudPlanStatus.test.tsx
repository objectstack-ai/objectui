// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * CloudPlanStatus (`cloud:plan-status`, objectui#10919) marks ONE plan card on
 * the Cloud pricing page: a "Current plan" badge when the organization's plan,
 * read from the authoritative entitlements summary, equals the card's
 * `properties.plan` — and nothing in every other state, so a plan is never
 * guessed.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

let fetchImpl: (url: string, init?: RequestInit) => Promise<unknown>;
const fetchedUrls: string[] = [];

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ activeOrganization: { id: 'org_1' } }),
  createAuthenticatedFetch: () => (url: string, init?: RequestInit) => {
    fetchedUrls.push(url);
    return fetchImpl(url, init);
  },
}));

import { I18nProvider } from '@object-ui/i18n';
import { ComponentRegistry } from '@object-ui/core';
import { AdapterCtx, SchemaRenderer } from '@object-ui/react';
import { CloudPlanStatus } from '../CloudPlanStatus';

/**
 * The badge text resolves from the locale packs, so a real i18n context is
 * needed — without one `t()` returns the raw key and a text assertion would
 * pass against nothing. The adapter is the row-derived fallback's data source;
 * its rows name a production env, so the fallback resolves `derived` for real
 * rather than failing.
 */
const adapter = { find: vi.fn().mockResolvedValue([{ id: 'env_1', environment_type: 'production' }]) };

const renderInShell = (ui: React.ReactElement) =>
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }}>
      <AdapterCtx.Provider value={adapter as never}>{ui}</AdapterCtx.Provider>
    </I18nProvider>,
  );

/** The control plane's `{ success, data }` envelope around a summary naming `plan`. */
function summary(plan: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { plan, hasProductionEnv: true } }),
  };
}

afterEach(() => {
  cleanup();
  fetchedUrls.length = 0;
  adapter.find.mockClear();
});

describe('CloudPlanStatus (objectui#10919)', () => {
  it('marks the card whose plan is the organization\'s plan', async () => {
    fetchImpl = async () => summary('free');
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    expect(await screen.findByText('Current plan')).toBeTruthy();
    expect(container.querySelector('[data-plan-status="current"]')).toBeTruthy();
  });

  it('reads the org-scoped summary endpoint', async () => {
    fetchImpl = async () => summary('free');
    renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    await screen.findByText('Current plan');
    expect(fetchedUrls).toEqual(['/api/v1/cloud/environment-entitlements?organizationId=org_1']);
  });

  it('renders nothing on a card whose plan is not the organization\'s', async () => {
    fetchImpl = async () => summary('team');
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    // Wait until the summary was actually read, so the empty render is a
    // verdict on it and not the loading state.
    await waitFor(() => expect(fetchedUrls).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toBe('');
  });

  it('compares the plan code verbatim — no case folding', async () => {
    fetchImpl = async () => summary('free');
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'Free' }} />);

    await waitFor(() => expect(fetchedUrls).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing while the summary is loading', () => {
    fetchImpl = () => new Promise(() => {});
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the summary fails — the row-derived fallback carries no plan', async () => {
    fetchImpl = async () => ({ ok: false, status: 500, json: async () => null });
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    // The hook fell through to the rows, which resolve (source `derived`) but
    // name no plan — so the card is left unmarked instead of guessed.
    await waitFor(() => expect(adapter.find).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for a bare (un-enveloped) body that names the plan', async () => {
    // A bare body is a producer contract violation (cloud#1046): it yields no
    // summary, so even a `plan` that matches must not mark the card.
    fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ plan: 'free' }) });
    const { container } = renderInShell(<CloudPlanStatus properties={{ plan: 'free' }} />);

    await waitFor(() => expect(adapter.find).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the node names no plan', async () => {
    fetchImpl = async () => summary('free');
    const { container } = renderInShell(<CloudPlanStatus />);

    await waitFor(() => expect(fetchedUrls).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toBe('');
  });
});

describe('`cloud:plan-status` registration (objectui#10919)', () => {
  it('is registered under the one key the page authors, with no second spelling', () => {
    expect(ComponentRegistry.has('cloud:plan-status')).toBe(true);
    // `skipFallback: true` — no bare `plan-status` fallback …
    expect(ComponentRegistry.has('plan-status')).toBe(false);
    // … and no `app-shell:`-prefixed twin.
    expect(ComponentRegistry.has('app-shell:cloud:plan-status')).toBe(false);
  });

  it('renders from a page node through SchemaRenderer, reading `properties.plan`', async () => {
    fetchImpl = async () => summary('team');
    const { container } = renderInShell(
      <SchemaRenderer
        schema={{
          type: 'cloud:plan-status',
          id: 'plan_team_current',
          responsiveStyles: { large: { alignSelf: 'flex-start' } },
          properties: { plan: 'team' },
        } as never}
      />,
    );

    expect(await screen.findByText('Current plan')).toBeTruthy();
    // The node's `responsiveStyles` scope class reaches the badge through
    // `className`, so the page can place it inside its card.
    const scope = container.querySelector('style[data-os-scope]')?.getAttribute('data-os-scope');
    expect(scope).toBeTruthy();
    const badge = container.querySelector('[data-plan-status="current"]');
    expect(badge?.classList.contains(scope as string)).toBe(true);
  });
});
