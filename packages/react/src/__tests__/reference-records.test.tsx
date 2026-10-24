/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The shared referenced-record reader: a page of cells asking for their own
 * keys must cost ONE read per object, not one per cell.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
  fetchReferenceRecords,
  pickReferenceRecord,
  useReferenceRecords,
  useReferenceRecordSets,
  useReferenceObjectDef,
  type ReferenceRecordSource,
} from '../reference-records';
import { notifyDataChanged } from '../data-invalidation';

function makeSource(rows: Record<string, Record<string, unknown>[]>) {
  const find = vi.fn(async (objectName: string, params: any) => {
    const [field, cond] = Object.entries(params.$filter)[0] as [string, { $in: unknown[] }];
    return { data: (rows[objectName] ?? []).filter((r) => cond.$in.map(String).includes(String(r[field]))) };
  });
  const getObjectSchema = vi.fn(async (objectName: string) => ({ name: objectName, label: objectName.toUpperCase() }));
  return { find, getObjectSchema } satisfies ReferenceRecordSource;
}

function Cell({ source, id }: { source: ReferenceRecordSource; id: string }) {
  const answers = useReferenceRecords(source, 'sys_user', [id]);
  const answer = pickReferenceRecord(answers, 'sys_user', id);
  const text = answer?.state === 'readable' ? String(answer.record.name) : answer?.state ?? 'none';
  return <span data-testid={`cell-${id}`}>{text}</span>;
}

const USERS = Array.from({ length: 25 }, (_, i) => ({ id: `u${i}`, name: `User ${i}` }));

describe('reference-records — one read per object per tick', () => {
  it('a page of 25 cells asks the server once, and every cell gets its row', async () => {
    const source = makeSource({ sys_user: USERS });
    render(
      <>
        {USERS.map((u) => (
          <Cell key={u.id} source={source} id={u.id} />
        ))}
      </>,
    );
    await waitFor(() => expect(screen.getByTestId('cell-u24').textContent).toBe('User 24'));
    expect(source.find).toHaveBeenCalledTimes(1);
    expect(source.find.mock.calls[0][1]).toEqual({
      $filter: { id: { $in: USERS.map((u) => u.id) } },
      $top: 25,
    });
    expect(screen.getByTestId('cell-u0').textContent).toBe('User 0');
  });

  it('a second mount of a known key costs nothing', async () => {
    const source = makeSource({ sys_user: USERS });
    const { unmount } = render(<Cell source={source} id="u1" />);
    await waitFor(() => expect(screen.getByTestId('cell-u1').textContent).toBe('User 1'));
    unmount();
    render(<Cell source={source} id="u1" />);
    expect(screen.getByTestId('cell-u1').textContent).toBe('User 1');
    expect(source.find).toHaveBeenCalledTimes(1);
  });

  it('a key the read did not return is absent; a rejected read is failed', async () => {
    const source = makeSource({ sys_user: USERS });
    render(<Cell source={source} id="ghost" />);
    await waitFor(() => expect(screen.getByTestId('cell-ghost').textContent).toBe('absent'));

    const refusing = { find: vi.fn(async () => { throw new Error('403'); }) };
    render(<Cell source={refusing} id="u1" />);
    await waitFor(() => expect(screen.getByTestId('cell-u1').textContent).toBe('failed'));
  });

  it('requests for several objects and key fields share one read per (object, keyField)', async () => {
    const source = makeSource({
      sys_user: USERS,
      sys_position: [{ id: 'p1', name: 'sales_manager', label: 'Sales Manager' }],
    });
    function Multi() {
      const answers = useReferenceRecordSets(source, [
        { objectName: 'sys_user', values: ['u1', 'u2'] },
        { objectName: 'sys_user', values: ['u2', 'u3'] },
        { objectName: 'sys_position', values: ['sales_manager'], keyField: 'name' },
      ]);
      const p = pickReferenceRecord(answers, 'sys_position', 'sales_manager', 'name');
      return <span data-testid="multi">{p?.state === 'readable' ? String(p.record.label) : 'pending'}</span>;
    }
    render(<Multi />);
    await waitFor(() => expect(screen.getByTestId('multi').textContent).toBe('Sales Manager'));
    expect(source.find).toHaveBeenCalledTimes(2);
    const userCall = source.find.mock.calls.find((c) => c[0] === 'sys_user')!;
    expect(userCall[1].$filter.id.$in).toEqual(['u1', 'u2', 'u3']);
  });

  it('a write on the bus re-reads the stale key in place, keeping the old row until the new one lands', async () => {
    const rows = [{ id: 'u1', name: 'Before' }];
    const source = makeSource({ sys_user: rows });
    render(<Cell source={source} id="u1" />);
    await waitFor(() => expect(screen.getByTestId('cell-u1').textContent).toBe('Before'));
    rows[0] = { id: 'u1', name: 'After' };
    act(() => notifyDataChanged({ objectName: 'sys_user', recordId: 'u1' }));
    expect(screen.getByTestId('cell-u1').textContent).toBe('Before');
    await waitFor(() => expect(screen.getByTestId('cell-u1').textContent).toBe('After'));
    expect(source.find).toHaveBeenCalledTimes(2);

    // A write on another object stales nothing here.
    act(() => notifyDataChanged({ objectName: 'sys_member' }));
    await new Promise((r) => setTimeout(r, 10));
    expect(source.find).toHaveBeenCalledTimes(2);
  });

  it('fetchReferenceRecords joins the same batch as the cells', async () => {
    const source = makeSource({ sys_user: USERS });
    render(<Cell source={source} id="u1" />);
    const answers = await fetchReferenceRecords(source, 'sys_user', ['u1', 'u2']);
    expect(answers.get('u1')?.state).toBe('readable');
    expect(answers.get('u2')?.state).toBe('readable');
    expect(source.find).toHaveBeenCalledTimes(1);
  });

  it('an object definition is read once per data source', async () => {
    const source = makeSource({});
    function Def() {
      const def = useReferenceObjectDef(source, 'sys_user');
      return <span data-testid="def">{def.state === 'ok' ? String(def.def.label) : def.state}</span>;
    }
    render(<><Def /><Def /><Def /></>);
    await waitFor(() => expect(screen.getAllByTestId('def')[0].textContent).toBe('SYS_USER'));
    expect(source.getObjectSchema).toHaveBeenCalledTimes(1);
  });
});
