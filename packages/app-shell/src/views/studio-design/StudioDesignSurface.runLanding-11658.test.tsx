// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11658 item 1 — the post-build arrival lands on the RUNNING app.
 *
 * After the first AI build the conversation moves into the Studio workbench
 * (objectui#5799). It landed on the 「设计」 canvas with the properties aside
 * open (列数 / 间距 / 自动刷新 squeezed beside the chat). The ruling: land on
 * 「运行」 with the properties collapsed; 「设计」 stays one click away.
 *
 * The post-build navigation asks for that posture with router state
 * (`STUDIO_RUN_LANDING`, see `studioLanding.ts`); the producer half is pinned in
 * `AiChatPage.builtLandsRunning-11658.test.tsx`. Here, the pillar half:
 *
 *  1. an arrival WITH the state opens on 「运行」, design overlays absent, the
 *     properties aside collapsed to its rail;
 *  2. one click on 「设计」 is the whole designer again — overlays AND the
 *     properties aside the landing collapsed;
 *  3. control: an arrival without it (every other Studio entry, the explicit
 *     "Design in Studio" door included) opens on 「设计」 with the aside open,
 *     exactly as before.
 *
 * Same harness as `StudioDesignSurface.canvasMode.test.tsx`: the dashboard leaf,
 * whose design mode is visible as `widget-click-overlay` elements.
 */
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const NAV = [{ id: 'nav_dash', type: 'dashboard', label: 'Overview', dashboardName: 'sales_overview' }];

const DASHBOARD = {
  name: 'sales_overview',
  label: 'Sales Overview',
  widgets: [{ id: 'w1', type: 'metric', title: 'Total', options: { value: 42 } }],
};

const mockClient = {
  list: vi.fn(async (type: string) => (type === 'app' ? [{ name: 'acme_app', label: 'Acme' }] : [])),
  listDrafts: vi.fn(async () => []),
  layered: vi.fn(async (type: string, name: string) => {
    if (type === 'app') return { effective: { name: 'acme_app', label: 'Acme', navigation: NAV } };
    if (type === 'dashboard' && name === 'sales_overview') return { effective: DASHBOARD };
    return { effective: { name } };
  }),
  getDraft: vi.fn(async () => null),
  save: vi.fn(async () => ({})),
  get: vi.fn(async () => undefined),
};

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../metadata-admin/useMetadata')>();
  return { ...mod, useMetadataClient: () => mockClient, useMetadataTypes: () => ({ entries: [] }) };
});

vi.mock('./packages-io', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./packages-io')>();
  return { ...mod, fetchPackages: vi.fn(async () => []) };
});

vi.mock('@object-ui/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@object-ui/react')>();
  return { ...mod, useAdapter: () => ({}) };
});

import { InterfacesPillar } from './StudioDesignSurface';
import { STUDIO_RUN_LANDING } from './studioLanding';
import { registerMetadataPreview } from '../metadata-admin/preview-registry';
import { DashboardPreview } from '../metadata-admin/previews/DashboardPreview';

registerMetadataPreview('dashboard', DashboardPreview);

afterEach(cleanup);

const PATH = '/studio/com.acme.app/interfaces';

/** Render the pillar as a navigation arrives at it, with or without the landing state. */
async function arrive(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[state === undefined ? PATH : { pathname: PATH, state }]}>
      <InterfacesPillar packageId="com.acme.app" />
    </MemoryRouter>,
  );
  // No `?surface=` on the arrival: the pillar auto-opens its first leaf, as it
  // does on the real post-build landing.
  await waitFor(() => expect(screen.getByTestId('canvas-mode-toggle')).toBeInTheDocument(), { timeout: 4000 });
}

const pressed = (name: 'Design' | 'Run') =>
  screen.getByRole('button', { name }).getAttribute('aria-pressed');

describe('the post-build landing (objectui#11658 item 1)', () => {
  it('lands on Run with the properties aside collapsed', async () => {
    await arrive(STUDIO_RUN_LANDING);
    expect(pressed('Run')).toBe('true');
    expect(pressed('Design')).toBe('false');
    // The collapsed rail offers "Show properties"; the open aside's collapse button is absent.
    expect(screen.getByRole('button', { name: 'Show properties' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse properties' })).not.toBeInTheDocument();
    // Run mode is the running app: no design overlays on the dashboard.
    await waitFor(() => expect(screen.getByText('Total')).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.queryAllByTestId('widget-click-overlay')).toHaveLength(0);
  });

  it('one click on Design is the whole designer again — overlays and properties', async () => {
    await arrive(STUDIO_RUN_LANDING);
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    expect(pressed('Design')).toBe('true');
    expect(screen.getByRole('button', { name: 'Collapse properties' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('widget-click-overlay').length).toBeGreaterThan(0), {
      timeout: 4000,
    });
  });

  it('a properties collapse the USER chose survives a later Design click', async () => {
    await arrive(STUDIO_RUN_LANDING);
    // The user takes the aside into their own hands: open it, then close it again.
    fireEvent.click(screen.getByRole('button', { name: 'Show properties' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse properties' }));
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    expect(screen.getByRole('button', { name: 'Show properties' })).toBeInTheDocument();
  });

  it.each([
    ['no state', undefined],
    ['an unrelated state', { from: { pathname: '/apps/acme_app' } }],
  ])('control (%s): every other arrival opens on Design with the aside open', async (_label, state) => {
    await arrive(state);
    expect(pressed('Design')).toBe('true');
    expect(screen.getByRole('button', { name: 'Collapse properties' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show properties' })).not.toBeInTheDocument();
  });
});
