/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#9606 — `ObjectKanbanSchema` declares `cardTitle`, the CANONICAL
 * card-title spelling, on both published faces. The legacy alias `titleField`
 * beside it stays declared and is NOT retired here.
 *
 * ## What was measurably wrong
 *
 * `@objectstack/spec` declares BOTH keys on `ObjectKanbanPropsSchema` —
 * `cardTitle` ("Field rendered as each card title") and `titleField` ("Legacy
 * fallback for `cardTitle` … Prefer `cardTitle`"). `plugin-kanban`'s
 * registration `inputs` declare both the same way, `resolveKanbanTitleField`
 * reads `cardTitle` FIRST, and this repository's root README teaches
 * `cardTitle`. This mirror declared the ALIAS ONLY: `cardTitle` read zero times
 * in `../zod/objectql.zod.ts` against a lit control of 262 `key: z.…`
 * declarations in that same file.
 *
 * ⇒ the canonical key rode `BaseSchema`'s `.passthrough()` unjudged. Measured
 * on `origin/main` `2923cea165`, and again after the declaration, with the same
 * probe — the opposite-answer pair this file freezes:
 *
 * | `safeValidateSchema({ type: 'object-kanban', objectName: 'tasks', groupBy: 'status', cardTitle: 42 })` | reading |
 * |---|---|
 * | before | `success = true`, and the parsed document KEEPS `cardTitle: 42` |
 * | after  | `success = false`, `cardTitle: Invalid input: expected string, received number` |
 *
 * A non-string reached `resolveKanbanTitleField`, which returns it as a record
 * FIELD NAME (`if (schema?.cardTitle) return schema.cardTitle;`), so the value
 * did not stop at the validator. The protocol refused that same document all
 * along; this face did not.
 *
 * ## ⛔ Why `titleField` is still here
 *
 * Director seat, batch #150 item 3, letter 1 (maintainer 「同意」): a mirror
 * cannot be narrower than the spec it mirrors, and `@objectstack/spec` still
 * declares the alias. Retiring it is an `@objectstack/spec` card (an ADR-0087
 * conversion), not a local edit. The third pin below is therefore a CONTROL as
 * much as a pin: a change that reddens it has retired something this ruling
 * forbids retiring.
 *
 * ## The firing control, and why it is this one
 *
 * Every refusal below is paired with the SAME value written under a key NOTHING
 * declares. That document is ACCEPTED, because `BaseSchema` is `.passthrough()`
 * — which is exactly the state `cardTitle` itself was in before this card. So
 * the control is not a re-implementation of the old face; it IS the old face's
 * mechanism, reached through a key nothing declares. Delete the `cardTitle`
 * declaration and every refusal here goes green while the control stays green:
 * the instrument reports its own removal.
 *
 * ## Direction
 *
 * Declaring a key on a face that already carries `.passthrough()` /
 * `[key: string]: any` can only NARROW what that face accepts, and it narrows
 * to the SPEC's own accepted set rather than below it — `Clause-②`. The
 * direction check is asserted in the first block below rather than argued in
 * prose.
 */

import { describe, it, expect } from 'vitest';

import { ObjectKanbanSchema } from '../zod/objectql.zod';
import { safeValidateSchema } from '../zod/index.zod';
import type { ObjectKanbanSchema as TsObjectKanbanSchema } from '../objectql';

/** The board every document below is a variation of — the card's own subject. */
const BOARD = { type: 'object-kanban', objectName: 'tasks', groupBy: 'status' } as const;

const board = (patch: Record<string, unknown>): Record<string, unknown> => ({ ...BOARD, ...patch });

/** Report the issues rather than `false`, so a red run says what broke. */
const reasons = (doc: unknown): string[] => {
  const r = ObjectKanbanSchema.safeParse(doc);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('the declaration narrows and cannot widen (objectui#9606)', () => {
  it('the face it sits on is passthrough, so an undeclared key was already accepted', () => {
    // If this ever fails, `cardTitle` was not riding an index signature before
    // this card and the whole "narrow only" reasoning has to be re-derived.
    const r = ObjectKanbanSchema.safeParse(board({ cardTitleUndeclared: 42 }));
    expect(r.success).toBe(true);
    expect(r.success && (r.data as Record<string, unknown>).cardTitleUndeclared).toBe(42);
  });

  it('a board that authored neither spelling is untouched', () => {
    expect(reasons({ ...BOARD })).toEqual([]);
  });
});

/* ── The three pins the ruling names ──────────────────────────────────────── */

describe('the ruling\'s pins (objectui#9606)', () => {
  it('REFUSES `cardTitle: 42` — the defect this card was filed for', () => {
    expect(reasons(board({ cardTitle: 42 }))).toEqual(['cardTitle: Invalid input: expected string, received number']);
  });

  it('CONTROL — the same 42 under an undeclared key is ACCEPTED and KEPT', () => {
    // The only difference between this document and the one above is the key
    // name, so the refusal comes from THIS declaration and from nothing else on
    // the face.
    expect(reasons(board({ cardTitleUndeclared: 42 }))).toEqual([]);
  });

  it('ACCEPTS `cardTitle: "name"` — the canonical spelling the README teaches', () => {
    expect(reasons(board({ cardTitle: 'name' }))).toEqual([]);
  });

  it('⛔ STILL ACCEPTS `titleField: "name"` — the legacy alias is NOT retired here', () => {
    // Reddening this row means the alias was retired. The ruling forbids that:
    // the spec still declares it, and a mirror may not be narrower than the
    // spec it mirrors.
    expect(reasons(board({ titleField: 'name' }))).toEqual([]);
  });

  it('accepts BOTH spellings on one board — the pair the renderer reads as `cardTitle || titleField`', () => {
    expect(reasons(board({ cardTitle: 'name', titleField: 'subject' }))).toEqual([]);
  });
});

/* ── The same readings through the PUBLISHED entry point the card measured ── */

describe('through `safeValidateSchema`, the face the card probed (objectui#9606)', () => {
  it('`cardTitle: 42` no longer succeeds, and no document carries the 42 onward', () => {
    const r = safeValidateSchema(board({ cardTitle: 42 }));
    expect(r.success).toBe(false);
  });

  it('`cardTitle: "name"` succeeds and the value survives the parse', () => {
    const r = safeValidateSchema(board({ cardTitle: 'name' }));
    expect(r.success).toBe(true);
    expect(r.success && (r.data as Record<string, unknown>).cardTitle).toBe('name');
  });

  it('`titleField: "name"` still succeeds — the control, one level up', () => {
    const r = safeValidateSchema(board({ titleField: 'name' }));
    expect(r.success).toBe(true);
    expect(r.success && (r.data as Record<string, unknown>).titleField).toBe('name');
  });
});

/* ── Type-level: the TS twin mirrors the zod face at the same requiredness ── */

/** The canonical spelling annotates — it is a declared member now, not an index-signature ride. */
export const CANONICAL_BOARD: TsObjectKanbanSchema = {
  type: 'object-kanban',
  objectName: 'tasks',
  groupBy: 'status',
  cardTitle: 'name',
};

/** The legacy alias still annotates — the type-level half of the third pin. */
export const LEGACY_BOARD: TsObjectKanbanSchema = {
  type: 'object-kanban',
  objectName: 'tasks',
  groupBy: 'status',
  titleField: 'name',
};

/** Both at once, as the precedence rule (`cardTitle || titleField`) presumes possible. */
export const BOTH_SPELLINGS_BOARD: TsObjectKanbanSchema = {
  type: 'object-kanban',
  objectName: 'tasks',
  groupBy: 'status',
  cardTitle: 'name',
  titleField: 'subject',
};

/**
 * ⭐ The TS twin's OWN failing instrument, and the reason this file needs one.
 *
 * The zod declaration is pinned by the runtime rows above. The TypeScript twin is
 * NOT: measured by ablation on this tree, deleting `cardTitle?: string` from the
 * `ObjectKanbanSchema` interface leaves `pnpm --filter @object-ui/types type-check`
 * at EXIT 0, the zod-mirror-parity ratchet included. That is structural, not a
 * threshold — {@link BaseSchema} carries `[key: string]: any`, so the ratchet's
 * `DeclaredKeys` sees the twin ACCEPTING every name already, and its three
 * measures (narrower-than-declared, unmirrored-declared, wider-than-declared) all
 * read a mirrored-but-undeclared key as agreement. ⛔ So "the ratchet keeps the
 * twin honest" is not a claim this repository's instruments support in THAT
 * direction; the twin is declared because it is the PUBLISHED `.d.ts` surface an
 * author's editor reads, and this directive is what makes that declaration
 * measurable.
 *
 * The directive is REAL enforcement: with the member declared, `42` is not
 * assignable to `string | undefined` and the error it expects exists. Delete the
 * member and the index signature admits the `42`, the expected error disappears,
 * and `tsc` reddens with TS2578 — an unused `@ts-expect-error`. Measured both ways.
 */
export const NON_STRING_CARD_TITLE_IS_REFUSED_AT_COMPILE_TIME: TsObjectKanbanSchema = {
  type: 'object-kanban',
  objectName: 'tasks',
  groupBy: 'status',
  // @ts-expect-error — `cardTitle` names a record FIELD, so a number cannot be one.
  // This is the compile-time half of the runtime refusal pinned above.
  cardTitle: 42,
};

/** Neither — both members are OPTIONAL on both faces, which is what keeps the parity ratchet at zero. */
export const NEITHER_SPELLING_BOARD: TsObjectKanbanSchema = {
  type: 'object-kanban',
  objectName: 'tasks',
  groupBy: 'status',
};

describe('the TS face admits what the zod face admits (objectui#9606)', () => {
  it.each([
    ['the canonical spelling', CANONICAL_BOARD],
    ['the legacy alias', LEGACY_BOARD],
    ['both spellings', BOTH_SPELLINGS_BOARD],
    ['neither spelling', NEITHER_SPELLING_BOARD],
  ])('the annotated board with %s also parses', (_name, doc) => {
    expect(reasons(doc)).toEqual([]);
  });
});
