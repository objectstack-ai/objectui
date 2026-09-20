/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The shipped `ui:tabs` registration's `defaultProps.items` satisfy the
 * published `TabItemSchema` (objectui#9941).
 *
 * ## The defect this pin was built around
 *
 * `TabItemSchema` (`packages/types/src/zod/layout.zod.ts`, cited by SYMBOL —
 * objectui#8875) declares `content` with **no** `.optional()` — required — and
 * declares **no `body` member at all**. The registration seeded three items
 * that spelled `body` and omitted `content`, so the default an author drops on
 * a canvas was refused by the validator this repository publishes for it:
 *
 *     invalid_type ["content"] expected nonoptional, received undefined
 *
 * ⚠️ The defect was never visible in the rendered UI. `tabs.tsx` reads
 * `renderChildren(item.content || (item as any).body)` — `content` first, `body`
 * through an `any` cast — so the seeded nodes drew from the fallback arm. It was
 * the DECLARED contract that refused them, and only a parse can see that.
 *
 * ## Why this pin parses instead of reading the spelling
 *
 * A test asserting the three items spell `content` is satisfied forever by a
 * copy-paste of the literal; it re-states the fix instead of checking it. This
 * one feeds whatever the registry actually carries through the published schema,
 * so it fails the day anyone re-spells a member, adds a fourth item that omits
 * `content`, or moves the seed — and it fails for the same reason the card was
 * filed, not for a reason a reader has to reconstruct.
 *
 * Both faces are read off live artifacts: the seed off `ComponentRegistry` (the
 * object a designer palette consumes), the contract off `@object-ui/types/zod`
 * (the object a validator consumes). Nothing below is a copy of either.
 *
 * ## Which rows discriminate, and which are controls
 *
 * ⚠️ The `controlB` rows are green in BOTH worlds BY DESIGN — that is the whole
 * claim of this card. The repair is at the parse, so a row that moved with it
 * would be evidence the repair was visual after all. The rows that discriminate
 * are the three subject rows; `controlA` and `controlB` exist to prove the
 * instrument can fail and that the UI did not follow, respectively.
 *
 * ## The instrument's two failure modes, each with its own control
 *
 * 1. **A parse over nothing is green.** An empty (or missing) `items` array
 *    makes `every item parses` vacuously true, so the seed's presence and
 *    non-emptiness are asserted first, as their own rows.
 * 2. **A parse that cannot refuse anything is green.** `controlA` feeds the
 *    pre-fix item — the same objects with `content` re-spelled back to `body` —
 *    to the same call and requires a refusal that names `content`. If that row
 *    goes green the subject rows below measure nothing.
 *
 * ## ⛔ What this pin deliberately does NOT claim
 *
 * - ⛔ It does not assert that `body` is refused. `TabItemSchema` is a stripping
 *   `z.object`, so an undeclared `body` is silently DROPPED, not rejected;
 *   `undeclaredBodyIsDropped` records that as the measured behaviour rather
 *   than letting a later reader assume a strict face.
 * - ⛔ It does not touch the `|| (item as any).body` fallback in `tabs.tsx`.
 *   Retiring that tolerance is the `body`-dialect family's question
 *   (objectui#9871, objectui#9910 — both open, both `needs-user-decision`), and
 *   a pin here must not answer it. ⚠️ `controlB.equality` below is the one row
 *   that READS that arm: it exists to prove this repair was parse-level and not
 *   visual. When the fallback is retired, that row retires WITH it — ⛔ it is
 *   not a reason to weaken the subject, and the durable half of control B
 *   (`controlB.stillRenders`) does not depend on the arm at all.
 * - ⛔ It is not widened past `ui:tabs`. Whether a registration's `defaultProps`
 *   may diverge from its published face across the repository is the open
 *   question on objectui#4631 (`pm:on-hold`), and deciding it by gate rather
 *   than by ruling is the trap the sibling pin in this directory
 *   (`registration-defaults-match-renderer-8229.test.ts`) documents at length.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
// Registered at module scope, NOT in a hook: a cold transform billed to
// `hookTimeout` is narrower than the timeout it replaces (objectui#3010).
import '../../../renderers';
import { TabItemSchema, TabsSchema } from '@object-ui/types/zod';

afterEach(() => cleanup());

type Item = Record<string, unknown>;

const meta = () => ComponentRegistry.getMeta('tabs', 'ui');
const seed = () => (meta()?.defaultProps ?? {}) as Record<string, unknown>;
const seededItems = () => (seed().items ?? []) as Item[];

/**
 * The pre-fix spelling, rebuilt from whatever the registry carries today: the
 * item's child list, wherever it is spelled, moved onto `body` with `content`
 * gone. Reading BOTH spellings keeps this a faithful inverse under ablation —
 * re-spell the seed back to `body` and this returns the seed unchanged, so the
 * control rows stay controls and only the subject rows move.
 */
const preFix = (items: Item[]): Item[] =>
  items.map(({ content, body, ...rest }) => ({ ...rest, body: content ?? body }));

/** Render the registration seed as a `tabs` node and return what it paints. */
function renderSeed(items: Item[]): { text: string; html: string } {
  const C = ComponentRegistry.get('tabs', 'ui');
  if (!C) throw new Error('no renderer registered for ui:tabs');
  render(<C schema={{ type: 'tabs', ...seed(), items }} />);
  // Radix mints a fresh id per mount, so two renders of identical content
  // differ in `id`/`aria-controls`/`aria-labelledby` and nowhere else. Blank
  // those three out; everything that carries meaning survives.
  const html = (document.body.innerHTML ?? '').replace(
    /(id|aria-controls|aria-labelledby)="[^"]*"/g,
    '$1="#"',
  );
  return { text: document.body.textContent ?? '', html };
}

describe('`ui:tabs` defaultProps.items satisfy the published TabItemSchema (objectui#9941)', () => {
  describe('the seed is really there — ⛔ a parse over nothing is vacuously green', () => {
    it('the registration is registered and carries a defaultProps seed', () => {
      expect(meta(), 'ui:tabs is not registered — every row below is vacuous').toBeDefined();
      expect(meta()?.defaultProps).toBeDefined();
    });

    it('the seed carries a non-empty `items` array', () => {
      expect(Array.isArray(seed().items)).toBe(true);
      expect(seededItems().length).toBeGreaterThan(0);
    });
  });

  describe('controlA — the instrument can FAIL', () => {
    it('the pre-fix item is refused, and the refusal names `content`', () => {
      // The exact reading objectui#9941 was filed on, re-taken through the same
      // call the subject rows use. Structured fields only — ⛔ no message prose.
      const refused = preFix(seededItems()).map((item) => TabItemSchema.safeParse(item));
      expect(refused.length).toBeGreaterThan(0);
      for (const r of refused) {
        expect(r.success).toBe(false);
        if (r.success) continue;
        expect(r.error.issues.map((i) => ({ code: i.code, path: i.path.join('.') }))).toContainEqual({
          code: 'invalid_type',
          path: 'content',
        });
        const missing = r.error.issues.find((i) => i.path.join('.') === 'content');
        expect((missing as { expected?: string } | undefined)?.expected).toBe('nonoptional');
      }
    });

    it('undeclaredBodyIsDropped — `body` is stripped by the parse, ⛔ not rejected', () => {
      // Why the refusal above is about the ABSENT key and never about the
      // present one: the face is a stripping `z.object`, so the item's own
      // child list did not survive the parse even before the missing-key error.
      const parsed = TabItemSchema.parse({
        value: 'probe',
        label: 'probe',
        content: [{ type: 'text', content: 'kept' }],
        body: [{ type: 'text', content: 'dropped' }],
      });
      expect(Object.keys(parsed).sort()).toEqual(['content', 'label', 'value']);
      expect(parsed).not.toHaveProperty('body');
    });
  });

  describe('the subject', () => {
    it('every seeded item parses green against `TabItemSchema`', () => {
      const failures = seededItems()
        .map((item, i) => ({ i, r: TabItemSchema.safeParse(item) }))
        .filter(({ r }) => !r.success)
        .map(({ i, r }) =>
          `items[${i}]: ${(r as { error: { issues: { code: string; path: PropertyKey[] }[] } }).error.issues
            .map((issue) => `${issue.code} [${issue.path.join('.')}]`)
            .join(', ')}`,
        );
      expect(
        failures,
        'the shipped default is the metadata an author drops on a canvas — it has to ' +
          'satisfy the schema this repository publishes for it. `TabItem`\'s child key is ' +
          '`content` (⛔ not `body`, ⛔ not `children`); spell the seed that way rather than ' +
          'widening `TabItemSchema`, which would grow an already-published accept set and ' +
          'pre-empt objectui#9871.',
      ).toEqual([]);
    });

    it('the whole registration seed parses as a `tabs` node', () => {
      // One step above the item face: what the designer writes out is the node,
      // not a loose item. Green here is the end-to-end statement of the repair.
      const r = TabsSchema.safeParse({ type: 'tabs', ...seed() });
      expect(r.success, JSON.stringify(r.success ? [] : r.error.issues, null, 1)).toBe(true);
    });

    it('each seeded item keeps a child list after the parse', () => {
      // Green-because-empty guard on the row above: an item whose `content` was
      // an empty array would parse and carry nothing.
      for (const item of seededItems()) {
        const parsed = TabItemSchema.parse(item) as { content: unknown };
        expect(parsed.content).toBeDefined();
        expect(Array.isArray(parsed.content) ? (parsed.content as unknown[]).length : 1).toBeGreaterThan(0);
      }
    });
  });

  describe('controlB — the UI did not move', () => {
    it('stillRenders — the seed paints every label and the first tab body', () => {
      // Durable half: reads only the `content` arm, so it survives whatever
      // objectui#9871 rules about the fallback.
      const { text } = renderSeed(seededItems());
      for (const item of seededItems()) expect(text).toContain(String(item.label));
      expect(text).toContain('Content for Tab 1');
    });

    it('equality — the pre-fix spelling paints exactly the same thing today', () => {
      // ⚠️ THIS ROW READS THE FALLBACK ARM (`item.content || (item as any).body`).
      // It is the proof that objectui#9941 was a parse-level repair and not a
      // visual one: the same nodes moved from the fallback arm onto the primary
      // one. It is ⛔ NOT a claim that the fallback must stay — when
      // objectui#9871 retires it this row goes with it, and `stillRenders`
      // above, plus every subject row, are untouched by that.
      const after = renderSeed(seededItems());
      cleanup();
      const before = renderSeed(preFix(seededItems()));
      expect(before.text).toBe(after.text);
      expect(before.html).toBe(after.html);
      // Lit control: ⛔ two empty renders are also equal.
      expect(after.text).toContain('Content for Tab 1');
    });
  });
});
