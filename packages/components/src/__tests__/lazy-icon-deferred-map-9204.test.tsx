/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `LazyIcon` still resolves a real glyph once lucide's dynamic-import map
 * arrives (objectui#9204).
 *
 * The map moved behind an `import()`, which is a byte claim — and the byte
 * claim is enforced where bytes are decided: the emitted chunk, by
 * `scripts/check-eager-closure-budget.mjs`, and the source shape by
 * `scripts/check-lucide-icon-record-names.mjs`'s empty
 * `DECLARED_EAGER_DYNAMIC_IMPORTERS`. ⛔ Neither of those is what this file
 * tests, and a render test could not: a static import renders identically.
 *
 * What deferral ADDS is a frame, and that is this file's subject. Before the
 * import lands there is no `DynamicIcon` to render, so the icon shows its
 * `fallback` — the same glyph `DynamicIcon` itself shows while fetching the
 * per-icon chunk, one level down. The failure this pins is the one that would
 * ship silently: a slot that renders NOTHING while the map is in flight, or one
 * that never leaves the fallback because the promise was dropped.
 */

import { describe, expect, it } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

import { LazyIcon, getLazyIcon, isLucideIconName } from '../lib/lazy-icon';

/** lucide renders the `Database` fallback with its own `lucide-database` class. */
const isFallbackGlyph = (svg: Element | null) => !!svg?.getAttribute('class')?.includes('lucide-database');

describe('LazyIcon with the import map deferred', () => {
  it('shows the fallback glyph first, then the resolved icon', async () => {
    const { container } = render(<LazyIcon name="circle-check" data-testid="icon" />);

    // The synchronous frame: something is rendered, and it is the fallback.
    const first = container.querySelector('svg');
    expect(first, 'the slot rendered nothing at all while the map was in flight').not.toBeNull();
    expect(isFallbackGlyph(first)).toBe(true);

    // …and the promise is not dropped: the real glyph replaces it.
    await waitFor(() => {
      expect(isFallbackGlyph(container.querySelector('svg'))).toBe(false);
    });
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide');
    cleanup();
  });

  /**
   * The control for the row above. `isFallbackGlyph` going false is only
   * evidence of a resolved icon if it STAYS true for a name that cannot
   * resolve — otherwise the assertion would pass on any re-render.
   */
  it('keeps the fallback for a name outside the catalogue', async () => {
    expect(isLucideIconName('no-such-glyph-xyz')).toBe(false);
    const { container } = render(<LazyIcon name="no-such-glyph-xyz" />);
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    expect(isFallbackGlyph(container.querySelector('svg'))).toBe(true);
    cleanup();
  });

  it('keeps `getLazyIcon` synchronous and memoised per name', () => {
    const first = getLazyIcon('circle-check');
    expect(typeof first === 'function' || typeof first === 'object').toBe(true);
    expect(getLazyIcon('circle-check')).toBe(first);
  });
});
