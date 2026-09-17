/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The two LOCAL mirrored-but-undeclared keys, measured per key (objectui#9729).
 *
 * ## What this file is, and ⛔ what it is not
 *
 * `MirroredUndeclared` in `zod-mirror-parity.test.ts` measures the DIRECTION —
 * a key the zod mirror states and the TypeScript twin does not — and reconciles
 * it per pair. It deliberately says nothing about what each key DOES, because
 * the remedy is a contract decision: declaring the key on the twin ENLARGES the
 * published TypeScript accept set, narrowing the mirror SHRINKS the published
 * validator's, and both move a face `@object-ui/types` already ships.
 *
 * ⛔ This file does not pick either direction, and it is ⛔ not a repair. It is
 * the per-key CONSEQUENCE the ledger's one-line entries cannot carry, recorded
 * so the at-tier contract review can read it instead of re-deriving it. Every
 * assertion below is a statement about `origin/main` as it stands; whichever
 * direction the review rules, the entries here move with it.
 *
 * ## The two keys do NOT behave the same way, and the difference is the ruling
 *
 * Both twins are hand-written interfaces, but only one of them can REFUSE:
 *
 *   - `DetailViewField` carries no index signature, so TypeScript rejects an
 *     authored `dueLike` outright (`TS2353`). The two published faces therefore
 *     actively CONTRADICT each other: the validator judges the key and keeps
 *     it, the compiler refuses the same document.
 *   - `ObjectGridSchema` extends `BaseSchema`, whose `[key: string]: any` index
 *     signature absorbs any unstated key. TypeScript neither declares nor
 *     refuses `operators`; it types it `any`. The faces do not contradict — one
 *     is simply silent, which is a weaker defect and a different decision.
 *
 * ## ⚠️ The third key the ledger groups with these two is NOT this defect
 *
 * `complex.zod.ts#DashboardConfigSchema`'s `aria` is a `z.never()` retirement
 * tombstone: it REFUSES the key by name and prints a remedy. Its consequence is
 * the OPPOSITE of the two above — they admit silently, it rejects loudly — so a
 * sweep that treats the three alike would ask a maintainer to repair something
 * already doing its job. Pinned here as the CONTRAST, by re-deriving its shape
 * rather than by citing the reading.
 *
 * ## Every zero below carries a lit control on the same instrument
 *
 * A green `safeParse` proves nothing on its own: both mirrors accept unknown
 * keys (one strips them, the other keeps them unexamined). What distinguishes a
 * MIRRORED key from an unknown one is that the mirror JUDGES it — so each key's
 * pin is paired with an unrecognised-key control parsed through the same schema.
 */

import { describe, it, expect } from 'vitest';
import { DetailViewFieldSchema } from '../zod/views.zod.js';
import { ObjectGridSchema } from '../zod/objectql.zod.js';
import { DashboardConfigSchema } from '../zod/complex.zod.js';
import type { DetailViewField } from '../views.js';
import type { ObjectGridSchema as ObjectGridSchemaType } from '../objectql.js';

/** A control key no surface in this package declares. */
const UNKNOWN_KEY = 'zzzNotAKeyAnySurfaceDeclares9729';

describe('views.zod.ts#DetailViewFieldSchema — `dueLike`', () => {
  it('the mirror JUDGES the key, while an unknown key is stripped unexamined', () => {
    const judged = DetailViewFieldSchema.safeParse({ name: 'end_date', dueLike: true });
    expect(judged.success).toBe(true);
    // KEPT, not stripped — the mirror states it.
    expect(judged.success && judged.data).toMatchObject({ dueLike: true });

    // LIT CONTROL, same schema, same document shape: an unstated key survives
    // the parse and is GONE from the output. So "green" is not the evidence —
    // the key surviving into `data` is.
    const control = DetailViewFieldSchema.safeParse({ name: 'end_date', [UNKNOWN_KEY]: true });
    expect(control.success).toBe(true);
    expect(control.success && Object.keys(control.data)).not.toContain(UNKNOWN_KEY);
  });

  it('the mirror refuses a wrong-typed `dueLike` BY NAME', () => {
    const r = DetailViewFieldSchema.safeParse({ name: 'end_date', dueLike: 'yes' });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues.map((i) => i.path.join('.'))).toContain('dueLike');
  });
});

describe('objectql.zod.ts#ObjectGridSchema — `operators`', () => {
  it('the mirror JUDGES the key, while an unknown key is kept unexamined', () => {
    const judged = ObjectGridSchema.safeParse({
      type: 'object-grid',
      objectName: 'probe',
      operators: { name: ['equals'] },
    });
    expect(judged.success).toBe(true);

    // LIT CONTROL: this mirror's base passes unknown keys THROUGH, so an
    // unstated key is kept as-is and is never type-checked. The distinguishing
    // evidence for a mirrored key is therefore the refusal below, not the pass.
    const control = ObjectGridSchema.safeParse({
      type: 'object-grid',
      objectName: 'probe',
      [UNKNOWN_KEY]: 42,
    });
    expect(control.success).toBe(true);
  });

  it('the mirror refuses a wrong-typed `operators` BY NAME, and ignores the control', () => {
    const judged = ObjectGridSchema.safeParse({
      type: 'object-grid',
      objectName: 'probe',
      operators: 42,
    });
    expect(judged.success).toBe(false);
    expect(!judged.success && judged.error.issues.map((i) => i.path.join('.'))).toContain('operators');

    const control = ObjectGridSchema.safeParse({
      type: 'object-grid',
      objectName: 'probe',
      [UNKNOWN_KEY]: 42,
    });
    expect(control.success).toBe(true);
  });
});

describe('complex.zod.ts#DashboardConfigSchema — `aria` is the CONTRAST, not the defect', () => {
  it('REFUSES the key by name and names a remedy — the opposite consequence', () => {
    const r = DashboardConfigSchema.safeParse({ aria: { label: 'x' } });
    expect(r.success).toBe(false);
    const issue = !r.success ? r.error.issues.find((i) => i.path.join('.') === 'aria') : undefined;
    expect(issue).toBeDefined();
    // The remedy travels with the refusal. Asserted as the leading token rather
    // than the whole sentence: the wording is the contract here, the prose that
    // follows it is not.
    expect(String(issue?.message)).toContain('RETIRED');

    // LIT CONTROL on the same schema: an unrecognised key is NOT refused, so
    // the refusal above is BY NAME and not a strictness the whole object has.
    const control = DashboardConfigSchema.safeParse({ [UNKNOWN_KEY]: true });
    expect(control.success).toBe(true);
  });

  it('a document that omits the key stays green — a tombstone gates nothing else', () => {
    expect(DashboardConfigSchema.safeParse({ showHeader: true }).success).toBe(true);
  });
});

/* ── The TypeScript side, where the two keys stop behaving alike ───────────── */

/**
 * `DetailViewField` REFUSES `dueLike`. The `@ts-expect-error` below IS the
 * assertion: it fails the package's `tsc -p tsconfig.test.json` leg in both
 * directions — if the key stops being refused (someone declares it on the twin,
 * which is one of the two remedies under review) the directive becomes unused
 * and TypeScript reports it.
 */
// @ts-expect-error objectui#9729 — `dueLike` is not a member of `DetailViewField`.
export const authoredDueLike: DetailViewField = { name: 'end_date', dueLike: true };

/** LIT CONTROL: a key the twin DOES declare is accepted on the same literal. */
export const authoredCurrency: DetailViewField = { name: 'end_date', currency: 'USD' };

/**
 * `ObjectGridSchema` does NOT refuse `operators` — and the absence of a
 * `@ts-expect-error` here is the measurement, not an omission: adding one
 * reddens the same type-check leg as unused, which is how this claim fails if
 * the twin ever loses `BaseSchema`'s index signature.
 */
export const authoredOperators: ObjectGridSchemaType = {
  type: 'object-grid',
  objectName: 'probe',
  operators: { name: ['equals'] },
};

describe('the TypeScript twins', () => {
  it('are compiled by this package’s type-check leg, which is where the two directives above are read', () => {
    // The runtime here only keeps the three bindings alive; the assertions that
    // matter are the directives, and `tsc -p tsconfig.test.json` is the reader.
    expect([authoredDueLike, authoredCurrency, authoredOperators]).toHaveLength(3);
  });
});
