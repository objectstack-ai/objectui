/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * LineItemsPanel — the `record:line_items` component. Renders a child "line
 * items" grid bound to an EXISTING parent record (on a record/detail page or
 * a slotted page slot). Loads children by FK, lets the user add/edit/delete
 * rows, and persists the diff on Save. See ADR-0001.
 *
 * Parent id is taken from the component props (`recordId`/`parentId`) or from
 * the surrounding <RecordContextProvider>. dataSource comes from the
 * SchemaRenderer context.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from '@object-ui/components';
import { LineItemsField, type GridColumn } from '@object-ui/fields';
import { createSafeTranslation } from '@object-ui/i18n';
import { useSchemaContext, useRecordContext, useFilterScope, useResolvedFilter } from '@object-ui/react';
import { usePermissions } from '@object-ui/permissions';
import { buildMasterDetailEditBatch, sumRows } from './masterDetailTx';
import { applyColumnPermissions } from './fieldWriteGate';
import {
  runBatchTransaction,
  mergeFilterNodes,
  filterRefusalSubject,
  toFilterNodeSafely,
  convertSortToQueryParams,
} from '@object-ui/core';

// The malformed-filter state (objectui#9050 step 2). A provider-less host —
// a standalone embed, this package's own tests — must read the sentence rather
// than the raw key, which is what `createSafeTranslation` is for; the row is
// byte-identical to the `en` pack, enforced by `defaults-maps-mirror-en-pack`.
const useLineItemsTranslation = createSafeTranslation(
  {
    'view.malformedFilter': 'This view’s filter is malformed, so no records are shown: the {{subject}} condition cannot be applied.',
  },
  'view.malformedFilter',
);

export interface LineItemsPanelSchema {
  type?: 'record:line_items';
  childObject: string;
  relationshipField: string;
  columns: GridColumn[];
  parentObject?: string;
  parentId?: string;
  recordId?: string;
  amountField?: string;
  totalField?: string;
  title?: string;
  readonly?: boolean;
  minRows?: number;
  maxRows?: number;
  /**
   * *Additional* criteria for the child rows, in any shape `toFilterNode`
   * accepts (spec `ViewFilterRule[]`, ObjectQL AST nodes, or a MongoDB-style
   * object).
   *
   * AND-combined with the parent relationship condition, never substituted for
   * it (objectstack#7137, exactly as `record:related_list` does since
   * objectstack#7118): a line-items panel is always scoped to the record it sits
   * on, so an additional criterion can only narrow this parent's children — it
   * can never surface another parent's rows. When a `dataSource` binding is
   * present, `ElementDataSourceGate` has already AND-combined this key with the
   * view's filter and the binding's own before the schema arrives here.
   */
  filter?: any[] | Record<string, any>;
  /**
   * Load order for the child rows — the spec's `SortConfig[]`. Without one the
   * rows arrive in storage order. The legacy `"line_no desc"` clause is RETIRED
   * (objectui#8221): `convertSortToQueryParams` refuses it out loud.
   */
  sort?: Array<{ field?: string; order?: 'asc' | 'desc' }>;
  /**
   * Row cap for the child fetch; defaults to {@link DEFAULT_LINE_ITEMS_LIMIT}.
   * A line-items grid has no pagination control — every loaded row is editable
   * and saved as one batch — so this is the author's window, not a page size.
   */
  limit?: number;
}

/**
 * Child rows fetched when the author declared no `limit` — the window this panel
 * has always used, now authorable (objectstack#7137).
 */
export const DEFAULT_LINE_ITEMS_LIMIT = 500;

/**
 * What the contract admits as a row cap for this panel.
 *
 * `@objectstack/spec` has already answered what `limit: 0` means: the element
 * data source `limit` that a `dataSource` binding lowers into this key is
 * declared a POSITIVE INTEGER (`z.number().int().positive().optional()`), and
 * so is the `pagination.pageSize` of a named view that fills it. So `0` is not
 * a spelling whose meaning this renderer may choose; it is a value the contract
 * refuses, and a renderer that forwards it to the wire is the only party not
 * saying so.
 */
function isUsableRowLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * The ONE resolver for this panel's row cap, for the reason objectui#9853 gave
 * when it landed the same shape on `ObjectGrid` and objectui#9897 repeated on
 * `ListView`: one resolver at every entry is what keeps the answer single.
 *
 * Before objectui#9925 this read was a bare `schema.limit ?? DEFAULT_LINE_ITEMS_LIMIT`,
 * and `??` rejects only `null` and `undefined` — so an authored `limit: 0` was
 * not nullish and survived as a real window. It reached the wire as `$top: 0`,
 * the panel asked the server for nothing, and the empty grid named no cause. A
 * negative goes out the same way. Both ENTRANCES converge on this key: a
 * `dataSource` binding lowers a named view's `pagination.pageSize` into
 * `schema.limit` before this component sees it (`RECORD_LINE_ITEMS_DATA_SOURCE`
 * maps `limit: 'limit'`), and a panel with no binding at all reads the authored
 * `limit` from the same place — so resolving HERE covers both, which a repair at
 * the lowering layer could not.
 *
 * ⚠️ The refusal is FAIL-SOFT on purpose. Throwing would take out the whole
 * panel over one declaration, which is a worse outcome than the defect. The
 * value is dropped, this panel's own default is used, and
 * `describeRefusedRowLimit` states it once through the channel this component
 * already uses for "you declared it, the renderer dropped it" (the same
 * `console.warn` the `childObject` declines below write to). ⛔ Not a silent
 * clamp, and ⛔ not a clamp to 1: the author's number is refused, not repaired.
 */
function resolveRowLimit(authored: unknown, fallback: number): number {
  return isUsableRowLimit(authored) ? authored : fallback;
}

/**
 * The diagnostic half. `null` means "nothing to say" — an absent `limit` is not
 * a mistake, and a usable one is not either, so the message is CONDITIONAL and
 * the silence controls in the pin are what keep it from being an always-on
 * marker that states nothing.
 *
 * ⛔ NOT a second guard: the predicate lives once, in `isUsableRowLimit`, and
 * this reads it. Two predicates would be free to drift, and the drift would be
 * invisible — a value refused by one and admitted by the other.
 */
function describeRefusedRowLimit(authored: unknown, childObject: unknown): string | null {
  if (authored === undefined || authored === null) return null;
  if (isUsableRowLimit(authored)) return null;
  const where =
    typeof childObject === 'string' && childObject
      ? `record:line_items on ${childObject}`
      : 'record:line_items';
  return (
    `[ObjectUI] LineItemsPanel row cap: ${where} declared limit: ${String(authored)}, `
    + 'which is not a positive integer. A row cap must be a positive integer '
    + '(the spec refuses zero and negative values), so it was ignored and this '
    + `panel fell back to its default row cap (${DEFAULT_LINE_ITEMS_LIMIT}).`
  );
}

export const LineItemsPanel: React.FC<{ schema: LineItemsPanelSchema }> = ({ schema }) => {
  const ctx = useSchemaContext() as any;
  const { t } = useLineItemsTranslation();
  const dataSource = ctx?.dataSource;
  // useRecordContext returns null outside a <RecordContextProvider> (e.g. in the
  // Studio designer/palette), so it never throws — call it unconditionally to
  // keep hook order stable across renders. A null record just means "no parent
  // record bound", which the optional chaining below already handles.
  const record = useRecordContext();
  // The caller's field-level grants on the CHILD object. With no provider
  // mounted this is the fail-open answer (`isLoaded` false) and the grid below
  // renders exactly as it did before permissions existed (objectui#10163).
  const perms = usePermissions();

  const parentObject = schema.parentObject || record?.objectName;
  // No assertion: `RecordContextValue.recordId` is the protocol's `string`
  // (narrowed once at the `RecordContextProvider` injection boundary) and
  // `buildMasterDetailEditBatch` takes a `string` parent id, so the two
  // declarations meet on their own. objectui#9304 left a documented assertion
  // here as evidence that they did not; objectui#9333 repaired the declaration
  // and discharged the evidence.
  const parentId = schema.parentId || schema.recordId || record?.recordId;

  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [original, setOriginal] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Child object schema — used to strip computed / read-only columns from each
  // row before persisting (parity with the parent form's sanitize). Rows are
  // loaded from a full read, so an edit would otherwise round-trip formula /
  // summary columns the server rejects as unknown fields.
  const [childSchema, setChildSchema] = useState<{ fields?: Record<string, any> } | null>(null);
  useEffect(() => {
    const ds: any = dataSource;
    if (!ds || typeof ds.getObjectSchema !== 'function') return;
    // Decline to fetch when the child object never resolved (objectui#6188).
    // `childObject` is declared `required: true` on this block's registry entry
    // and typed `string` above, but nothing enforces either — `inputs[].required`
    // is designer metadata, and the block has no spec schema — so a node reaches
    // this renderer straight off an authored schema with the key `undefined`, and
    // the fetch below then asked the data layer for an object literally named
    // `undefined`. `RelatedList` already takes the other choice for the same class
    // of missing key ("has no referenceField/parentId — refusing to fetch all
    // rows", RelatedList.tsx), and `MasterDetailForm` declines on this exact key
    // (objectui#5940) with its child-schema cache spelling it `.filter(Boolean)`.
    //
    // Clearing the cache rather than just returning: an unresolvable panel HAS no
    // child schema, and leaving a previous object's schema in place would sanitize
    // the next save against the wrong object's fields. `null` is what the `.catch`
    // below already produces, so the sanitize path needs no new case.
    if (!schema.childObject) {
      setChildSchema(null);
      console.warn(
        `[LineItemsPanel] a line-items panel has no childObject — refusing to fetch its child schema. Set childObject to the child object the panel lists.`,
      );
      return;
    }
    let cancelled = false;
    ds.getObjectSchema(schema.childObject)
      .then((s: any) => { if (!cancelled) setChildSchema(s ?? null); })
      .catch(() => { if (!cancelled) setChildSchema(null); });
    return () => { cancelled = true; };
  }, [dataSource, schema.childObject]);

  // [objectui#9925] The loud half of the row-cap refusal, on the channel this
  // component already uses for "you declared it, the renderer dropped it" (the
  // `childObject` declines above and in `load`). Keyed on the DECLARATION, so
  // it is one warning per declaration rather than one per render — and it fires
  // from an effect, never from render, so a re-render with the same authored
  // value says nothing a second time. (This panel parses no config of its own,
  // so before this card nothing in the renderer looked at `limit` at all.)
  useEffect(() => {
    const message = describeRefusedRowLimit(schema.limit, schema.childObject);
    if (message) console.warn(message);
  }, [schema.limit, schema.childObject]);

  // Content keys, not identities: an inline `filter` / `sort` on a schema node is
  // a new object every render and both are inputs to `load` (which an effect
  // below depends on) — keying on identity would refetch the children on every
  // render. Same reason `RelatedList` keys its own scope filter on content.
  //
  // ⚠️ `toFilterNodeSafely`, not `toFilterNode` — objectui#9050. This is a
  // RENDER-time `useMemo`, so a `FilterOperatorError` from the lowering is a
  // render error with no load `catch` and no `classifyLoadError` above it. The
  // refusal is kept as a VALUE and rendered below; collapsing it to
  // `undefined` would mean "no filter" and load this panel's rows
  // unconstrained, the silent widening objectui#9001 closed.
  //
  // objectui#10666 — the panel's own `filter` is lowered AFTER every context
  // token in it (`{current_user_id}`, `{current_org_id}`, the date macros) is
  // resolved ONCE through `@object-ui/core`'s shared
  // `resolveFilterPlaceholders`, against the session scope the host provides,
  // and HELD by structure (`useResolvedFilter` in `@object-ui/react`). The
  // panel merged the literal token into the parent scope before. The content
  // key is taken over the held value, so a new signed-in user moves it and
  // reloads, and a date macro such as `{now}` does not move it every render.
  const filterScope = useFilterScope();
  const scopeFilter = useResolvedFilter(schema.filter, filterScope);
  const filterKey = JSON.stringify(scopeFilter ?? null);
  const sortKey = JSON.stringify(schema.sort ?? null);
  const listFilterResult = useMemo(
    () => toFilterNodeSafely(scopeFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on CONTENT, see above
    [filterKey],
  );
  const filterRefusal = listFilterResult.ok ? undefined : listFilterResult.refusal;
  const listFilterNode = listFilterResult.ok ? listFilterResult.node : undefined;
  const orderBy = useMemo(
    () => convertSortToQueryParams(schema.sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on CONTENT, see above
    [sortKey],
  );

  const load = useCallback(async () => {
    if (!dataSource || !parentId) {
      setLoading(false);
      return;
    }
    // A refused filter never reaches the wire (objectui#9050). The render below
    // shows the malformed-filter state instead; this guard is what keeps "no
    // filter node" from being read as "no filter" by the query built here.
    if (filterRefusal) {
      setLoading(false);
      return;
    }
    // Decline to fetch when the child object never resolved (objectui#6194) —
    // the SIBLING site of the child-schema decline above (objectui#6188), and
    // the second of this component's two reads of `schema.childObject`. Same
    // reason it is a defect and not a shrug: nothing enforces the key (see the
    // effect above), so an authored node reaches this renderer with it
    // `undefined` and the fetch below then asked the data layer to `find` an
    // object literally named `undefined`, scoped by
    // `{ [relationshipField]: parentId }`.
    //
    // Ordered AFTER the dataSource/parentId guard on purpose, exactly as the
    // child-schema effect orders its own: a designer palette renders this block
    // with no dataSource at all while the author is still configuring it, and
    // warning there would be noise about a panel nobody has finished authoring.
    //
    // `setLoading(false)` because this panel is NOT loading. It can never
    // resolve, and holding `loading` true would only hide a permanent authoring
    // error behind a spinner that never ends — the render below therefore reads
    // `schema.childObject` ahead of `loading` and says what is wrong.
    if (!schema.childObject) {
      setLoading(false);
      console.warn(
        `[LineItemsPanel] a line-items panel has no childObject — refusing to fetch its rows. Set childObject to the child object the panel lists.`,
      );
      return;
    }
    setLoading(true);
    try {
      // Parent relationship AND the panel's own criteria (objectstack#7137).
      // The parent condition is not negotiable — an "additional" criterion may
      // only narrow THIS parent's children — and with nothing authored the query
      // is the untouched MongoDB-style object it has always been rather than a
      // freshly lowered AST meaning the same thing (invisible on screen, visible
      // to every caller pinning the wire). Composed through the repo's single
      // filter sink, the same way `record:related_list` composes its own.
      const parentScope = { [schema.relationshipField]: parentId } as Record<string, any>;
      const res = await dataSource.find(schema.childObject, {
        $filter:
          listFilterNode === undefined
            ? parentScope
            : mergeFilterNodes(parentScope, listFilterNode),
        ...(orderBy ? { $orderby: orderBy } : {}),
        $top: resolveRowLimit(schema.limit, DEFAULT_LINE_ITEMS_LIMIT),
      });
      const data = (res?.data ?? []) as Record<string, any>[];
      setRows(data.map((r) => ({ ...r })));
      setOriginal(data.map((r) => ({ ...r })));
      setDirty(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to load line items');
    } finally {
      setLoading(false);
    }
  }, [
    dataSource,
    parentId,
    schema.childObject,
    schema.relationshipField,
    schema.limit,
    filterRefusal,
    listFilterNode,
    orderBy,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const onChange = useCallback((next: Record<string, any>[]) => {
    setRows(next);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    // `childObject` joins this guard for the same reason both reads decline
    // (objectui#6194): every child op below carries `object: schema.childObject`,
    // so an unresolvable panel would WRITE rows into an object literally named
    // `undefined` — strictly worse than the read this card was filed for.
    // Measured on the pre-fix component, which is why this is not a guess: one
    // keystroke in the grid's always-present ghost row materialised a non-blank
    // row, that enabled Save, and Save reached
    // `batchTransaction([{ object: undefined, action: 'create', … }])`.
    // The render branch below closes that route by not offering the grid, but a
    // write contract is not the render tree's to keep: this is the same one-line
    // guard `load` takes, on the component's other data-layer entry point.
    if (!dataSource || !parentId || !schema.childObject) return;
    setSaving(true);
    setError(null);
    try {
      // Only roll the line total up onto the parent when we know the parent
      // object AND a target field — same gate as before. When we do, the parent
      // update rides in the SAME batch as the child writes, so the rollup is now
      // atomic with them (on an adapter that supports it) instead of a separate
      // trailing update.
      const canRollup = !!(parentObject && schema.totalField);
      const parentPatch = canRollup
        ? { [schema.totalField!]: sumRows(rows, schema.amountField || 'amount') }
        : {};
      let ops = buildMasterDetailEditBatch(parentObject ?? '', parentId, parentPatch, [
        {
          childObject: schema.childObject,
          relationshipField: schema.relationshipField,
          rows,
          original,
          // Strip computed / read-only columns from each child row payload.
          childSchema,
        },
      ]);
      // With no parent object / rollup to write, there is nothing to update on
      // the parent — drop op 0. Safe: edit-batch children carry the parentId
      // directly (no $ref), so slicing off the parent op shifts no references.
      if (!canRollup) ops = ops.slice(1);
      if (ops.length) await runBatchTransaction(dataSource, ops);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save line items');
    } finally {
      setSaving(false);
    }
  }, [dataSource, parentId, rows, original, schema, parentObject, load, childSchema]);

  const gridField = useMemo(
    () =>
      ({
        // FLS gate, through the ONE render pass the record-form containers
        // share: a column the caller may not read is omitted, and one they may
        // read but not edit renders its cells locked — on the same page where
        // the surrounding form already disables that field (objectui#10163).
        // Adding and removing lines stay on `schema.readonly` below.
        columns: applyColumnPermissions(schema.columns, { perms, objectName: schema.childObject }),
        total_field: schema.totalField ? schema.amountField || 'amount' : undefined,
        min_rows: schema.minRows,
        max_rows: schema.maxRows,
        allow_add: !schema.readonly,
        allow_delete: !schema.readonly,
      }) as any,
    [schema, perms],
  );

  return (
    <Card className={cn('shadow-none')}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">{schema.title || 'Line Items'}</CardTitle>
        {!schema.readonly && (
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={saving || loading || !dirty || !parentId}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        {/* An unresolvable panel gets its OWN branch, ahead of `loading`
            (objectui#6194) — following objectui#5940's config-hint precedent for
            this exact key, and `AdvancedChartImpl`'s refusal placeholders
            ("This chart cannot plot its category axis: no row has a `x` field").
            Two things it must not do. It must not fall through to the grid: an
            empty EDITABLE grid with an Add button, over an object that does not
            exist, is a worse outcome than the unguarded fetch this card removes,
            and it is exactly what made the save path reachable. And it must not
            sit on `loading`, which would hide a permanent authoring error behind
            a spinner that can never end. Checked BEFORE `loading` because
            nothing here is pending — the schema itself already says this panel
            can never resolve, so there is no first paint where "Loading…" is
            true. */}
        {/* objectui#9050 step 2 — the authored `filter` did not lower, so this
            panel has no query it is allowed to send. Ahead of every branch
            below for the same reason the `childObject` branch is ahead of
            `loading`: nothing is pending, and falling through to an editable
            grid over rows that were never scoped is the worse outcome. It NAMES
            the operator, which is what separates this from the generic
            "Component failed to render" banner a `SchemaErrorBoundary` shows —
            and this panel can be mounted with no such boundary above it at
            all. */}
        {filterRefusal ? (
          <div
            role="alert"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
            data-testid="line-items-malformed-filter"
          >
            {/* Separately addressable: this is the half that has to NAME the
                operator, and the technical line below repeats the token
                incidentally. */}
            <p className="font-medium" data-testid="line-items-malformed-filter-subject">
              {t('view.malformedFilter', { subject: filterRefusalSubject(filterRefusal) ?? '' })}
            </p>
            <p className="mt-1 text-xs opacity-80">{filterRefusal.message}</p>
          </div>
        ) : !schema.childObject ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="line-items-no-child-object"
          >
            This panel has no child object configured: set{' '}
            <code className="font-mono">childObject</code> to the object whose rows it lists.
          </p>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : !parentId ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Save the record first to add line items.
          </p>
        ) : (
          <LineItemsField value={rows} onChange={onChange} field={gridField} readonly={schema.readonly} />
        )}
      </CardContent>
    </Card>
  );
};
