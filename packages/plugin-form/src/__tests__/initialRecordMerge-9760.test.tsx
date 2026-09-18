/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `initialValues` + `initialData` merge PER MEMBER, at BOTH of the two read
 * shapes the presentation arms spell (objectui#9760).
 *
 * Maintainer ruling on objectui#9760 (batch #166 item 3, letter 甲): one helper,
 * `resolveInitialRecord(schema)`, replaces the whole-object
 * `schema.initialData || schema.initialValues` at every site, so `initialData`
 * wins member by member and `initialValues` supplies every member it says
 * nothing about — which is what the registration's "alternate spelling …
 * read FIRST" says once read as the precedence claim it is.
 *
 * ## Why this file exists beside the two flipped `8071` pins
 *
 * Those pins drive `ObjectForm` and `object-master-detail-form`, and both of
 * them reach the helper through the SAME read shape: `setInitialData(…)`, with
 * the authored record installed as form state directly. The ruling was explicit
 * that the OTHER shape had not been verified to behave identically and that the
 * two are to be measured and pinned separately, so this file owns the other
 * one and the difference between them.
 *
 * ## The two shapes, and the measured difference between them
 *
 *   A. **The create branch of the sectioned/overlay arms** — Modal, Drawer,
 *      Tabbed, Split and the wizard — spells
 *      `seedCreateValues(objectSchema, resolveInitialRecord(schema), ctx)`.
 *      `seedCreateValues` puts the object schema's declared static
 *      `defaultValue`s UNDERNEATH the authored record (#4047), so a field
 *      neither key names still opens on its declared default.
 *
 *   B. **The direct-install sites** — `ObjectForm`'s two, and the no-adapter
 *      branch of the sectioned arms — spell `setFormData(resolveInitialRecord(
 *      schema))` with nothing underneath.
 *
 * ⇒ They are ⛔ NOT semantically identical, and the difference is not the
 * merge: it is the DEFAULTS LAYER, which exists on A and does not exist on B.
 * Rows 3 and 6 are that difference, measured on the same object schema and the
 * same authored keys, so a future edit that "unifies" the two arms by dropping
 * `seedCreateValues` — the tidy-looking move now that both sides call one
 * helper — turns row 3 red instead of silently un-fixing objectui#4047.
 *
 * ## The inputs the two implementations disagree about
 *
 * Every behavioural row is driven on one of the two, because no other input
 * separates `{ ...initialValues, ...initialData }` from
 * `initialData || initialValues`:
 *
 *   - an **EMPTY** `initialData` beside a populated `initialValues` (the `||`
 *     tested the OBJECT's truthiness and `{}` is truthy, so the empty object a
 *     `?? {}` producer hands over blanked the form completely); and
 *   - a **PARTIAL** `initialData` naming one member of several (the `||` chose
 *     whole objects, so every member it said nothing about was dropped).
 *
 * A row driven on a FULL `initialData`, or on either key alone, passes
 * identically before and after the repair and would pin nothing.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { registerAllFields } from '@object-ui/fields';
import { resolveInitialRecord } from '../initialRecord';
import { ObjectForm } from '../ObjectForm';
import { ModalForm } from '../ModalForm';
import { DrawerForm } from '../DrawerForm';
import { TabbedForm } from '../TabbedForm';
import { SplitForm } from '../SplitForm';
import { WizardForm } from '../WizardForm';

registerAllFields();

/**
 * `code` carries a declared static default and NEITHER authored key ever names
 * it — it is the probe for the defaults layer that separates shape A from B.
 */
const OBJECT_SCHEMA = {
  name: 'invoice',
  fields: {
    customer: { type: 'text', label: 'Customer' },
    note: { type: 'text', label: 'Note' },
    code: { type: 'text', label: 'Code', defaultValue: 'INV-DEFAULT' },
  },
};

const FIELD_NAMES = ['customer', 'note', 'code'] as const;
const SECTIONS = [{ name: 'basics', label: 'Basics', fields: [...FIELD_NAMES] }];

const makeDataSource = () =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(OBJECT_SCHEMA),
    findOne: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'r1' }),
    update: vi.fn().mockResolvedValue({ id: 'r1' }),
  }) as any;

const readControl = (root: ParentNode, name: string) =>
  (root.querySelector(`input[name="${name}"]`) as HTMLInputElement | null)?.value ?? null;

/** Every probed control's opening value, keyed by field name. */
const openingValuesIn = (root: ParentNode) =>
  Object.fromEntries(FIELD_NAMES.map((name) => [name, readControl(root, name)]));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

// ── shape A: the create branch, `seedCreateValues(…, resolveInitialRecord(schema), …)`
//
// Driven through every arm that spells it, as one table: they share the branch,
// and an arm that quietly stopped sharing it is exactly what a per-arm file
// would stop noticing.

const SEEDING_ARMS: Array<[string, React.ComponentType<any>, string]> = [
  ['ModalForm', ModalForm as any, 'modal'],
  ['DrawerForm', DrawerForm as any, 'drawer'],
  ['TabbedForm', TabbedForm as any, 'tabbed'],
  ['SplitForm', SplitForm as any, 'split'],
  ['WizardForm', WizardForm as any, 'wizard'],
];

describe.each(SEEDING_ARMS)(
  '%s — the create branch merges per member ON TOP of the declared defaults',
  (_name, Container, formType) => {
    const openCreate = async (extra: Record<string, unknown>) => {
      const { container } = render(
        <Container
          schema={
            {
              type: 'object-form',
              formType,
              objectName: 'invoice',
              mode: 'create',
              open: true,
              sections: SECTIONS,
              ...extra,
            } as any
          }
          dataSource={makeDataSource()}
        />,
      );
      // Overlay arms portal their body out of `container`, so the probe is the
      // document — which also keeps the read identical across all five arms.
      await waitFor(() => {
        if (!document.body.querySelector('input[name="customer"]')) throw new Error('form not ready');
      });
      return openingValuesIn(document.body);
    };

    it('1. an EMPTY `initialData` contributes NOTHING and leaves `initialValues` standing', async () => {
      expect(
        await openCreate({
          initialData: {},
          initialValues: { customer: 'Alpha', note: 'from initialValues' },
        }),
        'the whole-object `||` blanked this form: `{}` is truthy, so it won and carried no members',
      ).toEqual({ customer: 'Alpha', note: 'from initialValues', code: 'INV-DEFAULT' });
    });

    it('2. a PARTIAL `initialData` overrides only the members it names', async () => {
      expect(
        await openCreate({
          initialData: { customer: 'Beta' },
          initialValues: { customer: 'Alpha', note: 'from initialValues' },
        }),
        '`note` is the member `initialData` says nothing about; the whole-object choice dropped it',
      ).toEqual({ customer: 'Beta', note: 'from initialValues', code: 'INV-DEFAULT' });
    });

    it('3. ⭐ the DEFAULTS LAYER is still underneath, and an authored member still outranks it', async () => {
      // The row that separates this shape from the direct-install one. `code`
      // is seeded from the object schema although NEITHER key names it, while
      // an authored member wins over a declared default as it always has.
      expect(
        await openCreate({ initialValues: { code: 'FROM-AUTHOR' }, initialData: { customer: 'Beta' } }),
        'dropping `seedCreateValues` now that both shapes call one helper would un-fix objectui#4047',
      ).toEqual({ customer: 'Beta', note: '', code: 'FROM-AUTHOR' });
    });

    it('4. control: with neither key authored the same controls open on the DEFAULTS alone', async () => {
      expect(await openCreate({})).toEqual({ customer: '', note: '', code: 'INV-DEFAULT' });
    });
  },
);

// ── shape B: the direct install, `setInitialData(resolveInitialRecord(schema))`
//
// Reached through `ObjectForm`'s inline-`customFields` effect, which returns
// above the metadata branch entirely — so there is no object schema behind it
// and no defaults layer, which is the point of rows 5-7.

describe('`ObjectForm` inline `customFields` — the direct-install shape has NO defaults layer', () => {
  const CUSTOM_FIELDS = [
    { name: 'customer', label: 'Customer', type: 'text' },
    { name: 'note', label: 'Note', type: 'text' },
    { name: 'code', label: 'Code', type: 'text', defaultValue: 'INV-DEFAULT' },
  ];

  const openInline = async (extra: Record<string, unknown>) => {
    const dataSource = makeDataSource();
    const { container } = render(
      <ObjectForm
        schema={
          {
            type: 'object-form',
            objectName: 'invoice',
            mode: 'create',
            customFields: CUSTOM_FIELDS,
            ...extra,
          } as any
        }
        dataSource={dataSource}
      />,
    );
    await waitFor(() => {
      if (!container.querySelector('input[name="customer"]')) throw new Error('form not ready');
    });
    return { values: openingValuesIn(container), dataSource };
  };

  it('5. an EMPTY `initialData` contributes NOTHING here either', async () => {
    const { values } = await openInline({
      initialData: {},
      initialValues: { customer: 'Alpha', note: 'from initialValues' },
    });
    expect(values).toEqual({ customer: 'Alpha', note: 'from initialValues', code: '' });
  });

  it('6. ⭐ a PARTIAL `initialData` merges, and NOTHING is layered underneath', async () => {
    const { values, dataSource } = await openInline({
      initialData: { customer: 'Beta' },
      initialValues: { customer: 'Alpha', note: 'from initialValues' },
    });
    // `code` declares a `defaultValue` on its inline definition and opens EMPTY:
    // this branch never calls `seedCreateValues`, and it never fetches the
    // object schema either — asserted so "no default" cannot be read as "the
    // schema simply had not arrived yet".
    expect(values).toEqual({ customer: 'Beta', note: 'from initialValues', code: '' });
    expect(
      dataSource.getObjectSchema.mock.calls.length,
      'the inline branch returns above the metadata path, so there is no schema to seed from',
    ).toBe(0);
  });

  it('7. control: with neither key authored the same controls open EMPTY', async () => {
    const { values } = await openInline({});
    expect(values).toEqual({ customer: '', note: '', code: '' });
  });
});

// ── the helper itself, at the boundaries no rendered form can show

describe('`resolveInitialRecord` — the chokepoint contract', () => {
  it('8. merges per member, `initialData` on top', () => {
    expect(
      resolveInitialRecord({ initialValues: { a: 1, b: 2 }, initialData: { b: 3 } }),
    ).toEqual({ a: 1, b: 3 });
  });

  it('9. a nullish KEY contributes nothing, but a null MEMBER is a value', () => {
    // The distinction `seedCreateValues`' docblock draws: an explicit `null`
    // from a caller is a real "leave this blank", not an absence.
    expect(resolveInitialRecord({ initialValues: { a: 1 }, initialData: null })).toEqual({ a: 1 });
    expect(resolveInitialRecord({ initialValues: { a: 1 }, initialData: { a: null } })).toEqual({ a: null });
    expect(resolveInitialRecord({})).toEqual({});
    expect(resolveInitialRecord(null)).toEqual({});
    expect(resolveInitialRecord(undefined)).toEqual({});
  });

  it('10. returns a FRESH object every time, never either authored one', () => {
    // Callers install the result as form state and then mutate that state. A
    // returned reference would let a form edit the author's schema object,
    // which the whole-object `||` did whenever exactly one key was authored.
    const initialValues = { a: 1 };
    const initialData = { b: 2 };
    const out = resolveInitialRecord({ initialValues, initialData });
    expect(out).not.toBe(initialValues);
    expect(out).not.toBe(initialData);
    expect(resolveInitialRecord({ initialValues })).not.toBe(initialValues);
    expect(resolveInitialRecord({ initialData })).not.toBe(initialData);
  });
});
