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
 * neighbouring files already own the member facts that are ABOUT those
 * rebuilds rather than about the member shape: `sectionVisibleWhen-6111` and
 * `sectionPredicateLayoutDiagnostic-6237` own `visibleWhen`,
 * `formSectionGroupReference-7051` owns the `{ group }` reference form,
 * `groupsAlias` owns the legacy `groups` spelling folding onto this key, and
 * `drawerFormSectionDescription-9834` owns `description` on the DRAWER arm —
 * a separate site that lost the same key one layer later and was repaired
 * separately. This file is the default layout only, and it is the only one
 * registered as the member pin for the key.
 *
 * ⚠️ Row 10 is the ONE deliberate exception to that scope, and it is scoped in
 * turn: it mounts the four sibling arms to assert ONLY that a headingless
 * member's blurb still reaches them, because the fix rows 7-9 pin would
 * otherwise be satisfiable by breaking those four. ⛔ It re-derives no other
 * fact about them and is ⛔ not a second home for their pins.
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
 * Row 4 is the disclosure pair. `collapsed: true` takes the section's fields
 * out of the DOM while its heading stays, and the heading is a control
 * (`role="button"` / `aria-expanded`) whenever either member says so.
 *
 * ⚠️ FLIPPED, the way rows 6 and 7 below flipped before it, and for the same
 * reason: it pinned a DEFECT as behaviour. It used to require that a section
 * declaring `collapsed` and NOT `collapsible` carry no affordance at all —
 * i.e. that it render permanently closed, its fields out of the DOM and
 * nothing on the page able to bring them back. objectui#8071 slice 11 handed
 * that reading back as a finding (objectui#9780), and the maintainer ruled it
 * on 2026-09-18, letter A: `collapsed` IMPLIES `collapsible`. The row now
 * pins the implication, in the same change that made it true. Its job did not
 * change — it is still the only row here watching the disclosure pair, and it
 * must fail if either half stops.
 *
 * The two members remain SEPARATE and the implication runs one way only:
 * `collapsible: true` alone still means "open, with a control", which is why
 * this row keeps reading that spelling too. The deeper reading of the ruling —
 * including `collapsible: false` with `collapsed: true`, which resolves in
 * favour of `collapsed` — lives in `collapsedImpliesCollapsible-9780`.
 *
 * Row 5 is the non-vacuity control: with no `sections` at all the same three
 * fields render, with no divider anywhere — so rows 1-4 cannot be passing on a
 * form that draws nothing.
 *
 * Row 6 is the SEVENTH key, and it changed hands. It was written here as a
 * LIMIT — `description` is a member `SectionDivider` renders and the rebuild
 * arms copy, and this layout did NOT copy it, so the row pinned the DROP as
 * behaviour and handed it back as a finding, because objectui#8071 wrote pins
 * only. objectui#9779 took that finding and made the default layout copy the
 * key, so the row now pins the ARRIVAL: same fixture, same live control
 * (`label` on the same member, in the same call), opposite verdict. ⛔ The
 * row's job is unchanged and it is still the only thing watching this key —
 * it must go red if the blurb stops reaching the divider.
 *
 * ⚠️ Rows 7-9 are the BOUNDARY objectui#9779 handed back, now RULED —
 * objectui#9835, maintainer 2026-09-18, letter B. A member carrying a
 * `description` and NEITHER `name` nor `label` used to draw nothing at all on
 * this layout, because the divider row exists only for a member that yields a
 * heading (row 3's gate) — while `split` / `modal` / `wizard` / `tabbed` all
 * render that member's blurb. The ruling refused letter A (widen the gate to
 * `label || description`) because the SAME gate decides the ADR-0089
 * `visibleWhen` row and the objectui#6236 membership claim that gates the whole
 * group, plus the `collapsed` / `collapsible` pair whose "an untitled bucket is
 * never collapsible" rule it implements. ⇒ the member gets a BLURB-ONLY row
 * that carries nothing else, and rows 7-9 pin each half of "nothing else"
 * SEPARATELY, because one assertion that "something rendered" would be
 * satisfied by the widened gate the ruling refused:
 *
 * - Row 7 — the blurb IS rendered, and NO divider heading comes with it. This
 *   is the row that FLIPPED: it recorded the drop as behaviour until this card
 *   (`blurbs` asserted `[]`), exactly as row 6 recorded its own drop before
 *   objectui#9779 fixed it. Its `headings` half did NOT flip — no heading is
 *   authored, so none is drawn, before and after.
 * - Row 8 — no COLLAPSE control, and `collapsed: true` does not take the
 *   member's fields out of the DOM. The live control is the same section with
 *   a `label` added: it draws the control and loses its fields, so row 8's two
 *   negatives are readings on a lit instrument.
 * - Row 9 — no PREDICATE. An authored `visibleWhen` on such a member gates
 *   nothing: blurb and fields both stay. Two live controls, same predicate
 *   text and same host scope — the titled twin under the DENYING scope loses
 *   heading, blurb and field, and under the ADMITTING scope gets all three
 *   back, so "ungated" is measured against an instrument that both hides and
 *   shows.
 *
 * ⭐ Row 10 is the CROSS-ARM guard the ruling implies but no single-arm pin can
 * hold: the four arms that already rendered this member's blurb must still
 * render it. Without it, a future edit could "make the arms agree" by breaking
 * the four instead of keeping the fifth — the rows above would all stay green.
 * ⛔ It is NOT a second home for those arms' own facts (each arm's site owns
 * those, `drawerFormSectionDescription-9834` among them); it reads one thing
 * only, per arm, in both directions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { PredicateScopeProvider } from '@object-ui/react';
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

/**
 * The section BLURBS actually drawn, in DOM order — read off the divider row
 * itself (`SectionDivider` renders the description as the `<p>` inside the same
 * `.border-b` block that carries the heading), not off the form's whole
 * `textContent`. A `textContent` read would be satisfied by the string
 * appearing anywhere at all — a field's own help text, a toast, a label — which
 * is fine for asserting ABSENCE and useless for asserting ARRIVAL.
 */
const blurbs = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('.border-b p')].map((el) => el.textContent ?? '');

/**
 * The disclosure CONTROLS actually drawn. `SectionDivider` is a control only
 * when it was handed `collapsible` — that is what puts `role="button"` on the
 * row — so counting them answers "did this member get a collapse affordance"
 * without asking how the row was built.
 */
const collapseControls = (c: HTMLElement): number =>
  c.querySelectorAll('[role="button"]').length;

/**
 * The canonical predicate wire shape: `@objectstack/spec` normalizes an
 * authored predicate into a `{ dialect: 'cel' }` envelope at parse (ADR-0089
 * D2), and a bare string routes to a different engine on some surfaces. Same
 * spelling as `sectionVisibleWhen-6111`, on purpose — one authored text, one
 * verdict, every surface.
 */
const cel = (source: string) => ({ dialect: 'cel', source });

/** THE authored section predicate for row 9. One text, two scopes. */
const GATE = cel("'sales_manager' in current_user.positions");

/** The host scope an `ExpressionProvider` mounts, transcribed (objectui#6010). */
const hostScope = (positions: string[]) => {
  const user = { id: 'u1', name: 'Kim', positions };
  return { current_user: user, user, ctx: { user }, os: { user }, data: {}, features: {} };
};

/** The same mount as `mount`, with a predicate scope bound around it. */
async function mountWithScope(
  schema: Record<string, unknown>,
  scope: Record<string, unknown>,
): Promise<HTMLElement> {
  const { container } = render(
    <PredicateScopeProvider scope={scope as any}>
      <ObjectForm
        schema={{ type: 'object-form', objectName: 'invoice', mode: 'create', ...schema } as any}
        dataSource={makeDataSource()}
      />
    </PredicateScopeProvider>,
  );
  await waitFor(() => {
    if (!container.querySelector('form')) throw new Error('form not ready');
  });
  return container as HTMLElement;
}

/**
 * Mount the SAME `object-form` under one of the sibling layout arms, for row 10.
 * Read off `document.body` rather than the RTL container because the modal arm
 * portals its body out of it — row 10 calls `cleanup()` between arms so the
 * body holds exactly one mount at a time.
 */
async function mountArm(
  formType: string,
  sections: Array<Record<string, unknown>>,
): Promise<HTMLElement> {
  render(
    <ObjectForm
      schema={
        {
          type: 'object-form',
          objectName: 'invoice',
          mode: 'create',
          formType,
          open: true,
          sections,
        } as any
      }
      dataSource={makeDataSource()}
    />,
  );
  await waitFor(() => {
    if (!document.body.querySelector('form')) throw new Error('form not ready');
  });
  return document.body;
}

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

  it('4. `collapsed` removes the members from the DOM, and it IMPLIES `collapsible` — the heading is a control either way (objectui#9780)', async () => {
    // ⚠️ FLIPPED by objectui#9780 (maintainer ruling 2026-09-18, letter A), in
    // the same change that made the implication true — see this file's header.
    // The first block used to assert `.toBeNull()` here, pinning the trap as
    // behaviour: `collapsed` alone rendered a section nothing could reopen.
    const closed = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsed: true }],
    });
    expect(headings(closed)).toEqual(['Money']);
    expect(drawnFields(closed), '`collapsed` takes the section’s fields out of the DOM').toEqual([]);
    const implied = closed.querySelector('[role="button"]');
    expect(
      implied,
      '⭐ …and the affordance to open it again is installed on the strength of `collapsed` ALONE',
    ).not.toBeNull();
    expect(implied?.getAttribute('aria-expanded')).toBe('false');

    const disclosable = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsed: true, collapsible: true }],
    });
    const control = disclosable.querySelector('[role="button"]');
    expect(control, 'declaring `collapsible` as well changes nothing — same closed control').not.toBeNull();
    expect(control?.getAttribute('aria-expanded')).toBe('false');

    const open = await mount({
      sections: [{ label: 'Money', fields: ['amount'], collapsible: true }],
    });
    expect(
      drawnFields(open),
      'control: the members stay SEPARATE and the implication runs one way — `collapsible` alone ' +
        'is still an OPEN section that draws its member',
    ).toEqual(['amount']);
    expect(open.querySelector('[role="button"]')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('5. control: with NO `sections` the same fields render and no divider is drawn', async () => {
    const c = await mount({});
    expect(headings(c)).toEqual([]);
    expect(drawnFields(c)).toEqual(['customer', 'note', 'amount']);
  });

  it('6. a member’s `description` REACHES the divider, alongside its `label` (objectui#9779)', async () => {
    // ⚠️ This row previously pinned the OPPOSITE — `.not.toContain(...)`, the
    // drop recorded as behaviour by objectui#8071 slice 11 and handed back as a
    // finding. objectui#9779 fixed the default layout, so the row was rewritten
    // onto the new behaviour in the SAME change. Its job did not change: this
    // is still the only assertion watching whether the blurb reaches the
    // divider, and it must fail if it stops.
    const c = await mount({
      sections: [{ label: 'Money', description: 'Totals as invoiced', fields: ['amount'] }],
    });
    expect(headings(c), 'the live control: the sibling member on the SAME section reaches the divider').toEqual([
      'Money',
    ]);
    expect(
      blurbs(c),
      '`SectionDivider` renders a `description`; the default layout now hands it one, so the ' +
        'blurb is read off the divider itself — not off `textContent`, which a stray render ' +
        'of the same string anywhere in the form would satisfy',
    ).toEqual(['Totals as invoiced']);
    expect(drawnFields(c), 'and the section still draws its member').toEqual(['amount']);
  });

  it('7. the blurb-only row: a member with a `description` but NEITHER `name` nor `label` renders its blurb, and NO heading (objectui#9835)', async () => {
    // ⚠️ FLIPPED, deliberately and exactly once — the same way row 6 flipped
    // before it. Until objectui#9835 this row pinned the DROP as behaviour:
    // the divider row exists only for a member that yields a heading, so this
    // member drew nothing and its blurb was lost, while four sibling arms drew
    // it. The maintainer ruled letter B on 2026-09-18: give the member a row
    // that carries the blurb and NOTHING else, rather than widen the gate
    // (letter A), which would also have moved the ADR-0089 predicate, the
    // objectui#6236 membership claim and the collapse pair. ⇒ `blurbs` flips
    // from `[]` to the authored text; `headings` does NOT flip.
    const c = await mount({
      sections: [{ description: 'Totals as invoiced', fields: ['amount'] }],
    });
    expect(
      headings(c),
      '⛔ no heading is authored and none is synthesised — the blurb-only row carries no `label`, ' +
        'so `SectionDivider` draws no heading span',
    ).toEqual([]);
    expect(
      blurbs(c),
      'the blurb reaches the DOM through the blurb-only row, read off that row itself — ⛔ not ' +
        'off `textContent`, which a stray render of the same string would satisfy',
    ).toEqual(['Totals as invoiced']);
    expect(
      drawnFields(c),
      'the liveness control: the member itself still renders, so the heading negative above is ' +
        'about a form that drew something',
    ).toEqual(['amount']);

    // The instrument control for the negative: the SAME member with a `label`
    // added does produce a heading, so `headings` returning `[]` above is a
    // reading and ⛔ not a selector that matches nothing on this corpus.
    cleanup();
    const titled = await mount({
      sections: [{ label: 'Money', description: 'Totals as invoiced', fields: ['amount'] }],
    });
    expect(
      headings(titled),
      'the lit control on the same instrument and corpus: add the sibling `label` and a heading appears',
    ).toEqual(['Money']);
  });

  it('8. the blurb-only row carries NO collapse: no control, and `collapsed` does not take the fields away', async () => {
    // Half of "nothing else". The collapse pair is one of the three semantics
    // letter A would have moved: a widened gate would have made this member's
    // `collapsed: true` hide its fields, with `collapsible` deciding whether
    // any control existed to bring them back. The ruling forbids that, so the
    // blurb-only row copies neither key and the collapse branch below the
    // pushes stays keyed on the heading.
    const headless = await mount({
      sections: [
        { description: 'Totals as invoiced', fields: ['amount'], collapsed: true, collapsible: true },
      ],
    });
    expect(
      collapseControls(headless),
      '⛔ no disclosure affordance is drawn for a headingless member, even though it authored ' +
        '`collapsible: true`',
    ).toBe(0);
    expect(
      drawnFields(headless),
      '⛔ …and its authored `collapsed: true` does NOT take the member out of the DOM — with no ' +
        'control, that would be an unreachable field',
    ).toEqual(['amount']);
    expect(blurbs(headless), 'the blurb itself is unaffected').toEqual(['Totals as invoiced']);

    // The lit control, same instrument, same corpus, same two members: add a
    // `label` and BOTH negatives above turn positive — a control appears and
    // the fields go away. So row 8 measures a difference, ⛔ not an inability.
    cleanup();
    const titled = await mount({
      sections: [
        { label: 'Money', description: 'Totals as invoiced', fields: ['amount'], collapsed: true, collapsible: true },
      ],
    });
    expect(collapseControls(titled), 'the lit control: a heading makes the row a control').toBe(1);
    expect(drawnFields(titled), '…and `collapsed` then really does remove the fields').toEqual([]);
  });

  it('9. the blurb-only row carries NO predicate: an authored `visibleWhen` gates nothing', async () => {
    // The other half of "nothing else", and the one with the sharpest edge:
    // the ADR-0089 predicate on the divider row carries the objectui#6236
    // membership claim, so on a TITLED member a false predicate removes the
    // whole group. Letter A would have handed that power to a member the
    // author never titled. The blurb-only row copies neither key, so the
    // group is ungated — exactly as it was before this card.
    const headless = await mountWithScope(
      { sections: [{ description: 'Totals as invoiced', fields: ['amount'], visibleWhen: GATE }] },
      hostScope(['sales']),
    );
    expect(
      drawnFields(headless),
      '⛔ the DENYING scope does not hide this member: the blurb-only row carries no predicate ' +
        'and no membership claim, so nothing gates the group',
    ).toEqual(['amount']);
    expect(blurbs(headless), '…and the blurb renders under the same scope').toEqual([
      'Totals as invoiced',
    ]);

    // Live control #1 — the SAME predicate text and the SAME denying scope on
    // the titled twin: heading, blurb and field all go. So the predicate is
    // one this layout really evaluates, and row 9's positive is not a
    // predicate that silently failed to arrive anywhere.
    cleanup();
    const titledDenied = await mountWithScope(
      { sections: [{ label: 'Money', description: 'Totals as invoiced', fields: ['amount'], visibleWhen: GATE }] },
      hostScope(['sales']),
    );
    expect(headings(titledDenied), 'the lit control: the titled twin IS gated').toEqual([]);
    expect(blurbs(titledDenied)).toEqual([]);
    expect(drawnFields(titledDenied), '…including its claimed member (objectui#6236)').toEqual([]);

    // Live control #2 — the same titled twin under the ADMITTING scope comes
    // back. Without it, control #1 would also be satisfied by a gate that
    // hides unconditionally.
    cleanup();
    const titledAllowed = await mountWithScope(
      { sections: [{ label: 'Money', description: 'Totals as invoiced', fields: ['amount'], visibleWhen: GATE }] },
      hostScope(['sales_manager']),
    );
    expect(headings(titledAllowed), 'the same predicate, a scope it admits ⇒ shown again').toEqual([
      'Money',
    ]);
    expect(drawnFields(titledAllowed)).toEqual(['amount']);
  });

  it('10. cross-arm guard: the four arms that already rendered a headingless blurb still do', async () => {
    // ⭐ WHY THIS ROW EXISTS. Rows 7-9 would stay green if a later edit made
    // the five arms agree by REMOVING the blurb from the other four. This row
    // is the other direction, and it is the whole reason the inconsistency was
    // worth a card: four arms rendered this member's blurb and the default one
    // did not.
    //
    // ⛔ Each arm is read at its OWN chrome, not through `textContent`: the
    // stacked arms (`split` / `modal`) draw the blurb on a `SectionDivider`
    // row, the wizard draws it in its step container, and the tabbed arm draws
    // it in the tab panel. Every read is paired with the SAME mount minus the
    // `description`, so a hit is a reading on an instrument that can report
    // none.
    const ARMS: Array<{ formType: string; blurb: (c: HTMLElement) => string[] }> = [
      { formType: 'split', blurb: (c) => [...c.querySelectorAll('.border-b p')].map((e) => e.textContent ?? '') },
      { formType: 'modal', blurb: (c) => [...c.querySelectorAll('.border-b p')].map((e) => e.textContent ?? '') },
      {
        formType: 'wizard',
        blurb: (c) => [...c.querySelectorAll('.form-section p.text-muted-foreground')].map((e) => e.textContent ?? ''),
      },
      {
        formType: 'tabbed',
        blurb: (c) => [...c.querySelectorAll('[role="tabpanel"] p.text-muted-foreground')].map((e) => e.textContent ?? ''),
      },
    ];

    for (const arm of ARMS) {
      // Two sections: the headingless one under test, plus a titled sibling —
      // the tabbed arm draws no tab strip below two sections, so a lone
      // section would measure its degraded shape instead of its tabs.
      const withBlurb = await mountArm(arm.formType, [
        { description: 'Totals as invoiced', fields: ['amount'] },
        { label: 'Other', fields: ['customer'] },
      ]);
      expect(
        arm.blurb(withBlurb),
        `the \`${arm.formType}\` arm renders a headingless member's blurb — ⛔ it must not be ` +
          'made to agree with the default arm by losing it',
      ).toEqual(['Totals as invoiced']);

      cleanup();
      const withoutBlurb = await mountArm(arm.formType, [
        { fields: ['amount'] },
        { label: 'Other', fields: ['customer'] },
      ]);
      expect(
        arm.blurb(withoutBlurb),
        `the absence control for \`${arm.formType}\`: the same mount with no \`description\` ` +
          'reports none, so the hit above is a reading',
      ).toEqual([]);
      cleanup();
    }
  });
});
