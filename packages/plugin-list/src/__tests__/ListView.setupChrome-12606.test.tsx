/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12606 — the two host props the console's Setup app sets on its
 * record lists: `defaultRowNumbers` (the grid opens without the `#` numbers)
 * and `showDisplayControl` (the bar draws no Display control). Both are React
 * props a host passes, never view keys; the control mounts the same schema
 * with neither and reads today's shape.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRendererProvider } from '@object-ui/react';
import type { ListViewSchema } from '@object-ui/types';
import { ListView } from '../ListView';

const SCHEMA = {
  type: 'list-view',
  objectName: 'sys_user',
  viewType: 'grid',
  fields: ['name'],
} as ListViewSchema;

let gridProps: Record<string, unknown> | undefined;
let previousGrid: ReturnType<typeof ComponentRegistry.get>;

function mount(props: Record<string, unknown> = {}) {
  const dataSource = {
    find: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Ada' }], total: 1 }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({ name: 'sys_user', fields: {} }),
  };
  render(
    <SchemaRendererProvider dataSource={dataSource as never}>
      <ListView schema={SCHEMA} dataSource={dataSource as never} {...props} />
    </SchemaRendererProvider>,
  );
}

beforeEach(() => {
  gridProps = undefined;
  previousGrid = ComponentRegistry.get('object-grid');
  ComponentRegistry.register('object-grid', (props: any) => {
    gridProps = props;
    return <div data-testid="grid-stub" />;
  });
});

afterEach(() => {
  cleanup();
  if (previousGrid) ComponentRegistry.register('object-grid', previousGrid as any);
});

describe('the list’s Setup chrome is two host props (objectui#12606)', () => {
  it('`defaultRowNumbers={false}` opens the grid without row numbers, and `showDisplayControl={false}` draws no Display', async () => {
    mount({ defaultRowNumbers: false, showDisplayControl: false });
    await screen.findByTestId('grid-stub');
    expect(gridProps?.showRowNumbers).toBe(false);
    expect(screen.queryByTestId('toolbar-display-trigger')).toBeNull();
    // The rest of the bar stays.
    expect(screen.getByTestId('toolbar-filter-trigger')).toBeTruthy();
    expect(screen.getByTestId('toolbar-sort-trigger')).toBeTruthy();
  });

  it('with Display drawn, row numbers off by the host default is not a changed setting', async () => {
    mount({ defaultRowNumbers: false });
    await screen.findByTestId('grid-stub');
    expect(gridProps?.showRowNumbers).toBe(false);
    expect(screen.getByTestId('toolbar-display-trigger')).toBeTruthy();
    expect(screen.queryByTestId('toolbar-display-count')).toBeNull();
  });

  it('CONTROL — with neither prop the grid numbers its rows and the bar draws Display', async () => {
    mount();
    await screen.findByTestId('grid-stub');
    expect(gridProps?.showRowNumbers).toBe(true);
    expect(screen.getByTestId('toolbar-display-trigger')).toBeTruthy();
  });
});
