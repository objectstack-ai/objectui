/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `AppActionSchema.onClick`'s retirement message says something FALSIFIABLE
 * about this tree, so it is pinned here (objectui#6854, maintainer ruling of
 * 2026-09-05, option B2).
 *
 * The message `handlerKeyRefusal('onClick', 'retired', …)` generates ends:
 *
 *   > … and no renderer reads this key, so nothing could ever run it.
 *
 * That sentence was FALSE when this card was filed. `@object-ui/runner`'s
 * `LayoutRenderer` mapped `AppAction.items` and reached `(item as any).onClick`
 * — past the declared element type, which is `AppMenuItem` and has no such key
 * — leaving three mutually exclusive signals for a reader to pick from: the
 * TypeScript face said `?: never`, the validator said nobody reads it, and a
 * renderer read it. The ruling closed that by deleting the cast rather than by
 * softening the sentence, so the sentence is true again and this file is what
 * keeps it that way from the `packages/types` side: edit the shared template in
 * `zod/tombstone.zod.ts` and this test names what the edit costs.
 *
 * The renderer side is pinned where the renderer lives —
 * `packages/runner/src/__tests__/LayoutRenderer.appActionItems-6854.test.tsx`
 * drives a real menu and requires an authored `onClick` never to be invoked.
 * Neither pin can see the other's package, which is the point: the claim is
 * about both, so it takes an assertion on each side.
 *
 * ⛔ NOT a pin on the template's exact prose in general — 22 other retired keys
 * share it and their own message assertions live with them. This one asserts
 * the clause whose truth this card measured.
 */

import { describe, it, expect } from 'vitest';
import { AppActionSchema, MenuItemSchema } from '../zod/app.zod';

/** The clause this card measured. Spelled out, not built from the template. */
const MEASURED_CLAUSE = 'no renderer reads this key, so nothing could ever run it';

const onClickArm = AppActionSchema.shape.onClick;
const describeText = (onClickArm as { description?: string }).description;

describe('AppActionSchema.onClick — the retirement message states a measured fact (objectui#6854)', () => {
  it('claims, verbatim, that no renderer reads the key', () => {
    expect(describeText).toContain(MEASURED_CLAUSE);
  });

  it('names the key and marks it RETIRED, not a runtime slot', () => {
    expect(describeText).toContain('`onClick`');
    expect(describeText).toContain('RETIRED (objectui#6124');
    expect(describeText).not.toContain('RUNTIME SLOT');
  });

  it('an authored value is refused BY NAME, carrying that same sentence to the author', () => {
    const result = AppActionSchema.safeParse({
      type: 'button',
      label: 'Quick actions',
      onClick: 'openQuickActions',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues.find((i) => String(i.path[0]) === 'onClick');
    expect(issue, 'no issue addressed to `onClick`').toBeDefined();
    expect(issue!.code).toBe('custom');
    // ONE string feeds both author-facing channels (the `handlerKeyRefusal`
    // invariant): the parse-time message an author reads cannot drift away from
    // the `.describe()` metadata the docs surface publishes.
    expect(issue!.message).toBe(describeText);
    expect(issue!.message).toContain(MEASURED_CLAUSE);
  });

  it('the action without the key parses green — the refusal is about the key, not the action', () => {
    expect(AppActionSchema.safeParse({ type: 'button', label: 'Quick actions' }).success).toBe(true);
  });
});

describe('why the cast could never have been fed by an author (objectui#6854 Zone 2, the premise)', () => {
  // `AppAction.items` is parsed by the LEGACY `MenuItemSchema`, a plain
  // `z.object` — so `onClick` is not refused there, it is STRIPPED in silence.
  // An author therefore has no declared route to send it, which is what made
  // deleting the two reads a cleanup rather than a behaviour removal.
  //
  // ⭐ UPDATED by objectui#7719 (director seat decision batch #70 of 2026-09-07):
  // this block used to carry `shortcut` in the same fixture and the same
  // sentence, and recorded "whether `shortcut` SHOULD become authorable here is
  // a separate contract question" as OPEN. It is answered — `shortcut` does not
  // become authorable, and it is no longer stripped here either: it is a named
  // `retirementTombstone()` refusal pointing at `NavigationItem`. So the two
  // keys no longer share a fate and no longer share a fixture.
  // ⛔ The Zone-2 premise this file exists for is UNCHANGED, and in fact
  // stronger: an author still has no declared route to send either key, and is
  // now told so for one of them. The `shortcut` contract itself is pinned in
  // `./app-menu-item-shortcut-refusal-7719.test.ts`, not here.
  const authored = { label: 'Profile', onClick: 'goProfile' };

  it('the items mirror accepts the document and drops the undeclared `onClick`', () => {
    const result = MenuItemSchema.safeParse(authored);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const parsed = result.data as Record<string, unknown>;
    expect(parsed.label).toBe('Profile');
    expect('onClick' in parsed).toBe(false);
  });

  it('an authored `shortcut` on the same item is REFUSED, not dropped (objectui#7719)', () => {
    // Kept HERE, beside the `onClick` row, rather than only in the #7719 pin:
    // the two keys were one sentence in objectui#6854 and are two contracts now,
    // and this pair is what stops them being conflated again. Swap either
    // expectation and the file says which key it is describing.
    const result = MenuItemSchema.safeParse({ ...authored, shortcut: 'Ctrl+P' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => String(i.path[0]) === 'shortcut')).toBe(true);
  });

  it('a whole action carrying such an item parses green, with the item scrubbed', () => {
    const result = AppActionSchema.safeParse({
      type: 'user',
      label: 'Ada Lovelace',
      items: [authored, { type: 'separator' }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    // Through `unknown`: `AppActionSchema.items` used to infer as `any[]`, because its
    // element mirror `MenuItemSchema` was annotated `z.ZodType<any>` to break its own
    // recursion. objectui#7760 gave that mirror its declaration as both type arguments,
    // so the element is `AppMenuItem` now and a direct assertion to an index-signature
    // type no longer overlaps. The assertion below still reads the RUNTIME object,
    // which is the point of this file: whether a key survived a parse is not something
    // any static type can answer.
    //
    // ⭐ It used to be a PAIR, asserting `onClick` and `shortcut` both gone, driven by a
    // fixture that carried both keys. objectui#7719 split the two contracts, so only the
    // `onClick` half belongs here — and `authored` above no longer carries `shortcut` at
    // all. `shortcut` is no longer an UNDECLARED key that gets scrubbed; it is a declared
    // `retirementTombstone`.
    //
    // ⛔ Do not restore the second assertion. Restored ALONE it would still pass, because
    // this fixture has no `shortcut` for the parse to refuse — a green row asserting the
    // absence of a key nobody wrote, which pins nothing. Making it mean anything would
    // require putting `shortcut` back into `authored`, and THAT is what turns this block
    // red: the parse fails, `result.success` is false, and the early return above fires
    // before `first` is ever destructured. So the two halves cannot share one fixture any
    // more, which is the whole reason they were split. The refusal is pinned by the row
    // named "an authored `shortcut` on the same item is REFUSED, not dropped" — cited by
    // NAME, because a positional reference goes stale the moment a row is inserted — and
    // the contract itself by `./app-menu-item-shortcut-refusal-7719.test.ts`.
    const [first] = (result.data as unknown as { items: Record<string, unknown>[] }).items;
    expect('onClick' in first).toBe(false);
  });
});
