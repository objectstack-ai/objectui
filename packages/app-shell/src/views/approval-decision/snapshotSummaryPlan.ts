/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Which keys of a record snapshot `RecordSnapshotSummary` draws, and the
 * labels it draws them under (objectui#12483). Pure: the reader's field
 * permissions are applied to the snapshot before it gets here. The rules are
 * in `RecordSnapshotSummary.tsx`'s header.
 */

import { isExpandableFieldType } from '@object-ui/core';
import { isSystemManagedField } from '@object-ui/types';

/** One field's declaration as the object definition serves it. */
export type FieldDef = Readonly<Record<string, unknown>>;

/** The rows a snapshot draws: the declared amount, then the business fields. */
export interface SnapshotSummaryPlan {
  lead: string | null;
  rows: string[];
}

/** How many business-field rows the summary draws below the amount. */
export const SNAPSHOT_SUMMARY_ROWS = 6;

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/**
 * Which keys of `snapshot` are drawn, in snapshot order. Pure: the reader's
 * field permissions are applied to `snapshot` before it gets here.
 */
export function planSnapshotSummary(
  snapshot: Readonly<Record<string, unknown>>,
  fields: Readonly<Record<string, FieldDef | undefined>>,
  display: Readonly<Record<string, string>> | undefined,
  max: number = SNAPSHOT_SUMMARY_ROWS,
): SnapshotSummaryPlan {
  const candidates: string[] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    const def = fields[key];
    if (!def || typeof def !== 'object') continue; // not a field of this object
    if (def.hidden === true) continue; // hidden from the default UI
    if (isSystemManagedField(key, def as { system?: boolean })) continue; // bookkeeping
    if (value == null || typeof value === 'object') continue;
    if (String(value).trim() === '') continue;
    if (!display?.[key] && isExpandableFieldType(def)) continue; // an unresolved reference id
    candidates.push(key);
  }

  let lead: string | null = null;
  let leadZero: string | null = null;
  for (const key of candidates) {
    if (fields[key]?.type !== 'currency') continue;
    const n = numeric(snapshot[key]);
    if (n === null) continue;
    if (n !== 0) {
      lead = key;
      break;
    }
    leadZero ??= key;
  }
  lead ??= leadZero;

  return { lead, rows: candidates.filter((key) => key !== lead).slice(0, max) };
}

/**
 * Two rows never share a label: every row whose label is shared names its
 * field key as well, and if a qualified label still matches another row's
 * plain label, every row is qualified. Field keys are unique, so the result is.
 */
export function distinctLabels(rows: ReadonlyArray<{ key: string; label: string }>): string[] {
  const qualify = (pick: (r: { key: string; label: string }) => boolean) =>
    rows.map((r) => (pick(r) ? `${r.label} (${r.key})` : r.label));
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.label, (count.get(r.label) ?? 0) + 1);
  const once = qualify((r) => (count.get(r.label) ?? 0) > 1);
  return new Set(once).size === once.length ? once : qualify(() => true);
}
