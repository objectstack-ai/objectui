// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * THE IMPORT BOUNDARY CONVEYS THE PROTOCOL'S OWN GUIDANCE (objectui#9034).
 *
 * `../zod/imported-defaults.ts` promises "the same keys, the same checks, the
 * same descriptions and the same accept set". The description half was the one
 * that was NOT true: measured across `@objectstack/spec` 17.4.0, 2024 of the
 * 2024 described `ZodDefault` nodes reachable from the published surface came
 * back with no description at all, and 1364 described CONTAINER nodes lost
 * theirs as well. Zero survived either way.
 *
 * ## Why it was two losses with one cause, and why the cause is not obvious
 *
 * A zod 4 description is NOT `def` state. `.describe(d)` stores `{description: d}`
 * in `z.globalRegistry` — a WeakMap keyed by the NODE — and the `description`
 * getter reads back through `_zod.parent`, a link only zod's own `clone()`
 * sets. So:
 *
 *  - `.removeDefault()` returns the INNER node, which never carried the outer
 *    node's registry entry. The protocol spells its guidance
 *    `.default(v).describe(d)`, so `d` sat on the node that was discarded.
 *  - `cloneWithDef` builds `new Ctor({...def})`. It copies `def` faithfully —
 *    `def.checks` above all, which is what it exists for — and copies the
 *    description NOT AT ALL, because the description was never in `def`.
 *
 * The module's `lazy` arm already named description loss as the defect it
 * guards against, and named `cloneWithDef` as the guard. That sentence was half
 * wrong: the clone rule saves `def.checks`, and did not save the description.
 *
 * ## What this file pins
 *
 *  1. **The zod facts the fix rests on.** If a later zod propagates the
 *     description through `.removeDefault()`, or puts it back in `def`, the
 *     carry becomes redundant — that must be RED here, not discovered by
 *     someone re-deriving it years later.
 *  2. **The population, re-derived.** Not the number quoted above: the walk
 *     that produced it, run again, over the subpath list read out of the spec's
 *     own `exports` map so a new subpath cannot slip past unmeasured.
 *  3. **⭐ The identity property, which this fix must not buy its way past.**
 *     A subtree with no `ZodDefault` in it still comes back REFERENCE-EQUAL. A
 *     carry implemented by rebuilding nodes that did not need rebuilding would
 *     pass every value assertion in this file and break the one property batch
 *     #90's reversibility argument rests on.
 *  4. **⛔ The spec's graph is not mutated.** The carry runs 267 times on a
 *     branch whose replacement node IS one of the spec's own objects. A carry
 *     that wrote metadata in place instead of cloning would strip-and-relabel
 *     `@objectstack/spec` for every other consumer in the workspace, and every
 *     other assertion here would still be green.
 *
 * Every count below carries a control that FIRES. A differential whose two
 * sides are the same object, or a census that matched nothing, is green for
 * reasons that have nothing to do with objectui#9034.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { stripImportedDefaults } from '../zod/imported-defaults.js';

/* ── the graph reader ─────────────────────────────────────────────────────── */

interface ZodDef {
  type: string;
  shape?: Record<string, z.ZodType>;
  options?: z.ZodType[];
  items?: z.ZodType[];
  element?: z.ZodType;
  rest?: z.ZodType;
  valueType?: z.ZodType;
  left?: z.ZodType;
  right?: z.ZodType;
  in?: z.ZodType;
  out?: z.ZodType;
  innerType?: z.ZodType;
  getter?: () => z.ZodType;
}
const defOf = (node: z.ZodType): ZodDef => (node as unknown as { _zod: { def: ZodDef } })._zod.def;
const optinOf = (node: z.ZodType): string | undefined =>
  (node as unknown as { _zod: { optin?: string } })._zod.optin;
const isZod = (v: unknown): v is z.ZodType =>
  v !== null && (typeof v === 'object' || typeof v === 'function') && '_zod' in (v as object);

/** Children of a node, labelled so the stripped twin's matching child can be found. */
const childrenOf = (s: z.ZodType): [string, z.ZodType][] => {
  const d = defOf(s);
  const out: [string, z.ZodType][] = [];
  switch (d.type) {
    case 'object': for (const [k, v] of Object.entries(d.shape ?? {})) out.push([`.${k}`, v]); break;
    case 'union': (d.options ?? []).forEach((o, i) => out.push([`|${i}`, o])); break;
    case 'array': if (d.element) out.push(['[]', d.element]); break;
    case 'tuple':
      (d.items ?? []).forEach((it, i) => out.push([`[${i}]`, it]));
      if (d.rest) out.push(['[...]', d.rest]);
      break;
    case 'record': if (d.valueType) out.push(['{}', d.valueType]); break;
    case 'intersection':
      if (d.left) out.push(['&L', d.left]);
      if (d.right) out.push(['&R', d.right]);
      break;
    case 'pipe':
      if (d.in) out.push(['>in', d.in]);
      if (d.out) out.push(['>out', d.out]);
      break;
    case 'lazy': if (d.getter) out.push(['~lazy', d.getter()]); break;
    case 'default': case 'optional': case 'nullable':
    case 'nonoptional': case 'readonly': case 'catch':
      if (d.innerType) out.push([`(${d.type})`, d.innerType]);
      break;
    default: break;
  }
  return out;
};

/**
 * Does a node of this `type` live in the subtree? Used to split the population.
 *
 * ⚠️ Stops at a `z.lazy` when looking FOR one, and forces the getter otherwise —
 * a recursive spec subtree whose getter builds a fresh graph per call defeats
 * the seen-set, so the node budget is the real terminator.
 */
const reaches = (root: z.ZodType, type: string): boolean => {
  const seen = new Set<z.ZodType>();
  const stack = [root];
  let budget = 20_000;
  while (stack.length && budget-- > 0) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    if (defOf(n).type === type) return true;
    if (defOf(n).type === 'lazy' && type === 'lazy') return true;
    for (const [, c] of childrenOf(n)) stack.push(c);
  }
  return false;
};
const hasDefault = (root: z.ZodType): boolean => reaches(root, 'default');
const hasLazy = (root: z.ZodType): boolean => reaches(root, 'lazy');

/**
 * Does the subtree hold a tuple with no rest element?
 *
 * ⚠️ The walker's SECOND identity-property exception, and unlike the `lazy` one
 * it is not deliberate — it is a defect this file measured and objectui#9035
 * carries. Zod spells "no rest element" as `def.rest === null`, and the `tuple`
 * arm compares that against the `undefined` its own `def.rest ? … : undefined`
 * produces, so `null === undefined` is false and EVERY rest-less tuple is
 * rebuilt whether or not anything beneath it changed. Reproduced in two lines:
 * `stripImportedDefaults(z.tuple([z.number(), z.number()]))` is not identity.
 *
 * ⛔ Carved out here, NOT fixed here: repairing it moves the reference identity
 * of published mirror bindings, which is its own contract-surface change and
 * belongs in its own review. The carve-out is exact — the assertion below still
 * goes red if anything OUTSIDE these two exceptions is rebuilt.
 */
const hasRestlessTuple = (root: z.ZodType): boolean => {
  const seen = new Set<z.ZodType>();
  const stack = [root];
  let budget = 20_000;
  while (stack.length && budget-- > 0) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    const d = defOf(n);
    if (d.type === 'tuple' && (d as { rest?: unknown }).rest !== undefined && d.rest === null) return true;
    if (d.type === 'lazy') continue;
    for (const [, c] of childrenOf(n)) stack.push(c);
  }
  return false;
};

/* ── the population, read out of the spec's own `exports` map ─────────────── */

interface Census {
  subpathsDeclared: number;
  subpathsLoaded: number;
  loadFailures: string[];
  roots: [string, z.ZodType][];
  nodesVisited: number;
  referenceEqualNodes: number;
  describedDefaults: number;
  describedDefaultsKept: number;
  describedDefaultsLost: string[];
  alreadyOptionalInner: number;
  rebuiltDescribed: number;
  rebuiltDescribedLost: string[];
}

/**
 * Built at MODULE SCOPE, not in a `beforeAll`.
 *
 * The census dynamically imports every published spec subpath, and a cold Vite
 * transform inside a hook is billed to `hookTimeout` — so the test would pass
 * or fail on machine load rather than on the code it covers. At module scope
 * the same cost lands in the import phase, which no timeout applies to. The
 * `object-ui/no-dynamic-import-in-test-hook` lint rule enforces exactly this.
 */
const buildCensus = async (): Promise<Census> => {
  const pkg = (await import('@objectstack/spec/package.json', { with: { type: 'json' } })) as {
    default: { exports: Record<string, unknown> };
  };
  // Every subpath the spec publishes, minus the two that are not modules. Read
  // rather than listed, so a subpath added upstream is measured or RED.
  const subpaths = Object.keys(pkg.default.exports).filter(
    (k) => k !== './package.json' && k !== './openapi.json',
  );

  const loadFailures: string[] = [];
  const roots: [string, z.ZodType][] = [];
  let subpathsLoaded = 0;
  for (const sp of subpaths) {
    const specifier = sp === '.' ? '@objectstack/spec' : `@objectstack/spec/${sp.slice(2)}`;
    let mod: Record<string, unknown>;
    try {
      mod = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
    } catch (err) {
      loadFailures.push(`${specifier}: ${String(err).split('\n')[0]}`);
      continue;
    }
    subpathsLoaded++;
    for (const [name, value] of Object.entries(mod)) {
      if (isZod(value)) roots.push([`${specifier}#${name}`, value]);
    }
  }

  let nodesVisited = 0;
  let referenceEqualNodes = 0;
  let describedDefaults = 0;
  let describedDefaultsKept = 0;
  let alreadyOptionalInner = 0;
  let rebuiltDescribed = 0;
  const describedDefaultsLost: string[] = [];
  const rebuiltDescribedLost: string[] = [];
  const seen = new Set<z.ZodType>();

  const pair = (before: z.ZodType, after: z.ZodType, path: string, depth: number): void => {
    if (depth > 60 || seen.has(before)) return;
    seen.add(before);
    nodesVisited++;
    if (before === after) { referenceEqualNodes++; return; }

    const bd = defOf(before);
    const bDesc = before.description;
    const aDesc = isZod(after) ? after.description : undefined;

    if (bd.type === 'default') {
      if (bDesc !== undefined) {
        describedDefaults++;
        if (aDesc === bDesc) describedDefaultsKept++;
        else describedDefaultsLost.push(`${path} :: ${JSON.stringify(bDesc)} -> ${JSON.stringify(aDesc)}`);
        const removed = (before as unknown as { removeDefault: () => z.ZodType }).removeDefault();
        if (optinOf(removed) === 'optional') alreadyOptionalInner++;
      }
      const ad = isZod(after) ? defOf(after) : undefined;
      const inner = bd.innerType!;
      if (ad?.type === 'optional' && ad.innerType) pair(inner, ad.innerType, `${path}(default)`, depth + 1);
      else if (isZod(after)) pair(inner, after, `${path}(default)`, depth + 1);
      return;
    }

    if (bDesc !== undefined) {
      rebuiltDescribed++;
      if (aDesc !== bDesc) {
        rebuiltDescribedLost.push(`${path} [${bd.type}] :: ${JSON.stringify(bDesc)} -> ${JSON.stringify(aDesc)}`);
      }
    }

    const aMap = new Map(isZod(after) ? childrenOf(after) : []);
    for (const [label, child] of childrenOf(before)) {
      const twin = aMap.get(label);
      if (twin) pair(child, twin, `${path}${label}`, depth + 1);
    }
  };

  for (const [name, root] of roots) pair(root, stripImportedDefaults(root), name, 0);

  return {
    subpathsDeclared: subpaths.length,
    subpathsLoaded,
    loadFailures,
    roots,
    nodesVisited,
    referenceEqualNodes,
    describedDefaults,
    describedDefaultsKept,
    describedDefaultsLost,
    alreadyOptionalInner,
    rebuiltDescribed,
    rebuiltDescribedLost,
  };
};

const census: Census = await buildCensus();

/* ── 1. the zod facts the fix rests on ────────────────────────────────────── */

describe('the zod 4 facts that make the carry necessary (objectui#9034)', () => {
  const described = z.string().default('x').describe('DESC');

  it('a description is registry state, NOT `def` state', () => {
    expect(described.description).toBe('DESC');
    expect(
      'description' in (defOf(described) as unknown as Record<string, unknown>),
      'zod now keeps the description in `def` — `cloneWithDef` may carry it on its own and ' +
        '`withDescriptionOf` in `../zod/imported-defaults.ts` may be redundant. Re-measure before deleting it.',
    ).toBe(false);
  });

  it('⭐ `.removeDefault()` does NOT propagate the description to the unwrapped node', () => {
    // The whole card rests on this. If a later zod propagates it, the `default`
    // arm's carry is a no-op rather than a fix, and this test says so first.
    expect(
      (described as unknown as { removeDefault: () => z.ZodType }).removeDefault().description,
      'zod now propagates the description through `.removeDefault()` — re-measure objectui#9034',
    ).toBeUndefined();
  });

  it('⭐ a raw `new Ctor({...def})` rebuild — what `cloneWithDef` does — drops the description', () => {
    // The firing control for the SECOND half of the defect: the clone rule
    // preserves `def.checks` and preserved nothing about the description, which
    // is why `cloneWithDef` has to ask for it explicitly.
    const node = z.object({ k: z.string() }).describe('CONTAINER');
    const Ctor = (node as unknown as { constructor: new (d: ZodDef) => z.ZodType }).constructor;
    const raw = new Ctor({ ...defOf(node) });
    expect(node.description).toBe('CONTAINER');
    expect(
      raw.description,
      'a def-copying rebuild now carries the description by itself — `withDescriptionOf` may be redundant',
    ).toBeUndefined();
  });

  it('`.describe()` CLONES, so carrying a description never mutates its target', () => {
    const target = z.string().optional();
    const carried = target.describe('CARRIED');
    expect(carried).not.toBe(target);
    expect(target.description).toBeUndefined();
    expect(carried.description).toBe('CARRIED');
  });
});

/* ── 2. hand-built controls, both halves, known to fire ───────────────────── */

describe('hand-built controls — each fires on the region it tests', () => {
  it('a described `ZodDefault` member keeps its description across the strip', () => {
    const src = z.object({ k: z.string().default('x').describe('MEMBER-DESC') });
    expect(defOf(defOf(src).shape!.k).type, 'the control does not exercise the `default` arm').toBe('default');
    expect(defOf(src).shape!.k.description).toBe('MEMBER-DESC');

    const out = stripImportedDefaults(src);
    expect(defOf(out).shape!.k.description).toBe('MEMBER-DESC');
    expect(defOf(defOf(out).shape!.k).type, 'the default survived the strip').not.toBe('default');
    expect(optinOf(defOf(out).shape!.k), 'the member stopped being omissible').toBe('optional');
  });

  it('a described CONTAINER rebuilt because of a default beneath it keeps its description', () => {
    const src = z.object({ k: z.string().default('x') }).describe('CONTAINER-DESC');
    const out = stripImportedDefaults(src);
    expect(out, 'the control does not exercise `cloneWithDef` — nothing was rebuilt').not.toBe(src);
    expect(out.description).toBe('CONTAINER-DESC');
  });

  it('the `.optional().default()` spelling keeps the OUTER description and clones its replacement', () => {
    // The 267-node branch: `.removeDefault()` hands back a node that is already
    // omissible, so the replacement IS the inner node. Carrying by mutation
    // there would relabel the caller's own object.
    const inner = z.string().optional();
    const src = z.object({ k: inner.default('x').describe('OUTER-DESC') });
    const out = stripImportedDefaults(src);
    expect(defOf(out).shape!.k.description).toBe('OUTER-DESC');
    expect(defOf(out).shape!.k, 'the replacement IS the caller\'s node — a carry here would mutate it').not.toBe(inner);
    expect(inner.description, 'the caller\'s node was relabelled in place').toBeUndefined();
  });

  it('the strip INVENTS no description where the source had none', () => {
    const src = z.object({ k: z.string().describe('INNER-ONLY').optional().default('x') });
    expect(defOf(src).shape!.k.description, 'the control is not testing what it claims').toBeUndefined();
    expect(defOf(stripImportedDefaults(src)).shape!.k.description).toBeUndefined();
  });

  it('⭐ a described subtree with NO default comes back REFERENCE-EQUAL, description intact', () => {
    const src = z.object({ k: z.string().describe('INNER') }).describe('IDENTITY');
    expect(stripImportedDefaults(src)).toBe(src);
    expect(stripImportedDefaults(src).description).toBe('IDENTITY');
  });
});

/* ── 3. the published spec surface, re-derived ────────────────────────────── */

describe('every described node survives the boundary, across the whole published spec surface', () => {
  it('positive control — the census loaded a real surface, with nothing swallowed', () => {
    expect(census.loadFailures, 'a subpath failed to load and was counted as clean').toEqual([]);
    expect(census.subpathsLoaded).toBe(census.subpathsDeclared);
    expect(census.subpathsDeclared, 'the spec publishes far fewer subpaths than it did').toBeGreaterThan(12);
    expect(census.roots.length, 'no schema-shaped exports found — every count below is vacuous').toBeGreaterThan(500);
    expect(census.nodesVisited, 'the walk barely moved — every count below is vacuous').toBeGreaterThan(5_000);
  });

  it('positive control — the described-default population is large and the branch is exercised', () => {
    expect(
      census.describedDefaults,
      'no described `ZodDefault` reached the boundary — the assertion below cannot fail',
    ).toBeGreaterThan(500);
    expect(
      census.alreadyOptionalInner,
      'the `.optional().default()` branch was never taken — its non-mutation is untested',
    ).toBeGreaterThan(0);
    expect(
      census.rebuiltDescribed,
      'no described container was rebuilt — `cloneWithDef`\'s carry is untested',
    ).toBeGreaterThan(200);
  });

  it('⭐ not one described `ZodDefault` loses its description', () => {
    expect(census.describedDefaultsLost.slice(0, 10)).toEqual([]);
    expect(census.describedDefaultsKept).toBe(census.describedDefaults);
  });

  it('⭐ not one rebuilt container loses its description', () => {
    expect(census.rebuiltDescribedLost.slice(0, 10)).toEqual([]);
  });
});

/* ── 4. the identity property, and the spec's graph left alone ────────────── */

describe('the carry buys nothing at the identity property\'s expense', () => {
  it('positive control — the population SPLITS, so neither branch below is vacuous', () => {
    const withDefault = census.roots.filter(([, s]) => hasDefault(s));
    const withNone = census.roots.filter(([, s]) => !hasDefault(s));
    expect(withDefault.length, 'nothing carries a default — the carry is untested').toBeGreaterThan(50);
    expect(withNone.length, 'everything carries a default — the identity half is untested').toBeGreaterThan(50);
  });

  it('⭐ every export with nothing to strip comes back REFERENCE-EQUAL', () => {
    // The walker's ONE documented exception is the `lazy` arm: it cannot answer
    // "was anything stripped below me?" without forcing the getter, so it always
    // rebuilds. That exception is measured separately below rather than folded
    // into this set, so it can neither hide a regression nor grow unnoticed.
    const clean = census.roots.filter(([, s]) => !hasDefault(s));
    const plain = clean.filter(([, s]) => !hasLazy(s) && !hasRestlessTuple(s));
    expect(plain.length, 'no clean export free of both exceptions — this assertion is vacuous').toBeGreaterThan(50);

    const broken = plain.filter(([, s]) => stripImportedDefaults(s) !== s).map(([n]) => n);
    expect(
      broken.slice(0, 10),
      'a clean subtree was rebuilt. The identity property is batch #90\'s reversibility made literal: ' +
        'carrying a description must never rebuild a node the walk did not already rebuild.',
    ).toEqual([]);
  });

  it('the ONLY clean exports that are rebuilt are the two known exceptions', () => {
    // Pins the exception's SHAPE, not just its size: every clean export that is
    // rebuilt reaches a `z.lazy`, and every clean export behind a `z.lazy` is
    // rebuilt. A future carry that started rebuilding something else would land
    // in the first set and go red here even if the counts happened to match.
    const clean = census.roots.filter(([, s]) => !hasDefault(s));
    const behindLazy = clean.filter(([, s]) => hasLazy(s));
    const restlessTuple = clean.filter(([, s]) => !hasLazy(s) && hasRestlessTuple(s));
    expect(behindLazy.length, 'no clean export sits behind a `z.lazy` — that exception is untested').toBeGreaterThan(0);
    expect(
      restlessTuple.length,
      'no clean export holds a rest-less tuple — objectui#9035\'s carve-out below is untested, and if ' +
        'that issue has landed the carve-out should be DELETED rather than left passing vacuously',
    ).toBeGreaterThan(0);

    const excused = new Set([...behindLazy, ...restlessTuple].map(([n]) => n));
    const rebuilt = clean.filter(([, s]) => stripImportedDefaults(s) !== s).map(([n]) => n);
    expect(
      rebuilt.filter((n) => !excused.has(n)).slice(0, 10),
      'a clean export was rebuilt that is neither behind a `z.lazy` nor holding a rest-less tuple — ' +
        'that is a NEW identity-property break, outside both known exceptions',
    ).toEqual([]);
    expect(
      behindLazy.filter(([, s]) => stripImportedDefaults(s) === s).length,
      'a clean export behind a `z.lazy` came back reference-equal — the `lazy` arm no longer always ' +
        'rebuilds, so `../zod/imported-defaults.ts`\'s docblock is now wrong',
    ).toBe(0);
  });

  it('⭐ most visited nodes are reference-equal — the walk did not start rebuilding the world', () => {
    // A carry implemented by rebuilding every node on the way down would keep
    // every description and leave this ratio on the floor, with no other symptom.
    expect(census.referenceEqualNodes / census.nodesVisited).toBeGreaterThan(0.5);
  });

  it('⛔ the spec\'s own graph still carries every default AND every description', () => {
    const carriers = census.roots.filter(([, s]) => hasDefault(s));
    expect(carriers.length, 'nothing to check — this control does not fire').toBeGreaterThan(50);
    for (const [name, schema] of carriers.slice(0, 200)) {
      stripImportedDefaults(schema);
      expect(hasDefault(schema), `${name} was stripped IN PLACE — every other consumer sees it`).toBe(true);
    }
  });
});
