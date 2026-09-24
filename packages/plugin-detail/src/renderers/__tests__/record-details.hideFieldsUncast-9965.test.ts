/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#9965 — `record-details.tsx` read `hideFields` through
 * `(schema as any)`, the very key the mirror DECLARES
 * (`RecordDetailsComponentProps.hideFields`, `string[]`, declared by
 * objectui#9040 and aligned to `@objectstack/spec`
 * `RecordDetailsProps.hideFields`). The cast spent that declaration at the one
 * site it was added for — the same class objectui#9475 repaired one renderer
 * over, recurring here because that repair was per-FILE rather than per-CLASS.
 *
 * ## The census this card is fenced to
 *
 * The file carries SEVEN `(schema as any)` occurrences over FOUR distinct keys.
 * Exactly TWO of those occurrences read a key the mirror declares, and both are
 * `hideFields` in the highlight-dedup path. The other five read
 * `requiredPermissions`, `enforceFieldSecurity` and `redactFields` — keys the
 * mirror does NOT declare, where a cast is the honest spelling until someone
 * declares them. They are LEDGERED below with the property that makes each
 * exemption expire: the ledger asserts the key is still absent from the
 * mirror, so the day it is declared this file goes red instead of the
 * exemption quietly outliving its subject. (⚠️ The census above is this card's
 * reading, not a live one: objectui#10200 later retired both
 * `requiredPermissions` reads by maintainer ruling, and the key left the
 * ledger with them.)
 *
 * ## The three instruments, and which one actually settles it
 *
 *   - An indexed access on the TYPE (`Schema['hideFields']`) is a MEMBERSHIP
 *     question. A cast leaves membership intact, so this leg is GREEN on the
 *     defect and on the repair alike. MEASURED by this card's ablation, not
 *     assumed: re-casting the read left every type-level leg below green.
 *   - A RUNTIME assertion is green both ways too, and for a stronger reason:
 *     `as any` is erased before anything runs, so no behavioural test can tell
 *     the two sources apart. The dedup behaviour itself is already covered by
 *     `record-details.dedupeEmptinessTrims-8350.test.tsx` and
 *     `record-details.nameFieldDedupe-8175.test.tsx`; repeating it here would
 *     add a leg that cannot fail.
 *   - `getTypeAtLocation` on the READ EXPRESSION is the only instrument that
 *     reports what the read actually CARRIES. objectui#9475 named it and could
 *     not reach it from a type alias; this file reaches it by building a real
 *     `ts.Program`, the shape `scripts/__tests__/js-comment-mask-param-types-9324.test.ts`
 *     established. Measured on this site: `any` before the repair,
 *     `string[] | undefined` after.
 *
 * ## ⚠️ What the repair does NOT buy, measured rather than assumed
 *
 * `RecordDetailsRendererProps['schema']` is the mirror INTERSECTED WITH
 * `Record<string, any>`. An index signature admits any key at `any`, so a
 * MISSPELLED key still type-checks at this site even un-cast. What the un-cast
 * read buys is the declared TYPE: a wrong-typed use of the CORRECT spelling is
 * now refused. Both halves are pinned below, each with a control that varies
 * only the claim, so neither reading can rot into prose. ⛔ Narrowing that
 * index signature is a different card and is deliberately not attempted here.
 *
 * ## Both populations are DERIVED, never written down
 *
 * The mirror's declared keys are read off the renderer's own `schema` type
 * through the type checker; the contract's are read off
 * `RecordDetailsProps.shape`. A key either layer declares tomorrow joins the
 * guard without anyone editing this file.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
// ⛔ NOT `import * as` from '@objectstack/spec/ui' — the repo's
// `no-restricted-imports` rule refuses the namespace form by name, and named
// imports make the population a DECLARED set rather than "whatever the module
// happens to export". Same reasoning as `detailRendererUndeclaredKeys-8649`.
import { ComponentPropsMap, RecordDetailsProps } from '@objectstack/spec/ui';
import type { RecordDetailsComponentProps } from '@object-ui/types';
import type { RecordDetailsRendererProps } from '../record-details';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

/** Rooted at THIS file, never at `process.cwd()` — the two differ per invocation. */
const HERE = dirname(fileURLToPath(import.meta.url));
const RENDERER = join(HERE, '..', 'record-details.tsx');
const REPO_ROOT = join(HERE, '..', '..', '..', '..', '..');

/* ── Type-level legs (compiled by `tsc -p tsconfig.test.json`, erased by vitest) ── */

/** Invariant type equality. `A extends B` is NOT this: `never` and `any` pass that. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The only assertion form used here — its constraint is what refuses `false`. */
type Expect<T extends true> = T;

/* Direction proofs: a broken instrument makes THIS file red, not green. */

// @ts-expect-error objectui#9965 — `Expect` must refuse `false`. Widen its constraint and this directive goes unused (TS2578).
type _ExpectRefusesFalse = Expect<false>;

// @ts-expect-error objectui#9965 — `any` must NOT read as equal to `true`. That is the exact shape a cast produces.
type _EqualRefusesAny = Expect<Equal<any, true>>;

/** The type the renderer's own `schema` carries — the one the read goes through. */
type Schema = NonNullable<RecordDetailsRendererProps['schema']>;

/**
 * The schema type carries the declared member, not `any`. This guards the
 * ANNOTATION — the `{} as any` erasure objectui#8649 repaired, which made every
 * read in this file `any` indistinguishably.
 *
 * ⚠️ It does NOT guard the read. An indexed access on the TYPE is a MEMBERSHIP
 * question, and membership is exactly what a cast leaves intact — measured by
 * this card's ablation, which re-cast the read and watched this leg stay green
 * while the program leg and the source-text leg went red. A reader who takes
 * this leg for the guard has repeated the defect one layer up.
 */
export type _SchemaTypeCarriesTheDeclaredMember = Expect<
  Equal<Schema['hideFields'], string[] | undefined>
>;

/** And it is the MIRROR's member, not a lookalike that drifted to the same spelling. */
export type _RendererAgreesWithTheMirror = Expect<
  Equal<Schema['hideFields'], RecordDetailsComponentProps['hideFields']>
>;

/**
 * ⚠️ LEDGER — the measured limit of this repair, asserted rather than written
 * down. `Record<string, any>` in `RecordDetailsRendererProps['schema']` admits
 * a MISSPELLED key at `any`, so un-casting does not make a typo red at this
 * site. The day that intersection is narrowed, this leg goes red and the limit
 * gets re-derived instead of quietly outliving its subject.
 */
export type _MisspellingIsStillAdmittedHere = Expect<Equal<Schema['hideFeilds'], any>>;

// @ts-expect-error objectui#9965 — CONTROL for the ledger above: the MIRROR interface has no index signature, so it REFUSES the same misspelling (TS2551). This directive going unused (TS2578) means the control stopped firing and the ledger leg stopped being a reading.
type _MirrorRefusesTheMisspelling = RecordDetailsComponentProps['hideFeilds'];

/* ── The program leg: what the read CARRIES, which is the discriminating one ── */

/**
 * Casts this file still carries over a key, each with the reason it is honest.
 * ⛔ Not an opinion, and ⛔ not a list of keys to leave alone forever: every
 * entry is asserted to be ABSENT FROM THE MIRROR below, so the exemption
 * expires the moment its premise does.
 */
const HONEST_CASTS: Record<string, string> = {
  // `requiredPermissions` left this ledger with objectui#10200: the renderer no
  // longer reads it at all, so there is no cast left to call honest.
  enforceFieldSecurity:
    'the mirror declares no such key — field-level security is read off the object, not off the page block',
  redactFields:
    'the mirror declares no such key — it travels with `enforceFieldSecurity` and shares its fate',
};

interface SchemaRead {
  /** The property name read off `schema`. */
  key: string;
  /** 1-based line in the renderer, for a failure message that can be acted on. */
  line: number;
  /** Whether a cast stands between `schema` and the key. */
  cast: boolean;
  /** What `getTypeAtLocation` reports the READ EXPRESSION carries. */
  type: string;
}

interface Measurement {
  /** Every `schema.KEY` / `(schema as X).KEY` read in the renderer. */
  reads: SchemaRead[];
  /** Keys the MIRROR declares, derived from the very type the read goes through. */
  declared: string[];
  /** The index signature's value type, or null when the intersection lost it. */
  indexType: string | null;
}

/**
 * Build a real program over the renderer and measure every read off `schema`.
 *
 * ⚠️ The ROOT tsconfig, deliberately, ⛔ not this package's `tsconfig.test.json`.
 * The package config empties `paths` so `tsc` resolves `@object-ui/*` through
 * each workspace dependency's BUILT `.d.ts`; the root config maps them to
 * `src`. The test shards run `pnpm test` without building anything, so a
 * program built the package's way would find no `@object-ui/types`, read
 * `RecordDetailsComponentProps` as `any`, and report the repaired read as
 * defective. The calibration leg below is what turns that failure mode from a
 * false verdict into a named one.
 *
 * `types: []` switches off automatic `@types/*` inclusion — nothing here needs
 * a global, and the explicit imports in the renderer still resolve their own.
 */
function measure(): Measurement {
  const configPath = join(REPO_ROOT, 'tsconfig.json');
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  expect(
    read.error && ts.flattenDiagnosticMessageText(read.error.messageText, ' '),
    'the root tsconfig must parse',
  ).toBeFalsy();
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, REPO_ROOT, undefined, configPath);
  expect(parsed.options.paths?.['@object-ui/types'], 'the mirror must resolve to source').toBeTruthy();

  const program = ts.createProgram([RENDERER], {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(RENDERER);
  expect(source, 'the renderer must be a program input').toBeTruthy();

  const reads: SchemaRead[] = [];
  let schemaType: ts.Type | null = null;

  /** Unwrap parens / casts / non-null down to the identifier being read. */
  const rootOf = (node: ts.Expression): { id: ts.Identifier | null; cast: boolean } => {
    let cur: ts.Expression = node;
    let cast = false;
    for (;;) {
      if (ts.isParenthesizedExpression(cur)) { cur = cur.expression; continue; }
      if (ts.isNonNullExpression(cur)) { cur = cur.expression; continue; }
      if (ts.isSatisfiesExpression(cur)) { cur = cur.expression; continue; }
      if (ts.isAsExpression(cur) || ts.isTypeAssertionExpression(cur)) {
        cast = true;
        cur = cur.expression;
        continue;
      }
      break;
    }
    return { id: ts.isIdentifier(cur) ? cur : null, cast };
  };

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) {
      const { id, cast } = rootOf(node.expression);
      if (id && id.text === 'schema') {
        if (!schemaType) schemaType = checker.getTypeAtLocation(id);
        reads.push({
          key: node.name.text,
          line: source!.getLineAndCharacterOfPosition(node.getStart(source!)).line + 1,
          cast,
          type: checker.typeToString(checker.getTypeAtLocation(node)),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source!);

  const resolved: ts.Type | null = schemaType;
  const declared = resolved ? checker.getPropertiesOfType(resolved).map((s) => s.name).sort() : [];
  const indexInfo = resolved ? checker.getIndexInfoOfType(resolved, ts.IndexKind.String) : undefined;
  return { reads, declared, indexType: indexInfo ? checker.typeToString(indexInfo.type) : null };
}

/**
 * Built once, LAZILY — a program over this renderer pulls in several hundred
 * files, and building it at module scope would report a calibration failure as
 * a collection error instead of as the named test that checks for it.
 */
let memo: Measurement | null = null;
const measurement = (): Measurement => (memo ??= measure());

describe('objectui#9965 — the instrument is calibrated before it is believed', () => {
  it('resolved the mirror: the declared population is real, and is not an everything-set', () => {
    // Empty or `any`-shaped would make every reading below vacuous, and that is
    // exactly what an unresolved `@object-ui/types` looks like.
    expect(measurement().declared).toContain('hideFields');
    expect(measurement().declared).toContain('sections');
    expect(measurement().declared.length).toBeGreaterThan(4);
    // …and the keys this card leaves cast are genuinely NOT in it.
    for (const key of Object.keys(HONEST_CASTS)) {
      expect(measurement().declared).not.toContain(key);
    }
  });

  it('found the reads it is meant to range over, cast and un-cast alike', () => {
    expect(measurement().reads.length).toBeGreaterThan(8);
    expect(measurement().reads.some((r) => r.cast)).toBe(true);
    expect(measurement().reads.some((r) => !r.cast)).toBe(true);
  });

  it('`any` is a reachable verdict here, so the assertion below can fail', () => {
    // The index signature is what admits an undeclared key at `any`. Without
    // this control, "no declared read carries `any`" would also be satisfied by
    // an instrument that never reports `any` at all.
    expect(measurement().indexType).toBe('any');
    expect(measurement().reads.filter((r) => r.type === 'any').length).toBeGreaterThan(0);
  });
});

describe('objectui#9965 — the declaration reaches the read', () => {
  it('every read of a MIRROR-DECLARED key carries its declared type, never `any`', () => {
    const spent = measurement().reads
      .filter((r) => measurement().declared.includes(r.key))
      .filter((r) => r.cast || r.type === 'any')
      // Named, not counted: a failure has to say WHICH read regressed.
      .map((r) => `${r.key} @ line ${r.line} => ${r.type}${r.cast ? ' (cast)' : ''}`);
    expect(spent).toEqual([]);
  });

  it('`hideFields` is still READ, and reads as the mirror declares it', () => {
    const hits = measurement().reads.filter((r) => r.key === 'hideFields');
    // Liveness: a negative guard alone is satisfied by deleting the read.
    expect(hits.length).toBeGreaterThan(0);
    // `string[]` is the `Array.isArray` narrowing of the same declaration.
    for (const hit of hits) {
      expect(['string[] | undefined', 'string[]']).toContain(hit.type);
    }
  });

  for (const [key, why] of Object.entries(HONEST_CASTS)) {
    it(`the cast over \`${key}\` is honest because the mirror still does not declare it`, () => {
      expect(why.length).toBeGreaterThan(0);
      // ⭐ The expiry condition. Declare the key and this leg goes red, which is
      // the point: the exemption cannot outlive its premise.
      expect(measurement().declared).not.toContain(key);
      expect(measurement().reads.some((r) => r.key === key && r.cast)).toBe(true);
    });
  }
});

/* ── Source-text legs: the cheap guard, over the CONTRACT's population ─────── */

const maskedRenderer = (): string => mask(readFileSync(RENDERER, 'utf8'));

/**
 * A cast standing between `schema` and `key` — the shape that makes a
 * declaration inert at its own read site. Built per key so the guard below can
 * range over a DERIVED population rather than a written-down list.
 */
const castBefore = (key: string): RegExp =>
  new RegExp(`\\(\\s*schema\\s+as\\s+\\w+\\s*\\)\\s*\\.\\s*${key}\\b`);

/** Every key the CONTRACT declares on this block — read off the artifact, every run. */
const declaredKeys = (): string[] => Object.keys(RecordDetailsProps.shape).sort();

describe('objectui#9965 — the source-text guard is derived and discriminates', () => {
  it('reads the contract’s own props schema, non-empty and calibrated both ways', () => {
    const keys = declaredKeys();
    expect(keys.length).toBeGreaterThan(5);
    expect(keys).toContain('hideFields');
    // …and it is not an everything-set, which would make the guard unfalsifiable.
    expect(keys).not.toContain('enforceFieldSecurity');
    expect(keys).not.toContain('requiredPermissions');
    // The premise of reading the named export: it IS this block's map entry.
    expect(ComponentPropsMap['record:details']).toBe(RecordDetailsProps);
  });

  it('the cast matcher fires on the cast form and refuses the un-cast one', () => {
    // The control varies ONLY the claim, in the same command as the zero below.
    const m = castBefore('hideFields');
    expect(m.test('Array.isArray((schema as any).hideFields)')).toBe(true);
    expect(m.test('Array.isArray(schema.hideFields)')).toBe(false);
    // Comments are masked before the guard runs, so this file's own prose —
    // and the renderer's, which spells the cast out — can neither satisfy nor
    // defeat it.
    expect(mask('// (schema as any).hideFields\nconst x = 1;')).not.toMatch(m);
  });

  it('no cast stands between `schema` and ANY contract-declared key', () => {
    const source = maskedRenderer();
    // Proof the file was read and masked, so the absences below are about the
    // spelling and not about an empty string.
    expect(source).toContain('RecordDetailsRendererProps');
    // Liveness, in source text this time: the read and its guard are still here.
    expect(source).toMatch(/Array\.isArray\(schema\.hideFields\) \? schema\.hideFields/);
    const offenders = declaredKeys().filter((key) => castBefore(key).test(source));
    expect(offenders).toEqual([]);
  });
});
