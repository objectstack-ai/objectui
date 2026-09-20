/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7719 — `shortcut` is REFUSED BY NAME on an app action ITEM
 * (`AppAction.items`, i.e. the legacy `AppMenuItem`), on BOTH faces.
 *
 * ## The ruling, quoted rather than paraphrased
 *
 * Director seat decision batch #70, 2026-09-07, maintainer verbatim 「同意」:
 *
 * > The deprecated `AppMenuItem` does not grow a `shortcut` member (option B
 * > refused: zero measured pull, and the type is being retired in favour of
 * > `NavigationItem`); `AppAction.items` is not re-typed to the overlay
 * > `MenuItem` (option C refused, as on #6854). The one change: an authored
 * > `shortcut` on an app action item is **refused by name** on the legacy
 * > mirror (`shortcut?: never` on the TS face, a named refusal on
 * > `MenuItemSchema` in `app.zod.ts`) with a message pointing at
 * > `NavigationItem`, so the key is no longer stripped in silence. ⛔ No read is
 * > re-added in `LayoutRenderer`; the #6854 pin stays as is.
 *
 * ⇒ This file pins the ruling's THREE clauses: the TS `never`, the named mirror
 * refusal, and — block (e) — the untouched renderer contract.
 *
 * ## ⚠️ The failure mode here is STRIP, not KEEP — measured, and it differs
 * ## from the family's other retirements
 *
 * objectui#7997 (`DetailViewSchema.related`) recorded that a dropped member key
 * is KEPT: `BaseSchemaCore` ends `.passthrough()` and the TypeScript
 * `BaseSchema` closes with an any-valued index signature. ⛔ That mechanism does
 * NOT apply to this surface and assuming it would misdescribe the change.
 * `MenuItemSchema` is a plain `z.object` under a `z.lazy`, built on no base, and
 * `AppMenuItem` declares no index signature ⇒ an undeclared key is STRIPPED,
 * silently, and never reaches `.data`. Block (c) takes that reading rather than
 * restating it, and the distinction is the point: both mechanisms are a SILENT
 * ACCEPT, so a bare non-declaration refuses nothing either way — but only one of
 * them leaves the value visible afterwards, and here it does not. "Stripped in
 * silence" is the card's own phrase and it is the accurate one.
 *
 * ## Which refusal helper, and why it is a measurement rather than a taste
 *
 * `retirementTombstone()` — `z.never({ error }).optional().describe()`.
 *
 *  - ⛔ NOT `handlerKeyRefusal()`, despite the in-file precedent on the sibling
 *    `AppActionSchema.onClick`. Two independent reasons, the second decisive:
 *    its message says JSON has no function value, which is FALSE of a
 *    string-valued key an author can perfectly well write; and its `z.custom`
 *    primitive makes `z.toJSONSchema` THROW. Measured before this change:
 *    `z.toJSONSchema(MenuItemSchema)` SUCCEEDS in both `io` directions while
 *    `z.toJSONSchema(AppActionSchema)` already throws — because of that very
 *    `onClick` arm. Choosing `handlerKeyRefusal` here would have taken
 *    `MenuItemSchema` from representable to throwing. Block (f) pins it.
 *  - ⛔ NOT `aliasKeyRefusal()`: that helper composes "Did you mean `shortcut` →
 *    `<canonical>`?", and there is no canonical member of `MenuItemSchema`
 *    meaning a keyboard shortcut. The remedy here is a different TYPE
 *    (`NavigationItem`), not a sibling spelling, so that helper could only be
 *    made to say something untrue.
 *  - ✅ `retirementTombstone()` is the helper whose own contract is this exact
 *    situation — "a key that stays declared but is unwritable, so an authored
 *    value is REFUSED loudly instead of being silently stripped the way an
 *    undeclared key would be". Declaration history does not separate it from its
 *    siblings: the overlay `MenuItemSchema.type` (objectui#6523) is a
 *    `retirementTombstone` for a spelling that was NEVER declared either, which
 *    is precisely this case.
 *  - ⛔ And not `@objectstack/spec`'s own `retiredKey`, whose describe contract
 *    prefixes `[REMOVED] `; these describe strings are this package's published
 *    metadata.
 *
 * ## Which program checks this file
 *
 * `packages/types`' `type-check` runs THREE programs; this file is in the third
 * (`tsconfig.test.json` — `tsc --noEmit` builds `tsconfig.json`, which excludes
 * `__tests__/` by directory). ⚠️ The type-level rows in block (a) are therefore
 * pinned by `tsc`, ⛔ NOT by vitest, which strips types and would pass them
 * vacuously. Both are run and reported.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { AppAction, AppMenuItem } from '../app';
import { AppActionSchema, MenuItemSchema } from '../zod/app.zod';

/** Mutual assignability, the standard invariant `Eq` — not `extends`. */
type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
  ? true
  : false;

/* ── (a) the TypeScript face ──────────────────────────────────────────────── */

describe('objectui#7719 — the TypeScript face refuses `shortcut` on `AppMenuItem`', () => {
  it('the member is a `never` tombstone — neither a value type nor an absent key', () => {
    // ⚠️ Pinned by `tsc -p tsconfig.test.json`; vacuous under vitest.
    //
    // PROVING REMOVAL: delete `shortcut?: never` from `AppMenuItem` and this
    // line stops COMPILING (TS2339 — the property does not exist), which is the
    // pre-change state of this tree. Re-declare it as `shortcut?: string`
    // (option B, the thing the ruling refused) and mutual assignability fails in
    // the other direction. Both directions matter and a one-way `extends` would
    // have caught only one of them.
    const _tombstoned: Eq<AppMenuItem['shortcut'], undefined> = true;
    expect(_tombstoned).toBe(true);
  });

  it('authoring a shortcut on a menu item no longer compiles', () => {
    // PROVING REMOVAL: widen the member to `shortcut?: string` and this row
    // reds — the `@ts-expect-error` goes unused (TS2578). That is the direction
    // worth guarding: this row is what turns a future option-B patch red.
    const item: AppMenuItem = {
      label: 'Profile',
      // @ts-expect-error `shortcut` is refused on an app action item — author navigation as `NavigationItem` (objectui#7719)
      shortcut: 'Ctrl+P',
    };
    expect(item.label).toBe('Profile');
  });

  it('CONTROL — the REST of `AppMenuItem` still type-checks; this is one member, not a closed face', () => {
    const item: AppMenuItem = {
      type: 'item',
      label: 'Profile',
      icon: 'user',
      path: '/profile',
      badge: 3,
      hidden: false,
    };
    expect(item.path).toBe('/profile');
  });

  it('CONTROL — `AppAction.shortcut` is a DIFFERENT key, still declared and still a `string`', () => {
    // ⭐ The non-target control, and the reason it is in this file: the first
    // reading of a `grep` for `shortcut` over `app.ts` finds THIS member and
    // reads it as "option B is already landed". It is the header BUTTON's own
    // shortcut, one level up from `items[]`, and the ruling does not touch it.
    //
    // PROVING REMOVAL: retire `AppAction.shortcut` too — over-applying this card
    // to every `shortcut` in the file — and this row reds in both halves.
    const _stillAString: Eq<AppAction['shortcut'], string | undefined> = true;
    expect(_stillAString).toBe(true);
    const action: AppAction = { type: 'button', label: 'Search', shortcut: 'Ctrl+K' };
    expect(action.shortcut).toBe('Ctrl+K');
  });
});

/* ── (b) the zod mirror ───────────────────────────────────────────────────── */

describe('objectui#7719 — the JSON face refuses `shortcut` by name', () => {
  const authored = { type: 'item' as const, label: 'Profile', shortcut: 'Ctrl+P' };

  it('a menu item authoring `shortcut` is refused', () => {
    // It parsed GREEN before this card — green, and one key lighter. That is the
    // accept-set narrowing the changeset declares.
    expect(MenuItemSchema.safeParse(authored).success).toBe(false);
  });

  it('the issue is addressed to `shortcut` and points the author at `NavigationItem`', () => {
    // A refusal an author cannot act on is half a refusal. `retirementTombstone`
    // feeds ONE guidance string into both the parse-time message and
    // `.describe()`, so what an author reads and what generated docs publish
    // cannot drift apart.
    const r = MenuItemSchema.safeParse(authored);
    expect(r.success).toBe(false);
    if (r.success) return;
    const issue = r.error.issues.find((i) => i.path[0] === 'shortcut');
    expect(issue, 'no issue was addressed to `shortcut`').toBeDefined();
    expect(issue!.message).toContain('NavigationItem');
    expect(issue!.message).toContain('objectui#7719');
    // ⚠️ The message must not read as though `shortcut` is refused on app
    // actions generally — it is refused on the ITEMS. It says so by naming the
    // surviving sibling explicitly.
    expect(issue!.message).toContain('AppAction.shortcut');
  });

  it('the refusal reports `invalid_type` at the key path — the `z.never` code, not `custom`', () => {
    // Pins WHICH helper landed, from the outside. `handlerKeyRefusal`'s
    // `z.custom` would report `custom` here; see block (f) for why that would
    // also have broken JSON-Schema emission.
    const r = MenuItemSchema.safeParse(authored);
    expect(r.success).toBe(false);
    if (r.success) return;
    const issue = r.error.issues.find((i) => i.path[0] === 'shortcut');
    expect(issue!.code).toBe('invalid_type');
  });

  it('CONTROL — the same document parses green with `shortcut` removed', () => {
    // Says the refusal above is about this member and not about the fixture.
    const { shortcut: _dropped, ...withoutShortcut } = authored;
    expect(MenuItemSchema.safeParse(withoutShortcut).success).toBe(true);
  });

  it('CONTROL — the mirror still refuses a genuinely malformed item', () => {
    // And says the green above is a reading rather than a mirror that accepts
    // anything: `type` is an enum.
    expect(MenuItemSchema.safeParse({ type: 'not-a-menu-item-type' }).success).toBe(false);
  });

  it('the refusal is inherited by nested `children`, which are the same schema', () => {
    // `children: z.array(MenuItemSchema)` is recursive through `z.lazy`, so a
    // refusal that only held at the top level would be a half-refusal.
    const r = MenuItemSchema.safeParse({
      type: 'group',
      label: 'More',
      children: [{ label: 'Profile', shortcut: 'Ctrl+P' }],
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path.join('.') === 'children.0.shortcut')).toBe(true);
  });
});

/* ── (c) why it had to be a refusal — the SILENT STRIP, measured here ─────── */

describe('objectui#7719 — a bare non-declaration strips in silence; it refuses nothing', () => {
  it('an UNDECLARED sibling key is accepted and STRIPPED — it never reaches `.data`', () => {
    // THE LOAD-BEARING ROW of this file: without it, "leaving `shortcut`
    // undeclared would not have refused it" is unfalsifiable prose. Here it is a
    // reading taken on this very schema. `keyboardShortcut` is declared nowhere;
    // the parse SUCCEEDS and the key is gone from the output.
    //
    // ⚠️ Deliberately different from objectui#7997's reading on
    // `DetailViewSchema`, where the undeclared key SURVIVES into `.data` because
    // `BaseSchemaCore` ends `.passthrough()`. This mirror has no base and no
    // passthrough. Same conclusion, different mechanism; ⛔ do not copy that
    // file's wording onto this surface.
    //
    // PROVING REMOVAL: append `.passthrough()` to the object inside the `z.lazy`
    // and the second assertion reds (the key survives) while the first stays
    // green — which is exactly how this row tells the two mechanisms apart.
    const r = MenuItemSchema.safeParse({ type: 'item', label: 'Profile', keyboardShortcut: 'Ctrl+P' });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(Object.keys(r.data as Record<string, unknown>)).not.toContain('keyboardShortcut');
  });

  it('and the tombstoned key does NOT get that treatment — the pair is the whole argument', () => {
    // The same parse, one key swapped. Undeclared: accepted and stripped.
    // Tombstoned: refused by name. That difference IS this card.
    expect(
      MenuItemSchema.safeParse({ type: 'item', label: 'Profile', shortcut: 'Ctrl+P' }).success,
    ).toBe(false);
  });
});

/* ── (d) the real authoring position: `AppAction.items[]` ─────────────────── */

describe('objectui#7719 — the refusal holds where an author actually writes it', () => {
  const action = {
    type: 'user' as const,
    label: 'Ada Lovelace',
    items: [{ label: 'Profile', shortcut: 'Ctrl+P' }],
  };

  it('an app action whose item carries `shortcut` is refused at `items.0.shortcut`', () => {
    // Block (b) parses `MenuItemSchema` directly; this one goes through the
    // declaration an author actually writes, so a refusal that existed only on
    // the standalone const would show up here as green.
    const r = AppActionSchema.safeParse(action);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path.join('.') === 'items.0.shortcut')).toBe(true);
  });

  it('CONTROL — the SAME action parses green carrying `shortcut` on the ACTION itself', () => {
    // ⭐ The mirror half of block (a)'s non-target control, and the row that
    // stops this card from being read as "shortcut is refused on app actions".
    // The header button's own shortcut is declared, untouched, and still green.
    //
    // PROVING REMOVAL: move the tombstone one declaration up — onto
    // `AppActionSchema` instead of `MenuItemSchema` — and this row reds while
    // block (d)'s first row goes green. The pair localises the change to the
    // right declaration, which a single row could not do.
    const r = AppActionSchema.safeParse({
      type: 'user' as const,
      label: 'Ada Lovelace',
      shortcut: 'Ctrl+K',
      items: [{ label: 'Profile' }],
    });
    expect(r.success).toBe(true);
  });
});

/* ── (e) the renderer contract the ruling left ALONE ──────────────────────── */

describe('objectui#7719 — the eight authorable members are untouched: this narrows one key, not the face', () => {
  it('every declared member of the legacy item still parses green', () => {
    // ⛔ The ruling refused option C (re-typing `AppAction.items` to the overlay
    // `MenuItem`), whose cost was precisely that `path` / `href` / `badge` /
    // `type` would start being refused and the divider spelling would change.
    // This row is what turns such a re-type red, and it is the reason a
    // retirement pin is not allowed to only prove absence.
    const r = MenuItemSchema.safeParse({
      type: 'item',
      label: 'Profile',
      icon: 'user',
      path: '/profile',
      href: 'https://example.com',
      badge: 7,
      hidden: false,
      children: [{ type: 'item', label: 'Nested' }],
    });
    expect(r.success).toBe(true);
  });

  it('the legacy divider spelling `{ "type": "separator" }` still parses green', () => {
    // Option C would have moved this to `{ "separator": true }`.
    expect(MenuItemSchema.safeParse({ type: 'separator' }).success).toBe(true);
  });
});

/* ── (f) the helper choice, pinned from the outside ───────────────────────── */

describe('objectui#7719 — `MenuItemSchema` stays representable in JSON Schema, because the arm is `z.never`', () => {
  it('`z.toJSONSchema(MenuItemSchema)` still succeeds in both io directions', () => {
    // MEASURED BEFORE THIS CHANGE: it succeeded. `handlerKeyRefusal`'s
    // `z.custom` would have made it throw ("Custom types cannot be represented
    // in JSON Schema") — the same reason objectui#7694 gives for `aliasKeyRefusal`
    // not borrowing that primitive. This row is the helper choice stated as a
    // consequence an outsider can check.
    expect(() => z.toJSONSchema(MenuItemSchema, { io: 'input' })).not.toThrow();
    expect(() => z.toJSONSchema(MenuItemSchema, { io: 'output' })).not.toThrow();
  });

  it('the emitted `shortcut` property is the unsatisfiable `{ not: {} }`, carrying the guidance', () => {
    // ONE string, BOTH channels: the parse message asserted in block (b) and
    // this published description are the same argument to `retirementTombstone`,
    // so they cannot drift apart.
    const js = z.toJSONSchema(MenuItemSchema, { io: 'input' }) as {
      properties?: Record<string, { not?: unknown; description?: string }>;
    };
    const prop = js.properties?.shortcut;
    expect(prop, 'no `shortcut` property was emitted').toBeDefined();
    expect(prop!.not).toEqual({});
    expect(prop!.description).toContain('NavigationItem');
  });

  it('CONTROL — a `z.custom` arm really does throw, so the row above is not vacuous', () => {
    // Without this, "we avoided `z.custom` for a reason" is a claim about a
    // library rather than a reading of it.
    expect(() => z.toJSONSchema(z.object({ k: z.custom<never>(() => false).optional() }))).toThrow(
      /cannot be represented in JSON Schema/,
    );
  });
});
