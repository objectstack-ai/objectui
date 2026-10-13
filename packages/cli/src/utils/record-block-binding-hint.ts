/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A one-record block whose `dataSource` binding does not say WHICH record
 * (objectui#12294) — the warning `objectui validate` prints for it.
 *
 * `record:details`, `record:highlights` and `record:quick_actions` show ONE
 * record. Bound through the spec's per-element `dataSource`, they show the
 * FIRST row of the bound set by the binding's `sort` (`@object-ui/plugin-detail`,
 * `renderers/recordBinding.tsx`). A binding that can match several rows is
 * therefore valid, and its first row is drawn — but the author has not said
 * that one row is what they meant, so the block quietly picks one. The ruling's
 * remedy is a warning, not a refusal: the author declares `limit: 1`.
 *
 * Advisory only. The document still validates; the strict authoring face
 * judges the binding's SHAPE (the spec's `ElementDataSourceSchema`), and this
 * reads one value of it.
 *
 * `record:related_list` is not in the set: its binding is the binding of its
 * CHILD rows, which are many by design.
 */

import { formatIssuePath } from './issue-path.js';

/** The blocks that draw ONE record from their binding. */
export const ONE_RECORD_BLOCK_TYPES: ReadonlySet<string> = new Set([
  'record:details',
  'record:highlights',
  'record:quick_actions',
]);

export interface RecordBindingLimitFinding {
  /** Where the block sits, spelled the way every other CLI path is (`formatIssuePath`). */
  path: string;
  /** The block's `type`. */
  type: string;
  /** The object the binding names. */
  object: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Every one-record block in `document` whose binding names an object and does
 * not declare `limit: 1`. A node without a binding, or with one that names no
 * object, is not a bound record block, so it is not reported here.
 */
export function findRecordBindingsWithoutLimitOne(
  document: unknown,
  path: readonly PropertyKey[] = [],
): RecordBindingLimitFinding[] {
  if (Array.isArray(document)) {
    return document.flatMap((child, i) => findRecordBindingsWithoutLimitOne(child, [...path, i]));
  }
  if (!isRecord(document)) return [];

  const findings: RecordBindingLimitFinding[] = [];
  const binding = document.dataSource;
  if (
    typeof document.type === 'string'
    && ONE_RECORD_BLOCK_TYPES.has(document.type)
    && isRecord(binding)
    && typeof binding.object === 'string'
    && binding.object.length > 0
    && binding.limit !== 1
  ) {
    findings.push({ path: formatIssuePath(path), type: document.type, object: binding.object });
  }
  for (const [key, value] of Object.entries(document)) {
    findings.push(...findRecordBindingsWithoutLimitOne(value, [...path, key]));
  }
  return findings;
}

/** The warning line for one finding. */
export function describeRecordBindingWithoutLimitOne(finding: RecordBindingLimitFinding): string {
  return (
    `${finding.path}: ${finding.type} is bound to "${finding.object}" by a dataSource without \`limit: 1\`. `
    + 'A record block shows ONE record — the first row of the binding by its `sort` — so declare '
    + '`limit: 1` (and a `sort` when several rows can match) to say which record that is.'
  );
}
