/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * LoginPage — the dev-seeded admin row (objectui#12600; first shipped as a
 * banner for the framework 15.1 third-party eval).
 *
 * The runtime seeds an admin on an empty dev DB and reports it on
 * `/auth/config` as `devSeedAdmin` ONLY in development while the default
 * password still verifies. The page turns that into the card's last row: a
 * "Local development instance" label and a chip that signs in as that admin
 * through the same `signIn` the form submits with.
 *
 * Pinned here:
 *  - the row renders only when the server reports `devSeedAdmin`;
 *  - ⛔ the password never reaches the DOM — not as text, not in an attribute,
 *    not in a hidden element — read off the whole document's markup;
 *  - the chip hands the reported email and password to `signIn`, and a signed-in
 *    user moves the page to its post-login state;
 *  - a refused sign-in says why and gives the chip back.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@object-ui/auth';
import type { AuthClient } from '@object-ui/auth';
import { LoginPage } from '../LoginPage';

/** Distinctive, so a hit in the markup can only be this value. */
const SEED_PASSWORD = 'seed-Pw-12600-x7q';
const SEED_EMAIL = 'admin@objectos.ai';
const DEV_SEED = { devSeedAdmin: { email: SEED_EMAIL, password: SEED_PASSWORD } };

afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

function createMockClient(
  config: Record<string, unknown>,
  signIn: AuthClient['signIn'] = vi.fn().mockResolvedValue({
    user: { id: 'u1', name: 'Admin', email: SEED_EMAIL },
    session: { token: 'tok' },
  }),
): AuthClient {
  return {
    getSession: vi.fn().mockResolvedValue(null),
    getConfig: vi.fn().mockResolvedValue(config),
    signIn,
  } as unknown as AuthClient;
}

function renderLogin(client: AuthClient) {
  window.history.replaceState({}, '', '/login');
  return render(
    <AuthProvider authUrl="/api/v1/auth" client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('LoginPage — the dev-seeded admin row (objectui#12600)', () => {
  it('renders the row and its sign-in chip when the server reports devSeedAdmin', async () => {
    renderLogin(createMockClient(DEV_SEED));

    const row = await screen.findByTestId('dev-admin-hint');
    expect(row.textContent).toContain('Local development instance');
    const chip = screen.getByTestId('dev-admin-signin');
    expect(chip.textContent).toContain('Sign in as dev admin');
    expect(chip.getAttribute('title')).toBe(SEED_EMAIL);
  });

  it('never puts the password in the DOM: not as text, not in an attribute, not hidden', async () => {
    renderLogin(createMockClient(DEV_SEED));

    await screen.findByTestId('dev-admin-signin');
    expect(document.documentElement.outerHTML).not.toContain(SEED_PASSWORD);
  });

  it('renders no row without devSeedAdmin (production config)', async () => {
    renderLogin(createMockClient({ emailPassword: { enabled: true, disableSignUp: false } }));

    // The form appears once the config read has settled; the row must not.
    await screen.findByLabelText('Email');
    expect(screen.queryByTestId('dev-admin-hint')).toBeNull();
    expect(screen.queryByTestId('dev-admin-signin')).toBeNull();
  });

  it('signs in with the reported email and password through the same signIn the form uses', async () => {
    const signIn = vi.fn().mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: SEED_EMAIL },
      session: { token: 'tok' },
    });
    renderLogin(createMockClient(DEV_SEED, signIn));
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('dev-admin-signin'));

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith({ email: SEED_EMAIL, password: SEED_PASSWORD });
    // A signed-in user moves the page to its post-login state.
    expect(await screen.findByText('Signing you in…')).toBeTruthy();
  });

  it('says why a refused sign-in failed and gives the chip back', async () => {
    const refusal = Object.assign(new Error('Invalid email or password'), {
      code: 'INVALID_EMAIL_OR_PASSWORD',
    });
    const signIn = vi.fn().mockRejectedValue(refusal);
    renderLogin(createMockClient(DEV_SEED, signIn));
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('dev-admin-signin'));

    const row = screen.getByTestId('dev-admin-hint');
    const alert = await waitFor(() => {
      const el = row.querySelector('[role="alert"]');
      expect(el).not.toBeNull();
      return el!;
    });
    expect(alert.textContent).not.toBe('');
    expect((screen.getByTestId('dev-admin-signin') as HTMLButtonElement).disabled).toBe(false);
    expect(document.documentElement.outerHTML).not.toContain(SEED_PASSWORD);
  });

  it('shows the email and no chip for a seed reported without a password', async () => {
    renderLogin(createMockClient({ devSeedAdmin: { email: SEED_EMAIL } }));

    const row = await screen.findByTestId('dev-admin-hint');
    expect(row.textContent).toContain(SEED_EMAIL);
    expect(screen.queryByTestId('dev-admin-signin')).toBeNull();
  });
});
