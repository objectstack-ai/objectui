/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9664 — `search.itemsAvailable` broke ENGLISH at one item.
 *
 * The full-page search header is one ternary with two branches. The query
 * branch already picked its key on `totalCount === 1`
 * (`search.resultsCount`/`search.resultsCountPlural`); the browse branch asked
 * for `search.itemsAvailable` at every count, so `en`'s `{{count}} items
 * available` shipped `1 items available` at a single searchable item — in the
 * default language, with no plural family and no sibling key to fall to.
 * `de`/`es`/`fr`/`pt` read the same way (`1 Elemente verfügbar`, …).
 *
 * ## The repair, and why it is the two-key shape
 *
 * `itemsAvailable`/`itemsAvailableOne`, selected at the call site — this repo's
 * two-key plural convention, the one `common.itemCount`/`itemCountOne`,
 * `detail.reactionCount`/`reactionCountOne` and
 * `collaboration.commentCount`/`commentCountOne` already use, and the same
 * device (in its other spelling) as the `search.resultsCount` pair on the
 * adjacent branch. ⛔ NOT an i18next `_one`/`_other` family: full key parity
 * across ten packs caps a family at base + `_one` + `_other`, so every CLDR
 * category a pack does not spell out falls through to the BASE key — here the
 * plural — which `ar` meets at 2, 3-10 and 11-99 and `ru` at 2-4. Selecting the
 * key in the component keeps `Intl.PluralRules` and `fallbackLng` out of the
 * path: both halves exist in all ten packs, so no count in any language can
 * reach English.
 *
 * ## What this file does NOT own
 *
 * That both halves exist in all ten packs and hold `en`'s placeholders is
 * `all-locales-key-parity.test.ts`'s, and that the call site picks the singular
 * at one item is `SearchResultsPage.itemsAvailablePlural-9664.test.tsx`'s. This
 * file owns the VALUES: that the singular half really is singular where the
 * language has one, that the four packs which repeat the string do so for a
 * stated reason, and that neither half carries a parenthesised plural marker.
 */
import { describe, it, expect } from 'vitest';
import { builtInLocales } from '../locales';

type LocaleCode = keyof typeof builtInLocales;

const LANGS = Object.keys(builtInLocales) as LocaleCode[];

const at = (pack: unknown, dotted: string) =>
  dotted.split('.').reduce<unknown>((n, p) => (n as Record<string, unknown>)?.[p], pack);

const KEY = 'search.itemsAvailable';
const KEY_ONE = 'search.itemsAvailableOne';

/**
 * The count ≠ 1 half, unchanged by this card except in `ar` (see below). The
 * `ar` value is objectui#10425's: this half serves two, few, many and other,
 * so it is a count label (a label, a colon, then the number) rather than the
 * 3-10 plural noun this card first gave it.
 */
const PLURAL: Record<LocaleCode, string> = {
  en: '{{count}} items available',
  zh: '共 {{count}} 项可搜索',
  ja: '{{count}} 件利用可能',
  ko: '{{count}}개 항목 사용 가능',
  de: '{{count}} Elemente verfügbar',
  fr: '{{count}} éléments disponibles',
  es: '{{count}} elementos disponibles',
  pt: '{{count}} itens disponíveis',
  ru: '{{count}} доступно',
  ar: 'عدد العناصر المتاحة: {{count}}',
};

/** The count === 1 half, added by this card. */
const ONE: Record<LocaleCode, string> = {
  en: '{{count}} item available',
  zh: '共 {{count}} 项可搜索',
  ja: '{{count}} 件利用可能',
  ko: '{{count}}개 항목 사용 가능',
  de: '{{count}} Element verfügbar',
  fr: '{{count}} élément disponible',
  es: '{{count}} elemento disponible',
  pt: '{{count}} item disponível',
  ru: '{{count}} доступно',
  ar: '{{count}} عنصر متاح',
};

/**
 * The four packs whose two halves are deliberately the SAME string, so a later
 * reader does not "de-duplicate" them back into one key:
 *
 *   - `zh`/`ja`/`ko` have no separate singular form at all — the counter word
 *     carries the number (共 N 项 / N 件 / N개 항목). This is the same reason
 *     `common.itemCount`/`itemCountOne` repeat in those three packs, and it is
 *     the reason the repo writes count labels as two keys rather than an
 *     i18next family: with a family these packs would want to omit the `_one`
 *     half, and key parity reads a legitimately-absent half as a lost key.
 *   - `ru` phrases the label WITHOUT the noun (`{{count}} доступно`), so it has
 *     no word to agree with the number. That is also why Russian needs nothing
 *     from the `few`/`many` categories on this key.
 */
const NO_SINGULAR_FORM: LocaleCode[] = ['zh', 'ja', 'ko', 'ru'];

describe('search.itemsAvailable carries a singular half in every pack (objectui#9664)', () => {
  it('the walk covers all ten packs — not an empty assertion', () => {
    expect(LANGS).toHaveLength(10);
    expect(Object.keys(PLURAL).sort()).toEqual([...LANGS].sort());
    expect(Object.keys(ONE).sort()).toEqual([...LANGS].sort());
  });

  it.each(LANGS)('%s defines both halves, with en\'s one hole in each', (lang) => {
    expect(at(builtInLocales[lang], KEY), `${lang} ${KEY}`).toBe(PLURAL[lang]);
    expect(at(builtInLocales[lang], KEY_ONE), `${lang} ${KEY_ONE}`).toBe(ONE[lang]);
    // A half that drops `{{count}}` renders a sentence with the number missing
    // and no error. Parity compares placeholder SHAPE against `en`; this is the
    // absolute form, so a pack-wide rewrite cannot satisfy both halves by
    // agreeing with a broken `en`.
    for (const value of [PLURAL[lang], ONE[lang]]) {
      expect(value.match(/\{\{count\}\}/g), `${lang} holes in "${value}"`).toHaveLength(1);
    }
  });

  it('the singular half is a DIFFERENT sentence wherever the language has one', () => {
    const distinguishing = LANGS.filter((l) => !NO_SINGULAR_FORM.includes(l));
    // The five packs the card measured as plainly wrong at one item, plus `ar`,
    // which dodged the question with a parenthesised marker instead.
    expect(distinguishing.sort()).toEqual(['ar', 'de', 'en', 'es', 'fr', 'pt']);
    for (const lang of distinguishing) {
      expect(ONE[lang], `${lang} singular is still the plural sentence`).not.toBe(PLURAL[lang]);
    }
    for (const lang of NO_SINGULAR_FORM) {
      expect(ONE[lang], `${lang} halves drifted apart`).toBe(PLURAL[lang]);
    }
  });

  it('English at exactly one item reads "1 item available"', () => {
    // The shipped defect, stated as the string a user saw. `en` is `fallbackLng`
    // and the default language, so this one is the whole reason the card exists.
    const render = (value: string, count: number) => value.replace('{{count}}', String(count));
    expect(render(ONE.en, 1)).toBe('1 item available');
    expect(render(ONE.en, 1)).not.toBe('1 items available');
    // …and the plural half still answers every other count, zero included.
    expect(render(PLURAL.en, 0)).toBe('0 items available');
    expect(render(PLURAL.en, 2)).toBe('2 items available');
  });

  it('neither half carries a parenthesised plural marker, in any pack', () => {
    // `ar` used to write BOTH numbers into one string as `عنصر(عناصر) متاح(ة)`.
    // That device is the one this repo has already measured and refused
    // (`marketplace-preview-namespace-3546.test.tsx`, key-scoped to
    // `preview.history.items`); here it is not merely unidiomatic but dead
    // weight, because the key it sat on can no longer be reached at one item —
    // the parentheses would render at every count it DOES serve. It was
    // replaced with a singular noun at one and, since objectui#10425, a count
    // label at every other count: the shape `ar.common.itemCount`/`itemCountOne`
    // uses.
    //
    // The class is Unicode-aware on purpose (objectui#3866): JS `\w` is
    // [A-Za-z0-9_] with or without `u`, so an ASCII formulation is constant-false
    // for exactly the non-Latin packs this guard is written to watch.
    //
    // ⚠️ The repetition bound is this file's own, and it is WIDER than the
    // `{1,4}` the sibling pin on `preview.history.items` uses. Measured on the
    // value this key actually carried: `متاح(ة)` is one letter inside the
    // parentheses and `عنصر(عناصر)` is five, so a `{1,4}` bound scores the
    // second marker of the same value as absent. Both counter-examples are
    // pinned below so the bound cannot be narrowed back without going red.
    const MARKER = /\([\p{L}]{1,6}\)/u;
    for (const lang of LANGS) {
      expect(MARKER.test(PLURAL[lang]), `${lang} ${KEY} has a "(s)" marker`).toBe(false);
      expect(MARKER.test(ONE[lang]), `${lang} ${KEY_ONE} has a "(s)" marker`).toBe(false);
    }
    expect(at(builtInLocales.ar, KEY)).not.toContain('(');
    // The counter-examples: both markers the retired `ar` value carried score
    // present under this class, and neither does under the ASCII form.
    expect(MARKER.test('عنصر(عناصر)')).toBe(true);
    expect(MARKER.test('متاح(ة)')).toBe(true);
    expect(/\(\w{1,6}\)/.test('عنصر(عناصر)')).toBe(false);
    expect(/\(\w{1,6}\)/.test('متاح(ة)')).toBe(false);
    // …and the narrower bound really is the thing that would have missed one.
    expect(/\([\p{L}]{1,4}\)/u.test('عنصر(عناصر)')).toBe(false);
    expect(/\([\p{L}]{1,4}\)/u.test('متاح(ة)')).toBe(true);
  });

  it('⛔ is NOT an i18next plural family — no pack may grow a suffixed half', () => {
    // Key parity caps a family at base + `_one` + `_other`; every other category
    // falls through to the base key, which here is the PLURAL. `ru` would then
    // read the plural at 2-4 and `ar` at 2, 3-10 and 11-99 — the counts they meet
    // first. An "upgrade" of this key to a family reintroduces exactly that, so
    // it fails here instead.
    for (const lang of LANGS) {
      for (const suffix of ['_zero', '_one', '_two', '_few', '_many', '_other']) {
        expect(at(builtInLocales[lang], `${KEY}${suffix}`), `${lang} ${KEY}${suffix}`).toBeUndefined();
      }
    }
    // The categories that make the paragraph above true rather than asserted.
    expect(new Intl.PluralRules('ru').select(3)).toBe('few');
    expect(new Intl.PluralRules('ar').select(11)).toBe('many');
  });

  it('the pattern it mirrors is still on the adjacent branch, untouched', () => {
    // The premise of the whole repair: the query branch of the same ternary
    // already switches keys at one, and this card changed nothing about it.
    for (const lang of LANGS) {
      expect(at(builtInLocales[lang], 'search.resultsCount'), `${lang} resultsCount`).toEqual(
        expect.any(String),
      );
      expect(
        at(builtInLocales[lang], 'search.resultsCountPlural'),
        `${lang} resultsCountPlural`,
      ).toEqual(expect.any(String));
    }
    expect(at(builtInLocales.en, 'search.resultsCount')).toBe('{{count}} result for "{{query}}"');
    expect(at(builtInLocales.en, 'search.resultsCountPlural')).toBe('{{count}} results for "{{query}}"');
  });
});
