// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The package door REFUSES the save when its save-time fresh read REJECTS
 * (objectui#9420).
 *
 * ## The defect these pins reach
 *
 * `doSave`'s package-door arm documents an ADR-0086 P0 guarantee: merge only
 * this package's slice back onto a fresh read of the record, so rows
 * contributed by OTHER packages survive byte-for-byte. The fresh read used to
 * be `client.layered(...).catch(() => null)` with `base = fresh?.effective ??
 * payload`, and on the `.catch` arm the guarantee INVERTED: `payload` is the
 * editor's own draft, which the load path already sliced down to this
 * package's objects, so `mergePermissionSlice` had no out-of-scope rows left to
 * copy and the PUT deleted every other package's permission rows. 200, no
 * error, no warning, on a security surface.
 *
 * The card's one-shot probe on the real editor measured exactly that:
 * `saved.objects keys = ["a_account"]`, `saved.fields keys = []`,
 * `b_order present = false`.
 *
 * ## Why the pin drives the REAL editor and not `mergePermissionSlice`
 *
 * The three pins that existed when this file was written could not see this
 * defect, and the shape of each says why: `permission-slice.facetDrift.test.ts`
 * and `permission-slice.authoredKeys.test.ts` call `mergePermissionSlice`
 * directly with a real `base` — they never reach the fallback that CHOOSES the
 * base — and `PermissionMatrixEditor.packageDoorFacets.test.tsx` drives the
 * real `doSave` with `layered` resolving. The defect lives in the choice of
 * base, so a pin has to make that choice happen: real page, real `doSave`,
 * `layered` rejecting for the re-read.
 *
 * ## Why the absences below are readable
 *
 * "`client.save` was not called" is an absence, and an absence is worth nothing
 * without a control that can produce the presence. The resolving-arm test in
 * this file is that control: the same harness, the same edit, the same click —
 * only the re-read's answer differs — and it PUTs, with package B's rows
 * intact. The refusal test additionally asserts `layeredCalls === 2`, so the
 * empty `saved` cannot be a Save button that was never reached.
 *
 * ## What is deliberately NOT refused
 *
 * A record the server does not hold answers the 404 shape, which
 * `MetadataClient.layered` resolves as `{ effective: null, … }` rather than
 * rejecting. That arm keeps the `?? payload` base: a set that exists only as a
 * package draft has no published rows for anyone to lose, and refusing there
 * would block the first save of every set created through the Studio Access
 * pillar's "+ New". Pinned here so the refusal cannot widen onto it by
 * accident.
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * The published record. `a_account` is the door's own package; `b_order` and
 * `b_order.total` are another package's already-published grants — the rows the
 * guarantee exists to protect, and the rows the card measured disappearing.
 */
const PUBLISHED = {
  name: 'sales_perms',
  label: 'Sales',
  objects: {
    a_account: { allowRead: true, allowCreate: true },
    b_order: { allowRead: true, allowEdit: true, viewAllRecords: true },
  },
  fields: { 'b_order.total': { readable: true, editable: true } },
};

/** Distinctive slice of the refusal the author sees on the page's error strip. */
const REFUSAL = /could not be re-read/;

interface Server {
  saved: Array<Record<string, unknown>>;
  savedOpts: Array<Record<string, unknown> | undefined>;
  /** `layered` calls seen so far — #1 is the load, #2 is `doSave`'s re-read. */
  layeredCalls: number;
}

function freshServer(): Server {
  return { saved: [], savedOpts: [], layeredCalls: 0 };
}

const LAYERED_PUBLISHED = {
  effective: PUBLISHED,
  code: null,
  overlay: null,
  overlayScope: null,
};

/** The 404 shape `MetadataClient.layered` resolves for a record it cannot find. */
const LAYERED_NO_RECORD = { effective: null, code: null, overlay: null, overlayScope: null };

/**
 * `afterLoad` is what `layered` answers from call #2 on. Call #1 is always the
 * load, which must succeed or the editor renders a different screen entirely
 * and the test stops being about the save.
 */
function makeClient(
  server: Server,
  afterLoad: 'reject' | 'published' | 'noRecord',
  opts: { load?: typeof LAYERED_PUBLISHED | typeof LAYERED_NO_RECORD; draft?: Record<string, unknown> | null } = {},
) {
  return {
    layered: async () => {
      server.layeredCalls += 1;
      if (server.layeredCalls === 1) return opts.load ?? LAYERED_PUBLISHED;
      if (afterLoad === 'reject') throw new Error('layered read failed');
      return afterLoad === 'noRecord' ? LAYERED_NO_RECORD : LAYERED_PUBLISHED;
    },
    getDraft: async () => (opts.draft ? { type: 'permission', name: 'sales_perms', item: opts.draft } : null),
    // The package declares `a_account` only — which is what narrows the draft
    // and is therefore what makes `payload` an unusable merge base.
    list: async (type: string) => (type === 'object' ? [{ item: { name: 'a_account' } }] : []),
    get: async () => null,
    save: async (
      _type: string,
      _name: string,
      payload: Record<string, unknown>,
      saveOpts?: Record<string, unknown>,
    ) => {
      server.saved.push(payload);
      server.savedOpts.push(saveOpts);
      return payload;
    },
  } as any;
}

let clientImpl: any;

vi.mock('./useMetadata', () => ({
  useMetadataClient: () => clientImpl,
  useMetadataTypes: () => ({
    loading: false,
    error: null,
    entries: [{ type: 'permission', label: 'Permission', allowOrgOverride: true }],
  }),
}));

vi.mock('./AssignedUsersSection', () => ({ AssignedUsersSection: () => null }));

import { PermissionMatrixEditPage } from './PermissionMatrixEditor';

afterEach(cleanup);

function renderDoor(packageId?: string) {
  return render(
    <MemoryRouter>
      <PermissionMatrixEditPage type="permission" name="sales_perms" packageId={packageId} />
    </MemoryRouter>,
  );
}

/** One ordinary edit — the author is not touching anything out of scope. */
function editAccountRow() {
  const row = screen.getByText('a_account').closest('tr')!;
  fireEvent.click(within(row).getByRole('button', { name: 'None' }));
}

function clickSave() {
  fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));
}

describe('PermissionMatrixEditPage — the PACKAGE door refuses rather than delete (objectui#9420)', () => {
  it('does NOT call client.save when the save-time layered re-read rejects', async () => {
    const server = freshServer();
    clientImpl = makeClient(server, 'reject');
    renderDoor('app.a');
    await screen.findByText('a_account');

    editAccountRow();
    clickSave();

    // Settle on EITHER arm before asserting — the refusal reaching the screen,
    // or a PUT landing. Waiting on the refusal alone would make the pre-fix
    // reading a timeout instead of the PUT it is, and waiting on
    // `layeredCalls` alone would race the save that follows it.
    await waitFor(() =>
      expect(server.saved.length > 0 || screen.queryByText(REFUSAL) !== null).toBe(true),
    );

    // CONTROL: the re-read really was attempted and really did reject, so the
    // absence below is a refusal and not a Save that never ran.
    expect(server.layeredCalls).toBe(2);

    // THE PIN. Before the fix this was one PUT whose body had dropped
    // `b_order` and `b_order.total` — the card's measured probe.
    expect(server.saved).toEqual([]);
    expect(server.savedOpts).toEqual([]);

    // The refusal reaches the author on the page's EXISTING error channel —
    // the same strip a failed `client.save` renders into. No new toast path.
    expect(screen.getByText(REFUSAL)).toBeInTheDocument();

    // The page is usable again: `saving` cleared, so the author can retry.
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeEnabled();
  });

  it('CONTROL — the same harness PUTs, with package B intact, when the re-read resolves', async () => {
    const server = freshServer();
    clientImpl = makeClient(server, 'published');
    renderDoor('app.a');
    await screen.findByText('a_account');

    editAccountRow();
    clickSave();

    await waitFor(() => expect(server.saved).toHaveLength(1));
    const body = server.saved[0] as any;

    // The author's edit is on the wire…
    expect(body.objects.a_account).toEqual({});
    // …and so is every row this door does not own (ADR-0086 P0).
    expect(body.objects.b_order).toEqual({
      allowRead: true,
      allowEdit: true,
      viewAllRecords: true,
    });
    expect(body.fields['b_order.total']).toEqual({ readable: true, editable: true });
    expect(server.savedOpts[0]).toMatchObject({ mode: 'draft', packageId: 'app.a' });
    // No refusal on this arm.
    expect(screen.queryByText(REFUSAL)).toBeNull();
  });

  it('still saves a draft-only set, whose re-read RESOLVES with no published layer', async () => {
    // The "+ New" path in the Studio Access pillar: the set exists as a package
    // draft and has never been published, so `layered` answers the 404 shape
    // both times. `payload` is a correct base there — there are no other
    // packages' rows to lose — and refusing would make the set unsavable.
    const server = freshServer();
    const draftBody = { name: 'sales_perms', label: 'Sales', objects: { a_account: { allowRead: true } }, fields: {} };
    clientImpl = makeClient(server, 'noRecord', { load: LAYERED_NO_RECORD, draft: draftBody });
    renderDoor('app.a');
    await screen.findByText('a_account');

    editAccountRow();
    clickSave();

    await waitFor(() => expect(server.saved).toHaveLength(1));
    expect((server.saved[0] as any).objects.a_account).toEqual({});
    expect(server.layeredCalls).toBe(2);
    expect(screen.queryByText(REFUSAL)).toBeNull();
  });
});

describe('PermissionMatrixEditPage — the ENVIRONMENT door is untouched (guard)', () => {
  it('still PUTs the whole record even though the trailing layered read rejects', async () => {
    // No `packageId` ⇒ no slice merge and no pre-save re-read at all, so the
    // refusal must not reach this door. `layered` rejects from call #2 on,
    // which here is the POST-save baseline refresh — it surfaces on the error
    // strip exactly as it did before this change, after the write has landed.
    const server = freshServer();
    clientImpl = makeClient(server, 'reject');
    renderDoor(undefined);
    await screen.findByText('a_account');

    editAccountRow();
    clickSave();

    await waitFor(() => expect(server.saved).toHaveLength(1));
    const body = server.saved[0] as any;
    expect(body.objects.a_account).toEqual({});
    expect(body.objects.b_order).toEqual({
      allowRead: true,
      allowEdit: true,
      viewAllRecords: true,
    });
    // Live whole-record write — no draft/package options (ADR-0086 D7).
    expect(server.savedOpts[0]).toEqual({ force: false });
    // …and the refusal wording never appears on this door.
    expect(screen.queryByText(REFUSAL)).toBeNull();
  });
});
