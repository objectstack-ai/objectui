// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#10993 — `object-form`'s seven `I18nLabel` members, on BOTH faces of
 * `ObjectFormSchema`.
 *
 * `@objectstack/spec`'s `ComponentPropsMap['object-form']` types `title`,
 * `description`, `submitText`, `cancelText`, `nextText`, `prevText` and
 * `successMessage` as `I18nLabel`: a plain string or an inline per-locale map
 * such as `{ en: 'Save order', 'zh-CN': '保存订单' }`. `ObjectForm` resolves a
 * map against the active UI language (`plugin-form`'s
 * `ObjectForm.i18nLabels.test.tsx` pins the render).
 *
 * ## The zod mirror
 *
 * The mirror declares five of the seven, and it used to declare them
 * `z.string()`: a map the row and the renderer both accept was refused with
 * `invalid_type` at the member. Each is now the spec's `I18nLabelSchema` by
 * reference. The rows below are behavioural: a map and a string parse, and a
 * number is still refused AT THE MEMBER, so the widening is exactly one arm and
 * not an opening. `nextText` and `prevText` are not mirrored (they stay in this
 * pair's `UnmirroredDeclared` entry in `./zod-mirror-parity.test.ts`), and a
 * row records that here so the ledger and this file cannot disagree silently.
 *
 * ## The TypeScript face
 *
 * `assertionLabelMembersAreI18nLabel` holds all seven members equal to
 * `I18nLabel | undefined`. It is checked by this package's `tsconfig.test.json`
 * and fails to compile if any member is narrowed back to `string` or widened
 * past `I18nLabel`.
 */

import { describe, it, expect } from 'vitest';
import { ObjectFormSchema as ObjectFormMirror } from '../zod/objectql.zod.js';
import type { ObjectFormSchema } from '../objectql';
import type { I18nLabel } from '../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
export type assertionLabelMembersAreI18nLabel = [
  Expect<Equal<ObjectFormSchema['title'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['description'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['submitText'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['cancelText'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['nextText'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['prevText'], I18nLabel | undefined>>,
  Expect<Equal<ObjectFormSchema['successMessage'], I18nLabel | undefined>>,
];

/** The five members the mirror declares. */
const MIRRORED = ['title', 'description', 'submitText', 'cancelText', 'successMessage'] as const;

/** A minimal document the mirror accepts. */
const BASE = { type: 'object-form', objectName: 'order', mode: 'create' } as const;

/** `en` first, as in the render pin. */
const MAP = { en: 'Save order', 'zh-CN': '保存订单' };

describe('object-form — the I18nLabel members on the zod mirror (objectui#10993)', () => {
  it('CONTROL: the minimal document parses', () => {
    expect(ObjectFormMirror.safeParse(BASE).success).toBe(true);
  });

  it.each(MIRRORED)('a locale map on `%s` parses', (key) => {
    const parsed = ObjectFormMirror.safeParse({ ...BASE, [key]: MAP });
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect((parsed.data as Record<string, unknown>)[key]).toEqual(MAP);
  });

  it.each(MIRRORED)('CONTROL: a plain string on `%s` parses unchanged', (key) => {
    const parsed = ObjectFormMirror.safeParse({ ...BASE, [key]: 'Save order' });
    expect(parsed.success).toBe(true);
    expect((parsed.data as Record<string, unknown>)[key]).toBe('Save order');
  });

  it.each(MIRRORED)('CONTROL: a number on `%s` is still refused at the member', (key) => {
    const parsed = ObjectFormMirror.safeParse({ ...BASE, [key]: 42 });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.path.join('.'))).toEqual([key]);
  });

  it.each(MIRRORED)('a map entry that is not a string on `%s` is refused', (key) => {
    // The spec's map is `Record<string, string>`: a nested value is judged, not
    // waved through as "some object".
    const parsed = ObjectFormMirror.safeParse({ ...BASE, [key]: { en: 42 } });
    expect(parsed.success).toBe(false);
  });

  it('`nextText` and `prevText` are not mirrored, so the mirror does not judge them', () => {
    // Recorded, not endorsed: the pair's `UnmirroredDeclared` entry carries both
    // keys, and this row goes red when either is mirrored, so the two records
    // move together.
    const shape = ObjectFormMirror.shape as Record<string, unknown>;
    expect('nextText' in shape).toBe(false);
    expect('prevText' in shape).toBe(false);
    for (const key of MIRRORED) expect(key in shape, key).toBe(true);
  });
});
