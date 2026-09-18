/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Nothing in `packages/plugin-detail` may hand `Intl` the machine's locale
 * (objectui#9786).
 *
 * ## Why this file exists at all
 *
 * The class this pin closes has now been repaired five times on five different
 * file surfaces — objectui#4541, #4553, #4566, #4576, then the summary chip in
 * #9453 — and reappeared every time, because each repair was scoped to
 * whatever card was in flight and nothing enumerated the population. The card
 * that produced this file says so in its own words: "these eleven sites exist
 * because nothing stops number twelve". This is the thing that stops number
 * twelve inside this package.
 *
 * `detailTimestamps.displayLocale-9786.test.tsx` is the other half, and the two
 * fail in different directions on purpose: that one renders the surfaces and
 * reads the faces back, this one refuses a new call site the moment it is
 * written, including in a file nothing renders yet.
 *
 * ## ⛔ What this instrument CANNOT see — stated, not assumed
 *
 * It reads source text, so it is blind to a call that passes a VARIABLE which
 * is `undefined` at runtime. That is not hypothetical: this package had exactly
 * one, `HistoryTimeline`'s optional `locale` prop reaching
 * `Intl.RelativeTimeFormat(locale, …)` with neither call site passing it, and
 * no source scan of any shape would have found it. The observing instrument for
 * that class is `recordLocaleArguments` in the sibling file, which patches the
 * intrinsics and inspects the argument each call actually received.
 *
 * ⛔ It is also scoped to THIS package. Whether sibling packages carry the same
 * class is unmeasured here and was out of this card's fence.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/plugin-detail/src/__tests__ -> repository root
const repoRoot = path.resolve(here, '../../../..');
const packageSrc = path.join(repoRoot, 'packages', 'plugin-detail', 'src');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const isTest = (file: string): boolean =>
  /\.(test|spec)\.tsx?$/.test(file) || file.split(path.sep).includes('__tests__');

/**
 * ⚠️ Comments are masked, not deleted — byte offsets and line numbers survive.
 *
 * The masking is load-bearing rather than tidy: the census this file replaces
 * reported ELEVEN sites for nine files, and two of those "sites" were the prose
 * of `PointInTimeRestore`'s doc comment explaining why its tail differs from
 * its siblings'. A count cannot tell code from prose; this scan can.
 */
const sources: Array<{ rel: string; masked: string; raw: string }> = walk(packageSrc)
  .filter((f) => !isTest(f))
  .map((f) => {
    const raw = readFileSync(f, 'utf8');
    return { rel: path.relative(repoRoot, f), masked: mask(raw), raw };
  });

/** Every API in this tree whose FIRST argument is a BCP-47 tag. */
const LOCALE_CALL =
  /(?:\.toLocale(?:Date|Time)?String|\bIntl\.(?:DateTimeFormat|NumberFormat|RelativeTimeFormat|ListFormat|PluralRules|Collator|DurationFormat|Segmenter|DisplayNames))\s*\(/g;

interface Site {
  where: string;
  line: string;
  /** The text immediately after the opening paren, trimmed. */
  head: string;
}

function lineAt(source: string, index: number): { no: number; text: string } {
  const before = source.slice(0, index);
  const no = before.split('\n').length;
  const text = source.split('\n')[no - 1] ?? '';
  return { no, text: text.trim() };
}

/** Every locale-taking call site in the package's real code. */
function callSites(): Site[] {
  const found: Site[] = [];
  for (const { rel, masked, raw } of sources) {
    LOCALE_CALL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LOCALE_CALL.exec(masked)) !== null) {
      const after = masked.slice(m.index + m[0].length, m.index + m[0].length + 60);
      const { no, text } = lineAt(raw, m.index);
      found.push({ where: `${rel}:${no}`, line: text, head: after.trimStart() });
    }
  }
  return found;
}

/** Nothing at all, or an explicit `undefined`: both mean the MACHINE's locale. */
const isMachineLocale = (s: Site): boolean => /^\)/.test(s.head) || /^undefined\b/.test(s.head);

/** A BCP-47 tag written as a literal in the source. */
const literalTag = (s: Site): string | null => {
  const m = /^(['"])([A-Za-z]{2,3}(?:-[A-Za-z0-9]+)*)\1/.exec(s.head);
  return m ? m[2] : null;
};

/**
 * ⭐ The ONE hard-coded tag in this package, and why it is not this class.
 *
 * `InlineFieldInput`'s `en-CA` is not a display locale at all: it is being used
 * as an ISO-8601 date FORMATTER, because `<input type="date">`'s `value` is
 * defined by HTML as `YYYY-MM-DD` and nothing else parses. Putting that call on
 * the display locale would blank the native date picker for every tenant whose
 * locale writes dates any other way — the repair would be the defect.
 *
 * Declared here rather than silently skipped, so a SECOND hard-coded tag —
 * `'en-US'` in a display path, which is the same defect objectui#4033 ruled on
 * wearing a different hat — reddens this file instead of joining a blanket
 * exemption.
 */
const DECLARED_LITERAL_TAGS: Record<string, string> = {
  'packages/plugin-detail/src/InlineFieldInput.tsx': 'en-CA',
};

describe('no plugin-detail call site formats in the machine locale (objectui#9786)', () => {
  /**
   * ⭐ The width guard. Every assertion below is of the form "the scan found no
   * bad site", which a scan that found NOTHING satisfies perfectly. These make
   * a silent narrowing loud instead — the failure direction this repo's #9
   * names as worse than no check at all.
   */
  it('the scan reached the package — a narrow scan must not pass by finding nothing', () => {
    expect(existsSync(path.join(repoRoot, 'pnpm-workspace.yaml'))).toBe(true);
    expect(existsSync(packageSrc)).toBe(true);
    expect(sources.length).toBeGreaterThan(50);

    // The nine files this card repaired, by name. A rename that drops one out
    // of the walk is a coverage loss, and it goes red here rather than quiet.
    const repaired = [
      'ActivityTimeline.tsx',
      'ConcurrentUpdateDialog.tsx',
      'DiffView.tsx',
      'HistoryTimeline.tsx',
      'PointInTimeRestore.tsx',
      'RecordActivityTimeline.tsx',
      'RecordComments.tsx',
      'RecordMetaFooter.tsx',
      'ThreadedReplies.tsx',
    ];
    for (const file of repaired) {
      expect(
        sources.some((s) => s.rel === path.join('packages', 'plugin-detail', 'src', file)),
        `the scan covered ${file}`,
      ).toBe(true);
    }

    // …and the matcher itself finds the call sites it is meant to police.
    expect(callSites().length).toBeGreaterThan(8);
  });

  it('no call site passes nothing, and none passes an explicit `undefined`', () => {
    const offenders = callSites().filter(isMachineLocale);
    expect(
      offenders.map((s) => `${s.where}: ${s.line}`),
      'these format in the machine locale — route them through `useDisplayLocale()`',
    ).toEqual([]);
  });

  it('the only hard-coded tags are the ones declared here, with their reason', () => {
    const undeclared = callSites()
      .filter((s) => {
        const tag = literalTag(s);
        if (tag === null) return false;
        const file = s.where.slice(0, s.where.lastIndexOf(':'));
        return DECLARED_LITERAL_TAGS[file] !== tag;
      })
      .map((s) => `${s.where}: ${s.line}`);
    expect(
      undeclared,
      'a hard-coded BCP-47 tag in a DISPLAY path is objectui#4033 again — declare it here with its reason, or use `useDisplayLocale()`',
    ).toEqual([]);
  });

  /**
   * The declared exemption is itself pinned: deleting the `en-CA` call without
   * deleting its entry would leave a permanent blanket exemption behind, and
   * the next hard-coded tag in that file would inherit it.
   */
  it('every declared exemption still names a real call site', () => {
    const sites = callSites();
    for (const [file, tag] of Object.entries(DECLARED_LITERAL_TAGS)) {
      expect(
        sites.some((s) => s.where.startsWith(`${file}:`) && literalTag(s) === tag),
        `the declared exemption ${file} → ${tag} no longer matches any call site; delete it`,
      ).toBe(true);
    }
  });

  /**
   * ⭐ The matcher's own control. Without it, every `toEqual([])` above is
   * satisfied by a regex that matches nothing at all.
   */
  it('the matcher classifies each shape it is meant to classify', () => {
    const fixture = `
      const a = d.toLocaleDateString();
      const b = d.toLocaleString(undefined, { dateStyle: 'medium' });
      const c = new Intl.DateTimeFormat(undefined, {});
      const e = new Intl.RelativeTimeFormat(locale, {});
      const f = d.toLocaleDateString('en-CA');
      const g = d.toLocaleString(displayLocale);
      // const h = d.toLocaleTimeString();
    `;
    const scan: Site[] = [];
    LOCALE_CALL.lastIndex = 0;
    const masked = mask(fixture);
    let m: RegExpExecArray | null;
    while ((m = LOCALE_CALL.exec(masked)) !== null) {
      scan.push({
        where: `fixture:${lineAt(fixture, m.index).no}`,
        line: lineAt(fixture, m.index).text,
        head: masked.slice(m.index + m[0].length, m.index + m[0].length + 60).trimStart(),
      });
    }

    // Six live call sites; the seventh is commented out and must not be one.
    expect(scan.length).toBe(6);
    expect(scan.filter(isMachineLocale).length, 'the three machine-locale shapes').toBe(3);
    expect(scan.map(literalTag).filter(Boolean)).toEqual(['en-CA']);
  });
});
