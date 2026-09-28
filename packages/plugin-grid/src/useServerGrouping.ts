/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Server-side grouping for a grid that owns its fetch (objectui#7189,
 * maintainer ruling A: 「7189 A  其他同意」).
 *
 * ## The contract this module consumes
 *
 * Grouping on a list view is server-side: the set of groups and every number
 * in a group header are properties of the QUERY, not of a fetched page, and
 * the rows inside a group are paged. `@objectstack/spec/ui` compiles a grouped
 * view into the two queries that say so, and this module sends exactly what
 * they compile — it never re-derives either:
 *
 *   - {@link compileListViewGroupQuery} — the GROUP HEADER query, one
 *     `EngineAggregateOptions` per nesting depth, answered through
 *     `DataSource.queryGroupHeaders` (`@object-ui/types`). One query per depth
 *     rather than one leaf query folded upward, because `avg` and
 *     `count_distinct` do not fold across levels (the spec module's own
 *     "Multi-level grouping" note); `count`, the number every header shows, is
 *     exact either way.
 *   - {@link compileListViewGroupRowsQuery} — ONE group's row page: the view's
 *     composed filter AND-ed with that group's key predicate, `limit` /
 *     `offset` per group, answered through the ordinary `DataSource.find`.
 *
 * Both take the view's composed filter as the same `FilterCondition`, so the
 * header numbers and the rows they head are one question asked twice rather
 * than two questions that might disagree.
 *
 * ## What a header row carries, and what the grid still has to do
 *
 * Every grouped field under its own name holding the RAW stored value — a
 * lookup key is the referenced record's id, never the record, and the empty
 * group's key is `null`. Resolving a key to a label is the consumer's, exactly
 * as for a cell, so a reference-typed grouping key is resolved here with one
 * `find` on the referenced object per grouped field (the same resolution
 * `ObjectChart` applies to a grouped series); a failed resolution keeps the id
 * rather than failing the grid. Ordering the groups is the consumer's too:
 * `useGroupedData` applies `GroupingField.order` over the header set.
 */

import { useCallback, useEffect, useState } from 'react';
import type { DataSource, QueryParams } from '@object-ui/types';
import type { FilterCondition } from '@objectstack/spec/data';
import {
  compileListViewGroupQuery,
  compileListViewGroupRowsQuery,
  type ListViewGroupHeaderRow,
  type ListViewGroupQuerySource,
} from '@objectstack/spec/ui';
import { isExpandableFieldType } from '@object-ui/core';
import { serverSummaryOf, type AggregationConfig, type UsableGroupingField } from './useGroupedData';

/**
 * `aggregations` as the summary columns the header query compiles from. An
 * entry naming no field or an unknown type contributes no node, so it renders
 * no number rather than a fabricated one.
 */
function summaryColumnsOf(aggregations: AggregationConfig[] | undefined): NonNullable<ListViewGroupQuerySource['columns']> {
  const out: Array<{ field: string; summary: NonNullable<ReturnType<typeof serverSummaryOf>> }> = [];
  for (const agg of aggregations ?? []) {
    if (!agg || typeof agg.field !== 'string' || agg.field === '') continue;
    const summary = serverSummaryOf(agg.type);
    if (summary) out.push({ field: agg.field, summary });
  }
  return out as NonNullable<ListViewGroupQuerySource['columns']>;
}

/** The grouping block the two compilers read, keyed on field names alone. */
function groupingOf(fields: readonly UsableGroupingField[]): ListViewGroupQuerySource['grouping'] {
  return { fields: fields.map((f) => ({ field: f.field })) } as ListViewGroupQuerySource['grouping'];
}

export interface ServerGroupHeadersInput {
  /** Whether the grid groups server-side at all. */
  enabled: boolean;
  dataSource?: DataSource;
  objectName?: string;
  /** The grouping entries the grid may group by, in nesting order. */
  fields: readonly UsableGroupingField[];
  /** The view's composed filter, lowered to a `FilterCondition`. */
  where?: FilterCondition;
  /** `object-grid.aggregations` — the per-group numbers besides the count. */
  aggregations?: AggregationConfig[];
  /** The object's field catalogue, for reference-typed grouping keys. */
  objectFields?: Record<string, { type?: unknown; reference?: unknown; displayField?: unknown } | undefined>;
  /** Any change re-asks the server (refresh, data invalidation). */
  reloadKey: string;
}

export interface ServerGroupHeaders {
  /**
   * Index `d` holds the answer of the depth-`d + 1` header query. `undefined`
   * until every depth has answered.
   */
  headers?: ListViewGroupHeaderRow[][];
  /**
   * Display labels for reference-typed grouping keys, per field, by the raw id
   * a header row carries — read off the referenced record. An id with no entry
   * keeps the id as its label.
   */
  keyLabels: Record<string, Record<string, string>>;
  loading: boolean;
  error: Error | null;
}

const IDLE: ServerGroupHeaders = { headers: undefined, keyLabels: {}, loading: false, error: null };

/**
 * Ask the server for the group set and every header number — one compiled
 * header query per nesting depth.
 */
export function useServerGroupHeaders(input: ServerGroupHeadersInput): ServerGroupHeaders {
  const { enabled, dataSource, objectName, fields, where, aggregations, objectFields, reloadKey } = input;
  const [state, setState] = useState<ServerGroupHeaders>(IDLE);

  // Keyed on CONTENT, never on the identity of an object a host may rebuild
  // every render (AGENTS.md #10).
  const fieldsKey = JSON.stringify(fields.map((f) => f.field));
  const whereKey = JSON.stringify(where ?? null);
  const aggregationsKey = JSON.stringify(summaryColumnsOf(aggregations));
  const referenceKey = JSON.stringify(
    fields.map((f) => {
      const def = objectFields?.[f.field];
      return isExpandableFieldType(def) && typeof def?.reference === 'string' && def.reference
        ? [def.reference, typeof def.displayField === 'string' ? def.displayField : null]
        : null;
    }),
  );
  const canAsk = enabled && !!objectName && typeof dataSource?.queryGroupHeaders === 'function' && fields.length > 0;

  useEffect(() => {
    if (!canAsk || !dataSource || !objectName) {
      // Leaving server grouping drops the last answer rather than keeping a
      // group set that no longer describes the view.
      setState((prev) => (prev === IDLE ? prev : IDLE));
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const fieldNames: string[] = JSON.parse(fieldsKey);
    const references: Array<[string, string | null] | null> = JSON.parse(referenceKey);
    const grouping = groupingOf(fieldNames.map((field) => ({ field })));
    const columns = JSON.parse(aggregationsKey) as NonNullable<ListViewGroupQuerySource['columns']>;
    const composedWhere = JSON.parse(whereKey) as FilterCondition | null;

    (async () => {
      try {
        const headers = await Promise.all(
          fieldNames.map((_, depthIndex) =>
            dataSource.queryGroupHeaders!(
              objectName,
              compileListViewGroupQuery(
                { grouping, columns },
                { ...(composedWhere ? { where: composedWhere } : {}), depth: depthIndex + 1 },
              ),
            ),
          ),
        );

        // Reference-typed keys are ids; read the records their labels come
        // from. Keyed off the deepest answer, which carries every key.
        const keyLabels: ServerGroupHeaders['keyLabels'] = {};
        const deepest = headers[headers.length - 1] ?? [];
        await Promise.all(
          fieldNames.map(async (field, i) => {
            const target = references[i];
            if (!target) return;
            const [reference, displayField] = target;
            const ids = [...new Set(deepest.map((row) => row[field]).filter((v) => v !== null && v !== undefined && v !== ''))];
            if (ids.length === 0) return;
            try {
              const result = await dataSource.find(reference, {
                $filter: { id: { $in: ids } },
                $top: ids.length,
              });
              const byId: Record<string, string> = {};
              for (const rec of (result?.data ?? []) as Array<Record<string, unknown>>) {
                const id = rec?.id;
                if (id === undefined || id === null) continue;
                const label = (displayField ? rec[displayField] : undefined)
                  ?? rec.name ?? rec.label ?? rec.title;
                if (label !== undefined && label !== null && label !== '') byId[String(id)] = String(label);
              }
              keyLabels[field] = byId;
            } catch (err) {
              // The ids still group correctly; only their labels are missing.
              console.warn(`[ObjectGrid] Failed to resolve group labels for '${field}' (${reference}):`, err);
            }
          }),
        );

        if (!cancelled) setState({ headers, keyLabels, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ headers: undefined, keyLabels: {}, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [canAsk, dataSource, objectName, fieldsKey, whereKey, aggregationsKey, referenceKey, reloadKey]);

  return state;
}

/** One leaf group whose rows the grid wants on screen. */
export interface ServerGroupLeaf {
  /** The composite key `useGroupedData` gave the group. */
  key: string;
  /** The raw key of every level from the outermost down to this group. */
  keyValues: Readonly<Record<string, unknown>>;
}

export interface ServerGroupRowsInput {
  enabled: boolean;
  dataSource?: DataSource;
  objectName?: string;
  fields: readonly UsableGroupingField[];
  where?: FilterCondition;
  /**
   * The grid's own row query — projection, expansion and order — WITHOUT a
   * filter or a window: each group supplies its own. `null` until the grid has
   * resolved it.
   */
  baseParams: Record<string, unknown> | null;
  pageSize: number;
  /** The leaf groups that are expanded and on screen. */
  leaves: readonly ServerGroupLeaf[];
  reloadKey: string;
}

export interface ServerGroupRowsPage {
  rows: Record<string, unknown>[];
  page: number;
  loading: boolean;
  error: Error | null;
}

export interface ServerGroupRows {
  /** The page of rows held for each leaf group, by its composite key. */
  pages: Readonly<Record<string, ServerGroupRowsPage>>;
  /** Turn one group's page. */
  setPage: (key: string, page: number) => void;
}

interface HeldPage extends ServerGroupRowsPage {
  /** The request this page answers — a different one means re-ask. */
  signature: string;
}

/**
 * Page the rows INSIDE each visible, expanded leaf group — one compiled row
 * query per group, `limit` / `offset` per group.
 */
export function useServerGroupRows(input: ServerGroupRowsInput): ServerGroupRows {
  const { enabled, dataSource, objectName, fields, where, baseParams, pageSize, leaves, reloadKey } = input;
  const [held, setHeld] = useState<Record<string, HeldPage>>({});

  const fieldsKey = JSON.stringify(fields.map((f) => f.field));
  const whereKey = JSON.stringify(where ?? null);
  const paramsKey = JSON.stringify(baseParams ?? null);
  const leavesKey = JSON.stringify(leaves.map((l) => [l.key, l.keyValues]));
  const queryKey = JSON.stringify([fieldsKey, whereKey, paramsKey, pageSize, reloadKey]);

  // The page each group is on, recorded AGAINST the question it was turned
  // under: a different question (filter, sort, page size, a refresh) makes
  // every recorded page stale, so each group starts over at its first page —
  // read that way at once, rather than reset one render late.
  const [turned, setTurned] = useState<{ queryKey: string; pages: Record<string, number> }>({ queryKey, pages: {} });
  const pageByKey = turned.queryKey === queryKey ? turned.pages : {};

  const canAsk = enabled && !!objectName && !!dataSource && baseParams !== null && fields.length > 0;
  const pagesKey = JSON.stringify(pageByKey);

  useEffect(() => {
    if (!canAsk || !dataSource || !objectName || !baseParams) return;
    const fieldNames: string[] = JSON.parse(fieldsKey);
    const grouping = groupingOf(fieldNames.map((field) => ({ field })));
    const composedWhere = JSON.parse(whereKey) as FilterCondition | null;
    const wanted: Array<[string, Record<string, unknown>]> = JSON.parse(leavesKey);

    for (const [key, keyValues] of wanted) {
      const page = (JSON.parse(pagesKey) as Record<string, number>)[key] ?? 1;
      const signature = JSON.stringify([queryKey, key, page]);
      // Already asked (answered or in flight) for exactly the page on screen.
      // A response to any OTHER request for this group is dropped on arrival
      // by the same signature, so paging back and forth never shows a stale
      // page under the pager's number.
      if (held[key]?.signature === signature) continue;
      setHeld((prev) => ({
        ...prev,
        [key]: { rows: prev[key]?.rows ?? [], page, loading: true, error: null, signature },
      }));

      const compiled = compileListViewGroupRowsQuery({ grouping }, keyValues, {
        ...(composedWhere ? { where: composedWhere } : {}),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      // The grid's projection / expansion / order, the group's filter and
      // window. A text search has no counterpart on the header query, so it
      // is never sent here either — the rows must stay the rows the header
      // counted.
      const { $search: _search, $searchFields: _searchFields, $filter: _filter, ...rest } = baseParams as Record<string, unknown>;
      const params = {
        ...rest,
        $filter: compiled.where,
        $top: compiled.limit,
        $skip: compiled.offset,
      };

      dataSource
        .find(objectName, params as QueryParams)
        .then((result) => {
          setHeld((prev) => (prev[key]?.signature === signature
            ? { ...prev, [key]: { rows: result?.data ?? [], page, loading: false, error: null, signature } }
            : prev));
        })
        .catch((err) => {
          setHeld((prev) => (prev[key]?.signature === signature
            ? { ...prev, [key]: { rows: [], page, loading: false, error: err instanceof Error ? err : new Error(String(err)), signature } }
            : prev));
        });
    }
    // `held` is read to skip a request already answered; naming it would
    // re-run this effect on every answer, which asks nothing new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAsk, dataSource, objectName, fieldsKey, whereKey, leavesKey, pagesKey, queryKey, pageSize]);

  const setPage = useCallback((key: string, page: number) => {
    setTurned((prev) => {
      const pages = prev.queryKey === queryKey ? prev.pages : {};
      return pages[key] === page && prev.queryKey === queryKey
        ? prev
        : { queryKey, pages: { ...pages, [key]: page } };
    });
  }, [queryKey]);

  // The held STATE itself, not a projection memoised over it: a consumer
  // keys an effect on it, and a state value's identity is a promise React
  // keeps where a memo's is not (AGENTS.md #10).
  return { pages: held, setPage };
}
