/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Registry collision guard.
 *
 * `@object-ui/components` registers display widgets (`text`, `image`,
 * `avatar`, `html`, `grid`) under their bare names, and the html tier's
 * inline `code` element passthrough (objectui#10756). `@object-ui/fields`
 * registers form-input widgets that — by name — collide with those.
 *
 * The fix: field registrations for these types pass `skipFallback: true`,
 * so the bare lookup keeps returning the display widget (or, for `code`, the
 * element passthrough) while the field input is still reachable via the
 * `field:<type>` namespace.
 *
 * Regression contract:
 *   1. `FIELD_TYPES_SKIP_FALLBACK` must contain every colliding name.
 *   2. After `registerAllFields()`, bare lookups must NOT resolve to a
 *      field renderer for any of those names.
 *   3. The `field:<type>` namespaced lookup must still work, so form
 *      schemas using `{ type: 'text' }` still find an input renderer
 *      when explicitly requested.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';

// Importing the fields entry runs `registerAllFields()` at module load.
// Importing the components entry runs display-widget registration the
// same way. Both must be loaded before we inspect the registry.
import '@object-ui/components';
import { registerAllFields } from '../index';

const COLLIDING_TYPES = ['text', 'html', 'image', 'avatar', 'grid', 'code'] as const;

describe('registry collision (fields ↔ components)', () => {
  beforeAll(() => {
    // Defensive: in case the auto-register at import time hasn't run yet
    // under the test runner's module isolation.
    registerAllFields();
  });

  it.each(COLLIDING_TYPES)(
    'bare "%s" lookup is NOT clobbered by the field renderer',
    (type) => {
      // The bare lookup must resolve, and it must resolve to a display widget
      // (or a FallbackComponent / null) — never to the lazy field renderer.
      // The field renderer is a React.lazy() result; the display widget is a
      // plain function component. We don't pin to a specific identity, but we
      // DO pin that whatever the bare lookup returns, the namespaced
      // `field:<type>` lookup returns something different.
      const bare = ComponentRegistry.get(type);
      const namespaced = ComponentRegistry.get(`field:${type}`);

      // Namespaced field renderer must exist for every colliding type —
      // that's the whole point of keeping the field accessible.
      expect(
        namespaced,
        `field:${type} must be registered so forms can still use it`,
      ).toBeTruthy();

      // The bare and namespaced renderers must NOT be identical. If they
      // are, it means the field renderer wrote to the bare fallback and
      // would render an empty <input> instead of the display widget.
      expect(
        bare,
        `bare "${type}" must not be the same component as field:${type}`,
      ).not.toBe(namespaced);
    },
  );

  it('non-colliding field types DO populate the bare fallback', () => {
    // Sanity check: a field type with no display-widget collision (e.g.
    // `email`, `password`, `number`) must still register both at the
    // namespaced AND bare keys, otherwise we'd silently break forms.
    for (const type of ['email', 'password', 'number', 'date', 'select']) {
      expect(
        ComponentRegistry.get(`field:${type}`),
        `field:${type} must be registered`,
      ).toBeTruthy();
      expect(
        ComponentRegistry.get(type),
        `bare "${type}" must also be reachable (no collision)`,
      ).toBeTruthy();
    }
  });
});
