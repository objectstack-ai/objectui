/**
 * objectui#9092 — the DECLARED face of group A accepts the spec's inline locale
 * map, and the three pairs no longer restate the key as a plain `string`.
 *
 * ## What this pins, and why the pin has to be two-sided
 *
 * objectui#4580's revised Q1 ruling (option A) widened the label keys to the
 * spec's INLINE locale map, and `BaseSchema` carries it on both faces. Three
 * pairs restated the key as a plain `string`, which is a NARROWING override of
 * the inherited member — so their zod mirrors accepted an authored locale map
 * and `tsc` refused it. The narrowing sat on the DECLARED side, where a forward
 * mirror-vs-declaration comparison reads the pair as clean; `zod-mirror-parity`'s
 * `WiderThanDeclared` ledger is the instrument that saw it, and its entries for
 * these keys retired with this card.
 *
 * A one-sided pin would go green for the wrong reason. `BaseSchema` carries
 * `[key: string]: any`, so a key REMOVED from a declaration type-checks exactly
 * like a key WIDENED — the assignment below would keep compiling if someone
 * deleted the member outright. So each positive case is paired with a
 * `@ts-expect-error` negative on a key that is genuinely a plain `string`: a
 * `@ts-expect-error` whose error stops occurring is itself a compile error, so
 * that half fails loudly if the narrow face ever becomes uncheckable.
 *
 * ⚠️ The vocabulary split this card does NOT touch. The FLAT
 * `BaseSchema.ariaLabel` is the KEYED form (`{ key, defaultValue?, params? }`,
 * resolved by `resolveKeyedI18nLabel`), and objectui#4580 Q2-B withdrew the
 * `I18nLabel` spelling there as measured-wrong. The NESTED `aria.ariaLabel`
 * asserted here is the INLINE form — the spec's own `AriaPropsSchema` spelling,
 * and the one objectui#5134 made `ListView` resolve with `resolveI18nLabel`.
 * The two shapes are structurally confusable and each accepts the other
 * vacuously, so both are asserted here, each against its own vocabulary.
 */
import { describe, it, expect } from 'vitest';
import type { I18nLabel } from '@objectstack/spec/ui';

import type { AppComponentSchema } from '../app';
import type { ObjectGridSchema } from '../objectql';
import type { PageNodeSchema } from '../layout';
import type { BaseSchema } from '../base';

import { AppComponentSchema as AppComponentMirror } from '../zod/app.zod.js';
import { ObjectGridSchema as ObjectGridMirror } from '../zod/objectql.zod.js';
import { PageNodeSchema as PageNodeMirror } from '../zod/layout.zod.js';

/** The spec's inline locale map, as an author writes it. */
const LOCALE_MAP: I18nLabel = { en: 'Accounts', 'fr-FR': 'Comptes' };

describe('objectui#9092 — declared face admits the inline locale map', () => {
  it('AppComponentSchema.label takes the map, and a plain-string sibling still refuses one', () => {
    const widened: AppComponentSchema = { type: 'app', label: LOCALE_MAP };

    // CONTROL — `icon` is a genuinely plain `string` on the same interface and
    // is NOT in this card's scope. If this directive ever reports "unused", the
    // widening has leaked past the keys the ruling names.
    // @ts-expect-error `icon` is `string`; the map is refused here and must stay refused.
    const control: AppComponentSchema = { type: 'app', icon: LOCALE_MAP };

    expect(widened.label).toEqual(LOCALE_MAP);
    expect(control.icon).toEqual(LOCALE_MAP);
  });

  it('ObjectGridSchema.label and .description take the map; `objectName` still refuses one', () => {
    const label: ObjectGridSchema = { type: 'object-grid', objectName: 'accounts', label: LOCALE_MAP };
    const description: ObjectGridSchema = { type: 'object-grid', objectName: 'accounts', description: LOCALE_MAP };

    // CONTROL — `objectName` is a required plain `string` on the same interface.
    // @ts-expect-error `objectName` is `string`; the map is refused here and must stay refused.
    const control: ObjectGridSchema = { type: 'object-grid', objectName: LOCALE_MAP };

    expect(label.label).toEqual(LOCALE_MAP);
    expect(description.description).toEqual(LOCALE_MAP);
    expect(control.objectName).toEqual(LOCALE_MAP);
  });

  it('PageNodeSchema.aria.ariaLabel takes the map; the sibling `ariaDescribedBy` still refuses one', () => {
    const widened: PageNodeSchema = { type: 'page', aria: { ariaLabel: LOCALE_MAP } };

    // CONTROL — `ariaDescribedBy` is an ID reference, `string` in the spec's own
    // `AriaPropsSchema`. It is the sibling KEY on the SAME object, so it also
    // proves the widening landed on one member rather than on the whole slot.
    // @ts-expect-error `ariaDescribedBy` is `string`; the map is refused here and must stay refused.
    const control: PageNodeSchema = { type: 'page', aria: { ariaDescribedBy: LOCALE_MAP } };

    expect(widened.aria?.ariaLabel).toEqual(LOCALE_MAP);
    expect(control.aria?.ariaDescribedBy).toEqual(LOCALE_MAP);
  });

  it('the reference face did not move: BaseSchema.label already took the map before this card', () => {
    // objectui#4580's revised Q1 ruling landed here, and this card is forbidden
    // from touching `base.ts`. This case is the control that holds still.
    const reference: BaseSchema = { type: 'text', label: LOCALE_MAP, description: LOCALE_MAP };
    expect(reference.label).toEqual(LOCALE_MAP);
    expect(reference.description).toEqual(LOCALE_MAP);
  });
});

describe('objectui#9092 — the zod mirrors already accepted what tsc refused', () => {
  // The card's item 4: a mirror that did NOT accept the map would make the pair a
  // defect in the OPPOSITE direction, to be reported rather than silently fixed.
  // Every one of them accepts it, so the repair is declaration-only.
  it('the mirror accepts the map on every key this card widened', () => {
    expect(AppComponentMirror.safeParse({ type: 'app', label: LOCALE_MAP }).success).toBe(true);
    expect(ObjectGridMirror.safeParse({ type: 'object-grid', objectName: 'accounts', label: LOCALE_MAP }).success).toBe(true);
    expect(ObjectGridMirror.safeParse({ type: 'object-grid', objectName: 'accounts', description: LOCALE_MAP }).success).toBe(true);
    expect(PageNodeMirror.safeParse({ type: 'page', name: 'home', aria: { ariaLabel: LOCALE_MAP } }).success).toBe(true);
  });

  it('CONTROL — the same mirrors still refuse a value no arm admits', () => {
    // Without this, the assertions above pass on a mirror that accepts anything.
    expect(AppComponentMirror.safeParse({ type: 'app', label: 42 }).success).toBe(false);
    expect(ObjectGridMirror.safeParse({ type: 'object-grid', objectName: 'accounts', label: 42 }).success).toBe(false);
    expect(ObjectGridMirror.safeParse({ type: 'object-grid', objectName: 'accounts', description: 42 }).success).toBe(false);
    expect(PageNodeMirror.safeParse({ type: 'page', name: 'home', aria: { ariaLabel: 42 } }).success).toBe(false);
  });
});
