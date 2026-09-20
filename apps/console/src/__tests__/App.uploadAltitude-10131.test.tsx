/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10131 — the console's upload destination must sit ABOVE the global
 * dialog host, not inside a route element.
 *
 * ## The defect, and why it read as a payload bug
 *
 * `ConnectedShell`'s `GlobalActionRuntimeProvider` renders `{children}` and
 * then `{runtime.dialogs}` + `{modalElement}` as its SIBLINGS. So the
 * action-param dialog and the `ModalForm` a modal action opens (a lookup's
 * inline "create the referenced record"; a related list's New) are mounted
 * BESIDE the route element, not under it. The `UploadProvider` used to be
 * mounted inside `AppContent`, which is the element of exactly one route
 * (`/apps/:appName/*`) — so every one of those dialogs rendered outside it.
 *
 * `useUpload()` fails OPEN: with no provider above it, it silently returns
 * `createObjectUrlAdapter()`, which mints a `blob:` URL locally and reports
 * success. A file picked in one of those dialogs therefore produced ZERO
 * requests, `fileValueForSubmit` stored the legacy inline blob instead of a
 * `sys_file` id, and the engine answered `expected string, received object`.
 * The two halves mask each other: the 400 points at serialisation, while what
 * is missing is the upload.
 *
 * ## What this file measures
 *
 * `ProbeWidget` is mounted where the real dialogs are mounted — as a SIBLING
 * of the route element, by the same wrapper (`ProtectedRoute`) whose
 * `ConnectedShell` renders them. It drives the REAL `FileField` and reports
 * the value the widget hands its host.
 *
 * `AppContent` is deliberately left REAL, with only its two fetching providers
 * stubbed. So the provider this card moved is still mounted in the tree while
 * the probe runs, one level too low — which is what makes the assertion a
 * statement about ALTITUDE rather than about a provider being absent.
 *
 * Two counter-probes, because "the string arrived" and "no upload happened"
 * are each one bit:
 *
 *   1. `renders the defect's own signature with no provider above it` drives
 *      the same widget with no `UploadProvider` anywhere and pins what the
 *      card measured — zero adapter calls, an OBJECT on the wire. A probe
 *      that could not tell those apart would pass here vacuously.
 *   2. `leaves a form with no file field alone` drives a `TextField` through
 *      the same tree: the value is the typed string and the upload adapter is
 *      never touched, so this card's mount point is inert for every other
 *      field.
 *
 * ⛔ Asserting "no 400" would pass on a control that submits nothing at all,
 * so the assertion is on the VALUE: a `sys_file` id string, identical to the
 * one the adapter minted.
 */

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { adapterOptions, uploadSpy, passthrough, stub, MINTED_FILE_ID } = vi.hoisted(() => {
  /** uuid/nanoid-shaped, so `isFileIdToken` accepts it as a reference. */
  const MINTED_FILE_ID = 'f0e1d2c3b4a5968778695a4b3c2d1e0f';
  const adapterOptions: Record<string, unknown>[] = [];
  const uploadSpy = vi.fn(async (file: File | Blob) => ({
    url: `/api/v1/storage/files/${MINTED_FILE_ID}`,
    name: (file as File).name ?? 'upload',
    size: file.size,
    mimeType: file.type,
    meta: { fileId: MINTED_FILE_ID },
  }));
  const passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const stub = (testid: string) => () => <div data-testid={testid} />;
  return { adapterOptions, uploadSpy, passthrough, stub, MINTED_FILE_ID };
});

// The console's OWN adapter factory, replaced by a spy that mints a `sys_file`
// id. `UploadProvider` / `useUpload` stay real — the context lookup is the
// thing under test.
vi.mock('@object-ui/providers', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createObjectStackUploadAdapter: (opts: Record<string, unknown>) => {
    adapterOptions.push(opts);
    return { name: 'spy-objectstack', upload: uploadSpy };
  },
}));

// ── The probe: the real FileField, mounted at the dialog host's altitude ────
import { FileField, TextField } from '@object-ui/fields';

const onValue = vi.fn();

function ProbeWidget({ widget }: { widget: 'file' | 'text' }) {
  if (widget === 'text') {
    return (
      <div data-testid="probe">
        <TextField field={{ name: 'subject', type: 'text' } as never} value="" onChange={onValue} />
      </div>
    );
  }
  return (
    <div data-testid="probe">
      <FileField field={{ name: 'file', type: 'file' } as never} value={undefined} onChange={onValue} />
    </div>
  );
}

let probeWidget: 'file' | 'text' = 'file';

// `ProtectedRoute` is where `ConnectedShell` — and therefore
// `GlobalActionRuntimeProvider` — lives in the real tree. Rendering the probe
// as a sibling of `children` reproduces exactly how that provider renders
// `{runtime.dialogs}` and `{modalElement}` beside the route element.
vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children?: ReactNode }) => (
    <>
      {children}
      <ProbeWidget widget={probeWidget} />
    </>
  ),
}));

// ── AppContent stays REAL; only the two providers that would fetch are cut ──
vi.mock('@object-ui/permissions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  MePermissionsProvider: passthrough,
}));
vi.mock('../LocalizationFetchProvider', () => ({ LocalizationFetchProvider: passthrough }));

vi.mock('@object-ui/app-shell', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ConsoleShell: passthrough,
  ConsoleToaster: () => null,
  DefaultAppContent: stub('default-app-content'),
  LoadingScreen: stub('loading-screen'),
  RedirectWithSplash: stub('redirect-with-splash'),
  RequireAiSurface: passthrough,
  SystemRedirect: () => null,
  DefaultHomeLayout: passthrough,
  DefaultHomePage: stub('home-page'),
  DefaultOrganizationsLayout: passthrough,
  DefaultOrganizationsPage: stub('organizations-page'),
  DefaultOrganizationLayout: stub('organization-layout'),
  DefaultMembersPage: stub('members-page'),
  DefaultInvitationsPage: stub('invitations-page'),
  DefaultSettingsPage: stub('settings-page'),
  DefaultAcceptInvitationPage: stub('accept-invitation-page'),
  DefaultAiChatPage: stub('ai-chat-page'),
  StudioDesignSurface: stub('studio-design-surface'),
  BuilderLanding: stub('builder-landing'),
  getProductName: () => 'ObjectOS',
  getFaviconUrl: () => '',
}));

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  AuthProvider: passthrough,
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../components/RootLandingRedirect', () => ({ RootLandingRedirect: stub('root-landing') }));
vi.mock('../components/SetupRoute', () => ({ SetupRoute: stub('setup-route') }));
vi.mock('../components/FormPage', () => ({ FormPage: stub('form-page') }));
vi.mock('../components/InternalFormRoute', () => ({ InternalFormRoute: stub('internal-form-route') }));
vi.mock('../components/MetadataHmrReloader', () => ({ MetadataHmrReloader: () => null }));
vi.mock('../components/FaviconSync', () => ({ FaviconSync: () => null }));
vi.mock('../components/StudioRoute', () => ({ studioRoutes: null }));
vi.mock('../pages/SharedRecordPage', () => ({ default: stub('shared-record-page') }));
vi.mock('../pages/auth/LoginPage', () => ({ LoginPage: stub('login-page') }));
vi.mock('../pages/auth/RegisterPage', () => ({ RegisterPage: stub('register-page') }));
vi.mock('../pages/auth/ForgotPasswordPage', () => ({ ForgotPasswordPage: stub('forgot-page') }));
vi.mock('../pages/auth/ResetPasswordPage', () => ({ ResetPasswordPage: stub('reset-page') }));
vi.mock('../pages/auth/SetPasswordPage', () => ({ SetPasswordPage: stub('set-password-page') }));
vi.mock('../pages/auth/VerifyEmailPage', () => ({ VerifyEmailPage: stub('verify-email-page') }));
vi.mock('../pages/auth/VerifyEmailPromptPage', () => ({ VerifyEmailPromptPage: stub('verify-prompt-page') }));
vi.mock('../pages/auth/OAuthConsentPage', () => ({ OAuthConsentPage: stub('oauth-consent-page') }));
vi.mock('../pages/auth/DeviceAuthPage', () => ({ DeviceAuthPage: stub('device-auth-page') }));
vi.mock('../dev/DevMasterDetail', () => ({ DevMasterDetail: stub('dev-master-detail') }));
vi.mock('../dev/DevLists', () => ({ DevLists: stub('dev-lists') }));
vi.mock('../dev/DevModal', () => ({ DevModal: stub('dev-modal') }));
vi.mock('../dev/DevLookup', () => ({ DevLookup: stub('dev-lookup') }));
vi.mock('../dev/DevRowActions', () => ({ DevRowActions: stub('dev-row-actions') }));

import { App } from '../App';

/** Drive the widget's hidden native picker with a real `File`. */
function pickAFile() {
  const input = screen
    .getByTestId('probe')
    .querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['bytes'], 'contract.pdf', { type: 'application/pdf' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

beforeEach(() => {
  probeWidget = 'file';
  window.history.pushState({}, '', '/apps/clm/clm_contract_version');
});

afterEach(() => {
  cleanup();
  onValue.mockReset();
  uploadSpy.mockClear();
  adapterOptions.length = 0;
  vi.restoreAllMocks();
});

describe('console upload destination — altitude (objectui#10131)', () => {
  it('reaches a file control mounted beside the route element, and submits the id STRING', async () => {
    render(<App />);
    pickAFile();

    // An upload was attempted at all — the half the card measured as absent.
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));
    // …and the value the widget hands its host is the reference form.
    await waitFor(() => expect(onValue).toHaveBeenCalled());
    const submitted = onValue.mock.calls[0][0];
    expect(typeof submitted).toBe('string');
    expect(submitted).toBe(MINTED_FILE_ID);
  });

  it('builds that adapter with an authenticated fetch, not the bare default', () => {
    render(<App />);
    // The console's own storage client. `RecordAttachmentsPanel` states the
    // requirement it satisfies — "the storage routes require a session and
    // there is no cookie for `credentials: 'include'` to carry" — and
    // `AppContent`'s `/me/permissions` comment records the same session shape
    // ("with the cookie-only default fetch, a token-only session resolved as
    // anonymous"). A SHAPE assertion: that the option is wired, not what the
    // wrapper does, which `createAuthenticatedFetch`'s own tests own.
    expect(adapterOptions).toHaveLength(1);
    expect(typeof adapterOptions[0].fetchImpl).toBe('function');
  });

  it('renders the defect signature when no provider is above the control', async () => {
    // Counter-probe: the SAME widget with nothing above it. `useUpload()`
    // hands back `createObjectUrlAdapter()` without a word.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:probe/1');
    render(<ProbeWidget widget="file" />);
    pickAFile();

    await waitFor(() => expect(onValue).toHaveBeenCalled());
    expect(uploadSpy).not.toHaveBeenCalled();
    const submitted = onValue.mock.calls[0][0];
    expect(typeof submitted).toBe('object');
    expect(submitted).toMatchObject({ original_name: 'contract.pdf', url: 'blob:probe/1' });
  });

  it('leaves a form with no file field alone', async () => {
    probeWidget = 'text';
    render(<App />);
    const input = screen.getByTestId('probe').querySelector('input') as HTMLInputElement;
    expect(input.type).not.toBe('file');

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: 'renewal addendum' } });

    expect(onValue).toHaveBeenCalledWith('renewal addendum');
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});
