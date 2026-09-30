/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#9963 — `RecordRelatedListRendererProps` refuses a misspelled key
 * again, at every read in the renderer, while keeping the ONE looseness its
 * docblock exists to defend.
 *
 * ## The defect
 *
 * The renderer's own `schema` member was the mirror interface INTERSECTED WITH
 * `Record<string, any>`, and the props interface carried `[k: string]: any` as
 * well. An index signature admits any key at `any`, so a misspelled declared
 * key — `schema.relationshipValueFeild` — type-checked at every read, cast or
 * not. objectui#9475 removed a cast and recorded, as a ledger leg, that this
 * was the limit of that repair; this file is where that ledger landed.
 *
 * ## The looseness that stays, and why it is named rather than open
 *
 * The props type is deliberately LOOSER than the mirror in exactly two places,
 * both from objectstack#6953 (the authoring shape
 * `{ relationshipField, dataSource: { object, view } }`):
 *
 *   - `objectName` is optional — the `ElementDataSourceGate` wrapper binds it
 *     from `dataSource.object` before the body reads it;
 *   - `dataSource` is admitted — it is the binding the gate reads.
 *
 * Both are now DECLARED members. The binding is typed with the gate's own
 * declaration of what it reads (`ElementDataSourceConfig`, `@object-ui/core`),
 * so no new type is exported for it. Everything else is the mirror, so the
 * mirror's refusal reaches every read in the renderer.
 *
 * ## What is refused now that was admitted before — measured, not implied
 *
 * The three keys the renderer reads THROUGH a cast (`requiredPermissions`,
 * `enforceFieldSecurity`, `redactFields`) are declared by no block the UI
 * contract maps; objectui#8649 routed them to the producer and ruled
 * "declare" off the table (`detailRendererUndeclaredKeys-8649.test.ts` ledgers
 * them). Their READS are untouched — each goes through its own cast. What the
 * narrowing refuses is a TYPED call site writing one of them into a `schema`
 * literal, which is the contract's own answer for these keys; the legs below
 * pin that as a reading.
 *
 * ## Which instrument settles what
 *
 * The `Equal` legs and every `@ts-expect-error` are compiled by
 * `tsc -p tsconfig.test.json` and by nothing else — vitest strips types. The
 * runtime legs at the foot prove the two retained loosenesses are READ, so the
 * type admits them because the renderer consumes them, not because they were
 * once admitted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { RecordContextProvider } from '@object-ui/react';
import type { ElementDataSourceConfig } from '@object-ui/core';
import type { RecordRelatedListComponentProps } from '@object-ui/types';
import {
  RecordRelatedListRenderer,
  type RecordRelatedListRendererProps,
} from '../record-related-list';

/* ── Type-level legs (compiled by `tsc -p tsconfig.test.json`, erased by vitest) ── */

/** Invariant type equality. `A extends B` is NOT this: `never` and `any` pass that. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The only assertion form used here — its constraint is what refuses `false`. */
type Expect<T extends true> = T;

/* Direction proofs: a broken instrument makes THIS file red, not green. */

// @ts-expect-error objectui#9963 — `Expect` must refuse `false`. Widen its constraint and this directive goes unused (TS2578).
type _ExpectRefusesFalse = Expect<false>;

// @ts-expect-error objectui#9963 — an index signature's `string` key set must NOT read as equal to a named key union.
type _EqualRefusesAnIndexKeySet = Expect<Equal<string | number, 'a' | 'b'>>;

/** The type the renderer's own `schema` carries — the one every read goes through. */
type Schema = NonNullable<RecordRelatedListRendererProps['schema']>;

/**
 * ⭐ The card's reading, at a READ EXPRESSION — the shape the renderer body
 * actually has. On `origin/main` at `6099dd87` this directive was UNUSED
 * (TS2578): `Record<string, any>` admitted the misspelling at `any`.
 */
export const _misspelledSchemaRead = (schema: Schema) =>
  // @ts-expect-error objectui#9963 — a misspelled DECLARED key read off the renderer's own `schema` is refused (TS2551, "Did you mean 'relationshipValueField'?").
  schema.relationshipValueFeild;

/** CONTROL, varying only the spelling: the declared key still reads, at its declared type. */
export type _DeclaredSchemaReadKeepsItsType = Expect<
  Equal<Schema['relationshipValueField'], string | undefined>
>;

/**
 * The same misspelling, the same read expression, through the MIRROR (no index
 * signature) — refused before this card and after it. Only the type varies
 * between this leg and the one above, which is what makes the renderer's
 * former silence a reading rather than a broken probe.
 */
export const _misspelledMirrorRead = (block: RecordRelatedListComponentProps) =>
  // @ts-expect-error objectui#9963 — CONTROL: the mirror refuses the same misspelling (TS2551). Unused (TS2578) means the control stopped firing.
  block.relationshipValueFeild;

/**
 * ⭐ The whole shape, in one leg: the `schema` key set is EXACTLY the mirror's
 * members plus the binding. An index signature makes `keyof` read
 * `string | number`, so re-admitting one — or adding any undeclared member —
 * turns this red. Derived from the mirror, so a key the mirror declares
 * tomorrow joins it without anyone editing this file.
 */
export type _SchemaKeysAreTheMirrorPlusTheBinding = Expect<
  Equal<keyof Schema, keyof RecordRelatedListComponentProps | 'dataSource'>
>;

/** The binding is the GATE's declaration of what it reads, not a lookalike. */
export type _BindingIsTheGatesDeclaration = Expect<
  Equal<Schema['dataSource'], ElementDataSourceConfig | undefined>
>;

/** `objectName` is optional HERE (the gate binds it) and nowhere else. */
export type _ObjectNameIsOptionalHere = Expect<Equal<Schema['objectName'], string | undefined>>;
export type _ObjectNameIsRequiredOnTheMirror = Expect<
  Equal<RecordRelatedListComponentProps['objectName'], string>
>;

/**
 * Every OTHER mirror member arrives at the mirror's own type — the renderer
 * does not restate any of them.
 */
type MirrorRest = Omit<RecordRelatedListComponentProps, 'objectName'>;
export type _EveryOtherMirrorMemberIsTheMirrors = Expect<
  Equal<{ [K in keyof MirrorRest]: Schema[K] }, { [K in keyof MirrorRest]: MirrorRest[K] }>
>;

/**
 * The host props are exactly the ones the component reads: `schema`,
 * `className`, and what `splitDesigner` destructures. The registry's own call
 * is untyped (`ComponentRenderer<T = any>`), so this declaration binds typed
 * JSX callers only; the keys the registry forwards and nothing here reads are
 * not declared.
 */
export type _HostPropsAreTheOnesRead = Expect<
  Equal<
    keyof RecordRelatedListRendererProps,
    'schema' | 'className' | 'style' | 'data-obj-id' | 'data-obj-type'
  >
>;

export const _misspelledHostPropRead = (props: RecordRelatedListRendererProps) =>
  // @ts-expect-error objectui#9963 — the props interface no longer carries `[k: string]: any`, so a misspelled host prop is refused too.
  props.classname;

/* Controls — every key of the objectstack#6953 authoring shape still type-checks. */

/** The docblock's own example, verbatim: no `objectName`, a binding instead. */
export const _authoringShape: Schema = {
  relationshipField: 'account_id',
  dataSource: { object: 'contact', view: 'hot' },
};

/** The binding's full member set, as the gate reads it. */
export const _fullBinding: Schema = {
  relationshipField: 'account_id',
  dataSource: {
    object: 'contact',
    view: 'hot',
    filter: [['is_active', '=', true]],
    sort: [{ field: 'created', order: 'desc' }],
    limit: 10,
  },
};

/** And every mirror member, together — nothing declared was lost. */
export const _everyMirrorMember: Schema = {
  objectName: 'contact',
  relationshipField: 'account_id',
  relationshipValueField: 'id',
  columns: ['name'],
  sort: [{ field: 'name', order: 'asc' }],
  limit: 5,
  filter: [{ field: 'stage', operator: 'equals', value: 'won' }],
  title: 'Contacts',
  showViewAll: true,
  actions: ['new'],
  add: { picker: { object: 'contact' }, linkField: 'contact_id', label: 'Add' },
  aria: { ariaLabel: 'Contacts' },
};

/* What the narrowing refuses at a TYPED call site: the three cast-read keys objectui#8649 routed to the producer. */

export const _requiredPermissionsRefused: Schema = {
  relationshipField: 'account_id',
  // @ts-expect-error objectui#9963 — `requiredPermissions` is declared by no block the contract maps onto this tag (objectui#8649); its read is a cast, its typed write is refused.
  requiredPermissions: ['crm.manage'],
};

export const _enforceFieldSecurityRefused: Schema = {
  relationshipField: 'account_id',
  // @ts-expect-error objectui#9963 — same standing as above (objectui#8649 ROUTED_KEYS).
  enforceFieldSecurity: true,
};

export const _redactFieldsRefused: Schema = {
  relationshipField: 'account_id',
  // @ts-expect-error objectui#9963 — same standing as above (objectui#8649 ROUTED_KEYS).
  redactFields: ['salary'],
};

/* ── Runtime legs: the two retained loosenesses are READ ─────────────────── */

const h = vi.hoisted(() => ({ captured: null as any }));
vi.mock('../../RelatedList', () => ({
  RelatedList: (props: any) => {
    h.captured = props;
    return <div data-testid="related-list" />;
  },
}));

const ds = {
  find: vi.fn(async () => []),
  getObjectSchema: vi.fn(async (name: string) => ({ name, fields: {}, listViews: {} })),
};

beforeEach(() => {
  h.captured = null;
});

describe('objectui#9963 — the looseness the type keeps is looseness the renderer consumes', () => {
  it('the authoring shape (binding, no `objectName`) lists the bound object', async () => {
    // ⭐ Why `dataSource` is DECLARED: the gate reads it and binds `objectName`.
    render(
      <RecordContextProvider objectName="account" recordId="ACC-1" dataSource={ds as any}>
        <RecordRelatedListRenderer
          schema={{ relationshipField: 'account_id', dataSource: { object: 'contact' } }}
        />
      </RecordContextProvider>,
    );
    await waitFor(() => expect(h.captured).toBeTruthy());
    expect(h.captured.objectName).toBe('contact');
    expect(h.captured.referenceField).toBe('account_id');
  });

  it('CONTROL — the same node with neither `objectName` nor a binding is the designer placeholder', () => {
    // Why `objectName` is OPTIONAL rather than required: the body handles its
    // absence, and it is the binding above — not the author — that supplies it.
    const { container } = render(
      <RecordContextProvider objectName="account" recordId="ACC-1" dataSource={ds as any}>
        <RecordRelatedListRenderer schema={{ relationshipField: 'account_id' }} />
      </RecordContextProvider>,
    );
    expect(h.captured).toBeNull();
    expect(container.textContent).toContain('record:related_list — missing objectName');
  });

  it('the declared host props are read: the designer ids reach the container', async () => {
    const { container } = render(
      <RecordContextProvider objectName="account" recordId="ACC-1" dataSource={ds as any}>
        <RecordRelatedListRenderer
          schema={{ objectName: 'contact', relationshipField: 'account_id' }}
          className="rl-host"
          data-obj-id="rl-1"
          data-obj-type="record:related_list"
        />
      </RecordContextProvider>,
    );
    await waitFor(() => expect(h.captured).toBeTruthy());
    const host = container.querySelector('[data-obj-id="rl-1"]');
    expect(host).not.toBeNull();
    expect(host?.getAttribute('data-obj-type')).toBe('record:related_list');
    expect(host?.className).toContain('rl-host');
  });
});
