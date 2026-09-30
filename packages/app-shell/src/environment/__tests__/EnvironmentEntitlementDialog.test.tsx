/**
 * EnvironmentEntitlementDialog renders the friendly upgrade/limit dialog and a
 * CTA that lands on the (control-plane-resolved) upgrade URL.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EnvironmentEntitlementDialog, resolveCtaHref } from '../EnvironmentEntitlementDialog';
import { entitlementDialogFromError, upgradeDialogSpec, type EntitlementDialogSpec } from '../entitlements';

describe('resolveCtaHref', () => {
  it('passes absolute urls through (new tab); mailto is not a new tab', () => {
    expect(resolveCtaHref('https://x.com/p', '')).toEqual({ href: 'https://x.com/p', external: true });
    expect(resolveCtaHref('mailto:a@b.com', 'https://api')).toEqual({ href: 'mailto:a@b.com', external: false });
  });
  it('prefixes a relative url with the api base (dev split origin → new tab)', () => {
    expect(resolveCtaHref('/settings/billing', 'https://cp.example.com'))
      .toEqual({ href: 'https://cp.example.com/settings/billing', external: true });
  });
  it('keeps a relative url same-origin when no api base (prod)', () => {
    expect(resolveCtaHref('/settings/billing', '')).toEqual({ href: '/settings/billing', external: false });
  });
});

describe('EnvironmentEntitlementDialog', () => {
  it('renders the spec + a CTA anchor to the resolved url and closes on click', async () => {
    const onOpenChange = vi.fn();
    render(
      <EnvironmentEntitlementDialog
        apiBase=""
        onOpenChange={onOpenChange}
        state={{
          open: true,
          spec: {
            code: 'DEV_ENV_PLAN_LOCKED',
            title: 'Development environments are a paid feature',
            message: 'Upgrade to add them.',
            cta: { label: 'Upgrade plan', url: '/settings/billing' },
          },
        }}
      />,
    );
    expect(await screen.findByText('Development environments are a paid feature')).toBeTruthy();
    const cta = screen.getByTestId('entitlement-cta-primary');
    expect(cta.getAttribute('href')).toBe('/settings/billing');
    fireEvent.click(cta);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders nothing when closed', () => {
    render(<EnvironmentEntitlementDialog apiBase="" onOpenChange={vi.fn()} state={{ open: false }} />);
    expect(screen.queryByText('Development environments are a paid feature')).toBeNull();
  });
});

// objectui#10437 — the dialog renders the spec the builders produce, so these
// pins go through the REAL builders: a spec hand-written without a `cta` would
// pass whether or not the builders still synthesize a default URL.
describe('EnvironmentEntitlementDialog — no server URL, no upgrade CTA (objectui#10437)', () => {
  const SERVER_UPGRADE_URL = 'https://cloud.example.com/_console/apps/cloud_control/page/pricing';

  const renderSpec = (spec: EntitlementDialogSpec | null) =>
    render(
      <EnvironmentEntitlementDialog
        apiBase=""
        onOpenChange={vi.fn()}
        state={{ open: true, spec: spec ?? undefined }}
      />,
    );

  it('a 403 without upgrade_url opens the dialog with no upgrade anchor', async () => {
    renderSpec(entitlementDialogFromError({ error: { code: 'DEV_ENV_PLAN_LOCKED', details: { plan: 'free' } } }));
    expect(await screen.findByText('Development environments are a paid feature')).toBeTruthy();
    expect(screen.queryByTestId('entitlement-cta-primary')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('the proactive prompt from a state without upgradeUrl renders no upgrade anchor', async () => {
    renderSpec(
      upgradeDialogSpec({ ready: true, hasProductionEnv: true, canCreateDevelopmentEnv: false, plan: 'free', source: 'summary' }),
    );
    expect(await screen.findByText('Development environments are a paid feature')).toBeTruthy();
    expect(screen.queryByTestId('entitlement-cta-primary')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('control: a server-supplied upgrade_url renders the anchor to exactly that URL', async () => {
    renderSpec(
      entitlementDialogFromError({ error: { code: 'DEV_ENV_PLAN_LOCKED', details: { upgrade_url: SERVER_UPGRADE_URL } } }),
    );
    expect(await screen.findByText('Development environments are a paid feature')).toBeTruthy();
    expect(screen.getByTestId('entitlement-cta-primary').getAttribute('href')).toBe(SERVER_UPGRADE_URL);
  });
});
