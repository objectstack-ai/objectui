/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8285 — `ObjectKanbanSchema.quickAdd` RETIRED on the `object-kanban`
 * arm, on BOTH faces (director-seat ruling B, decision batch #91, 2026-09-08).
 *
 * ## The defect
 *
 * The key was declared on both faces and on `@objectstack/spec`'s
 * `ComponentPropsMap['object-kanban']`, and it drew nothing: the Quick Add
 * control is gated on `quickAdd` AND a host-supplied `onQuickAdd` function, and
 * an object-bound board supplies none. The ruling retired the key rather than
 * grow a record-creation write path on the board; the spec half landed in
 * `@objectstack/spec` 17.5.0 as a tombstone, and this is the mirror half.
 *
 * ## Why a TOMBSTONE rather than a deleted member
 *
 * `BaseSchema` carries `[key: string]: any` and its mirror ends
 * `.passthrough()`, so a deleted member is KEPT, not refused. The member stays
 * declared and unwritable: `?: never` on the interface, `retirementTombstone()`
 * on the mirror — the `allowCollapse` shape next door
 * (`object-kanban-allow-collapse-retired-8801.test.ts`). "The near miss" below
 * is what separates the two outcomes on one instrument.
 *
 * The renderer half — `ObjectKanban` no longer forwards the key, and
 * `KanbanRenderer` keeps the pair for a React host — is pinned in
 * `@object-ui/plugin-kanban`'s `quickAddRetiredNotForwarded-8285.test.tsx`.
 */

import { describe, it, expect } from 'vitest';

import { ObjectKanbanSchema } from '../zod/objectql.zod';
import { safeValidateSchema } from '../zod/index.zod';
import type { ObjectKanbanSchema as TsObjectKanbanSchema } from '../objectql';

const RETIRED = 'quickAdd';
/** A near miss of the retired spelling: never declared, so it takes the OTHER path. */
const NEAR_MISS = 'quickAdded';

/** The smallest node this arm accepts; every assertion below is a delta on it. */
const NODE = { type: 'object-kanban', objectName: 'task', groupBy: 'status' } as const;

/* -------------------------------------------------------------------------- */
/* Compile-time pins — read by tsc, not by vitest (which strips types).        */
/* -------------------------------------------------------------------------- */

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
/** The canonical `any` detector: only `any` absorbs `1 &` down to something `0` extends. */
type IsAny<T> = 0 extends 1 & T ? true : false;

// The tombstone admits exactly one value — absence. Deleting the member instead
// would make this indexed access fall through the index signature to `any`.
type _RetiredIsTombstone = Assert<Equal<TsObjectKanbanSchema['quickAdd'], undefined>>;
type _RetiredIsNotAny = Assert<Equal<IsAny<TsObjectKanbanSchema['quickAdd']>, false>>;
// Non-vacuity on the same instrument: a live member resolves to its own type…
type _LiveMemberStillDeclared = Assert<Equal<TsObjectKanbanSchema['coverImageField'], string | undefined>>;
// …and the never-declared near miss does fall through to `any`.
type _NearMissFallsThroughToIndexSignature = Assert<IsAny<TsObjectKanbanSchema['quickAdded']>>;

const liveLiteral: TsObjectKanbanSchema = { ...NODE, coverImageField: 'cover' };
// This directive goes unused — and the type-check goes red with TS2578 — the
// moment the tombstone is deleted or widened back to `boolean`.
// @ts-expect-error — `quickAdd` is RETIRED on this node (objectui#8285); delete the key
const retiredLiteral: TsObjectKanbanSchema = { ...NODE, quickAdd: true };
void liveLiteral;
void retiredLiteral;

/* -------------------------------------------------------------------------- */
/* Runtime — through `safeValidateSchema`, the union the CLI applies.          */
/* -------------------------------------------------------------------------- */

interface IssueLike {
  readonly path?: readonly PropertyKey[];
  readonly message?: string;
  readonly code?: string;
  readonly errors?: readonly (readonly IssueLike[])[];
}

/** Flatten zod's nested union issues into `{ path, message, code }` rows. */
function flattenIssues(issues: readonly IssueLike[]): Array<{ path: string; message: string; code: string }> {
  return issues.flatMap((issue) => [
    { path: (issue.path ?? []).join('.'), message: issue.message ?? '', code: issue.code ?? '' },
    ...(issue.errors ?? []).flatMap((nested) => flattenIssues(nested)),
  ]);
}

function refusals(node: unknown): Array<{ path: string; message: string; code: string }> {
  const result = safeValidateSchema(node as never) as { success: boolean; error?: { issues?: readonly IssueLike[] } };
  return result.success ? [] : flattenIssues(result.error?.issues ?? []);
}

/** Refusals addressed at one key's own path. */
function atKey(node: unknown, key: string) {
  return refusals(node).filter((r) => r.path === key);
}

describe('the zod face refuses `quickAdd` BY NAME', () => {
  it('the member is still DECLARED — a tombstone, not a deletion', () => {
    const shape = (ObjectKanbanSchema as unknown as { shape: Record<string, unknown> }).shape;
    expect(Object.keys(shape)).toContain(RETIRED);
    // Control: a key this arm never declared is absent from the same shape.
    expect(Object.keys(shape)).not.toContain(NEAR_MISS);
  });

  it.each([[true], [false]])('refuses the value %p at the key\'s OWN path, as `invalid_type`', (value) => {
    const found = atKey({ ...NODE, [RETIRED]: value }, RETIRED);
    expect(found.map((f) => f.code)).toContain('invalid_type');
    // Named subjects rather than prose: the retiring card, and the component a
    // React host mounts to keep the pair — the remedy the ruling gives.
    const text = found.map((f) => f.message).join('\n');
    expect(text).toContain('objectui#8285');
    expect(text).toContain('KanbanRenderer');
  });

  it('ONE string, BOTH author-facing channels — the `.describe()` metadata is the parse message', () => {
    const shape = (ObjectKanbanSchema as unknown as { shape: Record<string, { description?: string }> }).shape;
    const described = shape[RETIRED]?.description ?? '';
    expect(described).not.toEqual('');
    expect(atKey({ ...NODE, [RETIRED]: true }, RETIRED).map((f) => f.message)).toContain(described);
  });

  it('the near miss is ACCEPTED, because this arm is not strict', () => {
    // The discriminator: an undeclared key is KEPT, which is why deleting the
    // member would have shipped the retirement as a silent accept.
    expect(atKey({ ...NODE, [NEAR_MISS]: true }, NEAR_MISS)).toEqual([]);
  });

  it('the bare node and a live member still parse — the instrument still says yes', () => {
    expect(refusals(NODE)).toEqual([]);
    expect(refusals({ ...NODE, coverImageField: 'cover' })).toEqual([]);
  });
});
