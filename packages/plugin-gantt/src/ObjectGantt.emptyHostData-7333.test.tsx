/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7333 — an EMPTY host `data` array is "no host rows yet", not "the
 * host owns zero rows".
 *
 * `ObjectGantt` read a host `data` prop at two sites, and both took `[]` as an
 * authoritative answer: `reload`'s short-circuit (`data && Array.isArray(data)`
 * — `[]` is truthy) adopted it and returned before the chart's own query, and
 * the gating flag (`Array.isArray(data)`) switched off the object-schema gate
 * and the invalidation subscription that belong to that query. So a gantt whose
 * `data` names its own source painted an EMPTY chart the moment a host handed
 * it an array it had not filled yet.
 *
 * Both sites now read one predicate, `hostRows` in `ObjectGantt.tsx`: a
 * non-empty host array is adopted as it always was, and an empty one leaves the
 * chart reading from its own source, exactly as with no host array at all.
 *
 * ⚠️ Reach: the registered `object-gantt` renderer forwards no host prop, which
 * `ObjectGantt.hostDataProp-7210.test.tsx` pins, and `ObjectGanttProps` does
 * not declare `data`. So every case here renders `ObjectGantt` directly and
 * spreads the prop in, as a direct caller would have to.
 *
 * Cases 1 and 4 are the pins; 2 and 3 are their controls, and 5 is the "yet":
 *   1. api provider + host `[]` ⇒ the endpoint is read and its rows paint;
 *   2. api provider + host rows ⇒ those rows paint, the endpoint is never read;
 *   3. api provider + no host `data` ⇒ the endpoint is read;
 *   4. object provider + host `[]` ⇒ the query waits for the object schema and
 *      goes out ONCE, already expanded (the gating flag's half);
 *   5. host rows that arrive after an empty first render are adopted.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchemaRendererProvider } from '@object-ui/react';
import { ObjectGantt } from './ObjectGantt';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

vi.mock('./GanttView', () => ({
  GanttView: ({ tasks }: any) => (
    <div data-testid="gantt-view" data-task-count={String(tasks.length)}>
      {tasks.map((t: any) => (
        <div key={t.id} data-testid={`gv-task-${t.id}`}>{t.title}</div>
      ))}
    </div>
  ),
}));

vi.mock('@object-ui/plugin-detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-detail')>()),
  RecordDetailDrawer: () => null,
  deriveRecordPageHref: () => null,
}));

/** What the gantt's own `api` endpoint answers with. */
const ENDPOINT_ROWS = [
  { id: 'e1', name: 'Endpoint task 1', start_date: '2026-01-01', end_date: '2026-01-05' },
  { id: 'e2', name: 'Endpoint task 2', start_date: '2026-01-02', end_date: '2026-01-06' },
];

/** What a host hands down as `data` when it DOES have rows. */
const HOST_ROWS = [
  { id: 'h1', name: 'Host task 1', start_date: '2026-02-01', end_date: '2026-02-03' },
];

const ENDPOINT = '/api/gantt/tree';

function apiSchema(): any {
  return {
    type: 'object-gantt',
    objectName: 'tasks',
    gantt: { titleField: 'name', startDateField: 'start_date', endDateField: 'end_date' },
    data: { provider: 'api', read: { url: ENDPOINT, method: 'GET' } },
  };
}

function makeApiFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify({ data: ENDPOINT_ROWS, total: ENDPOINT_ROWS.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/** The URLs the endpoint was read at, in order. */
function readUrls(apiFetch: ReturnType<typeof makeApiFetch>): string[] {
  return (apiFetch.mock.calls as unknown as Array<[unknown]>).map(([url]) => String(url));
}

/** Renders an api-provider gantt, spreading `hostProps` in as a direct caller would. */
function renderApiGantt(apiFetch: ReturnType<typeof makeApiFetch>, hostProps: Record<string, unknown>) {
  const tree = (props: Record<string, unknown>) => (
    <SchemaRendererProvider dataSource={null} apiFetch={apiFetch as any}>
      <ObjectGantt schema={apiSchema()} {...(props as any)} />
    </SchemaRendererProvider>
  );
  const utils = render(tree(hostProps));
  return { ...utils, rerenderWith: (props: Record<string, unknown>) => utils.rerender(tree(props)) };
}

const taskCount = () => screen.getByTestId('gantt-view').getAttribute('data-task-count');

/** Lets every in-flight read settle, so a query that would follow is counted. */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

describe('objectui#7333 — an api-provider gantt handed an EMPTY host array still reads its endpoint', () => {
  // No test here may reach the network through the bare global fetch.
  const bareFetch = vi.fn(async () => new Response('{}', { status: 599 }));

  beforeEach(() => {
    bareFetch.mockClear();
    vi.stubGlobal('fetch', bareFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('host `data: []` ⇒ the endpoint is read and its rows paint', async () => {
    const apiFetch = makeApiFetch();

    renderApiGantt(apiFetch, { data: [] });

    await waitFor(() => expect(screen.getByTestId('gv-task-e2')).toBeTruthy());
    expect(taskCount()).toBe(String(ENDPOINT_ROWS.length));
    expect(readUrls(apiFetch).some((url) => url.includes(ENDPOINT))).toBe(true);
    expect(bareFetch).not.toHaveBeenCalled();
  });

  it('CONTROL — host `data` with rows ⇒ those rows paint and the endpoint is never read', async () => {
    const apiFetch = makeApiFetch();

    renderApiGantt(apiFetch, { data: HOST_ROWS });

    await waitFor(() => expect(screen.getByTestId('gv-task-h1')).toBeTruthy());
    expect(taskCount()).toBe(String(HOST_ROWS.length));
    expect(screen.queryByTestId('gv-task-e1')).toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('CONTROL — no host `data` ⇒ the endpoint is read', async () => {
    const apiFetch = makeApiFetch();

    renderApiGantt(apiFetch, {});

    await waitFor(() => expect(screen.getByTestId('gv-task-e2')).toBeTruthy());
    expect(readUrls(apiFetch).some((url) => url.includes(ENDPOINT))).toBe(true);
  });

  it('host rows that arrive after an empty first render are adopted', async () => {
    const apiFetch = makeApiFetch();

    const { rerenderWith } = renderApiGantt(apiFetch, { data: [] });
    await waitFor(() => expect(screen.getByTestId('gv-task-e2')).toBeTruthy());

    rerenderWith({ data: HOST_ROWS });

    await waitFor(() => expect(screen.getByTestId('gv-task-h1')).toBeTruthy());
    expect(taskCount()).toBe(String(HOST_ROWS.length));
    expect(screen.queryByTestId('gv-task-e1')).toBeNull();
  });
});

describe('objectui#7333 — an EMPTY host array does not switch off the object-schema gate', () => {
  /** A definition with a lookup, so the gated query has a real `$expand` to carry. */
  const OBJECT_DEF = {
    name: 'task',
    fields: {
      id: { name: 'id', type: 'text' },
      subject: { name: 'subject', type: 'text' },
      owner: { name: 'owner', type: 'lookup', reference: 'user' },
      visible_from: { name: 'visible_from', type: 'date' },
      due_date: { name: 'due_date', type: 'date' },
    },
  };

  const OBJECT_ROWS = [
    { id: '1', subject: 'Renewal', owner: 'u1', visible_from: '2026-01-01', due_date: '2026-01-05' },
  ];

  const objectSchema: any = {
    type: 'object-gantt',
    objectName: 'task',
    gantt: { titleField: 'subject', startDateField: 'visible_from', endDateField: 'due_date' },
  };

  it('host `data: []` on an object-bound gantt ⇒ ONE query, issued after the schema settles, already expanded', async () => {
    const adapter = {
      find: vi.fn(async () => ({ data: OBJECT_ROWS, total: OBJECT_ROWS.length })),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getObjectSchema: vi.fn(async () => OBJECT_DEF),
    } as any;

    render(<ObjectGantt schema={objectSchema} dataSource={adapter} {...({ data: [] } as any)} />);

    await waitFor(() => expect(taskCount()).toBe(String(OBJECT_ROWS.length)));
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    await settle();
    // Ungated, the first query goes out before the definition lands and
    // carries no expansion, and a second follows once it does: `[null,
    // ['owner']]` — the signature `ObjectGantt.fetchGate-7225.test.tsx`
    // records for the ungated regime.
    const expandSets = adapter.find.mock.calls.map(([, params]: [string, any]) => params?.$expand ?? null);
    expect(expandSets).toEqual([['owner']]);
  });
});
