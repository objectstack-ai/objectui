/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The section-configuration → `section-divider` projection has ONE path
 * (objectui#9849, triage ruling 2026-09-18:
 * 「让 section 配置到 divider 的投影只有一条路径」).
 *
 * ⭐ WHY THIS FILE EXISTS AND WHAT IT IS NOT. It is ⛔ not a fourth copy of the
 * one-key pins. `objectFormSectionMembers-8071` owns the default arm's members,
 * `drawerFormSectionDescription-9834` owns the drawer's two pushes,
 * `collapsedImpliesCollapsible-9780` owns the collapse pair and
 * `objectFormCustomFieldsMembers-8071` owns the merge semantics — each over its
 * own population, which is how this repository keeps one reader per population.
 * What NONE of them can see is the property this card delivers: that the SIX
 * divider pushes across `ObjectForm.tsx`, `ModalForm.tsx` and `DrawerForm.tsx`
 * are now one function with six call sites, so a key cannot arrive on one arm
 * and go missing on its sibling. That property is cross-arm by construction and
 * needs a cross-arm reader.
 *
 * ⭐ THE ABLATION THIS FILE IS SHAPED FOR. Three consecutive cards repaired one
 * push each for a single key — objectui#9779 (default arm), objectui#9834
 * (drawer arm), objectui#9849 (the modal's derived push, the last site still
 * dropping `description`). Each fix left the shape that produced the next. The
 * evidence that the shape is gone is ⛔ not that the sixth site now passes: it
 * is that deleting `description` from `projectSectionDivider` ONCE turns every
 * arm below red in the same run. Three pushes that happen to agree cannot do
 * that; one path can only do that. The run is recorded on the pull request.
 *
 * WHAT EACH BLOCK READS:
 *
 *  1. `every arm carries the key` — the six call sites, each mounted through a
 *     real renderer, each reading the blurb off the divider ROW (the `<p>`
 *     inside the same `.border-b` block that carries the heading) and ⛔ never
 *     off `document.body.textContent`, which any stray render would satisfy.
 *     The sibling member `label` on the SAME section in the SAME call is the
 *     live control, so an empty blurb list can never be an instrument that sees
 *     nothing.
 *  2. `absence controls` — the same six arms with NO `description` draw their
 *     heading and no blurb, so the instrument block 1 uses is one that CAN
 *     report none.
 *  3. `the residual, recorded as readings ⛔ not rulings` — what the six arms
 *     still disagree about after the convergence: whether a divider row exists
 *     at all for a member that yields no heading. Every way of collapsing that
 *     disagreement moves the ADR-0089 `visibleWhen` predicate or the
 *     objectui#6236 membership claim off a row that carries them today, so it
 *     is handed back rather than decided — `SectionDividerGate` in
 *     `fieldGroups.ts` carries the argument. Pinned so the difference is a
 *     recorded fact rather than something rediscovered later.
 *  4. `reachability` — ⭐ a measurement that narrows the hand-back: on the
 *     DERIVED route the gate divergence is not author-reachable at all, because
 *     `deriveFieldGroupSections` defaults a group's label to its key, so a
 *     declared group always yields a heading. The author-reachable half of the
 *     residual is the EXPLICIT-sections route only.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from '../ObjectForm';
import { ModalForm } from '../ModalForm';
import { DrawerForm } from '../DrawerForm';

registerAllFields();

const BLURB = 'Totals as invoiced';

/** Two plain fields; the explicit-sections routes curate them by name. */
const OBJECT_SCHEMA = {
  name: 'invoice',
  fields: {
    customer: { type: 'text', label: 'Customer' },
    amount: { type: 'text', label: 'Amount' },
  },
};

/** The same object grouped by its OWN metadata — the derived-sections route. */
const groupedSchema = (group: Record<string, unknown>) => ({
  name: 'invoice',
  fieldGroups: [{ key: 'money', ...group }],
  fields: {
    customer: { type: 'text', label: 'Customer' },
    amount: { type: 'text', label: 'Amount', group: 'money' },
  },
});

const makeDataSource = (objectSchema: unknown = OBJECT_SCHEMA) =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(objectSchema),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }) as any;

/**
 * The `<form>` the arm actually mounted in the document. Modal and drawer
 * portal their bodies out of the RTL container (Radix), so every read is scoped
 * to the document's form rather than to the container, which holds none of it.
 */
async function mounted(node: React.ReactElement): Promise<HTMLElement> {
  render(node);
  let form: HTMLFormElement | null = null;
  await waitFor(() => {
    form = document.body.querySelector('form');
    if (!form) throw new Error('form not ready');
  });
  return form as unknown as HTMLElement;
}

/** The section headings actually drawn, in DOM order. */
const headings = (f: HTMLElement): string[] =>
  [...f.querySelectorAll('.border-b span')].map((el) => el.textContent ?? '');

/** The section BLURBS actually drawn, read off the divider row itself. */
const blurbs = (f: HTMLElement): string[] =>
  [...f.querySelectorAll('.border-b p')].map((el) => el.textContent ?? '');

/** The field controls actually drawn, in DOM order. */
const drawnFields = (f: HTMLElement): string[] =>
  [...f.querySelectorAll('[data-field]')].map((el) => el.getAttribute('data-field') as string);

const base = { type: 'object-form', objectName: 'invoice', mode: 'create' } as const;

/**
 * The six call sites of `projectSectionDivider`, each reached through the
 * renderer a host actually mounts. `section` is the authored member for the
 * three explicit routes; `group` is the declared `fieldGroups` entry for the
 * three derived ones — one of the two is used, never both.
 */
const ARMS: Array<{
  label: string;
  gate: string;
  mount: (member: Record<string, unknown>) => Promise<HTMLElement>;
}> = [
  {
    label: 'ObjectForm — default layout, explicit `sections` (ObjectForm.tsx)',
    gate: 'headingOrBlurb',
    mount: (section) =>
      mounted(
        <ObjectForm
          schema={{ ...base, sections: [{ ...section, fields: ['amount'] }] } as any}
          dataSource={makeDataSource()}
        />,
      ),
  },
  {
    label: 'ObjectForm — default layout, DERIVED `fieldGroups` (ObjectForm.tsx)',
    gate: 'headingOrBlurb',
    mount: (group) =>
      mounted(
        <ObjectForm schema={{ ...base } as any} dataSource={makeDataSource(groupedSchema(group))} />,
      ),
  },
  {
    label: 'ModalForm — explicit `sections`, the stacked push (ModalForm.tsx)',
    gate: 'headingOrBlurbRow',
    mount: (section) =>
      mounted(
        <ModalForm
          schema={
            {
              ...base,
              formType: 'modal',
              open: true,
              sections: [{ ...section, fields: ['amount'] }],
            } as any
          }
          dataSource={makeDataSource()}
        />,
      ),
  },
  {
    // ⭐ THE SUBJECT of objectui#9849: the one site still rebuilding the row
    // without `description` when this card was filed.
    label: 'ModalForm — DERIVED `fieldGroups`, the derived push (ModalForm.tsx)',
    gate: 'heading',
    mount: (group) =>
      mounted(
        <ModalForm
          schema={{ ...base, formType: 'modal', open: true } as any}
          dataSource={makeDataSource(groupedSchema(group))}
        />,
      ),
  },
  {
    label: 'DrawerForm — explicit `sections` (DrawerForm.tsx)',
    gate: 'always',
    mount: (section) =>
      mounted(
        <DrawerForm
          schema={
            {
              ...base,
              formType: 'drawer',
              open: true,
              sections: [{ ...section, fields: ['amount'] }],
            } as any
          }
          dataSource={makeDataSource()}
        />,
      ),
  },
  {
    label: 'DrawerForm — DERIVED `fieldGroups` (DrawerForm.tsx)',
    gate: 'heading',
    mount: (group) =>
      mounted(
        <DrawerForm
          schema={{ ...base, formType: 'drawer', open: true } as any}
          dataSource={makeDataSource(groupedSchema(group))}
        />,
      ),
  },
];

describe('objectui#9849 — one path from a section configuration to its divider row', () => {
  describe('1. every arm carries the authored blurb, because one function copies it', () => {
    for (const arm of ARMS) {
      it(`${arm.label} · gate \`${arm.gate}\``, async () => {
        const f = await arm.mount({ label: 'Money', description: BLURB });
        expect(
          headings(f),
          'the live control: the sibling member on the SAME section, in the SAME call',
        ).toEqual(['Money']);
        expect(
          blurbs(f),
          '`projectSectionDivider` is the only layer that copies this key now, so a miss here ' +
            'is a miss on every arm at once — which is the whole point of the convergence',
        ).toEqual([BLURB]);
        expect(drawnFields(f), 'and the section still draws its member').toContain('amount');
      });
    }
  });

  describe('2. absence controls — the same six arms with NO `description`', () => {
    for (const arm of ARMS) {
      it(`${arm.label}`, async () => {
        const f = await arm.mount({ label: 'Money' });
        expect(headings(f)).toEqual(['Money']);
        expect(
          blurbs(f),
          'the instrument block 1 uses can report NONE, so its hits are readings',
        ).toEqual([]);
      });
    }
  });

  describe('3. the residual after the convergence — readings, ⛔ not rulings', () => {
    // What the six call sites still disagree about is the GATE: whether a row
    // exists at all for a member that yields no heading. Collapsing it either
    // way moves the ADR-0089 predicate or the objectui#6236 membership claim
    // off a row that carries them today, which objectui#9849's dispatch fences
    // off. These three rows record the disagreement so the next seat measures
    // it instead of rediscovering it.

    it('the default arm draws a BLURB-ONLY row — no heading (objectui#9835 letter B)', async () => {
      const f = await ARMS[0].mount({ description: BLURB });
      expect(headings(f), 'no heading is authored and none is synthesised').toEqual([]);
      expect(blurbs(f)).toEqual([BLURB]);
      expect(
        f.querySelectorAll('.border-b[role="button"]').length,
        'the blurb-only row carries no collapse pair, so it is not a control',
      ).toBe(0);
      expect(drawnFields(f), 'the liveness control: the member itself still renders').toContain(
        'amount',
      );
    });

    it('the modal’s explicit arm draws ONE FULL row instead — the letter-A shape it has always had', async () => {
      const f = await ARMS[2].mount({ description: BLURB });
      expect(headings(f), 'the row is pushed, but with no label there is no heading span').toEqual(
        [],
      );
      expect(
        blurbs(f),
        '⚠️ this row also carries the ADR-0089 predicate and the objectui#6236 membership ' +
          'claim, which the default arm’s blurb-only row deliberately does not — that is the ' +
          'residual, and ⛔ it is not decided here',
      ).toEqual([BLURB]);
      expect(drawnFields(f)).toContain('amount');
    });

    it('the drawer’s explicit arm is UNGATED, so the same member renders the same blurb by a third route', async () => {
      const f = await ARMS[4].mount({ description: BLURB });
      expect(headings(f)).toEqual([]);
      expect(blurbs(f)).toEqual([BLURB]);
      expect(drawnFields(f)).toContain('amount');
    });
  });

  describe('4. reachability — the derived route’s gate is not author-reachable', () => {
    it('a declared group with a `description` and NO `label` still yields a heading, from its key', async () => {
      // ⭐ This narrows the hand-back rather than widening it.
      // `deriveFieldGroupSections` defaults a section's label to the group KEY,
      // so `if (title)` on the two derived pushes cannot fail for a declared
      // group — the only headingless derived section is the trailing ungrouped
      // bucket, which carries no `description` to lose. ⇒ the gate divergence
      // is reachable by an author only on the EXPLICIT-sections routes, which
      // is exactly where the fenced keys sit.
      const f = await ARMS[3].mount({ description: BLURB });
      expect(
        headings(f),
        'the key stands in for the missing label, so the group is never headingless',
      ).toEqual(['money']);
      expect(blurbs(f), 'and its blurb rides the same row').toEqual([BLURB]);
    });
  });
});
