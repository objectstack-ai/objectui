/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12860 — Disconnect reads the `unbind` answer.
 *
 * The runtime's `POST /api/v1/cloud-connection/unbind` (objectstack
 * `packages/cloud-connection/src/cloud-connection-plugin.ts`) has three answers
 * this panel can meet, and each fixture below is that file's envelope verbatim:
 *
 *   - `{ success: true, data: { environmentId, revoked: true, cleared } }` —
 *     the control plane acknowledged the revoke. Not connected, no notice.
 *   - the same with `revoked: false` — the credential was cleared locally but
 *     the revoke never reached the cloud, so the cloud account may still list
 *     the connection. Not connected, WITH the notice.
 *   - `403 { success: false, error: { code: 'PERMISSION_DENIED', message } }` —
 *     the `setup.access` gate (objectstack#24148) refused before anything was
 *     revoked or cleared. The connection still exists, so the bound card stays
 *     and says, in the viewer's language, that Setup access is needed.
 *
 * Strings are read from the real `en` / `zh` packs, so the cases prove the
 * viewer's language is chosen without pinning today's copy.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '@object-ui/i18n';
import { builtInLocales } from '@object-ui/i18n/locales';

import { CloudConnectionPanel } from '../CloudConnectionPanel';

type Pack = {
  cloudConnection: {
    bound: { title: string; disconnect: string; disconnectNeedsSetupAccess: string };
    unbound: {
      title: string;
      connect: string;
      revokeNotReached: { disconnected: string; cloudMayList: string; removeInCloud: string };
    };
    waiting: { cancel: string };
    retry: string;
  };
};
const PACKS = {
  en: (builtInLocales.en as unknown as Pack).cloudConnection,
  zh: (builtInLocales.zh as unknown as Pack).cloudConnection,
};
type Lang = keyof typeof PACKS;

/** The producer's own refusal text — must never be what the viewer reads. */
const GATE_MESSAGE = "Managing this runtime's cloud connection requires the `setup.access` capability.";

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const BOUND_STATUS = {
  success: true,
  data: { environmentId: 'env_1', bound: true, connection: { name: 'Acme runtime', organization_id: 'org_1' } },
};
const UNBOUND_STATUS = { success: true, data: { environmentId: 'env_1', bound: false, connection: null } };

const unbindOk = (revoked: boolean) =>
  ({ status: 200, body: { success: true, data: { environmentId: 'env_1', revoked, cleared: true } } });
const UNBIND_REFUSED = {
  status: 403,
  body: { success: false, error: { code: 'PERMISSION_DENIED', message: GATE_MESSAGE } },
};

let bound = true;
let unbindReply: { status: number; body: unknown } = unbindOk(true);

beforeEach(() => {
  bound = true;
  unbindReply = unbindOk(true);
  vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.endsWith('/status')) return reply(200, bound ? BOUND_STATUS : UNBOUND_STATUS);
    if (url.endsWith('/unbind')) {
      // The server clears its credential on every 2xx, whatever `revoked` says.
      if (unbindReply.status === 200) bound = false;
      return reply(unbindReply.status, unbindReply.body);
    }
    // No verification_uri: keeps window.open out of the run.
    if (url.endsWith('/bind/start')) {
      return reply(200, { success: true, data: { device_code: 'dc_1', user_code: 'ABCD-EFGH', interval: 600, expires_in: 900 } });
    }
    throw new Error(`unexpected fetch: ${url}`);
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Mount bound under `lang`, click Disconnect, and let the answer settle. */
async function disconnectUnder(lang: Lang) {
  const t = PACKS[lang];
  render(
    <I18nProvider config={{ defaultLanguage: lang, detectBrowserLanguage: false }} persistLanguage={false}>
      <CloudConnectionPanel />
    </I18nProvider>,
  );
  const button = await screen.findByRole('button', { name: t.bound.disconnect });
  await act(async () => { button.click(); });
  return t;
}

describe('objectui#12860 — Disconnect reads the unbind answer', () => {
  for (const lang of ['en', 'zh'] as const) {
    it(`revoked:false lands on Not connected WITH the notice (${lang})`, async () => {
      unbindReply = unbindOk(false);
      const t = await disconnectUnder(lang);

      expect(await screen.findByText(t.unbound.title)).toBeInTheDocument();
      const notice = screen.getByRole('status');
      expect(notice).toHaveTextContent(t.unbound.revokeNotReached.disconnected);
      expect(notice).toHaveTextContent(t.unbound.revokeNotReached.cloudMayList);
      expect(notice).toHaveTextContent(t.unbound.revokeNotReached.removeInCloud);
    });

    it(`a 403 from the setup.access gate never reads as Not connected (${lang})`, async () => {
      unbindReply = UNBIND_REFUSED;
      const t = await disconnectUnder(lang);

      expect(await screen.findByRole('alert')).toHaveTextContent(t.bound.disconnectNeedsSetupAccess);
      // Still connected: the bound card stays, nothing claims otherwise.
      expect(screen.getByText(t.bound.title)).toBeInTheDocument();
      expect(screen.queryByText(t.unbound.title)).not.toBeInTheDocument();
      expect(screen.queryByText(GATE_MESSAGE)).not.toBeInTheDocument();
    });
  }

  it('revoked:true lands on Not connected with NO notice', async () => {
    unbindReply = unbindOk(true);
    const t = await disconnectUnder('en');

    expect(await screen.findByText(t.unbound.title)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(t.unbound.revokeNotReached.cloudMayList)).not.toBeInTheDocument();
  });

  it('the notice survives an unbound refresh and clears on the next Connect', async () => {
    unbindReply = unbindOk(false);
    const t = await disconnectUnder('en');
    expect(await screen.findByRole('status')).toBeInTheDocument();

    // Connect, then Cancel: Cancel is a status refresh that still finds the
    // server unbound — the notice must not come back after a Connect.
    await act(async () => { screen.getByRole('button', { name: t.unbound.connect }).click(); });
    await act(async () => { (await screen.findByRole('button', { name: t.waiting.cancel })).click(); });

    expect(await screen.findByText(t.unbound.title)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('CONTROL: a 403 with another code (a held session) keeps the error phase and its message', async () => {
    // ADR-0069's held-session refusal is also a 403, with its own code and a
    // message that already says what to do; it is not the setup.access gate.
    unbindReply = {
      status: 403,
      body: { success: false, error: { code: 'PASSWORD_EXPIRED', message: 'Your password has expired.' } },
    };
    const t = await disconnectUnder('en');

    expect(await screen.findByText('Your password has expired.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.retry })).toBeInTheDocument();
    expect(screen.queryByText(t.bound.disconnectNeedsSetupAccess)).not.toBeInTheDocument();
  });
});
