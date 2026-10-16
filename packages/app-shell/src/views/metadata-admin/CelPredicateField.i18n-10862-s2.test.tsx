// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#10862, slice 2 — the CEL lint advisories under zh-CN.
 *
 * `lintCelPredicate` words two advisories itself and they rendered in English
 * beneath every CEL editor, whatever the designer's language: the wrong-layer
 * root (`data.*` on a record-scope surface, the local instrument's sentence)
 * and the non-pushdown-able `USING` read filter. The lint now hands them back
 * as a catalogue key plus its values, and `CelPredicateField` reads them
 * through the `t` its host binds to the designer locale — `celAuthoring.ts`
 * stays free of any import at load, the slice-1 seam.
 *
 * ── How each site is read ────────────────────────────────────────────────────
 * Each case drives the REAL field against the REAL engine with a predicate
 * that triggers the advisory, bound to a designer `t` in the case's language
 * the way every host binds it (`(k) => t(k, locale)`). The finding the lint
 * returns for the same source and hint gives the key and the values; the
 * expected text is that row read back through `tFormat`, zh guarded by
 * `zhRow`, en as the control — so no case restates a translation or pins the
 * wording.
 *
 * ── Left as written on purpose ───────────────────────────────────────────────
 * Producer text: the engine's `detail` inside the pushdown advisory, the
 * runtime's `Unknown variable: …` inside the wrong-layer one, and — on a slot
 * `@objectstack/lint` covers — that package's whole message, which ships
 * instead of objectui's sentence.
 */

import * as React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { fieldRuleRootIssue } from '@objectstack/lint';

import { t, tFormat } from './i18n';
import { CelPredicateField } from './CelPredicateField';
import { lintCelPredicate, type CelSchemaHint } from './celAuthoring';

afterEach(cleanup);

type Lang = 'en' | 'zh';
const LANGS = ['zh', 'en'] as const;
const LOCALE = { en: 'en-US', zh: 'zh-CN' } as const;

const FIELDS = ['organization_id', 'owner_id', 'status', 'amount'];

/** A zh catalogue row that is really there: not the echoed key, not the en row. */
function zhRow(key: string): string {
  const zh = t(key, 'zh-CN');
  expect(zh, `${key}: a missing zh row echoes the key back`).not.toBe(key);
  expect(zh, `${key}: the zh row must not be the English one`).not.toBe(t(key, 'en-US'));
  return zh;
}

/** Mount the real field with a host-bound designer `t` in `lang`. */
function mount(lang: Lang, value: string, props: Partial<React.ComponentProps<typeof CelPredicateField>>) {
  const tr = (k: string) => t(k, LOCALE[lang]);
  return render(
    <CelPredicateField value={value} onChange={() => {}} label="CEL" objectName="account" fieldNames={FIELDS} t={tr} {...props} />,
  );
}

/** The advisory the lint returns for `source` under `hint`: keyed, a warning, and the only one. */
async function keyedAdvisory(source: string, hint: CelSchemaHint, key: string) {
  const issues = await lintCelPredicate(source, hint);
  const keyed = issues.filter((i) => i.messageKey !== undefined);
  expect(keyed).toHaveLength(1);
  const [issue] = keyed;
  expect(issue.severity).toBe('warning');
  expect(issue.messageKey).toBe(key);
  return issue.messageVars as Record<string, string>;
}

describe('CelPredicateField reads its advisories in the designer locale (objectui#10862)', () => {
  for (const lang of LANGS) {
    it(`${lang}: the non-pushdown-able USING read filter`, async () => {
      const source = 'upper(status) == "OPEN"';
      const key = 'engine.celLint.notPushdownable';
      const vars = await keyedAdvisory(source, { objectName: 'account', fields: FIELDS, clause: 'using' }, key);
      // The engine's own reason fills the hole as written, in every locale.
      expect(vars.detail).toBeTruthy();
      mount(lang, source, { clause: 'using' });
      const text = tFormat(key, LOCALE[lang], vars);
      expect(text).toContain(vars.detail);
      expect(await screen.findByText(text, {}, { timeout: 3000 })).toBeTruthy();
      if (lang === 'zh') zhRow(key);
    });

    it(`${lang}: the wrong-layer \`data.*\` root on a record-scope surface (the local sentence)`, async () => {
      // No `slot`: the surfaces `@objectstack/lint`'s verdict does not cover
      // (a formula, a conditional-formatting condition) keep objectui's own
      // sentence.
      const source = "data.status == 'x'";
      const key = 'engine.celLint.notTheRow';
      const vars = await keyedAdvisory(source, { objectName: 'account', fields: FIELDS, scope: 'record' }, key);
      expect(vars).toEqual({ identifier: 'data', canonical: 'record' });
      mount(lang, source, { scope: 'record' });
      const text = tFormat(key, LOCALE[lang], vars);
      // The runtime's fault text is quoted as written, in every locale.
      expect(text).toContain('`Unknown variable: data`');
      expect(await screen.findByText(text, {}, { timeout: 3000 })).toBeTruthy();
      if (lang === 'zh') zhRow(key);
    });

    it(`${lang}: CONTROL — a covered slot ships \`@objectstack/lint\`'s message as written`, async () => {
      const source = "data.status == 'x'";
      const engine = fieldRuleRootIssue('visibleWhen', source);
      expect(engine).not.toBeNull();
      const issues = await lintCelPredicate(source, { objectName: 'account', fields: FIELDS, scope: 'record', slot: 'visibleWhen' });
      expect(issues.filter((i) => i.messageKey !== undefined)).toEqual([]);
      mount(lang, source, { scope: 'record', slot: 'visibleWhen' });
      expect(await screen.findByText(engine!.message, {}, { timeout: 3000 })).toBeTruthy();
    });
  }
});
