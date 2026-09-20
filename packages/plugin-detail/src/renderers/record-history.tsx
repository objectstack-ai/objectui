/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `record:history` — renders an audit-log timeline for the current record.
 * Thin wrapper around `<HistoryTimeline>`.
 *
 * Data model: a host MAY pass `entries` (array of history rows) + `loading`
 * directly (RecordDetailView's synthesizer path does this). When no host
 * entries are supplied — e.g. the block is hand-authored inside a `page:tabs`
 * on a custom record page — the renderer SELF-FETCHES from `sys_activity`
 * (the same source the discussion/activity feed reads), scoped to the current
 * record via `useRecordContext`. This makes `record:history` drop-anywhere,
 * matching `record:related_list`'s self-fetch behaviour, instead of silently
 * showing "No history yet".
 */

import React from 'react';
import { useRecordContext } from '@object-ui/react';
import { HistoryTimeline, type HistoryEntry } from '../HistoryTimeline';

const splitDesigner = (props: Record<string, any>) => {
  const { 'data-obj-id': id, 'data-obj-type': type, style, ...rest } = props || {};
  return { designer: { 'data-obj-id': id, 'data-obj-type': type, style }, rest };
};

export interface RecordHistoryRendererProps {
  schema?: {
    entries?: HistoryEntry[];
    loading?: boolean;
    emptyText?: string;
    unknownUserText?: string;
    limit?: number;
    properties?: Record<string, any>;
    [k: string]: any;
  };
  className?: string;
  [k: string]: any;
}

/** sys_activity row → HistoryEntry. Only field-mutating activity types map to
 *  history (comments/mentions/logins are not record-history). */
const HISTORY_TYPES = new Set(['created', 'updated', 'assigned', 'shared', 'deleted']);

/**
 * Rows this block shows when the author declared no usable cap.
 *
 * Named because `50` was spelled TWICE in the old derivation (`?? 50` and the
 * `|| 50` behind it), and the spec states the same number a third time:
 * `RecordHistoryProps.limit` is described there as "Maximum history entries
 * displayed, and the `$top` of the self-fetch query (renderer default: 50)".
 *
 * ⛔ Deliberately NOT `record:activity`'s 20. The two blocks default
 * differently on purpose; unifying them is a product decision and objectui#10005
 * is not it.
 */
const DEFAULT_HISTORY_LIMIT = 50;

/**
 * The ONE resolver for this block's row cap (objectui#10005).
 *
 * `@objectstack/spec` declares the member a POSITIVE INTEGER
 * (`RecordHistoryProps.limit`: `z.number().int().positive().optional()`), so a
 * negative and a fractional cap are values the contract REFUSES — not
 * spellings this renderer may interpret. A refused value is therefore dropped
 * for this block's own default.
 *
 * ⛔ Not `Math.max(1, …)`, which is what this replaces: that REPAIRED a
 * refused `-5` into a one-row window (a wrong result the author never asked
 * for and no channel named) and forwarded a fractional `2.5` to the adapter
 * untouched. Refusing and defaulting is the answer the sibling `record:activity`
 * already gives through `normalizeLimit`, and the answer objectui#9925 landed
 * at three further read points.
 *
 * ⚠️ FAIL-SOFT and SILENT, both on purpose. Fail-soft because throwing would
 * take out a record page over one declaration. Silent because the sibling this
 * block is matched to refuses silently too — the three objectui#9925 read points
 * warn instead, so the family holds two answers on loudness and that question
 * is ruled elsewhere, not decided here by accident. The silence is pinned.
 *
 * Coercion is kept exactly where the sibling keeps it: a numeric STRING still
 * resolves (`normalizeLimit('5')` is pinned to `5`). What narrows is the
 * admitted value set, not how a node's value is read.
 */
function normalizeHistoryLimit(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_HISTORY_LIMIT;
}

export const RecordHistoryRenderer: React.FC<RecordHistoryRendererProps> = ({
  schema = {} as any,
  className,
  ...props
}) => {
  const { designer } = splitDesigner(props);
  const ctx = useRecordContext();

  // Spec bridge inlines `properties.*` onto the node but also preserves the raw
  // bag. Read from either location for compatibility.
  const hostEntries: HistoryEntry[] | undefined = Array.isArray(schema.entries)
    ? schema.entries
    : Array.isArray(schema.properties?.entries)
      ? (schema.properties!.entries as HistoryEntry[])
      : undefined;
  const hostLoading = schema.loading ?? schema.properties?.loading;
  const emptyText = schema.emptyText ?? schema.properties?.emptyText;
  const unknownUserText = schema.unknownUserText ?? schema.properties?.unknownUserText;
  const limit: number = normalizeHistoryLimit(schema.limit ?? schema.properties?.limit);

  // Self-fetch only when the host did not supply entries.
  const objectName: string | undefined = ctx?.objectName;
  const recordId = ctx?.data?.id ?? ctx?.data?._id ?? ctx?.recordId;
  const dataSource = ctx?.dataSource;
  const canSelfFetch = hostEntries === undefined && !!dataSource?.find && !!objectName && recordId != null;

  const [fetched, setFetched] = React.useState<HistoryEntry[] | null>(null);
  const [selfLoading, setSelfLoading] = React.useState(false);

  React.useEffect(() => {
    if (!canSelfFetch) return;
    let cancelled = false;
    setSelfLoading(true);
    Promise.resolve(
      dataSource.find('sys_activity', {
        $filter: { object_name: objectName, record_id: recordId },
        $orderby: { timestamp: 'desc' },
        $top: limit,
      }),
    )
      .then((res: any) => {
        if (cancelled) return;
        // `data` is the ONE rows member `QueryResult` (`@object-ui/types`)
        // declares. A `res?.records` arm sat behind it until objectui#6726 — a
        // below-the-adapter spelling (`ObjectStackAdapter.normalizeQueryResult`
        // maps the server/SDK `records` envelope to `data` before returning),
        // so no producer emits it at this `DataSource.find()` seam and the arm
        // was dead. Pinned by `record-history.contractEnvelope-6726.test.tsx`.
        const rows: any[] = res?.data ?? [];
        const mapped: HistoryEntry[] = rows
          .filter((r) => HISTORY_TYPES.has(r?.type))
          .map((r) => {
            let when = r.timestamp;
            if (!when || when === 'NOW()' || Number.isNaN(Date.parse(when))) when = r.created_at;
            return {
              id: r.id,
              created_at: when,
              action: r.type,
              user_name: r.actor_name ?? null,
              user_avatar: r.actor_avatar_url ?? null,
              summary: r.summary ?? null,
            } as HistoryEntry;
          });
        setFetched(mapped);
      })
      .catch(() => { if (!cancelled) setFetched([]); })
      .finally(() => { if (!cancelled) setSelfLoading(false); });
    return () => { cancelled = true; };
  }, [canSelfFetch, dataSource, objectName, recordId, limit]);

  const entries: HistoryEntry[] = hostEntries ?? fetched ?? [];
  const loading = hostLoading ?? (canSelfFetch && fetched === null ? selfLoading || true : false);

  return (
    <div className={className} {...designer}>
      <HistoryTimeline entries={entries} loading={loading} emptyText={emptyText} unknownUserText={unknownUserText} />
    </div>
  );
};

export default RecordHistoryRenderer;
