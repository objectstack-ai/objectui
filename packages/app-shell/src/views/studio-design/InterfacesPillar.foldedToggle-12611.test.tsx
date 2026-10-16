// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12611 — the Interfaces pillar folded (below objectui#11795's
 * width, the properties aside becomes a "Canvas / Properties" toggle): the
 * Properties segment carries a dot while the folded aside holds an editor,
 * so the toggle says where the aside went, and the folded canvas keeps a
 * 16 px gutter instead of 24 so a dashboard's tiles get their width.
 *
 * The fold itself is unchanged (`useIsWideViewport`): jsdom's 1024 px
 * `innerWidth` with `foldInspector` gives the folded layout, as
 * `StudioDesignSurface.selectionLeafScope.test.tsx` measures.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const NAV = [{ id: 'nav_dash', type: 'dashboard', label: 'Overview', dashboardName: 'sales_overview' }];

const mockClient = {
  save: vi.fn(async () => ({})),
  list: vi.fn(async (type: string) => (type === 'app' ? [{ name: 'acme_app', label: 'Acme' }] : [])),
  listDrafts: vi.fn(async () => []),
  layered: vi.fn(async (type: string, name: string) => {
    if (type === 'app') return { effective: { name: 'acme_app', label: 'Acme', navigation: NAV } };
    if (type === 'dashboard') return { effective: { name: 'sales_overview', label: 'Sales' } };
    return { effective: { name } };
  }),
  getDraft: vi.fn(async () => null),
  get: vi.fn(async () => undefined),
  withPreviewDrafts() {
    return this;
  },
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
import { registerMetadataPreview } from '../metadata-admin/preview-registry';
import { registerMetadataInspector } from '../metadata-admin/inspector-registry';
import { t } from '../metadata-admin/i18n';

function StubInspector(): React.ReactElement {
  return <div data-testid="stub-inspector" />;
}

function StubDashboardPreview(props: Record<string, unknown>): React.ReactElement {
  const onSel = props.onSelectionChange as ((s: unknown) => void) | undefined;
  return (
    <button type="button" data-testid="pick-block" onClick={() => onSel?.({ kind: 'block', id: 'blk_1' })}>
      pick
    </button>
  );
}

registerMetadataPreview('dashboard', StubDashboardPreview as never);
registerMetadataInspector('dashboard', StubInspector as never);

afterEach(cleanup);

function mountPillar(foldInspector: boolean) {
  return render(
    <MemoryRouter initialEntries={['/studio/com.acme.app/interfaces']}>
      <InterfacesPillar packageId="com.acme.app" foldInspector={foldInspector} />
    </MemoryRouter>,
  );
}

async function openDashboard() {
  fireEvent.click(await screen.findByTitle('dashboard · sales_overview'));
  await screen.findByTestId('pick-block', undefined, { timeout: 4000 });
}

describe('the folded Interfaces toggle and gutter (objectui#12611)', () => {
  it('the Properties segment carries a dot while the folded aside holds an editor, and only then', async () => {
    mountPillar(true);
    await openDashboard();
    const props = screen.getByTestId('studio-center-tab-properties');
    // Nothing selected and no home inspector registered: the aside holds the
    // "click a block" invitation, so no dot.
    expect(screen.queryByTestId('studio-center-tab-properties-dot')).toBeNull();
    expect(props).not.toHaveAttribute('aria-describedby');

    fireEvent.click(screen.getByTestId('pick-block'));
    const dot = await screen.findByTestId('studio-center-tab-properties-dot', undefined, { timeout: 4000 });
    expect(props.contains(dot)).toBe(true);
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveClass('rounded-full', 'bg-primary');
    // The tab's name stays "Properties"; the dot's meaning is its description.
    expect(props).toHaveAccessibleName(t('engine.studio.inspector.props', 'en'));
    expect(props).toHaveAccessibleDescription(t('engine.studio.inspector.propsHasContent', 'en'));

    fireEvent.click(screen.getByLabelText(t('engine.studio.deselect', 'en')));
    await waitFor(() => expect(screen.queryByTestId('studio-center-tab-properties-dot')).toBeNull());
  });

  it('folded, the canvas keeps a 16 px gutter and the toggle sits on it', async () => {
    mountPillar(true);
    await openDashboard();
    const main = screen.getByTestId('if-canvas-main');
    expect(main).toHaveClass('px-4');
    expect(main).not.toHaveClass('px-6');
    expect(screen.getByTestId('studio-center-tabs').querySelector('[role="tablist"]')).toHaveClass('mx-4');
  });

  it('CONTROL — beside the aside (not folded), the canvas keeps its 24 px gutter and there is no toggle', async () => {
    mountPillar(false);
    await openDashboard();
    const main = screen.getByTestId('if-canvas-main');
    expect(main).toHaveClass('px-6');
    expect(main).not.toHaveClass('px-4');
    expect(screen.queryByTestId('studio-center-tabs')).toBeNull();
  });
});
