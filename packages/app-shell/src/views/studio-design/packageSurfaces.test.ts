// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Regression guard for the Studio Automations rail hiding authored-but-unpublished
 * flows.
 *
 * The Automations pillar used to load its rail with `client.list('flow', …)` ONLY,
 * which returns published/active metadata. A flow authored (saved as a draft) but
 * not yet published was therefore invisible in the rail — even though the "Changes"
 * counter showed a pending draft existed — while the Data / Interfaces / Access
 * pillars all merged `listDrafts`. `loadPackageSurfaces` is the extracted, shared
 * merge; these tests pin that it unions published + draft items so a draft-only
 * item still appears in its rail.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadPackageLessSurfaces, loadPackageSurfaces, type PackageSurfaceClient } from './packageSurfaces';

function makeClient(
  published: Array<Record<string, unknown>>,
  drafts: Array<{ name?: string | null; packageId?: string | null }> | Error,
): PackageSurfaceClient {
  return {
    list: vi.fn(async () => published),
    listDrafts: vi.fn(async () =>
      drafts instanceof Error ? Promise.reject(drafts) : drafts,
    ) as unknown as PackageSurfaceClient['listDrafts'],
  };
}

describe('loadPackageSurfaces', () => {
  it('includes a draft-only flow that is not in the published list (the bug)', async () => {
    const client = makeClient(
      [{ name: 'ft_hello_flow', label: 'FT Hello' }],
      [{ name: 'ft_draft_only' }],
    );

    const items = await loadPackageSurfaces(client, 'flow', 'fttest_pkg');

    expect(items.map((i) => i.name)).toEqual(['ft_hello_flow', 'ft_draft_only']);
    // Published keeps its real label; the draft-only header has no label, so the
    // machine name stands in until the body loads on selection.
    expect(items).toContainEqual({ type: 'flow', name: 'ft_hello_flow', label: 'FT Hello' });
    expect(items).toContainEqual({ type: 'flow', name: 'ft_draft_only', label: 'ft_draft_only' });
  });

  it('scopes both reads to the package and metadata type', async () => {
    const client = makeClient([], []);
    await loadPackageSurfaces(client, 'flow', 'fttest_pkg');

    expect(client.list).toHaveBeenCalledWith('flow', { packageId: 'fttest_pkg' });
    expect(client.listDrafts).toHaveBeenCalledWith({ packageId: 'fttest_pkg', type: 'flow' });
  });

  it('dedupes by name — a published item shadows a same-named draft (published wins)', async () => {
    const client = makeClient(
      [{ name: 'shared', label: 'Published Label' }],
      [{ name: 'shared' }, { name: 'draft_new' }],
    );

    const items = await loadPackageSurfaces(client, 'flow', 'pkg');

    expect(items).toEqual([
      { type: 'flow', name: 'shared', label: 'Published Label' },
      { type: 'flow', name: 'draft_new', label: 'draft_new' },
    ]);
  });

  it('tolerates a listDrafts failure — still renders the published set', async () => {
    const client = makeClient(
      [{ name: 'ft_hello_flow', label: 'FT Hello' }],
      new Error('drafts endpoint unavailable'),
    );

    const items = await loadPackageSurfaces(client, 'flow', 'pkg');

    expect(items).toEqual([{ type: 'flow', name: 'ft_hello_flow', label: 'FT Hello' }]);
  });

  it('falls back to the machine name when a published row has no label, and skips nameless rows', async () => {
    const client = makeClient(
      [{ name: 'no_label' }, { label: 'orphan-no-name' }],
      [{ name: null }, { name: '' }],
    );

    const items = await loadPackageSurfaces(client, 'flow', 'pkg');

    // Nameless published/draft rows are dropped; a labelless row shows its name.
    expect(items).toEqual([{ type: 'flow', name: 'no_label', label: 'no_label' }]);
  });
});

/**
 * objectui#11553 — the package-less scope's rail. Measured on objectstack
 * 17.6.0: the package-scoped flow list omits a clone (its row names no
 * package), the bare list includes it beside every packaged flow. So this
 * loader reads unscoped and keeps only what names no package, on both halves.
 */
describe('loadPackageLessSurfaces (objectui#11553)', () => {
  it('lists the package-less flow from the unscoped list and drops every packaged one', async () => {
    const client = makeClient(
      [
        { name: 'showcase_urgent_task_alert', label: 'Urgent task alert', _packageId: 'com.example.showcase' },
        { name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' },
      ],
      [],
    );

    const items = await loadPackageLessSurfaces(client, 'flow');

    expect(items).toEqual([{ type: 'flow', name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' }]);
  });

  it('reads both halves UNSCOPED — a package-scoped read cannot see a package-less item', async () => {
    const client = makeClient([], []);
    await loadPackageLessSurfaces(client, 'flow');

    expect(client.list).toHaveBeenCalledWith('flow');
    expect(client.listDrafts).toHaveBeenCalledWith({ type: 'flow' });
  });

  it('keeps a package-less draft-only flow and drops a packaged draft', async () => {
    const client = makeClient(
      [{ name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' }],
      [
        { name: 'qa_urgent_alert_clone', packageId: null },
        { name: 'org_draft_only', packageId: null },
        { name: 'pkg_draft', packageId: 'com.acme.app' },
      ],
    );

    const items = await loadPackageLessSurfaces(client, 'flow');

    expect(items).toEqual([
      { type: 'flow', name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' },
      { type: 'flow', name: 'org_draft_only', label: 'org_draft_only' },
    ]);
  });

  it('tolerates a listDrafts failure like the package loader does', async () => {
    const client = makeClient(
      [{ name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' }],
      new Error('drafts endpoint unavailable'),
    );

    const items = await loadPackageLessSurfaces(client, 'flow');

    expect(items).toEqual([{ type: 'flow', name: 'qa_urgent_alert_clone', label: 'QA urgent alert clone' }]);
  });
});
