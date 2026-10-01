/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Keys a registered renderer READS are declared on both faces, so the strict
 * authoring face stops refusing them (objectui#11070).
 *
 * ## The defect
 *
 * `StrictAnyComponentSchema` (objectui#8345) closes every object, so a key no
 * schema declares is refused by name. PR objectui#11069's measurement of the
 * shipped face over the repository's own documents found keys refused that way
 * while a registered renderer reads them — `objectui validate` on the strict
 * face would tell an author to delete a key that works. This card declares the
 * ones whose read, spelling and value shape are settled:
 *
 *   - `form.showSubmit` — the `form` renderer's submit-button switch;
 *   - `form.fields[]` — field metadata a hand-authored form writes on the entry
 *     itself (`multiple`, `rows`, `accept`, `dimensions`, `reference`, `min`,
 *     `max`, `minLength`, `maxLength`, `pattern`, since round 3
 *     `returnType` and `summaryOperations`, since round 7 the `grid`
 *     widget's `columns`, the spec's `inlineColumns` list, and since round 10
 *     the `grid` widget's eight field-level keys, `GridFieldMetadata`'s own
 *     members), which the renderer hands each field widget as its metadata
 *     carrier;
 *   - `dataSource` on `object-grid`, `object-form`, `object-kanban`,
 *     `list-view`, `object-gantt`, `object-map`, `object-calendar` and, since
 *     round 7, `object-chart` — the spec's per-element binding, which each
 *     block's gate-wrapped registration reads off the node through
 *     `ElementDataSourceGate`.
 *
 * Each read is reasoned on the TypeScript member that declares it.
 *
 * ## What each block below holds
 *
 *   1. a document carrying the key parses on the strict face, and a misspelled
 *      sibling is still refused BY NAME at the same path — the control that
 *      shows the face did not open up;
 *   2. the declared key is judged by its declared type on BOTH faces;
 *   3. the snake_case spellings rounds 3, 4 and 5 retired, and the inline
 *      dashboard dialect round 6 retired (objectui#11228 ruling C), are
 *      refused by name on the strict face;
 *   4. the TypeScript faces type the binding, not `any`, and the field
 *      metadata types carry the spec members by reference with the retired
 *      snake_case members gone (type-level, read by
 *      `tsc -p tsconfig.test.json` only — vitest does not typecheck).
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type {
  ListViewSchema,
  ObjectCalendarSchema,
  ObjectChartSchema,
  ObjectFormSchema,
  ObjectGanttSchema,
  ObjectGridSchema,
  ObjectKanbanSchema,
  ObjectMapSchema,
} from '../objectql.js';
import type { FormField, FormSchema } from '../form.js';
import type {
  BaseFieldMetadata,
  EmailFieldMetadata,
  FormulaFieldMetadata,
  GridFieldMetadata,
  HtmlFieldMetadata,
  LookupFieldMetadata,
  MarkdownFieldMetadata,
  MasterDetailFieldMetadata,
  PasswordFieldMetadata,
  RichtextFieldMetadata,
  SummaryFieldMetadata,
  TextFieldMetadata,
  TextareaFieldMetadata,
  UrlFieldMetadata,
} from '../field-types.js';
import type { DetailViewField } from '../views.js';
import { DetailViewFieldSchema } from '../zod/views.zod.js';
import type { ElementDataSource as SpecElementDataSource } from '@objectstack/spec/ui';
import type { Field as SpecField } from '@objectstack/spec/data';
import { AnyComponentSchema, StrictAnyComponentSchema } from '../zod/index.zod.js';

type Issue = { code: string; path: PropertyKey[]; keys?: string[]; errors?: Issue[][] };

const issuesOf = (schema: z.ZodType, doc: unknown): Issue[] | null => {
  const result = schema.safeParse(doc);
  return result.success ? null : (result.error.issues as unknown as Issue[]);
};

/** Every `unrecognized_keys` finding in the issue tree, union arms included, as `path.key`. */
const undeclared = (issues: Issue[] | null, prefix: PropertyKey[] = []): string[] => {
  const out: string[] = [];
  for (const issue of issues ?? []) {
    const at = [...prefix, ...issue.path];
    if (issue.code === 'unrecognized_keys') for (const k of issue.keys ?? []) out.push([...at, k].map(String).join('.'));
    for (const arm of issue.errors ?? []) out.push(...undeclared(arm, at));
  }
  return [...new Set(out)];
};

const form = (field: Record<string, unknown>, node: Record<string, unknown> = {}) => ({
  type: 'form',
  ...node,
  fields: [{ name: 'f', label: 'F', ...field }],
});

/** A `grid` entry the way the `fields-grid` catalog fixtures write one. */
const GRID_ENTRY = {
  type: 'grid',
  columns: [{ name: 'product', type: 'text' }, { name: 'amount', type: 'currency' }],
};

/**
 * Round 10: the `grid` widget's field-level keys — every member
 * `GridFieldMetadata` declares besides `columns` (round 7) and the base field
 * keys — each with a value of its declared type, on a grid entry.
 */
const GRID_FIELD_KEYS = {
  min_rows: 1,
  max_rows: 20,
  allow_add: false,
  allow_delete: false,
  allow_reorder: false,
  total_field: 'amount',
  add_label: 'Add line',
  sort_field: 'position',
} as const;

const GRID_FIELD_KEY_CASES: ReadonlyArray<readonly [string, Record<string, unknown>]> = Object.entries(GRID_FIELD_KEYS)
  .map(([key, value]) => [key, { ...GRID_ENTRY, [key]: value }] as const);

/* ── 1. accepted on the strict face; a misspelling beside it is not ─────── */

describe('objectui#11070 — the declared read keys parse on the strict face', () => {
  it('`form.showSubmit` parses; `showSubmitt` beside it is refused by name', () => {
    expect(issuesOf(StrictAnyComponentSchema, form({ type: 'text' }, { showSubmit: false }))).toBeNull();
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form({ type: 'text' }, { showSubmit: false, showSubmitt: true }))))
      .toEqual(['showSubmitt']);
  });

  const FIELD_CASES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['multiple', { type: 'file', multiple: true }],
    ['rows', { type: 'textarea', rows: 6 }],
    ['accept', { type: 'file', accept: ['application/pdf'] }],
    ['dimensions', { type: 'vector', dimensions: 768 }],
    ['reference', { type: 'lookup', reference: 'users' }],
    ['min', { type: 'number', min: 0 }],
    ['max', { type: 'number', max: 120 }],
    ['minLength', { type: 'input', minLength: 3 }],
    ['maxLength', { type: 'input', maxLength: 20 }],
    ['pattern', { type: 'input', pattern: '^[^@]+@[^@]+$' }],
    ['returnType', { type: 'formula', returnType: 'number' }],
    ['summaryOperations', { type: 'summary', summaryOperations: { object: 'orders', field: 'amount', function: 'sum' } }],
    // Round 7: the `grid` widget's columns, the spec's `inlineColumns` list.
    ['columns', { type: 'grid', columns: [{ name: 'qty', type: 'number' }, { name: 'sku' }] }],
    // Round 10: the `grid` widget's field-level keys, `GridFieldMetadata`'s
    // members, each on a grid entry. Every row was refused by name at the
    // round's base (`fields.0.<key>`), so each one is a refusal that flipped.
    ...GRID_FIELD_KEY_CASES,
  ];

  it.each(FIELD_CASES)('`fields[].%s` parses; a misspelled sibling is refused at the field', (key, field) => {
    expect(issuesOf(StrictAnyComponentSchema, form(field))).toBeNull();
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form({ ...field, [`${key}x`]: 1 }))))
      .toEqual([`fields.0.${key}x`]);
  });

  it('a grid entry carrying all eight field-level keys at once parses on the strict face (round 10)', () => {
    expect(issuesOf(StrictAnyComponentSchema, form({ ...GRID_ENTRY, ...GRID_FIELD_KEYS }))).toBeNull();
    // The parsed entry KEEPS each value: the tolerant face used to strip them.
    const parsed = AnyComponentSchema.safeParse(form({ ...GRID_ENTRY, ...GRID_FIELD_KEYS }));
    expect(parsed.success).toBe(true);
    expect(parsed.success && (parsed.data as { fields: Record<string, unknown>[] }).fields[0])
      .toMatchObject(GRID_FIELD_KEYS);
  });

  const BINDING = { object: 'task', filter: [{ field: 'project', operator: 'equals', value: 'acme' }] };
  const BOUND_NODES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    // objectui#11276 (the `object-grid` batch): an authored `object-grid` takes
    // its props in the spec's `properties` bag; the binding stays on the node.
    ['object-grid', { properties: { objectName: 'task' } }],
    // objectui#10859 batch 4: an authored `object-form` takes its props in the
    // spec's `properties` bag; the flat spelling is refused by name.
    ['object-form', { properties: { objectName: 'task', mode: 'edit' } }],
    // `objectName` on every node, deliberately: whether a binding's `object`
    // may stand in for the node's own required record source (as the spec's
    // props gate lets it on `element:number`) is a separate question from
    // whether the key is declared, and this block measures only the second.
    ['object-kanban', { objectName: 'task' }],
    ['list-view', { objectName: 'task' }],
    // objectui#10859 batch 6: `object-gantt` takes its props in the bag too.
    ['object-gantt', { properties: { objectName: 'task' } }],
    // objectui#10859 batch 5: `object-map` takes its props in the bag too.
    ['object-map', { properties: { objectName: 'task' } }],
    ['object-calendar', { objectName: 'task' }],
    // Round 7: `object-chart`, authored with its props in the bag
    // (objectui#11276); the binding stays on the node.
    ['object-chart', { properties: { objectName: 'task', chartType: 'bar' } }],
  ];

  it.each(BOUND_NODES)('`%s.dataSource` parses; `dataSourc` beside it is refused by name', (type, rest) => {
    expect(issuesOf(StrictAnyComponentSchema, { type, ...rest, dataSource: BINDING })).toBeNull();
    expect(undeclared(issuesOf(StrictAnyComponentSchema, { type, ...rest, dataSource: BINDING, dataSourc: BINDING })))
      .toEqual(['dataSourc']);
  });
});

/* ── 2. judged by the declared type, on both faces ───────────────────────── */

describe('objectui#11070 — a declared key is judged by its declared type on both faces', () => {
  const WRONG: ReadonlyArray<readonly [string, unknown]> = [
    ['a string `showSubmit`', form({ type: 'text' }, { showSubmit: 'false' })],
    ['a bare-string `accept` (the spec types it as an array)', form({ type: 'file', accept: 'application/pdf' })],
    ['a zero `rows` (the spec requires a positive integer)', form({ type: 'textarea', rows: 0 })],
    ['a numeric `pattern`', form({ type: 'input', pattern: 5 })],
    ['a `returnType` the spec does not list (`datetime`)', form({ type: 'formula', returnType: 'datetime' })],
    ['a `summaryOperations` with no `function`', form({ type: 'summary', summaryOperations: { object: 'orders', field: 'amount' } })],
    ['a `summaryOperations.function` the spec does not list (`first`)', form({ type: 'summary', summaryOperations: { object: 'orders', field: 'amount', function: 'first' } })],
    ['an unknown member inside `summaryOperations` (the spec closes it)', form({ type: 'summary', summaryOperations: { object: 'orders', field: 'amount', function: 'sum', functon: 'avg' } })],
    ['a binding that names no `object`', { type: 'object-kanban', dataSource: { filter: { a: 1 } } }],
    // The grid's own props in the bag (objectui#11276), so `dataSource` is the one key judged here.
    ['an adapter-shaped `dataSource`', { type: 'object-grid', properties: { objectName: 'task' }, dataSource: 'objectstack' }],
    // Round 7: the grid's columns are the spec's strict inline grid column.
    ['a grid column keyed by the retired `field` spelling', form({ type: 'grid', columns: [{ field: 'qty' }] })],
    ['a grid column `type` outside the spec\'s nine cell controls (`boolean`)', form({ type: 'grid', columns: [{ name: 'done', type: 'boolean' }] })],
    ['a grid column `defaultValue` (the spec column declares none, and the grid reads none)', form({ type: 'grid', columns: [{ name: 'qty', defaultValue: 1 }] })],
    ['a `scale` on a column declaring `type: \'currency\'` (the spec refuses it there)', form({ type: 'grid', columns: [{ name: 'amount', type: 'currency', scale: 2 }] })],
    ['a bare-object `columns` (the spec types it as an array)', form({ type: 'grid', columns: { name: 'qty' } })],
    // Round 10: each grid field-level key is judged by `GridFieldMetadata`'s
    // type. At the round's base the tolerant face STRIPPED every one of these
    // and accepted the document, so each row is red there.
    ['a string `min_rows`', form({ ...GRID_ENTRY, min_rows: '1' })],
    ['a string `max_rows`', form({ ...GRID_ENTRY, max_rows: '20' })],
    ['a string `allow_add`', form({ ...GRID_ENTRY, allow_add: 'false' })],
    ['a string `allow_delete`', form({ ...GRID_ENTRY, allow_delete: 'false' })],
    ['a string `allow_reorder`', form({ ...GRID_ENTRY, allow_reorder: 'false' })],
    ['a numeric `total_field`', form({ ...GRID_ENTRY, total_field: 3 })],
    ['a numeric `add_label`', form({ ...GRID_ENTRY, add_label: 1 })],
    ['a numeric `sort_field`', form({ ...GRID_ENTRY, sort_field: 0 })],
    ['a `null` `object-chart` binding (the adapter placeholder the wrapper no longer writes)', { type: 'object-chart', properties: { objectName: 'task', chartType: 'bar' }, dataSource: null }],
    ['an adapter-shaped `object-chart` binding', { type: 'object-chart', properties: { objectName: 'task', chartType: 'bar' }, dataSource: 'objectstack' }],
  ];

  it.each(WRONG)('refuses %s', (_label, doc) => {
    expect(issuesOf(AnyComponentSchema, doc)).not.toBeNull();
    expect(issuesOf(StrictAnyComponentSchema, doc)).not.toBeNull();
  });
});

/* ── 3. the retired spellings stay refused ──────────────────────────────── */

describe('objectui#11070 — the retired spellings stay refused on the strict face', () => {
  // Round 7 emptied the PENDING list this block opened with: the grid field's
  // `columns` (the last read key left undeclared) is the spec's
  // `inlineColumns` list now (block 1), and `object-chart.dataSource` is
  // declared with the other gate-wrapped bindings.
  //
  // Round 3 (the seat's answer A): the `formula` and `summary` widgets read the
  // spec's `returnType` and `summaryOperations` only, so these snake_case
  // spellings are read by nothing and retired at once — no alias, no dual
  // read. The strict face refuses each by name, as before; what changed is
  // that the spec spelling beside it is now declared (block 1).
  //
  // Round 4 (the seat's answer A to Q1, under the objectui#6837 ruling): the
  // `lookup` and `user` widgets and both read cells read the spec's
  // `reference` only, and no in-repo producer writes `reference_to` any more,
  // so it joins this list rather than waiting on one.
  //
  // Round 5 (the text-family round): every length reader — the form
  // renderer's built-in branches, the `textarea` and rich-text widgets, the
  // validation rules and both form producers — reads the spec's `minLength` /
  // `maxLength` only, so the snake_case pair is read by nothing and joins
  // this list.
  const RETIRED: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['min_length', { type: 'password', min_length: 8 }],
    ['max_length', { type: 'textarea', max_length: 200 }],
    ['reference_to', { type: 'lookup', reference_to: 'users' }],
    ['return_type', { type: 'formula', return_type: 'number' }],
    ['summary_type', { type: 'summary', summary_type: 'sum' }],
    ['summary_object', { type: 'summary', summary_object: 'orders' }],
    ['summary_field', { type: 'summary', summary_field: 'amount' }],
  ];

  it.each(RETIRED)('the retired `fields[].%s` is refused by name', (key, field) => {
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form(field)))).toEqual([`fields.0.${key}`]);
  });

  it('the authored detail-view field declares `reference`, and `reference_to` is not in its mirror (round 4)', () => {
    const keys = Object.keys(DetailViewFieldSchema.shape);
    expect(keys).toContain('reference');
    expect(keys).not.toContain('reference_to');
  });

  // Round 6 (objectui#11228 ruling C): the inline dashboard dialect is RETIRED,
  // not declared. A widget binds a `dataset` and never carries rows, so these
  // nine keys stay refused by name, and the catalog and docs no longer write
  // them. ⛔ Declaring one reopens that ruling; it is not a fix to this list.
  const DASHBOARD_DIALECT: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['options.data', { options: { data: [{ status: 'Paid', count: 47 }] } }],
    ['options.xField', { options: { xField: 'status' } }],
    ['options.yField', { options: { yField: 'count' } }],
    ['options.value', { options: { value: '1,284' } }],
    ['options.description', { options: { description: 'Monthly revenue' } }],
    ['options.trend', { options: { trend: { value: 12, direction: 'up' } } }],
    ['component.chartType', { component: { type: 'chart', chartType: 'area' } }],
    ['component.xAxisKey', { component: { type: 'chart', xAxisKey: 'day' } }],
    ['component.series', { component: { type: 'chart', series: [{ name: 'Sales' }] } }],
  ];
  const datasetWidget = { id: 'w', type: 'bar', dataset: 'invoices', dimensions: ['status'], values: ['count'] };

  it('a dataset-bound widget parses on the strict face (the control for the dialect rows below)', () => {
    expect(issuesOf(StrictAnyComponentSchema, { type: 'dashboard', widgets: [datasetWidget] })).toBeNull();
  });

  it.each(DASHBOARD_DIALECT)('the inline dashboard dialect `widgets[].%s` is refused by name (objectui#11228 ruling C)', (key, extra) => {
    const doc = { type: 'dashboard', widgets: [{ ...datasetWidget, ...extra }] };
    expect(undeclared(issuesOf(StrictAnyComponentSchema, doc))).toContain(`widgets.0.${key}`);
  });

  it('`object-chart.dataSource` stays on the NODE: in the bag it is refused by name, not taken for the binding (round 7)', () => {
    // The binding is a node-level key of the spec's `PageComponentSchema`, so
    // the bag (the flat mirror's own members) does not carry it.
    const doc = { type: 'object-chart', properties: { objectName: 'task', chartType: 'bar', dataSource: { object: 'task' } } };
    expect(undeclared(issuesOf(StrictAnyComponentSchema, doc))).toEqual(['properties.dataSource']);
  });
});

/* ── 4. type level: the TypeScript faces declare the same members ────────── */

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

/** Each declared member is a named, typed member — not the index signature's `any`. */
export type assertionFormFieldMembersAreTyped = Expect<Equal<
  IsAny<FormField['multiple'] | FormField['rows'] | FormField['accept'] | FormField['dimensions']
    | FormField['reference'] | FormField['min'] | FormField['max'] | FormField['minLength'] | FormField['maxLength'] | FormField['pattern']
    | FormField['returnType'] | FormField['summaryOperations'] | FormField['columns']>,
  false
>>;
/**
 * Round 3: the spec members are carried BY REFERENCE, on the form-field face
 * and on the field metadata types — an exact match, so a hand-restated copy
 * (or a drift after a spec release) fails here.
 */
export type assertionSpecMembersByReference = [
  Expect<Equal<FormField['returnType'], SpecField['returnType']>>,
  Expect<Equal<FormField['summaryOperations'], SpecField['summaryOperations']>>,
  Expect<Equal<FormulaFieldMetadata['returnType'], SpecField['returnType']>>,
  Expect<Equal<SummaryFieldMetadata['summaryOperations'], SpecField['summaryOperations']>>,
  Expect<Equal<PasswordFieldMetadata['minLength'], SpecField['minLength']>>,
  Expect<Equal<PasswordFieldMetadata['maxLength'], SpecField['maxLength']>>,
  // Round 6: the formula itself is the spec's `expression`, by reference.
  Expect<Equal<FormulaFieldMetadata['expression'], SpecField['expression']>>,
];
/**
 * Round 7: the grid's columns are the spec's `inlineColumns` list BY
 * REFERENCE, on the form-field face and on the grid field metadata type — an
 * exact match, so a restated column shape (or a drift after a spec release)
 * fails here.
 */
export type assertionGridColumnsBySpecReference = [
  Expect<Equal<FormField['columns'], SpecField['inlineColumns']>>,
  Expect<Equal<GridFieldMetadata['columns'], SpecField['inlineColumns']>>,
];
/**
 * Round 10: the form-field face carries the `grid` widget's field-level keys
 * BY REFERENCE to `GridFieldMetadata` — an exact match per key, so a restated
 * value type fails here — and misses none of them: every member
 * `GridFieldMetadata` declares beyond `BaseFieldMetadata` is a DECLARED member
 * of `FormField` (not the index signature) with the same type. A key added to
 * the grid's type and not mirrored on the form-field face fails to compile
 * here; the zod side then follows through the `UnmirroredDeclared` ratchet in
 * `zod-mirror-parity.test.ts` and the key set in `form-field-zod-coverage`.
 */
type DeclaredKeysOf<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] };
type GridFieldOwnKeys = Exclude<keyof GridFieldMetadata, keyof BaseFieldMetadata>;
export type assertionGridFieldKeysOnTheFormFieldFace = [
  // LIT CONTROL: the key set the two rows below range over is not empty, and
  // it holds no base field key (an empty set would pass both in silence).
  Expect<Equal<Extract<GridFieldOwnKeys, 'columns' | 'sort_field' | 'name'>, 'columns' | 'sort_field'>>,
  Expect<Equal<Exclude<GridFieldOwnKeys, DeclaredKeysOf<FormField>>, never>>,
  Expect<Equal<{ [K in GridFieldOwnKeys]: FormField[K] }, { [K in GridFieldOwnKeys]: GridFieldMetadata[K] }>>,
  Expect<Equal<FormField['min_rows'], GridFieldMetadata['min_rows']>>,
  Expect<Equal<FormField['max_rows'], GridFieldMetadata['max_rows']>>,
  Expect<Equal<FormField['allow_add'], GridFieldMetadata['allow_add']>>,
  Expect<Equal<FormField['allow_delete'], GridFieldMetadata['allow_delete']>>,
  Expect<Equal<FormField['allow_reorder'], GridFieldMetadata['allow_reorder']>>,
  Expect<Equal<FormField['total_field'], GridFieldMetadata['total_field']>>,
  Expect<Equal<FormField['add_label'], GridFieldMetadata['add_label']>>,
  Expect<Equal<FormField['sort_field'], GridFieldMetadata['sort_field']>>,
];

// @ts-expect-error objectui#11070 round 7 — `GridColumnDefinition` is RETIRED from `../field-types`: a grid column is the spec's `InlineGridColumn` (`GridFieldMetadata['columns']`).
type _GridColumnDefinitionRetiredFromTheModule = import('../field-types').GridColumnDefinition;
// @ts-expect-error objectui#11070 round 7 — and RETIRED from the package entry, the face an external consumer imports.
type _GridColumnDefinitionRetiredFromTheEntry = import('../index').GridColumnDefinition;
/** LIT CONTROLS for the two directives above: a sibling of the same export block resolves through the same forms. */
type _GridSiblingResolvesFromTheModule = import('../field-types').GridFieldMetadata;
type _GridSiblingResolvesFromTheEntry = import('../index').GridFieldMetadata;
export type assertionGridSiblingControlsResolve = [
  Expect<Equal<_GridSiblingResolvesFromTheModule['type'], 'grid'>>,
  Expect<Equal<_GridSiblingResolvesFromTheEntry['type'], 'grid'>>,
];
/**
 * Round 5: the text family carries the spec's length members BY REFERENCE —
 * an exact match on every type that declares one.
 */
export type assertionTextFamilyLengthByReference = [
  Expect<Equal<TextFieldMetadata['minLength'], SpecField['minLength']>>,
  Expect<Equal<TextFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<TextareaFieldMetadata['minLength'], SpecField['minLength']>>,
  Expect<Equal<TextareaFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<MarkdownFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<HtmlFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<RichtextFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<EmailFieldMetadata['maxLength'], SpecField['maxLength']>>,
  Expect<Equal<UrlFieldMetadata['maxLength'], SpecField['maxLength']>>,
];
/**
 * Rounds 3 and 5: the retired snake_case members are gone from the field
 * metadata types — no second spelling — and so are the two switches round 5
 * retired under ADR-0049 because nothing read them (`auto_compute`,
 * `auto_update`). Round 6: so is `formula`, which `FieldSchema` refuses by
 * name in favour of `expression` (above).
 */
type Retired =
  | 'return_type' | 'summary_type' | 'summary_object' | 'summary_field' | 'summary_filter'
  | 'min_length' | 'max_length' | 'auto_compute' | 'auto_update' | 'formula';
export type assertionRetiredMembersAreGone = [
  Expect<Equal<Extract<keyof FormulaFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof SummaryFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof PasswordFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof TextFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof TextareaFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof MarkdownFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof HtmlFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof RichtextFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof EmailFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof UrlFieldMetadata, Retired>, never>>,
];
/**
 * Round 4: the relational target is the spec's `reference`, carried BY
 * REFERENCE on both field metadata types, and `reference_to` is gone from
 * them and from the authored detail-view field — one spelling, no second.
 */
export type assertionReferenceIsTheOnlyTargetSpelling = [
  Expect<Equal<LookupFieldMetadata['reference'], SpecField['reference']>>,
  Expect<Equal<MasterDetailFieldMetadata['reference'], SpecField['reference']>>,
  Expect<Equal<DetailViewField['reference'], string | undefined>>,
  Expect<Equal<Extract<keyof LookupFieldMetadata, 'reference_to'>, never>>,
  Expect<Equal<Extract<keyof MasterDetailFieldMetadata, 'reference_to'>, never>>,
  Expect<Equal<Extract<keyof DetailViewField, 'reference_to'>, never>>,
];
export type assertionShowSubmitIsBoolean = Expect<Equal<FormSchema['showSubmit'], boolean | undefined>>;
/**
 * Each binding member IS the spec's `ElementDataSource` — an exact match, not a
 * mere "not `any`": `ListViewSchema` is derived from its zod mirror, and a member
 * that left the mirror resolves to the index signature's `unknown` there, which
 * an `IsAny` check would wave through.
 */
type BindingOf<T extends { dataSource?: unknown }> = NonNullable<T['dataSource']>;
export type assertionBindingIsTheSpecBinding = [
  Expect<Equal<BindingOf<ObjectGridSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectFormSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectKanbanSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ListViewSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectGanttSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectMapSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectCalendarSchema>, SpecElementDataSource>>,
  Expect<Equal<BindingOf<ObjectChartSchema>, SpecElementDataSource>>,
];

// @ts-expect-error — an adapter is not a binding: the binding names an `object`.
export const adapterIsNotABinding: ObjectGridSchema['dataSource'] = { find: () => [] };
export const bindingOnKanban: ObjectKanbanSchema['dataSource'] = { object: 'task', view: 'open', limit: 20 };
export const bindingOnListView: ListViewSchema['dataSource'] = { object: 'task', view: 'open', limit: 20 };
