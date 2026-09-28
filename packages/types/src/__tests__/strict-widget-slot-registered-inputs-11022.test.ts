/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The strict authoring face admits the widget-slot `metric-card`'s REGISTERED
 * inputs, and still refuses a key no registration declares (objectui#11022).
 *
 * ## The defect
 *
 * `metric-card` sits in a dashboard's widget slot as a component node whose
 * props are its registry `inputs` (`title`, `value`, `icon`, `trend`,
 * `trendValue`, `description`), admitted on the tolerant face by `BaseSchema`'s
 * `.passthrough()` catchall, by ruling (objectstack#8593) — the private slot arm
 * in `../zod/complex.zod.ts` declares none of them. The strict walker closes
 * every object's catchall, so `StrictAnyComponentSchema` refused `value` on
 * both arms of the slot's union, as `unrecognized_keys`: every correctly
 * authored `metric-card` that carried its required input.
 *
 * ## The repair, and what each block below holds
 *
 * The arm records its registration's input names (`declareRegisteredInputs`),
 * and the walker admits exactly those, judged by the arm's own catchall, before
 * closing the object. The blocks pin, in order: the grade's two pins; the
 * content channels objectui#9256 refused staying refused; the admitted keys
 * being judged as the tolerant face judges them and no narrower; the tolerant
 * face not moving; and the derivation itself on a hand-built node, so the rule
 * is pinned apart from the one card that motivated it.
 *
 * ⚠️ Where the grade's pin sits. `metric-card` is deliberately NOT an arm of
 * `AnyComponentSchema` (the ruling keeps it a property of the widget slot), so a
 * bare `{ type: 'metric-card', value: 42 }` at the ROOT is refused at `type` on
 * both faces, before and after this change — the control below says so. The
 * grade's widget therefore sits in a dashboard's `widgets` slot here.
 *
 * The parity of the recorded names with the LIVE registration, both
 * directions, is measured by the registering package, which holds the
 * registry: `metricCardRegisteredInputsStrictFace-11022.test.ts` in
 * `@object-ui/plugin-dashboard`'s `__tests__`.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  AnyComponentSchema,
  BaseSchema,
  DashboardComponentSchema,
  deriveStrictAuthoringSchema,
  StrictAnyComponentSchema,
} from '../zod/index.zod.js';
import { declareRegisteredInputs, internals, registeredInputsOf } from '../zod/node-derivation.js';

/* ── Reading a refusal ───────────────────────────────────────────────────── */

type Issue = {
  code: string;
  path: PropertyKey[];
  message: string;
  keys?: string[];
  errors?: Issue[][];
};

const issuesOf = (schema: z.ZodType, doc: unknown): Issue[] | null => {
  const result = schema.safeParse(doc);
  return result.success ? null : (result.error.issues as unknown as Issue[]);
};

const dashboard = (widget: Record<string, unknown>) => ({ type: 'dashboard', widgets: [widget] });

/** The ONE issue a widget refusal surfaces as: an `invalid_union` at the widget. */
const widgetUnion = (doc: unknown): Issue | undefined =>
  issuesOf(StrictAnyComponentSchema, doc)?.find((i) => i.path.join('.') === 'widgets.0');

/* ── 1. the grade's pins ─────────────────────────────────────────────────── */

describe('objectui#11022 — the grade\'s pins, in the widget slot', () => {
  it('`{ type: \'metric-card\', value: 42 }` parses under StrictAnyComponentSchema', () => {
    const doc = dashboard({ type: 'metric-card', value: 42 });
    expect(issuesOf(StrictAnyComponentSchema, doc)).toBeNull();
    // Control: the tolerant face always accepted it — the two faces now agree.
    expect(issuesOf(AnyComponentSchema, doc)).toBeNull();
  });

  it('`{ type: \'metric-card\', bogus: 1 }` is still refused, by name, on the slot arm', () => {
    const issue = widgetUnion(dashboard({ type: 'metric-card', bogus: 1 }));
    expect(issue?.code).toBe('invalid_union');
    // Arm 1 is the component-node arm; its path is relative to the widget.
    const [slotArm, widgetArm] = issue?.errors ?? [];
    expect(slotArm).toEqual([expect.objectContaining({ code: 'unrecognized_keys', path: [], keys: ['bogus'] })]);
    // The strict widget schema, which the union falls through to, refuses it too.
    expect(widgetArm).toEqual([expect.objectContaining({ code: 'unrecognized_keys', path: [], keys: ['bogus'] })]);
  });

  it('CONTROL — `metric-card` is not a ROOT arm: refused at `type` on both faces, unchanged', () => {
    for (const face of [AnyComponentSchema, StrictAnyComponentSchema]) {
      const issues = issuesOf(face, { type: 'metric-card', value: 42 });
      expect(issues).toEqual([expect.objectContaining({ code: 'invalid_union', path: ['type'] })]);
    }
  });
});

/* ── 2. objectui#9256's refusals are untouched ───────────────────────────── */

describe('objectui#11022 — the content channels objectui#9256 refused stay refused on the strict face', () => {
  it.each(['children', 'body'])('`%s` on `metric-card` is refused with the by-name message', (key) => {
    const issue = widgetUnion(dashboard({ type: 'metric-card', value: 42, [key]: [] }));
    expect(issue?.code).toBe('invalid_union');
    const refusal = (issue?.errors ?? []).flat().find((i) => i.path.join('.') === key && i.code === 'invalid_type');
    expect(refusal?.message).toContain('`metric-card` reads NEITHER content channel');
    expect(refusal?.message).toContain('objectui#9256');
  });
});

/* ── 3. admitted by key, judged as the tolerant face judges ──────────────── */

describe('objectui#11022 — the registered inputs are admitted by KEY; the strict face judges no value the tolerant face does not', () => {
  const FULL = {
    type: 'metric-card',
    title: 'Revenue',
    value: '$24k',
    icon: 'dollar-sign',
    trend: 'up',
    trendValue: '+5%',
    description: 'vs last month',
  };

  it('a card carrying every registered input parses on both faces', () => {
    expect(issuesOf(StrictAnyComponentSchema, dashboard(FULL))).toBeNull();
    expect(issuesOf(AnyComponentSchema, dashboard(FULL))).toBeNull();
  });

  it('a value the tolerant face admits unjudged is admitted unjudged — the strict face is the tolerant one minus undeclared KEYS', () => {
    // `trend` outside the registration's enum and a numeric `title`: the
    // catchall judges both on the tolerant face, so the strict face does too.
    const loose = { type: 'metric-card', value: 42, trend: 'sideways', title: 7 };
    expect(issuesOf(AnyComponentSchema, dashboard(loose))).toBeNull();
    expect(issuesOf(StrictAnyComponentSchema, dashboard(loose))).toBeNull();
  });

  it('a registered input the base already declares keeps the base member\'s judgment', () => {
    // `description` is a `BaseSchema` member (a string or an inline locale map);
    // its declared type still refuses a number on BOTH faces, so the record did
    // not replace the member with the catchall.
    const bad = dashboard({ type: 'metric-card', value: 1, description: 42 });
    expect(issuesOf(AnyComponentSchema, bad)).not.toBeNull();
    expect(issuesOf(StrictAnyComponentSchema, bad)).not.toBeNull();
  });
});

/* ── 4. the tolerant face does not move ──────────────────────────────────── */

describe('objectui#11022 — the tolerant slot arm is untouched', () => {
  /** The slot's component-node arm, read off the exported tolerant schema. */
  const tolerantSlotArm = (): z.ZodType => {
    const widgets = internals(DashboardComponentSchema)._zod.def.shape?.widgets;
    let node = widgets as z.ZodType;
    while (internals(node)._zod.def.innerType) node = internals(node)._zod.def.innerType as z.ZodType;
    const element = internals(node)._zod.def.element as z.ZodType;
    return (internals(element)._zod.def.options ?? [])[0] as z.ZodType;
  };

  it('its shape declares none of the registered inputs the base does not — the record is a side table', () => {
    const arm = tolerantSlotArm();
    // The arm overrides `type`, `body` and `children`, all three base members,
    // so its key set IS the base's: no registered input became a member.
    const baseKeys = Object.keys(internals(BaseSchema)._zod.def.shape ?? {}).sort();
    const armKeys = Object.keys(internals(arm)._zod.def.shape ?? {}).sort();
    expect(armKeys).toEqual(baseKeys);
    for (const input of ['title', 'value', 'icon', 'trend', 'trendValue']) expect(armKeys).not.toContain(input);
    // Non-vacuity: this IS the arm that carries the record.
    expect(registeredInputsOf(arm)).toContain('value');
  });

  it('its catchall is still the passthrough, so an undeclared key is still accepted there', () => {
    const arm = tolerantSlotArm();
    expect(internals(internals(arm)._zod.def.catchall as z.ZodType)._zod.def.type).toBe('unknown');
    expect(issuesOf(AnyComponentSchema, dashboard({ type: 'metric-card', bogus: 1 }))).toBeNull();
  });
});

/* ── 5. the derivation, apart from the card ──────────────────────────────── */

describe('objectui#11022 — the rule lives in the derivation: a hand-built passthrough node', () => {
  const node = () => z.object({ type: z.literal('probe'), n: z.number().optional() }).passthrough();

  it('WITHOUT a record, the strict twin refuses the would-be input — the pre-repair behaviour', () => {
    const strict = deriveStrictAuthoringSchema(node());
    expect(issuesOf(strict, { type: 'probe', a: 1 })).toEqual([
      expect.objectContaining({ code: 'unrecognized_keys', keys: ['a'] }),
    ]);
  });

  it('WITH a record, the named key is admitted with any value the catchall admits, and any other key is refused by name', () => {
    const strict = deriveStrictAuthoringSchema(declareRegisteredInputs(node(), ['a']));
    expect(issuesOf(strict, { type: 'probe', a: { anything: true } })).toBeNull();
    expect(issuesOf(strict, { type: 'probe' })).toBeNull();
    expect(issuesOf(strict, { type: 'probe', a: 1, b: 2 })).toEqual([
      expect.objectContaining({ code: 'unrecognized_keys', keys: ['b'] }),
    ]);
  });

  it('a recorded name the shape already declares keeps its declared member', () => {
    const strict = deriveStrictAuthoringSchema(declareRegisteredInputs(node(), ['n']));
    expect(issuesOf(strict, { type: 'probe', n: 'not a number' })).toEqual([
      expect.objectContaining({ code: 'invalid_type', path: ['n'] }),
    ]);
  });

  it('the source node is left as it was — the record moves the twin, not the tolerant node', () => {
    const source = declareRegisteredInputs(node(), ['a']);
    deriveStrictAuthoringSchema(source);
    expect(Object.keys(internals(source)._zod.def.shape ?? {}).sort()).toEqual(['n', 'type']);
    expect(issuesOf(source, { type: 'probe', a: 1, b: 2 })).toBeNull();
  });

  it('⛔ a node with no catchall cannot carry a record — there is no tolerant judgment to copy', () => {
    expect(() => declareRegisteredInputs(z.object({ type: z.literal('probe') }), ['a'])).toThrow(TypeError);
    expect(() => declareRegisteredInputs(z.string(), ['a'])).toThrow(TypeError);
  });
});
