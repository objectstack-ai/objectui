/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#13010 — the record page's open waves.
 *
 * Measured on a HotCRM opportunity open (list → record, ~350 ms round trip):
 * the related reference cards read `top=3` in a wave of their own, and then
 * the tab strip's badge read each related list's count AGAIN with `top=1` in a
 * further wave, although the card's own read had already answered `total` for
 * the same question.
 *
 * So this file mounts the REAL page over the REAL adapter on an authored page
 * shaped like HotCRM's opportunity page — a `page:tabs` strip whose Related tab
 * holds `record:related_list` nodes, and a `record:reference_rail` aside with
 * one card per related list — under StrictMode, and logs every request with
 * the WAVE it went out in. A wave is one round of the held transport: every
 * request the page has issued is answered together, then the page is allowed
 * to settle, and whatever it asks for next is the next wave.
 */
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
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
import { RelatedCountStore } from '@object-ui/components';
import { ObjectStackAdapter } from '@object-ui/data-objectstack';
import { __clearRecordEditableCache } from '@object-ui/plugin-detail';
import { __resetRecordApprovalsStore } from '../hooks/useRecordApprovals';
import { RecordDetailView } from './RecordDetailView';

const BASE = 'http://test.local';
const OBJECT = 'os_13010_deal';
const QUOTE = 'os_13010_quote';
const LINE = 'os_13010_line';
const TASK = 'os_13010_task';
const REC = 'rec-13010';

const objectDef = {
  name: OBJECT,
  label: 'Deal',
  managedBy: 'platform',
  fields: {
    id: { label: 'Id', type: 'text' },
    name: { label: 'Name', type: 'text' },
    stage: { label: 'Stage', type: 'text' },
  },
};
const child = (name: string, label: string, fk: string) => ({
  name,
  label,
  managedBy: 'platform',
  fields: {
    id: { label: 'Id', type: 'text' },
    name: { label: 'Name', type: 'text' },
    status: { label: 'Status', type: 'text' },
    [fk]: { label: 'Deal', type: 'lookup', reference: OBJECT },
  },
});
const quoteDef = child(QUOTE, 'Quote', 'deal');
const lineDef = child(LINE, 'Line', 'deal');
const taskDef = child(TASK, 'Task', 'related_deal');
const ALL_OBJECTS = [objectDef, quoteDef, lineDef, taskDef];

const RECORD = { id: REC, name: 'Lattice renewal', stage: 'prospecting' };

/** The declared scope the Open Tasks list carries — the rail card does not. */
const OPEN_TASKS = [{ field: 'status', operator: 'not_equals', value: 'completed' }];

/** Server-side totals per child read, larger than any `top` the page sends. */
const TOTALS: Record<string, number> = { [QUOTE]: 6, [LINE]: 7, [TASK]: 4 };

const relatedList = (id: string, objectName: string, relationshipField: string, extra: Record<string, unknown> = {}) => ({
  type: 'record:related_list',
  id,
  properties: { objectName, relationshipField, columns: ['name', 'status'], limit: 10, ...extra },
});

/** HotCRM's opportunity page, reduced to the blocks this card is about. */
const RECORD_PAGE = {
  name: 'os_13010_deal_detail',
  label: 'Deal',
  type: 'record',
  object: OBJECT,
  kind: 'full',
  template: 'default',
  isDefault: true,
  regions: [
    {
      name: 'main',
      width: 'large',
      components: [
        {
          type: 'page:tabs',
          id: 'deal_tabs',
          properties: {
            items: [
              { value: 'details', label: 'Details', children: [{ type: 'record:details', properties: { sections: [{ name: 'o', label: 'Overview', fields: ['stage'] }] } }] },
              {
                value: 'related',
                label: 'Related',
                children: [
                  relatedList('deal_quotes', QUOTE, 'deal'),
                  relatedList('deal_lines', LINE, 'deal'),
                  relatedList('deal_tasks', TASK, 'related_deal', { filter: OPEN_TASKS }),
                ],
              },
            ],
          },
        },
      ],
    },
    {
      name: 'aside',
      width: 'small',
      components: [
        {
          type: 'record:reference_rail',
          id: 'deal_rail',
          properties: {
            entries: [
              { objectName: QUOTE, relationshipField: 'deal', limit: 3 },
              { objectName: LINE, relationshipField: 'deal', limit: 3 },
              { objectName: TASK, relationshipField: 'related_deal', limit: 3 },
            ],
          },
        },
      ],
    },
  ],
};

interface Held {
  seq: number;
  wave: number;
  method: string;
  path: string;
  body: string;
  released: boolean;
  release: () => void;
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

const childRows = (object: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `${object}-${i}`, name: `${object} row ${i}`, status: 'open' }));

/** The `top` a data read asked for, or undefined. */
const topOf = (h: Held): number | undefined => {
  const q = new URLSearchParams(h.path.slice(h.path.indexOf('?') + 1));
  const top = q.get('top') ?? q.get('$top');
  return top === null ? undefined : Number(top);
};
const objectOf = (h: Held): string | undefined => /\/api\/v1\/data\/([^/?]+)/.exec(h.path)?.[1];
const isRecordRead = (h: Held) => h.method === 'GET' && objectOf(h) === OBJECT;
const isChildRead = (h: Held) => h.method === 'GET' && [QUOTE, LINE, TASK].includes(objectOf(h) ?? '');
const isExplain = (h: Held) => h.path.endsWith('/security/explain');

function answerFor(h: Held): unknown {
  if (isExplain(h)) return { allowed: true, record: { recordId: REC, visible: true } };
  if (h.path.startsWith(`/api/v1/data/${OBJECT}/${REC}`)) return { success: true, data: { object: OBJECT, id: REC, record: RECORD } };
  const object = objectOf(h);
  if (object && object in TOTALS) {
    const total = TOTALS[object];
    const top = topOf(h) ?? total;
    return { success: true, data: { records: childRows(object, Math.min(top, total)), total } };
  }
  if (h.path.startsWith('/api/v1/data/')) return { success: true, data: { records: [], total: 0 } };
  return { success: true, data: [] };
}

function heldTransport() {
  const held: Held[] = [];
  const state = { wave: 1 };
  const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const path = decodeURIComponent(url.replace(BASE, ''));
    if (path.endsWith('/api/v1/discovery')) {
      return Promise.resolve(json({ success: true, data: { capabilities: {}, routes: {} } }));
    }
    return new Promise<Response>((resolve) => {
      const h: Held = {
        seq: held.length,
        wave: state.wave,
        method,
        path,
        body: typeof init?.body === 'string' ? init.body : '',
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
  return { fetch, held, state };
}

async function idle() {
  await act(async () => {
    for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
  });
}

/**
 * Answer the page wave by wave: everything it has asked for so far is answered
 * together, the page settles, and what it asks for next belongs to the next
 * wave. Returns once a wave asks for nothing.
 */
async function runWaves(held: Held[], state: { wave: number }) {
  await idle();
  for (let round = 0; round < 12; round++) {
    const pending = held.filter((h) => !h.released);
    if (pending.length === 0) return;
    state.wave += 1;
    await act(async () => {
      for (const h of pending) h.release();
      await new Promise((r) => setTimeout(r, 0));
    });
    await idle();
  }
  expect(held.filter((h) => !h.released)).toEqual([]);
}

/** A readable wave table for the failure message and the PR's before/after. */
const waveTable = (held: Held[]) =>
  held
    .map((h) => `w${h.wave} ${h.method} ${h.path.replace(/\?.*$/, '')}${topOf(h) !== undefined ? ` top=${topOf(h)}` : ''}${h.body ? ` ${h.body}` : ''}`)
    .join('\n');

/**
 * The rail is on screen, as HotCRM's aside is at a desktop width: every
 * observed element reports intersecting on the next tick.
 */
class VisibleObserver {
  constructor(private readonly cb: (entries: Array<{ isIntersecting: boolean }>) => void) {}
  observe() {
    queueMicrotask(() => this.cb([{ isIntersecting: true }]));
  }
  unobserve() {}
  disconnect() {}
}

async function openRecordPage() {
  const { fetch, held, state } = heldTransport();
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('IntersectionObserver', VisibleObserver);
  const ds = new ObjectStackAdapter({ baseUrl: BASE, fetch, autoReconnect: false });
  await ds.connect();
  (ds as unknown as { getObjectSchema: (n: string) => Promise<unknown> }).getObjectSchema = async (n: string) =>
    ALL_OBJECTS.find((o) => o.name === n) ?? null;

  const objects: unknown[] = ALL_OBJECTS;
  const pages = [RECORD_PAGE];
  const metadata = {
    objects, pages, loading: false, error: null,
    refresh: async () => {}, invalidate: () => {},
    ensureType: async () => pages, getItem: async () => null,
    getItemsByType: () => pages,
  } as never;
  render(
    <React.StrictMode>
      <MemoryRouter initialEntries={[`/apps/demo/${OBJECT}/record/${REC}`]}>
        <MetadataCtx.Provider value={metadata}>
          <RecordDetailView
            dataSource={ds as never}
            objects={objects as never}
            onEdit={() => {}}
            objectNameOverride={OBJECT}
            recordIdOverride={REC}
          />
        </MetadataCtx.Provider>
      </MemoryRouter>
    </React.StrictMode>,
  );
  await runWaves(held, state);
  return { held };
}

beforeEach(() => {
  cleanup();
  __clearRecordEditableCache();
  __resetRecordApprovalsStore();
  RelatedCountStore._reset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  __resetRecordApprovalsStore();
  RelatedCountStore._reset();
});

describe('the record page open waves (objectui#13010)', () => {
  // Wave table measured on this file. Before this card: the record read, both
  // explain questions (one `update`, one `delete` — two different bodies, not
  // one question sent twice) and the rail's three `top=3` card reads in wave
  // 1; the tab strip's three `top=1` badge probes in wave 2, because the probe
  // keyed on the record BODY's id. After it: all thirteen in wave 1.
  it('the related cards and the tab badge probes go out in the first wave, beside the record read', async () => {
    const { held } = await openRecordPage();
    const table = waveTable(held);
    expect(held.filter(isRecordRead).map((h) => h.wave), table).toEqual([1]);

    const cards = held.filter((h) => isChildRead(h) && topOf(h) === 3);
    expect(cards.map((h) => objectOf(h)).sort(), table).toEqual([LINE, QUOTE, TASK].sort());
    expect(cards.every((h) => h.wave === 1), table).toBe(true);

    const probes = held.filter((h) => isChildRead(h) && topOf(h) === 1);
    expect(probes.length, table).toBeGreaterThan(0);
    expect(probes.every((h) => h.wave === 1), table).toBe(true);

    // One wave in all: nothing waits on the record body any more.
    expect(Math.max(...held.map((h) => h.wave)), table).toBe(1);
  });

  it('CONTROL: a badge whose declared filter differs from its card still probes, with its own filter', async () => {
    const { held } = await openRecordPage();
    const table = waveTable(held);
    const taskProbes = held.filter((h) => objectOf(h) === TASK && topOf(h) === 1);
    expect(taskProbes, table).toHaveLength(1);
    expect(taskProbes[0].path, table).toContain('not_equals');
    // The card's read carries no declared scope, so its total answers a
    // different question and never stands in for the badge's.
    const taskCard = held.filter((h) => objectOf(h) === TASK && topOf(h) === 3);
    expect(taskCard, table).toHaveLength(1);
    expect(taskCard[0].path, table).not.toContain('not_equals');
  });

  it('two explain questions on a record open, two different bodies', async () => {
    const { held } = await openRecordPage();
    expect(held.filter(isExplain).map((h) => JSON.parse(h.body).operation).sort(), waveTable(held)).toEqual(['delete', 'update']);
  });
});
