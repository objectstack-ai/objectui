/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7952 — `DashboardComponentSchema.widgets` carries the component-node
 * arm on the TypeScript face, matching the Zod twin's two-arm slot.
 *
 * ## The gap this closes
 *
 * `zod/complex.zod.ts` has routed a `metric-card` node placed directly in the
 * widget slot to passthrough `BaseSchema` since the 2026-08-14 ruling
 * (objectstack#8593): `widgets: z.array(z.union([DashboardWidgetSlotComponentSchema,
 * DashboardWidgetSchema]))`. The TypeScript declaration stayed one-armed,
 * `DashboardWidgetSchema[]`. Measured at `fc32921` on the six dashboard blocks
 * `plugin-dashboard/README.md` teaches, each annotated `DashboardComponentSchema`:
 * `safeParse` ACCEPT with every authored key preserved; `tsc --strict` 6 × TS2561
 * (`'value' does not exist in type 'DashboardWidgetSchema'. Did you mean to
 * write 'values'?`). No annotation existed for a document the platform accepts
 * and the maintainer ruled legal. Ruled option (a), director seat, decision
 * batch #68 (2026-09-07): the TypeScript face gains the arm; the Zod face is
 * untouched and `DashboardWidgetSchema` is NOT widened.
 *
 * ## What is pinned, and on which face
 *
 *   1. the README's `metric-card` shape annotates and compiles (type level) AND
 *      parses green with its keys kept (runtime) — the two halves of the card's
 *      measurement, now agreeing;
 *   2. the forbidden repair did not happen: `DashboardWidgetSchema` still refuses
 *      `value` — an `@ts-expect-error` that turns into TS2578 if anyone widens it;
 *   3. the arm is CLOSED on `type` and the union still discriminates: a
 *      spec-family widget with an undeclared key is refused on both faces, and a
 *      `type` in neither vocabulary is refused;
 *   4. the measured limit of a TypeScript union with a passthrough arm, recorded
 *      two-faced so it cannot be read as a hatch: a `type`-less legacy envelope
 *      with an undeclared key COMPILES (nothing to discriminate on, so the arm's
 *      index signature satisfies the excess-property check) while the Zod face
 *      refuses it by name;
 *   5. shape identity: the slot's element type IS the two-arm union, the arm's
 *      `type` IS `DashboardComponentWidgetType`, and the arm is NOT assignable
 *      to `DashboardWidgetSchema` (objectui#11514). It was until that card,
 *      which is why every `(w: DashboardWidgetSchema)` callback in
 *      `plugin-dashboard` compiled unchanged; those callbacks now read an entry
 *      by this element type, and the widget arm's `type` names no component
 *      type, so a `metric-card` with no `value` is refused on this face too;
 *   6. objectui#11467: the arm DECLARES `MetricCard`'s registered inputs, so the
 *      README's `metric-card` literals compile against members rather than
 *      against `BaseSchema`'s index signature (which objectui#8347 removes);
 *      the Zod twin declares the same members; and the widget's `component`
 *      slot takes the arm first, on both faces. The members' parity with the
 *      live registration and `MetricCardProps` is pinned in
 *      `@object-ui/plugin-dashboard` (`metricCardRegisteredInputsStrictFace-11022.test.ts`).
 *
 * Type-level lines are erased at runtime and enforced because
 * `packages/types/tsconfig.test.json` is chained from this package's
 * `type-check` script (objectui#3009). Reverse-verified at the PR: with `widgets`
 * restored to `DashboardWidgetSchema[]`, `tsc -p tsconfig.test.json` goes red on
 * the lines marked REVERSE below and nowhere else in this file.
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import type { I18nLabel } from '@objectstack/spec/ui';
import type { SchemaNode } from '../base.js';
import type {
  DashboardComponentSchema,
  DashboardComponentWidgetType,
  DashboardWidgetSchema,
  DashboardWidgetSlotComponentSchema,
} from '../complex.js';
import { DASHBOARD_COMPONENT_WIDGET_TYPES } from '../complex.js';
import { DashboardComponentSchema as DashboardComponentZod } from '../zod/complex.zod.js';
import { StrictAnyComponentSchema } from '../zod/index.zod.js';

type Equal< A, B > =
  (< T >() => T extends A ? 1 : 2) extends (< T >() => T extends B ? 1 : 2) ? true : false;

/**
 * `packages/plugin-dashboard/README.md`'s "Usage" block, byte-for-byte, with the
 * annotation the card measured it under. The runtime half of the same document
 * is read off the page by `plugin-dashboard`'s
 * `readme-dashboard-examples-spec-valid.test.ts`; this copy exists because a
 * type-level pin cannot read a file.
 */
// REVERSE — TS2561 on `value` with the one-arm declaration.
const usage: DashboardComponentSchema = {
  type: 'dashboard',
  widgets: [
    {
      type: 'metric-card',
      title: 'Total Sales',
      value: '$123,456',
      trend: 'up',
      trendValue: '+12%'
    }
  ]
};

describe('the component-node arm is declared on the TypeScript face (objectui#7952)', () => {
  it('the README shape annotates, compiles, and parses green with every key kept', () => {
    const result = DashboardComponentZod.safeParse(usage);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const parsed = (result.data as { widgets: Record<string, unknown>[] }).widgets[0];
    for (const key of Object.keys(usage.widgets[0])) expect(parsed).toHaveProperty(key);
  });

  it('the slot element IS the two-arm union, in the Zod twin\'s order', () => {
    type Element = DashboardComponentSchema['widgets'][number];
    // REVERSE — `Element` collapses to `DashboardWidgetSchema` and this is `false`.
    const twoArm: Equal< Element, DashboardWidgetSlotComponentSchema | DashboardWidgetSchema > = true;
    // The arm's `type` is the closed component set, by reference — not a copy.
    const closedByReference: Equal< DashboardWidgetSlotComponentSchema['type'], DashboardComponentWidgetType > = true;
    // objectui#11514: the arm is NOT assignable to the widget type, whose `type`
    // names no component type. A consumer reads an entry by `Element` and narrows
    // on `type` to reach a widget key.
    const armDisjoint: DashboardWidgetSlotComponentSchema extends DashboardWidgetSchema ? false : true = true;
    expect(twoArm && closedByReference && armDisjoint).toBe(true);
    // The runtime side of "by reference": the set the arm keys on is the one
    // export, and it is the set the Zod arm reads.
    expect(DASHBOARD_COMPONENT_WIDGET_TYPES).toContain(usage.widgets[0].type);
  });
});

describe('the forbidden repair did not happen — DashboardWidgetSchema is not widened', () => {
  it('`value` is still not a widget key on the TypeScript face', () => {
    // `value` / `icon` / `trend` / `trendValue` are `MetricCard`'s registry
    // inputs. The compiler's own suggestion for this line ("Did you mean to
    // write 'values'?") is the repair both declarations forbid; if anyone
    // makes it, this directive goes unused (TS2578) and `type-check` fails.
    // A widget family, so `value` is the one refused key (since objectui#11514 a
    // `type: 'metric-card'` is refused on this interface as well).
    // @ts-expect-error — TS2561: 'value' does not exist in type 'DashboardWidgetSchema'.
    const widened: DashboardWidgetSchema = { type: 'metric', value: '1' };
    expect(widened.type).toBe('metric');
  });

  it('the arm\'s `type` is closed', () => {
    // @ts-expect-error — TS2322: a spec family is not a component type.
    const open: DashboardWidgetSlotComponentSchema = { type: 'bar', value: '1' };
    expect(open.type).toBe('bar');
  });
});

describe('NOT A HATCH — what the union still refuses, on both faces', () => {
  it('a spec-family widget with an undeclared key is discriminated by `type` and refused', () => {
    const doc: DashboardComponentSchema = {
      type: 'dashboard',
      widgets: [
        // `'bar'` excludes the component arm, so the excess-property check runs
        // against `DashboardWidgetSchema` alone.
        // @ts-expect-error — TS2353: 'bogus' does not exist in type 'DashboardWidgetSchema'.
        { type: 'bar', title: 'x', bogus: 1 },
      ],
    };
    const result = DashboardComponentZod.safeParse(doc);
    expect(result.success).toBe(false);
    if (result.success) return;
    const flat = JSON.stringify(result.error.issues);
    expect(flat).toContain('unrecognized_keys');
    expect(flat).toContain('bogus');
  });

  it('a `type` in neither vocabulary is refused', () => {
    const doc: DashboardComponentSchema = {
      type: 'dashboard',
      widgets: [
        // @ts-expect-error — TS2322: not a widget family, not a component type.
        { type: 'not-a-component', value: '1' },
      ],
    };
    expect(DashboardComponentZod.safeParse(doc).success).toBe(false);
  });

  it('a component node with an undeclared key is kept whole — that is the passthrough, by ruling', () => {
    const doc: DashboardComponentSchema = {
      type: 'dashboard',
      // `value` is the card's required input since objectui#11467; `someProp` is the undeclared key.
      widgets: [{ type: 'metric-card', title: 'x', value: '1', someProp: 1 }],
    };
    const result = DashboardComponentZod.safeParse(doc);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data as { widgets: Record<string, unknown>[] }).widgets[0]).toHaveProperty('someProp', 1);
  });
});

describe('MEASURED LIMIT of a TypeScript union with a passthrough arm — recorded, not a contract', () => {
  it('a `type`-less legacy envelope with an undeclared key compiles, and the Zod face refuses it by name', () => {
    // Nothing to discriminate on (the legacy `component` envelope has no
    // `type`), so the union's excess-property check accepts any key one arm
    // could hold, and the component arm's index signature holds every key.
    // If tsc ever refuses this literal, the corner has closed: delete this
    // constant and the note on `widgets` in `complex.ts` — ⛔ do not add an
    // `@ts-expect-error` to keep the file green.
    const envelopeStray: DashboardComponentSchema = {
      type: 'dashboard',
      widgets: [{ id: 'w', component: { type: 'metric-card', value: '1' }, bogus: 1 }],
    };
    const result = DashboardComponentZod.safeParse(envelopeStray);
    expect(result.success, 'the runtime is the strict face on this corner').toBe(false);
    if (result.success) return;
    const flat = JSON.stringify(result.error.issues);
    expect(flat).toContain('unrecognized_keys');
    expect(flat).toContain('bogus');
  });

  it('the same envelope without the stray key is legal on both faces', () => {
    const envelope: DashboardComponentSchema = {
      type: 'dashboard',
      widgets: [{ id: 'w', component: { type: 'metric-card', value: '1' }, layout: { x: 0, y: 0, w: 1, h: 1 } }],
    };
    expect(DashboardComponentZod.safeParse(envelope).success).toBe(true);
  });
});

/* ── objectui#11467 — the arm declares MetricCard's registered inputs ─────── */

type MetricCardInput = 'title' | 'value' | 'icon' | 'trend' | 'trendValue';

/** The zod arm is private; its input type is read off the slot's element union. */
type ZodSlotArm = Extract< z.input< typeof DashboardComponentZod >['widgets'][number], { type: 'metric-card' } >;

/**
 * `plugin-dashboard/README.md`'s "TypeScript Support" block, the two
 * `metric-card` literals, byte-for-byte, with their annotations: the card in a
 * widget's `component` slot, and the card directly in `widgets[]`. Read off the
 * page by `check:doc-snippets`; copied here because a type-level pin cannot
 * read a file. Both compiled before objectui#11467 only through `BaseSchema`'s
 * index signature (the objectui#8347 census: `value`, three times in this file).
 */
const custom: DashboardWidgetSchema = {
  id: 'kpi_custom',
  component: {
    type: 'metric-card',
    title: 'Revenue',
    value: '$123,456',
    trend: 'up',
    trendValue: '+12%',
  },
  layout: { x: 0, y: 0, w: 3, h: 2 },
};

const kpi: DashboardWidgetSlotComponentSchema = {
  type: 'metric-card',
  title: 'Revenue',
  value: '$123,456',
  trend: 'up',
  trendValue: '+12%',
};

describe('objectui#11467 — the component arm declares `MetricCard`\'s registered inputs, on both faces', () => {
  it('each input is a DECLARED member with `MetricCard`\'s prop type — not the index signature\'s `any`', () => {
    // Through the index signature each of these was `any`, and `Equal< any, X >` is `false`.
    const title: Equal< DashboardWidgetSlotComponentSchema['title'], string | I18nLabel | undefined > = true;
    const value: Equal< DashboardWidgetSlotComponentSchema['value'], string | number > = true;
    const icon: Equal< DashboardWidgetSlotComponentSchema['icon'], string | undefined > = true;
    const trend: Equal< DashboardWidgetSlotComponentSchema['trend'], 'up' | 'down' | 'neutral' | undefined > = true;
    const trendValue: Equal< DashboardWidgetSlotComponentSchema['trendValue'], string | undefined > = true;
    // `description`, the sixth input, is the base's member, not restated.
    const description: Equal< DashboardWidgetSlotComponentSchema['description'], string | I18nLabel | undefined > = true;
    expect([title, value, icon, trend, trendValue, description]).toEqual([true, true, true, true, true, true]);
  });

  it('the Zod twin declares the same five members with the same types', () => {
    const twins: Equal< Required< Pick< ZodSlotArm, MetricCardInput > >, Required< Pick< DashboardWidgetSlotComponentSchema, MetricCardInput > > > = true;
    expect(twins).toBe(true);
  });

  it('the TypeScript face judges each value by its member, while the index signature still stands', () => {
    // @ts-expect-error — TS2322: `trend` is the registration's enum.
    const sideways: DashboardWidgetSlotComponentSchema = { type: 'metric-card', value: '1', trend: 'sideways' };
    // @ts-expect-error — TS2741: `value` is the card's one required input.
    const valueless: DashboardWidgetSlotComponentSchema = { type: 'metric-card', title: 'Revenue', icon: 'users' };
    const doc: DashboardComponentSchema = {
      type: 'dashboard',
      // @ts-expect-error — TS2322: no arm admits it: the component arm judges `trend`, and `value` is no widget key.
      widgets: [{ type: 'metric-card', value: '1', trend: 'sideways' }],
    };
    expect([sideways.trend, valueless.type, doc.type]).toEqual(['sideways', 'metric-card', 'dashboard']);
  });

  it('`title`, declared on both arms, reads with its declared type straight off a `widgets[]` entry — not `any`', () => {
    // The plugin-dashboard README says so ("Reading a widget key off `widgets[]`").
    const read: Equal< DashboardComponentSchema['widgets'][number]['title'], string | I18nLabel | undefined > = true;
    expect(read).toBe(true);
  });

  it('the widget `component` slot is typed with the arm first, then any other component node', () => {
    const slot: Equal< NonNullable< DashboardWidgetSchema['component'] >, DashboardWidgetSlotComponentSchema | NonNullable< SchemaNode > > = true;
    expect(slot).toBe(true);
  });

  it('the README\'s two `metric-card` literals parse on both faces, every key kept', () => {
    const doc = { type: 'dashboard', widgets: [custom, kpi] };
    const result = DashboardComponentZod.safeParse(doc);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const [parsedCustom, parsedKpi] = (result.data as { widgets: Record<string, Record<string, unknown>>[] }).widgets;
    for (const key of Object.keys(custom.component as object)) expect(parsedCustom.component).toHaveProperty(key);
    for (const key of Object.keys(kpi)) expect(parsedKpi).toHaveProperty(key);
    // The strict authoring face: before objectui#11467 it refused the `component`
    // card's five inputs as unrecognized (`BaseSchema` alone in that slot).
    expect(StrictAnyComponentSchema.safeParse(doc).success).toBe(true);
  });

  it('in the `component` slot the strict face judges a card by the arm, and still admits any other node', () => {
    const issues = (doc: unknown): string => {
      const result = StrictAnyComponentSchema.safeParse(doc);
      return result.success ? '' : JSON.stringify(result.error.issues);
    };
    const envelope = (component: Record<string, unknown>) => ({ type: 'dashboard', widgets: [{ id: 'w', component }] });
    const sideways = issues(envelope({ type: 'metric-card', value: '1', trend: 'sideways' }));
    expect(sideways).toContain('"trend"');
    // MEASURED LIMIT, recorded rather than ruled: the tolerant face keeps its
    // `BaseSchema` fallback for any component node a `custom` widget carries, so
    // a card that fails the arm still parses through it. The TypeScript union
    // has the same corner (the fallback arm has no closed `type` to exclude it).
    // Directly in `widgets[]` there is no such fallback, and both faces refuse.
    expect(DashboardComponentZod.safeParse(envelope({ type: 'metric-card', value: '1', trend: 'sideways' })).success).toBe(true);
    // CONTROL — a non-card node in the slot is judged by `BaseSchema`, unchanged.
    expect(issues(envelope({ type: 'chart' }))).toBe('');
    expect(DashboardComponentZod.safeParse(envelope({ type: 'chart' })).success).toBe(true);
  });
});
