/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7470 — the designer face stops claiming `objectName` is required.
 *
 * `ObjectMap`'s `getDataConfig` reads `data`, then `staticData`, then
 * `objectName`, and the `object-map` zod schema carries `requireRecordSource`
 * (objectui#6939): one of the three must be present, none is required alone.
 * Both registration keys still declared `objectName` with `required: true`, so
 * the registry said the opposite of the schema — and `sdui-parser`'s
 * `validateTree` turns a required input into a `missing-required-prop` ERROR,
 * which a `staticData`-only map drew while the schema accepted it.
 *
 * Ruled (letter align): drop `required`, state the one-of rule in the
 * description, add no one-of vocabulary to the input declaration.
 *
 * Rows, per registration key:
 * 1. `objectName` is declared (non-vacuity: a wrong type/namespace read fails
 *    here) and is not required.
 * 2. Its description names all three record sources.
 * 3. The description's claim about the schema is TRUE: `ObjectMapSchema`
 *    refuses a block with none of the three with the refinement's own code,
 *    and accepts a block authored on `staticData` alone.
 */

import { describe, it, expect, vi } from 'vitest';

// `src/index.tsx` pulls in the real map bindings; stub them so a plain module
// import needs no WebGL canvas (same stub as `index.registration.test.tsx`).
vi.mock('react-map-gl/maplibre', () => ({
  default: () => null,
  Map: () => null,
  NavigationControl: () => null,
  Marker: () => null,
  Popup: () => null,
}));

import { ComponentRegistry } from '@object-ui/core';
import { ObjectMapSchema } from '@object-ui/types/zod';
// Module scope, not a hook: this import IS the registration (AGENTS.md
// test-discipline section).
import './index';

const MAP_KEYS = [
  { label: 'object-map', type: 'object-map', namespace: 'plugin-map' },
  { label: 'view:map', type: 'map', namespace: 'view' },
] as const;

const objectNameInput = (type: string, namespace: string) =>
  ((ComponentRegistry.getConfig(type, namespace) as any)?.inputs ?? []).find(
    (i: any) => i.name === 'objectName',
  );

describe('objectui#7470 — map registrations do not declare objectName required', () => {
  it.each(MAP_KEYS)('$label — objectName is declared and not required', ({ type, namespace }) => {
    const input = objectNameInput(type, namespace);
    expect(input, `${type} declares objectName`).toBeDefined();
    expect(input.required).not.toBe(true);
  });

  it.each(MAP_KEYS)('$label — the description names the three record sources', ({ type, namespace }) => {
    const description: string = objectNameInput(type, namespace)?.description ?? '';
    for (const key of ['`data`', '`staticData`', '`objectName`']) {
      expect(description).toContain(key);
    }
    expect(description).toContain('`object-map` schema refuses');
  });

  it('the schema the description names refuses a block with no record source', () => {
    const parsed = ObjectMapSchema.safeParse({ type: 'object-map' });
    expect(parsed.success).toBe(false);
    const codes = parsed.success
      ? []
      : parsed.error.issues.map((issue: any) => issue.params?.code);
    expect(codes).toContain('RECORD_SOURCE_REQUIRED');
  });

  it('control: the same schema accepts a block authored on staticData alone', () => {
    const parsed = ObjectMapSchema.safeParse({
      type: 'object-map',
      staticData: [{ id: '1', lat: 1, lng: 2 }],
    });
    expect(parsed.success).toBe(true);
  });
});
