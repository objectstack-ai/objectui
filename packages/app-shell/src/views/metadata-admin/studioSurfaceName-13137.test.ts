// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#13137 — one surface, one name. Home's chip "Build an app" opens
 * `/studio`, whose header crumb reads `console.studio.title` ("Studio" in every
 * pack) while the page's own title read "App Builder" (zh 「应用构建」). The
 * surface is named Studio, so the landing title reads the crumb's name, locale
 * by locale.
 *
 * "Build an app" stays: it is a call to action, not a name, and its chip carries
 * no description line or accessible name of its own to point at Studio — so the
 * Home side of this card is a control here, not a change.
 *
 * The census walks every row of BOTH engine tables as read from source (comments
 * masked by the shared helper), single- and double-quoted values alike, so a row
 * added later is asked the same question. It matches row VALUES only.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { en, zh } from '@object-ui/i18n/locales';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../../scripts/js-comment-mask.mjs';
import { t } from './i18n';

const mask: (source: string) => string = maskComments;
const here = path.dirname(fileURLToPath(import.meta.url));

function tableBlock(table: 'ENGINE_STRINGS_EN' | 'ENGINE_STRINGS_ZH'): string {
  const source = mask(readFileSync(path.join(here, 'i18n.ts'), 'utf8'));
  const start = source.indexOf(`const ${table}`);
  expect(start).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf('\n};', start));
}

function tableRows(block: string): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const row = /'((?:[^'\\\n]|\\.)*)'\s*:\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
  for (const m of block.matchAll(row)) rows.push([m[1], m[2] ?? m[3]]);
  return rows;
}

/** The retired names of the surface, per locale. */
const OLD_NAME = /App Builder|应用构建/i;

const crumb = (pack: unknown): string =>
  (pack as { console: { studio: { title: string } } }).console.studio.title;

describe('the Studio landing is named as its crumb names it — objectui#13137', () => {
  it('en: the landing title reads the header crumb, never "App Builder"', () => {
    const title = t('engine.studio.landing.title', 'en');
    expect(crumb(en)).toBe('Studio');
    expect(title).toBe(crumb(en));
    expect(title).not.toMatch(OLD_NAME);
  });

  it('zh: the landing title reads the header crumb, never the old name', () => {
    const title = t('engine.studio.landing.title', 'zh');
    expect(title).toBe(crumb(zh));
    expect(title).not.toMatch(OLD_NAME);
  });

  it('control: the old-name pattern is live in both scripts', () => {
    expect(OLD_NAME.test('App Builder')).toBe(true);
    expect(OLD_NAME.test('应用构建')).toBe(true);
    expect(OLD_NAME.test('Studio')).toBe(false);
  });

  it.each(['ENGINE_STRINGS_EN', 'ENGINE_STRINGS_ZH'] as const)(
    'census: no %s value names the surface by its old name',
    (table) => {
      const block = tableBlock(table);
      const rows = tableRows(block);
      // Positive control: the walk reaches every row of the table — one per
      // line that opens with a quoted key — including the fixed row.
      const keyLines = [...block.matchAll(/^\s*'[^']+'\s*:/gm)].length;
      expect(keyLines).toBeGreaterThan(2500);
      expect(rows.length).toBe(keyLines);
      expect(rows.map(([k]) => k)).toContain('engine.studio.landing.title');
      const offenders = rows.filter(([, v]) => OLD_NAME.test(v)).map(([k]) => k);
      expect(offenders).toEqual([]);
    },
  );

  it('control: the Home chip is still the call to action "Build an app"', () => {
    expect((en as { home: { build: { title: string } } }).home.build.title).toBe('Build an app');
  });
});
