/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `object-form.sections` — the MEMBER shape this renderer reads (objectui#8071,
 * criterion from objectui#8068).
 *
 * Nothing declared says what a section IS. The registration is a bare
 * `{ name: 'sections', type: 'array' }` — no `of`, no description — and
 * `@objectstack/spec`'s `ComponentPropsMap['object-form'].sections` is
 * `z.array(z.unknown()).optional()`, so every array of anything parses on both
 * sides. The read site is therefore the whole member contract, which is the
 * population objectui#8068 refuses to leave unwatched.
 *
 * WHAT THE RENDERER READS, measured in `SimpleObjectForm`'s grouped branch in
 * `ObjectForm.tsx` — the DEFAULT layout, the one a section-carrying form gets
 * when it declares no `formType`. A member is an object, and six of its keys
 * are read there: `fields` (the membership), `name` and `label` (the heading
 * and the collapse-state key), `collapsed` and `collapsible` (the two halves of
 * the disclosure), and `columns` (the per-section density).
 *
 * ⛔ SCOPE, stated so this pin is not over-read. Five other layouts rebuild a
 * section key by key (`tabbed` / `wizard` / `split` / `drawer` / `modal`), and
 * two neighbouring files already own the member facts that are ABOUT those
 * rebuilds rather than about the member shape: `sectionVisibleWhen-6111` and
 * `sectionPredicateLayoutDiagnostic-6237` own `visibleWhen`,
 * `formSectionGroupReference-7051` owns the `{ group }` reference form, and
 * `groupsAlias` owns the legacy `groups` spelling folding onto this key. This
 * file is the default layout only, and it is the only one registered as the
 * member pin for the key.
 *
 * ⭐ Row 1 is the one a plausible "improvement" breaks, and it is why this is a
 * pin rather than a restatement of "array". A section's `fields` members read
 * as a SET, not as an order: the loop spells the resolution
 * `sourceFields.filter((f) => sectionFieldNames.includes(f.name))`, so the
 * fields come out in the OBJECT's order and the order the author wrote inside
 * the section is discarded. Re-ordering that filter by the authored member
 * position is exactly what a contributor reading "sections[].fields" would
 * write, and every other row in this file stays green when they do. ⚠️ Note it
 * is the OPPOSITE of the sibling key on the same block: `object-form.fields`
 * is pinned (objectFormFieldsMembers-8071) on authored order being PRESERVED.
 * One block, one spelling, two answers — which is precisely the kind of fact a
 * declaration reading "array" can never publish.
 *
 * Row 2 is the silent one: a section whose members resolve to no field at all
 * is dropped WHOLE — the loop returns before it pushes a heading, so a typo in
 * one member name costs the author a heading they can see nothing wrong with.
 *
 * Row 3 pins the identity pair: `name` alone yields a heading (it is passed
 * through `sectionLabel(objectName, name, label || name)`), while a member
 * carrying NEITHER key renders its fields with no divider at all — the
 * "untitled trailing bucket" the ungrouped fields land in.
 *
 * Row 4 is the disclosure pair, and its sharp edge. `collapsed: true` takes the
 * section's fields out of the DOM while its heading stays; `collapsible` is a
 * SEPARATE member and is the only thing that makes that heading a control
 * (`role="button"` / `aria-expanded`). ⇒ a section declared `collapsed` and not
 * `collapsible` renders permanently closed with no affordance to open it, and
 * nothing declared distinguishes the two members.
 *
 * Row 5 is the non-vacuity control: with no `sections` at all the same three
 * fields render, with no divider anywhere — so rows 1-4 cannot be passing on a
 * form that draws nothing.
 *
 * ⚠️ LIMIT, recorded rather than asserted as a second layout: a section's
 * `description` IS a member the five rebuild arms copy and `SectionDivider`
 * renders, and the default layout above does NOT copy it. Row 6 pins that as
 * behaviour, with the section's own `label` in the same call as the live
 * control; it is handed back as a finding on objectui#8071 rather than fixed,
 * because fixing it is a renderer change and this card writes pins only.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from '../ObjectForm';

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

/** Mount a create-mode `object-form` in its DEFAULT layout and wait for the form. */
async function mount(schema: Record<string, unknown>): Promise<HTMLElement> {
  const { container } = render(
    <ObjectForm
      schema={{ type: 'object-form', objectName: 'invoice', mode: 'create', ...schema } as any}
      dataSource={makeDataSource()}
    />,
  );
  await waitFor(() => {
    if (!container.querySelector('form')) throw new Error('form not ready');
  });
  return container as HTMLElement;
}

/** The field controls actually drawn, in DOM order. */
const drawnFields = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('[data-field]')].map((el) => el.getAttribute('data-field') as string);

/** The section headings actually drawn, in DOM order. */
const headings = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('.border-b span')].map((el) => el.textContent ?? '');

describe('`object-form` — the member shape of `sections`', () => {
  it('1. a member’s `fields` are field NAMES read as a SET — the OBJECT’s order wins, ⛔ not the authored one', async () => {
    const c = await mount({
      sections: [{ name: 'main', label: 'Main', fields: ['note', 'customer'] }],
    });
    expect(headings(c)).toEqual(['Main']);
    expect(
      drawnFields(c),
      'the section resolves its members by filtering the object’s own field list, so the ' +
        'authored member order (`note` before `customer`) is discarded — the opposite of the ' +
        'sibling key `object-form.fields`, which preserves it',
    ).toEqual(['customer', 'note']);
  });

  it('2. a member whose `fields` resolve to NOTHING is dropped whole — heading and all', async () => {
    const c = await mount({
      sections: [
        { label: 'Ghost', fields: ['nosuchfield'] },
        { label: 'Real', fields: ['amount'] },
      ],
    });
    expect(headings(c), 'a section that resolves no field never reaches a divider').toEqual(['Real']);
    expect(drawnFields(c)).toEqual(['amount']);
  });

  it('3. `name` alone titles the section; a member with NEITHER `name` nor `label` draws no divider', async () => {
    const named = await mount({ sections: [{ name: 'billing', fields: ['amount'] }] });
    expect(headings(named)).toEqual(['billing']);

    const untitled = await mount({ sections: [{ fields: ['amount'] }] });
    expect(headings(untitled), 'the untitled bucket renders its fields flat').toEqual([]);
    expect(drawnFields(untitled), '…and it still renders them').toEqual(['amount']);
  });

  it('4. `collapsed` removes the members from the DOM; `collapsible` is the SEPARATE member that makes the heading a control', async () => {
    const closed = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsed: true }],
    });
    expect(headings(closed)).toEqual(['Money']);
    expect(drawnFields(closed), '`collapsed` takes the section’s fields out of the DOM').toEqual([]);
    expect(
      closed.querySelector('[role="button"]'),
      '⛔ …and with no `collapsible` member there is NO affordance to open it again',
    ).toBeNull();

    const disclosable = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsed: true, collapsible: true }],
    });
    const control = disclosable.querySelector('[role="button"]');
    expect(control, '`collapsible` is what makes the divider a control').not.toBeNull();
    expect(control?.getAttribute('aria-expanded')).toBe('false');

    const open = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsible: true }],
    });
    expect(drawnFields(open), 'control: the same section uncollapsed draws its member').toEqual(['amount']);
    expect(open.querySelector('[role="button"]')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('5. control: with NO `sections` the same fields render and no divider is drawn', async () => {
    const c = await mount({});
    expect(headings(c)).toEqual([]);
    expect(drawnFields(c)).toEqual(['customer', 'note', 'amount']);
  });

  it('6. a member’s `description` is DROPPED by the default layout, while its `label` is not', async () => {
    const c = await mount({
      sections: [{ label: 'Money', description: 'Totals as invoiced', fields: ['amount'] }],
    });
    expect(headings(c), 'the live control: the sibling member on the SAME section does reach the divider').toEqual([
      'Money',
    ]);
    expect(
      c.textContent,
      '`SectionDivider` renders a `description` and the five rebuild arms copy one; this ' +
        'layout does not — recorded as behaviour, handed back as a finding',
    ).not.toContain('Totals as invoiced');
  });
});
