/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `element:record_picker` — the published authoring surface carries the query
 * through the node-level `dataSource` binding only (objectui#11880).
 *
 * This file used to pin the opposite direction: objectui#3830 declared the
 * flat `filter` because the renderer read it (`composed?.filter ??
 * props.filter`) while `inputs` omitted it, and the rc.6 bump added `sort` and
 * `limit` the same way. objectstack#11509 (ruled A-narrow) retires the flat
 * `object` / `filter` / `sort` / `limit` on this element, and objectui goes
 * first: the renderer reads none of them, so publishing them would advertise
 * keys the picker drops. The pinned spec still DECLARES all four until the
 * retirement ships with the pin bump; that divergence is booked in the
 * repo-wide parity gate (`apps/console/src/__tests__/registry-inputs-spec-parity.test.ts`).
 *
 * WHY THIS BLOCK NEEDS IT. `element:record_picker` is deliberately NOT in
 * `PUBLIC_BLOCKS`, so it never reaches `sdui.manifest.json`, but its `inputs`
 * are a live prop whitelist anyway: `renderers/layout/page.tsx` builds the
 * JSX-page compiler's whitelist from `getKnownTypes()` plus these same
 * `inputs`. The last test in this file is that path, end to end.
 *
 * Expectations are derived from the spec at runtime, not restated.
 */

import { describe, it, expect } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';
import { compile, manifestFromConfigs } from '@object-ui/sdui-parser';
import { ElementRecordPickerPropsSchema } from '@objectstack/spec/ui';
// Module scope, not a hook: the cold transform is billed to the import phase,
// which has no test/hook timeout (AGENTS.md §测试纪律, objectui#3010).
import '../renderers';

type ShapeCarrier = { shape?: unknown; _def?: { shape?: unknown } };

/** Resolve the props object's `.shape` through both spellings, lazy or plain. */
function specTopLevelKeys(): string[] {
  const carrier = ElementRecordPickerPropsSchema as unknown as ShapeCarrier;
  const shape = carrier.shape ?? carrier._def?.shape;
  const resolved = typeof shape === 'function' ? (shape as () => object)() : shape;
  return resolved && typeof resolved === 'object' ? Object.keys(resolved) : [];
}

const TYPE = 'element:record_picker';
const config = () => ComponentRegistry.getConfig(TYPE);
const inputs = () => config()?.inputs ?? [];
const inputNames = () => inputs().map((i) => i.name);
const input = (name: string) => inputs().find((i) => i.name === name);

/** A `ViewFilterRule` list — the one filter orthography (objectstack#14406). */
const RULE_ARRAY = [{ field: 'status', operator: 'equals', value: 'open' }];

/** The four flat query keys objectstack#11509 retires on this element. */
const FLAT_QUERY_KEYS = ['object', 'filter', 'sort', 'limit'] as const;

describe('element:record_picker — registry inputs vs @objectstack/spec (objectui#11880)', () => {
  it('is registered with a non-empty `inputs` surface', () => {
    expect(config()).toBeDefined();
    expect(inputNames().length).toBeGreaterThan(0);
  });

  it('resolves a non-empty spec key set', () => {
    // Guards the probe, not the subject: a Zod internals change would return `[]`
    // here and make every assertion below vacuously agreeable.
    expect(specTopLevelKeys().length).toBeGreaterThan(0);
  });

  it('publishes none of the four flat query keys, though the pinned spec still declares them', () => {
    for (const key of FLAT_QUERY_KEYS) {
      expect(specTopLevelKeys(), `the pinned spec no longer declares '${key}'`).toContain(key);
      expect(inputNames(), `element:record_picker still publishes the flat '${key}'`).not.toContain(key);
    }
  });

  it('publishes the `dataSource` binding it reads them from, as an object binding', () => {
    const binding = input('dataSource') as { type?: unknown; binding?: unknown } | undefined;
    expect(binding).toBeDefined();
    expect(binding?.type).toBe('object');
    expect(binding?.binding).toBe('object');
  });

  it('CONTROL: the display keys the picker does read stay published', () => {
    for (const key of ['labelField', 'valueField', 'label', 'placeholder', 'emptyText']) {
      expect(inputNames()).toContain(key);
    }
  });

  it('a JSX page writing the flat `filter` gets `unknown-prop`, and one writing `dataSource` does not', () => {
    // The manifest is assembled the way `renderers/layout/page.tsx` assembles
    // the JSX-page compiler's whitelist — `getKnownTypes()` mapped through each
    // type's registered meta — so this runs against the LIVE registration.
    const manifest = manifestFromConfigs(
      ComponentRegistry.getKnownTypes().map((t) => {
        const meta = ComponentRegistry.getMeta(t);
        return { type: t, namespace: meta?.namespace, isContainer: meta?.isContainer, inputs: meta?.inputs };
      }) as unknown as Parameters<typeof manifestFromConfigs>[0],
    );
    const unknownPropsOf = (jsx: string) =>
      compile(jsx, manifest)
        .diagnostics.filter((d) => d.code === 'unknown-prop')
        .map((d) => d.message)
        .join(' | ');

    const rules = JSON.stringify(RULE_ARRAY);
    expect(unknownPropsOf(`<${TYPE} filter={${rules}} />`)).toMatch(/"filter"/);
    expect(unknownPropsOf(`<${TYPE} object="account" />`)).toMatch(/"object"/);
    // The binding is the door: the same rules under `dataSource` draw nothing.
    expect(unknownPropsOf(`<${TYPE} dataSource={{"object":"account","filter":${rules}}} />`)).toBe('');
    // CONTROL: a spec key this block never published (an ADR-0087 tombstone
    // upstream) is still reported, so the empty verdict above is the
    // declaration, not a compiler that stopped checking.
    expect(unknownPropsOf(`<${TYPE} searchFields={["name"]} />`)).toMatch(/searchFields/);
  });
});
