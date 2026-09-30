/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#9549 — `ObjectTreeSchema.filter` is declared on both faces, in the
 * shape objectui#9309 settled for `ObjectGallerySchema.filter`.
 *
 * `filter` already reached the `object-tree` node at runtime (ListView's
 * `baseProps`, and `ObjectTree` sends `$filter: schema.filter`) while neither
 * face declared it: the TS face admitted it as `any` through `BaseSchema`'s
 * index signature and the mirror kept it unjudged through `.passthrough()`.
 * Declaring it NARROWS both faces; the pins below fire in both directions.
 *
 * The owner-and-spelling census of every `filter` in `../objectql.ts` lives in
 * `object-gallery-filter-9309.test.ts` and is not repeated here.
 */
import { describe, it, expect } from 'vitest';

import { ObjectTreeSchema, ObjectGallerySchema } from '../zod/index.zod';
import type {
  ObjectTreeSchema as TsObjectTreeSchema,
  ObjectGallerySchema as TsObjectGallerySchema,
} from '../objectql';
import type { QueryParams } from '../data';

/* ── Type-level pins (invariant equality, house form) ─────────────────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
/** The canonical `any` detector: only `any` absorbs `1 &` down to something `0` extends. */
type IsAny<T> = 0 extends (1 & T) ? true : false;
/** An object with no keys is assignable to `Pick<T, K>` only when `K` is optional on `T`. */
type IsOptional<T, K extends keyof T> = Record<string, never> extends Pick<T, K> ? true : false;

/** The member IS the destination, by indexed access. */
export type _TreeFilterIsTheDestination =
  Expect<Equal<TsObjectTreeSchema['filter'], QueryParams['$filter']>>;
/** …and it is the SAME declaration the gallery settled on — no new spelling. */
export type _TreeFilterMatchesTheGallery =
  Expect<Equal<TsObjectTreeSchema['filter'], TsObjectGallerySchema['filter']>>;
export type _TreeFilterIsOptional = Expect<IsOptional<TsObjectTreeSchema, 'filter'>>;
/**
 * FIRING CONTROL: deleting the member drops the indexed access through
 * `BaseSchema`'s `[key: string]: any`, which would otherwise read as a pass.
 */
export type _TreeFilterIsNotAny = Expect<Equal<IsAny<TsObjectTreeSchema['filter']>, false>>;

/** The TS face ACCEPTS both arms of the destination… */
const treeArrayArm: TsObjectTreeSchema =
  { type: 'object-tree', objectName: 'account', filter: [['status', '=', 'active']] };
const treeRecordArm: TsObjectTreeSchema =
  { type: 'object-tree', objectName: 'account', filter: { age: { $gt: 18 } } };

// …and REFUSES what the index signature used to admit. Each directive goes
// UNUSED — TS2578, a hard type-check failure — the moment the member is removed.
// @ts-expect-error — `filter` is `QueryParams['$filter']`; a string clause is neither arm
const treeStringFilter: TsObjectTreeSchema = { type: 'object-tree', objectName: 'account', filter: 'stage=won' };
// @ts-expect-error — `filter` is `QueryParams['$filter']`; a number is neither arm
const treeNumberFilter: TsObjectTreeSchema = { type: 'object-tree', objectName: 'account', filter: 42 };

/** The objectui#7927 ceiling is unchanged: a misspelled key still resolves to `any`. */
export type _MisspellingStillAdmitted = Expect<IsAny<TsObjectTreeSchema['filtr']>>;

/* ── The mirror, at runtime ───────────────────────────────────────────────── */

const NODE = { type: 'object-tree', objectName: 'account' } as const;

describe('objectui#9549 — the tree mirror refuses what the declaration refuses', () => {
  it('declares `filter` in its own shape', () => {
    expect(Object.keys(ObjectTreeSchema.shape)).toContain('filter');
  });

  it('accepts both arms of the destination', () => {
    expect(ObjectTreeSchema.safeParse({ ...NODE, filter: [['status', '=', 'active']] }).success).toBe(true);
    expect(ObjectTreeSchema.safeParse({ ...NODE, filter: { age: { $gt: 18 } } }).success).toBe(true);
  });

  it('refuses the shapes `.passthrough()` used to keep unjudged', () => {
    for (const bad of ['stage=won', 42, true]) {
      const r = ObjectTreeSchema.safeParse({ ...NODE, filter: bad });
      expect(r.success, `filter: ${JSON.stringify(bad)} should be refused`).toBe(false);
    }
  });

  it('judges every probe value exactly as the gallery mirror does', () => {
    const probes: unknown[] = [[['status', '=', 'active']], { age: { $gt: 18 } }, 'stage=won', 42, true, null];
    for (const value of probes) {
      const tree = ObjectTreeSchema.safeParse({ ...NODE, filter: value }).success;
      const gallery = ObjectGallerySchema.safeParse({ type: 'object-gallery', filter: value }).success;
      expect(tree, `filter: ${JSON.stringify(value)}`).toBe(gallery);
    }
  });

  it('CONTROL — the bare node still parses, so the refusals above are about the VALUE', () => {
    expect(ObjectTreeSchema.safeParse(NODE).success).toBe(true);
  });

  it('CONTROL — the objectui#7927 ceiling stands: a misspelled key still rides through', () => {
    expect(ObjectTreeSchema.safeParse({ ...NODE, filtr: 'stage=won' }).success).toBe(true);
  });
});

/* Keep the type-face literals referenced so `noUnusedLocals` cannot drop them. */
describe('objectui#9549 — the type-face literals above are real', () => {
  it('each literal builds a node', () => {
    for (const n of [treeArrayArm, treeRecordArm, treeStringFilter, treeNumberFilter]) {
      expect(n.type).toBe('object-tree');
    }
  });
});
