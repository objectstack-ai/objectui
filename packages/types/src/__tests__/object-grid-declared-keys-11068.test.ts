/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Every key `ObjectGridSchema` declares takes effect or is retired
 * (objectui#11068) — the DECLARATION half. The renderer half, which reads
 * `description` and `emptyState` and shows the four retired keys draw nothing,
 * is `plugin-grid`'s `ObjectGrid.declaredKeys-11068.test.tsx`.
 *
 * ## What was retired, and why each is a tombstone
 *
 * `rowSpecActions` / `bulkSpecActions` were second spellings of `rowActions` /
 * `bulkActions`, which the grid reads and the upstream `object-grid` row
 * declares; nothing read the second spellings. `name` and `placeholder` are
 * `BaseSchema` members with no meaning on a grid — a grid is neither a form
 * field nor an input — and nothing read either on this node.
 *
 * Deleting them would refuse nothing: the zod twin ends `.passthrough()` (and
 * its base declares `name` / `placeholder` itself), and the interface inherits
 * `BaseSchema`'s members and index signature. So each stays DECLARED and
 * unwritable on both faces — `retirementTombstone()` and `?: never` — the
 * convention `defaultSort` set (objectui#5861).
 *
 * ## Every refusal carries a lit control on the same instrument
 *
 * A red parse proves by-name refusal only beside a document that stays green
 * with an unrecognised key and with the spelling the refusal sends the author
 * to.
 */

import { describe, it, expect } from 'vitest';
import { ObjectGridPropsSchema as SpecObjectGridPropsSchema } from '@objectstack/spec/ui';
import { ObjectGridSchema } from '../zod/objectql.zod.js';
import type { ObjectGridSchema as ObjectGridSchemaType } from '../objectql.js';

/** A control key no surface in this package or the protocol declares. */
const UNKNOWN_KEY = 'zzzNotAKeyAnySurfaceDeclares11068';

/** The minimum green `object-grid` document, shared by every case below. */
const NODE = { type: 'object-grid' as const, objectName: 'probe' };

/** Each retired key, a value an author would have written, and what the refusal must name. */
const RETIRED = [
  { key: 'rowSpecActions', value: ['edit'], remedy: '`rowActions`' },
  { key: 'bulkSpecActions', value: ['delete'], remedy: '`bulkActions`' },
  { key: 'name', value: 'all_contacts', remedy: '`label`' },
  { key: 'placeholder', value: 'Nothing here yet', remedy: '`emptyState: { message }`' },
] as const;

/** The spellings the refusals send an author to — each must stay writable. */
const REMEDIES = {
  rowActions: ['edit'],
  bulkActions: ['delete'],
  id: 'all_contacts',
  label: 'All contacts',
  emptyState: { message: 'Nothing here yet' },
};

function issueAt(result: ReturnType<typeof ObjectGridSchema.safeParse>, path: string) {
  return result.success ? undefined : result.error.issues.find((i) => i.path.join('.') === path);
}

describe('objectql.zod.ts#ObjectGridSchema — the four retired keys are refused BY NAME (objectui#11068)', () => {
  it.each(RETIRED.map((r) => [r.key, r] as const))('refuses an authored `%s` at its own path', (_key, r) => {
    const result = ObjectGridSchema.safeParse({ ...NODE, [r.key]: r.value });
    expect(result.success).toBe(false);
    const issue = issueAt(result, r.key);
    expect(issue, `no issue at ${r.key}`).toBeDefined();
    // `retirementTombstone()` customises the MESSAGE only; the code stays the one
    // a bare `z.never()` reports.
    expect(issue?.code).toBe('invalid_type');
  });

  it.each(RETIRED.map((r) => [r.key, r] as const))('the refusal of `%s` names the card and the remedy', (_key, r) => {
    const message = String(issueAt(ObjectGridSchema.safeParse({ ...NODE, [r.key]: r.value }), r.key)?.message);
    expect(message).toContain('objectui#11068');
    expect(message).toContain(r.remedy);
  });

  it.each(RETIRED.map((r) => [r.key, r] as const))('writes the SAME string for `%s` into the metadata channel', (_key, r) => {
    const described = (ObjectGridSchema.shape[r.key] as { description?: string }).description;
    const issue = issueAt(ObjectGridSchema.safeParse({ ...NODE, [r.key]: r.value }), r.key);
    expect(described).toBe(String(issue?.message));
  });

  it('LIT CONTROL — an unrecognised key on the SAME document stays green', () => {
    // Without this, the refusals above would be consistent with the whole object
    // having turned strict — a much larger contract change than the one made.
    expect(ObjectGridSchema.safeParse({ ...NODE, [UNKNOWN_KEY]: ['edit'] }).success).toBe(true);
  });

  it('LIT CONTROL — every spelling the refusals name parses green', () => {
    const result = ObjectGridSchema.safeParse({ ...NODE, ...REMEDIES });
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it('each tombstone is a MEMBER, not a deletion — that is what makes the refusal loud', () => {
    for (const { key } of RETIRED) expect(key in ObjectGridSchema.shape).toBe(true);
    expect(UNKNOWN_KEY in ObjectGridSchema.shape).toBe(false);
  });
});

describe('objectql.zod.ts#ObjectGridSchema — `emptyState` is mirrored member for member (objectui#11068)', () => {
  it('accepts the three members, and the values survive the parse', () => {
    const emptyState = { title: 'No contacts yet', message: 'Add one to get started', icon: 'users' };
    const result = ObjectGridSchema.safeParse({ ...NODE, emptyState });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.emptyState).toEqual(emptyState);
  });

  it('refuses a non-string member AT that member', () => {
    const result = ObjectGridSchema.safeParse({ ...NODE, emptyState: { title: 42 } });
    expect(result.success).toBe(false);
    expect(issueAt(result, 'emptyState.title')?.code).toBe('invalid_type');
  });

  it('refuses an unknown member by name instead of keeping it — `description` is not `message`', () => {
    const result = ObjectGridSchema.safeParse({ ...NODE, emptyState: { description: 'Add one' } });
    expect(result.success).toBe(false);
    const issue = issueAt(result, 'emptyState');
    expect(issue?.code).toBe('unrecognized_keys');
    expect(String(issue?.message)).toContain('description');
  });

  it('LIT CONTROL — an empty object and an absent key both stay green', () => {
    expect(ObjectGridSchema.safeParse({ ...NODE, emptyState: {} }).success).toBe(true);
    expect(ObjectGridSchema.safeParse(NODE).success).toBe(true);
  });
});

describe('the UPSTREAM half — the canonical action spellings, re-derived from the installed pin', () => {
  it('upstream `object-grid` ACCEPTS `rowActions` / `bulkActions` and REFUSES the second spellings', () => {
    const canonical = SpecObjectGridPropsSchema.safeParse({ objectName: 'probe', rowActions: ['edit'], bulkActions: ['delete'] });
    expect(canonical.success).toBe(true);
    for (const key of ['rowSpecActions', 'bulkSpecActions']) {
      const refused = SpecObjectGridPropsSchema.safeParse({ objectName: 'probe', [key]: ['edit'] });
      expect(refused.success, `upstream accepted \`${key}\``).toBe(false);
    }
  });
});

/* ── The TypeScript twin ────────────────────────────────────────────────── */

/**
 * The `@ts-expect-error` lines below ARE the assertions: each retired member is
 * `?: never`, so the literal is a compile error. They fail this package's
 * `tsc -p tsconfig.test.json` leg as UNUSED directives if a member is deleted
 * (`name` / `placeholder` would fall back to `BaseSchema`'s `string`, the other
 * two to the index signature) or re-typed as a live value.
 */
export const authoredRowSpecActionsRefused: ObjectGridSchemaType = {
  ...NODE,
  // @ts-expect-error — `rowSpecActions` is RETIRED (objectui#11068): write `rowActions`.
  rowSpecActions: ['edit'],
};

export const authoredBulkSpecActionsRefused: ObjectGridSchemaType = {
  ...NODE,
  // @ts-expect-error — `bulkSpecActions` is RETIRED (objectui#11068): write `bulkActions`.
  bulkSpecActions: ['delete'],
};

export const authoredNameRefused: ObjectGridSchemaType = {
  ...NODE,
  // @ts-expect-error — `name` is RETIRED on `object-grid` (objectui#11068): write `id` / `label`.
  name: 'all_contacts',
};

export const authoredPlaceholderRefused: ObjectGridSchemaType = {
  ...NODE,
  // @ts-expect-error — `placeholder` is RETIRED on `object-grid` (objectui#11068): write `emptyState`.
  placeholder: 'Nothing here yet',
};

/** LIT CONTROL: every remedy, and both enforced keys, are declared, writable members. */
export const authoredRemediesAreDeclared: ObjectGridSchemaType = {
  ...NODE,
  ...REMEDIES,
  description: { en: 'Everyone you work with', fr: 'Tous vos contacts' },
  emptyState: { title: 'No contacts yet', message: 'Add one to get started', icon: 'users' },
};

describe('the TypeScript twin', () => {
  it('is compiled by this package’s type-check leg, which is where the bindings above are read', () => {
    expect([
      authoredRowSpecActionsRefused,
      authoredBulkSpecActionsRefused,
      authoredNameRefused,
      authoredPlaceholderRefused,
      authoredRemediesAreDeclared,
    ]).toHaveLength(5);
  });
});
