// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Regression (objectstack #3508): a lookup whose committed value is NOT the
 * primary id (`idField: 'name'` — e.g. approval `position` approvers, which
 * the engine routes by machine name) must hydrate its display label by
 * FILTERING on that field. The old path always called `findOne(object, value)`
 * — a primary-id GET — so a stored machine name never resolved and the field
 * showed an empty placeholder over a real value.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { LookupField } from './LookupField';

afterEach(cleanup);

describe('LookupField — idField hydration (#3508)', () => {
  it('hydrates by filtering on idField when it is not the primary id', async () => {
    const find = vi.fn(async () => ({
      data: [{ id: 'pos_1', name: 'sales_manager', label: 'Sales Manager' }],
    }));
    const findOne = vi.fn(async () => null);
    render(
      <LookupField
        value="sales_manager"
        onChange={() => {}}
        dataSource={{ find, findOne } as never}
        field={{
          reference: 'sys_position',
          idField: 'name',
          displayField: 'label',
          multiple: false,
        } as never}
      />,
    );
    await waitFor(() => expect(find).toHaveBeenCalled());
    // The stored machine name is not a primary id — findOne(object, name)
    // would 404; hydration must go through $filter on the committed field.
    expect(findOne).not.toHaveBeenCalled();
    const hydration = find.mock.calls.find(
      (c) => JSON.stringify(((c as never[])[1] as { $filter?: unknown })?.$filter) === JSON.stringify({ name: { $in: ['sales_manager'] } }),
    );
    expect(hydration).toBeTruthy();
  });

  it('the default primary-id lookup hydrates through the shared batched read, never a per-id findOne', async () => {
    const find = vi.fn(async () => ({ data: [{ id: 'u1', name: 'Ada' }] }));
    const findOne = vi.fn(async () => ({ id: 'u1', name: 'Ada' }));
    const { findByText } = render(
      <LookupField
        value="u1"
        onChange={() => {}}
        dataSource={{ find, findOne } as never}
        field={{ reference: 'sys_user', multiple: false } as never}
      />,
    );
    expect(await findByText('Ada')).toBeTruthy();
    expect(find).toHaveBeenCalledWith('sys_user', { $filter: { id: { $in: ['u1'] } }, $top: 1 });
    expect(findOne).not.toHaveBeenCalled();
  });
});
