// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#8676 — `MetadataClient.save` is a DOOR, and it applies the
 * object-metadata write invariant.
 *
 * ## What this pins that the guard's own suite cannot
 *
 * The guard's suite proves the function refuses. This proves the DOOR REACHES
 * IT — which is the half objectui#7714 lost. That ruling's invariant was
 * implemented, correct, and pinned, and it still did not hold for twelve of
 * fifteen write call sites, because nothing connected the two facts. So the
 * load-bearing assertion here is not "it throws": it is ⭐ **no request was
 * issued**. A guard that fires after the bytes leave has not held the draft
 * client-side, which is the behaviour the ruling actually names.
 *
 * ⚠ Every refusal below is measured against a LIT CONTROL on the same harness —
 * the same call with a usable target, observed to reach `fetch` and resolve. A
 * "no request was issued" assertion is worthless beside a harness that never
 * issues one.
 */

import { describe, expect, it, vi } from 'vitest';
import { MetadataClient } from './metadata-client';

function okResponse(): Response {
  return new Response(JSON.stringify({ success: true, version: 'v1' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function harness() {
  const fetchImpl = vi.fn(async () => okResponse());
  const client = new MetadataClient({
    baseUrl: 'http://test.local',
    fetch: fetchImpl as unknown as typeof fetch,
  });
  return { client, fetchImpl };
}

const HALF_FILLED = {
  name: 'account',
  label: 'Account',
  fields: {
    title: { type: 'text', label: 'Title' },
    owner: { type: 'lookup', label: 'Owner' },
  },
};

const COMPLETE = {
  name: 'account',
  label: 'Account',
  fields: {
    title: { type: 'text', label: 'Title' },
    owner: { type: 'lookup', label: 'Owner', reference: 'contact' },
  },
};

describe('MetadataClient.save — the door applies the object-metadata write guard', () => {
  it('refuses a half-filled relationship AND ISSUES NO REQUEST', async () => {
    const { client, fetchImpl } = harness();
    await expect(client.save('object', 'account', HALF_FILLED, { mode: 'draft' }))
      .rejects.toThrow(/`owner`/);
    // ⭐ The discriminating assertion. A guard that ran after the request would
    // satisfy the rejection above and fail this line.
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('CONTROL — the same harness DOES issue the PUT when the target is usable', async () => {
    const { client, fetchImpl } = harness();
    await client.save('object', 'account', COMPLETE, { mode: 'draft' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/meta/object/account');
    expect(init.method).toBe('PUT');
  });

  it('CONTROL — a non-object type with the same field shape still reaches the wire', async () => {
    // The door serves every metadata type. The guard must not leak into them.
    const { client, fetchImpl } = harness();
    await client.save('view', 'account_list', HALF_FILLED);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('refuses the ARRAY `fields` shape at the door too, and still issues nothing', async () => {
    const { client, fetchImpl } = harness();
    const body = { name: 'account', fields: [{ name: 'owner', type: 'lookup', label: 'Owner' }] };
    await expect(client.save('object', 'account', body)).rejects.toThrow(/`owner`/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('the message names the door, so an author sees where the write stopped', async () => {
    const { client } = harness();
    await expect(client.save('object', 'account', HALF_FILLED))
      .rejects.toThrow(/^MetadataClient\.save refused/);
  });
});
