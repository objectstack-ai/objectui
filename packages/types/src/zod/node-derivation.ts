/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ONE DERIVATION RULE, SHARED BY EVERY WALKER IN THIS PACKAGE (objectui#9102).
 *
 * This package derives new zod graphs from schemas it did not author: the
 * import boundary (`./imported-defaults.ts`) strips imported defaults, and the
 * strict authoring face (`../strict-authoring-face.ts`) closes unknown keys.
 * Both do it the same way — patch a copy of a node's own `_zod.def`, call the
 * node's own constructor — and both used to carry their own copy of that
 * spelling. They carried the same defect with it, which is what objectui#9102
 * was filed about: `new Ctor({...def, ...patch})` reproduces `def` faithfully
 * and reproduces a node's REGISTRY METADATA not at all.
 *
 * ⛔ The two copies are not restored. A walker that needs a different arm
 * writes a different arm; what it may not do is write its own `cloneWithDef`,
 * because the metadata carry is invisible at the call site and a second copy
 * silently loses it again. The sibling-drift shape is exactly what
 * objectui#9086 fixed at one site and objectui#9102 found still standing at the
 * other.
 *
 * ## Why registry metadata has to be carried EXPLICITLY
 *
 * A zod 4 description is not `def` state, and neither is any other registry
 * key. Measured on zod 4.4.3: `.describe(d)` and `.meta(m)` both store their
 * argument in `z.globalRegistry` — a WeakMap keyed by the NODE — and the
 * `description` getter reads back through `_zod.parent`, a link only zod's own
 * `clone()` sets. So a node built with `new Ctor(def)` starts with NO registry
 * metadata however faithfully it copies `def`, and `.removeDefault()` hands
 * back an inner node that never carried the outer's entry to begin with. Those
 * two are the same silent loss, and this module is the one place that repairs
 * it. `../__tests__/registry-meta-carry-9102.test.ts` re-derives every zod fact
 * in this paragraph rather than trusting it.
 *
 * ## ⛔ The carry never mutates its source, and never touches `_idmap`
 *
 * `.meta()` CLONES — it is `this.clone()` followed by `globalRegistry.add(clone,
 * data)` — so the derived node may safely BE one of `@objectstack/spec`'s own
 * objects, which it is on the import boundary's already-optional branch for as
 * many nodes as the pin file counts. Writing metadata in place instead would
 * relabel `@objectstack/spec` for every other consumer in the workspace, with
 * no symptom on this side.
 *
 * `globalRegistry.add()` also writes `_idmap` — but ONLY when the metadata
 * object it is handed contains an `id`. Because the carry below is an ALLOW
 * list and `id` is not on it, no derivation in this package can reach that
 * branch: re-registering an `id` would repoint the registry's id map at this
 * package's derivation, a mutation of shared global state off a surface that
 * promises it mutates nothing.
 */

import { z } from 'zod';

/**
 * The subset of a zod def these walkers read.
 *
 * Zod does not publish `_zod.def` in its public types, and the alternative — a
 * chain of `instanceof` narrowings against 15 concrete classes — would have to
 * be rewritten whenever zod adds a wrapper. The field set is the UNION of what
 * the walkers need, so one definition serves both.
 */
export interface WalkableDef {
  type: string;
  shape?: Record<string, z.ZodType>;
  options?: z.ZodType[];
  items?: z.ZodType[];
  element?: z.ZodType;
  rest?: z.ZodType;
  valueType?: z.ZodType;
  keyType?: z.ZodType;
  left?: z.ZodType;
  right?: z.ZodType;
  in?: z.ZodType;
  out?: z.ZodType;
  innerType?: z.ZodType;
  catchall?: z.ZodType;
  getter?: () => z.ZodType;
}

interface ZodInternals {
  _zod: { def: WalkableDef; optin?: string; parent?: z.ZodType };
  constructor: new (def: WalkableDef) => z.ZodType;
}

/** Reach a node's unpublished internals. The one cast, in one place. */
export const internals = (schema: z.ZodType): ZodInternals => schema as unknown as ZodInternals;

/**
 * Is this a zod schema node?
 *
 * ⚠️ `typeof value === 'object'` is NOT the test, and writing it that way is a
 * measured coverage hole rather than a style slip. Zod 4.4.3 builds some
 * objects through `$ZodObjectJIT`, whose instances are CALLABLE — they answer
 * `typeof 'function'` and parse exactly like any other object. On both faces
 * those nodes arrive through `@objectstack/spec`-derived subtrees, so an
 * object-only guard hands each of them straight back along with the ENTIRE
 * subtree beneath it, with no symptom other than a residue count that will not
 * fall. Both walkers learnt this the hard way, separately.
 */
export const isZodType = (value: unknown): value is z.ZodType =>
  value !== null && (typeof value === 'object' || typeof value === 'function') && '_zod' in value;

/**
 * ⭐ THE CARRY SET — the registry keys a derivation in this package reproduces.
 *
 * ⛔ NOT "everything the source carries", and ⛔ not a guess. It is the
 * vocabulary `@objectstack/spec` actually publishes on the surface this package
 * imports, ENUMERATED so that widening it is a deliberate edit with a review
 * attached rather than a blast radius nobody measured. The count and the member
 * list are re-derived by `../__tests__/registry-meta-carry-9102.test.ts`, which
 * censuses every published spec subpath and goes RED the day the protocol
 * carries a key that is on neither this list nor {@link REFUSED_REGISTRY_META_KEYS}.
 *
 * ⭐ That red is the point of writing a bounded list at all. A bounded carry
 * set drops a new key SILENTLY, which is the same "narrower than the protocol"
 * defect objectui#9102 exists to close, one key later. Pairing the list with a
 * census that fails on an unclassified key converts the silent drop into a
 * failing gate, so the bound costs boundedness and not fidelity.
 */
export const CARRIED_REGISTRY_META_KEYS: readonly string[] = Object.freeze([
  'description',
  'title',
  'default',
  'externalVocabulary',
  'format',
  'xRef',
  'xExpression',
  'xEnumDeprecated',
]);

/**
 * ⛔ THE REFUSAL — registry keys a derivation in this package must never write.
 *
 * `id` is the whole list, and it is refused on a mechanism rather than on
 * taste: `globalRegistry.add(node, meta)` writes `_idmap` whenever `meta`
 * contains an `id`, so carrying one would repoint a shared, global id map at
 * this package's derived node. `globalRegistry.get()` already declines to
 * INHERIT an `id` down a parent chain for the same reason; this list is the
 * half zod cannot enforce, because an explicit carry is not an inheritance.
 *
 * ⚠️ It is refused, not absent: the pin file asserts both that no derivation
 * emits it AND that `_idmap` does not grow across a walk, because "the spec
 * happens not to use `id` here" is a fact about today's spec and not a property
 * of this module.
 */
export const REFUSED_REGISTRY_META_KEYS: readonly string[] = Object.freeze(['id']);

/**
 * Carry a source node's registry metadata onto a node derived from it.
 *
 * Returns `derived` UNCHANGED when there is nothing to carry — which is what
 * keeps the import boundary's identity property intact, and what makes this
 * safe to call on an arm whose population is empty today.
 */
export const carryRegistryMeta = (source: z.ZodType, derived: z.ZodType): z.ZodType => {
  const carried: Record<string, unknown> = {};

  const meta = z.globalRegistry.get(source);
  if (meta !== undefined) {
    for (const key of CARRIED_REGISTRY_META_KEYS) {
      if (Object.prototype.hasOwnProperty.call(meta, key) && meta[key] !== undefined) {
        carried[key] = meta[key];
      }
    }
  }

  // ⭐ `.description` IS NOT ALWAYS `z.globalRegistry.get(node).description`, and
  // the gap is the callable-JIT family again. Zod 4.4.3 defines `description` as
  // an accessor that closes over the instance it was installed on, and a
  // `$ZodObjectJIT` node is a callable FUNCTION that received a COPY of that
  // accessor — so the copy still reads the registry entry of the object it was
  // copied from, while a registry lookup keyed by the callable node itself finds
  // nothing. Measured on the strict authoring face: described objects whose
  // registry entry reads back as `undefined` through the map and as a real
  // string through the published getter.
  //
  // The published accessor is the authority for `description`, so it fills in
  // where the map is silent. ⛔ There is no equivalent route for any other key —
  // zod publishes a getter for this one only — which is why the pin file asserts
  // that no node carrying non-`description` metadata is a callable: the day one
  // is, this carry loses it and the assertion is where that shows up, rather
  // than in a consumer's emitted schema.
  if (carried.description === undefined && source.description !== undefined) {
    carried.description = source.description;
  }

  if (Object.keys(carried).length === 0) return derived;

  // `.meta()` clones, so `derived` is left exactly as it was found — including
  // when `derived` IS one of the spec's own objects. The clone's own entry is
  // `carried`; anything `derived` already carried still reads back through the
  // parent link zod's `clone()` sets, minus the `id` zod itself declines to
  // inherit.
  return derived.meta(carried);
};

/**
 * Clone one schema with a patched def, PRESERVING everything else about it.
 *
 * `def.checks` above all: ⛔ never rebuild a node with `z.object(shape)` or a
 * fresh `z.lazy(...)` instead. Those spellings keep the shape and DROP
 * `def.checks`, so every `.refine()` and `.superRefine()` installed on the way
 * down is silently lost — the import boundary would then accept documents the
 * spec refuses, and the strict authoring face would UNDER-report red, which is
 * worse than no strict face because it reads as evidence.
 *
 * And the node's registry metadata with it, via {@link carryRegistryMeta} —
 * which is the half `def` copying never covered.
 *
 * A callable JIT instance clones through its own bound constructor and comes
 * back as an ordinary object-typed instance of the same class. That is a
 * difference in representation, not in behaviour, and behaviour is what the
 * pins measure.
 */
export const cloneWithDef = (schema: z.ZodType, patch: Partial<WalkableDef>): z.ZodType => {
  const Ctor = internals(schema).constructor;
  return carryRegistryMeta(schema, new Ctor({ ...internals(schema)._zod.def, ...patch }));
};
