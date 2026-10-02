/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Widget-type → dispatch family, shared by every dashboard surface.
 *
 * Three surfaces used to restate this knowledge independently and disagree:
 * `DatasetWidget` covered all 19 `ChartTypeSchema` values, `DashboardRenderer`
 * covered 15, and `DashboardGridLayout` 8. A type the surface didn't name fell
 * through to `{ ...widget }`, whose `type` no component registers — so
 * `SchemaRenderer` rendered a red `role="alert"` panel dumping the widget JSON
 * (#2943).
 *
 * The single-value families were the sharpest case: `DashboardRenderer` already
 * had `METRIC_LIKE_TYPES = ['gauge','solid-gauge','kpi','bullet']` with a
 * docstring saying they "render as a metric card rather than a chart" — and
 * consulted it only to pick a grid span. The tile was sized correctly and the
 * widget was never routed.
 */

/**
 * Spec chart families that only render as another family. Normalizing them
 * here is what lets one branch serve `column` and `bar` (the spec's own
 * `ChartTypeSchema` comment records the same equivalences).
 */
export const CHART_TYPE_ALIASES: Record<string, string> = {
  column: 'bar',
  'stacked-bar': 'bar',
  'grouped-bar': 'bar',
  'bi-polar-bar': 'bar',
  spline: 'line',
  'step-line': 'line',
  'stacked-area': 'area',
  pyramid: 'funnel',
  bubble: 'scatter',
};

/** Cartesian / categorical / flow families the chart renderer draws. */
export const SERIES_CHART_TYPES: ReadonlySet<string> = new Set([
  'bar', 'horizontal-bar', 'line', 'area', 'pie', 'donut',
  'scatter', 'funnel', 'radar', 'treemap', 'sankey',
  // `combo` joined `ChartTypeSchema` in spec 17.0.0-rc.1. The chart renderer
  // has always drawn it (it derives the base family from the series), but it
  // was renderer-local, so nothing routed it from a dashboard surface — a
  // stored `combo` widget fell through to the red "Unknown component type"
  // panel the moment the spec started accepting it.
  'combo',
]);

/**
 * Single-value "performance" families — one number, optionally against a
 * target. They render as a metric card, which is what the spec's own
 * `ChartTypeSchema` comment calls "honest single-value variants pending a real
 * dial/target renderer". `metric` is the objectui widget spelling of the same
 * thing.
 */
export const METRIC_LIKE_TYPES: ReadonlySet<string> = new Set([
  'metric', 'gauge', 'solid-gauge', 'kpi', 'bullet',
]);

/** Tabular families — a grouped/flat table of records. */
export const TABLE_LIKE_TYPES: ReadonlySet<string> = new Set(['table', 'list']);

/**
 * Chart families with no renderer and no honest approximation (they need
 * richer data — OHLC, per-record distributions — or a geo dependency). Some
 * were dropped from `ChartTypeSchema` entirely; they stay named so stale
 * stored dashboards get a labelled placeholder rather than a red error box.
 */
export const UNSUPPORTED_CHART_TYPES: ReadonlySet<string> = new Set([
  'sunburst', 'word-cloud', 'choropleth', 'bubble-map', 'gl-map',
  'heatmap', 'waterfall', 'box-plot', 'violin', 'candlestick', 'stock',
]);

/** How a dashboard surface should render one widget type. */
export type WidgetDispatchFamily =
  /** A series chart (the resolved base family is in `chartType`). */
  | 'series'
  /** A single-value metric card. */
  | 'metric'
  /** A records table. */
  | 'table'
  /** Cross-tab — dataset-bound only; a non-dataset pivot is stale metadata. */
  | 'pivot'
  /** Author-supplied component schema required. */
  | 'custom'
  /** Known family, no renderer — labelled placeholder. */
  | 'unsupported'
  /** Not a widget vocabulary member — the surface passes it through. */
  | 'passthrough';

export interface WidgetDispatch {
  family: WidgetDispatchFamily;
  /** For `series`: the alias-resolved base family to draw. */
  chartType?: string;
}

/**
 * Classify a widget `type` into its dispatch family. Exported for the
 * spec-parity test, which asserts that no `ChartTypeSchema` value lands on
 * `passthrough` (the branch that produces the red box).
 */
export function classifyWidgetType(widgetType: string | undefined): WidgetDispatch {
  if (!widgetType) return { family: 'passthrough' };
  const resolved = CHART_TYPE_ALIASES[widgetType] ?? widgetType;
  if (SERIES_CHART_TYPES.has(resolved)) return { family: 'series', chartType: resolved };
  if (METRIC_LIKE_TYPES.has(widgetType)) return { family: 'metric' };
  if (TABLE_LIKE_TYPES.has(widgetType)) return { family: 'table' };
  if (widgetType === 'pivot') return { family: 'pivot' };
  if (widgetType === 'custom') return { family: 'custom' };
  if (UNSUPPORTED_CHART_TYPES.has(widgetType)) return { family: 'unsupported' };
  return { family: 'passthrough' };
}

/**
 * The node key a dashboard surface hands `SchemaRenderer` for each component
 * this package registers with `skipFallback: true` (objectui#10859 batch 8,
 * phase 2b, seat ruling M3 option A).
 *
 * `metric` and `metric-card` are two vocabularies that happened to share one
 * spelling: the dashboard WIDGET type (the spec's `ChartTypeSchema` value
 * `metric`; the 2026-08-14 slot ruling's `metric-card`, objectstack#8593) and
 * the internal NODE key the dashboard renders that widget through. The widget
 * vocabulary is untouched. Only the node key moved: the registrations publish
 * `plugin-dashboard:metric` / `plugin-dashboard:metric-card` and no bare
 * fallback, so nothing authors a bare `metric` / `metric-card` NODE that the
 * registry mounts while `objectui validate` refuses it at `type`.
 *
 * ⛔ Both surfaces (`DashboardRenderer`, `DashboardGridLayout`) emit through
 * this table, so they cannot drift apart; a new `skipFallback` registration in
 * this package that a widget can reach gets its row here in the same edit.
 */
export const DASHBOARD_NODE_TYPES: Readonly<Record<string, string>> = {
  metric: 'plugin-dashboard:metric',
  'metric-card': 'plugin-dashboard:metric-card',
};

/**
 * `node` with its `type` moved onto the namespaced key {@link
 * DASHBOARD_NODE_TYPES} names, or `node` itself when the type has no row.
 *
 * Applied where a surface forwards a node it did not build: the slot-component
 * passthrough (`{ type: 'metric-card', ... }` directly in `widgets[]`) and an
 * author-supplied `widget.component`. Both are widget-vocabulary positions,
 * which keep their spelling; this is the boundary where the widget becomes a
 * node.
 */
export function toDashboardNodeType<T>(node: T): T {
  if (!node || typeof node !== 'object') return node;
  const type = (node as { type?: unknown }).type;
  const moved = typeof type === 'string' ? DASHBOARD_NODE_TYPES[type] : undefined;
  return moved ? { ...node, type: moved } : node;
}
