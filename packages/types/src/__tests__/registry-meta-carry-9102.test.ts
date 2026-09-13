// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * THE IMPORT BOUNDARY CONVEYS THE PROTOCOL'S REGISTRY METADATA, AT BOTH SITES
 * (objectui#9102).
 *
 * objectui#9086 taught `../zod/imported-defaults.ts` to carry a node's
 * DESCRIPTION across a derivation. objectui#9102 measured the two things that
 * fix left standing:
 *
 *  1. **The carry was one key wide, and the wrong key was defended.** The
 *     boundary's docblock enshrined "the description and nothing else" on a
 *     rationale about `id` — and on this surface `id` does not occur at all,
 *     while `title` and `externalVocabulary` sit on `ZodDefault` nodes the
 *     walker unwraps. `@objectstack/spec` emits `{default, description, title,
 *     type}` for a datasource `host`; this package emitted `{description,
 *     type}`. ⭐ Narrower than the protocol on a published surface is the
 *     direction the platform has ruled against.
 *  2. **The sibling rebuild was never widened.** `../strict-authoring-face.ts`
 *     carried the identical `new Ctor({...def, ...patch})` spelling in its own
 *     local copy, and it rebuilds EVERY container it walks — so the derived
 *     strict twin dropped the descriptions this repository's own mirrors
 *     declare, wholesale.
 *
 * Both now go through one helper, `../zod/node-derivation.ts`. That sharing is
 * itself asserted below, because two copies is how the two drifted apart.
 *
 * ## What this file pins
 *
 *  1. **The zod facts the carry rests on.** If a later zod puts registry state
 *     in `def`, stops cloning on `.meta()`, or stops writing `_idmap` from
 *     `add()`, the design below changes — that must be RED here, not discovered
 *     years later by someone re-deriving it.
 *  2. **⭐ The carry set is a real bound AND the protocol fits inside it.** The
 *     vocabulary is enumerated rather than spread, so the census re-derives
 *     every registry key on every published spec subpath and fails when one is
 *     on neither the carry list nor the refusal list. Without that half, a
 *     bounded list silently re-creates the defect one key later.
 *  3. **⛔ `id` is refused, and `_idmap` is not touched.** Not "the spec happens
 *     not to use it here" — that is a fact about today's spec.
 *  4. **Both sites, re-derived.** The published spec surface for site ①, the
 *     published node face for site ②.
 *  5. **⭐ The identity property, which this fix must not buy its way past.** A
 *     subtree with no `ZodDefault` still comes back REFERENCE-EQUAL.
 *  6. **⛔ The spec's graph is not mutated.**
 *
 * Every count below carries a control that FIRES. A census that matched nothing
 * is green for reasons that have nothing to do with objectui#9102.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CARRIED_REGISTRY_META_KEYS,
  REFUSED_REGISTRY_META_KEYS,
  carryRegistryMeta,
  cloneWithDef,
} from '../zod/node-derivation.js';
import { stripImportedDefaults } from '../zod/imported-defaults.js';
import { deriveStrictAuthoringSchema } from '../strict-authoring-face.js';
import { SchemaNodeSchema } from '../zod/base.zod.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(HERE, '..');

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
const isZod = (v: unknown): v is z.ZodType =>
  v !== null && (typeof v === 'object' || typeof v === 'function') && '_zod' in (v as object);
const metaOf = (node: z.ZodType): Record<string, unknown> | undefined =>
  z.globalRegistry.get(node) as Record<string, unknown> | undefined;

/** Children of a node, labelled so a derived twin's matching child can be found. */
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

const reaches = (root: z.ZodType, type: string): boolean => {
  const seen = new Set<z.ZodType>();
  const stack = [root];
  let budget = 20_000;
  while (stack.length && budget-- > 0) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    if (defOf(n).type === type) return true;
    for (const [, c] of childrenOf(n)) stack.push(c);
  }
  return false;
};

/**
 * The import boundary's SECOND identity-property exception, carried by
 * objectui#9088 and deliberately not repaired here: zod spells "no rest
 * element" as `def.rest === null`, the walker compares it against `undefined`,
 * so every rest-less tuple is rebuilt whether or not anything changed beneath
 * it. Excused below exactly as the objectui#9034 pin excuses it.
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

/* ── the published spec surface, read out of the spec's own `exports` map ──── */

interface Census {
  subpathsDeclared: number;
  subpathsLoaded: number;
  loadFailures: string[];
  roots: [string, z.ZodType][];
  /** Every registry key seen on the surface -> how many distinct nodes carry it. */
  keyPopulation: Map<string, number>;
  /** Nodes carrying a key other than `description`, by the path they were found at. */
  nonDescriptionNodes: string[];
  /** Nodes carrying a non-`description` key that are CALLABLE — see the carry's fallback note. */
  callableNonDescriptionNodes: string[];
  /** Rebuilt nodes whose carried keys survived, and those that did not. */
  rebuiltWithMeta: number;
  rebuiltWithMetaKept: number;
  rebuiltWithMetaLost: string[];
  nodesVisited: number;
}

/**
 * Built at MODULE SCOPE, not in a `beforeAll`. The census dynamically imports
 * every published spec subpath, and a cold Vite transform inside a hook is
 * billed to `hookTimeout`, so the test would pass or fail on machine load
 * rather than on the code it covers. At module scope the same cost lands in the
 * import phase, which no timeout applies to — which is also what the
 * `object-ui/no-dynamic-import-in-test-hook` rule enforces.
 */
const buildCensus = async (): Promise<Census> => {
  const pkg = (await import('@objectstack/spec/package.json', { with: { type: 'json' } })) as {
    default: { exports: Record<string, unknown> };
  };
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

  const keyPopulation = new Map<string, number>();
  const nonDescriptionNodes: string[] = [];
  const callableNonDescriptionNodes: string[] = [];
  const seenKeys = new Set<z.ZodType>();
  let nodesVisited = 0;

  const censusKeys = (node: z.ZodType, path: string, depth: number): void => {
    if (depth > 60 || seenKeys.has(node)) return;
    seenKeys.add(node);
    nodesVisited++;
    const meta = metaOf(node);
    if (meta) {
      for (const key of Object.keys(meta)) keyPopulation.set(key, (keyPopulation.get(key) ?? 0) + 1);
      if (Object.keys(meta).some((k) => k !== 'description')) {
        nonDescriptionNodes.push(path);
        if (typeof node === 'function') callableNonDescriptionNodes.push(path);
      }
    }
    for (const [label, c] of childrenOf(node)) censusKeys(c, `${path}${label}`, depth + 1);
  };
  for (const [name, root] of roots) censusKeys(root, name, 0);

  // The differential: every node the walk REBUILT, against its source.
  let rebuiltWithMeta = 0;
  let rebuiltWithMetaKept = 0;
  const rebuiltWithMetaLost: string[] = [];
  const seenPair = new Set<z.ZodType>();
  const pair = (before: z.ZodType, after: z.ZodType, path: string, depth: number): void => {
    if (depth > 60 || seenPair.has(before)) return;
    seenPair.add(before);
    if (before === after) return;

    const bd = defOf(before);
    const bm = metaOf(before) ?? {};
    const am = (isZod(after) ? metaOf(after) : undefined) ?? {};
    const carriedKeys = Object.keys(bm).filter((k) => CARRIED_REGISTRY_META_KEYS.includes(k));
    if (carriedKeys.length) {
      rebuiltWithMeta++;
      if (carriedKeys.every((k) => JSON.stringify(am[k]) === JSON.stringify(bm[k]))) rebuiltWithMetaKept++;
      else rebuiltWithMetaLost.push(`${path} [${bd.type}] ${JSON.stringify(bm)} -> ${JSON.stringify(am)}`);
    }

    if (bd.type === 'default') {
      const ad = isZod(after) ? defOf(after) : undefined;
      const inner = bd.innerType!;
      if (ad?.type === 'optional' && ad.innerType) pair(inner, ad.innerType, `${path}(default)`, depth + 1);
      else if (isZod(after)) pair(inner, after, `${path}(default)`, depth + 1);
      return;
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
    keyPopulation,
    nonDescriptionNodes,
    callableNonDescriptionNodes,
    rebuiltWithMeta,
    rebuiltWithMetaKept,
    rebuiltWithMetaLost,
    nodesVisited,
  };
};

const census: Census = await buildCensus();

/* ── 1. the zod facts the carry rests on ──────────────────────────────────── */

describe('the zod 4 facts the carry rests on (objectui#9102)', () => {
  it('registry metadata is NOT `def` state, so a def-copying rebuild carries none of it', () => {
    const node = z.object({ k: z.string() }).meta({ title: 'T', description: 'D', xRef: 'R' });
    expect(metaOf(node)).toMatchObject({ title: 'T', description: 'D', xRef: 'R' });
    expect(
      'title' in (defOf(node) as unknown as Record<string, unknown>),
      'zod now keeps registry metadata in `def` — the explicit carry may be redundant. Re-measure before deleting it.',
    ).toBe(false);

    const Ctor = (node as unknown as { constructor: new (d: ZodDef) => z.ZodType }).constructor;
    const raw = new Ctor({ ...defOf(node) });
    expect(
      metaOf(raw),
      'a def-copying rebuild now carries registry metadata by itself — `carryRegistryMeta` may be redundant',
    ).toBeUndefined();
  });

  it('⭐ `.meta()` CLONES, so carrying metadata never mutates its target', () => {
    // The whole non-mutation argument rests on this. The derived node IS one of
    // the spec's own objects on the boundary's already-optional branch, so a
    // carry that wrote in place would relabel `@objectstack/spec` for every
    // other consumer in the workspace.
    const target = z.string().optional();
    const carried = carryRegistryMeta(z.string().meta({ title: 'T' }), target);
    expect(carried).not.toBe(target);
    expect(metaOf(target), 'the target was relabelled in place').toBeUndefined();
    expect(metaOf(carried)).toMatchObject({ title: 'T' });
  });

  it('⛔ `globalRegistry.add()` writes `_idmap` when — and only when — the metadata carries an `id`', () => {
    // This is the mechanism `id` is refused on. If zod stops writing `_idmap`
    // from `add()`, the refusal is no longer load-bearing and should be
    // re-argued rather than inherited.
    const marker = `objectui-9102-idmap-${Math.random().toString(36).slice(2)}`;
    expect(z.globalRegistry._idmap.has(marker)).toBe(false);
    z.string().meta({ title: 'no id here' });
    expect(z.globalRegistry._idmap.has(marker), 'the control is not measuring what it claims').toBe(false);
    const withId = z.string().meta({ id: marker });
    expect(
      z.globalRegistry._idmap.get(marker),
      'zod no longer indexes `id` in `_idmap` — re-argue REFUSED_REGISTRY_META_KEYS rather than inheriting it',
    ).toBe(withId);
  });

  it('`globalRegistry.get()` inherits down a parent chain and declines to inherit `id`', () => {
    const marker = `objectui-9102-inherit-${Math.random().toString(36).slice(2)}`;
    const base = z.string().meta({ id: marker, title: 'T' });
    const child = base.describe('D');
    expect(metaOf(child)).toMatchObject({ title: 'T', description: 'D' });
    expect(
      metaOf(child)?.id,
      'zod now inherits `id` down a parent chain — every derived node would claim its source\'s id',
    ).toBeUndefined();
  });

  it('⚠️ `.description` and a registry lookup DISAGREE on callable JIT nodes', () => {
    // Why `carryRegistryMeta` falls back to the published accessor. A
    // `$ZodObjectJIT` node is a callable FUNCTION holding a COPY of zod's
    // `description` accessor, and that copy still reads the registry entry of
    // the object it was copied from — so a lookup keyed by the callable finds
    // nothing while the getter answers a real string. Measured on the live face
    // rather than hand-built, because the JIT path is zod's choice, not ours.
    const split: z.ZodType[] = [];
    const seen = new Set<z.ZodType>();
    const walk = (n: z.ZodType, depth: number): void => {
      if (depth > 40 || seen.has(n)) return;
      seen.add(n);
      if (typeof n === 'function' && n.description !== undefined && metaOf(n) === undefined) split.push(n);
      for (const [, c] of childrenOf(n)) walk(c, depth + 1);
    };
    walk(SchemaNodeSchema as unknown as z.ZodType, 0);
    expect(
      split.length,
      'no callable node shows the accessor/registry split any more — the `description` fallback in ' +
        '`carryRegistryMeta` may be redundant, and this control no longer fires',
    ).toBeGreaterThan(0);
    expect(split[0]!.description).toEqual(expect.any(String));
  });
});

/* ── 2. the carry set is a real bound, and the protocol fits inside it ─────── */

describe('⭐ the carry set is bounded AND complete for the protocol (objectui#9102)', () => {
  it('positive control — the census loaded a real surface, with nothing swallowed', () => {
    expect(census.loadFailures, 'a subpath failed to load and was counted as clean').toEqual([]);
    expect(census.subpathsLoaded).toBe(census.subpathsDeclared);
    expect(census.subpathsDeclared, 'the spec publishes far fewer subpaths than it did').toBeGreaterThan(12);
    expect(census.roots.length, 'no schema-shaped exports found — every count below is vacuous').toBeGreaterThan(500);
    expect(census.nodesVisited, 'the walk barely moved — every count below is vacuous').toBeGreaterThan(5_000);
  });

  it('positive control — the surface really does carry keys beyond `description`', () => {
    expect(
      census.nonDescriptionNodes.length,
      'nothing on the published spec surface carries registry metadata other than `description` — ' +
        'the whole carry set below is untested and objectui#9102 would have nothing to fix',
    ).toBeGreaterThan(0);
    expect(
      [...census.keyPopulation.keys()].filter((k) => k !== 'description').length,
      'only one distinct key beyond `description` — the enumeration is barely exercised',
    ).toBeGreaterThan(1);
  });

  it('⭐ every registry key the protocol publishes is either CARRIED or REFUSED by name', () => {
    // The half that makes a bounded list safe. A bounded carry set drops a NEW
    // key silently, which is the same "narrower than the protocol" defect
    // objectui#9102 closes, one key later. This converts that silent drop into
    // a failing gate: the day `@objectstack/spec` carries a key on neither
    // list, someone decides deliberately whether it belongs in
    // CARRIED_REGISTRY_META_KEYS.
    const classified = new Set([...CARRIED_REGISTRY_META_KEYS, ...REFUSED_REGISTRY_META_KEYS]);
    const unclassified = [...census.keyPopulation.keys()].filter((k) => !classified.has(k)).sort();
    expect(
      unclassified,
      'the protocol publishes a registry key this package neither carries nor refuses. Decide which it is ' +
        'and add it to CARRIED_REGISTRY_META_KEYS or REFUSED_REGISTRY_META_KEYS in `../zod/node-derivation.ts`.',
    ).toEqual([]);
  });

  it('⛔ `id` is refused rather than merely absent, and every carried key is really used', () => {
    expect(REFUSED_REGISTRY_META_KEYS).toContain('id');
    expect(CARRIED_REGISTRY_META_KEYS).not.toContain('id');
    // Every key on the carry list is a key the protocol actually publishes here.
    // A list that outgrew its surface reads as measured and is not.
    const unused = CARRIED_REGISTRY_META_KEYS.filter((k) => !census.keyPopulation.has(k));
    expect(
      unused,
      'a key on CARRIED_REGISTRY_META_KEYS no longer occurs anywhere on the published spec surface — ' +
        'it is being carried on a claim nothing re-derives',
    ).toEqual([]);
  });

  it('⚠️ no node carrying non-`description` metadata is a callable, so the map route reaches all of it', () => {
    // The stated limit of the carry: the published accessor covers
    // `description` only, so a callable node carrying a `title` would lose it.
    // Zero such nodes today; this is where that stops being true.
    expect(
      census.callableNonDescriptionNodes.slice(0, 10),
      'a CALLABLE node carries non-`description` registry metadata, which `carryRegistryMeta` reads through ' +
        'the registry map only — that metadata is being dropped. See the fallback note in `../zod/node-derivation.ts`.',
    ).toEqual([]);
  });
});

/* ── 3. hand-built controls, both sites, known to fire ────────────────────── */

describe('hand-built controls — each fires on the region it tests', () => {
  it('site ① — a `ZodDefault` member keeps `title` and `externalVocabulary` across the strip', () => {
    const src = z.object({
      k: z.string().default('x').meta({ description: 'D', title: 'T', externalVocabulary: 'V' }),
    });
    expect(defOf(defOf(src).shape!.k).type, 'the control does not exercise the `default` arm').toBe('default');

    const out = stripImportedDefaults(src);
    expect(defOf(defOf(out).shape!.k).type, 'the default survived the strip').not.toBe('default');
    expect(metaOf(defOf(out).shape!.k)).toMatchObject({ description: 'D', title: 'T', externalVocabulary: 'V' });
  });

  it('site ① — a rebuilt CONTAINER keeps its own metadata', () => {
    const src = z.object({ k: z.string().default('x') }).meta({ title: 'CONTAINER-T', xRef: 'CONTAINER-R' });
    const out = stripImportedDefaults(src);
    expect(out, 'the control does not exercise `cloneWithDef` — nothing was rebuilt').not.toBe(src);
    expect(metaOf(out)).toMatchObject({ title: 'CONTAINER-T', xRef: 'CONTAINER-R' });
  });

  it('site ② — a rebuilt container keeps its description and its metadata', () => {
    const src = z.object({ k: z.string().describe('LEAF') }).meta({ description: 'CONTAINER', title: 'T' });
    const out = deriveStrictAuthoringSchema(src);
    expect(out, 'the control does not exercise the rebuild — nothing was derived').not.toBe(src);
    expect(out.description).toBe('CONTAINER');
    expect(metaOf(out)).toMatchObject({ title: 'T' });
    expect(defOf(out).shape!.k.description, 'the leaf lost its own description').toBe('LEAF');
  });

  it('site ② — the `z.lazy` arm carries metadata too', () => {
    // The live population of described `z.lazy` nodes on this face is empty, so
    // this is a hand-built control rather than a census that would assert
    // nothing.
    const src = z.lazy(() => z.object({ k: z.string() })).meta({ description: 'LAZY', title: 'LT' });
    const out = deriveStrictAuthoringSchema(src);
    expect(defOf(out).type, 'the control does not exercise the `lazy` arm').toBe('lazy');
    expect(metaOf(out)).toMatchObject({ description: 'LAZY', title: 'LT' });
  });

  it('⛔ neither site emits `id`, and neither repoints `_idmap`', () => {
    const marker = `objectui-9102-carry-${Math.random().toString(36).slice(2)}`;
    const src = z.object({ k: z.string().default('x') }).meta({ id: marker, title: 'T' });
    expect(z.globalRegistry._idmap.get(marker), 'the source did not register its own id').toBe(src);

    for (const derived of [stripImportedDefaults(src), deriveStrictAuthoringSchema(src)]) {
      expect(derived, 'the control does not exercise a rebuild').not.toBe(src);
      expect(metaOf(derived)).toMatchObject({ title: 'T' });
      expect(metaOf(derived)?.id, 'a derivation emitted an `id`').toBeUndefined();
      expect(
        z.globalRegistry._idmap.get(marker),
        'the registry\'s id map now points at this package\'s derivation instead of the source',
      ).toBe(src);
    }
  });

  it('the carry INVENTS nothing where the source carried nothing', () => {
    const bare = z.string().optional();
    expect(carryRegistryMeta(z.string(), bare), 'a metadata-free source still produced a clone').toBe(bare);
    const src = z.object({ k: z.string().default('x') });
    expect(metaOf(stripImportedDefaults(src))).toBeUndefined();
  });

  it('⭐ a subtree with NO default comes back REFERENCE-EQUAL, metadata intact', () => {
    const src = z.object({ k: z.string().describe('INNER') }).meta({ title: 'IDENTITY' });
    expect(stripImportedDefaults(src)).toBe(src);
    expect(metaOf(stripImportedDefaults(src))).toMatchObject({ title: 'IDENTITY' });
  });

  it('⛔ `cloneWithDef` still preserves `def.checks` — the rule it existed for first', () => {
    const src = z.object({ k: z.string() }).refine((v) => v.k !== 'no', { message: 'refused' });
    const cloned = cloneWithDef(src, {});
    expect(cloned.safeParse({ k: 'yes' }).success).toBe(true);
    expect(cloned.safeParse({ k: 'no' }).success, 'the clone dropped a `.refine()`').toBe(false);
  });
});

/* ── 4. site ①, re-derived over the published spec surface ────────────────── */

describe('site ① — the import boundary conveys the protocol\'s metadata', () => {
  it('positive control — rebuilt nodes carrying metadata is a non-empty population', () => {
    expect(
      census.rebuiltWithMeta,
      'the walk rebuilt no node that carried carried-set metadata — the assertion below cannot fail',
    ).toBeGreaterThan(0);
  });

  it('⭐ not one rebuilt node loses a carried key', () => {
    expect(census.rebuiltWithMetaLost.slice(0, 10)).toEqual([]);
    expect(census.rebuiltWithMetaKept).toBe(census.rebuiltWithMeta);
  });

  it('⭐ the emitted surface matches the protocol on the node the card named', async () => {
    // The card's own reading, re-derived through the emitter on both sides.
    // `default` is absent on this side ON PURPOSE — that is decision batch #90,
    // and this assertion is what keeps a metadata carry from quietly undoing it.
    const { PostgresConfigSchema } = (await import('@objectstack/spec/data')) as {
      PostgresConfigSchema: z.ZodType;
    };
    const spec = z.toJSONSchema(PostgresConfigSchema, { io: 'input' }) as {
      properties: Record<string, Record<string, unknown>>;
    };
    const mirrored = z.toJSONSchema(stripImportedDefaults(PostgresConfigSchema), { io: 'input' }) as {
      properties: Record<string, Record<string, unknown>>;
    };
    expect(spec.properties.host, 'the spec no longer carries a title here — re-measure objectui#9102')
      .toMatchObject({ title: expect.any(String), description: expect.any(String) });
    expect(mirrored.properties.host).toMatchObject({
      title: spec.properties.host!.title,
      description: spec.properties.host!.description,
      type: spec.properties.host!.type,
    });
    expect(spec.properties.host, 'the control does not fire — the spec emits no default here').toHaveProperty('default');
    expect(
      mirrored.properties.host,
      'the import boundary re-emitted a `default` — decision batch #90 says this surface substitutes nothing',
    ).not.toHaveProperty('default');
  });

  it('⭐ every export with nothing to strip still comes back REFERENCE-EQUAL', () => {
    const clean = census.roots.filter(([, s]) => !reaches(s, 'default'));
    const plain = clean.filter(([, s]) => !reaches(s, 'lazy') && !hasRestlessTuple(s));
    expect(plain.length, 'no clean export free of both exceptions — this assertion is vacuous').toBeGreaterThan(50);
    const broken = plain.filter(([, s]) => stripImportedDefaults(s) !== s).map(([n]) => n);
    expect(
      broken.slice(0, 10),
      'a clean subtree was rebuilt. Carrying metadata must never rebuild a node the walk did not already rebuild.',
    ).toEqual([]);
  });

  it('⛔ the spec\'s own graph is left exactly as it was found', () => {
    const carriers = census.roots.filter(([, s]) => reaches(s, 'default'));
    expect(carriers.length, 'nothing to check — this control does not fire').toBeGreaterThan(50);
    for (const [name, schema] of carriers.slice(0, 200)) {
      const before = JSON.stringify(metaOf(schema) ?? null);
      stripImportedDefaults(schema);
      expect(reaches(schema, 'default'), `${name} was stripped IN PLACE — every other consumer sees it`).toBe(true);
      expect(JSON.stringify(metaOf(schema) ?? null), `${name} was relabelled IN PLACE`).toBe(before);
    }
  });
});

/* ── 5. site ②, re-derived over the published node face ───────────────────── */

interface FaceCensus {
  visited: number;
  described: number;
  describedKept: number;
  describedLost: string[];
}

const faceCensus = ((): FaceCensus => {
  const strict = deriveStrictAuthoringSchema(SchemaNodeSchema);
  const seen = new Set<z.ZodType>();
  let visited = 0;
  let described = 0;
  let describedKept = 0;
  const describedLost: string[] = [];
  const pair = (b: z.ZodType, a: z.ZodType, path: string, depth: number): void => {
    if (depth > 40 || seen.has(b)) return;
    seen.add(b);
    visited++;
    if (b.description !== undefined) {
      described++;
      if (isZod(a) && a.description === b.description) describedKept++;
      else describedLost.push(`${path} [${defOf(b).type}] ${JSON.stringify(b.description)}`);
    }
    const aMap = new Map(isZod(a) ? childrenOf(a) : []);
    for (const [label, child] of childrenOf(b)) {
      const twin = aMap.get(label);
      if (twin) pair(child, twin, `${path}${label}`, depth + 1);
    }
  };
  pair(SchemaNodeSchema as unknown as z.ZodType, strict as unknown as z.ZodType, '#', 0);
  return { visited, described, describedKept, describedLost };
})();

describe('site ② — the strict authoring face conveys what it derives from', () => {
  it('positive control — the face is large and really does declare descriptions', () => {
    expect(faceCensus.visited, 'the walk barely moved — the assertion below is vacuous').toBeGreaterThan(1_000);
    expect(
      faceCensus.described,
      'no described node on the node face — site ② has nothing to lose and this file cannot fail',
    ).toBeGreaterThan(500);
  });

  it('⭐ not one described node loses its description across the derivation', () => {
    // Before objectui#9102 this face kept only the descriptions on the leaves it
    // returned untouched: every container it rebuilt — which is every container
    // it walks — arrived on the twin with none.
    expect(faceCensus.describedLost.slice(0, 10)).toEqual([]);
    expect(faceCensus.describedKept).toBe(faceCensus.described);
  });

  it('⛔ the node face itself is left exactly as it was found', () => {
    const before = SchemaNodeSchema.description;
    deriveStrictAuthoringSchema(SchemaNodeSchema);
    expect(SchemaNodeSchema.description).toBe(before);
  });
});

/* ── 6. one helper, not two ───────────────────────────────────────────────── */

describe('⭐ both sites derive through ONE helper (objectui#9102)', () => {
  const read = (rel: string): string => readFileSync(join(SRC_DIR, rel), 'utf8');
  const SITES: [string, string][] = [
    ['the import boundary', 'zod/imported-defaults.ts'],
    ['the strict authoring face', 'strict-authoring-face.ts'],
  ];

  it.each(SITES)('%s imports the shared derivation helper', (_label, rel) => {
    expect(read(rel)).toMatch(/from '\.{1,2}\/?(zod\/)?node-derivation\.js'/);
  });

  it.each(SITES)('⛔ %s declares no local `cloneWithDef` of its own', (_label, rel) => {
    // The acceptance item objectui#9102 was filed on: one site was widened,
    // the other kept its copy, and the copy is invisible at every call site.
    expect(
      read(rel).match(/^\s*(const|function)\s+cloneWithDef\b/m),
      'this site re-declared its own clone helper. The metadata carry is invisible at the call site, so a ' +
        'second copy loses it again with no symptom — which is exactly how these two drifted apart.',
    ).toBeNull();
  });

  it('the shared helper is the only declaration of it in the package', () => {
    expect(read('zod/node-derivation.ts')).toMatch(/export const cloneWithDef\b/);
  });
});
