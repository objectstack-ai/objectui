/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9108 - the `props` spelling of a node's config bag must reach the
 * node gates, and `properties` must still win.
 *
 * ## What was measured, and why it could not be seen
 *
 * A node may spell its config bag `properties` (the spec spelling) or `props`
 * (the annotated legacy alias). The hoist in `SchemaRenderer`'s evaluation memo
 * copies `properties.*` onto the node; nothing copies `props.*`. Both node
 * gates read the post-hoist node, so a predicate authored under the alias was
 * never one of the keys either gate could see:
 *
 * | authored                       | before objectui#9108 |
 * |--------------------------------|----------------------|
 * | `props: { visible: false }`    | RENDERED             |
 * | `props: { hidden: true }`      | RENDERED             |
 * | `properties: { visible: false }` | correctly hidden   |
 * | `properties: { hidden: true }`   | correctly hidden   |
 *
 * Fail-OPEN and silent: a gate that never bit renders exactly like a gate that
 * said yes, so no user and no screenshot can find it.
 *
 * ## Why the two `properties` rows are in THIS file and not another
 *
 * They are the live control, and a control in another file is not a control:
 * "the node is hidden" is equally satisfied by a renderer that hides
 * everything, by a broken registry, and by a probe that never mounted. Every
 * row below therefore runs through the SAME harness in the SAME suite, and
 * every row is measured in BOTH directions - a truthy predicate and a falsy
 * one. A pair of EQUAL verdicts is the signature of a gate that was never
 * consulted, whichever way it landed, and that pair is exactly what the broken
 * tree produced on the `props` rows.
 *
 * ## Plain booleans on purpose
 *
 * objectui#9100 and objectui#9107 are about a CEL envelope being flattened on
 * the way to the engine. This defect is present with a plain boolean and no
 * expression anywhere, and it predates both repairs, so nothing here carries an
 * envelope: an envelope would make a failure ambiguous between the two causes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRenderer } from '../SchemaRenderer';
import { SchemaRendererContext } from '../context/SchemaRendererContext';

const TYPE = 'probe-9108';

/**
 * Reports three things a `schema`-reading renderer can see, so one probe can
 * answer both "did the gate bite?" and "was anything hoisted?".
 */
const Probe = (props: { schema?: Record<string, unknown>; disabled?: unknown }) => (
  <div
    data-testid="probe"
    // Whether the node carries the key at TOP LEVEL by the time a renderer is
    // handed it. This is what must NOT move: the repair reads the alias bag, it
    // does not copy it onto the node.
    data-node-visible={String(props.schema?.visible)}
    data-node-hidden={String(props.schema?.hidden)}
    // The real `disabled` React prop the renderer receives.
    data-disabled={String(props.disabled === true)}
  />
);

function mount(schema: unknown) {
  return render(
    <SchemaRendererContext.Provider value={{ dataSource: {} } as never}>
      <SchemaRenderer schema={schema as never} />
    </SchemaRendererContext.Provider>,
  );
}

const rendered = (): boolean => screen.queryByTestId('probe') !== null;

/** One authored bag, mounted twice - predicate `true` then `false`. */
function pair(bag: 'props' | 'properties', key: string): { truthy: boolean; falsy: boolean } {
  const once = (value: boolean): boolean => {
    mount({ type: TYPE, [bag]: { [key]: value } });
    const r = rendered();
    cleanup();
    return r;
  };
  return { truthy: once(true), falsy: once(false) };
}

describe('objectui#9108 - a predicate in the `props` bag reaches the node gate', () => {
  beforeEach(() => {
    ComponentRegistry.register(TYPE, Probe as never);
  });
  afterEach(() => {
    cleanup();
    ComponentRegistry.unregister?.(TYPE);
  });

  // SHOW polarity: `true` renders, `false` hides. Both spellings, one table -
  // the `properties` rows are the control and they were already correct.
  it.each([
    ['props', 'visible'],
    ['properties', 'visible'],
    ['props', 'visibleWhen'],
    ['properties', 'visibleWhen'],
  ] as const)('%s.%s (SHOW polarity): truthy renders, falsy hides', (bag, key) => {
    expect(pair(bag, key)).toEqual({ truthy: true, falsy: false });
  });

  // HIDE polarity: `true` hides, `false` renders - the opposite direction, and
  // the reason a one-polarity suite would have passed on half the defect.
  it.each([
    ['props', 'hidden'],
    ['properties', 'hidden'],
    ['props', 'hiddenOn'],
    ['properties', 'hiddenOn'],
  ] as const)('%s.%s (HIDE polarity): truthy hides, falsy renders', (bag, key) => {
    expect(pair(bag, key)).toEqual({ truthy: false, falsy: true });
  });

  // The enablement chain is the same hoist gap with a quieter symptom: a greyed
  // control is still on screen. `disabled` under `props` reached the element as
  // a React prop and was then overwritten by the gate's own `disabled`, which
  // was `undefined` because the gate never saw the key.
  it.each([
    ['props'],
    ['properties'],
  ] as const)('%s.disabled drives the enablement gate, both directions', (bag) => {
    mount({ type: TYPE, [bag]: { disabled: true } });
    expect(screen.getByTestId('probe').getAttribute('data-disabled')).toBe('true');
    cleanup();
    mount({ type: TYPE, [bag]: { disabled: false } });
    expect(screen.getByTestId('probe').getAttribute('data-disabled')).toBe('false');
  });
});

describe('objectui#9108 - what the repair deliberately does NOT change', () => {
  beforeEach(() => {
    ComponentRegistry.register(TYPE, Probe as never);
  });
  afterEach(() => {
    cleanup();
    ComponentRegistry.unregister?.(TYPE);
  });

  // objectui#5123, maintainer ruling 2026-08-18: `properties` wins on BOTH
  // channels. The alias is consulted only where the post-hoist node holds
  // nothing, so a key BOTH bags declare is still answered by `properties` -
  // measured in both directions so a "hides everything" renderer cannot pass.
  it('`properties` still wins when both bags declare the same key', () => {
    mount({ type: TYPE, props: { visible: true }, properties: { visible: false } });
    expect(rendered()).toBe(false);
    cleanup();
    mount({ type: TYPE, props: { visible: false }, properties: { visible: true } });
    expect(rendered()).toBe(true);
  });

  // A key the node itself declares at top level is not the alias's to answer.
  it('a node-level key still outranks the alias', () => {
    mount({ type: TYPE, visible: false, props: { visible: true } });
    expect(rendered()).toBe(false);
    cleanup();
    mount({ type: TYPE, visible: true, props: { visible: false } });
    expect(rendered()).toBe(true);
  });

  // The fence this repair was written to respect: the gate READS the bag, it
  // does not hoist it. If this row ever flips, `props` has become a mirror of
  // `properties` and the objectui#6708 dropped-bag warning has started lying.
  it('nothing is hoisted - `schema.<KEY>` stays undefined for the renderer', () => {
    mount({ type: TYPE, props: { visible: true } });
    expect(screen.getByTestId('probe').getAttribute('data-node-visible')).toBe('undefined');
    cleanup();
    // The canonical spelling IS hoisted, as it always was - the control that
    // proves the assertion above is reading a real attribute.
    mount({ type: TYPE, properties: { visible: true } });
    expect(screen.getByTestId('probe').getAttribute('data-node-visible')).toBe('true');
  });

  // objectui#6752 / objectui#6760: a degenerate bag declares no key for either
  // spelling, and it must not have its shape reinterpreted here either.
  it('a degenerate `props` gates nothing', () => {
    mount({ type: TYPE, props: 'not-a-bag' });
    expect(rendered()).toBe(true);
  });
});
