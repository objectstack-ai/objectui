/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9710 — the CLASS pin for "an authored `trigger` slot handed to an
 * unconditionally-`asChild` Radix primitive". objectui#9701 repaired one
 * instance (`collapsible`); this file is what keeps the tenth key from
 * repeating it, and triage asked for exactly that: 「任一 `asChild` trigger 收到
 * 裸字符串即红」.
 *
 * ## Why this file enumerates the REGISTRY and never a list of files
 *
 * A pin that names the eight renderers this card repaired is green forever on
 * the ninth — it re-asserts the diff that was already written instead of
 * guarding the class. So the population here is derived at run time: every
 * block in the registry that DECLARES a `trigger` slot in its `inputs`. A key
 * added tomorrow is covered on the day it registers one, in whatever file and
 * whatever spelling, and a key deleted stops being asserted with no edit here.
 * ⛔ No count is written down anywhere in this file (AGENTS.md #9) — the
 * enumeration is the instrument, and the readings are whatever it enumerates.
 *
 * ⚠️ Named limit: the enumeration sees what `../renderers` registered. A block
 * that lives in a `plugin-*` package and registers its own `trigger` slot is
 * NOT covered by this file and would need the same reading in its own package.
 *
 * ## The mechanism being pinned
 *
 * `asChild` resolves a Radix primitive to its `Slot`, which merges onto its
 * child through `React.Children.only` — a single React element, and nothing
 * else. Both published faces admit far more than that on a node slot: the
 * TypeScript union `SchemaNode` names `string` explicitly and the zod mirror
 * types each `trigger` key against that same union. So `trigger: 'Open it'`
 * validated twice and then THREW, painting `SchemaRenderer`'s error boundary
 * with no diagnostic naming the key. The author is told yes twice and finds out
 * on the screen.
 *
 * ## Controls — a green here is worthless without them
 *
 *  - `ENUMERATION_CONNECTED` — the population is non-empty and contains blocks
 *    this card did NOT touch (`collapsible`, repaired earlier and living in
 *    `renderers/disclosure/`; `context-menu`, which was never defective because
 *    its `asChild` child is a real `div`). A pin that only covered this PR's
 *    own eight files would fail this control, which is the failure mode the
 *    file exists to avoid.
 *  - `ASCHILD_STILL_ON` — an ELEMENT trigger is still MERGED onto the Radix
 *    trigger rather than nested inside a second one. This is what makes the
 *    repair targeted rather than a blanket `asChild` removal: withheld only
 *    where Radix structurally cannot serve.
 *  - `REDDENS_FOR_A_NINTH` — a deliberately defective block is registered
 *    inside the test, and the pin's own per-block assertion is shown to FAIL on
 *    it. Without this, "the pin covers a ninth renderer" is a claim about a
 *    test that has never once been observed failing.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRenderer } from '@object-ui/react';
// Registers the renderers at module scope, NOT inside a `beforeAll` — there the
// cold transform is billed to `hookTimeout` (objectui#3010/#3021).
import '../renderers';
import { Popover, PopoverContent, PopoverTrigger } from '../ui';
import { renderChildren } from '../lib/utils';

/* ────────────────────────────────────────────────────────────────────────────
 * Harness
 * ───────────────────────────────────────────────────────────────────────── */

const BARE_STRING = 'Open it';
const ELEMENT_LABEL = 'Toggle';

/** The marker `SchemaRenderer`'s error boundary paints when a node throws. */
const ERROR_BOUNDARY_MARKER = 'failed to render';

interface TriggerBlock {
  /** The registry's canonical (namespaced) type, e.g. `ui:dialog`. */
  type: string;
}

/**
 * The population: every registered block declaring a `trigger` SLOT.
 *
 * The registry stores each block under both its bare and its namespaced key
 * pointing at one config, so dedupe by the canonical `type` the config itself
 * carries rather than by the map key.
 */
function triggerBlocks(): TriggerBlock[] {
  const byType = new Map<string, TriggerBlock>();
  for (const config of ComponentRegistry.getAllConfigs()) {
    const inputs = config.inputs ?? [];
    const declaresTriggerSlot = inputs.some(
      (input) => input?.name === 'trigger' && input?.type === 'slot',
    );
    if (!declaresTriggerSlot) continue;
    if (!byType.has(config.type)) byType.set(config.type, { type: config.type });
  }
  return [...byType.values()].sort((a, b) => a.type.localeCompare(b.type));
}

interface Reading {
  /** Whether the node reached the error boundary instead of painting. */
  erroredOut: boolean;
  /** Everything the block painted. */
  text: string;
  /**
   * A `<button>` inside another `<button>`. Radix produces this exactly when
   * `asChild` was withheld on a path it COULD have served: the primitive draws
   * its own button around the authored one.
   */
  nestedButton: boolean;
}

function read(type: string, trigger: unknown): Reading {
  cleanup();
  const { container } = render(
    <SchemaRenderer schema={{ type, trigger } as never} />,
  );
  return {
    erroredOut: (container.textContent ?? '').includes(ERROR_BOUNDARY_MARKER),
    text: container.textContent ?? '',
    nestedButton: container.querySelector('button button') !== null,
  };
}

/**
 * The pin's per-block assertion, as ONE function, so `REDDENS_FOR_A_NINTH` can
 * demonstrate the very assertion the suite runs rather than a paraphrase of it.
 */
function assertBareStringTriggerRenders(block: TriggerBlock): void {
  const reading = read(block.type, BARE_STRING);
  expect(
    reading.erroredOut,
    `${block.type}: a bare-string trigger reached SchemaRenderer's error boundary`,
  ).toBe(false);
  expect(
    reading.text,
    `${block.type}: the bare-string trigger did not paint`,
  ).toContain(BARE_STRING);
}

/* ────────────────────────────────────────────────────────────────────────────
 * The defective ninth, used only by `REDDENS_FOR_A_NINTH`
 * ───────────────────────────────────────────────────────────────────────── */

const NINTH_TYPE = 'ninth-overlay-key';
const NINTH_NAMESPACE = 'test-9710';
const NINTH_CANONICAL = `${NINTH_NAMESPACE}:${NINTH_TYPE}`;

/**
 * A block written the way all nine were written before this card: the authored
 * slot handed DIRECTLY to an unconditionally-`asChild` Radix trigger. It is
 * registered inside one test and removed in `afterEach`.
 */
function registerDefectiveNinth(): void {
  ComponentRegistry.register(
    NINTH_TYPE,
    ({ schema }: { schema: { trigger?: unknown }; [key: string]: unknown }) => (
      <Popover>
        <PopoverTrigger asChild>{renderChildren(schema.trigger)}</PopoverTrigger>
        <PopoverContent />
      </Popover>
    ),
    {
      namespace: NINTH_NAMESPACE,
      label: 'Defective ninth overlay key',
      inputs: [{ name: 'trigger', type: 'slot' }],
      skipFallback: true,
    },
  );
}

afterEach(() => {
  ComponentRegistry.unregister(NINTH_TYPE, NINTH_NAMESPACE);
  cleanup();
});

/* ────────────────────────────────────────────────────────────────────────────
 * Readings
 * ───────────────────────────────────────────────────────────────────────── */

describe('overlay triggers: a bare-string `trigger` renders on every block that declares one (objectui#9710)', () => {
  it('ENUMERATION_CONNECTED control: the population is live and reaches past this card\'s own files', () => {
    const types = triggerBlocks().map((block) => block.type);

    expect(types.length).toBeGreaterThan(0);
    // Repaired by objectui#9701, and it lives in `renderers/disclosure/` — so
    // this population is not a restatement of this card's `renderers/overlay/`
    // diff.
    expect(types).toContain('ui:collapsible');
    // Never defective: its `asChild` child is a real `div`, so the rendered
    // slot goes INSIDE it and `Children.only` never sees the string. It is
    // asserted here anyway, because "immune today" is a reading that expires.
    expect(types).toContain('ui:context-menu');
  });

  it('paints the string instead of reaching the error boundary, on every block in the population', () => {
    for (const block of triggerBlocks()) {
      assertBareStringTriggerRenders(block);
    }
  });

  it('ASCHILD_STILL_ON control: an element trigger is merged, not nested inside a second button', () => {
    for (const block of triggerBlocks()) {
      const reading = read(block.type, [
        { type: 'button', label: ELEMENT_LABEL },
      ]);

      expect(reading.erroredOut, `${block.type}: element trigger errored`).toBe(
        false,
      );
      expect(reading.text, `${block.type}: element trigger did not paint`).toContain(
        ELEMENT_LABEL,
      );
      // Two buttons would mean `asChild` was dropped on a path Radix can serve
      // — the over-reach this control refuses.
      expect(
        reading.nestedButton,
        `${block.type}: the authored element was nested inside the primitive's own button`,
      ).toBe(false);
    }
  });

  it('REDDENS_FOR_A_NINTH control: the pin fails on a newly registered defective block', () => {
    registerDefectiveNinth();

    // The enumeration is live: a block registered a moment ago is in it.
    const ninth = triggerBlocks().find((block) => block.type === NINTH_CANONICAL);
    expect(ninth).toBeDefined();

    // And the suite's own per-block assertion FAILS on it. This is the property
    // triage asked for, observed rather than asserted about.
    expect(() => assertBareStringTriggerRenders(ninth as TriggerBlock)).toThrow();
  });
});
