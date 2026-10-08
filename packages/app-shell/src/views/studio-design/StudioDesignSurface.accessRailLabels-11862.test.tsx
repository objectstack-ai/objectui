// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11862 — the Access pillar's permission-set list shows a set's label
 * as the primary text and its machine name as secondary text.
 *
 * On the maintainer's word 「所有地方以标签为主，机器名只作为次要信息」:
 *
 *  - a set with a label reads as the label, with its machine name beneath it
 *    (small, monospace), and the row's accessible name stays the label;
 *  - CONTROL: a set with no label reads as its name alone, once;
 *  - CONTROL: a set listed from its draft header alone reads as its name
 *    alone — the draft header carries no label, and none is fetched for it.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockClient = {
  list: vi.fn(async (type: string) => {
    if (type === 'permission') return [{ name: 'technician', label: 'Technician' }, { name: 'field_lead' }];
    if (type === 'object') return [{ name: 'a_account' }];
    return [];
  }),
  // A draft-only set: the `_drafts` header carries its name and no label.
  listDrafts: vi.fn(async () => [{ type: 'permission', name: 'dispatcher', packageId: 'app.a' }]),
  layered: vi.fn(async (_type: string, name: string) => ({
    effective: { name, label: name === 'technician' ? 'Technician' : undefined, objects: {}, fields: {} },
    code: null,
    overlay: null,
    overlayScope: null,
  })),
  getDraft: vi.fn(async () => null),
  get: vi.fn(async () => null),
  save: vi.fn(async () => ({})),
};

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMetadataClient: () => mockClient,
    useMetadataTypes: () => ({
      loading: false,
      error: null,
      entries: [{ type: 'permission', label: 'Permission', allowOrgOverride: true }],
    }),
  };
});
vi.mock('../../components/SuggestedBindingsPanel', () => ({ SuggestedBindingsPanel: () => null }));
vi.mock('../metadata-admin/AccessExplainPanel', () => ({ AccessExplainPanel: () => null }));
vi.mock('./StudioAiCopilot', () => ({ StudioChatDock: () => null }));

import { AccessPillar } from './StudioDesignSurface';

// jsdom has no matchMedia — useIsMobile (rail overlay) needs a stub.
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

afterEach(cleanup);

function renderPillar() {
  render(
    <MemoryRouter>
      <AccessPillar packageId="app.a" />
    </MemoryRouter>,
  );
}

describe('objectui#11862 — the permission-set list: label first, machine name second', () => {
  it('a set with a label reads as the label, its machine name as secondary text', async () => {
    renderPillar();
    const row = await screen.findByRole('button', { name: 'Technician' });
    expect(within(row).getByText('Technician')).toBeInTheDocument();
    expect(within(row).getByText('technician')).toHaveClass('font-mono', 'text-[10px]');
    expect(within(row).getByText('technician')).toHaveAttribute('aria-hidden', 'true');
  });

  it('CONTROL: a set with no label reads as its name alone, once', async () => {
    renderPillar();
    const row = await screen.findByRole('button', { name: 'field_lead' });
    expect(within(row).getAllByText('field_lead')).toHaveLength(1);
  });

  it('CONTROL: a set listed from its draft header alone reads as its name alone', async () => {
    renderPillar();
    const row = await screen.findByRole('button', { name: 'dispatcher' });
    expect(within(row).getAllByText('dispatcher')).toHaveLength(1);
  });
});
