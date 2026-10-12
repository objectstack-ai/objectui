/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12163 — PROBE, not a landed pin. A `custom` widget's legacy `component`
 * envelope, with the slot's second arm swapped from `BaseSchema` to `SchemaNodeSchema`
 * (triage `6115306508`), measured on both faces.
 *
 * ⚠️ This file records the readings behind a `needs_decision` report. The swap collides
 * with the objectui#11228 ruling C (comment `5921018991`): that ruling keeps the strict
 * face refusing `widgets[].component.{chartType, xAxisKey, series}` by name and leaves
 * option D (type the slot as the chart node) not taken. The swap makes a well-formed
 * `chart` node at the envelope's root parse on the strict face. The last block below
 * records that reading, and that the same chart one node down (a `div`'s `children`)
 * already parses on the strict face before the swap.
 *
 * Every refusal assertion reads the zod issue `code` and the named key, never a bare
 * `success === false`.
 */

import { describe, it, expect } from 'vitest';
import { AnyComponentSchema, StrictAnyComponentSchema } from '../zod/index.zod.js';

interface Issue {
  code: string;
  path: PropertyKey[];
  keys?: string[];
  errors?: Issue[][];
}

const issuesOf = (schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: unknown[] } } }, doc: unknown): Issue[] | null => {
  const result = schema.safeParse(doc);
  return result.success ? null : (result.error!.issues as Issue[]);
};

/** Every `unrecognized_keys` finding in the issue tree, union arms included, as `path.key`. */
const undeclared = (issues: Issue[] | null, prefix: PropertyKey[] = []): string[] => {
  const out: string[] = [];
  for (const issue of issues ?? []) {
    const at = [...prefix, ...issue.path];
    if (issue.code === 'unrecognized_keys') for (const k of issue.keys ?? []) out.push([...at, k].map(String).join('.'));
    for (const arm of issue.errors ?? []) out.push(...undeclared(arm, at));
  }
  return [...new Set(out)];
};

/** Every issue in the tree, union arms included, as `path:code`. */
const flat = (issues: Issue[] | null, prefix: PropertyKey[] = []): string[] => {
  const out: string[] = [];
  for (const issue of issues ?? []) {
    const at = [...prefix, ...issue.path];
    out.push(`${at.map(String).join('.')}:${issue.code}`);
    for (const arm of issue.errors ?? []) out.push(...flat(arm, at));
  }
  return out;
};

const custom = (component: unknown) => ({ type: 'dashboard', widgets: [{ id: 'w', type: 'custom', component }] });

describe('objectui#12163 — a `custom` widget\'s `component` node is judged by its own type (PROBE)', () => {
  it.each([
    ['text / content', { type: 'text', content: 'hi' }],
    ['statistic / value', { type: 'statistic', label: 'Revenue', value: 42 }],
  ])('the card\'s `%s` node parses on both faces, every key kept', (_name, component) => {
    expect(issuesOf(StrictAnyComponentSchema, custom(component))).toBeNull();
    const tolerant = AnyComponentSchema.safeParse(custom(component));
    expect(tolerant.success).toBe(true);
    expect((tolerant.data as { widgets: { component: unknown }[] }).widgets[0].component).toEqual(component);
  });

  it.each([
    ['text', { type: 'text', content: 'hi', zzz: 1 }, 'content'],
    ['statistic', { type: 'statistic', value: 42, zzz: 1 }, 'value'],
  ])('an unknown key on a `%s` node is refused by name, and the node\'s own key is not', (_name, component, own) => {
    const found = undeclared(issuesOf(StrictAnyComponentSchema, custom(component)));
    expect(found).toContain('widgets.0.component.zzz');
    expect(found).not.toContain(`widgets.0.component.${own}`);
  });

  it('CONTROL (objectui#11709) — a `metric-card` with a refused key is still refused at that key; `layout` still parses', () => {
    const labelled = flat(issuesOf(StrictAnyComponentSchema, custom({ type: 'metric-card', value: '1', label: 'Revenue' })));
    expect(labelled).toContain('widgets.0.component.label:invalid_type');
    expect(undeclared(issuesOf(StrictAnyComponentSchema, custom({ type: 'metric-card', value: '1', zzz: 1 })))).toContain('widgets.0.component.zzz');
    expect(issuesOf(StrictAnyComponentSchema, custom({ type: 'metric-card', value: '1', layout: { x: 0, y: 0, w: 2, h: 2 } }))).toBeNull();
  });
});

describe('objectui#12163 — the readings the decision is about (PROBE)', () => {
  const chart = { type: 'chart', chartType: 'bar', xAxisKey: 'month', series: [{ dataKey: 'revenue' }], data: [{ month: 'Jan', revenue: 3 }] };

  it('MEASURED — with the swap, a well-formed `chart` node at the envelope root parses on the strict face (objectui#11228 ruling C refuses it)', () => {
    expect(issuesOf(StrictAnyComponentSchema, custom(chart))).toBeNull();
  });

  it('MEASURED — the same `chart` one node down, in a `div`\'s `children`, parses on the strict face with or without the swap', () => {
    expect(issuesOf(StrictAnyComponentSchema, custom({ type: 'div', children: [chart] }))).toBeNull();
  });

  it('MEASURED — with the swap, a primitive in the slot parses on both faces', () => {
    expect(issuesOf(StrictAnyComponentSchema, custom('hi'))).toBeNull();
    expect(issuesOf(AnyComponentSchema, custom(5))).toBeNull();
  });
});
