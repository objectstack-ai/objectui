// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11823 (step 2) — what the Interfaces pillar's *New dashboard* and
 * *New report* write, and the one question a report adds to the create dialog.
 *
 * The Interfaces rail is the open app's navigation tree, not a type index
 * (objectstack `docs/design/builder-ui.md` §6), so a create there writes two
 * documents: the item's own draft (below), and a navigation entry that links
 * it, which the pillar sends through its nav editor's save. The new leaf then
 * opens on the canvas the pillar already renders for that type
 * (`DashboardPreview` / `ReportPreview`, the structured canvas).
 *
 * The bodies are the spec's minimum, and each is typed as the spec's input
 * type so a key the spec does not declare cannot be written here:
 *
 *  - a dashboard needs `widgets`, and may hold none: the canvas then offers
 *    "+ add widget";
 *  - a report is dataset-bound (ADR-0021): a non-`joined` report needs a
 *    `dataset` and at least one of its measures in `values`, or
 *    `ReportSchema` refuses it ("a report needs `dataset` + `values`"). So the
 *    dialog asks for both ({@link ReportCreateFields}). `type` and `drilldown`
 *    are written as the metadata editor's own report create seeds them, so the
 *    report's Properties panel shows the type and drill switch the report has.
 *
 * Internal to app-shell: not exported from the package root.
 */

import * as React from 'react';
import type { Dashboard, DashboardNavItem, Report, ReportNavItem } from '@objectstack/spec/ui';
import { t, tFormat, type SupportedLocale } from '../metadata-admin/i18n.js';
import { useDatasetCatalog, useDatasetSemantics } from '../metadata-admin/previews/useDatasetCatalog.js';
import { datasetSelectOptions, labelBesideName } from '../metadata-admin/inspectors/dataset-picker-options.js';
import type { NavNode } from './navSurface.js';

/** The two kinds the Interfaces pillar creates in this step. */
export type InterfaceCreateKind = 'dashboard' | 'report';

/** A report's binding, as the create dialog collects it: a dataset and one of its measures. */
export interface ReportBinding {
  dataset: string;
  measure: string;
}

/** The empty binding a report dialog opens with. */
export const NO_REPORT_BINDING: ReportBinding = { dataset: '', measure: '' };

/** Whether the binding names both a dataset and a measure. */
export function isReportBindingComplete(binding: ReportBinding): boolean {
  return binding.dataset !== '' && binding.measure !== '';
}

/** A new dashboard's draft body: no widget yet. */
export function buildDashboardSkeleton(name: string, label: string): Dashboard {
  return { name, label, widgets: [] };
}

/** A new report's draft body: bound to the chosen dataset, showing the chosen measure. */
export function buildReportSkeleton(name: string, label: string, binding: ReportBinding): Report {
  return {
    name,
    label,
    type: 'summary',
    drilldown: true,
    dataset: binding.dataset,
    values: [binding.measure],
  };
}

/** Every nav entry `id` in the tree, at every depth. */
function navIdsOf(nodes: NavNode[], into: Set<string> = new Set()): Set<string> {
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    if (typeof n.id === 'string' && n.id) into.add(n.id);
    if (Array.isArray(n.children)) navIdsOf(n.children, into);
  }
  return into;
}

/**
 * The navigation entry that links a new item, with an `id` no entry of the
 * tree holds yet (`nav_NAME`, then `nav_NAME_2`, …).
 *
 * A dashboard entry carries NO `label`: the spec's absent label inherits, at
 * render time, the dashboard's current label (the rule objectui#11201 applies
 * to the entries a new app is seeded with), so renaming the dashboard renames
 * the entry. A report entry carries the label the author typed, because the
 * spec's inheritance stops at object, view and dashboard targets: a label-less
 * report entry shows its `reportName`, in the running app's sidebar as here.
 */
export function interfaceNavEntry(
  kind: InterfaceCreateKind,
  name: string,
  label: string,
  navigation: NavNode[],
): DashboardNavItem | ReportNavItem {
  const taken = navIdsOf(navigation);
  let id = `nav_${name}`;
  for (let n = 2; taken.has(id); n++) id = `nav_${name}_${n}`;
  return kind === 'dashboard'
    ? { id, type: 'dashboard', dashboardName: name }
    : { id, type: 'report', reportName: name, label };
}

/**
 * The report's binding in the create dialog: the dataset it reads and one of
 * that dataset's measures, offered from the same catalog the report's
 * Properties panel binds from (`useDatasetCatalog`). Nothing is chosen for
 * the author: both start empty, and a dataset change clears the measure.
 */
export function ReportCreateFields({
  value,
  onChange,
  locale,
}: {
  value: ReportBinding;
  onChange: (next: ReportBinding) => void;
  locale: SupportedLocale;
}): React.ReactElement {
  const catalog = useDatasetCatalog();
  const semantics = useDatasetSemantics(value.dataset || undefined, catalog);
  const datasetOptions = datasetSelectOptions(catalog.datasets);

  if (catalog.loading) {
    return <p className="text-xs text-muted-foreground">{t('engine.studio.loading', locale)}</p>;
  }
  if (catalog.error && catalog.datasets.length === 0) {
    return (
      <p className="text-xs text-destructive" data-testid="create-report-datasets-failed">
        {tFormat('engine.studio.interfaces.create.datasetsFailed', locale, { error: catalog.error })}
      </p>
    );
  }
  if (catalog.datasets.length === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid="create-report-no-datasets">
        {t('engine.studio.interfaces.create.noDatasets', locale)}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('engine.studio.interfaces.create.dataset', locale)}</span>
        <select
          value={value.dataset}
          data-testid="create-report-dataset"
          onChange={(e) => onChange({ dataset: e.target.value, measure: '' })}
          className="w-full rounded border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">{t('engine.studio.interfaces.create.datasetPlaceholder', locale)}</option>
          {datasetOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {value.dataset !== '' && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('engine.studio.interfaces.create.measure', locale)}</span>
          {semantics.loading ? (
            <span className="block text-xs text-muted-foreground">{t('engine.studio.loading', locale)}</span>
          ) : semantics.measures.length === 0 ? (
            <span className="block text-xs text-muted-foreground" data-testid="create-report-no-measures">
              {semantics.error ?? t('engine.studio.interfaces.create.noMeasures', locale)}
            </span>
          ) : (
            <select
              value={value.measure}
              data-testid="create-report-measure"
              onChange={(e) => onChange({ dataset: value.dataset, measure: e.target.value })}
              className="w-full rounded border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">{t('engine.studio.interfaces.create.measurePlaceholder', locale)}</option>
              {semantics.measures.map((m) => (
                <option key={m.name} value={m.name}>
                  {labelBesideName(m.name, m.label)}
                </option>
              ))}
            </select>
          )}
        </label>
      )}
      <p className="text-[11px] text-muted-foreground">{t('engine.studio.interfaces.create.reportHint', locale)}</p>
    </div>
  );
}
