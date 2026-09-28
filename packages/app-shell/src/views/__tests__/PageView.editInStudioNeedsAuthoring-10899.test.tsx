// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * A page's "Edit in Studio" pencil needs the metadata-authoring capability the
 * SERVER reports, not just the workspace-admin role (objectui#10899 item 6, the
 * objectui half of cloud#2434 item 1).
 *
 * Measured on the 2026-09-28 local E2E: a freshly signed-up organization owner
 * — not a platform admin — saw the pencil on the cloud control plane's own
 * `welcome` and pricing pages, and it opened the control plane's page metadata
 * editor. The owner IS a workspace admin (`org_owner`), and that role was the
 * whole gate. The server's answer is different: framework's
 * `organization_admin` permission set declares `systemPermissions:
 * ['manage_org_users', 'setup.access', 'setup.write']` and deliberately
 * withholds `manage_metadata` (ADR-0066), which `GET /api/v1/auth/me/permissions`
 * reports. HomePage's builder CTAs already consume that answer
 * (`useCanAuthorMetadata`); the pencil now does too.
 *
 * Real subjects: `PageView` under the real `MePermissionsProvider`, seeded with
 * the `/me/permissions` payloads each persona receives (`initialPermissions`,
 * so no request is made). The role is the stubbed axis.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ pageName: 'welcome' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/apps/cloud_control/page/welcome', search: '' }),
}));

const viewer = vi.hoisted(() => ({ isAdmin: true }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceAdminStatus: () => ({ isAdmin: viewer.isAdmin, isResolved: true }),
}));

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => String(o?.defaultValue ?? k) }),
}));

vi.mock('../../providers/MetadataProvider', () => ({
  useMetadata: () => ({ pages: [{ name: 'welcome', type: 'page', label: 'Welcome' }], objects: [] }),
}));

vi.mock('../MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false }),
}));

// The page body is not under test — only the chrome around it.
vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => ({}),
  SchemaRenderer: () => <div data-testid="page-body" />,
}));

import { PageView } from '../PageView';

/** `/me/permissions` for a persona, with the fields this surface does not read left empty. */
function mePermissions(systemPermissions: string[] | undefined): MePermissionsResponse {
  return {
    authenticated: true,
    userId: 'u1',
    tenantId: 'org_1',
    roles: [],
    permissionSets: [],
    ...(systemPermissions ? { systemPermissions } : {}),
    objects: {},
    fields: {},
  };
}

/** framework `organization_admin` — what a signed-up org owner holds. */
const ORG_OWNER = mePermissions(['manage_org_users', 'setup.access', 'setup.write']);
/** A metadata author (platform admin / env owner): holds `manage_metadata`. */
const AUTHOR = mePermissions(['manage_metadata', 'studio.access', 'setup.access']);

function mount(perms: MePermissionsResponse) {
  return render(
    <MePermissionsProvider initialPermissions={perms}>
      <PageView />
    </MePermissionsProvider>,
  );
}

beforeEach(() => {
  viewer.isAdmin = true;
});

describe('the page pencil follows the server-reported authoring capability (objectui#10899)', () => {
  it('a workspace admin WITHOUT `manage_metadata` (an org owner) gets no pencil', async () => {
    mount(ORG_OWNER);
    expect(await screen.findByTestId('page-body')).toBeInTheDocument();
    expect(screen.queryByTestId('page-edit-in-studio-button')).not.toBeInTheDocument();
  });

  it('POSITIVE CONTROL — a workspace admin WITH `manage_metadata` keeps the pencil', async () => {
    mount(AUTHOR);
    expect(await screen.findByTestId('page-body')).toBeInTheDocument();
    expect(screen.getByTestId('page-edit-in-studio-button')).toBeInTheDocument();
  });

  it('the role gate still stands — a non-admin holding `manage_metadata` gets no pencil', async () => {
    viewer.isAdmin = false;
    mount(AUTHOR);
    expect(await screen.findByTestId('page-body')).toBeInTheDocument();
    expect(screen.queryByTestId('page-edit-in-studio-button')).not.toBeInTheDocument();
  });

  it('a server that reports NO `systemPermissions` (pre-ADR-0066) keeps today\'s admin pencil — unknown fails open', async () => {
    mount(mePermissions(undefined));
    expect(await screen.findByTestId('page-body')).toBeInTheDocument();
    expect(screen.getByTestId('page-edit-in-studio-button')).toBeInTheDocument();
  });
});
