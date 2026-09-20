/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `apps/console/src/index.css` must not scan TEST files -- neither this app's
 * own nor those of the 27 packages it reaches (objectui#6379).
 *
 * ## What was wrong
 *
 * Tailwind v4 scans source TEXT, not an import graph. This entry declared 27
 * `@source` path globs across `packages/**` plus its own tree, and -- alone
 * among the entries in this repo that declare sources -- carried no `@source
 * not` line at all, while reaching further than any of them. Every test file
 * under those globs was therefore a source for the console's EAGER,
 * render-blocking `index-*.css`: 2373 test files in the packages it names, plus
 * this app's own. `packages/components/src/index.css` (objectui#8446,
 * objectui#9569) and `packages/runner/src/index.css` (objectui#8454) already
 * carried the exclusion; this entry was the gap.
 *
 * Measured at the fix: 19 classes and 10,096 raw bytes came from test files
 * only. The sharpest single reading is the cross-tree probe below.
 *
 * ## The instruments
 *
 * Two sentinels, because the exclusion has two halves and a probe for one says
 * nothing about the other:
 *
 *  - `SENTINEL_OWN_TREE` is self-hosted -- written in THIS file, which is a
 *    `*.test.ts` under `apps/console/src`, exactly the kind of file the
 *    filename half must keep out. It is live only because it is self-hosted:
 *    it does not depend on any other test continuing to name a fixture class.
 *  - `SENTINEL_OTHER_TREE` is components' own sentinel, which lives under a
 *    `__tests__/` directory in ANOTHER package. It probes the half this entry
 *    needs and its siblings do not: that the exclusion reaches ACROSS the
 *    repository into every `packages/*` tree these globs name, not merely into
 *    the app's own. It was shipping to users in `index-*.css` before this fix
 *    -- a token whose only purpose is to prove components' exclusion works.
 *
 * ## Why the positive assertions are not optional
 *
 * "No test-sourced rules" is satisfied by a stylesheet compiled from NOTHING,
 * so a negative-only test would pass for an entry strictly worse than the fix
 * (delete the `@source` lines outright). The positive half pins a
 * production-sourced utility, a cross-package one, and a floor on the rule
 * count, so an empty or gutted sheet fails.
 *
 * ## Why `base` is passed explicitly
 *
 * This entry opens with a bare `@import 'tailwindcss'`, so Tailwind's automatic
 * source detection is ON and rooted at the PROCESS CWD -- vitest runs from the
 * repo root while `pnpm --filter @object-ui/console build` runs from this app's
 * directory. Passing `base` pins this reading to the directory the build runs
 * in, so the test measures the stylesheet users are served rather than the one
 * the test runner's CWD happens to produce. `base` governs only the automatic
 * root; the `@source` lines always resolve against the entry's own directory.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { describe, expect, it } from 'vitest';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appRoot, '../..');
const entry = resolve(appRoot, 'src/index.css');

/**
 * Deliberately absent from every other file in the repository, and an
 * arbitrary-value utility so no production source can ever legitimately name
 * it. Its ONLY occurrence is this line, in a `*.test.ts` file.
 */
const SENTINEL_OWN_TREE = 'mt-[6379.0731px]';

/**
 * The part of the sentinel Tailwind's selector escaping leaves alone
 * (`.mt-\[6379\.0731px\]` escapes the brackets and the dots, never the digits).
 * Asserting on THIS rather than on a hand-escaped selector is what keeps the
 * negative assertion from passing for the wrong reason.
 */
const SENTINEL_OWN_TREE_VALUE = '6379.0731px';

/** Components' self-hosted sentinel, in a `__tests__/` dir in another package. */
const SENTINEL_OTHER_TREE_VALUE = '3.7331px';
const SENTINEL_OTHER_TREE_HOST =
  'packages/components/src/__tests__/index-css-scan-excludes-tests.test.ts';

async function compileConsoleStylesheet(): Promise<{ css: string; selectors: Set<string> }> {
  const source = await readFile(entry, 'utf8');
  const result = await postcss([tailwindPostcss({ base: appRoot })]).process(source, {
    from: entry,
  });
  const selectors = new Set<string>();
  postcss.parse(result.css, { from: entry }).walkRules((rule) => {
    selectors.add(rule.selector);
  });
  return { css: result.css, selectors };
}

describe('apps/console/src/index.css @source scan', () => {
  it('does not compile tokens that only this app\'s own test files name', async () => {
    const { css, selectors } = await compileConsoleStylesheet();

    // POSITIVE — a sheet compiled from nothing must not pass.
    expect(selectors.has('.flex-col')).toBe(true);
    expect(selectors.size).toBeGreaterThan(2500);

    // NEGATIVE — this file is scanned only if the filename exclusion is gone.
    expect(SENTINEL_OWN_TREE).toContain(SENTINEL_OWN_TREE_VALUE);
    expect(css).not.toContain(SENTINEL_OWN_TREE_VALUE);
  }, 60_000);

  it('does not compile tokens that only ANOTHER package\'s test files name', async () => {
    // CONTROL — the door this asserts is shut must still exist. If components'
    // sentinel is ever renamed this goes red and needs RE-POINTING at that
    // file's new sentinel, NOT deleting: a negative assertion about a token
    // nothing mentions any more passes for the wrong reason.
    const host = await readFile(resolve(repoRoot, SENTINEL_OTHER_TREE_HOST), 'utf8');
    expect(host).toContain(SENTINEL_OTHER_TREE_VALUE);

    // This app's globs reach `packages/components/src/**`, so before the
    // repository-root-anchored exclusion this token compiled a real rule into
    // the console's eager, render-blocking stylesheet.
    const { css, selectors } = await compileConsoleStylesheet();
    expect(selectors.has('.bg-background')).toBe(true);
    expect(css).not.toContain(SENTINEL_OTHER_TREE_VALUE);
  }, 60_000);
});
