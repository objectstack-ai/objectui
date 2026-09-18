/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `object-form.customFields` — the MEMBER shape this renderer reads
 * (objectui#8071, criterion from objectui#8068).
 *
 * Declared on both sides without a member shape: the registration is
 * `{ type: 'array' }` with no `of`, and `@objectstack/spec`'s
 * `ComponentPropsMap['object-form'].customFields` is `z.unknown().optional()`
 * — so anything parses and the read site is the whole member contract.
 *
 * ⭐ The registration's own prose is what makes this key worth pinning rather
 * than describing. It reads:
 *
 *     "Field definitions merged over the set generated from object metadata.
 *      With inline definitions and no data source, this becomes the only field
 *      source."
 *
 * ⇒ "merged over" and "with … no data source" both describe a merge. THE
 * RENDERER NEVER MERGES. `ObjectForm.tsx` gates on
 * `hasInlineFields = schema.customFields && schema.customFields.length > 0` and,
 * when that holds, the field-generation effect does
 * `setFormFields(schema.customFields.map(normalizeVisibility))` and RETURNS —
 * above the metadata branch entirely, and whether or not an adapter was
 * injected. A non-empty `customFields` therefore REPLACES the generated set on
 * every path, and rows 1-3 pin that.
 *
 * ⚠️ The per-member merge the prose describes does exist as CODE —
 * `schema.customFields?.find((f) => f.name === name)` inside the metadata
 * branch — and it is unreachable: that branch runs only when `hasInlineFields`
 * is false, i.e. when `customFields` is absent or EMPTY, so the `find` is
 * always over nothing. Handed back as a finding on objectui#8071 rather than
 * repaired here, because repairing it is a renderer (or a spec) change and this
 * card writes pins only.
 *
 * ⛔ Row 4 is the one a plausible "improvement" breaks. The gate reads
 * `.length > 0`, not truthiness, so an EMPTY `customFields: []` is UNAUTHORED:
 * the metadata path runs and the object's own fields render. Simplifying that
 * read to `!!schema.customFields` — which is what "has inline fields" reads
 * like — turns a designer's not-configured-yet empty array into a form with no
 * fields at all and no diagnostic, and every other row here stays green.
 *
 * Row 5 pins the SECOND read site of the same member count, one layer up:
 * `index.tsx` spells `requiresDataSource={!(schema?.customFields?.length > 0) …}`,
 * so the members are what exempt this block from the gate's no-adapter panel.
 * `ElementDataSourceGate`'s own docblock states the contract in words ("an
 * `object-form` with inline `customFields` needs none"); this is that sentence
 * as behaviour, driven through the REGISTERED block with its control in the
 * same test.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { registerAllFields } from '@object-ui/fields';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { ObjectForm } from '../ObjectForm';
// Registers `object-form` with the `requiresDataSource` wiring row 5 reads.
import '../index';

registerAllFields();

const OBJECT_SCHEMA = {
  name: 'invoice',
  fields: {
    customer: { type: 'text', label: 'Customer' },
    note: { type: 'text', label: 'Note' },
    amount: { type: 'text', label: 'Amount' },
  },
};

const makeDataSource = () =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(OBJECT_SCHEMA),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }) as any;

async function mount(schema: Record<string, unknown>, adapter = makeDataSource()) {
  const { container } = render(
    <ObjectForm
      schema={{ type: 'object-form', objectName: 'invoice', mode: 'create', ...schema } as any}
      dataSource={adapter}
    />,
  );
  await waitFor(() => {
    if (!container.querySelector('form')) throw new Error('form not ready');
  });
  return { container: container as HTMLElement, adapter };
}

const drawnFields = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('[data-field]')].map((el) => el.getAttribute('data-field') as string);

const labelOf = (c: HTMLElement, name: string): string | null =>
  c.querySelector(`[data-field="${name}"] label`)?.textContent ?? null;

describe('`object-form` — the member shape of `customFields`', () => {
  it('1. members are whole FIELD DEFINITIONS keyed by `name`, rendered in AUTHORED order', async () => {
    const { container } = await mount({
      customFields: [
        { name: 'zz', label: 'Brand new', type: 'text' },
        { name: 'note', label: 'INLINE NOTE', type: 'text' },
      ],
    });
    expect(drawnFields(container)).toEqual(['zz', 'note']);
    expect(labelOf(container, 'zz'), 'a member naming a field the object never declares still renders').toBe(
      'Brand new',
    );
  });

  it('2. a non-empty `customFields` REPLACES the generated set — the object’s metadata is never even fetched', async () => {
    const { container, adapter } = await mount({
      customFields: [{ name: 'note', label: 'INLINE NOTE', type: 'text' }],
    });
    expect(
      adapter.getObjectSchema.mock.calls.length,
      'the registration promises a merge "over the set generated from object metadata"; the ' +
        'renderer returns before that set is generated at all',
    ).toBe(0);
    expect(
      drawnFields(container),
      'the object declares `customer` / `note` / `amount`; only the member survives',
    ).toEqual(['note']);
  });

  it('3. a member naming a declared field inherits NOTHING from it — its own `label` is what renders', async () => {
    const { container } = await mount({
      customFields: [{ name: 'note', label: 'INLINE NOTE', type: 'text' }],
    });
    expect(
      labelOf(container, 'note'),
      'the object declares this field as "Note"; a merge would have to reach it',
    ).toBe('INLINE NOTE');
  });

  it('4. an EMPTY `customFields` is UNAUTHORED — the read is `.length > 0`, ⛔ not truthiness', async () => {
    const { container, adapter } = await mount({ customFields: [] });
    expect(adapter.getObjectSchema).toHaveBeenCalledWith('invoice');
    expect(
      drawnFields(container),
      'a truthiness read would make `[]` an inline source and render a form with no fields',
    ).toEqual(['customer', 'note', 'amount']);
  });

  it('5. the same member count is what exempts the block from the no-adapter panel', async () => {
    const withMembers = render(
      <SchemaRendererProvider dataSource={null}>
        <SchemaRenderer
          schema={
            {
              type: 'object-form',
              objectName: 'invoice',
              mode: 'create',
              customFields: [{ name: 'zz', label: 'Inline only', type: 'text' }],
            } as any
          }
        />
      </SchemaRendererProvider>,
    );
    await waitFor(() => {
      if (!withMembers.container.querySelector('form')) throw new Error('form not ready');
    });
    expect(withMembers.container.querySelector('[data-testid="object-form-no-data-source"]')).toBeNull();
    expect(drawnFields(withMembers.container as HTMLElement)).toEqual(['zz']);

    const withoutMembers = render(
      <SchemaRendererProvider dataSource={null}>
        <SchemaRenderer schema={{ type: 'object-form', objectName: 'invoice', mode: 'create' } as any} />
      </SchemaRendererProvider>,
    );
    await waitFor(() => {
      if (!withoutMembers.container.querySelector('[data-testid="object-form-no-data-source"]')) {
        throw new Error('panel not ready');
      }
    });
    expect(
      withoutMembers.container.querySelector('form'),
      'control: the identical node without the members reports instead of rendering',
    ).toBeNull();
  });
});
