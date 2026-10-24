/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { vi } from 'vitest';

/**
 * A `find` double for the batched referenced-record read the cells make
 * through `@object-ui/react`'s reference store: `{ $filter: { <key>: { $in } } }`
 * answered row by row from `lookup`, which returns the row for one key or
 * `null` for "not found" — the shape a per-id `findOne` double used to have.
 */
export function findByIds(
  lookup: (objectName: string, key: string) => Record<string, unknown> | null | undefined,
) {
  return vi.fn(async (objectName: string, params?: any) => {
    const filter = params?.$filter ?? {};
    const [, cond] = (Object.entries(filter)[0] ?? []) as [string, { $in?: unknown[] } | undefined];
    const keys = Array.isArray(cond?.$in) ? cond!.$in : [];
    const data = keys
      .map((k) => lookup(objectName, String(k)))
      .filter((r): r is Record<string, unknown> => r != null);
    return { data };
  });
}
