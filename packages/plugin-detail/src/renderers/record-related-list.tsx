/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `record:related_list` — renders a list of records related to the current
 * record (parent-child / lookup back-reference). Props mirror the spec
 * `RecordRelatedListComponentProps` shape; the existing RelatedList expects
 * the legacy `referenceField` / `pageSize` names, so we adapt here.
 */

import React from 'react';
import {
  ElementDataSourceGate,
  useRecordContext,
  useSafeFieldLabel,
  useRelatedRecordActions,
  type ElementDataSourceMapping,
} from '@object-ui/react';
import { useFieldPermissions, usePermissions } from '@object-ui/permissions';
import { useObjectTranslation, pickLocalized } from '@object-ui/i18n';
import { humanizeLabel } from '@object-ui/fields';
import {
  columnIdentity,
  elementDataSourceBlock,
  type ElementDataSourceConfig,
} from '@object-ui/core';
import type { RecordRelatedListComponentProps } from '@object-ui/types';
import { RelatedList } from '../RelatedList';
import { useRecordAriaProps } from './recordComponentAria';

/**
 * Normalize a column entry (string | {field} | {name} | {key}) to its name.
 * `key` is kept as a tail fallback rather than folded into `columnIdentity`:
 * it is a generic entry key, not ObjectStack metadata identity (#3104).
 */
const colName = (entry: any): string | null =>
  columnIdentity(entry) || (entry && typeof entry === 'object' ? entry.key : null) || null;

/** Extract a record's primary key, tolerating the `id` / `_id` split. */
const rowId = (row: any): string | number | null => row?.id ?? row?._id ?? null;

/**
 * Spec default for `RecordRelatedListProps.limit` (`.default(5)` — "Number of
 * records to display initially"). Zod materializes defaults only when the
 * metadata passes through a spec parse; the synthesized default record page
 * hands us raw nodes, so the renderer enforces the contract's default itself
 * (issue #2711 — without it related lists rendered ALL child rows unpaged).
 */
const SPEC_DEFAULT_LIMIT = 5;

const splitDesigner = (props: Record<string, any>) => {
  const { 'data-obj-id': id, 'data-obj-type': type, style, ...rest } = props || {};
  return { designer: { 'data-obj-id': id, 'data-obj-type': type, style }, rest };
};

export interface RecordRelatedListRendererProps {
  /**
   * The AUTHORED node, before the per-element `dataSource` binding is resolved.
   *
   * `objectName` is optional HERE and required everywhere else, and the
   * difference is the whole point of objectstack#6953: the exported name is the
   * `ElementDataSourceGate` wrapper below, and the gate maps the binding's
   * `object` onto `objectName` (its default target — see `ElementDataSourceGate`
   * `objectKey = 'objectName'`) before `RecordRelatedListBody` ever sees the
   * schema. A related list authored as `{ relationshipField, dataSource: {
   * object, view } }` is therefore legal input to this component and illegal
   * input to the spec's `RecordRelatedListProps`, which is correct on both
   * sides — one describes what an author writes, the other what the block reads.
   *
   * Spelling it `RecordRelatedListComponentProps` flat said the opposite, and
   * said it about the wrapper: the exact authoring shape #6953 added did not
   * type-check against the component that exists to accept it. The body already
   * reads the key defensively (`objectName && …`, `objectName || ''`) precisely
   * because it can arrive unbound; this declaration now agrees with that code.
   *
   * ## The looseness is NAMED, not open (objectui#9963)
   *
   * That is the whole of it: `objectName` optional, and `dataSource` admitted
   * as the binding the gate reads — typed with the gate's own declaration of
   * it, `ElementDataSourceConfig`. Every other member is the mirror's. This
   * type used to add `& Record<string, any>` (and the interface
   * `[k: string]: any`), which admitted ANY key at `any`, so a misspelled
   * declared key type-checked at every read below, cast or not — the refusal
   * the mirror declares stopped one layer short of the reads it exists for.
   *
   * ⛔ Do not reopen it to admit a key the renderer reads through a cast
   * (`requiredPermissions`, `enforceFieldSecurity`, `redactFields`): no block
   * the contract maps onto this tag declares them, and objectui#8649 routed
   * them to the producer rather than to a declaration here.
   */
  schema?: Omit<RecordRelatedListComponentProps, 'objectName'> &
    Partial<Pick<RecordRelatedListComponentProps, 'objectName'>> & {
      /**
       * The per-element binding (`@objectstack/spec` `PageComponentSchema.dataSource`,
       * objectstack#6953). Read by `ElementDataSourceGate`, never by the body:
       * the gate maps it onto `objectName` / `columns` / `filter` / `sort` /
       * `limit` first.
       */
      dataSource?: ElementDataSourceConfig;
    };
  className?: string;
  /**
   * The designer's host props — the three keys `splitDesigner` reads and puts
   * back on the container. The registry's own call is untyped
   * (`ComponentRenderer<T = any>`), so what it forwards and nothing here reads
   * is deliberately NOT declared.
   */
  style?: React.CSSProperties;
  'data-obj-id'?: string;
  'data-obj-type'?: string;
}

const RecordRelatedListBody: React.FC<RecordRelatedListRendererProps> = ({
  // ⛔ NOT `{} as any` — the annotation-erasing default objectui#8649 repaired.
  // The mechanism and why the spelling tracks the annotation are written once,
  // at the same site in `record-details.tsx`.
  schema = {} as NonNullable<RecordRelatedListRendererProps['schema']>,
  className,
  ...props
}) => {
  const ctx = useRecordContext();
  const { designer } = splitDesigner(props);
  /**
   * The block's authored `aria` bag, honoured through the family's ONE read
   * point (objectui#9556). Called here, with the other hooks, because every
   * renderer below it has early returns.
   *
   * ⛔ No `defaultRole`: with nothing authored this container stays the bare
   * `div` it has always been, so a page that never wrote `aria` renders
   * byte-identical DOM. An author who does write one gets a `region` to carry
   * it — see `recordComponentAria.ts` for why the attribute alone would reach
   * nobody.
   */
  const ariaProps = useRecordAriaProps(schema.aria);
  const i18n = useSafeFieldLabel();
  const { language } = useObjectTranslation();

  const objectName = schema.objectName;

  // Resolve a human-friendly title:
  //   1. authored `schema.title` wins — via pickLocalized so inline-i18n
  //      shapes (`{ en, 'zh-CN' }`) resolve instead of rendering "[object Object]"
  //   2. translated object label via i18n (key `objects.{name}.label`)
  //   3. humanized objectName (e.g. `opportunity_quote` → "Opportunity Quote")
  //   4. literal `'Related'` as final fallback
  const resolvedObjectLabel = objectName && (i18n as any).objectLabel
    ? (i18n as any).objectLabel({ name: objectName, label: humanizeLabel(objectName) })
    : objectName
      ? humanizeLabel(objectName)
      : '';
  const title = pickLocalized(schema.title, language) || resolvedObjectLabel || 'Related';

  const perms = usePermissions();
  const { readableFields } = useFieldPermissions(objectName || '');

  // Host-provided CRUD + action handlers for this child object. Absent when no
  // host wired the provider (Studio designer, standalone embed) — the related
  // list then stays read-only. The host decides, per child object, which of
  // create / edit / delete / view it exposes (lifecycle affordances + FLS), so
  // we simply wire whatever comes back. `resolve` is passed the relationship so
  // a newly-created child is pre-linked to the current parent.
  // [ADR-0090 SDUI panels] Which PARENT field the junction's relationshipField
  // stores (spec `relationshipValueField`, default 'id'). Name-keyed junctions
  // (e.g. sys_user_position.position stores sys_position.name) set 'name' —
  // the resolved value drives the list filter, the Add-picker link value, AND
  // the pre-filled create form, so all three stay consistent. While the parent
  // record is still loading a non-id value resolves to null, which RelatedList
  // treats as "don't fetch yet".
  //
  // Read UN-CAST (objectui#9475). The mirror declares the key
  // (`RecordRelatedListComponentProps.relationshipValueField`, aligned to the
  // contract by objectui#9469/#8649), and a cast here unwrapped that
  // declaration at the one site it was added for: the read carried `any`, so
  // the annotation bought nothing HERE — the same declaration-defeated-by-a-cast
  // shape that card's contract review recorded as D1 on `record-reference-rail.tsx`.
  // What the un-cast read carries, and what it still does NOT refuse, is
  // re-derived every run by `record-related-list.relationshipValueFieldUncast-9475.test.tsx`
  // rather than written down here (AGENTS.md #9).
  const relationshipValueField: string = schema.relationshipValueField || 'id';
  const parentLinkValue: string | number | null =
    relationshipValueField === 'id'
      ? ((ctx?.recordId ?? null) as string | number | null)
      : ((ctx?.data as any)?.[relationshipValueField] ?? null);

  const relatedActions = useRelatedRecordActions();
  const handlers = React.useMemo(
    () =>
      // The `objectName &&` gate is the objectui#8649 erasure repair surfacing a
      // latent contract violation, not a behaviour change. `schema.objectName`
      // is OPTIONAL on this component by declaration (see the annotation above:
      // the gate binds it from `dataSource`, so it can arrive unbound), while
      // `ResolveRelatedRecordActionsInput.objectName` is `string`. Until the
      // default stopped erasing the annotation both read `any` and the mismatch
      // was invisible; `tsc` names it as TS2322 now.
      //
      // Output-identical, and both halves are measured rather than assumed:
      // `resolve` is pure and its only use of the key is
      // `objects.find((o) => o?.name === objectName)`, which finds nothing for
      // `undefined` and returns `{}`; and `handlers` is never read on this path
      // — the `if (!objectName)` placeholder return below (kept AFTER the hooks
      // for hook-order stability) discards it. So the gate replaces a discarded
      // `{}` with a discarded `null` and skips a lookup that could never hit.
      objectName
        ? (relatedActions?.resolve({
            objectName,
            relationshipField: schema.relationshipField,
            parentId: parentLinkValue,
          }) ?? null)
        : null,
    [relatedActions, objectName, schema.relationshipField, parentLinkValue],
  );

  // Missing objectName renders a designer placeholder — checked AFTER the hooks
  // above so hook order stays stable across renders.
  if (!objectName) {
    return (
      <div className={className} {...designer}>
        <div className="text-xs text-muted-foreground italic px-3 py-2 border border-dashed rounded">
          record:related_list — missing objectName
        </div>
      </div>
    );
  }

  // Automatic object-level read gate (objectui#2359). Related lists surface
  // the CHILD object's records, so they require `read` on that object — the
  // schema author never has to remember an explicit `requiredPermissions`
  // opt-in for this baseline. When the permission system has loaded and
  // denies read, the whole section vanishes (no header, no empty grid, no
  // "New" button that would 403 on save). Gated on `isLoaded` so unmounted /
  // still-loading permission contexts (Studio designer, standalone embeds)
  // keep rendering — the server enforces data access either way.
  if (perms.isLoaded && !perms.can(objectName, 'read')) {
    return null;
  }

  const required: string[] = Array.isArray((schema as any).requiredPermissions)
    ? (schema as any).requiredPermissions
    : [];
  /**
   * Block-level ADR-0066 CAPABILITY gate, read fail-closed (objectui#10155 —
   * the sibling family of objectui#10058, ruling batch #192 item 5 letter B).
   *
   * `requiredPermissions` on a record block is a **system capability set** —
   * the one meaning the word carries on `action`, `app`, `field` and
   * `bulkAction` — so it is read through the permission context's capability
   * path (`hasCapabilities` over the reported `systemPermissions`). An unheld
   * or unrecognised capability hides the whole section.
   *
   * ⛔ NOT `perms.can(objectName, name)`. That call's second argument is the
   * closed object-action enum, and the stock `/me/permissions` provider maps
   * only eight verbs (`read`, `view`, `create`, `update`, `edit`, `delete`,
   * `import`, `export`) before its `?? 'allowRead'` tail sends everything else
   * to the object's read bit — so a capability nobody holds passed for every
   * reader of the object, with no refusal, no warning and no log. The full
   * reproduction behind that sentence is written once, at the same gate in
   * `record-quick-actions.tsx`, and is not restated here.
   *
   * ⛔ The object name is deliberately ABSENT from the verdict: a system
   * capability is not object-scoped. This site never carried the
   * `&& objectName` conjunct its siblings did and never needed one — the
   * "record:related_list — missing objectName" placeholder above returns
   * first — but the name it handed to the object-action path was the wrong
   * question either way.   *
   * ⚠️ A provider that never REPORTS capabilities (`systemPermissions`
   * `undefined` — the role-based `PermissionProvider`, a backend predating
   * ADR-0066, or no provider at all) still opens this gate. That is
   * `hasCapabilities`'s own ruled unreported-vs-empty doctrine
   * (objectui#4656), shared with every other capability gate in the tree; a
   * REPORTED empty array (`[]`, "holds nothing") is a real answer and gates
   * strictly.
   */
  if (required.length > 0 && !perms.hasCapabilities(required)) {
    return (
      <div className={className} {...designer} role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground italic">
          Insufficient permissions to view related list.
        </p>
      </div>
    );
  }

  const enforceFLS = (schema as any).enforceFieldSecurity === true;
  const redact: string[] = Array.isArray((schema as any).redactFields)
    ? (schema as any).redactFields
    : [];
  const rawColumns: any[] = Array.isArray(schema.columns) ? (schema.columns as any[]) : [];
  let filteredColumns: any[] = rawColumns;
  if (enforceFLS || redact.length > 0) {
    const names = rawColumns.map(colName).filter((n): n is string => !!n);
    const allowed = new Set(
      (enforceFLS ? readableFields(names) : names).filter((n) => !redact.includes(n)),
    );
    filteredColumns = rawColumns.filter((c) => {
      const n = colName(c);
      // Fail CLOSED on an entry this fold cannot NAME (objectui#8793). The
      // else-branch used to KEEP such an entry, and that was the bypass: the
      // block resolves identity through `colName`, which deliberately refuses
      // the table library's own `accessorKey` (objectui#3104), while
      // `RelatedList` renders a column as `accessorKey || columnIdentity(c)`.
      // So a column authored `{ accessorKey: 'salary' }` was named by nobody
      // here, skipped both `enforceFieldSecurity` and `redactFields`, and then
      // painted its real values through the table's own key. An entry the
      // security fold cannot check is an entry it must not pass.
      //
      // Since objectui#9090 that example has a second gate below it: the block
      // now hands `redactFields` DOWN and `RelatedList` filters by the same
      // `accessorKey || columnIdentity` pair, as `filterFLS` beside it always
      // did for a declared field FLS denies. What this arm alone still decides
      // is a key the permission evaluator has no opinion about — one the child
      // object never declares, which `checkField` default-ALLOWS downstream.
      //
      // Scoped to the filtering path only: with neither key set this whole
      // branch is skipped and `columns` is handed down by reference, so an
      // ordinary related list renders exactly what it always did.
      return n ? allowed.has(n) : false;
    });
  }

  return (
    <div className={className} {...designer} {...ariaProps}>
      <RelatedList
        title={title}
        type="table"
        api={objectName}
        objectName={objectName}
        referenceField={schema.relationshipField}
        parentId={parentLinkValue as any}
        columns={filteredColumns as any}
        // [objectui#9053] The same list, pushed down to the component that
        // DECIDES columns. Filtering the authored array here only ever reached
        // one of the three paths that decide them: redacting every authored
        // column emptied this array, `RelatedList` read the empty array as "no
        // columns were authored", and its auto-derivation — which this list
        // never reached — brought the redacted field back. Passed by reference
        // (and `undefined` when unauthored) so the column memo downstream keeps
        // a stable dependency.
        redactFields={redact.length > 0 ? redact : undefined}
        pageSize={
          typeof schema.limit === 'number' && schema.limit > 0
            ? schema.limit
            : SPEC_DEFAULT_LIMIT
        }
        defaultSort={schema.sort}
        // The list's own scope, ANDed with the parent relationship by
        // `RelatedList` (spec `RecordRelatedListProps.filter`,
        // objectstack#7118). When a `dataSource` binding is present this key
        // already carries the composed component-AND-view-AND-binding filter —
        // `ElementDataSourceGate` wrote it here, which is only legitimate now
        // that the value is read.
        filter={schema.filter}
        dataSource={ctx?.dataSource}
        add={
          // Read UN-CAST (objectui#9964). The cast that used to stand here was
          // load-bearing for one reason only: the mirror typed
          // `add.picker.filter` as `unknown` while this component's own prop
          // types it `ViewFilterRule[]`, so un-casting was a TS2322 — the
          // divergence, kept invisible by the cast. The mirror now carries the
          // protocol's array, so the declaration reaches this read and a
          // wrong-shaped picker filter is refused here instead of downstream.
          schema.add
            ? {
                ...schema.add,
                // The Add-button label may carry inline translations too.
                label: pickLocalized(schema.add.label, language) || undefined,
              }
            : undefined
        }
        rowActions={handlers?.rowActions}
        onRowAction={handlers?.onRowAction}
        toolbarActions={handlers?.toolbarActions}
        onToolbarAction={handlers?.onToolbarAction}
        // Create a new child, pre-linked to this parent (增). Host omits when
        // create is denied by lifecycle/permissions, hiding the "New" button.
        onNew={handlers?.onCreate}
        // [#4646] …and greys it — without hiding it — when the child object's
        // `userActions.create.disabledWhen` holds for THIS parent record. The
        // host owns both verdicts (it is the side that has the parent record
        // and the predicate evaluator); this renderer only wires them.
        newDisabled={handlers?.createDisabled}
        // Open the child record's detail page on row click (查看记录详情).
        onRowClick={
          handlers?.onView
            ? (row: any) => {
                const id = rowId(row);
                if (id != null) handlers.onView!(id, row);
              }
            : undefined
        }
        // Open the child record's edit form (改).
        onRowEdit={
          handlers?.onEdit
            ? (row: any) => {
                const id = rowId(row);
                if (id != null) handlers.onEdit!(id, row);
              }
            : undefined
        }
        onRowDelete={
          // Delete the child record (删). Prefer the host handler (gated by
          // lifecycle affordance + permissions); fall back to the generic
          // link/junction remove when an `add` config is present so managed
          // assignment lists keep working without a host provider. RelatedList
          // shows the confirm dialog and refreshes after this resolves.
          handlers?.onDelete
            ? (row: any) => {
                const id = rowId(row);
                if (id != null) return handlers.onDelete!(id, row);
              }
            : schema.add && ctx?.dataSource
              ? async (row: any) => {
                  const id = row?.id ?? row?._id;
                  if (id != null) await ctx?.dataSource?.delete?.(objectName, String(id));
                }
              : undefined
        }
      />
    </div>
  );
};

/**
 * What this block reads for its own query: `objectName`, `columns` (a FIELD
 * list), `filter`, `sort` (`defaultSort`) and `limit` (`pageSize`).
 *
 * `filter` was the one key deliberately left unmapped when this wiring landed
 * (objectstack#6953), because the block DECLARED it and no code read it: writing
 * the composed filter onto a dead key would have reproduced the very defect that
 * change removed, one layer deeper. objectstack#7118 gave it a read site —
 * `RelatedList` now ANDs it with the parent-relationship condition, whose
 * spelling follows the relationship field's arity (`=` for a single-valued
 * field, `$contains` for a `multiple: true` one — objectui#7299) — so the
 * mapping follows, and with it the consequence recorded here as open: a saved
 * view named on this block no longer contributes columns/sort/limit while its
 * FILTER is dropped, i.e. the list can no longer be wider than the view it names.
 */
const RECORD_RELATED_LIST_DATA_SOURCE: ElementDataSourceMapping = {
  columns: true,
  filter: true,
  sort: true,
  limit: 'limit',
};

/**
 * Stable stand-in for a missing `schema`. A fresh `{}` per render would give the
 * body a new schema identity every time — the churn `useElementDataSourceSchema`
 * avoids by returning the schema BY REFERENCE when there is no binding.
 */
const NO_SCHEMA = {} as RecordRelatedListRendererProps['schema'];

/**
 * `record:related_list` with the spec's per-element `dataSource` binding mapped
 * onto the keys the body reads (objectstack#6953).
 *
 * The gate wraps the EXPORTED name rather than being added at the registration
 * site, so a host that imports this renderer directly gets the binding too — a
 * block bound under one entry point and unbound under another is the same
 * "declared but not reached" shape in miniature.
 */
export const RecordRelatedListRenderer: React.FC<RecordRelatedListRendererProps> = elementDataSourceBlock((props) => {
  // The record context's adapter, not the schema-renderer context's: this list
  // reads its rows through `ctx.dataSource`, and resolving `view` against a
  // different source than the rows come from could report a view as missing on
  // a host that has it.
  const ctx = useRecordContext();
  return (
    <ElementDataSourceGate
      schema={props.schema ?? NO_SCHEMA}
      mapping={RECORD_RELATED_LIST_DATA_SOURCE}
      dataSource={ctx?.dataSource}
      testId="record-related-list"
      errorTitle="This related list’s data source could not be resolved"
    >
      {(bound) => <RecordRelatedListBody {...props} schema={bound as any} />}
    </ElementDataSourceGate>
  );
});

export default RecordRelatedListRenderer;
