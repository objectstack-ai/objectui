/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A read-only boolean is drawn with the locale's word (objectui#11689).
 *
 * Under zh-CN a record showed its boolean values as "Yes" / "No": the
 * read-only surfaces that draw a boolean as text spelled the English words in
 * code. They now read `common.yes` / `common.no` through `useBooleanValueLabel`
 * (`widgets/booleanValueLabel.tsx` says why that pair and not `grid.*` or
 * `lookup.yes`).
 *
 * Every case renders through a REAL `I18nProvider` over the real packs, so a
 * pin goes red if the word stops coming from the pack — a stand-in `t` would
 * pass against a widget that never asked the locale anything. The provider-less
 * cases pin the other half of the contract: an embed with no provider still
 * says `Yes` / `No`, through `useFieldTranslation`'s defaults table.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { I18nProvider } from '@object-ui/i18n';
import { builtInLocales } from '@object-ui/i18n/locales';

import { BooleanField } from '../widgets/BooleanField';
import { FormulaField } from '../widgets/FormulaField';
import { renderLookupColumnValue } from '../widgets/lookupColumnDisplay';

afterEach(() => cleanup());

const noop = () => {};

type Lang = keyof typeof builtInLocales;
const LANGS = Object.keys(builtInLocales) as Lang[];

function inLocale(language: Lang | null, node: React.ReactElement) {
  if (language === null) return render(node);
  return render(
    <I18nProvider config={{ defaultLanguage: language, detectBrowserLanguage: false }} persistLanguage={false}>
      {node}
    </I18nProvider>,
  );
}

/** The three read-only boolean drawers in this package, each as a host renders it. */
const DRAWERS: Record<string, (value: boolean) => React.ReactElement> = {
  'BooleanField (readonly)': (value) => (
    <BooleanField
      value={value}
      onChange={noop}
      field={{ type: 'boolean', name: 'email_verified' } as never}
      readonly={true}
    />
  ),
  'FormulaField (returnType boolean)': (value) => (
    <FormulaField
      value={value}
      onChange={noop}
      field={{ type: 'formula', name: 'is_overdue', returnType: 'boolean' } as never}
      readonly={true}
    />
  ),
  // No descriptor and no resolver: the plain-text fallback, the branch that
  // spelled the word.
  'renderLookupColumnValue (plain-text fallback)': (value) => (
    <span>{renderLookupColumnValue({ active: value }, { field: 'active' } as never, { descriptors: {} })}</span>
  ),
};

describe('read-only boolean words come from the locale (objectui#11689)', () => {
  for (const [name, draw] of Object.entries(DRAWERS)) {
    describe(name, () => {
      it('zh renders 是 / 否', () => {
        expect(inLocale('zh', draw(true)).container.textContent).toBe('是');
        cleanup();
        expect(inLocale('zh', draw(false)).container.textContent).toBe('否');
      });

      it('en is unchanged: Yes / No', () => {
        expect(inLocale('en', draw(true)).container.textContent).toBe('Yes');
        cleanup();
        expect(inLocale('en', draw(false)).container.textContent).toBe('No');
      });

      it("every pack's own common.yes / common.no is the word drawn", () => {
        for (const lang of LANGS) {
          expect(inLocale(lang, draw(true)).container.textContent, `${lang}: true`).toBe(
            builtInLocales[lang].common.yes,
          );
          cleanup();
          expect(inLocale(lang, draw(false)).container.textContent, `${lang}: false`).toBe(
            builtInLocales[lang].common.no,
          );
          cleanup();
        }
      });

      it('with no I18nProvider it still says Yes / No (the defaults table)', () => {
        expect(inLocale(null, draw(true)).container.textContent).toBe('Yes');
        cleanup();
        expect(inLocale(null, draw(false)).container.textContent).toBe('No');
      });
    });
  }
});
