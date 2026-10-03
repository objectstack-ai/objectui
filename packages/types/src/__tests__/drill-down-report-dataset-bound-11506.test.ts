/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11506 — `DrillDownConfig.report` is a dataset-bound report, the
 * spec's `ReportSchema` by reference, and the pre-9.0 object-bound form is
 * retired with no alias window.
 *
 * The drill-down drawer (`@object-ui/plugin-dashboard`) wraps the drill report
 * in a `report` node, whose `report` member is the same spec schema
 * (`ReportNodeSchema`, objectui#11440), and writes the drill filter into the
 * report's `runtimeFilter`. So the declaration takes the document that node
 * takes: what the spec refuses in a report, `filter` (an alias of
 * `runtimeFilter`) and `objectName` (an alias of `dataset`) among it, the
 * inline arm refuses too. The retired form had no producer, and through the
 * real drawer it drew an empty presentation and issued no query; the drawer
 * pins live in
 * `apps/console/src/__tests__/drillDownReport.runtimeFilter-11506.test.tsx`.
 *
 * Three doors are read. The TypeScript declaration and the strict authoring
 * face (`StrictAnyComponentSchema`) refuse the retired form; the
 * `@ts-expect-error` lines below are checked by `tsc -p tsconfig.test.json`,
 * the package's `type-check`. The tolerant face (`DrillDownConfigSchema` and
 * `safeValidateSchema`, which is what `objectui validate` runs) does not: its
 * reference arm keeps reading a value that fails the inline arm as a
 * `{ name }` reference, stripped to that member, and reports it valid.
 */
import { describe, expect, it } from 'vitest';
import { ReportSchema as SpecReportSchema } from '@objectstack/spec/ui';
import type { DrillDownConfig } from '../data-display';
import { DrillDownConfigSchema, StrictAnyComponentSchema, safeValidateSchema } from '../zod/index.zod';

type Issue = { code: string; path: PropertyKey[]; keys?: string[]; errors?: Issue[][] };
type Result = { success: boolean; error?: { issues: unknown[] } };

/** Every issue, union branches unfolded and paths made absolute. */
const allIssues = (issues: Issue[] | undefined, prefix: PropertyKey[] = []): Issue[] =>
  (issues ?? []).flatMap((issue) => {
    const path = [...prefix, ...issue.path];
    return [{ ...issue, path }, ...(issue.errors ?? []).flatMap((branch) => allIssues(branch, path))];
  });
const issuesOf = (result: Result): Issue[] => allIssues(result.error?.issues as Issue[] | undefined);

/** A dataset-bound summary report: no `columns`, which only a matrix carries. */
const DATASET_REPORT = {
  name: 'deals_by_stage',
  label: 'Deals by Stage',
  type: 'summary',
  dataset: 'deals_ds',
  rows: ['stage'],
  values: ['amount_sum'],
  runtimeFilter: { region: 'emea' },
} as const;

/** The retired pre-9.0 object-bound drill report: `objectName` plus column objects. */
const PRE_9_REPORT = { name: 'pipeline', objectName: 'deal', type: 'summary', columns: [{ field: 'amount' }] };

const PIVOT_BAG = { objectName: 'deal', rowField: 'stage', columnField: 'owner', valueField: 'amount', aggregation: 'sum' };
const pivotDrill = (report: unknown) => ({
  type: 'object-pivot',
  properties: { ...PIVOT_BAG, drillDown: { enabled: true, report } },
});

describe('DrillDownConfig.report is the spec report, by reference (objectui#11506)', () => {
  it('the TypeScript face takes a dataset-bound report and refuses the retired form and `filter`', () => {
    const summary: DrillDownConfig = {
      report: { name: 'deals_by_stage', label: 'Deals by Stage', type: 'summary', dataset: 'deals_ds', rows: ['stage'], values: ['amount_sum'] },
    };
    const matrix: DrillDownConfig = {
      report: { name: 'deals_matrix', label: 'Deals', type: 'matrix', dataset: 'deals_ds', rows: ['stage'], columns: ['owner'], values: ['amount_sum'], runtimeFilter: { region: 'emea' } },
    };
    const reference: DrillDownConfig = { report: { name: 'deals_by_stage' } };
    // @ts-expect-error the pre-9.0 object-bound form is retired: `objectName` is no member of either arm (objectui#11506).
    const pre9: DrillDownConfig = { report: { name: 'pipeline', objectName: 'deal', type: 'summary', columns: [] } };
    const withFilter: DrillDownConfig = {
      // @ts-expect-error `filter` is not a report member: the drill filter is the report's `runtimeFilter`.
      report: { name: 'deals_by_stage', label: 'Deals by Stage', dataset: 'deals_ds', rows: ['stage'], values: ['amount_sum'], filter: { stage: 'Won' } },
    };
    expect([summary, matrix, reference, pre9, withFilter]).toHaveLength(5);
  });

  it('the mirror\'s inline arm is the spec\'s `ReportSchema`: a dataset report parses with every key kept', () => {
    // Lit control: the fixture IS a spec report.
    expect(SpecReportSchema.safeParse(DATASET_REPORT).success).toBe(true);
    const parsed = DrillDownConfigSchema.safeParse({ report: DATASET_REPORT });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.report).toEqual(DATASET_REPORT);
  });

  it('the strict face accepts a dataset report on an `object-pivot` drill and refuses the retired form and `filter` at the report', () => {
    const ok = StrictAnyComponentSchema.safeParse(pivotDrill(DATASET_REPORT));
    expect(ok.success, JSON.stringify(ok.error?.issues)).toBe(true);
    expect(safeValidateSchema(pivotDrill(DATASET_REPORT)).success).toBe(true);

    const atReport = (result: Result) =>
      issuesOf(result).filter((issue) => issue.path.join('.').startsWith('properties.drillDown.report'));
    const pre9 = StrictAnyComponentSchema.safeParse(pivotDrill(PRE_9_REPORT));
    expect(pre9.success).toBe(false);
    expect(atReport(pre9).flatMap((issue) => issue.keys ?? [])).toContain('objectName');
    const withFilter = StrictAnyComponentSchema.safeParse(pivotDrill({ ...DATASET_REPORT, filter: { stage: 'Won' } }));
    expect(withFilter.success).toBe(false);
    expect(atReport(withFilter).flatMap((issue) => issue.keys ?? [])).toContain('filter');
  });

  it('the tolerant mirror no longer reads the retired form as an inline report: it falls to the reference arm, `{ name }` alone', () => {
    const parsed = DrillDownConfigSchema.safeParse({ report: PRE_9_REPORT });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.report).toEqual({ name: 'pipeline' });
  });
});
