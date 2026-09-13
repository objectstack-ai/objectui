/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Icon-name membership answers from the `icons` RECORD, and a retired spelling
 * is REFUSED out loud rather than silently degraded (objectui#9204, maintainer
 * decision batch #125 item 3, 2026-09-13).
 *
 * ## What this file pins, and what it deliberately does not
 *
 * The byte claim — that lucide's dynamic-import map left the console's eager
 * path — is enforced where bytes are decided: `check-eager-closure-budget.mjs`
 * on the emitted chunk, and `check-lucide-icon-record-names.mjs`'s empty
 * `DECLARED_EAGER_DYNAMIC_IMPORTERS` on the source shape. ⛔ Neither is this
 * file's subject; a render test cannot tell a static import from a deferred one.
 *
 * What IS this file's subject is the behaviour the ruling bought those bytes
 * with: the vocabulary narrowed from lucide's DYNAMIC list to its RECORD, so
 * the spellings the two disagree about stop resolving — and the author has to
 * find out at once instead of reading a plausible fallback glyph.
 *
 * ## Every population here is DERIVED from the installed lucide
 *
 * ⛔ No list of retired spellings is written down. `check-lucide-icon-record-names.mjs`
 * refuses one in its own header — "a hand-kept vocabulary is the same defect one
 * level up: it ages the moment lucide retires the next name, and it ages
 * SILENTLY" — and a test is not exempt from its own gate's rule. The two
 * vocabularies are read here and the difference between them IS the population,
 * so this file cannot go stale against a lucide bump: it can only change what
 * it reports.
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { icons } from 'lucide-react';
// The refusal diagnostic derives the replacement name through
// `import('lucide-react/dynamic.mjs')`. Importing it at MODULE scope pays for
// it in the import phase, which is under no test or hook timeout — the
// `await import()` inside a bounded assertion window is the flaky shape
// AGENTS.md's testing section is about.
import { dynamicIconImports } from 'lucide-react/dynamic.mjs';

import { getLazyIcon, isLucideIconName, loadLucideIconNames } from '../lib/lazy-icon';
import { describeIconLookup, liveIconNameOf } from '../renderers/action/resolve-icon';

/** Names lucide can still LOAD but no longer publishes in its `icons` record. */
const RETIRED = Object.keys(dynamicIconImports).filter(
  (name) => !Object.prototype.hasOwnProperty.call(icons, describeIconLookup(name).key),
);
/** Names both vocabularies agree on. */
const LIVE = Object.keys(dynamicIconImports).filter(
  (name) => Object.prototype.hasOwnProperty.call(icons, describeIconLookup(name).key),
);

/**
 * `console.error` is mocked for the WHOLE file, not only where it is asserted.
 * The sweeps below refuse every retired spelling on purpose, and each refusal
 * resolves asynchronously — left unmocked they would land in another test's
 * output, after this file's assertions had finished.
 */
let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Wait for the refusal's own `import()` chain to settle.
 *
 * ⛔ Not a fixed sleep and ⛔ not one tick: deriving the replacement name walks
 * a module import and then an icon import, so the number of turns is lucide's
 * to decide, not this file's. Polling for the observable effect is the shape
 * that does not encode a guess about it.
 */
async function settle(predicate: () => boolean, turns = 200): Promise<void> {
  for (let i = 0; i < turns && !predicate(); i += 1) {
    await new Promise((resolve) => { setTimeout(resolve, 1); });
  }
}

describe('a retired spelling is refused OUT LOUD', () => {
  // ⚠️ This block runs FIRST, and the ordering is load-bearing: a spelling is
  // refused once per process, so the population sweeps below — which ask about
  // every retired name — would spend these specimens' one refusal before the
  // assertions could see it. Vitest runs describes in file order.

  it('names the spelling, lucide’s current name for it, and what to write', async () => {
    // `smile` is a specimen, ⛔ not a pinned fact: the sweep below judges the
    // whole retired population, and this row checks the MESSAGE. Its premise is
    // asserted rather than assumed.
    expect(RETIRED).toContain('smile');

    expect(isLucideIconName('smile')).toBe(false);
    await settle(() => errorSpy.mock.calls.length > 0);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const message = String(errorSpy.mock.calls[0]?.[0]);
    expect(message).toContain('"smile"');
    expect(message).toContain('RETIRED');
    // lucide's current NAME (the live record key)…
    expect(message).toContain('"FaceSlightlySmiling"');
    // …and the spelling that actually renders, which is not always its kebab.
    expect(message).toContain('"face-slightly-smiling"');
  });

  it('suggests a spelling `getLazyIcon` accepts, for every retired name', async () => {
    // ⭐ The half a single specimen cannot show. 16 of the 243 live replacements
    // are digit-bearing (`Grid2x2`, `Axis3d`, `Rows2`…) and their record key
    // kebabs to a name lucide does not carry — so a diagnostic that echoed the
    // key would send an author to a name that passes membership and then fails
    // to load. This walks the whole retired population rather than trusting the
    // one above.
    const suggestions = await Promise.all(
      RETIRED.map(async (retired) => {
        const live = await dynamicIconImports[retired as keyof typeof dynamicIconImports]();
        return liveIconNameOf((live as { default?: unknown }).default);
      }),
    );
    const unrenderable = suggestions.filter((key) => key !== null && !isLucideIconName(key));
    // Derived, so it reports rather than pins: these are the keys whose OWN
    // spelling would not render, i.e. exactly why the message carries both.
    expect(unrenderable.length).toBeGreaterThan(0);
    const offered = await loadLucideIconNames();
    for (const key of suggestions) {
      if (key === null) continue;
      expect(offered.some((name) => describeIconLookup(name).key === key)).toBe(true);
    }
  });

  it('says so for a name that was never lucide’s, WITHOUT inventing a replacement', async () => {
    // The control for the first row: "RETIRED" has to be a claim this
    // diagnostic can decline to make, or it means nothing when it does.
    expect(isLucideIconName('box-open-from-another-library')).toBe(false);
    await settle(() => errorSpy.mock.calls.length > 0);

    const message = String(errorSpy.mock.calls[0]?.[0]);
    expect(message).toContain('"box-open-from-another-library"');
    expect(message).toContain('No live lucide icon answers to it');
    expect(message).not.toContain('RETIRED');
  });

  it('says it ONCE per spelling, not once per render', async () => {
    expect(RETIRED).toContain('sort-desc');
    for (let i = 0; i < 5; i += 1) getLazyIcon('sort-desc');
    await settle(() => errorSpy.mock.calls.length > 0);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('stays silent for a live name — the volume is the signal', async () => {
    expect(isLucideIconName('circle-check')).toBe(true);
    getLazyIcon('circle-check');
    await settle(() => errorSpy.mock.calls.length > 0, 20);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe('the vocabulary is the `icons` record', () => {
  it('has a non-empty disagreement to judge — the control for everything below', () => {
    // Without this the two rows underneath would pass on an empty population
    // and read exactly like a satisfied assertion. A lucide release that
    // retired nothing would make this file vacuous, and this is where that
    // shows up.
    expect(RETIRED.length).toBeGreaterThan(0);
    expect(LIVE.length).toBeGreaterThan(0);
  });

  it('refuses EVERY spelling the record has dropped', () => {
    const accepted = RETIRED.filter((name) => isLucideIconName(name));
    expect(accepted).toEqual([]);
  });

  it('accepts every spelling the record still carries', () => {
    const rejected = LIVE.filter((name) => !isLucideIconName(name));
    expect(rejected).toEqual([]);
  });

  it('still answers PascalCase, snake_case and space-separated spellings', () => {
    // The tokeniser did not change with the vocabulary. `Home` is the seam's one
    // rename entry and has to keep resolving, which is also a control on the
    // row above: it is a name the record does NOT carry.
    expect(Object.prototype.hasOwnProperty.call(icons, 'Home')).toBe(false);
    expect(isLucideIconName('home')).toBe(true);
    expect(isLucideIconName('CircleCheck')).toBe(true);
    expect(isLucideIconName('circle_check')).toBe(true);
    expect(isLucideIconName('circle check')).toBe(true);
    expect(isLucideIconName('no-such-glyph-xyz')).toBe(false);
  });

  it('offers pickers only the live half, in lucide’s own spelling', async () => {
    const offered = await loadLucideIconNames();
    expect(offered.length).toBe(LIVE.length);
    expect(offered).not.toContain(RETIRED[0]);
    // …and every offered name is one `getLazyIcon` will accept, which is the
    // property a picker actually depends on.
    expect(offered.filter((name) => !isLucideIconName(name))).toEqual([]);
  });
});

