/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10327 — a view filter on a `chart` view bound to a semantic
 * `dataset` is refused at authoring (ruling 5825582592, letter A: a dataset
 * chart takes its scope from the dataset).
 *
 * The dataset shape of `ListView`'s `case 'chart'` builds a node with no
 * `filter`, so an authored view filter there was accepted and silently dropped.
 * `ListViewSchema` now refuses it, loudly, in the channel its neighbours use: a
 * `custom` issue at the written key, whose message names the key and the
 * condition and ends with the remedy the ruling wrote.
 *
 * Each refused case asserts it is the ONLY issue, so the refusal cannot ride on
 * some other failure of the same document; each control asserts a full parse,
 * on both doors (the schema and the published `safeValidateSchema`).
 */
import { describe, it, expect } from 'vitest';
import { ListViewSchema, safeValidateSchema } from '../zod/index.zod';

const REMEDY = "a dataset chart's scope is written in the dataset.";

const DATASET_BLOCK = { chartType: 'bar', dataset: 'task_ds', dimensions: ['status'], values: ['total_estimate'] };
const OBJECT_BAG = { chartType: 'bar', xAxisField: 'status', yAxisFields: ['estimate'], aggregation: 'sum' };
const VIEW_FILTER = [{ field: 'status', operator: 'equals', value: 'open' }];
const LEGACY_FILTERS = [['status', '=', 'open']];

const node = (extra: Record<string, unknown>) => ({
  type: 'list-view',
  objectName: 'task',
  columns: ['name'],
  ...extra,
});

const bothDoors = (doc: unknown) => [ListViewSchema.safeParse(doc), safeValidateSchema(doc)];

const issuesOf = (r: { success: boolean; error?: { issues: Array<{ code: string; path: PropertyKey[]; message: string }> } }) =>
  (r.error?.issues ?? []).map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message }));

describe('objectui#10327 — a view filter on a dataset-bound chart view is refused', () => {
  it.each([
    ['`filter` on a `chart` block bound to a dataset', { chart: DATASET_BLOCK, filter: VIEW_FILTER }, 'filter'],
    ['`filter` on the legacy `options.chart` bag bound to a dataset', { options: { chart: DATASET_BLOCK }, filter: VIEW_FILTER }, 'filter'],
    ['the legacy `filters` alias on a `chart` block bound to a dataset', { chart: DATASET_BLOCK, filters: LEGACY_FILTERS }, 'filters'],
  ])('%s: one `custom` issue at the written key, naming it, with the ruling\'s remedy', (_label, extra, key) => {
    for (const r of bothDoors(node({ viewType: 'chart', ...extra }))) {
      expect(r.success).toBe(false);
      const issues = issuesOf(r);
      expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([{ code: 'custom', path: key }]);
      expect(issues[0].message.startsWith(`\`${key}\` is refused on a \`chart\` view bound to a semantic \`dataset\``)).toBe(true);
      expect(issues[0].message.endsWith(REMEDY)).toBe(true);
    }
  });

  it('both spellings written at once: one issue at each key', () => {
    for (const r of bothDoors(node({ viewType: 'chart', chart: DATASET_BLOCK, filter: VIEW_FILTER, filters: LEGACY_FILTERS }))) {
      expect(r.success).toBe(false);
      expect(issuesOf(r).map(({ code, path }) => ({ code, path }))).toEqual([
        { code: 'custom', path: 'filter' },
        { code: 'custom', path: 'filters' },
      ]);
    }
  });
});

describe('objectui#10327 — controls: every neighbour of the refused shape parses', () => {
  it.each([
    ['an object-bound chart (legacy `options.chart` bag) with a view filter', { viewType: 'chart', options: { chart: OBJECT_BAG }, filter: VIEW_FILTER }],
    ['a chart view declaring no block, with a view filter', { viewType: 'chart', filter: VIEW_FILTER }],
    ['a dataset-bound chart with no view filter', { viewType: 'chart', chart: DATASET_BLOCK }],
    ['a dataset-bound chart with an EMPTY view filter', { viewType: 'chart', chart: DATASET_BLOCK, filter: [] }],
    [
      'a grid that offers a switch to a dataset chart, with a view filter (the filter scopes the grid)',
      { viewType: 'grid', chart: DATASET_BLOCK, appearance: { allowedVisualizations: ['grid', 'chart'] }, filter: VIEW_FILTER },
    ],
  ])('%s', (_label, extra) => {
    for (const r of bothDoors(node(extra))) {
      expect(issuesOf(r)).toEqual([]);
      expect(r.success).toBe(true);
    }
  });
});
