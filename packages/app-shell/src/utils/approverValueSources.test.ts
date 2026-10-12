/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * approverValueSources — reading the spec's registry binding,
 * `{ source: 'registry', type }` (objectstack#22710), structurally
 * (objectui#7611 Q3b).
 *
 * The readers' behaviour under that binding is pinned where it renders:
 * `approverIdentity.registryBinding-7611.test.tsx` and the two
 * `FlowReferenceField.*-7611.test.tsx` files. This file pins the reading
 * itself, and carries the reminder the ruling asks for: the type loosening in
 * `approverValueSources.ts` goes when objectui moves to spec 18.
 */

import { describe, it, expect } from 'vitest';
import { APPROVER_VALUE_SOURCES } from '@objectstack/spec/automation';
import {
  APPROVER_REGISTRY_TYPES,
  PUBLISHED_APPROVER_VALUE_SOURCES,
  registryTypesOf,
  registryValueSourceOf,
} from './approverValueSources';

describe('registryValueSourceOf (objectui#7611 Q3b)', () => {
  it('reads the registry member', () => {
    expect(registryValueSourceOf({ source: 'registry', type: 'position' })).toEqual({
      source: 'registry',
      type: 'position',
    });
  });

  it('refuses a registry entry with no usable type, and every other member', () => {
    expect(registryValueSourceOf({ source: 'registry' })).toBeUndefined();
    expect(registryValueSourceOf({ source: 'registry', type: '' })).toBeUndefined();
    expect(registryValueSourceOf({ source: 'data', object: 'sys_position', valueField: 'name' })).toBeUndefined();
    expect(registryValueSourceOf({ source: 'enum', values: ['owner'] })).toBeUndefined();
    expect(registryValueSourceOf(undefined)).toBeUndefined();
  });
});

describe('registryTypesOf (objectui#7611 Q3b)', () => {
  it('maps every registry-bound kind to its type and nothing else', () => {
    // The shape objectstack#22710 publishes: `position` on the registry, the
    // directory kinds on data rows.
    expect(
      registryTypesOf({
        user: { source: 'data', object: 'sys_user', valueField: 'id' },
        position: { source: 'registry', type: 'position' },
        team: { source: 'data', object: 'sys_team', valueField: 'id' },
        manager: { source: 'auto' },
      }),
    ).toEqual({ position: 'position' });
  });
});

describe('the spec-17 loosening is still needed (objectui#7611 Q3b)', () => {
  it('reads the bundled spec object itself, unchanged', () => {
    expect(PUBLISHED_APPROVER_VALUE_SOURCES).toBe(APPROVER_VALUE_SOURCES);
  });

  it('the installed spec binds nothing to the registry yet', () => {
    // When this goes red, objectui has moved to a spec that declares the
    // registry member itself (objectstack#22710, spec 18): remove the widening
    // in approverValueSources.ts — read APPROVER_VALUE_SOURCES directly — and
    // revisit `FlowReferenceField.specDerivation.test.ts`, whose `position`
    // record-lookup expectation moves with it.
    expect(
      APPROVER_REGISTRY_TYPES,
      'the installed spec now publishes a registry binding: drop the spec-17 loosening in approverValueSources.ts',
    ).toEqual({});
  });
});
