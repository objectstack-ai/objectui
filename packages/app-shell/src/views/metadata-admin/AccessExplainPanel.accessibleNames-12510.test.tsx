// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12510 — the Explain access sheet's controls carry names.
 *
 * The 2026-10-15 test pass read the User picker and the sheet's close button
 * as controls with no name. The browser's computed tree on the Studio's
 * Explain access sheet names the picker by the principal it shows ("Me
 * (calling principal)") and the close button "Close". This pins both by role;
 * the picker is matched on the principal it shows, not on its full name.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createAuthenticatedFetch: () => vi.fn(),
}));
vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => ({ find: vi.fn(async () => []) }),
}));
vi.mock('./useMetadata', () => ({
  useMetadataClient: () => ({ list: async () => [] }),
}));

import { AccessExplainPanel } from './AccessExplainPanel';
import { t } from './i18n';

afterEach(cleanup);

describe('the Explain access sheet names its controls (objectui#12510)', () => {
  it('the user picker is named by the principal it shows, and the sheet closes through "Close"', () => {
    render(<AccessExplainPanel open onOpenChange={() => {}} />);
    const sheet = screen.getByRole('dialog');
    const self = t('engine.studio.access.explain.self', 'en-US');
    expect(within(sheet).getByRole('button', { name: new RegExp(self.replace(/[()]/g, '\\$&')) })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
});
