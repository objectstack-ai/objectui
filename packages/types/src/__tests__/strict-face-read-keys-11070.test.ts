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
 *     itself (`multiple`, `rows`, `accept`, `dimensions`, `min`, `max`,
 *     `minLength`, `maxLength`, `pattern`), which the renderer hands each field
 *     widget as its metadata carrier;
 *   - `dataSource` on `object-grid`, `list-view`, `object-form` and
 *     `object-kanban` — the spec's per-element binding, which the registered
 *     renderers read off the node through `ElementDataSourceGate`.
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
 *      on the strict face — each waits on a ruling the card records;
 *   4. the TypeScript faces type the binding, not `any` (type-level, read by
 *      `tsc -p tsconfig.test.json` only — vitest does not typecheck).
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ListViewSchema, ObjectFormSchema, ObjectGridSchema, ObjectKanbanSchema } from '../objectql.js';
import type { FormField, FormSchema } from '../form.js';
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
    ['min', { type: 'number', min: 0 }],
    ['max', { type: 'number', max: 120 }],
    ['minLength', { type: 'input', minLength: 3 }],
    ['maxLength', { type: 'input', maxLength: 20 }],
    ['pattern', { type: 'input', pattern: '^[^@]+@[^@]+$' }],
  ];

  it.each(FIELD_CASES)('`fields[].%s` parses; a misspelled sibling is refused at the field', (key, field) => {
    expect(issuesOf(StrictAnyComponentSchema, form(field))).toBeNull();
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form({ ...field, [`${key}x`]: 1 }))))
      .toEqual([`fields.0.${key}x`]);
  });

  const BINDING = { object: 'task', filter: { project: 'acme' } };
  const BOUND_NODES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['object-grid', { objectName: 'task' }],
    ['list-view', { objectName: 'task' }],
    ['object-form', { objectName: 'task', mode: 'edit' }],
    // `objectName` on every node, deliberately: whether a binding's `object`
    // may stand in for the node's own required record source (as the spec's
    // props gate lets it on `element:number`) is a separate question from
    // whether the key is declared, and this block measures only the second.
    ['object-kanban', { objectName: 'task' }],
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
  // Each is read by a widget, and each waits on a question objectui#11070
  // records rather than a declaration: a snake_case second spelling of a spec
  // key (`return_type` / `returnType`, `summary_type` / `summaryOperations`,
  // `reference_to` / `reference`, `min_length` / `minLength`), or an element
  // shape not yet decided (the grid field's `columns`). ⛔ Declaring one is a
  // contract ruling, not a fix to this list.
  const PENDING: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['return_type', { type: 'formula', return_type: 'number' }],
    ['summary_type', { type: 'summary', summary_type: 'sum' }],
    ['reference_to', { type: 'lookup', reference_to: 'users' }],
    ['min_length', { type: 'password', min_length: 8 }],
    ['columns', { type: 'grid', columns: [{ name: 'qty', type: 'number' }] }],
  ];

  it.each(PENDING)('`fields[].%s` is refused by name, and the tolerant face still accepts the document', (key, field) => {
    expect(undeclared(issuesOf(StrictAnyComponentSchema, form(field)))).toEqual([`fields.0.${key}`]);
    expect(issuesOf(AnyComponentSchema, form(field))).toBeNull();
  });
});

/* ── 4. type level: the TypeScript faces declare the same members ────────── */

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

/** Each declared member is a named, typed member — not the index signature's `any`. */
export type assertionFormFieldMembersAreTyped = Expect<Equal<
  IsAny<FormField['multiple'] | FormField['rows'] | FormField['accept'] | FormField['dimensions']
    | FormField['min'] | FormField['max'] | FormField['minLength'] | FormField['maxLength'] | FormField['pattern']>,
  false
>>;
export type assertionShowSubmitIsBoolean = Expect<Equal<FormSchema['showSubmit'], boolean | undefined>>;
export type assertionBindingIsTyped = Expect<Equal<
  IsAny<ObjectGridSchema['dataSource'] | ObjectFormSchema['dataSource'] | ObjectKanbanSchema['dataSource'] | ListViewSchema['dataSource']>,
  false
>>;

// @ts-expect-error — an adapter is not a binding: the binding names an `object`.
export const adapterIsNotABinding: ObjectGridSchema['dataSource'] = { find: () => [] };
export const bindingOnListView: ListViewSchema['dataSource'] = { object: 'task', view: 'open', limit: 20 };
