/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Every layout spacing key is ONE set in three places (objectui#11474, which
 * generalised objectui#11424's `container.padding` pin into this file): the
 * steps the renderer maps to a class the stylesheet defines, the set the zod
 * declaration accepts at the authoring doors, and the closed `enum` the
 * registration publishes into the SDUI manifest.
 *
 * ## What is enumerated — derived, not listed
 *
 * Every registration this package makes that declares LAYOUT containment
 * (`isContainer`), and every input on it whose values are numbers (`type:
 * 'number'`, or an `enum` of numbers). Each such input is rendered through the
 * real `SchemaRenderer` across a range of candidates; it is a SPACING key when
 * its value moves a spacing utility (`gap-*`, `p-*`, `m-*`, `space-*`) on the
 * element. Inputs that move none (`aspect-ratio.ratio`, `grid.columns`) are
 * classified here and held to nothing else. A new layout node with a numeric
 * spacing input joins the enumeration the day it is registered.
 *
 * ## What "mapped" means — the compiled stylesheet decides
 *
 * The renderer is the truth (the objectui#7759 ruling: none of these keys is a
 * spec key, so the read site decides), and what it draws only counts when a
 * rule exists for it. Tailwind compiles the class names it finds in scanned
 * source text. `grid` builds `gap-[N*0.25rem]` at runtime for a number outside
 * its map, and no stylesheet carries that rule (measured on objectui#11474), so
 * a class string on the element is not the test. A candidate is MAPPED when the
 * spacing utilities its value draws are all rules in this package's own
 * compiled stylesheet (`src/index.css`, the sheet it ships as `style.css`,
 * compiled here exactly as `scripts/build-css.mjs` compiles it). This file
 * lives under `__tests__/`, which that sheet does not scan, so the class names
 * written below cannot create the rules they look for.
 *
 * ⛔ An unmapped number draws no spacing at all — the renderers neither round
 * nor clamp it, on purpose; the declaration refuses it instead.
 *
 * ## What each spacing key is held to
 *
 * - its zod declaration, at the authored spelling (flat on the node, or in the
 *   `properties` bag when the node refuses it flat, as `flex` does), accepts
 *   exactly the mapped set on the tolerant face (`safeValidateSchema`, what
 *   `objectui validate` runs) and on the strict authoring face;
 * - its registration input is a closed `enum` of exactly the mapped set;
 * - an absent key draws exactly what the registration's default step draws.
 *
 * Module-scope import of the renderers, not `beforeAll` (AGENTS.md §测试纪律).
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '../renderers';
import { SchemaRenderer } from '@object-ui/react';
import { ComponentRegistry } from '@object-ui/core';
import { safeValidateSchema, StrictAnyComponentSchema } from '@object-ui/types/zod';

/** Every candidate the derivation renders: a range past the widest step, plus fractions and a negative. */
const CANDIDATES = [...Array.from({ length: 33 }, (_, i) => i), -1, 0.5, 1.5, 2.5, 9.5];

/** A spacing utility at any variant: `gap-2`, `sm:gap-3`, `md:p-0.5`, `mx-auto`, `gap-[2.25rem]`. */
const isSpacingUtility = (token: string) =>
  /^(?:[\w-]+:)*-?(?:gap(?:-[xy])?|p[xytrblse]?|m[xytrblse]?|space-[xy])-/.test(token);

const sortNumbers = (values: Iterable<unknown>) => [...values].map(Number).sort((a, b) => a - b);

/* ── The compiled stylesheet ─────────────────────────────────────────────── */

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const entry = resolve(packageRoot, 'src/index.css');

/** CSS identifier escapes undone: `\32 xl\:gap-1\.5` -> `2xl:gap-1.5`. */
const unescapeIdent = (escaped: string) =>
  escaped
    .replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');

/** The class names the compiled sheet has a rule for, read off each rule's leading class selector. */
async function compileDefinedClasses(): Promise<Set<string>> {
  const source = await readFile(entry, 'utf8');
  const result = await postcss([tailwindPostcss({ base: packageRoot })]).process(source, { from: entry });
  const defined = new Set<string>();
  postcss.parse(result.css, { from: entry }).walkRules((rule) => {
    for (const selector of rule.selectors) {
      const m = /^\.((?:\\[0-9a-fA-F]{1,6} ?|\\.|[\w-])+)/.exec(selector.trim());
      if (m) defined.add(unescapeIdent(m[1]));
    }
  });
  return defined;
}

let definedCache: Promise<Set<string>> | undefined;
const definedClasses = () => (definedCache ??= compileDefinedClasses());

/* ── The enumeration ─────────────────────────────────────────────────────── */

interface LayoutInput {
  /** The authored type: the registry key without its namespace. */
  type: string;
  key: string;
  input: { type?: unknown; enum?: unknown[] };
  defaultValue: unknown;
}

const enumValues = (input: LayoutInput['input']) =>
  (input.enum ?? []).map((e) => (typeof e === 'object' && e !== null ? (e as { value: unknown }).value : e));

/** Every numeric input on every registered layout container, once per registration. */
const NUMERIC_LAYOUT_INPUTS: LayoutInput[] = (() => {
  const seen = new Set<unknown>();
  const out: LayoutInput[] = [];
  for (const config of ComponentRegistry.getAllConfigs()) {
    if (seen.has(config.type)) continue;
    seen.add(config.type);
    if (!config.isContainer) continue;
    const prefix = config.namespace ? `${config.namespace}:` : '';
    const type = prefix && config.type.startsWith(prefix) ? config.type.slice(prefix.length) : config.type;
    for (const input of config.inputs ?? []) {
      const values = enumValues(input as LayoutInput['input']);
      const numeric =
        input.type === 'number' || (input.type === 'enum' && values.length > 0 && values.every((v) => typeof v === 'number'));
      if (!numeric) continue;
      out.push({
        type,
        key: input.name,
        input: input as LayoutInput['input'],
        defaultValue: (config.defaultProps as Record<string, unknown> | undefined)?.[input.name],
      });
    }
  }
  return out.sort((a, b) => `${a.type}.${a.key}`.localeCompare(`${b.type}.${b.key}`));
})();

/* ── Rendering ───────────────────────────────────────────────────────────── */

function spacingOf(type: string, extra: Record<string, unknown>): string[] {
  const { container, unmount } = render(<SchemaRenderer schema={{ type, children: [], ...extra } as never} />);
  const tokens = ((container.firstElementChild as HTMLElement | null)?.className ?? '')
    .split(/\s+/)
    .filter(isSpacingUtility);
  unmount();
  return tokens;
}

interface Derivation {
  /** The spacing utilities each candidate's value draws, beyond those every candidate draws. */
  drawn: Map<number, string[]>;
  /** Candidates whose drawn utilities exist and are all rules in the compiled sheet. */
  mapped: number[];
  /** Spacing utilities every candidate draws (`mx-auto` on a centred container) — not the key's. */
  constant: string[];
}

async function derive({ type, key }: LayoutInput): Promise<Derivation> {
  const defined = await definedClasses();
  const raw = new Map(CANDIDATES.map((n) => [n, spacingOf(type, { [key]: n })]));
  const constant = [...raw.values()].reduce((acc, tokens) => acc.filter((t) => tokens.includes(t)));
  const drawn = new Map([...raw].map(([n, tokens]) => [n, tokens.filter((t) => !constant.includes(t))]));
  const mapped = CANDIDATES.filter((n) => {
    const tokens = drawn.get(n)!;
    return tokens.length > 0 && tokens.every((t) => defined.has(t));
  });
  return { drawn, mapped, constant };
}

/* ── The authoring doors ─────────────────────────────────────────────────── */

const FACES = {
  tolerant: (doc: unknown) => safeValidateSchema(doc).success,
  strict: (doc: unknown) => StrictAnyComponentSchema.safeParse(doc).success,
} as const;

/**
 * The spelling the node is authored in: flat on the node when the tolerant
 * face takes the registration's default step there, otherwise in the
 * `properties` bag (`flex`, objectui#11276). Derived from the declaration.
 */
function authoredSpelling({ type, key, defaultValue }: LayoutInput): (n: unknown) => Record<string, unknown> {
  const flat = (n: unknown) => ({ type, [key]: n });
  const bag = (n: unknown) => ({ type, properties: { [key]: n } });
  if (FACES.tolerant(flat(defaultValue))) return flat;
  expect(FACES.tolerant(bag(defaultValue)), `${type}.${key}: no authored spelling takes the default ${String(defaultValue)}`).toBe(true);
  return bag;
}

/* ── The pins ────────────────────────────────────────────────────────────── */

describe('layout spacing keys: the rendered set, the declared set and the registered set are one (objectui#11474)', () => {
  it('the instrument sees the stylesheet: mapped utilities, variants and arbitrary values are all readable', async () => {
    const defined = await definedClasses();
    expect(defined.size).toBeGreaterThan(800);
    // A variant and an escaped dot read back unescaped …
    expect(defined.has('sm:gap-2')).toBe(true);
    expect(defined.has('gap-1.5')).toBe(true);
    // … and an arbitrary value is readable at all, so an absent `gap-[…]` is a real absence.
    expect([...defined].some((c) => /^[\w-]+-\[[^\]]+\]$/.test(c))).toBe(true);
  }, 60_000);

  it('the enumeration is not vacuous: it finds numeric layout inputs, spacing keys among them', async () => {
    expect(NUMERIC_LAYOUT_INPUTS.length).toBeGreaterThan(0);
    const spacing: string[] = [];
    for (const entry of NUMERIC_LAYOUT_INPUTS) {
      const { drawn } = await derive(entry);
      if ([...drawn.values()].some((tokens) => tokens.length > 0)) spacing.push(`${entry.type}.${entry.key}`);
    }
    // Lit control: the key objectui#11424 closed first is still found by the derivation.
    expect(spacing).toContain('container.padding');
    expect(spacing.length).toBeGreaterThan(1);
  }, 60_000);

  for (const entry of NUMERIC_LAYOUT_INPUTS) {
    const name = `${entry.type}.${entry.key}`;

    it(`${name}: when it moves a spacing utility, its declaration and registration are its mapped set`, async () => {
      const { drawn, mapped } = await derive(entry);
      if (![...drawn.values()].some((tokens) => tokens.length > 0)) {
        // Not a spacing key: no candidate moves a spacing utility. Nothing else is held here.
        expect(mapped).toEqual([]);
        return;
      }

      // The derivation reads the defect itself: mapped steps AND unmapped numbers.
      expect(mapped.length, `${name}: no candidate is mapped`).toBeGreaterThan(0);
      expect(mapped.length, `${name}: every candidate is mapped — an open scale is not a closed set`).toBeLessThan(
        CANDIDATES.length,
      );

      // An unmapped number draws no spacing the stylesheet defines: not rounded, not clamped.
      const defined = await definedClasses();
      for (const n of CANDIDATES.filter((c) => !mapped.includes(c))) {
        expect(drawn.get(n)!.filter((t) => defined.has(t)), `${name} ${n}`).toEqual([]);
      }

      // The declaration, at both authoring doors.
      const spelling = authoredSpelling(entry);
      for (const [face, parse] of Object.entries(FACES)) {
        const declared = CANDIDATES.filter((n) => parse(spelling(n)));
        expect(sortNumbers(declared), `${name} on the ${face} face`).toEqual(sortNumbers(mapped));
      }

      // The registration, as a closed enum.
      expect(entry.input.type, `${name} registration input`).toBe('enum');
      expect(sortNumbers(enumValues(entry.input)), `${name} registration enum`).toEqual(sortNumbers(mapped));

      // Control: an absent key draws exactly what the registration's default step draws.
      expect(mapped).toContain(entry.defaultValue);
      expect(spacingOf(entry.type, {})).toEqual(spacingOf(entry.type, { [entry.key]: entry.defaultValue }));
    }, 60_000);
  }
});
