/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8937 — the two published texts objectui#8886 left behind, each
 * pinned to the thing it describes rather than to a transcription of it.
 *
 * Both pins RE-DERIVE on every run. A pin that hard-coded the sentence would
 * only assert that nobody edited the sentence, which is the failure mode these
 * two defects already are: text that stayed put while the thing it described
 * moved.
 *
 * ## Pin one — the README's parent-scope claim, against the composition
 *
 * `packages/plugin-detail/README.md` is in this package's `files[]`, so it
 * SHIPS. It used to say the node's `filter` is AND-combined with
 * `{ [relationshipField]: parentId }` full stop, which stopped being true when
 * objectui#7299 made the parent condition arity-dependent. The pin reads the
 * spellings out of `RelatedList.tsx`'s own `parentScope` literal and requires
 * the README paragraph to name EXACTLY that set — both directions, so the
 * README cannot over-claim an operator the component never sends either.
 *
 * ## Pin two — the divergence the docblock now records, against the spec
 *
 * `parentRelationshipFieldDef`'s docblock used to say the SQL driver decides
 * arity on `@objectstack/spec/data`'s `isMultiValueField`. It does not: the
 * driver gates the equality family on its own storage question, which treats
 * `multiple` as truthy on ANY type, so the two rules disagree for a type
 * OUTSIDE `MULTI_CAPABLE_TYPES` carrying `multiple: true`. The docblock now
 * records that divergence and points at objectstack#17469, which owns the
 * question of which rule is right.
 *
 * The DRIVER half of that divergence cannot be imported here — it lives in
 * objectstack's `driver-sql`. What can be re-derived is the SPEC half, and it
 * is the half that moves: the likely resolution of objectstack#17469 is the
 * spec admitting these types, at which point the docblock's list stops being a
 * divergence and this file reddens. The driver half is a constant for the cases
 * listed — its rule contains the disjunct "`multiple` is truthy", which is
 * `true` for every `multiple: true` def regardless of the type set beside it,
 * so no import is needed to know the driver answers "JSON column" for all of
 * them.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  FieldType,
  MULTI_CAPABLE_TYPES,
  MULTI_OPTION_TYPES,
  isMultiValueField,
} from '@objectstack/spec/data';
import { describe, it, expect } from 'vitest';

/**
 * Rooted on THIS FILE, never on `process.cwd()` (objectui#7799): the package
 * and repo-root invocations have different cwds and would read different trees.
 * Bare `import.meta.url` taken apart by hand — `new URL(rel, import.meta.url)`
 * is rewritten by Vite into a dev-server URL that `fileURLToPath` rejects.
 */
const SELF_DEPTH_BELOW_REPO_ROOT = 5; // packages / plugin-detail / src / __tests__ / this file
const REPO_ROOT = decodeURIComponent(new URL(import.meta.url).pathname)
  .split('/')
  .slice(0, -SELF_DEPTH_BELOW_REPO_ROOT)
  .join('/');

/** Read a tracked file, and prove the read landed or every assertion on it is vacuous. */
function sourceOf(rel: string): string {
  const path = join(REPO_ROOT, rel);
  expect(existsSync(path), `source not found at ${path}`).toBe(true);
  const text = readFileSync(path, 'utf8');
  expect(text.length, `${rel} read back empty`).toBeGreaterThan(0);
  return text;
}

const COMPONENT = 'packages/plugin-detail/src/RelatedList.tsx';
const README = 'packages/plugin-detail/README.md';

// ── pin one: README ↔ the composition it describes ───────────────────────────

/** The `parentScope` object literal's body, as written in the component. */
function parentScopeBody(source: string): string {
  const match = /const parentScope = \{([\s\S]*?)\} as Record<string, any>;/.exec(source);
  expect(match, 'could not find the `parentScope` literal in RelatedList.tsx').not.toBeNull();
  return (match as RegExpExecArray)[1];
}

/** Query-DSL operators the parent condition composes, e.g. `$contains`. */
function composedOperators(body: string): string[] {
  return [...new Set(body.match(/\$[A-Za-z][A-Za-z0-9_]*/g) ?? [])].sort();
}

/**
 * Does the parent condition still have a BARE equality arm?
 *
 * Operator objects are stripped first, so `{ $contains: parentId }` does not
 * masquerade as one — the question is whether `parentId` is ever placed on the
 * field key directly.
 */
function hasBareEqualityArm(body: string): boolean {
  return /:\s*parentId\s*[,}]/.test(body.replace(/\{[^{}]*\}/g, ''));
}

/** The blank-line-delimited README paragraph carrying the AND-combination claim. */
function parentScopeParagraph(readme: string): string {
  const paragraphs = readme.split(/\n\s*\n/);
  const hits = paragraphs.filter((p) => p.includes('**AND-combined**'));
  expect(hits, 'expected exactly one README paragraph claiming the AND-combination').toHaveLength(1);
  return hits[0];
}

describe('objectui#8937 pin one — the shipped README states the parent condition the component composes', () => {
  it('names every operator the composition sends, and no operator it does not', () => {
    const body = parentScopeBody(sourceOf(COMPONENT));
    const paragraph = parentScopeParagraph(sourceOf(README));

    const composed = composedOperators(body);
    // Landing proof: a body this extraction failed to read would make every
    // assertion below pass by describing nothing.
    expect(composed.length, 'the parent condition composes no operator at all — extraction likely missed').toBeGreaterThan(0);

    const claimed = [...new Set(paragraph.match(/\$[A-Za-z][A-Za-z0-9_]*/g) ?? [])].sort();
    expect(claimed, 'the README paragraph must name exactly the operators the component composes').toEqual(composed);
  });

  it('names the equality spelling exactly when the composition still has a bare equality arm', () => {
    const body = parentScopeBody(sourceOf(COMPONENT));
    const paragraph = parentScopeParagraph(sourceOf(README));
    const EQUALITY = '{ [relationshipField]: parentId }';

    expect(paragraph.includes(EQUALITY)).toBe(hasBareEqualityArm(body));
  });

  it('spells the membership form in full whenever the composition sends `$contains`', () => {
    const body = parentScopeBody(sourceOf(COMPONENT));
    const paragraph = parentScopeParagraph(sourceOf(README));
    const MEMBERSHIP = '{ [relationshipField]: { $contains: parentId } }';

    expect(paragraph.includes(MEMBERSHIP)).toBe(composedOperators(body).includes('$contains'));
  });
});

// ── pin two: the docblock's divergence list ↔ the installed spec ─────────────

/** The docblock prose, un-commented: leading ` * ` stripped, whitespace collapsed. */
function docblockProse(source: string): string {
  return source
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ');
}

/** The field types the docblock names as diverging, read back out of the docblock. */
function divergentTypesFromDocblock(source: string): string[] {
  const prose = docblockProse(source);
  const match = /They diverge for[^(]*\(([^)]*)\)/.exec(prose);
  expect(match, 'the docblock no longer records a divergence set — pin two has nothing to judge').not.toBeNull();
  return [...((match as RegExpExecArray)[1].match(/`([a-z_]+)`/g) ?? [])].map((t) => t.replace(/`/g, ''));
}

describe('objectui#8937 pin two — the docblock divergence is re-derived from the installed spec', () => {
  it('names real spec field types that the spec predicate still calls single-valued', () => {
    const types = divergentTypesFromDocblock(sourceOf(COMPONENT));
    expect(types.length, 'expected the docblock to name the diverging types').toBeGreaterThanOrEqual(3);

    for (const type of types) {
      expect(FieldType.safeParse(type).success, `${type} is not a spec field type`).toBe(true);
      expect(MULTI_CAPABLE_TYPES.has(type), `${type} joined MULTI_CAPABLE_TYPES`).toBe(false);
      expect(MULTI_OPTION_TYPES.has(type), `${type} joined MULTI_OPTION_TYPES`).toBe(false);
      // The spec half of the divergence. The driver half is its `multiple`
      // disjunct, which is `true` for each of these by construction.
      expect(isMultiValueField({ type, multiple: true }), `the spec now calls ${type} multi-valued`).toBe(false);
    }
  });

  it('CONTROL — the same predicate answers `true` where it should, so the cases above are not vacuous', () => {
    // Without this, a predicate stuck at `false` would satisfy every assertion
    // in the case above while asserting nothing about any divergence.
    expect(isMultiValueField({ type: 'lookup', multiple: true })).toBe(true);
    expect(isMultiValueField({ type: 'user', multiple: true })).toBe(true);
    expect(isMultiValueField({ type: 'multiselect' })).toBe(true);
  });

  it('points at the upstream card that owns which of the two rules is right', () => {
    expect(sourceOf(COMPONENT)).toContain('objectstack#17469');
  });
});
