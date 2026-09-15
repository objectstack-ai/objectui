/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `PageNodeSchema.body` admits ONE node or a list of them — on both faces
 * (objectui#8310, maintainer ruling 2026-09-07, director decision batch #2).
 *
 * ## The defect this pins closed
 *
 * `BaseSchema.body` is `SchemaNode | SchemaNode[]`. `PageNodeSchema` inherited
 * that channel and NARROWED it to `SchemaNode[]`, while the only reader of the
 * channel — `FlatContent`, the legacy body/children fallback inside
 * `PageRenderer` (`packages/components/src/renderers/layout/page.tsx`) — went on
 * accepting a bare node, normalizing it into a one-element list behind a
 * `content as SchemaNode` cast. The cast was the marker: the branch was
 * unreachable through the renderer's own declared props, and existed only
 * because the declaration forbade a value the renderer draws.
 *
 * The refused shape is not hypothetical. It is what this project's own landing
 * page teaches: the root `README.md` "Basic Usage" example gives `body` a
 * single `grid` node. That snippet type-checked only because
 * `SchemaRendererProps.schema` is annotated `BaseSchema` — the WIDER parent —
 * so nothing on the authoring path ever asked this key about its arity. An
 * author who reached for the PRECISE type (the shape a contract-first host
 * wants, and the type `PageRenderer`'s own props already use) was refused.
 *
 * ## The three legs, and which one is evidence
 *
 * 1. **Type-level (`readmeFlagshipPage`) — the discriminating leg.** This
 *    object is a transcription of the README fence, annotated `PageNodeSchema`.
 *    `packages/types`' `type-check` script compiles this file
 *    (`tsc -p tsconfig.test.json`), so re-narrowing `body` to `SchemaNode[]`
 *    stops it compiling. Before the widening it did not compile — that failure
 *    IS the card.
 * 2. **Runtime (`safeParse` of the same value) — also discriminating.** The zod
 *    mirror carried the identical narrowing (`z.array(SchemaNodeSchema)`), so
 *    the single-node form was refused by the validator too. Both faces moved,
 *    and this leg is what catches a half-repair that fixes only the TS side.
 * 3. **The array form — a CONTROL, not evidence.** It was legal before and is
 *    legal after, on both faces. It is here so a later change that breaks the
 *    list arity while "fixing" the single one cannot pass; it proves nothing
 *    about this card on its own, and is labelled so it is never read that way.
 *
 * The README-scan leg keeps leg 1 honest. The ruling requires the flagship
 * example to STAY AS WRITTEN and be pinned legal against the declared type —
 * so "repairing" the README into the array form (which would hide the defect
 * inside a green) reddens this file instead of passing silently.
 *
 * ## ⚠️ The ceiling, measured — do not read this pin as more than it is
 *
 * `BaseSchema` carries `[key: string]: any`. Annotating an authored page
 * therefore catches a value of the WRONG TYPE and never a MISSPELLED KEY: an
 * undeclared key is absorbed by the index signature and draws zero
 * diagnostics, while a type-wrong value draws TS2322. This card repairs the
 * arity of one declared key; it does not turn `PageNodeSchema` into a closed
 * surface, and nothing here should be quoted as if it did.
 *
 * ⚠️ A second, unrelated defect in the same fence was measured while writing
 * this file and filed as objectui#8912: the flagship grid SPELLED its child
 * list `items`, a key `grid` never reads, so that example drew an EMPTY grid.
 * That card has since repaired all three teaching surfaces to `children`, and
 * the transcription below follows the repaired flagship. This file still asks
 * only about `body`'s ARITY and rules on nothing else; the child key is pinned
 * by the render pin in
 * `packages/components/src/__tests__/page-body-single-node-8310.test.tsx`.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PageNodeSchema as ZodPageNodeSchema } from '../zod/layout.zod.js';
// Imported through the package entrypoint, not `../layout`: the barrel is the
// surface `@object-ui/components` and every other consumer sees.
import type { PageNodeSchema, SchemaNode } from '../index';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const README = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

/* -------------------------------------------------------------------------- */
/* Leg 1 — compile-time, compiled by `tsc -p packages/types/tsconfig.test.json` */
/* -------------------------------------------------------------------------- */

/**
 * The `grid` node the README's flagship example hands to `body` — child list
 * spelled `children`, the key `GridSchema` declares and `grid` reads
 * (objectui#8912).
 */
const flagshipGrid: SchemaNode = {
  type: 'grid',
  columns: 3,
  children: [
    { type: 'statistic', label: 'Total Users', value: '${stats.users}' },
    { type: 'statistic', label: 'Revenue', value: '${stats.revenue}' },
    { type: 'statistic', label: 'Orders', value: '${stats.orders}' },
  ],
};

/**
 * The root `README.md` "Basic Usage" example, as a `PageNodeSchema`.
 *
 * ⭐ THE pin of this card. Narrowing `body` back to `SchemaNode[]` makes this
 * declaration stop compiling; that is exactly the state the repository was in
 * before objectui#8310, and it is why the landing page's own example could not
 * be annotated with the type of the node it is.
 */
const readmeFlagshipPage: PageNodeSchema = {
  type: 'page',
  title: 'Dashboard',
  body: flagshipGrid,
};

/**
 * CONTROL — the list arity, which was legal before this card and after it.
 * ⛔ Not evidence for the widening: an assertion green in both worlds proves
 * nothing about the change. It guards against a repair that trades one arity
 * for the other.
 */
const listArityPage: PageNodeSchema = {
  type: 'page',
  title: 'Dashboard',
  body: [flagshipGrid],
};

/* -------------------------------------------------------------------------- */
/* Leg 2 + 3 — the zod mirror, at runtime                                      */
/* -------------------------------------------------------------------------- */

describe('PageNodeSchema.body arity — the declaration matches its reader (objectui#8310)', () => {
  it('parses the README flagship example, whose `body` is ONE node', () => {
    const result = ZodPageNodeSchema.safeParse(readmeFlagshipPage);
    expect(result.success).toBe(true);
  });

  it('CONTROL — parses the list arity too (green before this card and after)', () => {
    const result = ZodPageNodeSchema.safeParse(listArityPage);
    expect(result.success).toBe(true);
  });

  it('keeps the single node intact through the parse rather than wrapping it', () => {
    const parsed = ZodPageNodeSchema.parse(readmeFlagshipPage) as { body?: unknown };
    expect(Array.isArray(parsed.body)).toBe(false);
    expect((parsed.body as { type?: string } | undefined)?.type).toBe('grid');
  });
});

/* -------------------------------------------------------------------------- */
/* Leg 4 — the refusal control: the widened union still has a floor            */
/* -------------------------------------------------------------------------- */

/**
 * REFUSAL CONTROL — what the widened `body` must still turn away.
 *
 * Legs 1-3 all assert ACCEPTANCE. A `body` arm that had degraded into
 * accept-anything (`z.any()`, or a union whose floor fell out) passes every one
 * of them green, so on their own they measure the widening's DIRECTION and
 * never its BOUND. This block is the missing half. It pins the refusal
 * ENVELOPE — an `invalid_union` issue at path `['body']` — rather than the bare
 * falsity of `success`, so a page refused for some unrelated reason cannot
 * stand in for a `body` that was judged and rejected.
 *
 * ## ⚠️ Measured, and it is not what the obvious guess says
 *
 * `body: 42` and `body: 'x'` are **LEGAL**, on both faces, and an assertion
 * that they are refused pins a contract this repo does not have:
 *
 * - `../base.ts`: `type SchemaNode = BaseSchema | string | number | boolean | null | undefined`
 * - `../zod/base.zod.ts`: `nodeUnionOptions = [BaseSchemaCore, z.string(),
 *   z.number(), z.boolean(), z.null(), z.undefined()]`
 *
 * A primitive IS a `SchemaNode` here — the text-node convention — so
 * `SchemaNode | SchemaNode[]` admits `42` by construction, exactly as
 * `BaseSchema.body`, `CardSchema.body` and `AspectRatioSchema.body` already
 * did before this card. ⛔ Do not "harden" this block by asserting a primitive
 * is refused: that assertion is RED today, and if it ever went green it would
 * mean the node union had lost arms it is declared to have.
 *
 * ## Why these three values, and not a bogus `type`
 *
 * `SchemaNodeSchema`'s recursion slot 0 holds `BaseSchemaCore` until
 * `../zod/index.zod.js` has been evaluated and `AnyComponentSchema` from the
 * moment it has (`defineNodeComponentUnion`, `../zod/base.zod.ts`). Measured
 * both ways: `{ type: 'definitely-not-a-node' }` is ACCEPTED in the first world
 * and REFUSED in the second, so it is a function of module evaluation order in
 * the importing file and ⛔ must not be used as a refusal fixture. An object
 * carrying **no `type` at all** is refused in BOTH worlds — `BaseSchemaCore`
 * requires `type`, and a discriminated union cannot dispatch without it — so
 * that is the value this control is built on, in either arity.
 */
const REFUSED_BODIES: ReadonlyArray<[label: string, body: unknown]> = [
  ['an object that is not a node — it carries no `type`', {}],
  ['an object with node-ish keys but still no `type`', { columns: 3 }],
  ['the LIST arity carrying that same non-node object', [{}]],
];

describe('PageNodeSchema.body still refuses a non-node — the widening kept its floor (objectui#8310)', () => {
  for (const [label, body] of REFUSED_BODIES) {
    it(`refuses ${label}`, () => {
      const result = ZodPageNodeSchema.safeParse({ type: 'page', title: 'Dashboard', body });

      expect(result.success).toBe(false);
      if (result.success) return;

      const bodyIssues = result.error.issues.filter((issue) => issue.path[0] === 'body');
      expect(bodyIssues.length).toBeGreaterThan(0);
      expect(bodyIssues.map((issue) => issue.code)).toContain('invalid_union');
    });
  }

  it('BOUNDARY — a primitive body stays legal, because `SchemaNode` declares it', () => {
    // ⛔ Not a defect and ⛔ not a candidate for "hardening" — see the docblock.
    expect(ZodPageNodeSchema.safeParse({ type: 'page', body: 42 }).success).toBe(true);
    expect(ZodPageNodeSchema.safeParse({ type: 'page', body: 'Hello' }).success).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* README leg — the transcription above is not allowed to become fiction        */
/* -------------------------------------------------------------------------- */

/**
 * The `const schema = {` object literal inside the README's "Basic Usage"
 * fence, returned as source text. Scanned with brace-depth tracking rather
 * than a regex so a nested `children[]` cannot end the span early.
 */
function basicUsageSchemaLiteral(): string {
  const heading = README.indexOf('#### Basic Usage');
  expect(heading).toBeGreaterThan(-1);
  const start = README.indexOf('const schema = {', heading);
  expect(start).toBeGreaterThan(-1);

  let depth = 0;
  for (let i = README.indexOf('{', start); i < README.length; i += 1) {
    const ch = README[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return README.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces in the README "Basic Usage" schema literal');
}

/** The first non-whitespace character of the literal's `body:` value. */
function bodyValueOpener(literal: string): string {
  const at = literal.indexOf('body:');
  expect(at).toBeGreaterThan(-1);
  return literal.slice(at + 'body:'.length).trimStart()[0];
}

describe('the root README keeps authoring the single-node form (objectui#8310)', () => {
  it('gives `body` ONE node, not a list — the shape this card made legal', () => {
    expect(bodyValueOpener(basicUsageSchemaLiteral())).toBe('{');
  });

  it('still authors the page/grid/statistic shape transcribed above', () => {
    const literal = basicUsageSchemaLiteral();
    expect(literal).toContain('type: "page"');
    expect(literal).toContain('title: "Dashboard"');
    expect(literal).toContain('type: "grid"');
    expect(literal).toContain('columns: 3');
    expect(literal.match(/type: "statistic"/g) ?? []).toHaveLength(3);
  });
});
