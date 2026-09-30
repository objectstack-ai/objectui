/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The `@object-ui/layout` registrations declare the `children` slot exactly
 * where they render it — the runtime census, both directions, for THIS
 * package's population (objectui#9910).
 *
 * `packages/components/src/renderers/__tests__/container-declaration-ratchet.test.tsx`
 * holds the same contract over the components registry and cannot see this
 * package (components does not import layout). Five registrations live here:
 * `page-header` renders `schema.children` into its right-hand slot;
 * `responsive-grid`, `page:card` (the `layout:`-only thin card) and
 * `app-schema-renderer` render a React `children` PROP, which `SchemaRenderer`
 * never fills from a node (it strips `children` before spreading), and
 * `navigation-renderer` reads `items`. So exactly one declares the slot, and
 * the other four keep drawing `not-a-container` on an authored list — the flag
 * three of them carry (`isContainer: true`, layout containment) silences
 * nothing, which is the ruling's hard line and is pinned here as the control.
 *
 * The predicate is executed, not read off the source: render through the real
 * `SchemaRenderer` with one authored child and ask whether it reached the DOM
 * (objectui#6779's instrument; the reasons a source-side spelling cannot be
 * built are in the components ratchet's header).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRenderer, AdapterCtx } from '@object-ui/react';
import { CHILD_LIST_KEY, manifestFromConfigs, validateTree } from '@object-ui/sdui-parser';
import type { Diagnostic, SchemaElement } from '@object-ui/sdui-parser';

import { registerLayout } from '../index';

const CONTAINMENT = 'not-a-container';
const MARK = 'layout-census-child';

beforeAll(() => {
  registerLayout();
});

/** Every key this package registers — the `layout` namespace, both spellings. */
const layoutKeys = (): string[] =>
  ComponentRegistry.getKnownTypes()
    .filter((t) => ComponentRegistry.getMeta(t)?.namespace === 'layout')
    .sort();

const diagnose = (schema: unknown): Diagnostic[] => {
  const configs = ComponentRegistry.getKnownTypes().map((t) => {
    const meta = ComponentRegistry.getMeta(t);
    return { type: t, namespace: meta?.namespace, isContainer: meta?.isContainer, inputs: meta?.inputs };
  });
  const manifest = manifestFromConfigs(configs as unknown as Parameters<typeof manifestFromConfigs>[0]);
  return validateTree(schema as SchemaElement, manifest).diagnostics;
};

const withChildren = (type: string) => ({ type, children: [{ type: 'text', content: MARK }] });

const rendersChildren = async (type: string): Promise<boolean> => {
  const { container, unmount } = render(
    <AdapterCtx.Provider value={null as never}>
      <SchemaRenderer schema={withChildren(type) as never} />
    </AdapterCtx.Provider>,
  );
  try {
    await waitFor(() => expect(container.textContent).toBeDefined());
    return (container.textContent || '').includes(MARK);
  } finally {
    unmount();
  }
};

const declaresChildren = (type: string): boolean =>
  (ComponentRegistry.getMeta(type)?.inputs ?? []).some((i) => i.name === CHILD_LIST_KEY);

describe('the layout registrations declare the `children` slot exactly where they render it (objectui#9910)', () => {
  it('has the population it claims', () => {
    // Anti-vacuity: the census below iterates this set, so an empty or
    // mis-filtered set would pass on nothing. The five registrations, in the
    // namespaced spelling every one of them has.
    const keys = layoutKeys();
    expect(keys).toEqual(expect.arrayContaining([
      'layout:page-header',
      'layout:page:card',
      'layout:responsive-grid',
      'layout:navigation-renderer',
      'layout:app-schema-renderer',
    ]));
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it('declared ⇔ rendered, and the diagnostic follows the declaration', async () => {
    const mismatched: string[] = [];
    for (const type of layoutKeys()) {
      const renders = await rendersChildren(type);
      const declares = declaresChildren(type);
      const codes = diagnose(withChildren(type)).map((d) => d.code);
      expect(codes, `\`${type}\` did not resolve in the manifest`).not.toContain('unknown-component');
      if (renders !== declares) mismatched.push(`${type} (renders=${renders}, declares=${declares})`);
      // The tier reads the input and nothing else.
      expect(codes.includes(CONTAINMENT), `\`${type}\`: containment disagrees with the declared slot`).toBe(!declares);
    }
    expect(mismatched, 'a layout registration renders children without the slot, or declares a slot it never renders').toEqual([]);
  }, 60_000);

  it('`page-header` is the one that renders the list, and it declares the slot on both keys', async () => {
    expect(await rendersChildren('page-header')).toBe(true);
    for (const key of ['page-header', 'layout:page-header']) {
      const slot = (ComponentRegistry.getMeta(key)?.inputs ?? []).find((i) => i.name === CHILD_LIST_KEY);
      expect(slot?.type, `\`${key}\` declares no \`children\` slot`).toBe('slot');
      expect(diagnose(withChildren(key)).filter((d) => d.code === CONTAINMENT)).toEqual([]);
    }
  });

  it('⛔ the layout flag silences nothing: flagged registrations without the slot keep the TRUE warning', async () => {
    // `responsive-grid`, `page:card` and `app-schema-renderer` carry
    // `isContainer: true` — they are layout containers — and render no authored
    // child list, so `not-a-container` on them is true and must survive. Before
    // objectui#9910 the flag silenced it; this is the control that the
    // fallback has not come back.
    const flagged = layoutKeys().filter(
      (t) => ComponentRegistry.getMeta(t)?.isContainer === true && !declaresChildren(t),
    );
    expect(flagged).toEqual(expect.arrayContaining(['layout:responsive-grid', 'layout:page:card', 'layout:app-schema-renderer']));
    for (const type of flagged) {
      expect(await rendersChildren(type), `\`${type}\` now renders children — declare the slot`).toBe(false);
      expect(diagnose(withChildren(type)).map((d) => d.code), `\`${type}\`: the flag silenced the diagnostic`).toContain(CONTAINMENT);
    }
  }, 60_000);
});
