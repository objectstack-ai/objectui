/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#7561's acceptance criterion, mechanised: **same tree, swap only the
 * operator spelling, the label must appear.**
 *
 * The card measured it through the real `SchemaRenderer` and reported the two
 * columns this file re-measures rather than quotes:
 *
 *   as authored          `… Category Remove condition Price Remove condition …`
 *   operators corrected  `… Category Equals Remove condition Price Less than …`
 *
 * Three catalog entries author the spec's alias table (`eq` / `lt` / `gt`) —
 * `product-search`, `with-conditions`, and the `filter-builder` nested inside
 * `search-interface`. No `SelectItem` in the operator dropdown carries those
 * ids, and the trigger used to match its value LITERALLY against the mounted
 * items, so all three drew a blank operator cell over rows that filtered
 * correctly.
 *
 * ## Why the swap is the control and not a repair
 *
 * ⛔ No catalog data is changed to make this pass. The swap happens in memory,
 * as a CONTROL: after the repair the two columns must be the SAME text, because
 * `normalizeFilterOperator` folds `eq` and `equals` onto one operator and the
 * trigger now resolves through it. Before the repair they differ — which is
 * what makes this measurement able to fail.
 *
 * ⭐ The corrected column deliberately uses the dropdown's OWN camelCase ids
 * (`lessThan`), not the spec's canonical `less_than`: those ids are the ones
 * mounted, so the corrected column is the "what it would have looked like if
 * authored in the renderer's dialect" arm the card described. Both arms
 * rendering the same text is the claim; neither arm is a recommendation about
 * which vocabulary an author SHOULD use — that is objectui#7561's separate
 * ruling and is not decided here.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@object-ui/components';
import { SchemaRenderer, toRenderableSchema } from '@object-ui/react';
import { getExample } from '../src/index.js';

/** The three entries whose rows carry an alias-table operator. */
const AFFECTED = [
  'components-complex-filter-builder/product-search',
  'components-complex-filter-builder/search-interface',
  'components-complex-filter-builder/with-conditions',
] as const;

/**
 * The operator label each row of each entry owes, in row order. Derived by
 * hand from the entry's own `operator` plus the field's type bucket, so a
 * fixture edit that changed an operator would redden here rather than silently
 * re-baseline.
 */
const EXPECTED: Record<(typeof AFFECTED)[number], string[]> = {
  'components-complex-filter-builder/product-search': ['Equals', 'Less than', 'Greater than'],
  'components-complex-filter-builder/search-interface': ['Equals', 'Greater than'],
  'components-complex-filter-builder/with-conditions': ['Greater than', 'Equals'],
};

/** The alias spellings these entries author → the dropdown id each folds onto. */
const CORRECTION: Record<string, string> = {
  eq: 'equals',
  ne: 'notEquals',
  lt: 'lessThan',
  lte: 'lessOrEqual',
  gt: 'greaterThan',
  gte: 'greaterOrEqual',
  nin: 'notIn',
};

function asAuthored(id: (typeof AFFECTED)[number]): Record<string, unknown> {
  return getExample(id).schema as Record<string, unknown>;
}

function builderNode(doc: Record<string, unknown>): Record<string, unknown> {
  if (doc.type === 'filter-builder') return doc;
  const child = (doc.children as Record<string, unknown>[]).find(
    (c) => c.type === 'filter-builder',
  );
  if (!child) throw new Error('entry no longer carries a filter-builder');
  return child;
}

/** The same entry with ONLY the operator spellings swapped — nothing else. */
function operatorsCorrected(id: (typeof AFFECTED)[number]): Record<string, unknown> {
  const doc = asAuthored(id);
  const swap = (b: Record<string, unknown>) => {
    const group = b.value as { conditions: Record<string, unknown>[] };
    return {
      ...b,
      value: {
        ...group,
        conditions: group.conditions.map((c) => ({
          ...c,
          operator: CORRECTION[c.operator as string] ?? c.operator,
        })),
      },
    };
  };
  if (doc.type === 'filter-builder') return swap(doc);
  return {
    ...doc,
    children: (doc.children as Record<string, unknown>[]).map((c) =>
      c.type === 'filter-builder' ? swap(c) : c,
    ),
  };
}

function measure(schema: unknown) {
  const { container, unmount } = render(
    <SchemaRenderer schema={toRenderableSchema(schema as never) as never} />,
  );
  const out = {
    text: container.textContent ?? '',
    // The row's cells are `div.col-span-4`, field / operator / value in order,
    // so `nth-child(2)` is the operator cell.
    operatorTriggers: Array.from(
      container.querySelectorAll('div.col-span-4:nth-child(2) [role="combobox"]'),
    ).map((e) => e.textContent),
  };
  unmount();
  return out;
}

describe('objectui#7561 — the alias spellings the catalog authors render a label', () => {
  it.each(AFFECTED)('%s: every operator cell names its operator', (id) => {
    const m = measure(asAuthored(id));
    // Anti-vacuity first: a selector that matched nothing would make every
    // claim below trivially true.
    expect(m.operatorTriggers.length).toBe(EXPECTED[id].length);
    expect(m.operatorTriggers.length).toBeGreaterThan(0);
    expect(m.operatorTriggers).toEqual(EXPECTED[id]);
    // The symptom, stated as the user saw it: not one blank operator cell.
    expect(m.operatorTriggers.filter((t) => t === '')).toEqual([]);
  });

  it.each(AFFECTED)('%s: as authored === operators corrected (the card\'s control)', (id) => {
    const authored = measure(asAuthored(id));
    const corrected = measure(operatorsCorrected(id));
    expect(authored.text).toBe(corrected.text);
    expect(authored.operatorTriggers).toEqual(corrected.operatorTriggers);
  });

  it('the control is a real swap — it changes the tree it is given', () => {
    // Without this, a broken `operatorsCorrected` would compare each entry to
    // ITSELF and the equality above would hold for any component at all.
    for (const id of AFFECTED) {
      const before = builderNode(asAuthored(id)).value as {
        conditions: { operator: string }[];
      };
      const after = builderNode(operatorsCorrected(id)).value as {
        conditions: { operator: string }[];
      };
      const beforeOps = before.conditions.map((c) => c.operator);
      const afterOps = after.conditions.map((c) => c.operator);
      expect(afterOps).not.toEqual(beforeOps);
      // Every authored operator really is an alias-table spelling…
      expect(beforeOps.every((o) => o in CORRECTION)).toBe(true);
      // …and none of the swapped-in ids is, so the arms are genuinely two
      // different dialects of the same operators.
      expect(afterOps.some((o) => o in CORRECTION)).toBe(false);
    }
  });

  it('⛔ the catalog files themselves still author the alias table', () => {
    // The fix must NOT be achieved by editing catalog data (objectui#7561's
    // fence). If someone ever "repairs" the fixtures instead, this reddens.
    for (const id of AFFECTED) {
      const group = builderNode(asAuthored(id)).value as {
        conditions: { operator: string }[];
      };
      for (const c of group.conditions) expect(c.operator in CORRECTION).toBe(true);
    }
  });
});
