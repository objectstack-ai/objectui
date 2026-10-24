/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Reference cells read their referenced records through the shared reference
 * store of `@object-ui/react`, so a page of them costs ONE read per referenced
 * object — not one `findOne` per cell. Measured before this pin: an
 * organization's member list sent one `GET /data/sys_user/<id>` per row (25 per
 * page) whenever the list's `user_id` column reached the cells unexpanded.
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaRendererProvider } from '@object-ui/react';
import { getCellRenderer } from '../index';
import { findByIds } from './findByIds';

afterEach(() => cleanup());

const PEOPLE = Array.from({ length: 25 }, (_, i) => ({ id: `user_${i}`, name: `Person ${i}` }));
const byId = new Map(PEOPLE.map((p) => [p.id, p]));

function makeDataSource() {
  return {
    find: findByIds((objectName, id) => (objectName === 'sys_user' ? byId.get(id) ?? null : null)),
    findOne: vi.fn(),
  } as any;
}

function Page({ ds, type, values }: { ds: any; type: 'lookup' | 'user'; values: unknown[] }) {
  const Cell = getCellRenderer(type);
  return (
    <SchemaRendererProvider dataSource={ds}>
      {values.map((value, i) => (
        <div key={i} data-testid={`row-${i}`}>
          <Cell value={value as any} field={{ name: 'user_id', type, reference: 'sys_user' } as any} />
        </div>
      ))}
    </SchemaRendererProvider>
  );
}

describe('reference cells — one read per referenced object per page', () => {
  it('25 lookup cells holding bare ids cost one `$in` read and no findOne', async () => {
    const ds = makeDataSource();
    render(<Page ds={ds} type="lookup" values={PEOPLE.map((p) => p.id)} />);
    await waitFor(() => expect(screen.getByTestId('row-24')).toHaveTextContent('Person 24'));
    expect(screen.getByTestId('row-0')).toHaveTextContent('Person 0');
    expect(ds.find).toHaveBeenCalledTimes(1);
    expect(ds.find.mock.calls[0][1]).toEqual({
      $filter: { id: { $in: PEOPLE.map((p) => p.id) } },
      $top: 25,
    });
    expect(ds.findOne).not.toHaveBeenCalled();
  });

  it('every chip of a multi-value lookup is named, from the same read', async () => {
    const ds = makeDataSource();
    render(<Page ds={ds} type="lookup" values={[['user_1', 'user_2'], ['user_2', 'user_3']]} />);
    await waitFor(() => expect(screen.getByTestId('row-1')).toHaveTextContent('Person 3'));
    expect(screen.getByTestId('row-0')).toHaveTextContent('Person 1');
    expect(screen.getByTestId('row-0')).toHaveTextContent('Person 2');
    expect(ds.find).toHaveBeenCalledTimes(1);
    expect(ds.find.mock.calls[0][1].$filter.id.$in).toEqual(['user_1', 'user_2', 'user_3']);
  });

  it('a user cell holding a bare id names the person instead of drawing it unresolved', async () => {
    const ds = makeDataSource();
    const { container } = render(<Page ds={ds} type="user" values={['user_5', 'user_6']} />);
    await waitFor(() => expect(screen.getByTestId('row-0')).toHaveTextContent('Person 5'));
    expect(screen.getByTestId('row-1')).toHaveTextContent('Person 6');
    expect(container.querySelector('[data-slot="unresolved-reference"]')).toBeNull();
    expect(ds.find).toHaveBeenCalledTimes(1);
  });

  it('a user id the read does not return draws the restricted face, with no id', async () => {
    const ds = makeDataSource();
    const { container } = render(<Page ds={ds} type="user" values={['user_hidden']} />);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="restricted-reference"]')).not.toBeNull(),
    );
    expect(container.innerHTML).not.toContain('user_hidden');
  });

  it('lookup and user cells naming the same people share one read', async () => {
    const ds = makeDataSource();
    render(
      <>
        <Page ds={ds} type="lookup" values={['user_7', 'user_8']} />
        <Page ds={ds} type="user" values={['user_8', 'user_9']} />
      </>,
    );
    await waitFor(() => expect(screen.getAllByTestId('row-1')[1]).toHaveTextContent('Person 9'));
    expect(ds.find).toHaveBeenCalledTimes(1);
    expect(ds.find.mock.calls[0][1].$filter.id.$in).toEqual(['user_7', 'user_8', 'user_9']);
  });
});
