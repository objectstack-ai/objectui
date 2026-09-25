/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The hold that resolves a data node's OWN authored `filter` once, shared by
 * the two nodes in this package that query with it: `ListView`
 * (objectui#10607) and `ObjectGallery` (objectui#10666). It was local to
 * `ListView.tsx` until the gallery needed the same hold; it moved here
 * unchanged rather than being copied. Package-internal: `index.tsx` does not
 * re-export it, so the package's export set does not move.
 */

import * as React from 'react';
import { resolveFilterPlaceholders, type FilterTokenScope } from '@object-ui/core';

/** One resolution of the node's own `filter`, remembered with its inputs. */
interface HeldAuthoredFilter {
  authored: unknown;
  currentUserId: FilterTokenScope['currentUserId'];
  currentOrgId: FilterTokenScope['currentOrgId'];
  onUnresolved: FilterTokenScope['onUnresolved'];
  resolved: unknown;
}

function resolveAuthoredFilter(authored: unknown, scope: FilterTokenScope): HeldAuthoredFilter {
  return {
    authored,
    currentUserId: scope.currentUserId,
    currentOrgId: scope.currentOrgId,
    onUnresolved: scope.onUnresolved,
    resolved: resolveFilterPlaceholders(authored, scope),
  };
}

/** Depth past which {@link isSameAuthoredFilter} gives up and answers "changed". */
const AUTHORED_FILTER_MAX_DEPTH = 12;

function isPlainFilterObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Compare two authored filters by structure, never by serialising them.
 *
 * The same rules as `plugin-view`'s `isStructurallyEqual` (objectui#6460),
 * which this package does not depend on: primitives by `Object.is`, a `Date`
 * by its instant, arrays element by element and in order, plain objects by key
 * set and value. Anything else is equal only as the same reference, and a
 * structure deeper than the bound is "changed". Every uncertainty answers
 * "changed", which re-resolves and re-queries; the comparison can drop a
 * redundant query, never a needed one.
 */
function isSameAuthoredFilter(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (depth >= AUTHORED_FILTER_MAX_DEPTH) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => isSameAuthoredFilter(item, b[i], depth + 1));
  }
  if (isPlainFilterObject(a) && isPlainFilterObject(b)) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((key) => (
      Object.prototype.hasOwnProperty.call(b, key) && isSameAuthoredFilter(a[key], b[key], depth + 1)
    ));
  }
  return false;
}

/**
 * objectui#10607 — resolve the node's own `filter` ONCE, through
 * `@object-ui/core`'s shared `resolveFilterPlaceholders`, against the session
 * scope the host provides (`useFilterScope`). Before this, a directly authored
 * `list-view` with `filter: [['owner', '=', '{current_user_id}']]` sent the
 * literal token on `$filter`, and handed it to the child view it renders.
 * `object-view` already resolves the filters it hands a `list-view` host
 * (objectui#10506); resolving that value again changes nothing, because a
 * resolved id no longer matches the whole-token pattern.
 *
 * ⛔ Not a second resolver, and no fallback: a token the scope cannot resolve
 * is whatever `resolveFilterPlaceholders` makes of it (left intact, with one
 * warning naming it).
 *
 * The result is HELD against its inputs, the shape `plugin-view`'s
 * `useResolvedFilterSegments` uses. The fetch effect keys on this filter, so a
 * resolved copy minted on every render would refetch on every render; and a
 * date macro such as `{now}` resolves to a new value at every call, so
 * comparing OUTPUTS cannot stop that. The key is the authored filter, compared
 * by structure (a host that rebuilds an equal filter inline must not
 * re-query), plus the scope's three members read one by one, never the scope
 * object's identity (AGENTS.md #10). The held pair lives in state, so the
 * value handed out is always the one React committed.
 */
export function useResolvedAuthoredFilter<T>(authored: T, scope: FilterTokenScope): T {
  const [held, setHeld] = React.useState(() => resolveAuthoredFilter(authored, scope));
  if (
    held.currentUserId !== scope.currentUserId
    || held.currentOrgId !== scope.currentOrgId
    || held.onUnresolved !== scope.onUnresolved
    || !isSameAuthoredFilter(held.authored, authored)
  ) {
    // React's documented "information from previous renders" shape: a set
    // during render re-renders this component at once, before any child sees
    // the discarded pass, and the re-render finds the inputs equal.
    const next = resolveAuthoredFilter(authored, scope);
    setHeld(next);
    return next.resolved as T;
  }
  return held.resolved as T;
}
