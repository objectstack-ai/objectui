/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - ObjectQL Component Zod Validators
 * 
 * Zod validation schemas for ObjectQL-specific components.
 * Following @objectstack/spec UI specification format.
 * 
 * @module zod/objectql
 * @packageDocumentation
 */

import { z } from 'zod';
import {
  ListViewSchema as SpecListViewSchema,
  KanbanConfigSchema as SpecKanbanConfigSchema,
  GanttConfigSchema as SpecGanttConfigSchema,
  CalendarConfigSchema as SpecCalendarConfigSchema,
  GalleryConfigSchema as SpecGalleryConfigSchema,
  GroupingConfigSchema as SpecGroupingConfigSchema,
  TimelineConfigSchema as SpecTimelineConfigSchema,
  HttpMethodSubsetSchema as SpecHttpMethodSubsetSchema,
  HttpRequestSchema as SpecHttpRequestSchema,
  ViewDataSchema as SpecViewDataSchema,
  ListColumnSchema as SpecListColumnSchema,
  SelectionConfigSchema as SpecSelectionConfigSchema,
  PaginationConfigSchema as SpecPaginationConfigSchema,
  UserActionsConfigSchema as SpecUserActionsConfigSchema,
  AriaPropsSchema as SpecAriaPropsSchema,
  NavigationConfigSchema as SpecNavigationConfigSchema,
  ChartAggregateSchema as SpecChartAggregateSchema,
  ChartDrillDownSchema as SpecChartDrillDownSchema,
  I18nLabelSchema as SpecI18nLabelSchema,
  DashboardWidgetSchema as SpecDashboardWidgetSchema,
} from '@objectstack/spec/ui';
import { BaseSchema, specFieldsExcept } from './base.zod.js';
import { aliasKeyRefusal, handlerKeyRefusal, retirementTombstone } from './tombstone.zod.js';
import { DrillDownConfigSchema } from './data-display.zod.js';
// The kanban CARD vocabulary has one authority (`./complex.zod.ts`); the
// `object-kanban` lane below reads it rather than restating it (objectui#8913).
import { KanbanCardSchema } from './complex.zod.js';
import { ViewSwitcherSchema } from './views.zod.js';
import { stripImportedDefaults } from './imported-defaults.js';

/**
 * ⭐ THE IMPORT BOUNDARY (objectui#8317, decision batch #90, 2026-09-08).
 *
 * **This mirror authors no default, imported subschemas included.** Batch #69
 * (objectui#7735) ruled that a validator validates and does not write values
 * into an author's document; batch #90 ruled that this holds for EVERY key
 * `safeValidateSchema` answers, not only the sites this repository wrote. So a
 * schema arriving from `@objectstack/spec` crosses into a mirror shape only
 * through `stripImportedDefaults`, which removes each reachable `ZodDefault`
 * with `.removeDefault()` and keeps the key omissible. Keys, types, checks and
 * the accept set are untouched, and a subtree carrying no default comes back
 * reference-equal — so this is a no-op the day the spec adopts the same
 * principle.
 *
 * ⛔ Spelled at every crossing rather than once per file, deliberately: a local
 * `const Spec… = stripImportedDefaults(…)` would put the spec's provenance one
 * hop away from every declaration that reads it, and `check:spec-symbols`
 * (rule 1) reads exactly one hop — a mirror export under a spec-owned name has
 * to show the spec binding in its OWN initializer. The verbosity is the
 * provenance.
 *
 * ⚠️ A read that is NOT a crossing stays unwrapped and is declared as such: a
 * value VOCABULARY (`./views.zod.ts`'s `SpecListViewTypeEnum` and
 * `./objectql.zod.ts`'s `ViewKindEnum`, which unwrap the spec's own
 * `.default('grid')` to reach its enum) and a TYPE position — neither puts a
 * default into a parsed document. `../__tests__/imported-defaults-8317.test.ts`
 * re-derives that exception list from the source rather than trusting this
 * paragraph, and fails if an entry stops matching a real read.
 */


/**
 * HTTP Method Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231; formerly a hand-written mirror).
 *
 * The spec renamed the 5-value subset to `HttpMethodSubsetSchema` in
 * 17.0.0-rc.5 (objectstack#5832) to stop it colliding with the 7-value
 * `HttpMethod` in the published JSON Schema. The runtime domain is unchanged,
 * so this repo keeps exporting it under the `HttpMethodSchema` name — following
 * the rename WITHOUT changing cross-package semantics (objectui#3499).
 */
export const HttpMethodSchema = stripImportedDefaults(SpecHttpMethodSubsetSchema);

/**
 * HTTP Request Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231; formerly a hand-written mirror). Differences vs the old mirror:
 * `body` is the spec's `z.unknown()` (a superset of the old record/string/FormData/
 * Blob union). `method` is declared and accepted but NOT defaulted on parse:
 * the spec's `.default('GET')` is stripped at the import boundary above, so a
 * request that omits `method` comes back without it.
 */
export const HttpRequestSchema = stripImportedDefaults(SpecHttpRequestSchema);

/**
 * View Data Source Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231; formerly a hand-written mirror that had drifted behind the spec's
 * fourth `provider: 'schema'` variant for schema-bound forms).
 */
export const ViewDataSchema = stripImportedDefaults(SpecViewDataSchema);

/**
 * List Column Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231).
 *
 * This used to `.extend()` the spec with two objectui-only fields, each carrying
 * a note to promote it upstream rather than grow the extension. spec v17 did
 * exactly that (objectui#2231): `summary` is now the spec's
 * `union([ColumnSummarySchema, ColumnSummaryConfigSchema])` — the same enum ∪
 * `{ type, field }` form `useColumnSummary` in `@object-ui/plugin-grid` reads —
 * and `prefix` is the spec's `ColumnPrefixSchema`. With both upstream the
 * extension collapses to the plain re-export it always said it would become.
 *
 * The spec declares `prefix.type` with a `.default('text')`. That default is
 * stripped at the import boundary above, so the key is declared and accepted but
 * NOT defaulted on parse: a column omitting `prefix.type` comes back without it,
 * and a renderer reading it cannot assume a value is present.
 */
export const ListColumnSchema = stripImportedDefaults(SpecListColumnSchema);

/**
 * Selection Config Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231; formerly a hand-written mirror). `type` is declared and accepted
 * but NOT defaulted on parse: the spec's `.default('none')` is stripped at the
 * import boundary above, so an omitted `type` stays omitted.
 */
export const SelectionConfigSchema = stripImportedDefaults(SpecSelectionConfigSchema);

/**
 * Pagination Config Schema — `@objectstack/spec/ui` schema re-exported by reference
 * (issue #2231; formerly a hand-written mirror). `pageSize` is the spec's
 * positive-int, declared and accepted but NOT defaulted on parse: the spec's
 * `.default(25)` is stripped at the import boundary above, so an omitted
 * `pageSize` stays omitted.
 */
export const PaginationConfigSchema = stripImportedDefaults(SpecPaginationConfigSchema);

/**
 * Sort Config Schema
 */
export const SortConfigSchema = z.object({
  field: z.string().describe('Field to sort by'),
  order: z.enum(['asc', 'desc']).describe('Sort order'),
});

/**
 * The spec's OBJECT arm of `exportOptions`, as a SHAPE, reached without restating
 * its keys (objectui#7762).
 *
 * `ListViewExportOptionsSchema` is internal to the spec bundle and NOT a public
 * export (measured, not assumed, by `../__tests__/export-options-spec-parity.test.ts`).
 * The exported `ListViewSchema.shape.exportOptions` is the whole contract, but it is a
 * TWO-ARM union: the legacy bare format array — which LIFTS to `{ formats }` at parse —
 * and the strict five-key object. `ListViewSchema` below binds that union by reference
 * and is right to: `list-view` reads both spellings. `object-grid` does not, so this
 * peels the object arm out and leaves the lifting arm behind.
 *
 * Peeled rather than restated on purpose: a local copy of the five keys is a third
 * copy of one contract, and the copy is what drifts (the lesson `objectql.ts`'s
 * `ListViewExportOptions` docblock already records for the TypeScript face). Every
 * member here is the spec's own schema object, so `'pdf'` and a sixth key stay refused
 * with the spec's own messages and a spec-side change moves this member with it.
 *
 * The TYPE is derived by the same two steps at the TYPE level (`unwrap` then the arm with a
 * `shape`), so the authoring face keeps the spec's per-member types — a `z.ZodRawShape`
 * annotation here would erase them and collapse `z.input` of every member to `unknown`,
 * which the mirror-parity drift ledger reports as `exportOptions` NARROWER than declared.
 *
 * THROWS at module load if the spec stops exposing an object arm. That is the intended
 * failure: the alternative is a member that silently stops being the spec's, which is
 * the class of defect this whole file exists to make visible.
 */
type SpecExportOptionsUnion = ReturnType< typeof SpecListViewSchema.shape.exportOptions.unwrap >;
/** The object arm, statically: the one union member exposing a `shape` (the other is the lift's pipe). */
type SpecExportOptionsObjectArm = Extract< SpecExportOptionsUnion['options'][number], { shape: unknown } >;
type SpecExportOptionsShape = SpecExportOptionsObjectArm['shape'];

const SPEC_EXPORT_OPTIONS_OBJECT_SHAPE: SpecExportOptionsShape = ((): SpecExportOptionsShape => {
  type Peelable = {
    unwrap?: () => Peelable;
    options?: readonly Peelable[];
    shape?: SpecExportOptionsShape;
  };
  let cur = stripImportedDefaults(SpecListViewSchema).shape.exportOptions as unknown as Peelable;
  for (let i = 0; i < 5 && cur && !cur.options && typeof cur.unwrap === 'function'; i++) {
    cur = cur.unwrap();
  }
  const arm = cur.options?.find((o) => o.shape);
  if (!arm?.shape) {
    // Short on purpose: this string SHIPS (the console's `framework` chunk), while the
    // docblock above it — which carries the rationale and the remedy — is stripped by the
    // production minifier. It still names the moved spec symbol, the member that depends on
    // it, and the card, which is what a diagnostic has to do.
    throw new Error(
      '@object-ui/types: no object arm on `ListViewSchema.shape.exportOptions`; ' +
        '`ObjectGridSchema.exportOptions` binds it by reference (objectui#7762).',
    );
  }
  return arm.shape;
})();

/**
 * ONE string, BOTH author-facing channels — the `.describe()` metadata generated docs
 * publish, and the parse-time issue message an author who writes the wrong shape reads.
 * The house discipline of `./tombstone.zod.ts`: two channels that cannot drift apart
 * because there is only one string.
 *
 * The refusal it carries is objectui#7762's ruling. `ObjectGrid.tsx` reads
 * `schema.exportOptions?.formats` and nothing else, so a bare format array authored on
 * an `object-grid` node used to validate green through `BaseSchema`'s `.passthrough()`
 * and then lose SILENTLY to the `['csv', 'json']` default — no error, no warning, no
 * console line, with the export button still shown. Refusing it by name is that silent
 * no-op made loud; nothing that renders today stops rendering.
 */
const OBJECT_GRID_EXPORT_OPTIONS_GUIDANCE =
  'Export configuration for the grid toolbar menu — the OBJECT form only: ' +
  '`{ formats, maxRecords, includeHeaders, fileNamePrefix, streaming }`. A bare format ' +
  'array is the `list-view` spelling and is NOT read here: `object-grid` reads ' +
  '`exportOptions.formats`, so an array is silently dropped for the csv/json ' +
  'default. Write `{ "formats": ["csv", "xlsx"] }` instead.';

/**
 * ObjectGrid Schema
 */
export const ObjectGridSchema = BaseSchema.extend({
  type: z.literal('object-grid'),
  objectName: z.string().describe('ObjectQL object name'),
  data: ViewDataSchema.optional().describe('Data source configuration'),
  columns: z.union([z.array(z.string()), z.array(ListColumnSchema)]).optional().describe('Columns configuration'),
  filter: z.array(z.any()).optional().describe('Filter criteria'),
  sort: z.array(SortConfigSchema).optional().describe('Sort configuration (array only; the legacy string clause is retired — objectui#8221)'),
  searchableFields: z.array(z.string()).optional().describe('Searchable fields'),
  resizable: z.boolean().optional().describe('Enable column resizing'),
  showColumnTypeIcons: z.boolean().optional().describe('Show column type icons (T/Tag/Calendar) in headers. Off by default — type is usually obvious from cell content; the icons add visual noise.'),
  selection: SelectionConfigSchema.optional().describe('Selection configuration'),
  pagination: PaginationConfigSchema.optional().describe('Pagination configuration'),
  bulkActions: z.array(z.string()).optional().describe('Bulk action identifiers (spec-canonical key; batchActions is the legacy alias)'),
  // `exportOptions` — the spec's OBJECT arm, BY REFERENCE, with the bare array refused
  // by name (objectui#7762). ⛔ NOT `SpecListViewSchema.shape.exportOptions` itself:
  // that reference is the two-arm union whose first arm LIFTS a bare array to
  // `{ formats }`, so binding it would make this mirror ACCEPT AND LIFT — the opposite
  // of the named refusal ruled for this node. The strictness is the arm's own
  // (`catchall: never`, measured), so a sixth key keeps zod's own `unrecognized_keys`
  // message naming it, and a retired `'pdf'` keeps the spec's migration prescription:
  // only the `invalid_type` message is local, and only it names the object form.
  exportOptions: z
    .strictObject(SPEC_EXPORT_OPTIONS_OBJECT_SHAPE, {
      error: (issue) => (issue.code === 'invalid_type' ? OBJECT_GRID_EXPORT_OPTIONS_GUIDANCE : undefined),
    })
    .optional()
    .describe(OBJECT_GRID_EXPORT_OPTIONS_GUIDANCE),

  // Legacy fields
  fields: z.array(z.string()).optional(),
  staticData: z.array(z.any()).optional(),
  selectable: z.union([z.boolean(), z.enum(['single', 'multiple'])]).optional(),
  pageSize: z.number().optional(),
  showSearch: z.boolean().optional(),
  showFilters: z.boolean().optional(),
  showPagination: z.boolean().optional(),
  defaultSort: z.object({ field: z.string(), order: z.enum(['asc', 'desc']) }).optional(),
  defaultFilters: z.record(z.string(), z.any()).optional(),
  // The legacy caption/export-title fallback — `ObjectGrid.tsx` reads it at
  // exactly two sites, `viewLabel: schema.label || schema.title` and
  // `caption: schema.label || schema.title`, only when `label` is absent — and
  // the interface has declared it `@deprecated` all along. Mirrored under
  // objectui#6639's census-directed ruling (2026-08-29, declare branch:
  // authored `object-grid.title` nodes exist, so the key is declared rather
  // than the read retired). Typed `z.string()`, not `z.any()` — serializable
  // metadata, the #6424 family form: the gain is the typed refusal, since the
  // `.passthrough()` base was already admitting ANY `title` unexamined.
  title: z.string().optional().describe('DEPRECATED, write label instead: legacy caption/export-file-title fallback, read only when label is absent'),
  operators: z.record(z.string(), z.any()).optional(), // Missing in previous TS scan but common
  rowActions: z.array(z.string()).optional(),
  batchActions: z.array(z.string()).optional(),
  editable: z.boolean().optional(),
  keyboardNavigation: z.boolean().optional(),
  frozenColumns: z.number().optional(),
});

/**
 * ObjectForm Schema
 */
export const ObjectFormSchema = BaseSchema.extend({
  type: z.literal('object-form'),
  objectName: z.string().describe('ObjectQL object name'),
  mode: z.enum(['create', 'edit', 'view']).describe('Form mode'),
  recordId: z.union([z.string(), z.number()]).optional().describe('Record ID'),
  title: z.string().optional().describe('Form title'),
  description: z.string().optional().describe('Form description'),
  fields: z.array(z.string()).optional().describe('Included fields'),
  customFields: z.array(z.any()).optional().describe('Custom field configs'),
  initialData: z.record(z.string(), z.any()).optional().describe('Initial data'),
  groups: z.array(z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(z.string()),
    collapsible: z.boolean().optional(),
    defaultCollapsed: z.boolean().optional(),
  })).optional().describe('Field groups'),
  layout: z.enum(['vertical', 'horizontal', 'inline', 'grid']).optional().describe('Form layout'),
  columns: z.number().optional().describe('Grid columns'),
  showSubmit: z.boolean().optional().describe('Show submit button'),
  submitText: z.string().optional().describe('Submit button text'),
  successMessage: z.string().optional().describe('Success toast text after create/update when no onSuccess handler is given'),
  navigateOnSuccess: z.string().optional().describe('DEPRECATED, write submitBehavior instead: navigate here after success (relative path only; {id}/{recordId} interpolated and URL-escaped); precedes the toast'),
  resetOnSuccess: z.boolean().optional().describe('Reset the form after a successful create for another entry'),
  submitBehavior: z.union([
    z.object({ kind: z.literal('thank-you'), title: z.string().optional(), message: z.string().optional() }),
    z.object({ kind: z.literal('redirect'), url: z.string(), delayMs: z.number().optional() }),
    z.object({ kind: z.literal('continue') }),
    z.object({ kind: z.literal('next-record') }),
  ]).optional().describe('Declarative post-submit behavior; takes precedence over successMessage/navigateOnSuccess/resetOnSuccess'),
  showCancel: z.boolean().optional().describe('Show cancel button'),
  cancelText: z.string().optional().describe('Cancel button text'),
  showReset: z.boolean().optional().describe('Show reset button'),
  initialValues: z.record(z.string(), z.any()).optional().describe('Initial values'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
});

/**
 * ObjectView Schema
 *
 * Ten keys the `ObjectViewSchema` interface (`../objectql.ts`) declared and this
 * mirror never did — objectui#7279's `UnmirroredDeclared` reading — were closed
 * nine-for-ten by objectui#7779 under the maintainer's ruling B (2026-09-06:
 * liveness first, then mirror-or-retire per key). Every reading below was taken
 * on the `object-view` NODE renderer, `packages/plugin-view/src/ObjectView.tsx`
 * (registered by `plugin-view/src/index.tsx`), with `schema.objectName` /
 * `schema.layout` as the positive controls of the same `schema.KEY` query:
 *
 *   - `navigation`, `searchableFields`, `filterableFields` — the spec models
 *     all three on `ListViewSchema` (`@objectstack/spec/ui`), so they are the
 *     spec's own slots BY REFERENCE (`SpecListViewSchema.shape.*`), never a
 *     local restatement: the declaration already imports the spec's
 *     `NavigationConfig` for `ViewNavigationConfig`, and a literal restating it
 *     is the drift this repo keeps paying for (objectui#4588). The pin asserts
 *     identity against the spec schema, so a spec-side change moves them.
 *   - `allowCreateView`, `viewActions` — READ: the renderer forwards both
 *     verbatim into the `view-switcher` node it composes
 *     (`allowCreateView: schema.allowCreateView`, `viewActions: schema.viewActions`,
 *     then `ViewSwitcher.tsx` reads `schema.allowCreateView` / `schema.viewActions`),
 *     so they are that sibling mirror's slots by reference
 *     (`ViewSwitcherSchema.shape.*`, `./views.zod.ts`) — one shape, two nodes.
 *   - `defaultViewType` (READ: `schema.defaultViewType || 'grid'`),
 *     `defaultListView` (READ: `namedListViews?.[schema.defaultListView]`),
 *     `showViewSwitcher` (READ: `schema.showViewSwitcher === true`) — local
 *     literals matching the declaration. `defaultViewType` is the declaration's
 *     SEVEN-value union on purpose, not the spec's view-kind enum: `chart` and
 *     `tree` are host-composition-only on this node (objectui#5321) and the
 *     `NamedListView.type` twin spells the same seven.
 *   - `viewTabBar` — RETIRED (`retirementTombstone()` below; `?: never` on the
 *     TS face). ZERO reads of the key on the node: the tab-bar UX config
 *     (`ViewTabBarConfig`, still exported) is the `config` PROP of the
 *     `ViewTabBar` component, composed by the host (`@object-ui/app-shell`),
 *     and `plugin-view`'s own `ObjectView` never renders that bar (ADR-0053:
 *     the host owns the switcher). The 2026-07 audit
 *     (`docs/audits/2026-07-objectview-detailview-schema.md`) had already
 *     measured it dead since introduction.
 *   - `listViews` — STILL UNMIRRORED, on the ruling's own fallback clause and
 *     by measurement: the declaration's value is the local `NamedListView`,
 *     47 declared top-level members, of which the renderer reads six —
 *     `label`, `type`, `columns`, `filter`, `sort`, `options`. A seventh key,
 *     `data`, is read off a named view but is NOT declared on
 *     `NamedListView`: the renderer reaches it through an `as any` cast on the
 *     named-view config (`ObjectView.tsx`, `(currentNamedViewConfig as any)?.data`),
 *     so it is not one of the 47 and never was a member a mirror would carry.
 *     Meanwhile the spec slot (`ViewSchema.listViews`) is a record of the
 *     STRICT `ObjectListViewSchema`,
 *     which requires `columns` and refuses `options`, ObjectQL tuple filters and
 *     `default` — i.e. it refuses the named views this package's own README and
 *     `content/docs/api/schema-reference.md` teach. Neither value type can be
 *     mirrored without either losing documented behaviour (spec) or enforcing
 *     41 unread members (47 declared, minus the 6 that are both declared and
 *     read) into the contract (local), so the key stays in the
 *     parity ledger with that measurement until the maintainer decides its
 *     value type. ⛔ Not `z.any()`: that was ruled out by name.
 */
export const ObjectViewSchema = BaseSchema.extend({
  type: z.literal('object-view'),
  objectName: z.string().describe('ObjectQL object name'),
  title: z.string().optional().describe('View title'),
  description: z.string().optional().describe('View description'),
  layout: z.enum(['drawer', 'modal', 'page']).optional().describe('Layout mode'),
  defaultViewType: z.enum(['grid', 'kanban', 'gallery', 'calendar', 'timeline', 'gantt', 'map']).optional().describe('Default list view type (grid unless a named view sets its own type)'),
  defaultListView: z.string().optional().describe('Key of the listViews entry shown first'),
  // Spec slot by reference (objectui#7779) — `NavigationConfigSchema.optional()`,
  // the same object `ListViewSchema` derives its `navigation` from.
  navigation: stripImportedDefaults(SpecListViewSchema).shape.navigation,
  table: z.lazy(() => ObjectGridSchema.omit({ type: true, objectName: true }).partial()).optional().describe('Table config'),
  form: z.lazy(() => ObjectFormSchema.omit({ type: true, objectName: true, mode: true }).partial()).optional().describe('Form config'),
  // Spec slots by reference (objectui#7779) — `array(string).optional()` on
  // both; the spec's own description marks `filterableFields` a legacy
  // shorthand for `userFilters.fields`.
  searchableFields: stripImportedDefaults(SpecListViewSchema).shape.searchableFields,
  filterableFields: stripImportedDefaults(SpecListViewSchema).shape.filterableFields,
  showSearch: z.boolean().optional().describe('Show search'),
  showFilters: z.boolean().optional().describe('Show filters'),
  showSort: z.boolean().optional().describe('Show sort controls'),
  showCreate: z.boolean().optional().describe('Show create button'),
  showRefresh: z.boolean().optional().describe('Show refresh button'),
  showViewSwitcher: z.boolean().optional().describe('Show the view-type switcher toggle (hidden unless true)'),
  operations: z.object({
    create: z.boolean().optional(),
    read: z.boolean().optional(),
    update: z.boolean().optional(),
    delete: z.boolean().optional(),
  }).optional().describe('Enabled operations'),
  viewTabBar: retirementTombstone(
    'RETIRED (objectui#7779) — `viewTabBar` was never read off the object-view node: the tab-bar UX config ' +
    '(`ViewTabBarConfig`) is the `config` PROP of the `ViewTabBar` component, composed by the host ' +
    '(`@object-ui/app-shell`), not authored metadata (ADR-0053: the host owns the switcher). Remove the key.',
  ),
  // Sibling slots by reference (objectui#7779): the renderer forwards both
  // verbatim into the `view-switcher` node it composes.
  allowCreateView: ViewSwitcherSchema.shape.allowCreateView,
  viewActions: ViewSwitcherSchema.shape.viewActions,
});

/**
 * User Filters — field-level filter option
 */
const UserFilterOptionSchema = z.object({
  label: z.string().describe('Option display label'),
  value: z.union([z.string(), z.number(), z.boolean()]).describe('Option value'),
  color: z.string().optional().describe('Option badge color'),
});

/**
 * User Filters — field-level filter definition (dropdown & toggle modes)
 */
const UserFilterFieldSchema = z.object({
  field: z.string().describe('Field name to filter on'),
  label: z.string().optional().describe('Display label'),
  type: z.enum(['select', 'multi-select', 'boolean', 'date-range', 'text']).optional().describe('Filter input type'),
  options: z.array(UserFilterOptionSchema).optional().describe('Static options'),
  showCount: z.boolean().optional().describe('Show record count per option'),
  defaultValues: z.array(z.union([z.string(), z.number(), z.boolean()])).optional().describe('Default selected values'),
});

/**
 * User Filters — tab preset rule: `{ field, operator, value }`, the same
 * predicate shape used by every other filter in the protocol.
 */
const UserFilterTabRuleSchema = z.object({
  field: z.string().describe('Field name to filter on'),
  operator: z.string().describe('Filter operator (equals, not_equals, contains, in, greater_than, less_than, …)'),
  value: z.any().optional().describe('Filter value'),
});

/**
 * User Filters — tab preset definition (tabs mode).
 *
 * Canonical shape: `{ name, label, icon?, filter, isDefault? }`. The legacy
 * `{ id, filters, default }` fields stay optional (normalized at runtime by
 * `normalizeTabPresets`) so older metadata keeps validating, but new authoring
 * — by AI or the Studio tabs editor — emits the canonical form.
 */
const UserFilterTabSchema = z
  .object({
    name: z.string().optional().describe('Unique tab identifier (snake_case)'),
    label: z.string().describe('Tab display label'),
    filter: z.array(UserFilterTabRuleSchema).optional().describe('Filter rules applied when this tab is active'),
    icon: z.string().optional().describe('Lucide icon name'),
    isDefault: z.boolean().optional().describe('Whether this tab is active by default'),

    /** @deprecated use `name` */
    id: z.string().optional().describe('@deprecated use name'),
    /** @deprecated use `filter` */
    filters: z.array(z.union([z.array(z.any()), z.string()])).optional().describe('@deprecated use filter'),
    /** @deprecated use `isDefault` */
    default: z.boolean().optional().describe('@deprecated use isDefault'),
  })
  .refine((t) => Boolean(t.name || t.id), { message: 'tab requires a name' });

/**
 * User Filters Configuration Schema (Airtable Interfaces-style)
 */
const UserFiltersSchema = z.object({
  // AUTHORING contract (ADR-0053): `toggle` is deliberately not authorable —
  // new configs can only write dropdown/tabs. The RENDERER still honors
  // stored `toggle` metadata (spec ADR-0047 §3.4a keeps it in ITS enum "so
  // existing configs keep rendering") — see plugin-list `UserFilters`.
  element: z.enum(['dropdown', 'tabs']).describe('UI element type'),
  fields: z.array(UserFilterFieldSchema).optional().describe('Field-level filters'),
  tabs: z.array(UserFilterTabSchema).optional().describe('Named filter presets'),
  allowAddTab: z.boolean().optional().describe('Allow adding new tabs'),
  showAllRecords: z.boolean().optional().describe('Show All records tab'),
});

/**
 * ListView Schema — derived from `@objectstack/spec/ui` `ListViewSchema` (issue #2231).
 *
 * Spec-owned fields flow in **by reference** (see the `.extend()` on the declaration) so they auto-track
 * the protocol instead of being re-typed here; the drift-guard test
 * (`__tests__/list-view-spec-parity.test.ts`) fails if the spec grows a field objectui
 * has not triaged. objectui-only / legacy fields are declared locally on top via
 * `.extend()` (the final extend wins, so these override anything imported):
 *   - component envelope: `type: 'list-view'` discriminator + `objectName` binding;
 *   - legacy vocabulary kept for back-compat: `viewType` (renamed spec `type`),
 *     `fields`/`columns`, `filters`, the `show*` toolbar flags, `densityMode`, `color`, …;
 *   - configs whose objectui shape is intentionally broader than spec's (migration
 *     deferred): `userFilters`, `sharing`, `aria`, `conditionalFormatting`
 *     (`exportOptions` left this list with objectui#6956 — it is the spec field by reference).
 *
 * The per-view-type configs (`kanban`/`calendar`/`gantt`/`gallery`/`timeline`) are no
 * longer forks: they derive from the spec configs below, keeping only `calendar.defaultView`
 * (no spec counterpart) and four deprecated aliases for the pre-#2231 vocabulary.
 *
 * Migrating the remaining legacy vocabulary to the spec-canonical keys (`type`/`columns`/
 * `filter`/`userActions`) is deferred — see #2231.
 */
// Spec view-config keys objectui overrides locally: the component envelope
// (name/label/description → BaseSchema), the discriminator/renamed/relaxed keys
// (type/columns), and the configs redeclared below. EVERY other spec key flows
// in by reference at the declaration — see `SPEC_FIELDS` there.
const LIST_VIEW_LOCAL_OVERRIDES = [
  'type',
  'columns',
  'name',
  'label',
  'description',
  'userFilters',
  'userActions',
  'aria',
  'conditionalFormatting',
  'exportOptions',
  'kanban',
  'calendar',
  'gallery',
  'timeline',
] as const;

// ── Per-view-type configs, derived from spec (issue #2231) ────────────────────
// Each is the spec config `.partial()`-ed: spec requires `columns`/`titleField`/
// `startDateField` on some of these, but objectui authors partial configs (the
// product's own CreateViewDialog emits `kanban: { groupByField }` alone), so
// requiring them would reject views the app itself creates. `.partial()` keeps the
// spec's field set and types by reference while staying permissive — the same
// trade-off the spec-field import on `ListViewSchema` makes.
//
// `gantt` needs no local schema at all: the spec config already covers every field
// the renderer reads, so it flows in with the rest of the imported spec fields.
// It used to cover them by being `.passthrough()` for renderer-ahead knobs;
// objectstack#15469 closed that window and DECLARED the ten it was carrying, so
// today the coverage is by declaration (objectui#7845).
//
// The deprecated aliases below are the pre-#2231 objectui vocabulary. They stay
// accepted so stored view metadata keeps validating, but the spec key is canonical
// and wins at every read-site.
//
// `.passthrough()` is kept from the pre-#2231 shapes because the renderers grow
// config knobs ahead of the protocol (calendar's `allDayField`, for one), and
// stripping them here would silently disable a shipped capability. ⚠️ It is NOT
// kept "for the same reason the spec puts it on
// `GanttConfigSchema`/`TreeConfigSchema`", which is what this note used to say:
// objectstack#15469 closed both of those upstream, so the spec-side precedent is
// gone and only the local reason survives (objectui#7845). Measured for the two
// shapes below: `swimlaneField` (kanban) and `endField` (timeline) are still
// absent from the spec's `KanbanConfigSchema` / `TimelineConfigSchema`, so these
// `.passthrough()`s still carry real authored values —
// `core/src/utils/__tests__/normalize-list-view.test.ts` pins exactly those two.
// ALIAS REFUSAL — THE READ DOOR FOR A STORED VIEW'S KANBAN CONFIG
// (objectui#8365, maintainer ruling of 2026-09-12, decision batch #117 item 5:
// option B, 「8365 同意」).
//
// `groupBy` is a THIRD spelling of the lane the spec names `groupByField` and
// this mirror's own `groupField` aliases. It was never declared here — and
// because this object ends `.passthrough()`, an undeclared key is not
// dropped, it is KEPT. That is the whole defect: the surviving key rode the
// bag into `ListView`'s kanban branch, whose `...restKanban` spread lands
// AFTER its own `groupBy: laneField`, so an authored `kanban.groupBy`
// OVERRODE the lane the branch had just resolved from `groupByField`.
// Measured on the card's distinguishing fixture, not reasoned:
// `options.kanban = { groupBy: 'LANE_FROM_STRAY_GROUPBY' }` against
// `kanban = { groupByField: 'LANE_FROM_CANONICAL' }` produced
// `node.groupBy === 'LANE_FROM_STRAY_GROUPBY'`.
//
// ⛔ HONOURING IT AS A DECLARED ALIAS IS NOT AVAILABLE. `@objectstack/spec`'s
// `KanbanConfigSchema` is a `strictObject` of exactly
// `columns` / `groupByField` / `summarizeField` and refuses `groupBy` BY NAME.
// Re-measured at implementation time on the version this tree pins
// (17.4.0 — the card measured 17.3.0), with BOTH controls firing: a lit
// control (`zzzBogusKey` alongside a valid `groupByField`) draws
// `unrecognized_keys` naming the bogus key, and a dark control
// (`groupByField` alone) draws none. Upstream knows the SIBLING alias by name
// — probing `groupField` answers "Did you mean `groupField` → `groupByField`?"
// — and knows nothing at all about `groupBy`, which it refuses as a plain
// unrecognized key. Legalising it is a spec change on its own objectstack
// card, ⛔ never a renderer-side widening (AGENTS.md #0.1).
//
// ⇒ the key is DECLARED and unwritable, so it is refused BY NAME instead of
// riding the passthrough in silence, and this mirror stops being more
// permissive than the protocol it mirrors. The lead sentence is the one the
// spec's own `strictObject({ aliases })` answers with (surface noun quoted
// verbatim from the measurement above), so an author meets ONE remedy on both
// faces. `z.input` is `undefined`, so the inferred TypeScript face carries
// `groupBy?: never` and `tsc` refuses it at the authoring site too.
//
// ⛔ NOT A FOLD onto `groupByField`. A fold is only honest where the canonical
// key is the READER's first limb; here the reader's first limb IS canonical
// (`groupByField || groupField || detectStatusField(...)`), so folding the
// alias in would re-create the very override this refusal closes.
// ⛔ NOT the `groupField` / `cardFields` treatment above either: those two are
// deprecated aliases the SPEC also models under its canonical names and
// `normalize-list-view.ts` folds forward; `groupBy` is modelled nowhere and
// folds nowhere.
//
// ⚠️ NODE-LOCAL vs VIEW-LEVEL, the distinction this file has to keep straight:
// this arm is the VIEW-LEVEL `kanban` config. `groupBy` on the generated
// `object-kanban` NODE is the live, canonical lane key that `ObjectKanban`
// reads — untouched, and deliberately so.
const KanbanStrayGroupByRefusal = aliasKeyRefusal(
  'groupBy',
  'groupByField',
  'this kanban configuration',
  '`groupBy` is the lane key of the generated `object-kanban` NODE, not of the view-level '
  + 'kanban configuration (objectui#8365). `@objectstack/spec`\'s `KanbanConfigSchema` is a '
  + 'strict object of `columns` / `groupByField` / `summarizeField` and refuses `groupBy` by '
  + 'name, so a view carrying it never came through the validated path. Write `groupByField` '
  + '(or the deprecated `groupField`, which folds onto it). Until this refusal the key rode '
  + 'this object\'s `.passthrough()` into `ListView`\'s kanban branch and OVERRODE the lane '
  + 'that branch had already resolved from `groupByField` — the board grouped by the stray '
  + 'key, and nothing said so.',
);

/**
 * WHERE THIS ARM IS INSTALLED — TWO NESTINGS, ONE STRING.
 *
 * `ListView` merges `{ ...schema.options?.kanban, ...schema.kanban }` before it
 * reads anything, so a stored view can carry the stray key under EITHER. The
 * declared `kanban` slot takes this arm as a DECLARED MEMBER (`invalid_type` at
 * `kanban.groupBy`, and `groupBy?: never` on the inferred TypeScript face).
 * The legacy `options` bag is `z.record(z.string(), z.any())` and can declare no
 * member at all, so it takes the SAME guidance as a check (`custom` at
 * `options.kanban.groupBy`) — see `ListViewSchema.options` below.
 *
 * ⚠️ Covering the legacy nesting is not optional politeness: the retired
 * producer (`app-shell`'s `kanbanViewOptions`, objectui#8213) wrote into
 * `options.kanban`, so that is where the stored views this ruling is ABOUT carry
 * the key. Refusing only the declared nesting would leave exactly that
 * population re-grouped in silence — option A, which the ruling did not take.
 *
 * ⛔ The two channels take ONE string, read off this arm's own `.description`,
 * so the message an author meets cannot depend on which nesting they wrote.
 */

const KanbanConfig = stripImportedDefaults(SpecKanbanConfigSchema).partial().extend({
  /** @deprecated legacy alias for the spec's `groupByField` */
  groupField: z.string().optional().describe('Deprecated alias for groupByField'),
  /** @deprecated legacy alias for the spec's `columns` (fields shown on each card) */
  cardFields: z.array(z.string()).optional().describe('Deprecated alias for columns'),
  // ⭐ The named alias-refusal arm — objectui#8365. Declared above with the
  // whole reading; ⛔ do not re-spell the message here, it has ONE source.
  groupBy: KanbanStrayGroupByRefusal,
}).passthrough();

const CalendarConfig = stripImportedDefaults(SpecCalendarConfigSchema).partial().extend({
  // objectui-only: the calendar renderer's initial view mode. No spec counterpart —
  // promote it rather than growing this extension. `'agenda'` was retired
  // (objectui#5784, following #5740): `CalendarView` renders no agenda view.
  defaultView: z.enum(['month', 'week', 'day']).optional().describe("Initial calendar view mode — 'month' | 'week' | 'day' ('agenda' was retired: objectui#5784)"),
}).passthrough();

const GalleryConfig = stripImportedDefaults(SpecGalleryConfigSchema).partial().extend({
  /** @deprecated legacy alias for the spec's `coverField` */
  imageField: z.string().optional().describe('Deprecated alias for coverField'),
}).passthrough();

const TimelineConfig = stripImportedDefaults(SpecTimelineConfigSchema).partial().extend({
  /** @deprecated legacy alias for the spec's `startDateField` */
  dateField: z.string().optional().describe('Deprecated alias for startDateField'),
}).passthrough();

// View-kind enum reused from spec (unwrap its `.default('grid')`) so it cannot drift.
const ViewKindEnum = SpecListViewSchema.shape.type.removeDefault();

/**
 * User Actions — `@objectstack/spec/ui`'s `UserActionsConfigSchema`, mirrored
 * BY REFERENCE (objectui#8992).
 *
 * The spec documents this object as "which interactive actions are available to
 * users in the view toolbar — each boolean toggles the corresponding toolbar
 * element on/off". Grouping, column visibility and row coloring are the same
 * kind of toggle as `rowHeight` (objectui's old `showDensity`), each named
 * after the config key it gates (`grouping`, `hiddenFields`, `rowColor`).
 *
 * This read `stripImportedDefaults(Spec).extend({ group, hideFields, rowColor })`
 * for as long as the protocol declared none of the three while
 * `normalizeListViewSchema` folded objectui's legacy `showGroup` /
 * `showHideFields` / `showColor` onto them. The protocol declares all three
 * now — the maintainer ruled option A on objectui#5435 (2026-08-22) and the
 * spec adopted them in 17.3.0 — so the extension collapses, exactly as its own
 * note said it would. A redundant local extension is how two faces start to
 * drift.
 *
 * ⛔ AN UNDECLARED KEY IS REFUSED HERE, BY NAME (`unrecognized_keys`, one
 * issue, the key named) — it is NOT dropped. The note this replaces claimed
 * the opposite: "`UserActionsConfigSchema` is NOT `.strict()`, so ... an author
 * writing `userActions: { group: false }` had it silently stripped — valid on
 * parse, no effect at render". That was false at every published 17.x —
 * measured by parsing a one-undeclared-key document against the published
 * artifacts of 17.0.0, 17.2.0, 17.3.0 and the resolved 17.4.0, each of which
 * refuses and names the key. Silent-tolerance prose in front of a
 * loud-rejection runtime is the worst direction for a comment to be wrong in:
 * it tells an author — human or AI — that a config which will FAIL the save
 * gate is harmless. `__tests__/user-actions-mirror-8992.test.ts` pins the
 * refusal so this paragraph cannot rot back into the one it replaced.
 *
 * ⚠️ The three keys are VERSION-BORNE from here on. `@object-ui/types` declares
 * `@objectstack/spec: ^17.3.0`, and that floor is load-bearing for them: 17.2.0
 * declares 8 keys, 17.3.0 declares 11. The extension used to carry the three
 * locally whatever version resolved; it no longer does.
 */
export const UserActionsSchema = stripImportedDefaults(SpecUserActionsConfigSchema);

export const ListViewSchema = BaseSchema
  // Spec-owned fields by reference. `specFieldsExcept` reads the spec object's
  // `.shape` rather than calling `.omit()`, which zod 4 refuses on a schema
  // carrying a refinement (objectui#3063); `.partial()` inside it guarantees no
  // *future* spec field can become required and silently invalidate stored
  // objectui payloads. The spec binding sits in this initializer on purpose —
  // that is what makes the derivation visible to
  // `scripts/check-spec-symbol-derivation.mjs` instead of hidden one hop away.
  //
  // Imported here: data, filter, sort, searchableFields,
  // filterableFields, resizable, striped, bordered, compactToolbar, selection, navigation,
  // pagination, chart, tree, rowHeight, grouping, rowColor, hiddenFields, fieldOrder,
  // rowActions, bulkActions, bulkActionDefs, virtualScroll, inlineEdit, userActions,
  // appearance, tabs, addRecord, showRecordCount, allowPrinting, emptyState, responsive,
  // performance.
  //
  // `striped`, `bordered` and `virtualScroll` are in that list because the spec
  // pin still carries them, NOT because objectui offers them: objectstack#7176
  // retired all three (maintainer-ruled 2026-08-10) after measuring every
  // objectui reader as pass-through — no renderer ever applied one. objectui's
  // own declarations and the forwarding chain came out with objectui#4649; what
  // is left here is the by-reference import, which is exactly what must stay.
  // It carries the spec's `retiredKey()` tombstones in on the GA bump, so an
  // author writing one gets a rejection from the protocol rather than silence.
  // Do NOT add them to LIST_VIEW_LOCAL_OVERRIDES to "clean this up" — that
  // excludes the tombstone and hands the key back to `BaseSchema`'s
  // passthrough, turning a loud rejection into a silently-accepted dead key.
  // Re-forwarding needs an implementation card filed first (the ruling's text).
  .extend(specFieldsExcept(stripImportedDefaults(SpecListViewSchema).shape, LIST_VIEW_LOCAL_OVERRIDES).shape)
  .extend({
    // Component discriminator — load-bearing for the ObjectQLComponentSchema union.
    type: z.literal('list-view'),
    // objectui-only object binding (spec binds via data.provider:'object'; migration deferred).
    objectName: z.string().describe('Object Name'),
    // Renamed spec `type` (view-kind); enum imported from spec so it can't drift.
    viewType: ViewKindEnum.optional().describe('View Type'),
    // Relaxed spec `columns` (spec requires it) + legacy `fields` alias for string[] columns.
    columns: z.union([z.array(z.string()), z.array(ListColumnSchema)]).optional().describe('Columns definition'),
    // Legacy alias for `columns`, still accepted because stored view metadata
    // carries it. NO renderer reads it: `normalizeListViewSchema`
    // (`@object-ui/core`) folds it into `columns` at the ListView boundary
    // (#2890). Producers must emit `columns`.
    fields: z.array(z.string()).optional().describe('Legacy alias for string[] columns'),
    // Legacy alias for the spec's `filter`, still accepted because stored view
    // metadata carries it. NO renderer reads it: `normalizeListViewSchema`
    // (`@object-ui/core`) folds it into `filter` at the ListView boundary
    // (#2890). Note both keys carry an ObjectQL FilterNode array at runtime,
    // even though `filter` is typed from the spec as `ViewFilterRule[]`.
    filters: z.array(z.union([z.array(z.any()), z.string()])).optional().describe('Filter conditions (legacy)'),
    // Legacy toolbar visibility flags (spec-canonical is `userActions`; runtime dual-reads).
    showSearch: z.boolean().optional().describe('Show search in toolbar'),
    showSort: z.boolean().optional().describe('Show sort controls in toolbar'),
    showFilters: z.boolean().optional().describe('Show filter controls in toolbar'),
    showHideFields: z.boolean().optional().describe('Show hide-fields button in toolbar'),
    showGroup: z.boolean().optional().describe('Show group button in toolbar'),
    showColor: z.boolean().optional().describe('Show color button in toolbar'),
    showDensity: z.boolean().optional().describe('Show density/row-height button in toolbar'),
    showDescription: z.boolean().optional().describe('Show field descriptions'),
    allowExport: z.boolean().optional().describe('Allow data export'),
    // Legacy alias for the spec's `rowHeight`, still accepted because stored
    // view metadata carries it. NO renderer reads it: `normalizeListViewSchema`
    // (`@object-ui/core`) folds it into `rowHeight` at the ListView boundary
    // (#2890). Note the vocabularies differ in size — three densities widen
    // onto the spec's five row heights.
    densityMode: z.enum(['compact', 'comfortable', 'spacious']).optional().describe('Density mode'),
    color: z.string().optional().describe('Color field for row/card coloring'),
    fieldTextColor: z.string().optional().describe('Field for custom text color'),
    prefixField: z.string().optional().describe('Prefix field before title'),
    wrapHeaders: z.boolean().optional().describe('Wrap column headers'),
    clickIntoRecordDetails: z.boolean().optional().describe('Navigate to detail on row click'),
    addRecordViaForm: z.boolean().optional().describe('Add records via form dialog'),
    addDeleteRecordsInline: z.boolean().optional().describe('Enable inline add/delete'),
    collapseAllByDefault: z.boolean().optional().describe('Collapse all groups by default'),
    // THE LEGACY BAG, and the ONE named refusal that reaches into it
    // (objectui#8365). Everything in here is `z.any()` and stays that way: this
    // is the pre-#2231 "component overrides" escape hatch, not an authoring
    // surface the protocol models, and typing it is a much larger question than
    // this card. ⚠️ But `ListView` merges `{ ...options.kanban, ...kanban }`
    // before it reads anything, and the retired producer objectui#8213 removed
    // wrote the stray `groupBy` into THIS nesting — so the stored views the
    // objectui#8365 ruling is about carry it here. A refusal that covered only
    // the declared `kanban` slot would leave exactly that population silently
    // re-grouped, which is option A; the ruling took option B.
    //
    // A record can declare no MEMBER, so this is a check rather than an arm:
    // same guidance string, read off {@link KanbanStrayGroupByRefusal}'s own
    // `.description` so the two channels cannot drift, reported as `custom` at
    // `options.kanban.groupBy` (the declared slot reports `invalid_type` at
    // `kanban.groupBy` — two codes, one message, and the pin asserts both).
    // ⛔ Scoped to the ONE key: no other member of `options.kanban`, and nothing
    // else under `options`, is judged here.
    options: z.record(z.string(), z.any())
      .check((ctx) => {
        const bag = ctx.value as Record<string, any> | undefined;
        const kanban = bag?.kanban;
        if (!kanban || typeof kanban !== 'object' || Array.isArray(kanban)) return;
        if ((kanban as Record<string, unknown>).groupBy === undefined) return;
        ctx.issues.push({
          code: 'custom',
          message: KanbanStrayGroupByRefusal.description as string,
          input: (kanban as Record<string, unknown>).groupBy,
          path: ['kanban', 'groupBy'],
        });
      })
      .optional().describe('Component overrides (legacy)'),
    operations: z.object({
      create: z.boolean().optional(),
      read: z.boolean().optional(),
      update: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
      import: z.boolean().optional(),
    }).optional().describe('Enabled operations'),
    // ── Local overrides: objectui shapes are intentionally broader than spec (deferred) ──
    userFilters: UserFiltersSchema.optional().describe('User filters configuration (accepts legacy tab shapes)'),
    // Spec `userActions` + the three toolbar toggles it does not model yet (#2890).
    userActions: UserActionsSchema.optional().describe('User action toggles for the view toolbar'),
    // `sharing` is the spec's `ViewSharingSchema`, imported by reference above.
    // The legacy `{ visibility, enabled }` pair folds into it at the ListView
    // boundary (#2890) — see `normalizeListViewSchema`.
    // ARIA — the spec's `AriaPropsSchema` (`ariaLabel` / `ariaDescribedBy` /
    // `role`) plus `live`, which has no spec counterpart. The legacy
    // `{ label, describedBy }` spellings fold into the canonical ones at the
    // ListView boundary (#2890).
    aria: stripImportedDefaults(SpecAriaPropsSchema).extend({
      live: z.enum(['polite', 'assertive', 'off']).optional()
        .describe('aria-live politeness for the list region (objectui-only — promote rather than grow this extension)'),
    }).optional().describe('ARIA attributes'),
    conditionalFormatting: z.array(z.union([
      z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in']),
        value: z.any(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        borderColor: z.string().optional(),
        expression: z.string().optional(),
      }),
      z.object({
        condition: z.string(),
        style: z.record(z.string(), z.string()),
      }),
    ])).optional().describe('Conditional formatting rules'),
    // `exportOptions` — the spec's own field, BY REFERENCE (objectui#6956).
    //
    // `ListViewExportOptionsSchema` is internal to the spec bundle (not a public
    // export — measured by `__tests__/export-options-spec-parity.test.ts`), but
    // the enclosing `ListViewSchema.shape.exportOptions` IS a live export, and it
    // is the whole contract: a two-branch union of the bare format array (the
    // legacy spelling, lifted to `{ formats }` at parse) and the STRICT five-key
    // object (`formats` / `maxRecords` / `includeHeaders` / `fileNamePrefix` /
    // `streaming`), with `'pdf'` refused in both spellings under an
    // `os migrate meta --from 16` prescription (objectstack#8010).
    //
    // This member used to restate a pre-#8010 shape — `'pdf'` accepted in both
    // branches, no `streaming`, a non-strict object — so `ListViewInferred`
    // (`z.input` of this schema, and through it the `ListViewSchema` TYPE the
    // ListView renderer is written against) disagreed with its sibling
    // `ObjectGridSchema['exportOptions']`, and the renderer could only read
    // `streaming` through `as any`. Binding the spec field by reference makes
    // the two faces one contract again and keeps the description the spec
    // wrote. The bare array stays admissible on the INPUT type on purpose:
    // nothing on the render path parses, so a stored array reaches `ListView`
    // un-lifted and its `resolvedExportOptions` fold is load-bearing
    // (objectui#4535 item 4).
    exportOptions: stripImportedDefaults(SpecListViewSchema).shape.exportOptions,
    // Per-view-type configs — spec-derived (see the definitions above #2231).
    // `gantt` is NOT here: it flows in from the spec fields unmodified.
    kanban: KanbanConfig.optional().describe('Kanban-specific configuration'),
    calendar: CalendarConfig.optional().describe('Calendar-specific configuration'),
    gallery: GalleryConfig.optional().describe('Gallery-specific configuration'),
    timeline: TimelineConfig.optional().describe('Timeline-specific configuration'),
  });

/**
 * TS type for the ListView component node (spec-derived; issue #2231).
 * The hand-written `interface ListViewSchema` in `../objectql.ts` is now an alias of
 * this type intersected with the non-serializable runtime-only props.
 *
 * `z.input`, not `z.infer` (framework#4074): this type describes the SDUI JSON as
 * AUTHORED and as the renderer actually RECEIVES it. The spec sub-schemas that flow
 * in (`userActions`, `tabs`→`ViewTab`, `sharing`, …) carry `.default()`s, so their
 * `z.infer` output makes those fields required — but nothing on the render path
 * runs `.parse()` to apply them: `normalizeListViewSchema` (`@object-ui/core`)
 * deliberately applies no defaults ("an absent flag stays absent", its test suite).
 * Typing the surface as parsed output therefore rejected valid authored metadata
 * (`userActions: { sort: true }`, a tab without `pinned`/`visible`) while promising
 * renderers defaults that never arrive. The output type of a spec parse belongs to
 * whoever actually parses; this surface is input on both sides.
 */
export type ListViewInferred = z.input<typeof ListViewSchema>;

/**
 * Object Map Configuration Schema — the runtime half of `ObjectMapConfig`
 * (`objectql.ts`).
 *
 * NOT named `MapConfigSchema`: `@objectstack/spec/automation` exports that name
 * for an unrelated automation concept, and `check:spec-symbols` refuses a local
 * declaration under a spec export's name.
 *
 * Lifted out of `plugin-map/src/ObjectMap.tsx`, where it was package-private,
 * so the declared authoring face and the validation the renderer performs are
 * ONE schema rather than two that can drift (objectui#5018). `ObjectMap`
 * imports this exact object; it no longer declares its own.
 */
export const ObjectMapConfigSchema = z.object({
  latitudeField: z.string().optional().describe('Field containing latitude'),
  longitudeField: z.string().optional().describe('Field containing longitude'),
  locationField: z.string().optional().describe('Field with a combined location value'),
  titleField: z.string().optional().describe('Field used as the marker title'),
  descriptionField: z.string().optional().describe('Field used as the marker description'),
  zoom: z.number().optional().describe('Zoom level (1-20); declaring it opts out of the auto-fit'),
  center: z.tuple([z.number(), z.number()]).optional().describe('Center [lat, lng]; declaring it opts out of the auto-fit'),
  style: z.string().optional().describe('MapLibre style URL/spec (overrides the public demo default)'),
});

/**
 * objectui#6939 — the record-source refinement `ObjectMapSchema`,
 * `ObjectGanttSchema` and `ObjectCalendarSchema` below share.
 *
 * Those renderers resolve their records from ONE of three keys, in this order:
 * `data`, `staticData` (inline rows, wrapped into a `{ provider: 'value' }`
 * config) or `objectName` (the bound object) —
 * `getDataConfig` in `plugin-map/src/ObjectMap.tsx` and
 * `plugin-gantt/src/ObjectGantt.tsx`, each `if (schema.data) … if
 * (schema.staticData) … if (schema.objectName) … return null`. Both mirrors
 * used to REQUIRE `objectName` alone, so a document authored on `staticData`
 * (6 of the 20 catalog entries objectui#6939 measured) drew correctly and was
 * refused by `safeValidateSchema` — `declared !== enforced`, with the corpus
 * on the right side. `objectName` is optional on both members now, and this
 * refinement carries the requirement the renderers actually have: with none of
 * the three present `getDataConfig` returns `null` and nothing is drawn.
 *
 * Presence is `!== undefined` — the ruling's wording ("at least one of `data`,
 * `staticData`, `objectName` is present"), NOT the renderers' truthiness: an
 * empty `objectName: ''` validated before this card and still does, so the
 * accept set only WIDENS. The one document shape refused here (none of the
 * three) was refused before too, when `objectName` was required. Maintainer
 * ruling recorded 2026-09-02 (director seat, summon #8, decision batch #8).
 *
 * The issue carries `params.code` so a consumer can key off the finding rather
 * than string-match the message — the shape `FormFieldSchema`'s refinement in
 * `form.zod.ts` uses; zod's own `code` is `custom` for every refinement. The
 * path is the ROOT (`[]`): no single key is at fault when all three are absent,
 * and blaming `objectName` would re-teach the requiredness this card removes.
 *
 * Deliberately a `function`, not an `export const`: the parity census in
 * `__tests__/zod-mirror-parity.test.ts` reads `^export const` out of this
 * directory and would demand a registered TS counterpart for it.
 *
 * ⭐ WHAT `data` MEANS IS NOT SHARED, only its PRESENCE is (objectui#9239).
 * This refinement asks one question — is any rung declared? — and `!==
 * undefined` answers it whatever the value's kind, so the three members reach
 * it from two different arms:
 *
 *  - `object-map` / `object-gantt` — `data` is a spec `ViewData` PROVIDER BLOCK
 *    (`{ provider, … }`), the source the block will FETCH FROM. Neither has a
 *    `ComponentPropsMap` row, so the published row that governs them is this
 *    file's own `ViewDataSchema.optional()`.
 *  - `object-calendar` — `data` is an ARRAY of PRE-FETCHED RECORDS, drawn in
 *    place of the block's own query, NOT a source to fetch from.
 *    `ComponentPropsMap['object-calendar'].data` is `z.array(z.unknown())
 *    .optional()` on `@objectstack/spec` 17.4.0 and the renderer honours that
 *    arm alone since objectui#8348 (`resolveRecordSourceConfig(schema,
 *    'array')`); objectui#9239 brought this file's member onto it.
 *
 * ⛔ So do not read the message below as promising a fetchable source: on the
 * calendar, declaring `data` means handing the block rows it already has.
 */
const RECORD_SOURCE_KEYS = ['data', 'staticData', 'objectName'] as const;
function requireRecordSource(type: 'object-map' | 'object-gantt' | 'object-calendar') {
  return (
    schema: Partial<Record<(typeof RECORD_SOURCE_KEYS)[number], unknown>>,
    ctx: z.core.$RefinementCtx,
  ): void => {
    if (RECORD_SOURCE_KEYS.some((key) => schema[key] !== undefined)) return;
    ctx.addIssue({
      code: 'custom',
      path: [],
      params: { code: 'RECORD_SOURCE_REQUIRED' },
      message: `\`${type}\` has no record source: declare one of \`data\`, \`staticData\` or \`objectName\``,
    });
  };
}

/**
 * ObjectMap Schema
 *
 * Mirrors the `ObjectMapSchema` interface in `objectql.ts` key for key. Every
 * key has a read site in `plugin-map/src/ObjectMap.tsx`; the FLAT spelling of
 * the `map` block's keys is the ObjectView/ListView flatten product and stays
 * out of this declaration (maintainer ruling on objectui#5018, 2026-08-17) —
 * except `locationField` / `titleField`, which were published before the
 * ruling and stay for compatibility.
 *
 * `objectName` is OPTIONAL and the member ends in `requireRecordSource`
 * (objectui#6939): `getDataConfig` reads `data`, then `staticData`, then
 * `objectName`, so a map authored on inline rows never reads the object name —
 * three catalog entries drew correctly and were refused here. Requiredness
 * moved to the refinement above, which is where the renderer actually has it.
 */
export const ObjectMapSchema = BaseSchema.extend({
  type: z.literal('object-map'),
  objectName: z.string().optional().describe('ObjectQL object name — the THIRD record source getDataConfig resolves, after data and staticData; one of the three must be present (objectui#6939)'),
  data: ViewDataSchema.optional().describe('Data source configuration — read FIRST by getDataConfig'),
  staticData: z.array(z.any()).optional().describe('Inline records — read SECOND by getDataConfig, wrapped into a { provider: value } config'),
  filter: z.array(z.any()).optional().describe('Query filter, forwarded as $filter'),
  sort: z.array(SortConfigSchema).optional().describe('Sort configuration, forwarded as $orderby (array only; the legacy string clause is retired — objectui#8221)'),
  map: ObjectMapConfigSchema.optional().describe('Map configuration (the author face)'),
  enableClustering: z.boolean().optional().describe('Group nearby markers into clusters'),
  navigation: stripImportedDefaults(SpecNavigationConfigSchema).optional().describe('Record navigation behaviour (drawer/dialog/page)'),
  locationField: z.string().optional().describe('Location field (internal flat form; prefer map.locationField)'),
  titleField: z.string().optional().describe('Title field (internal flat form; prefer map.titleField)'),
  mapStyle: z.string().optional().describe('MapLibre style URL/spec (overrides the public demo default)'),
}).superRefine(requireRecordSource('object-map'));

/**
 * ObjectTree (tree-grid) Schema
 */
export const ObjectTreeSchema = BaseSchema.extend({
  type: z.literal('object-tree'),
  objectName: z.string().describe('ObjectQL object name'),
  parentField: z.string().optional().describe('Single-parent pointer field (auto-detected when omitted)'),
  labelField: z.string().optional().describe('Field rendered indented in the first column'),
  fields: z.array(z.string()).optional().describe('Additional flat columns'),
  defaultExpandedDepth: z.number().optional().describe('Default expansion depth (0 = roots only)'),
});

/**
 * ObjectGantt Schema
 *
 * `objectName` is OPTIONAL and the member ends in `requireRecordSource`
 * (objectui#6939): `getDataConfig` (`plugin-gantt/src/ObjectGantt.tsx`) reads
 * `data`, then `staticData`, then `objectName`, so a gantt authored on inline
 * rows never reads the object name — three catalog entries drew correctly and
 * were refused here. `data` is declared for the first time in the same stroke:
 * it is the FIRST read of that resolver and was undeclared on both faces
 * (surviving on `BaseSchema`'s index signature), which would have left the
 * refinement naming a key this mirror had never heard of. It is spelled exactly
 * as `ObjectMapSchema.data` above, so the two members' record sources cannot
 * fork.
 */
export const ObjectGanttSchema = BaseSchema.extend({
  type: z.literal('object-gantt'),
  objectName: z.string().optional().describe('ObjectQL object name — the THIRD record source getDataConfig resolves, after data and staticData; one of the three must be present (objectui#6939)'),
  data: ViewDataSchema.optional().describe('Data source configuration — read FIRST by getDataConfig; undeclared on either face until objectui#6939'),
  startDateField: z.string().optional().describe('Start date field'),
  endDateField: z.string().optional().describe('End date field'),
  titleField: z.string().optional().describe('Title field'),
  // The legacy singular alias. Kept accepted — `getGanttConfig`'s flat branch
  // reads `dependenciesField || dependencyField` — but no longer declared as an
  // equal of the canonical key: same treatment `KanbanConfig` above gives
  // `groupField`/`cardFields`, so this adopts the ruled idiom rather than a
  // second spelling of "deprecated". The canonical `dependenciesField` is
  // declared below, BY REFERENCE to the spec (objectui#6470).
  /** @deprecated legacy alias for the spec's `dependenciesField` */
  dependencyField: z.string().optional().describe('Deprecated alias for dependenciesField'),
  progressField: z.string().optional().describe('Progress field'),
  // DERIVED from the spec's `GanttConfigSchema.shape.viewMode` (an optional
  // enum, deliberately WITHOUT a default) so the member list cannot drift
  // (objectui#5074). Absence semantics are load-bearing: an omitted `viewMode`
  // lets a persisted layout seed the timeline granularity before the
  // renderer's 'day' fallback — do NOT add `.default('day')` here.
  viewMode: stripImportedDefaults(SpecGanttConfigSchema).shape.viewMode.describe(
    'Initial timeline granularity, honoured by both renderer branches; when omitted, a persisted layout may seed it'
  ),
  // objectui#5903 — ten keys `ObjectGantt` reads and this mirror did not
  // declare. They were reachable only through `(schema as any).K`, so nothing
  // connected the read to a declaration. Mirrored here at the SAME requiredness
  // as `../objectql.ts` (all optional) so the zod-mirror-parity ratchet stays at
  // zero drift for this pair. `label` is NOT among them: `BaseSchema` already
  // declares it, so that read only needed its cast dropped.
  //
  // What declaring buys under `.passthrough()`: an undeclared key is still waved
  // through (objectui#5155's structural ceiling), but a DECLARED key is now
  // type-validated — `readOnly: 'yes'` is refused where it used to parse green.
  skipWeekends: z.boolean().optional().describe('Skip weekends in duration / auto-schedule math (working calendar)'),
  holidays: z.array(z.string()).optional().describe("Non-working dates for the working calendar, ISO 'yyyy-mm-dd' (UTC)"),
  persistLayout: z.boolean().optional().describe('Opt OUT of layout persistence — only an explicit false disables it'),
  viewName: z.string().optional().describe("Layout-persistence scope; storage key is `objectName:viewName` (default 'default')"),
  navigation: stripImportedDefaults(SpecNavigationConfigSchema).optional().describe('Record navigation behaviour on task click (drawer/dialog/page)'),
  markers: z
    .array(
      z.object({
        date: z.string().describe('Marker position, ISO date or datetime string'),
        label: z.string().optional().describe('Text drawn against the line'),
        color: z.string().optional().describe('Line colour — any CSS colour'),
      })
    )
    .optional()
    .describe('Extra vertical reference lines drawn like the Today marker'),
  criticalPath: z.boolean().optional().describe('Seed the critical-path highlight ON (toolbar toggle stays available)'),
  showBaselines: z.boolean().optional().describe('Render planned-vs-actual baseline bars — defaults ON, only an explicit false disables'),
  readOnly: z.boolean().optional().describe('Disable every write path and lock the record drawer'),
  mobileReadOnly: z.boolean().optional().describe('Auto read-only on narrow viewports — defaults ON, only an explicit false disables'),
  // objectui#6051 — the FLATTENED `GanttConfig` face. `getGanttConfig` builds its
  // config from these top-level keys when the node carries no `gantt` block and
  // `startDateField` / `endDateField` are both present — the block OUTRANKS this
  // face (objectui#6469); nothing declared them, on either side,
  // because `BaseSchema`'s index signature admits them untyped. Mirrored at the
  // SAME requiredness as `../objectql.ts` (all optional) so the zod-mirror-parity
  // ratchet stays at zero drift for this pair.
  //
  // The spec-modelled members are taken from `SpecGanttConfigSchema.shape` by
  // reference, exactly as `viewMode` above is, so the vocabulary cannot fork.
  colorField: stripImportedDefaults(SpecGanttConfigSchema).shape.colorField,
  dependenciesField: stripImportedDefaults(SpecGanttConfigSchema).shape.dependenciesField,
  parentField: stripImportedDefaults(SpecGanttConfigSchema).shape.parentField,
  typeField: stripImportedDefaults(SpecGanttConfigSchema).shape.typeField,
  tooltipFields: stripImportedDefaults(SpecGanttConfigSchema).shape.tooltipFields,
  baselineStartField: stripImportedDefaults(SpecGanttConfigSchema).shape.baselineStartField,
  baselineEndField: stripImportedDefaults(SpecGanttConfigSchema).shape.baselineEndField,
  groupByField: stripImportedDefaults(SpecGanttConfigSchema).shape.groupByField,
  resourceView: stripImportedDefaults(SpecGanttConfigSchema).shape.resourceView,
  assigneeField: stripImportedDefaults(SpecGanttConfigSchema).shape.assigneeField,
  effortField: stripImportedDefaults(SpecGanttConfigSchema).shape.effortField,
  capacity: stripImportedDefaults(SpecGanttConfigSchema).shape.capacity,
  quickFilters: stripImportedDefaults(SpecGanttConfigSchema).shape.quickFilters,
  autoZoomToFilter: stripImportedDefaults(SpecGanttConfigSchema).shape.autoZoomToFilter,
  // …and the ten that used to be a SECOND declaration here. objectui read them
  // through `GanttConfigSchema`'s then-open `.passthrough()` window and had to
  // model them locally (`GanttConfigExtensionFields`, objectui#6051/#6475);
  // objectstack#15469 closed the window and declared all ten upstream, so they
  // arrive by reference like every member above and the local field map is
  // retired (objectui#7845). Compared member for member before deleting: the
  // spec's declarations cover the same keys, the same `interactions`
  // (move/resize/progress/link) and `timeSegments` (dayStart/bands/showMidnight)
  // sub-shapes and the same band members, with strictly fuller describes — the
  // local copy carried no describe, alias or member the spec's lacks.
  borderColorField: stripImportedDefaults(SpecGanttConfigSchema).shape.borderColorField,
  lockField: stripImportedDefaults(SpecGanttConfigSchema).shape.lockField,
  objectField: stripImportedDefaults(SpecGanttConfigSchema).shape.objectField,
  summaryExtent: stripImportedDefaults(SpecGanttConfigSchema).shape.summaryExtent,
  defaultCollapsedDepth: stripImportedDefaults(SpecGanttConfigSchema).shape.defaultCollapsedDepth,
  dependencyTypes: stripImportedDefaults(SpecGanttConfigSchema).shape.dependencyTypes,
  timeZone: stripImportedDefaults(SpecGanttConfigSchema).shape.timeZone,
  exportFileName: stripImportedDefaults(SpecGanttConfigSchema).shape.exportFileName,
  interactions: stripImportedDefaults(SpecGanttConfigSchema).shape.interactions,
  timeSegments: stripImportedDefaults(SpecGanttConfigSchema).shape.timeSegments,
  // `gantt` — the BLOCK face `getGanttConfig`'s FIRST branch reads and prefers
  // (objectui#6469 ruled block-over-flat) — objectui#6475. It is now
  // `SpecGanttConfigSchema` itself, the same vocabulary the flat face above
  // derives from key by key, so the two authoring faces cannot fork. The
  // `.extend(GanttConfigExtensionFields)` this used to carry is gone with the
  // field map (objectui#7845): the spec declares those ten itself.
  //
  // This is the one entry among the 28 that NARROWS rather than merely names: a
  // `gantt` block previously rode through `.passthrough()` entirely unvalidated;
  // now it is PARSED against the spec's `GanttConfigSchema`, which REQUIRES
  // `startDateField`/`endDateField`/`titleField`. This mirror reaches the CLI's
  // `validate`/`check` through `AnyComponentSchema` → `safeValidateSchema`, so a
  // block missing the trio moves from "accepted, then warned about at runtime"
  // to "refused at authoring time" — a `declared = enforced` restoration, not
  // new requiredness: the renderer already fed the block to
  // `GanttConfigSchema.safeParse` and logged `[ObjectGantt] Invalid gantt
  // configuration` on failure. Maintainer ruling, objectui#6475 (2026-08-27),
  // Option A: enforce as-is, no warning window (excluded by the startup-stage
  // no-gradualism rule, objectstack#12668 — no named external-user evidence).
  gantt: stripImportedDefaults(SpecGanttConfigSchema).optional().describe(
    'Nested gantt config block — the authoring face, and the winner over the flattened top-level keys whenever present'
  ),
  // The query/data keys the fetch path reads. They were declared on
  // `ObjectGridSchema` — what `ObjectGanttProps.schema` used to be typed as before
  // objectui#5903 retyped it to `ObjectGanttSchema` — so they need declaring here.
  staticData: z.array(z.any()).optional().describe('Inline records, wrapped into a { provider: value } data config — read SECOND by getDataConfig'),
  filter: z.array(z.any()).optional().describe('Query filter, forwarded verbatim as $filter'),
  sort: z.array(SortConfigSchema).optional().describe('Sort configuration, forwarded as $orderby (array only; the legacy string clause is retired — objectui#8221)'),
}).superRefine(requireRecordSource('object-gantt'));

/**
 * ObjectCalendar Schema
 *
 * `objectName` is OPTIONAL and the member ends in `requireRecordSource`
 * (objectui#7313, the objectui#6939 shape): the renderer resolves its records
 * through the shared ladder (`resolveRecordSourceConfig` in
 * `@object-ui/core`, `plugin-calendar/src/ObjectCalendar.tsx`) — `data`, then
 * `staticData`, then `objectName` — so a calendar authored on inline rows never
 * reads the object name, and the two static-data examples the plugin page
 * documents drew correctly and were refused here. `data` and `staticData` are
 * declared for the first time in the same stroke: they are the FIRST and SECOND
 * reads of that resolver and were undeclared on both faces (surviving on
 * `BaseSchema`'s index signature and on `.passthrough()`), which would have
 * left the refinement naming keys this mirror had never heard of. Both are
 * spelled exactly as `ObjectGanttSchema` above spells them, so the members'
 * record sources cannot fork.
 */
export const ObjectCalendarSchema = BaseSchema.extend({
  type: z.literal('object-calendar'),
  objectName: z.string().optional().describe('ObjectQL object name — the THIRD record source getDataConfig resolves, after data and staticData; one of the three must be present (objectui#7313)'),
  // objectui#9239 — the ARRAY arm, mirroring `ComponentPropsMap['object-calendar'].data`
  // on `@objectstack/spec` (`z.array(z.unknown()).optional()`, "Pre-fetched
  // records — skips the internal fetch"). ⛔ NOT `ViewDataSchema`: this member
  // declared the provider BLOCK until that card while the protocol declared an
  // array, so `safeValidateSchema` returned a green verdict for a document the
  // protocol, `os validate`, the save gate and (since objectui#8348) the
  // renderer all refuse. Maintainer ruling, decision batch #83 (2026-09-08),
  // verbatim 「8348 以协议为准」, and the standing lane arbiter 「以 objectstack
  // 协议为准，文档应该以实际实现为准。协议不正确的应该先修改协议」.
  //
  // ⛔ `ObjectMapSchema.data` / `ObjectGanttSchema.data` above are NOT following:
  // neither block has a `ComponentPropsMap` row, so the published row governing
  // them is this file's own `ViewDataSchema.optional()` and it stays.
  //
  // Mirrored at the SAME requiredness as `../objectql.ts` (both optional) so the
  // zod-mirror-parity ratchet stays at zero drift for this pair, and at the same
  // TYPE: the TS face derives `SpecObjectCalendarProps['data']`, whose input is
  // `unknown[]`, which is exactly what `z.array(z.unknown())` infers here.
  data: z.array(z.unknown()).optional().describe('Pre-fetched records — an ARRAY, drawn in place of the calendar\'s own query; read FIRST by the record-source ladder. Mirrors ComponentPropsMap[\'object-calendar\'].data — the { provider, items } config object is refused by kind on this block (objectui#9239, ruling objectui#8348)'),
  staticData: z.array(z.any()).optional().describe('Inline records, wrapped into a { provider: value } data config — read SECOND by getDataConfig'),
  startDateField: z.string().optional().describe('Start date field'),
  endDateField: z.string().optional().describe('End date field'),
  titleField: z.string().optional().describe('Title field'),
  // objectui#8466 — the last two members of the FLAT field-name face, which
  // `ObjectCalendar.tsx`'s `getCalendarConfig` reads bare off the node and
  // which `plugin-calendar/README.md` teaches as authorable. Neither published
  // face of this package named them: they rode `BaseSchema`'s `[key: string]:
  // any` on the TS side and its `.passthrough()` here — admitted, never
  // examined, so a misspelling left the calendar silently colourless while
  // every published gate passed.
  //
  // Mirrored at the SAME requiredness as `../objectql.ts` (both optional) so
  // the zod-mirror-parity ratchet stays at zero drift for this pair, exactly as
  // the `filter`/`sort` pair above.
  //
  // ⛔ Neither key is added to `plugin-calendar`'s registration `inputs`, and
  // that asymmetry is deliberate: `ComponentPropsMap['object-calendar']`
  // refuses all five flat keys with `unrecognized_keys`, so declaring them
  // THERE would redden the FORWARD direction of
  // `apps/console/src/__tests__/registry-inputs-spec-parity.test.ts`. The flat
  // face is objectui's own lane — `titleField`/`startDateField`/`endDateField`
  // have shipped declared here, and absent from `inputs`, for releases.
  colorField: z.string().optional().describe('Field carrying the per-record event colour — a CSS colour or a semantic palette name'),
  allDayField: z.string().optional().describe("Field carrying the all-day flag — objectui-local (the spec's CalendarConfigSchema refuses it by name); LOAD-BEARING since objectui#8026"),
  defaultView: z.enum(['month', 'week', 'day']).optional().describe("Default view — 'month' | 'week' | 'day', the renderer's rendered set ('agenda' was retired: objectui#5784)"),
  // objectui#8174 — the two query keys `ObjectCalendar.tsx` lowers onto its own
  // `dataSource.find` (`$filter: schema.filter`,
  // `$orderby: convertSortToQueryParams(schema.sort)`). The spec declares both
  // on `ComponentPropsMap['object-calendar']` and the plugin's registration
  // `inputs` publishes both, but neither published face of THIS package named
  // them: they rode `BaseSchema`'s `.passthrough()` here and its
  // `[key: string]: any` on the TS side. Spelled exactly as
  // `ObjectGanttSchema` above spells them, and mirrored at the SAME
  // requiredness as `../objectql.ts` (both optional) so the zod-mirror-parity
  // ratchet stays at zero drift for this pair.
  //
  // What declaring buys under `.passthrough()` is NOT capped by objectui#7927's
  // index-signature ceiling: that ceiling is about a MISSPELLED key, which
  // stays admitted either way. A DECLARED key is now VALUE-validated, and this
  // mirror reaches `safeValidateSchema` through `AnyComponentSchema` and so
  // reaches the CLI's `validate` / `check` — `sort: 'name asc'`, the string
  // clause objectui#8221 retired, moves from "parses green here, then silently
  // dropped by `convertSortToQueryParams` at runtime" to "refused at authoring
  // time".
  filter: z.array(z.any()).optional().describe('Query filter, forwarded verbatim as $filter'),
  sort: z.array(SortConfigSchema).optional().describe('Sort configuration, forwarded as $orderby (array only; the legacy string clause is retired — objectui#8221)'),
}).superRefine(requireRecordSource('object-calendar'));

/**
 * ObjectKanban Schema
 */
// Since #1584, kanban card styling runs on the shared CEL evaluator, so a
// kanban rule accepts BOTH the native `{ field, operator, value }` shape and the
// spec `{ condition, style }` shape (a CEL predicate + style map) — matching
// list/grid `conditionalFormatting`. The type/schema now match the runtime.
//
// Exported since objectui#7664 so `complex.zod.ts`'s `KanbanSchema` (the
// `'kanban'` arm) mirrors `conditionalFormatting` with the SAME rule union as
// this `'object-kanban'` arm — one declaration of the rule, two arms. It is a
// union of two rule dialects with no `.shape` of its own, so the parity census
// EXCLUDES it rather than pairing it; its TS twin is the type union
// `KanbanConditionalFormattingRule` (`../objectql.ts`).
export const KanbanConditionalFormattingRuleSchema = z.union([
  z.object({
    field: z.string().describe('Field name to check'),
    operator: z.enum(['equals', 'not_equals', 'contains', 'in']).describe('Comparison operator'),
    value: z.union([z.string(), z.array(z.string())]).describe('Value to compare against'),
    backgroundColor: z.string().optional().describe('Background color'),
    borderColor: z.string().optional().describe('Border color'),
  }),
  z.object({
    condition: z.string().describe('CEL predicate evaluated against the card record'),
    style: z.record(z.string(), z.string()).describe('CSS styles applied when the condition is true'),
  }),
]);

/**
 * The `object-kanban` board has a record source — at least one of `bind`,
 * `data`, `objectName` is present (objectui#7780).
 *
 * ⚠️ NOT `requireRecordSource` above, and deliberately not built on it. That
 * one serves the `object-map` / `object-gantt` / `object-calendar` ladder,
 * whose rungs are `data` (a `ViewData` PROVIDER BLOCK) → `staticData` →
 * `objectName`, resolved by the shared `resolveRecordSourceConfig` in
 * `@object-ui/core`. This board walks a DIFFERENT ladder in
 * `plugin-kanban/src/ObjectKanban.tsx`: the pre-fetched `data` PROP →
 * `useDataScope(schema.bind)` → the inline ROW ARRAY on `schema.data` → a
 * fetch keyed by `schema.objectName`
 * (`rawData = external || boundData || schema.data || fetchedData`, the fetch
 * gated on `schema.objectName && !boundData && !schema.data`). It has NO
 * `staticData` rung and it HAS a `bind` rung, so the two key sets are neither
 * equal nor nested and one predicate cannot serve both. objectui#7651 (ruled
 * B, closed `not_planned`) refuses giving this board the shared ladder; this
 * refinement describes the ladder that is already there rather than adding
 * one.
 *
 * The pre-fetched `data` PROP is NOT a key here: it is a React prop
 * (`ObjectKanbanComponentProps.data`, passed by a parent such as `ListView`),
 * not something an author writes on the node, so it can neither be declared
 * nor required.
 *
 * `bind` and `data` are `BaseSchema` members on BOTH faces — declared once, on
 * the base, as optional members (`base.zod.ts` here, `../base.ts` there) and
 * INHERITED by this member rather than restated on it. So this refinement names
 * no key its own mirror has never heard of, the property objectui#7313 had to
 * buy by declaring `data` / `staticData` first, and it names no key this
 * member re-declares — `base-bind-declared.test.ts` (objectui#6357) keeps the
 * `bind` declaration single, and the identity assertion in
 * `__tests__/object-kanban-record-source-7780.test.ts` keeps both inherited.
 *
 * Presence is `!== undefined`, matching the sibling predicate's wording rather
 * than the renderer's truthiness: `objectName: ''` validated before this card
 * and still does, so the accept set only WIDENS. The one shape refused here
 * (none of the three present) was refused before too, when `objectName` was
 * required — see the before/after table in
 * `__tests__/object-kanban-record-source-7780.test.ts`.
 *
 * ⛔ `groupBy` is NOT a rung and is untouched: it stays REQUIRED (objectui#7322,
 * PR #7774). A record source and a lane key are different questions, and the
 * two readings PR #7774 excluded from counting as a lane-less mode — the
 * `dataSource` json fragment in `content/docs/utilities/data-objectstack.mdx`
 * and `ListView.tsx`'s runtime-generated node — are still refused here, on
 * `groupBy`, exactly as they were.
 *
 * Carries `params.code` so a consumer keys off the finding rather than
 * string-matching the message, and reports at the ROOT path (`[]`): no single
 * key is at fault when all three are absent, and blaming `objectName` would
 * re-teach the requiredness this card removes.
 *
 * Deliberately a `function`, not an `export const`, for the same reason
 * `requireRecordSource` is: the parity census in
 * `__tests__/zod-mirror-parity.test.ts` reads `^export const` out of this
 * directory and would demand a registered TS counterpart for it.
 */
/**
 * The `object-kanban` SWIMLANE element (objectui#8913) — the mirror half of
 * `ObjectKanbanSchema.columns` in `../objectql.ts`, whose docblock carries the
 * measurements. Private on purpose: it publishes no new symbol, so the
 * `zod-mirror-parity` census (which pairs `^export const` mirrors with a TS
 * declaration) has nothing new to register, exactly as `requireKanbanRecordSource`
 * below is a `function` for the same reason.
 *
 * ⭐ Both arms, because `@objectstack/spec` admits both. Its
 * `ObjectKanbanPropsSchema.columns` is `z.array(z.unknown()).optional()` and
 * states the shape in its `describe` prose — "{ id, title } per `groupBy`
 * value, or bare value strings". Admitting only the object arm would make this
 * repository NARROWER than the protocol, which the maintainer principle in
 * force forbids (2026-09-09, verbatim, untranslated):
 * 「我们的项目以 objectstack 协议为准，文档应该以实际实现为准。协议不正确的应该先修改协议。」
 *
 * ⛔ Both arms WHOLE, not per element: `columns` is a UNION OF TWO ARRAYS, and
 * a MIXED array is refused. objectui#8913's first cut spelled it
 * `z.array(z.union([...]))` and so admitted a mix. `effectiveColumns` dispatches
 * on `columns[0]` alone, so an object-first mix pushes every string element
 * through the object branch and a string-first mix is ignored whole; measured
 * on the real bucketer with `[{ id: 'done', title: 'Done' }, 'todo']` the lanes
 * are `done:r2, undefined:, __uncolumned__:r1` — a blank lane whose own keys
 * are `["0","1","2","3","cards"]` and the `todo` record in "Uncategorized".
 * The protocol names no mixed example. A declaration that admits a shape the
 * renderer mishandles is the defect this card removes, so it is refused here.
 *
 * ⭐ The STRING arm is REACHABLE since objectui#8990. The renderer's string
 * branch returns only under `if (!schema.groupBy)`, and `groupBy` was required
 * on this face — so objectui#8913 admitted the arm (refusing it would have
 * been a second narrowing) while recording that nothing could reach it.
 * objectui#8990 made `groupBy` OPTIONAL, and a `groupBy`-less board with
 * `columns: ['todo', 'doing']` now parses AND draws those two lanes, titled by
 * the RAW strings rather than the picklist labels a grouped board would show.
 * ⚠️ Reachable is not populated — a lane-less board holds zero cards, because
 * `bucketCardsIntoColumns` returns before distributing records when there is
 * no lane key.
 *
 * ⛔ NOT `KanbanColumnSchema`, whose `cards` is REQUIRED: that mirror is the
 * RUNTIME lane (`bucketCardsIntoColumns` fills `cards` before `KanbanImpl`
 * sees it), and requiring it here would refuse the protocol's own
 * gate-validated `{ id, title }` example, the lanes the renderer materializes
 * from a picklist, and this repository's own typed board fixtures. `cards` is
 * therefore optional and the two mirrors stay separate rather than one being
 * derived from the other — the faces genuinely differ, and a derivation would
 * make a future edit to the retired arm's lane silently move this one.
 *
 * `cards` reuses `KanbanCardSchema` (`./complex.zod.ts`) rather than restating
 * it: the card vocabulary has one authority, and reaching it is what restores
 * objectui#6939's judging — a lane card with no `title` is refused again.
 */
const ObjectKanbanLaneSchema = z.object({
  id: z.string().describe('Lane id — matched against the groupBy value. STRING only, and the narrowing stands on its own: until objectui#8993 the bucketer built knownIds from the raw col.id and compared it with Object.keys(groups), which are strings, so a numeric id bucketed every card TWICE; the sweep now keys membership the way the injection always did'),
  title: z.string().describe('Lane heading, localized against the groupBy picklist option labels'),
  cards: z.array(KanbanCardSchema).optional().describe('Cards this lane carries — a STATIC board only; an object-bound board buckets records into the lane by groupBy'),
  limit: z.number().optional().describe('WIP limit — the card count at which the lane warns; never reaches the query'),
  className: z.string().optional().describe('Lane class name'),
  collapsed: z.boolean().optional().describe('Whether the lane renders collapsed (honoured by the enhanced board)'),
});

const KANBAN_RECORD_SOURCE_KEYS = ['bind', 'data', 'objectName'] as const;
function requireKanbanRecordSource(
  schema: Partial<Record<(typeof KANBAN_RECORD_SOURCE_KEYS)[number], unknown>>,
  ctx: z.core.$RefinementCtx,
): void {
  if (KANBAN_RECORD_SOURCE_KEYS.some((key) => schema[key] !== undefined)) return;
  ctx.addIssue({
    code: 'custom',
    path: [],
    params: { code: 'RECORD_SOURCE_REQUIRED' },
    message: '`object-kanban` has no record source: declare one of `bind`, `data` or `objectName`',
  });
}

// objectui#7322 — `groupBy` and `limit` are the keys `ObjectKanban.tsx` reads
// (thirteen `schema.groupBy` sites; `$top: schema.limit ?? DEFAULT_KANBAN_LIMIT`
// at `:264`); until this card neither was declared and both rode `BaseSchema`'s
// `.passthrough()` unexamined, while the REQUIRED `groupField` had zero read
// sites. `groupField` is now a `retirementTombstone()` — still a member, so
// the parity ratchet's key sets stay equal and an authored value is refused
// BY NAME rather than stripped — and it is node-local: the VIEW-LEVEL alias
// `KanbanConfig.groupField` above is live and untouched.
export const ObjectKanbanSchema = BaseSchema.extend({
  type: z.literal('object-kanban'),
  objectName: z.string().optional().describe('ObjectQL object name — the LAST rung of the board ladder, after the pre-fetched data prop, bind and the inline row array on data; one of bind, data, objectName must be present (objectui#7780)'),
  // objectui#8990 — OPTIONAL, mirroring `@objectstack/spec`
  // (`ObjectKanbanPropsSchema.groupBy` is `z.string().optional()`). Required
  // here until this card, so this validator refused a document the protocol
  // accepts — including this repo's own documented `{ type, dataSource }`
  // board (`content/docs/utilities/data-objectstack.mdx`) and the node
  // `plugin-list/src/ListView.tsx` generates when a view declares no lane
  // field (`groupBy: laneField`, `laneField = … || undefined`). Requiredness
  // is the ONLY thing that moved; the measured behaviour of a lane-less board
  // (lanes drawn, ZERO cards, moves inert) is reasoned on the TS twin.
  groupBy: z.string().optional().describe('Field whose value places a record in a lane — the lane key the object-kanban renderer reads (ObjectKanban.tsx, thirteen sites). Optional, as @objectstack/spec declares it: a board with no lane key renders its declared lanes and holds no cards, since the bucketer needs a key to distribute records'),
  groupField: retirementTombstone('RETIRED (objectui#7322) — `groupField` is not read by the object-kanban renderer; author `groupBy`. (The view-level `kanban.groupField` alias is unaffected.)'),
  // objectui#8913 — the lane vocabulary the renderer reads and neither face
  // named. Mirrors `../objectql.ts` member for member; the element union, the
  // optional `cards` and the reason this is not `KanbanColumnSchema` are
  // reasoned on `ObjectKanbanLaneSchema` above and on the TS twin.
  columns: z.union([z.array(z.string()), z.array(ObjectKanbanLaneSchema)]).optional()
    .describe('Swimlane definitions — EITHER an array of { id, title } lanes per groupBy value OR an array of bare value strings; NOT a field projection (the fields drawn on a card are cardFields), and not a mix of the two, which the renderer cannot dispatch'),
  limit: z.number().int().positive().optional().describe('Row cap — the most records the board fetches, sent as a real $top on the query; default 100 (DEFAULT_KANBAN_LIMIT)'),
  // objectui#8174 — the query key `ObjectKanban.tsx` lowers onto its own
  // `dataSource.find` (`$filter: schema.filter`), alongside the `$top` that
  // `limit` above feeds. Same position `groupBy` and `limit` were in before
  // objectui#7322: declared by the spec (`ComponentPropsMap['object-kanban']`)
  // and by the plugin's registration `inputs`, read by the renderer, and named
  // by neither published face of this package. Spelled exactly as
  // `ObjectGanttSchema` above spells it, and mirrored at the SAME requiredness
  // as `../objectql.ts` (optional) so the zod-mirror-parity ratchet stays at
  // zero drift for this pair.
  //
  // ⚠️ No `sort` twin here, and the absence is measured: `ObjectKanban.tsx` has
  // ZERO `schema.sort` read sites and the spec's `object-kanban` entry declares
  // no `sort` either. Only `ObjectCalendarSchema` above carries both.
  filter: z.array(z.any()).optional().describe('Query filter, forwarded verbatim as $filter'),
  titleField: z.string().optional().describe('Title field'),
  cardFields: z.array(z.string()).optional().describe('Card fields'),
  quickAdd: z.boolean().optional().describe('Enable Quick Add button at column bottom'),
  coverImageField: z.string().optional().describe('Field name for cover image on cards'),
  allowCollapse: z.boolean().optional().describe('Allow columns to collapse/expand'),
  conditionalFormatting: z.array(KanbanConditionalFormattingRuleSchema).optional().describe('Card conditional formatting rules'),
  // ── objectui#7804 — the three handler keys `KanbanRenderer` reads off the
  // document this arm judges, MEASURED one at a time (director seat ruling of
  // 2026-09-07, decision batch #69: the arm a `type` selects is the contract
  // for what renders under it, and a registered renderer may not read a key the
  // arm does not declare).
  //
  // Until here they were declared by NOTHING. `BaseSchema` is `.passthrough()`,
  // so an authored `onCardClick: { action: 'toast' }` was not refused — it
  // stopped being judged, the value was KEPT, and it was handed to a call site
  // expecting a function. That is objectui#7664's measured transition; the
  // three sat on the bare `kanban` arm as objectui#6124 RUNTIME SLOTS until
  // objectui#8802 retired that arm, and the surviving `object-kanban` face
  // inherited the reads without the declarations.
  //
  // ⛔ The three do NOT share a disposition, and sharing one because they share
  // a prefix is the error this ruling forbids. The per-key channel readings and
  // the drive that separates them are in `@object-ui/plugin-kanban`'s
  // `__tests__/handlerKeyDispositionsMeasured-7804.test.tsx`; the twin
  // docblocks in `../objectql.ts` carry the reasons member by member.
  //
  // ⚠️ TWO of the three land here. `onCardMove` is the third and it is NOT
  // declared, deliberately: its authored value is measured to reach NOTHING on
  // this entry (`ObjectKanban` substitutes its own mover and declares no
  // `onCardMove` React prop), which is the `'retired'` disposition — and
  // `check:handler-key-reads` REFUSES that spelling while `KanbanRenderer`
  // still reads the key off the document it is handed, printing
  // `declares it RETIRED, but a renderer still reads it`. Closing that needs
  // the READ to move to an explicit React prop — the objectui#7742 remedy this
  // same file already applied to `objectFields` — which narrows a published
  // component's props and is a ruling, not a repair. So the key keeps its
  // `KNOWN_UNDECLARED_READS` row naming objectui#7804, which stays open and
  // stays the parent, and this arm does not pretend to judge it.
  onCardClick: handlerKeyRefusal('onCardClick', 'runtime-slot', 'Card click handler'),
  onQuickAdd: handlerKeyRefusal('onQuickAdd', 'runtime-slot', 'Quick Add handler'),
}).superRefine(requireKanbanRecordSource);

/**
 * ObjectChart Schema
 */
export const ObjectChartSchema = BaseSchema.extend({
  type: z.literal('object-chart'),
  // Legacy inline path (objectName + aggregate). Optional now that a chart may
  // instead bind to a semantic-layer dataset (ADR-0021, #1890).
  objectName: z.string().optional().describe('ObjectQL object name (legacy inline path)'),
  chartType: z.enum(['bar', 'column', 'horizontal-bar', 'line', 'area', 'pie', 'donut', 'scatter']).describe('Chart type'),
  xAxisField: z.string().optional().describe('X axis field (legacy inline path)'),
  yAxisFields: z.array(z.string()).optional().describe('Y axis fields (legacy)'),
  aggregation: z.enum(['cardinality', 'sum', 'avg', 'min', 'max']).optional().describe('Aggregation (legacy)'),
  // ADR-0021 semantic-layer binding: dimensions/measures selected BY NAME from a
  // dataset, queried via the governed queryDataset path.
  dataset: z.string().optional().describe('Semantic-layer dataset name (ADR-0021)'),
  dimensions: z.array(z.string()).optional().describe('Dataset dimension names'),
  values: z.array(z.string()).optional().describe('Dataset measure names'),
  // ── objectui#7946: the four keys the producers write and the renderer reads ──
  //
  // Declared on BOTH published copies by the 2026-09-09 ruling (option A), with
  // value types derived from `ChartRendererProps` / `ObjectChart.tsx`'s reads
  // and NOT copied from any producer's literal. `../objectql.ts`'s docblock
  // carries the per-key AUTHORABLE / INTERNAL verdict and its ground; the short
  // form is repeated in each `.describe()` because that string is what an
  // author-facing tool renders.
  //
  // ⭐ Where the SPEC already owns the shape, the binding is BY REFERENCE and
  // the local spelling is a defect, not a style: see `aggregate` below. A
  // near-copy publishes a second dialect of one key, and — because a local
  // `z.object` strips where the spec's `strictObject` refuses — the copy is
  // quietly the more permissive of the two.
  //
  // Declaring an INTERNAL key here is not a promotion. `BaseSchema` is
  // `.passthrough()`, so `xAxisKey` and `series` already rode through this
  // mirror unexamined; what changes is that their VALUES are checked. Leaving
  // them undeclared would instead have put them in `zod-mirror-parity`'s
  // `UnmirroredDeclared` ledger — which that file calls a real defect in the
  // pair, not a neutral state.
  // BOTH `filter` arms are live and both are measured — see the twin docblock in
  // `../objectql.ts`. The array arm is the spec's published `FilterArray` and
  // the registry `inputs` spelling; the record arm is the ObjectQL `$filter`
  // object the drill-down spread requires and the in-repo corpus authors.
  // ⚠️ Narrowing to one arm is a decision local to THIS node — the six sibling
  // `object-*` widgets are already array-only — and it is blocked on the
  // drill-down spread, which mis-composes the array arm into index keys.
  filter: z.union([
    z.array(z.any()),
    z.record(z.string(), z.any()),
  ]).optional().describe('AUTHORABLE — query filter, forwarded verbatim as $filter on both query legs, then spread into the drill-down filter. FilterArray (the spec/react-blocks and registry-inputs spelling) OR the ObjectQL $filter object'),
  // ⛔ `aggregate` is the SPEC's own schema, never a local near-copy. The first
  // cut of objectui#7946 spelled it as a local `z.object` with all three members
  // optional; zod 4 objects are STRIP-postured, so
  // `{ groupby: 'stage', function: 'count' }` parsed clean and dropped the
  // mis-cased key silently — the failure `ChartAggregateSchema`'s own
  // `strictObject` posture exists to prevent, reintroduced by the copy. Bound by
  // reference the strict posture and the requiredness come with it, and the
  // authoring door here and at the react-page publish gate are one shape.
  aggregate: stripImportedDefaults(SpecChartAggregateSchema).optional()
    .describe('AUTHORABLE — inline aggregation for the legacy objectName path. @objectstack/spec ChartAggregateSchema ({ field?, function, groupBy }), the same schema the react-page publish gate parses: function and groupBy are REQUIRED, field is optional because only count counts rows rather than a column, and unknown keys are refused rather than dropped'),
  xAxisKey: z.string().optional().describe('INTERNAL (relay-composed) — the category column the renderer binds the x axis to. Authors write xAxisField (or the spec xAxis: { field } one layer down); all five producers compute this key'),
  series: z.array(z.object({
    dataKey: z.string().describe('Result column this series plots'),
    label: z.string().optional().describe('Series display label'),
    variant: z.enum(['current', 'comparison']).optional().describe('Comparison overlays render muted'),
    opacity: z.number().optional().describe('Series opacity override (0-1)'),
    dashArray: z.string().optional().describe('SVG stroke-dasharray override'),
    chartType: z.enum(['bar', 'line', 'area']).optional().describe('Per-series family override (combo charts)'),
    stack: z.string().optional().describe('Stack identifier to group series'),
    yAxis: z.enum(['left', 'right']).optional().describe('Bind to a specific Y axis'),
    color: z.string().optional().describe('Series color (hex/rgb/token)'),
  })).optional().describe("INTERNAL (relay-composed) — plotted series in the renderer's internal { dataKey } contract, the arm ChartRendererProps declares. The spec's author-facing ChartSeriesSchema is the { name } arm and refuses dataKey by name; normalizeChartSchema is the one translation"),
  // Colors are overloaded kanban-style: a string[] is the positional palette
  // (applied per category in order; fallback only), while a Record<value,color>
  // is an explicit value→color map. A select/lookup dimension's option colors —
  // and any explicit map — take precedence over the positional palette per
  // category, so health green/red/yellow paints semantically.
  colors: z.union([
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]).optional().describe('Positional palette (string[]) OR a value→color map ({ value: color }, kanban-style). Select/lookup option colors and explicit maps win over the palette per category.'),
  // ── objectui#8885: three more keys `ObjectChart.tsx` reads that neither
  // published copy of this shape declared. Each is the SPEC's own schema at the
  // crossing, never a local near-copy — see the TS twin in `../objectql.ts` for
  // the per-key measurement.
  //
  // ⚠️ The keys ABOVE (`filter` / `aggregate` / `xAxisKey` / `series` /
  // `colors`) are objectui#7946's and were ruled on separately; this card swept
  // none of them in, and that card swept none of these three in. The two census
  // pins record the split — `../__tests__/object-chart-undeclared-keys-8885.test.ts`
  // and `../__tests__/widget-schema-anchors-7946.test.ts` each ledger the other
  // card's keys BY NAME and assert only that each is STILL READ, never that it
  // is still undeclared, which is why the landing order of the two never
  // mattered.
  drillDown: stripImportedDefaults(SpecChartDrillDownSchema).optional()
    .describe('Segment drill config — @objectstack/spec ChartDrillDownSchema ({ enabled?, filter?, title?, target?: drawer | dialog | navigate, columns?, maxRows? }). Present = on; {} is enough. NOT the wider DrillDownConfig: a chart reads neither `mode` nor `report`.'),
  title: stripImportedDefaults(SpecI18nLabelSchema).optional()
    .describe('Chart heading, and the drill drawer heading fallback. @objectstack/spec I18nLabel — a plain string or an inline locale map, the union `normalizeChartSchema`’s `label()` resolves. Not a BaseSchema member.'),
  // Strip-then-slot, the objectui#7779 idiom `ObjectViewSchema` above uses:
  // the boundary is applied to the whole imported schema and the slot is taken
  // off the RESULT, so the crossing is visible to the objectui#8317 census in
  // the position it reads (`stripImportedDefaults(<binding>)`).
  compareTo: stripImportedDefaults(SpecDashboardWidgetSchema).shape.compareTo
    .describe('Period-over-period comparison directive, forwarded verbatim from the dashboard widget key of the same name — bound BY REFERENCE to `DashboardWidgetSchema.shape.compareTo` so the producer and this consumer cannot drift into two dialects.'),
});

/**
 * ObjectGallery Schema (objectui#6576)
 *
 * Mirrors the `ObjectGallerySchema` interface in `objectql.ts` key for key;
 * every key has a read site in `plugin-list/src/ObjectGallery.tsx`. `gallery`,
 * `navigation` and `grouping` are the spec's own schemas by reference, which is
 * how the TS declaration types them.
 */
export const ObjectGallerySchema = BaseSchema.extend({
  type: z.literal('object-gallery'),
  objectName: z.string().optional().describe('ObjectQL object name'),
  filter: z.unknown().optional().describe('Query filter, forwarded verbatim as $filter'),
  data: z.array(z.record(z.string(), z.unknown())).optional().describe('Inline records'),
  gallery: stripImportedDefaults(SpecGalleryConfigSchema).optional().describe('Gallery configuration (@objectstack/spec GalleryConfig)'),
  navigation: stripImportedDefaults(SpecNavigationConfigSchema).optional().describe('Record navigation behaviour (drawer/dialog/page)'),
  grouping: stripImportedDefaults(SpecGroupingConfigSchema).optional().describe('Grouping configuration for sectioned display'),
  imageField: z.string().optional().describe('DEPRECATED — use gallery.coverField'),
  titleField: z.string().optional().describe('DEPRECATED — use gallery.titleField'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `object-gallery` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `bind`, `className`, `data`, `filter`, `gallery`, `grouping`, '
    + '`imageField`, `navigation`, `objectName`, `titleField`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `object-gallery` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `bind`, `className`, `data`, `filter`, `gallery`, `grouping`, '
    + '`imageField`, `navigation`, `objectName`, `titleField`.',
  ),
});

/**
 * ObjectDataTable Schema (objectui#6576 / objectui#6914)
 *
 * Mirrors the `ObjectDataTableSchema` interface in `objectql.ts`. One key
 * follows the parity ledger's discipline rather than the literal shape, and
 * one used to:
 *
 *   - `onRowClick` is a RUNTIME SLOT — a host-supplied function the widget
 *     forwards into `data-table` — so the mirror refuses it BY NAME
 *     (`handlerKeyRefusal`, the objectui#6124 shape) while the TS twin stays
 *     callable; `KnownDrift` in `zod-mirror-parity.test.ts` records the
 *     divergence.
 *   - `drillDown` is mirrored through `DrillDownConfigSchema`
 *     (`data-display.zod.ts`, objectui#7352). objectui#6576 declared the key
 *     and left it unmirrored — minting the mirror was a new export outside
 *     that ruling — so `UnmirroredDeclared` carried it, as it had carried
 *     `ChartSchema.drillDown` since objectui#6058; both entries left the
 *     ledger with that mirror.
 */
export const ObjectDataTableSchema = BaseSchema.extend({
  type: z.literal('object-data-table'),
  objectName: z.string().optional().describe('ObjectQL object name'),
  dataProvider: z.object({ provider: z.string(), object: z.string().optional() }).optional()
    .describe('Data-provider binding carried from the dashboard widget definition'),
  filter: z.any().optional().describe('Query filter, resolved through the filter scope and forwarded as $filter'),
  data: z.array(z.any()).optional().describe('Inline rows'),
  columns: z.array(z.any()).optional().describe('Column definitions (names or column objects)'),
  searchable: z.boolean().optional().describe('Forwarded to the rendered data-table'),
  pagination: z.boolean().optional().describe('Forwarded to the rendered data-table'),
  drillDown: DrillDownConfigSchema.optional().describe(
    'Drill-to-record: clicking a row opens that record in a detail drawer (DashboardRenderer defaults object-backed table widgets to { enabled: true, mode: record })',
  ),
  onRowClick: handlerKeyRefusal('onRowClick', 'runtime-slot', 'Row click handler (overrides drill-to-record)'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `object-data-table` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `bind`, `columns`, `data`, `drillDown`, `filter`, `objectName`, '
    + '`onRowClick`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `object-data-table` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `bind`, `columns`, `data`, `drillDown`, `filter`, `objectName`, '
    + '`onRowClick`.',
  ),
});

/**
 * ObjectQL Component Schema Union
 *
 * Same twelve members as the TS union in `../objectql.ts`, in the same order.
 * `ObjectGallerySchema` and `ObjectDataTableSchema` joined in objectui#7363:
 * PR #7355 (objectui#6576) minted both mirrors and deliberately did not extend
 * this union, so `AnyComponentSchema` — and `validateSchema` /
 * `safeValidateSchema` / `objectui validate` with it — had NO arm for an
 * `object-gallery` or `object-data-table` node. Such a document was refused as
 * matching no arm, exactly as before the mirrors existed, and a wrong-typed
 * declared key on it (`searchable: 'yes'`) could never be diagnosed by name.
 * Both nodes render (`plugin-list` registers `object-gallery`, `plugin-dashboard`
 * registers `object-data-table`); this is the validating face catching up with
 * the rendering one. The behaviour pin is `__tests__/objectql-union-arms-7363.test.ts`.
 *
 * `z.discriminatedUnion`, not `z.union` (objectui#8498) — see the same note on
 * `crud.zod.ts#CRUDComponentSchema` for both reasons. All twelve arms already
 * declared a distinct `type` literal, so ⛔ no document changes verdict; what
 * changes is that a refusal now carries ONE arm's diagnosis instead of twelve.
 */
export const ObjectQLComponentSchema = z.discriminatedUnion('type', [
  ObjectGridSchema,
  ObjectFormSchema,
  ObjectViewSchema,
  ObjectMapSchema,
  ObjectTreeSchema,
  ObjectGanttSchema,
  ObjectCalendarSchema,
  ObjectKanbanSchema,
  ObjectChartSchema,
  ObjectGallerySchema,
  ObjectDataTableSchema,
  ListViewSchema,
]);
