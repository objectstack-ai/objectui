/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `LUCIDE_ICON_NAMES` is the installed lucide's DYNAMIC vocabulary, not a
 * second opinion about it (objectui#9204).
 *
 * `lazy-icon.tsx` answers `isLucideIconName` from a generated mirror instead of
 * importing `iconNames` from `lucide-react/dynamic.mjs`, because lucide derives
 * those names as `Object.keys(dynamicIconImports)` — importing them imports the
 * 2,025-entry dynamic-import map, which is what put that map on the console's
 * eager path.
 *
 * The mirror buys that with an ageing risk, and it is the risk
 * `scripts/check-lucide-icon-record-names.mjs` names in its own header: "a
 * hand-kept vocabulary is the same defect one level up — it ages the moment
 * lucide retires the next name, and it ages SILENTLY." This file is what makes
 * it not silent. It re-derives the list from the SAME install the renderer
 * resolves against and fails on any drift, in either direction.
 *
 * ⛔ The repair for a red here is `pnpm gen:lucide-icon-names`, never an edit to
 * the catalogue.
 */

import { describe, expect, it } from 'vitest';
import { iconNames } from 'lucide-react/dynamic.mjs';

import { LUCIDE_ICON_NAMES } from '../lib/lucide-icon-names';

describe('the lucide icon-name catalogue', () => {
  /**
   * The blind-probe control, first. Every assertion below is an equality
   * between two lists; two EMPTY lists are equal, and a comparison that can
   * only ever pass reads exactly like a fresh mirror.
   */
  it('is comparing two real vocabularies', () => {
    expect(Array.isArray(iconNames)).toBe(true);
    expect(iconNames.length).toBeGreaterThan(500);
    expect(LUCIDE_ICON_NAMES.length).toBeGreaterThan(500);
    // A name lucide has carried for years, spelled the way the dynamic surface
    // spells it — so "the list is long" is not the only thing checked.
    expect(LUCIDE_ICON_NAMES).toContain('database');
    expect(LUCIDE_ICON_NAMES).not.toContain('no-such-glyph-xyz');
  });

  it('is exactly what the installed lucide ships, in order', () => {
    expect([...LUCIDE_ICON_NAMES]).toEqual([...(iconNames as readonly string[])]);
  });

  /**
   * Stated separately from the deep-equal above because the two fail for
   * different reasons and a reader of the failure needs to know which: a count
   * mismatch is a lucide bump nobody regenerated, a same-length mismatch is a
   * renamed spelling.
   */
  it('carries every name and no extras', () => {
    const installed = new Set(iconNames as readonly string[]);
    const mirrored = new Set(LUCIDE_ICON_NAMES);
    expect([...installed].filter((name) => !mirrored.has(name))).toEqual([]);
    expect([...mirrored].filter((name) => !installed.has(name))).toEqual([]);
  });
});
