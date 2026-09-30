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
 *     `max`, `minLength`, `maxLength`, `pattern`, and since round 3
 *     `returnType` and `summaryOperations`), which the renderer hands each
 *     field widget as its metadata carrier;
 *   - `dataSource` on `object-grid`, `object-form`, `object-kanban`,
 *     `list-view`, `object-gantt`, `object-map` and `object-calendar` — the
 *     spec's per-element binding, which each block's
 *     gate-wrapped registration reads off the node through
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
 *   3. the read keys this card deliberately did NOT declare are still refused
 *      on the strict face — each waits on a ruling the card records — and the
 *      snake_case spellings round 3 retired are refused by name;
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
  ObjectFormSchema,
  ObjectGanttSchema,
  ObjectGridSchema,
  ObjectKanbanSchema,
  ObjectMapSchema,
} from '../objectql.js';
import type { FormField, FormSchema } from '../form.js';
import type { FormulaFieldMetadata, PasswordFieldMetadata, SummaryFieldMetadata } from '../field-types.js';
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
  ];

  it.each(FIELD_CASES)('`fields[].%s` parses; a misspelled sibling is refused at the field', (key, field) => {
    expect(issuesOf(StrictAnyComponentSchema, form(field))).toBeNull();
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form({ ...field, [`${key}x`]: 1 }))))
      .toEqual([`fields.0.${key}x`]);
  });

  const BINDING = { object: 'task', filter: [{ field: 'project', operator: 'equals', value: 'acme' }] };
  const BOUND_NODES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['object-grid', { objectName: 'task' }],
    ['object-form', { objectName: 'task', mode: 'edit' }],
    // `objectName` on every node, deliberately: whether a binding's `object`
    // may stand in for the node's own required record source (as the spec's
    // props gate lets it on `element:number`) is a separate question from
    // whether the key is declared, and this block measures only the second.
    ['object-kanban', { objectName: 'task' }],
    ['list-view', { objectName: 'task' }],
    ['object-gantt', { objectName: 'task' }],
    ['object-map', { objectName: 'task' }],
    ['object-calendar', { objectName: 'task' }],
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
    ['an adapter-shaped `dataSource`', { type: 'object-grid', objectName: 'task', dataSource: 'objectstack' }],
  ];

  it.each(WRONG)('refuses %s', (_label, doc) => {
    expect(issuesOf(AnyComponentSchema, doc)).not.toBeNull();
    expect(issuesOf(StrictAnyComponentSchema, doc)).not.toBeNull();
  });
});

/* ── 3. the read keys this card did NOT declare stay refused ─────────────── */

describe('objectui#11070 — the read keys left undeclared pending a ruling stay refused on the strict face', () => {
  // Each is read by a widget and none is declared. Two are the snake_case
  // second spelling of a spec key this card DID declare (`reference_to` /
  // `reference`, `min_length` / `minLength`): the seat's answer on
  // objectui#11070 keeps the legacy spelling refused, so an author writes the
  // spec's. `reference_to` is still WRITTEN by in-repo producers that feed the
  // lookup readers, so its reads stay until that is ruled. The grid field's
  // `columns` has an element shape not yet decided. ⛔ Declaring one is a
  // contract ruling, not a fix to this list.
  const PENDING: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['reference_to', { type: 'lookup', reference_to: 'users' }],
    ['min_length', { type: 'password', min_length: 8 }],
    ['columns', { type: 'grid', columns: [{ name: 'qty', type: 'number' }] }],
  ];

  it.each(PENDING)('`fields[].%s` is refused by name, and the tolerant face still accepts the document', (key, field) => {
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form(field)))).toEqual([`fields.0.${key}`]);
    expect(issuesOf(AnyComponentSchema, form(field))).toBeNull();
  });

  // Round 3 (the seat's answer A): the `formula` and `summary` widgets read the
  // spec's `returnType` and `summaryOperations` only, so these snake_case
  // spellings are read by nothing and retired at once — no alias, no dual
  // read. The strict face refuses each by name, as before; what changed is
  // that the spec spelling beside it is now declared (block 1).
  const RETIRED: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['return_type', { type: 'formula', return_type: 'number' }],
    ['summary_type', { type: 'summary', summary_type: 'sum' }],
    ['summary_object', { type: 'summary', summary_object: 'orders' }],
    ['summary_field', { type: 'summary', summary_field: 'amount' }],
  ];

  it.each(RETIRED)('the retired `fields[].%s` is refused by name', (key, field) => {
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form(field)))).toEqual([`fields.0.${key}`]);
  });

  it('`object-chart.dataSource` is refused by name until it is declared (the react-page wrapper no longer puns the adapter into that key; the declaration and the objectui#10770 node pin move together)', () => {
    const doc = { type: 'object-chart', objectName: 'task', chartType: 'bar', dataSource: { object: 'task' } };
    expect(undeclared(issuesOf(StrictAnyComponentSchema, doc))).toEqual(['dataSource']);
    expect(issuesOf(AnyComponentSchema, doc)).toBeNull();
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
    | FormField['returnType'] | FormField['summaryOperations']>,
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
];
/** Round 3: the retired snake_case members are gone from the field metadata types — no second spelling. */
type Retired = 'return_type' | 'summary_type' | 'summary_object' | 'summary_field' | 'summary_filter' | 'min_length' | 'max_length';
export type assertionRetiredMembersAreGone = [
  Expect<Equal<Extract<keyof FormulaFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof SummaryFieldMetadata, Retired>, never>>,
  Expect<Equal<Extract<keyof PasswordFieldMetadata, Retired>, never>>,
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
];

// @ts-expect-error — an adapter is not a binding: the binding names an `object`.
export const adapterIsNotABinding: ObjectGridSchema['dataSource'] = { find: () => [] };
export const bindingOnKanban: ObjectKanbanSchema['dataSource'] = { object: 'task', view: 'open', limit: 20 };
export const bindingOnListView: ListViewSchema['dataSource'] = { object: 'task', view: 'open', limit: 20 };
