/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11699 — opening a record page reads the record once and asks each
 * explain question once, with concurrent callers sharing the request.
 *
 * Measured first, against a real ObjectStack showcase backend and a production
 * console build, by request events on a full reload of a task record page:
 * `GET /api/v1/data/OBJ/ID` went out twice at once and
 * `POST /api/v1/security/explain` four times — the `update` and the `delete`
 * question, each asked twice. Caller stacks named the sources:
 *
 *   - both record GETs come from `record:details`' `DetailView`, whose load
 *     effect re-runs (its `schema.sections` is rebuilt on every render of the
 *     block) while its first read is still on the wire;
 *   - each question is asked by the page header (`RecordDetailView`) and by
 *     that `DetailView`, which mounts while the header's answer is pending.
 *
 * Neither host is changed. The two sources now share an in-flight request —
 * `ObjectStackAdapter.findOne` the way `find` already did, and the explain
 * probe in `useRecordEditable` beside its finished-answer memo — so this file
 * mounts the REAL page over the REAL adapter and the REAL hook and counts
 * requests on the wire.
 *
 * The transport HOLDS every request until the test releases it, in the order
 * the measurement saw: the page's side reads answer first, re-rendering the
 * page while the record reads are still pending, and only then the record
 * reads. That ordering is what produced the duplicates; a transport that
 * answered at once would let every read settle before the next caller asked,
 * and pass on the defect.
 *
 * ⚠️ Out of this file's count, by the card's ruling: the header's own
 * `$expand` read (`GET /api/v1/data/OBJ?populate=…`), which the measurement
 * also saw twice — sequentially, the second after the first settled, so no
 * in-flight sharing can absorb it.
 */
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada', image: null }, activeOrganization: null }),
}));
vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRecordPresence: () => [],
  PresenceAvatars: () => null,
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

import { MetadataCtx } from '@object-ui/react';
import { ObjectStackAdapter } from '@object-ui/data-objectstack';
import { __clearRecordEditableCache } from '@object-ui/plugin-detail';
import { RecordDetailView } from './RecordDetailView';

const BASE = 'http://test.local';
const OBJECT = 'os_11699_task';
const REC = 'rec-11699';

const objectDef = {
  name: OBJECT,
  label: 'Task',
  managedBy: 'platform',
  fields: {
    id: { label: 'Id', type: 'text' },
    title: { label: 'Title', type: 'text' },
    status: { label: 'Status', type: 'text' },
    priority: { label: 'Priority', type: 'text' },
    project: { label: 'Project', type: 'lookup', reference: 'os_11699_project' },
    assignee: { label: 'Assignee', type: 'lookup', reference: 'sys_user' },
  },
};

const RECORD = { id: REC, title: 'Ship the record page', status: 'todo', priority: 'high', project: 'p1', assignee: 'u1' };

/**
 * The showcase task page's shape: a highlights strip, then the details body.
 * The strip's fields are de-duplicated out of the body, so the body's own read
 * has nothing to expand and goes to `GET /data/OBJ/ID` — the measured URL.
 */
const RECORD_PAGE = {
  name: 'os_11699_task_detail',
  label: 'Task',
  type: 'record',
  object: OBJECT,
  kind: 'full',
  template: 'default',
  isDefault: true,
  regions: [{
    name: 'main',
    width: 'full',
    components: [
      { type: 'record:highlights', properties: { fields: ['project', 'assignee', 'priority'] } },
      {
        type: 'record:details',
        properties: {
          sections: [{ name: 'overview', label: 'Overview', columns: 2, fields: ['title', 'project', 'assignee', 'status', 'priority'] }],
        },
      },
    ],
  }],
};

interface Held {
  method: string;
  path: string;
  body?: string;
  released: boolean;
  release: () => void;
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

const RECORD_GET = `/api/v1/data/${OBJECT}/${REC}`;
const isRecordRead = (h: Held) => h.method === 'GET' && h.path.startsWith(`/api/v1/data/${OBJECT}`);

/** Answer a held request the way the platform would. */
function answerFor(h: Held): unknown {
  if (h.path.endsWith('/security/explain')) return { allowed: true, record: { recordId: REC, visible: true } };
  if (h.path === RECORD_GET) return { success: true, data: { object: OBJECT, id: REC, record: RECORD } };
  if (h.path.startsWith(`/api/v1/data/${OBJECT}?`)) return { success: true, data: { records: [RECORD], total: 1 } };
  if (h.path.startsWith('/api/v1/data/')) return { success: true, data: { records: [], total: 0 } };
  return { success: true, data: [] };
}

function heldTransport() {
  const held: Held[] = [];
  const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const path = url.replace(BASE, '');
    if (path.endsWith('/api/v1/discovery')) {
      return Promise.resolve(json({ success: true, data: { capabilities: {}, routes: {} } }));
    }
    return new Promise<Response>((resolve) => {
      const h: Held = {
        method,
        path,
        body: typeof init?.body === 'string' ? init.body : undefined,
        released: false,
        release: () => {
          if (h.released) return;
          h.released = true;
          resolve(json(answerFor(h)));
        },
      };
      held.push(h);
    });
  });
  return { fetch, held };
}

async function releaseWhere(held: Held[], pred: (h: Held) => boolean) {
  await act(async () => {
    for (const h of held) if (!h.released && pred(h)) h.release();
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function idle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  cleanup();
  __clearRecordEditableCache();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('record page open: one record GET and one explain per distinct question (objectui#11699)', () => {
  it('counts the requests a record open puts on the wire', async () => {
    const { fetch, held } = heldTransport();
    // The explain probe rides the global fetch when no host apiFetch is
    // provided; the adapter rides the same transport.
    vi.stubGlobal('fetch', fetch);
    const ds = new ObjectStackAdapter({ baseUrl: BASE, fetch, autoReconnect: false });
    await ds.connect();
    // Object metadata is the metadata service's, not this count's.
    (ds as unknown as { getObjectSchema: () => Promise<unknown> }).getObjectSchema = async () => objectDef;

    const metadata = {
      objects: [objectDef], pages: [RECORD_PAGE], loading: false, error: null,
      refresh: async () => {}, invalidate: () => {},
      ensureType: async () => [RECORD_PAGE], getItem: async () => null,
      getItemsByType: () => [RECORD_PAGE],
    } as never;

    render(
      <MemoryRouter initialEntries={[`/apps/demo/${OBJECT}/record/${REC}`]}>
        <MetadataCtx.Provider value={metadata}>
          <RecordDetailView
            dataSource={ds as never}
            objects={[objectDef] as never}
            onEdit={() => {}}
            objectNameOverride={OBJECT}
            recordIdOverride={REC}
          />
        </MetadataCtx.Provider>
      </MemoryRouter>,
    );

    // The body's own read is on the wire while the page's read is pending.
    await waitFor(() => expect(held.some((h) => h.path === RECORD_GET)).toBe(true));
    await idle();

    // The page's side reads answer first — every one of them re-renders the
    // page while the record reads are still pending.
    await releaseWhere(held, (h) => !isRecordRead(h));
    await idle();
    await releaseWhere(held, (h) => !isRecordRead(h));
    await idle();

    // Then the record reads, and anything they set off, until the page asks
    // for nothing more.
    for (let round = 0; round < 10 && held.some((h) => !h.released); round++) {
      await releaseWhere(held, () => true);
      await idle();
    }
    expect(held.filter((h) => !h.released)).toEqual([]);
    // The page really opened the record: the strip shows its values.
    await waitFor(() => expect(screen.getAllByText(RECORD.priority).length).toBeGreaterThan(0));

    const recordGets = held.filter((h) => h.method === 'GET' && h.path === RECORD_GET);
    expect(recordGets).toHaveLength(1);

    const explains = held.filter((h) => h.method === 'POST' && h.path.endsWith('/security/explain'));
    const perQuestion = new Map<string, number>();
    for (const h of explains) {
      const q = JSON.parse(h.body ?? '{}');
      const k = `${q.object}/${q.recordId}/${q.operation}`;
      perQuestion.set(k, (perQuestion.get(k) ?? 0) + 1);
    }
    expect(Object.fromEntries(perQuestion)).toEqual({
      [`${OBJECT}/${REC}/update`]: 1,
      [`${OBJECT}/${REC}/delete`]: 1,
    });
  });
});
