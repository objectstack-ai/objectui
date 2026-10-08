// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11773 — the draft-save version guard, against a door double that
 * answers the way the `/meta` PUT door of `@objectstack/*` 17.7.0 was MEASURED
 * to answer (the readings are on the pull request):
 *
 *  - a `?mode=draft` save returns `{ success, version, seq, state, message }`;
 *    `version` is the token, keyed (`hmac-sha256:…`);
 *  - an `If-Match` that is not the current draft's token — including any token
 *    while no draft row exists — is `409 { error, code: 'METADATA_CONFLICT' }`,
 *    with the current token only inside the prose;
 *  - a destructive change is `409 { error, code: 'DESTRUCTIVE_CHANGE', issues }`
 *    unless `?force=true`, judged BEFORE the version.
 *
 * The client is the REAL `MetadataClient`, so the header on the wire and the
 * parsed refusal are production's, not a hand-built error object.
 */

import { describe, it, expect, vi } from 'vitest';
import { MetadataClient } from '@object-ui/data-objectstack';
import {
  DraftVersionGuard,
  isDraftVersionConflict,
  type DraftConflictChoice,
} from './DraftConflictDialog';

interface SentPut {
  type: string;
  name: string;
  draft: boolean;
  force: boolean;
  ifMatch: string | null;
  body: Record<string, unknown>;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** The measured draft-write door, over `fetch`. */
function measuredDoor() {
  const rows = new Map<string, { body: Record<string, unknown>; version: string }>();
  const puts: SentPut[] = [];
  let seq = 0;
  const rowKey = (type: string, name: string, pkg: string | null, draft: boolean) =>
    `${draft ? 'draft' : 'active'}:${type}/${name}@${pkg ?? ''}`;
  const write = (key: string, body: Record<string, unknown>) => {
    seq += 1;
    const version = `hmac-sha256:${seq.toString(16).padStart(64, '0')}`;
    rows.set(key, { body, version });
    return version;
  };
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const [, , , , type = '', name = ''] = url.pathname.split('/').map(decodeURIComponent);
    if (init?.method !== 'PUT') return json(404, { error: 'not modelled' });
    const draft = url.searchParams.get('mode') === 'draft';
    const force = url.searchParams.get('force') === 'true';
    const ifMatch = new Headers(init.headers).get('If-Match');
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    puts.push({ type, name, draft, force, ifMatch, body });
    if (body.dropsAField && !force) {
      return json(409, {
        error: `${type}/${name} would drop or transform existing data: Field 'subject' removed. — re-submit with ?force=true to proceed.`,
        code: 'DESTRUCTIVE_CHANGE',
        issues: [{ code: 'field_removed', field: 'subject', message: "Field 'subject' removed." }],
      });
    }
    const key = rowKey(type, name, url.searchParams.get('package'), draft);
    const head = rows.get(key)?.version ?? null;
    if (ifMatch !== null && (head === null || ifMatch.replace(/^"|"$/g, '') !== head)) {
      return json(409, {
        error: `${type}/${name} has been modified since you loaded it. The version token sent is not the current version (current is ${head}).`,
        code: 'METADATA_CONFLICT',
      });
    }
    const version = write(key, body);
    return json(200, {
      success: true,
      version,
      seq,
      state: draft ? 'draft' : 'active',
      message: `Saved ${type} '${name}' [seq=${seq}]`,
    });
  }) as typeof fetch;
  return {
    client: new MetadataClient({ baseUrl: 'http://localhost:3000', fetch: fetchImpl }),
    puts,
    /** Another editor's save of the same draft row, outside this guard. */
    savedElsewhere(type: string, name: string, pkg: string, body: Record<string, unknown>) {
      write(rowKey(type, name, pkg, true), body);
    },
    draftBody(type: string, name: string, pkg: string) {
      return rows.get(rowKey(type, name, pkg, true))?.body;
    },
    /** A publish promotes the draft row and drops it (`current is null` after). */
    publishDraft(type: string, name: string, pkg: string) {
      const key = rowKey(type, name, pkg, true);
      const row = rows.get(key);
      if (row) write(rowKey(type, name, pkg, false), row.body);
      rows.delete(key);
    },
  };
}

function guardOver(door: ReturnType<typeof measuredDoor>, answer: DraftConflictChoice = 'cancel') {
  const ask = vi.fn(async () => answer);
  const reload = vi.fn();
  const guard = new DraftVersionGuard({
    client: () => door.client,
    ask,
    reload,
    notSaved: (c) => new Error(`not saved: ${c.type}/${c.name}`),
  });
  return { guard, ask, reload };
}

const DRAFT = { mode: 'draft' as const, packageId: 'com.acme.app' };

describe('DraftVersionGuard — each draft save sends the version the last one received (objectui#11773)', () => {
  it('a first save sends no If-Match; every later save sends the previous receipt\'s version', async () => {
    const door = measuredDoor();
    const { guard, ask } = guardOver(door);
    expect(await guard.save('object', 'acme_task', { label: 'A' }, DRAFT)).toBe('saved');
    expect(await guard.save('object', 'acme_task', { label: 'B' }, DRAFT)).toBe('saved');
    expect(await guard.save('object', 'acme_task', { label: 'C' }, DRAFT)).toBe('saved');
    expect(door.puts.map((p) => p.ifMatch)).toEqual([
      null,
      `hmac-sha256:${'1'.padStart(64, '0')}`,
      `hmac-sha256:${'2'.padStart(64, '0')}`,
    ]);
    expect(ask).not.toHaveBeenCalled();
  });

  it('saves sent back to back go one at a time, so the second never conflicts with the first', async () => {
    const door = measuredDoor();
    const { guard, ask } = guardOver(door);
    await guard.save('object', 'acme_task', { label: 'A' }, DRAFT);
    // An autosave and an explicit save (a column reorder) fired together.
    const [a, b] = await Promise.all([
      guard.save('object', 'acme_task', { label: 'B' }, DRAFT),
      guard.save('object', 'acme_task', { label: 'C' }, DRAFT),
    ]);
    expect([a, b]).toEqual(['saved', 'saved']);
    expect(ask).not.toHaveBeenCalled();
    expect(door.puts[2]!.ifMatch).toBe(`hmac-sha256:${'2'.padStart(64, '0')}`);
    expect(door.draftBody('object', 'acme_task', 'com.acme.app')).toEqual({ label: 'C' });
  });

  it('forget(): a buffer installed from a read holds no version, so its next save is unpinned', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door);
    await guard.save('object', 'acme_task', { label: 'A' }, DRAFT);
    guard.forget();
    await guard.save('object', 'acme_task', { label: 'B' }, DRAFT);
    expect(door.puts.map((p) => p.ifMatch)).toEqual([null, null]);
  });

  it('a version belongs to one item: a save of another item (or package) sends none', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door);
    await guard.save('object', 'acme_task', { label: 'A' }, DRAFT);
    await guard.save('object', 'acme_note', { label: 'N' }, DRAFT);
    await guard.save('object', 'acme_task', { label: 'B' }, { mode: 'draft', packageId: 'com.acme.other' });
    expect(door.puts.map((p) => p.ifMatch)).toEqual([null, null, null]);
  });

  it('a non-draft save passes straight through, unpinned and unrecorded', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door);
    await guard.save('permission', 'sales', { a: 1 }, {});
    await guard.save('permission', 'sales', { a: 2 }, {});
    expect(door.puts.map((p) => [p.draft, p.ifMatch])).toEqual([
      [false, null],
      [false, null],
    ]);
  });
});

describe('DraftVersionGuard — a draft saved elsewhere is not overwritten in silence (objectui#11773)', () => {
  it('the stale save is refused, nothing else is sent, and "reload" hands the buffer back to the caller', async () => {
    const door = measuredDoor();
    const { guard, ask, reload } = guardOver(door, 'reload');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.savedElsewhere('object', 'acme_task', 'com.acme.app', { label: 'mine', description: 'theirs' });

    expect(await guard.save('object', 'acme_task', { label: 'mine, again' }, DRAFT)).toBe('reloaded');
    expect(ask).toHaveBeenCalledWith({ type: 'object', name: 'acme_task' });
    expect(reload).toHaveBeenCalledTimes(1);
    // Their field survives: the refused body was never written.
    expect(door.draftBody('object', 'acme_task', 'com.acme.app')).toEqual({ label: 'mine', description: 'theirs' });
    expect(door.puts).toHaveLength(2);

    // The reloaded buffer was read, not saved: its first save is unpinned.
    await guard.save('object', 'acme_task', { label: 'mine', description: 'theirs', icon: 'x' }, DRAFT);
    expect(door.puts[2]!.ifMatch).toBeNull();
  });

  it('a save queued behind the refused one carries the replaced buffer and is dropped on "reload"', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door, 'reload');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.savedElsewhere('object', 'acme_task', 'com.acme.app', { label: 'theirs' });
    const [first, queued] = await Promise.all([
      guard.save('object', 'acme_task', { label: 'stale 1' }, DRAFT),
      guard.save('object', 'acme_task', { label: 'stale 2' }, DRAFT),
    ]);
    expect([first, queued]).toEqual(['reloaded', 'reloaded']);
    expect(door.puts).toHaveLength(2);
    expect(door.draftBody('object', 'acme_task', 'com.acme.app')).toEqual({ label: 'theirs' });
  });

  it('"overwrite" re-sends the same body without If-Match, wins, and pins the next save to its receipt', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door, 'overwrite');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.savedElsewhere('object', 'acme_task', 'com.acme.app', { label: 'theirs' });

    expect(await guard.save('object', 'acme_task', { label: 'mine, kept' }, DRAFT)).toBe('saved');
    expect(door.puts.slice(1).map((p) => [p.ifMatch === null, p.body])).toEqual([
      [false, { label: 'mine, kept' }],
      [true, { label: 'mine, kept' }],
    ]);
    expect(door.draftBody('object', 'acme_task', 'com.acme.app')).toEqual({ label: 'mine, kept' });

    await guard.save('object', 'acme_task', { label: 'next' }, DRAFT);
    // seq 1 mine, seq 2 theirs, seq 3 the overwrite.
    expect(door.puts[3]!.ifMatch).toBe(`hmac-sha256:${'3'.padStart(64, '0')}`);
  });

  it('"keep editing" sends nothing, rejects, and keeps the stale version so the next save is refused again', async () => {
    const door = measuredDoor();
    const { guard, ask } = guardOver(door, 'cancel');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.savedElsewhere('object', 'acme_task', 'com.acme.app', { label: 'theirs' });

    await expect(guard.save('object', 'acme_task', { label: 'stale' }, DRAFT)).rejects.toThrow(
      'not saved: object/acme_task',
    );
    await expect(guard.save('object', 'acme_task', { label: 'still stale' }, DRAFT)).rejects.toThrow(
      'not saved: object/acme_task',
    );
    expect(ask).toHaveBeenCalledTimes(2);
    expect(door.puts.slice(1).every((p) => p.ifMatch === `hmac-sha256:${'1'.padStart(64, '0')}`)).toBe(true);
    expect(door.draftBody('object', 'acme_task', 'com.acme.app')).toEqual({ label: 'theirs' });
  });

  it('control: once a publish dropped the draft, ANY version is refused — which is why an install must forget()', async () => {
    const door = measuredDoor();
    const { guard, ask } = guardOver(door, 'cancel');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.publishDraft('object', 'acme_task', 'com.acme.app');

    await expect(guard.save('object', 'acme_task', { label: 'after publish' }, DRAFT)).rejects.toThrow('not saved');
    expect(ask).toHaveBeenCalledTimes(1);
    // What every pillar does when the publish reload installs the buffer.
    guard.forget();
    expect(await guard.save('object', 'acme_task', { label: 'after publish' }, DRAFT)).toBe('saved');
    expect(door.puts.map((p) => p.ifMatch === null)).toEqual([true, false, true]);
  });
});

describe('DraftVersionGuard — the door\'s two 409s stay apart (objectui#11773)', () => {
  it('DESTRUCTIVE_CHANGE passes through untouched, and the forced retry carries the same If-Match', async () => {
    const door = measuredDoor();
    const { guard, ask } = guardOver(door, 'overwrite');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);

    const refusal = await guard
      .save('object', 'acme_task', { label: 'mine', dropsAField: true }, DRAFT)
      .catch((e: unknown) => e);
    expect(refusal).toMatchObject({ status: 409, code: 'DESTRUCTIVE_CHANGE' });
    expect(isDraftVersionConflict(refusal)).toBe(false);
    expect(ask).not.toHaveBeenCalled();

    // The caller's own confirmation flow re-sends with `force`.
    expect(await guard.save('object', 'acme_task', { label: 'mine', dropsAField: true }, { ...DRAFT, force: true })).toBe(
      'saved',
    );
    const pinned = `hmac-sha256:${'1'.padStart(64, '0')}`;
    expect(door.puts.slice(1).map((p) => [p.force, p.ifMatch])).toEqual([
      [false, pinned],
      [true, pinned],
    ]);
  });

  it('isDraftVersionConflict reads the code on the parsed refusal, never the prose', async () => {
    const door = measuredDoor();
    const { guard } = guardOver(door, 'cancel');
    await guard.save('object', 'acme_task', { label: 'mine' }, DRAFT);
    door.savedElsewhere('object', 'acme_task', 'com.acme.app', { label: 'theirs' });
    const raw = await door.client
      .save('object', 'acme_task', { label: 'x' }, { ...DRAFT, ifMatch: 'hmac-sha256:stale' })
      .catch((e: unknown) => e);
    expect(raw).toMatchObject({ status: 409, code: 'METADATA_CONFLICT' });
    expect(isDraftVersionConflict(raw)).toBe(true);
    expect(isDraftVersionConflict(Object.assign(new Error('has been modified since you loaded it'), { status: 409 }))).toBe(
      false,
    );
  });
});
