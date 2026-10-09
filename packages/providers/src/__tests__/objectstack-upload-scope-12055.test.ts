/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `createObjectStackUploadAdapter` sends only its own `scope` (objectui#12055).
 *
 * The adapter used to send `scope: opts.scope ?? options.path`, so an adapter
 * built without a scope turned an upload's generic `path` (a key prefix for
 * the S3/Azure presign callbacks) into the storage scope. The server takes
 * only its own scope vocabulary and refuses any other value, so such an
 * upload failed at the presign step.
 *
 * These pins read the presign request body the adapter actually sends,
 * through an injected `fetchImpl` (no global is replaced).
 */

import { describe, it, expect } from 'vitest';

import { createObjectStackUploadAdapter } from '../UploadProvider';

const FILE_ID = 'f-12055';

function recordingFetch() {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/upload/presigned')) {
      return new Response(
        JSON.stringify({ data: { uploadUrl: `/api/v1/storage/upload/put/${FILE_ID}`, fileId: FILE_ID } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  const presignBody = (): Record<string, unknown> => {
    const presign = calls.filter((c) => c.url.endsWith('/upload/presigned'));
    // The probe is not vacuous: exactly one presign request was sent.
    expect(presign).toHaveLength(1);
    return JSON.parse(String(presign[0].init.body)) as Record<string, unknown>;
  };

  return { fetchImpl, calls, presignBody };
}

const file = () => new File(['hello'], 'note.txt', { type: 'text/plain' });

describe('an upload path is never sent as the storage scope (objectui#12055)', () => {
  it('an adapter built without a scope sends no scope when the upload names a path', async () => {
    const { fetchImpl, presignBody } = recordingFetch();
    const adapter = createObjectStackUploadAdapter({ fetchImpl });

    const result = await adapter.upload(file(), { path: 'avatars/' });

    const body = presignBody();
    expect(Object.prototype.hasOwnProperty.call(body, 'scope')).toBe(false);
    expect(body).toEqual({ filename: 'note.txt', mimeType: 'text/plain', size: 5 });
    expect(result.meta?.scope).toBeUndefined();
    // The upload still completes: the server applies its default scope.
    expect(result.meta?.fileId).toBe(FILE_ID);
  });

  it('a scope the adapter was built with is forwarded unchanged, and a path does not replace it', async () => {
    const { fetchImpl, presignBody } = recordingFetch();
    const adapter = createObjectStackUploadAdapter({ fetchImpl, scope: 'attachments' });

    const result = await adapter.upload(file(), { path: 'avatars/' });

    expect(presignBody().scope).toBe('attachments');
    expect(result.meta?.scope).toBe('attachments');
  });
});

describe('the in-repo upload shapes send the same request as before (objectui#12055)', () => {
  it('the app-wide adapter (no scope, no path) sends no scope', async () => {
    const { fetchImpl, presignBody } = recordingFetch();
    const adapter = createObjectStackUploadAdapter({ baseUrl: 'https://api.example.test', fetchImpl });

    await adapter.upload(file(), { onProgress: () => {} });

    expect(presignBody()).toEqual({ filename: 'note.txt', mimeType: 'text/plain', size: 5 });
  });

  it("the attachments adapter (scope 'attachments', no path) sends that scope", async () => {
    const { fetchImpl, presignBody } = recordingFetch();
    const adapter = createObjectStackUploadAdapter({
      baseUrl: 'https://api.example.test',
      scope: 'attachments',
      fetchImpl,
    });

    await adapter.upload(file());

    expect(presignBody()).toEqual({
      filename: 'note.txt',
      mimeType: 'text/plain',
      size: 5,
      scope: 'attachments',
    });
  });
});
