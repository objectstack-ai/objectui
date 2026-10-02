/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The `container` padding set is ONE set in three places (objectui#11424):
 * the steps the renderer's branches map to a padding class, the literal set
 * `ContainerSchema.padding` declares, and the closed `enum` the registration's
 * `padding` input publishes into the manifest.
 *
 * The renderer is the truth (the objectui#7759 ruling: `padding` is not a spec
 * key, so the read site decides). This file therefore DERIVES the mapped set by
 * rendering the real `container` through `SchemaRenderer` for every candidate
 * number and reading which ones put a padding utility on the element, then
 * compares the other two lists with it. A branch added or removed in
 * `container.tsx` without the declaration and the registration following —
 * or the reverse — reddens here.
 *
 * The derivation also reads the defect itself: an unmapped number (9, 20)
 * draws no padding class at all. That is the renderer's behaviour on purpose —
 * ⛔ it does not round or clamp; the declaration refuses those numbers instead.
 *
 * Module-scope import of the renderers, not `beforeAll` (AGENTS.md §测试纪律).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '../renderers';
import { SchemaRenderer } from '@object-ui/react';
import { ComponentRegistry } from '@object-ui/core';
import { ContainerSchema as ContainerMirror } from '@object-ui/types/zod';

/** Every candidate the derivation renders: a range past the widest step, plus fractions and a negative. */
const CANDIDATES = [...Array.from({ length: 33 }, (_, i) => i), -1, 0.5, 1.5, 9.5];

/** `maxWidth: false` and `centered: false` keep the base class list free of anything but the padding ladder. */
function classOf(schema: Record<string, unknown>): string[] {
  const { container } = render(
    <SchemaRenderer schema={{ type: 'container', maxWidth: false, centered: false, children: [], ...schema } as never} />,
  );
  return (container.firstElementChild as HTMLElement).className.split(/\s+/).filter(Boolean);
}

/** A padding utility at any breakpoint: `p-2`, `sm:p-3`, `md:p-0.5`. */
const isPaddingClass = (token: string) => /^(?:[a-z0-9]+:)?p-/.test(token);

const sortNumbers = (values: Iterable<unknown>) => [...values].map(Number).sort((a, b) => a - b);

/**
 * The rendered set, derived once on first use — inside a test, so RTL's
 * per-test cleanup unmounts what it rendered (the class lists are read first).
 */
let renderedCache: number[] | undefined;
const renderedSet = (): number[] =>
  (renderedCache ??= CANDIDATES.filter((n) => classOf({ padding: n }).some(isPaddingClass)));

describe('container padding: the rendered set, the declared set and the registered set are one (objectui#11424)', () => {
  it('the derivation is not vacuous: it finds mapped steps AND unmapped numbers', () => {
    const rendered = renderedSet();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(CANDIDATES.length);
  });

  it('an unmapped number draws no padding class — 9 and 20 are neither rounded nor clamped', () => {
    expect(classOf({ padding: 9 }).filter(isPaddingClass)).toEqual([]);
    expect(classOf({ padding: 20 }).filter(isPaddingClass)).toEqual([]);
  });

  it('`ContainerSchema.padding` declares exactly the rendered set', () => {
    const declared = ContainerMirror.shape.padding.unwrap().values;
    expect(sortNumbers(declared)).toEqual(sortNumbers(renderedSet()));
  });

  it('the registration publishes exactly the rendered set, as a closed enum', () => {
    const input = ComponentRegistry.getConfig('container')?.inputs?.find((i) => i.name === 'padding');
    expect(input?.type).toBe('enum');
    const published = (input?.enum ?? []).map((e) => (typeof e === 'object' ? e.value : e));
    expect(sortNumbers(published)).toEqual(sortNumbers(renderedSet()));
  });

  it('control: an absent key still draws the default ladder (padding 4)', () => {
    expect(classOf({}).filter(isPaddingClass)).toEqual(['p-2', 'sm:p-3', 'md:p-4']);
    expect(classOf({}).filter(isPaddingClass)).toEqual(classOf({ padding: 4 }).filter(isPaddingClass));
  });
});
