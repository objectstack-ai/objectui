/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8894 ruling D — a metric-family dashboard widget declares EXACTLY
 * ONE measure, and objectui's authoring door refuses a second one at `values`.
 *
 * The protocol was judged wrong for the metric family (a tile answers one
 * number), and the spec narrowed `DashboardWidgetSchema.values` for it in
 * objectstack#17779, which `@objectstack/spec` 17.5.0 ships. objectui's mirror
 * re-attaches the spec's exported check (objectui#11073), so the refusal is
 * already live here. This file PINS that door, on both of this package's faces
 * that judge a dashboard widget:
 *
 *   1. `DashboardWidgetSchema` — the widget mirror itself;
 *   2. `safeValidateSchema` — the published component door, reached through a
 *      `dashboard` node's `widgets` slot. It is also the verdict the CLI's
 *      `validate` command prints, which calls it on the parsed file.
 *
 * ## The family is the SPEC'S, derived at run time — never a list written here
 *
 * The spec keeps its family as a module-private constant, so this file reads
 * the rule by its effect: every member of the spec's `ChartTypeSchema` is put
 * through the spec's own `DashboardWidgetSchema` with two measures, and the
 * types refused with a `custom` issue at `values` ARE the family. A type the
 * spec adds to the family (or drops from it) moves this file's subjects with
 * it, and no row here has to be edited to keep up.
 *
 * ## What each assertion is
 *
 * - A refusal is asserted as the ISSUE ENVELOPE — `code` + `path` — plus the
 *   spec's own message read from the spec's own parse of the same document.
 *   Equal messages prove the spec's check runs here, not a restatement of it.
 * - An acceptance is a FULL `safeParse` success (the one-measure tile), never
 *   merely the absence of the arity issue: the value is what is judged, so
 *   only a whole-document green says the value is legal.
 * - Controls: the other chart families keep unbounded `values` (with a
 *   dimension, the shape the spec's refusal points authors at), and the family
 *   derivation itself is checked for being non-vacuous in both directions.
 *
 * ⛔ Not pinned here, deliberately: the TypeScript face. `values` stays
 * `string[]` on the type, as it does on the spec's own inferred type — the
 * card rules out a TypeScript narrowing.
 */
import { describe, it, expect } from 'vitest';
import {
  ChartTypeSchema as SpecChartTypeSchema,
  DashboardWidgetSchema as SpecDashboardWidgetSchema,
} from '@objectstack/spec/ui';
import { DashboardWidgetSchema } from '../zod/complex.zod';
import { safeValidateSchema } from '../zod/index.zod';

type Issue = { code: string; path: PropertyKey[]; message: string };

const ONE = ['amount_sum'];
const TWO = ['amount_sum', 'deal_count'];

/** A dataset-bound widget. `type: undefined` omits the key entirely. */
const widget = (type: string | undefined, values: string[], extra: Record<string, unknown> = {}) => ({
  id: 'sales_tile',
  dataset: 'sales',
  ...(type === undefined ? {} : { type }),
  values,
  ...extra,
});

/** The dashboard node the published door judges; the widget sits in slot 0. */
const dashboardNode = (w: Record<string, unknown>) => ({ type: 'dashboard', name: 'sales_board', widgets: [w] });

const envelope = (issues: readonly Issue[]) =>
  issues.map((i) => ({ code: i.code, path: i.path.map(String).join('.'), message: i.message }));

/** The spec's arity issue for a document, read off the spec's own parse, or `undefined`. */
const specArityIssue = (doc: Record<string, unknown>): Issue | undefined => {
  const r = SpecDashboardWidgetSchema.safeParse(doc);
  if (r.success) return undefined;
  return (r.error.issues as Issue[]).find((i) => i.code === 'custom' && i.path.map(String).join('.') === 'values');
};

const SPEC_TYPES: readonly string[] = SpecChartTypeSchema.options;
/** The metric family, as the spec's rule draws it. */
const FAMILY = SPEC_TYPES.filter((t) => specArityIssue(widget(t, TWO)) !== undefined);
/** Every other spec chart family. */
const OTHERS = SPEC_TYPES.filter((t) => !FAMILY.includes(t));

describe('objectui#8894 — the family is read off the spec\'s own rule, and it is not vacuous', () => {
  it('the spec refuses a second measure on SOME types and not on others', () => {
    // Both halves must be populated: an empty family would make every
    // `it.each` below run zero rows and pass, and a family of every type would
    // mean the probe is catching some refusal other than arity.
    expect(FAMILY.length).toBeGreaterThan(0);
    expect(OTHERS.length).toBeGreaterThan(0);
    // The spec's default widget type is in the family: a typeless widget is
    // refused by the spec, which is the whole reason the typeless case below exists.
    expect(specArityIssue(widget(undefined, TWO))).toBeDefined();
  });

  it.each(FAMILY)('`%s`: the spec accepts ONE measure — the refusal is about the count, not the type', (type) => {
    expect(SpecDashboardWidgetSchema.safeParse(widget(type, ONE)).success).toBe(true);
  });
});

describe('objectui#8894 — face 1: `DashboardWidgetSchema` refuses a second measure on the metric family', () => {
  it.each(FAMILY)('`%s` with two measures is refused at `values`, with the spec\'s own issue', (type) => {
    const doc = widget(type, TWO);
    const specIssue = specArityIssue(doc)!;
    const r = DashboardWidgetSchema.safeParse(doc);
    expect(r.success).toBe(false);
    expect(envelope(r.error!.issues as Issue[])).toContainEqual({
      code: 'custom',
      path: 'values',
      message: specIssue.message,
    });
  });

  it.each(FAMILY)('`%s` with one measure parses', (type) => {
    expect(DashboardWidgetSchema.safeParse(widget(type, ONE)).success).toBe(true);
  });

  it('a widget that declares NO `type` is refused too, with the spec\'s own issue', () => {
    // objectui's mirror redeclares `type` without the spec's default; the
    // re-attached check resolves an absent type to that default itself, so the
    // two doors must still agree — message included.
    const doc = widget(undefined, TWO);
    const specIssue = specArityIssue(doc)!;
    const r = DashboardWidgetSchema.safeParse(doc);
    expect(r.success).toBe(false);
    expect(envelope(r.error!.issues as Issue[])).toContainEqual({
      code: 'custom',
      path: 'values',
      message: specIssue.message,
    });
  });

  it.each(OTHERS)('CONTROL: `%s` keeps unbounded `values` — two measures and a dimension parse on both doors', (type) => {
    const doc = widget(type, TWO, { dimensions: ['stage'] });
    expect(SpecDashboardWidgetSchema.safeParse(doc).success).toBe(true);
    expect(DashboardWidgetSchema.safeParse(doc).success).toBe(true);
  });
});

describe('objectui#8894 — face 2: the published door (`safeValidateSchema`) refuses it inside a dashboard', () => {
  it.each(FAMILY)('`%s` with two measures is refused at `widgets.0.values`, with the spec\'s own issue', (type) => {
    const w = widget(type, TWO);
    const specIssue = specArityIssue(w)!;
    const r = safeValidateSchema(dashboardNode(w));
    expect(r.success).toBe(false);
    expect(envelope(r.error!.issues as Issue[])).toContainEqual({
      code: 'custom',
      path: 'widgets.0.values',
      message: specIssue.message,
    });
  });

  it.each(FAMILY)('`%s` with one measure passes the published door', (type) => {
    expect(safeValidateSchema(dashboardNode(widget(type, ONE))).success).toBe(true);
  });
});
