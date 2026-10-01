/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `showFilters` is retired on `object-grid` (objectui#11068, triage's answer to
 * the card's retriage) — the DECLARATION half. The renderer half, which shows an
 * authored `showFilters` draws nothing, is `plugin-grid`'s
 * `ObjectGrid.declaredKeys-11068.test.tsx`.
 *
 * ## Why a tombstone, and why it points at the list view
 *
 * `ObjectGrid` has no filter UI. The one filter surface objectui draws is the
 * `list-view` toolbar's filter builder, switched by `userActions.filter`, so
 * honouring the key on the grid would have meant building a second filter
 * surface. The upstream protocol's `object-grid` row does not declare the key
 * either. Deleting the member would refuse nothing: the zod twin ends
 * `.passthrough()` and the interface inherits `BaseSchema`'s index signature.
 * So the key stays DECLARED and unwritable on both faces — `retirementTombstone()`
 * and `?: never` — as `rowSpecActions` and `defaultSort` are.
 *
 * ## The two authoring faces, and the controls beside each refusal
 *
 * The node face (`safeValidateSchema`) and the strict authoring face
 * (`StrictAnyComponentSchema`) are both asked. A red parse proves a by-name
 * refusal only beside a document that stays green on the same instrument: the
 * grid without the key, a list view's own `showFilters` and `userActions.filter`,
 * and an object view's own `showFilters` — which `ObjectView` still reads, so it
 * is not retired here.
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import { ObjectGridPropsSchema as SpecObjectGridPropsSchema, ListViewSchema as SpecListViewSchema } from '@objectstack/spec/ui';
import { ObjectGridSchema } from '../zod/objectql.zod.js';
// Both faces through the barrel: objectui#8345 pins it as the only entry into
// the strict face's module cycle, test files included.
import { safeValidateSchema, StrictAnyComponentSchema } from '../zod/index.zod.js';
import type {
  ListViewSchema as ListViewSchemaType,
  ObjectGridSchema as ObjectGridSchemaType,
  ObjectViewSchema as ObjectViewSchemaType,
} from '../objectql.js';

/** A control key no surface in this package or the protocol declares. */
const UNKNOWN_KEY = 'zzzNotAKeyAnySurfaceDeclares11068';

/** The minimum green `object-grid` document. */
const GRID = { type: 'object-grid' as const, objectName: 'probe' };

type Issue = { code: string; path: PropertyKey[]; message: string; errors?: Issue[][] };

/** The two authoring faces, each as a `safeParse`. */
const FACES = [
  ['node face (safeValidateSchema)', (doc: unknown) => safeValidateSchema(doc)],
  ['strict authoring face (StrictAnyComponentSchema)', (doc: unknown) => StrictAnyComponentSchema.safeParse(doc)],
] as const;

type Parse = (doc: unknown) => z.ZodSafeParseResult<unknown>;

/** Every issue in the tree, union arms included, with its full path. */
function flatten(issues: Issue[] | undefined, prefix: PropertyKey[] = []): Issue[] {
  const out: Issue[] = [];
  for (const issue of issues ?? []) {
    const path = [...prefix, ...issue.path];
    out.push({ ...issue, path });
    for (const arm of issue.errors ?? []) out.push(...flatten(arm, path));
  }
  return out;
}

function issueAt(parse: Parse, doc: unknown, path: string): Issue | undefined {
  const result = parse(doc);
  if (result.success) return undefined;
  return flatten(result.error.issues as unknown as Issue[]).find((i) => i.path.map(String).join('.') === path);
}

describe('an authored `showFilters` on `object-grid` is refused BY NAME on both authoring faces (objectui#11068)', () => {
  it.each(FACES)('%s refuses it at its own path, whatever the value', (_face, parse) => {
    for (const value of [true, false]) {
      const result = parse({ ...GRID, showFilters: value });
      expect(result.success, `showFilters: ${value} parsed green`).toBe(false);
      const issue = issueAt(parse, { ...GRID, showFilters: value }, 'showFilters');
      expect(issue, `no issue at showFilters for ${value}`).toBeDefined();
      // `retirementTombstone()` customises the MESSAGE only; the code is a bare `z.never()`'s.
      expect(issue?.code).toBe('invalid_type');
    }
  });

  it.each(FACES)('%s names the card and the list view’s `userActions.filter`', (_face, parse) => {
    const message = String(issueAt(parse, { ...GRID, showFilters: true }, 'showFilters')?.message);
    expect(message).toContain('objectui#11068');
    expect(message).toContain('`userActions.filter`');
    expect(message).toContain('`list-view`');
  });

  it.each(FACES)('LIT CONTROL — %s accepts the same grid without the key', (_face, parse) => {
    const result = parse(GRID);
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it('LIT CONTROL — the node face still keeps an unrecognised key on the same document', () => {
    // Without this, the refusal above would be consistent with the whole object
    // having turned strict on the node face — a far larger change than the one made.
    expect(safeValidateSchema({ ...GRID, [UNKNOWN_KEY]: true }).success).toBe(true);
  });

  it('writes the SAME string into the metadata channel as into the parse message', () => {
    const described = (ObjectGridSchema.shape.showFilters as { description?: string }).description;
    const issue = ObjectGridSchema.safeParse({ ...GRID, showFilters: true });
    expect(issue.success).toBe(false);
    const message = issue.success ? undefined : issue.error.issues.find((i) => i.path.join('.') === 'showFilters')?.message;
    expect(described).toBe(message);
  });

  it('the tombstone is a MEMBER, not a deletion — that is what makes the refusal loud', () => {
    expect('showFilters' in ObjectGridSchema.shape).toBe(true);
    expect(UNKNOWN_KEY in ObjectGridSchema.shape).toBe(false);
  });
});

describe('`showFilters` stays live where a renderer reads it (the controls the retirement must not touch)', () => {
  const LIST = { type: 'list-view' as const, objectName: 'probe', columns: ['name'] };

  it.each(FACES)('%s accepts the list view’s `userActions.filter` — the spelling the refusal names', (_face, parse) => {
    const result = parse({ ...LIST, userActions: { filter: true } });
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it.each(FACES)('%s accepts a list view’s own `showFilters`', (_face, parse) => {
    const result = parse({ ...LIST, showFilters: true });
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it.each(FACES)('%s accepts an object view’s own `showFilters`', (_face, parse) => {
    const result = parse({ type: 'object-view', objectName: 'probe', showFilters: true });
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });
});

describe('the UPSTREAM half, re-derived from the installed pin', () => {
  it('upstream `object-grid` does not declare `showFilters`, and refuses it', () => {
    expect('showFilters' in SpecObjectGridPropsSchema.shape).toBe(false);
    expect(SpecObjectGridPropsSchema.safeParse({ objectName: 'probe' }).success).toBe(true);
    expect(SpecObjectGridPropsSchema.safeParse({ objectName: 'probe', showFilters: true }).success).toBe(false);
  });

  it('upstream `list-view` declares the toggle the refusal names: `userActions.filter`', () => {
    const userActions = SpecListViewSchema.shape.userActions.unwrap();
    expect('filter' in userActions.shape).toBe(true);
  });
});

/* ── The TypeScript twin ────────────────────────────────────────────────── */

/**
 * The `@ts-expect-error` line below IS the assertion: the member is `?: never`,
 * so the literal is a compile error. It fails this package's
 * `tsc -p tsconfig.test.json` leg as an UNUSED directive if the member is
 * deleted (the key would fall back to `BaseSchema`'s index signature) or
 * re-typed as a live value.
 */
export const authoredShowFiltersRefused: ObjectGridSchemaType = {
  ...GRID,
  // @ts-expect-error — `showFilters` is RETIRED on `object-grid` (objectui#11068): a list view's `userActions.filter`.
  showFilters: true,
};

/** LIT CONTROL: the spellings that stay live are declared, writable members. */
export const listViewFilterToggleIsDeclared: ListViewSchemaType = {
  type: 'list-view',
  objectName: 'probe',
  columns: ['name'],
  userActions: { filter: true },
};

export const objectViewShowFiltersIsDeclared: ObjectViewSchemaType = {
  type: 'object-view',
  objectName: 'probe',
  showFilters: true,
};

describe('the TypeScript twin', () => {
  it('is compiled by this package’s type-check leg, which is where the bindings above are read', () => {
    expect([authoredShowFiltersRefused, listViewFilterToggleIsDeclared, objectViewShowFiltersIsDeclared]).toHaveLength(3);
  });
});
