/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { SchemaRendererContext, useFilterScope } from '@object-ui/react';
import { isDrillEnabled, resolveDrillTitle, isStructuredGroupBy, objectAggregateSpecQuery } from '@object-ui/core';
import type { DrillDownConfig, I18nLabel, ObjectChartSchema } from '@object-ui/types';
import { useLocalization, resolveFieldCurrency, useObjectTranslation, pickLocalized } from '@object-ui/i18n';
import { MetricWidget } from './MetricWidget';
import { DrillDownDrawer } from './DrillDownDrawer';
import {
  resolveFilterPlaceholders,
  shiftFilterByCompareTo,
  compareToTrendLabelKey,
  computeMetricDelta,
  type CompareToConfig,
} from './utils';

/**
 * Page size the drilled record list falls back to when the author declared no
 * `drillDown.maxRows`. It is the value the hand-rolled panel this block used to
 * carry hard-coded, kept so that routing through the shared `DrillDownDrawer`
 * (objectui#8970) changes nothing for a config that never named the member —
 * the shared drawer's own fallback is `data-table`'s default of 10.
 */
const METRIC_DRILL_PAGE_SIZE = 25;

/**
 * ObjectMetricWidget — Data-bound metric widget.
 *
 * When a metric widget has an `object` binding and a `dataSource` is available,
 * this component attempts to fetch the metric value from the server using
 * aggregation. If the fetch fails, it shows an error state instead of
 * silently displaying stale/hardcoded data.
 *
 * Lifecycle states:
 * - **Loading** → spinner placeholder
 * - **Error** → error message (API failure is surfaced, not hidden)
 * - **Data** → actual metric value from server
 * - **Fallback** → when no dataSource is available, renders the static
 *   `options.value` as provided in the widget config (demo/fallback mode)
 */
export interface ObjectMetricWidgetProps {
  /** The object/resource name to query */
  objectName: string;
  /**
   * Aggregation config (field, function, groupBy).
   *
   * `groupBy` is the contract's own union — BY REFERENCE through
   * `ObjectChartSchema['aggregate']`, which holds `ChartAggregate` from
   * `@objectstack/spec/ui` by reference in turn, never a local near-copy of it
   * (`check:spec-symbols`). It is the same authored key both dashboard relays
   * compose for the `object-metric` and the `object-chart` node out of one
   * provider block, so a second spelling here could only be a way for the two
   * to disagree.
   *
   * It used to say `string`, which was a claim about the AUTHOR that nothing
   * upstream backed: the value crosses two `any` seams on its way in
   * (`isObjectProvider` narrows the widget data to `aggregate?: any`, and
   * `computeOne` takes the datasource untyped), so the declaration refused the
   * structured `{ field, dateGranularity }` node at neither compile time nor
   * runtime — it merely hid it from the reader, and from anyone asking whether
   * `computeOne` handled it (objectui#8613). Optional here, unlike the chart's,
   * because a metric paints ONE number and floors an absent `groupBy` at
   * `'_all'`.
   */
  aggregate?: {
    field: string;
    function: string;
    groupBy?: NonNullable<ObjectChartSchema['aggregate']>['groupBy'];
  };
  /** Filter conditions */
  filter?: any;
  /**
   * The KPI's heading, in @objectstack/spec's `I18nLabel` vocabulary — a plain
   * string or an inline per-locale map (`{ en: 'Revenue', 'zh-CN': '收入' }`).
   *
   * Was `string | { key?, defaultValue? }` — the key-reference form
   * objectstack#5055 RETIRED at rc.6. The sibling `MetricWidgetProps` was
   * migrated for this reason in objectui#4358; this interface was missed in
   * that pass, and the omission was not inert (objectui#5264). This component
   * forwards `label` straight to `MetricWidget`, which resolves it with
   * `pickLocalized`. The retired object hits no locale limb, so resolution
   * falls through to the last resort — the FIRST string property in insertion
   * order — and `{ key, defaultValue }` written in that natural order paints
   * the raw dotted translation key onto the card as its visible label.
   *
   * The producer side already says so: `ObjectMetricPropsSchema.label` in
   * `@objectstack/spec/ui` is `I18nLabelSchema`, and its inline-map key regex
   * rejects `key`/`defaultValue` by name. This declaration now agrees with it.
   */
  label: string | I18nLabel;
  /** Fallback static value (used when no dataSource or in demo mode) */
  fallbackValue?: string | number;
  /** Trend info */
  trend?: {
    value: number;
    /** Trend caption, same `I18nLabel` vocabulary as {@link ObjectMetricWidgetProps.label}. */
    label?: string | I18nLabel;
    direction?: 'up' | 'down' | 'neutral';
  };
  /** Icon name or ReactNode */
  icon?: React.ReactNode | string;
  /** Additional CSS class */
  className?: string;
  /** Sub-caption under the value, same `I18nLabel` vocabulary as {@link ObjectMetricWidgetProps.label}. */
  description?: string | I18nLabel;
  /** External data source (overrides context) */
  dataSource?: any;
  /** Visual color variant for the icon container */
  colorVariant?: 'default' | 'blue' | 'teal' | 'orange' | 'purple' | 'success' | 'warning' | 'danger';
  /** Number format pattern (e.g. `'0,0'`, `'0,0.00'`, `'$0,0'`, `'0%'`). */
  format?: string;
  /** ISO currency code (e.g. `'USD'`); enables currency formatting on numeric values. */
  currency?: string;
  /** Static prefix appended in front of the formatted value (e.g. `'$'`, `'¥'`). */
  prefix?: string;
  /** Static suffix appended after the formatted value (e.g. `' /mo'`). */
  suffix?: string;
  /**
   * When true, the displayed value is `1 - value` (clamped to `[0, 1]`).
   * Useful for "compliance" / "uptime" style gauges that aggregate the
   * opposite signal (e.g. `avg(is_violated)` → display "compliance rate").
   * Only applied when the fetched value is a finite number in `[0, 1]`.
   */
  invert?: boolean;
  /**
   * Drill-down config. When enabled, clicking the metric card opens a
   * drawer (or modal) showing the underlying records that contributed
   * to this metric, filtered by the same `filter` used for aggregation.
   */
  drillDown?: DrillDownConfig;
  /**
   * Title for the drill-down panel; defaults to the metric label. Same
   * `I18nLabel` vocabulary as {@link ObjectMetricWidgetProps.label}, and
   * resolved through the same `pickLocalized` — see `drawerTitle` below, which
   * used to read the retired form's `defaultValue` limb directly.
   */
  title?: string | I18nLabel;
  /**
   * Period-over-period comparison configuration — the executor's own
   * `{ kind, dimension? }` contract since objectstack#5011. When set, the
   * widget issues a parallel aggregate for the comparison window and derives a
   * trend (% delta + direction + i18n label like "vs last quarter").
   *
   * - `{ kind: 'previousPeriod' }`: same window length immediately before the current.
   * - `{ kind: 'previousYear' }`: same window shifted back one year.
   *
   * `dimension` is not read on this inline path — it names the dataset time
   * dimension the EXECUTOR shifts, and this path shifts the widget's own
   * `filter` instead. Has no effect when no `filter` (or no date filter) is
   * provided — the shift uses the filter's date range to compute the
   * comparison window.
   */
  compareTo?: CompareToConfig;
  /** Optional i18n translator used to localize the trend label. */
  t?: (key: string, defaultValue: string) => string;
  /** Layout variant forwarded to MetricWidget: 'card' (default) or 'bare'. */
  variant?: 'card' | 'bare';
}

export const ObjectMetricWidget: React.FC<ObjectMetricWidgetProps> = ({
  objectName,
  aggregate,
  filter,
  label,
  fallbackValue,
  trend,
  icon,
  className,
  description,
  dataSource: propDataSource,
  colorVariant,
  format,
  currency,
  prefix,
  suffix,
  invert,
  drillDown,
  title,
  compareTo,
  t: tProp,
  variant,
}) => {
  const context = useContext(SchemaRendererContext);
  const dataSource = propDataSource || context?.dataSource;
  const [drillOpen, setDrillOpen] = useState(false);

  const [fetchedValue, setFetchedValue] = useState<string | number | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectSchema, setObjectSchema] = useState<any>(null);

  // Fetch object schema so we can derive currency/precision from the
  // aggregated field's metadata. This lets dashboard configs omit the
  // redundant `format: '$0,0'` / `prefix: '$'` for `Field.currency()` fields.
  useEffect(() => {
    let mounted = true;
    if (!dataSource || !objectName || typeof dataSource.getObjectSchema !== 'function') return;
    dataSource.getObjectSchema(objectName)
      .then((s: any) => { if (mounted) setObjectSchema(s); })
      .catch(() => { /* metadata lookup is best-effort */ });
    return () => { mounted = false; };
  }, [dataSource, objectName]);

  // Resolve the field definition for the aggregated field (e.g. 'amount').
  const valueFieldDef = useMemo(() => {
    const fieldName = aggregate?.field;
    if (!fieldName || !objectSchema?.fields) return null;
    const fields = objectSchema.fields;
    if (Array.isArray(fields)) return fields.find((f: any) => f?.name === fieldName) || null;
    return fields[fieldName] || null;
  }, [objectSchema, aggregate?.field]);

  // Derive format/currency from the field metadata when the dashboard config
  // doesn't override them. Honors `Field.currency({ defaultCurrency, precision })`.
  const inferredFormat = useMemo(() => {
    if (format) return format;
    if (!valueFieldDef) return undefined;
    if (valueFieldDef.type === 'currency') {
      // Decimal places come from `scale`, not `precision` (the total digit
      // count of a decimal(p, s) column) — see #2131.
      const decimals = valueFieldDef.scale ?? 0;
      return decimals > 0 ? `0,0.${'0'.repeat(decimals)}` : '0,0';
    }
    if (valueFieldDef.type === 'percent') return '0,0%';
    if (valueFieldDef.type === 'number' || valueFieldDef.type === 'integer') return '0,0';
    return undefined;
  }, [format, valueFieldDef]);

  // Tenant default currency (localization.currency, ADR-0053) backstops a
  // currency field that declares no explicit code of its own.
  const { currency: tenantCurrency } = useLocalization();
  // The UI language — what label TEXT follows (distinct from the tenant's
  // number/currency locale above). Same source `MetricWidget` resolves its own
  // heading against, so the drill-down drawer cannot disagree with the tile.
  const { language } = useObjectTranslation();
  const inferredCurrency = useMemo(() => {
    if (currency) return currency;
    if (valueFieldDef?.type !== 'currency') return undefined;
    return resolveFieldCurrency(valueFieldDef, tenantCurrency);
  }, [currency, valueFieldDef, tenantCurrency]);

  // Stable JSON keys to prevent infinite refetch loops when callers
  // pass fresh `aggregate` / `filter` object references each render
  // (e.g. DashboardRenderer.getComponentSchema rebuilds these on every render).
  const aggregateKey = useMemo(() => (aggregate ? JSON.stringify(aggregate) : ''), [aggregate]);

  // Resolve every filter placeholder — relative-date macros (e.g.
  // "{current_quarter_start}") AND session tokens ("{current_user_id}") — so
  // the server sees real values and the drill-down `find()` later sees the
  // exact same filter as the aggregate query. Resolving only date macros here
  // left user-scoped metrics silently rendering 0 (framework #3574).
  const filterScope = useFilterScope();
  const resolvedFilter = useMemo(
    () => resolveFilterPlaceholders(filter, filterScope),
    [filter, filterScope],
  );
  const resolvedFilterKey = useMemo(
    () => (resolvedFilter ? JSON.stringify(resolvedFilter) : ''),
    [resolvedFilter],
  );

  const compareToKey = useMemo(
    () => (compareTo ? JSON.stringify(compareTo) : ''),
    [compareTo],
  );

  // Compute the single-bucket aggregate value for a given filter. Shared
  // between the current-period and comparison-period queries.
  const computeOne = useCallback(async (ds: any, filterForRun: any): Promise<number | string | null> => {
    if (aggregate && typeof ds.aggregate === 'function') {
      const groupBy = aggregate.groupBy;
      // Two authored `groupBy` shapes, two wires — the SAME routing the chart
      // family has had since objectui#7946, shared out of `@object-ui/core` so
      // there is one answer rather than two (objectui#8613).
      //
      // A structured node (`{ field, dateGranularity }`) needs the spec-shape
      // `{ groupBy: GroupByNode[], aggregations, where }` query, because that
      // is the one the server's date-bucket engine runs. Forwarded on the
      // legacy bag below it became `dimensions: [ <the node> ]` on the
      // analytics wire, where the contract declares dimension NAMES and
      // `dateGranularity` is not honoured at all: the author asked for monthly
      // buckets and got a different question answered, silently.
      //
      // The readback below is unchanged and needs no branch of its own: the
      // measure is projected under `chartMeasureKey`'s alias — the raw `field`,
      // or the literal `'count'` for a fieldless count — and both are limbs the
      // two chains already try (`row[field]`, `r.count`).
      const results = isStructuredGroupBy(groupBy)
        ? await ds.aggregate(objectName, objectAggregateSpecQuery(aggregate, groupBy, filterForRun))
        : await ds.aggregate(objectName, {
            field: aggregate.field,
            function: aggregate.function,
            groupBy: groupBy || '_all',
            filter: filterForRun,
          });
      const data = Array.isArray(results) ? results : [];
      if (data.length === 0) return 0;
      if (aggregate.function === 'count') {
        const suffixedKey = `${aggregate.field}_count`;
        return data.reduce((sum: number, r: any) => sum + (
          Number(r[suffixedKey]) ||
          Number(r[aggregate.field]) ||
          Number(r.count) ||
          0
        ), 0);
      }
      const row = data[0] as Record<string, any>;
      const suffixedKey = `${aggregate.field}_${aggregate.function}`;
      return row[suffixedKey] ?? row[aggregate.field] ?? row.value ?? 0;
    }
    if (typeof ds.find === 'function') {
      const results = await ds.find(objectName, { $filter: filterForRun });
      const records = Array.isArray(results) ? results : results?.data || results?.records || [];
      return records.length;
    }
    return null;
  }, [objectName, aggregateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMetric = useCallback(async (ds: any, mounted: { current: boolean }) => {
    if (!ds || !objectName) return;
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Run current and (optional) comparison aggregates in parallel so
      // a slow backend doesn't double the perceived load time.
      // Pass the RAW (unresolved) filter so `shiftFilterByCompareTo` can
      // substitute `{current_*}` tokens with their `{last_*}` counterparts
      // (`kind: 'previousPeriod'`) or re-resolve macros against a shifted `now`
      // (`kind: 'previousYear'`). Passing the already-resolved filter would
      // produce an identical query with no period shift.
      const comparisonFilter = compareTo
        ? shiftFilterByCompareTo(filter, compareTo)
        : null;

      const [current, previous] = await Promise.all([
        computeOne(ds, resolvedFilter),
        comparisonFilter ? computeOne(ds, comparisonFilter) : Promise.resolve(null),
      ]);

      if (current === null) return;

      if (mounted.current) {
        setFetchedValue(current);
        setPreviousValue(typeof previous === 'number' && Number.isFinite(previous) ? previous : null);
      }
    } catch (e) {
      console.error('[ObjectMetricWidget] Fetch error:', e);
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'Failed to load metric');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectName, aggregateKey, resolvedFilterKey, compareToKey, computeOne]);

  useEffect(() => {
    const mounted = { current: true };

    if (dataSource && objectName) {
      fetchMetric(dataSource, mounted);
    } else {
      // Reset state when dataSource becomes unavailable so we fall back
      // to the static fallbackValue instead of showing stale server data.
      setFetchedValue(null);
      setError(null);
    }

    return () => { mounted.current = false; };
  }, [dataSource, objectName, fetchMetric]);

  // Determine the display value:
  // - If we fetched a value from the server, use it
  // - If there's no data source, use the fallback (demo/static value)
  let displayValue: string | number = fetchedValue !== null
    ? fetchedValue
    : (!dataSource ? (fallbackValue ?? '—') : '—');

  // Apply `invert` for compliance-style gauges (display 1 - rate).
  if (invert && typeof displayValue === 'number' && isFinite(displayValue) && displayValue >= 0 && displayValue <= 1) {
    displayValue = 1 - displayValue;
  }

  // Derive a trend descriptor from the parallel comparison aggregate. When
  // `compareTo` is set and both values are finite numbers, this synthesizes
  // a `{ value, direction, label }` trend that overrides any static `trend`
  // prop passed in. The label uses the i18n key derived from `compareTo`
  // (e.g. `dashboard.trend.vsLastQuarter`).
  const derivedTrend = useMemo(() => {
    if (!compareTo) return undefined;
    if (typeof fetchedValue !== 'number' || !Number.isFinite(fetchedValue)) return undefined;
    if (previousValue === null) return undefined;
    const delta = computeMetricDelta(fetchedValue, previousValue);
    if (!delta) return undefined;
    const labelKey = compareToTrendLabelKey(compareTo, filter);
    const fullKey = `dashboard.trend.${labelKey}`;
    const defaults: Record<string, string> = {
      vsPreviousPeriod: 'vs previous period',
      vsLastWeek: 'vs last week',
      vsLastMonth: 'vs last month',
      vsLastQuarter: 'vs last quarter',
      vsLastYear: 'vs last year',
      vsYesterday: 'vs yesterday',
    };
    const labelText = tProp ? tProp(fullKey, defaults[labelKey] || labelKey) : (defaults[labelKey] || labelKey);
    return { value: delta.value, direction: delta.direction, label: labelText };
  }, [compareTo, fetchedValue, previousValue, filter, tProp]);

  const effectiveTrend = derivedTrend ?? trend;

  // --- Drill-down --------------------------------------------------------
  // KPI cards drill into the underlying records they aggregate. The drill
  // table reuses the metric's own `filter` (no additional category narrowing
  // — the whole metric is the slice). Falls back to the metric label as
  // drawer title when no explicit `drillDown.title` template is set.
  const drillEnabled = isDrillEnabled(drillDown) && !!objectName && !!dataSource;
  //
  // `title` and `label` are `I18nLabel` (see the interface above), so they are
  // resolved with `pickLocalized` — the same seam `MetricWidget` uses for the
  // tile's own heading, so the drawer and the card it opened from agree on one
  // locale. These two reads previously destructured `defaultValue` off the
  // RETIRED key-reference form: an inline per-locale map has no such limb, so
  // an authored `title` resolved to `''` and the drawer silently fell back to
  // the literal word "Details" (objectui#5264).
  const drawerTitle = useMemo(() => {
    const labelText = pickLocalized(label, language);
    const titleText = pickLocalized(title, language);
    return resolveDrillTitle(drillDown, {}, titleText || labelText || 'Details');
  }, [drillDown, label, title, language]);

  // Routed through the shared `DrillDownDrawer` — the component every other
  // widget in this package drills through (objectui#8970). This block used to
  // hand-roll its own Sheet/Dialog panel, which read `enabled`, `target`'s two
  // in-place arms, `title` and `report` and silently discarded the rest of the
  // config an author is offered: `columns`, `maxRows` and `target: 'navigate'`
  // acted on every other block sharing `DrillDownConfig` and did nothing here.
  // Two implementations of one drawer was the defect — teaching the copy three
  // more members would only have guaranteed a fourth divergence.
  //
  // `maxRows` now chooses the drilled list's page size, defaulting to the 25
  // the inline panel hard-coded, so a config that never authored the member
  // keeps the page size it had. `className` reproduces the height the inline
  // body wrapper carried.
  //
  // `drillDown.filter` is deliberately NOT forwarded: the drilled list is
  // scoped by the METRIC's own resolved filter, which is the registration's
  // promise that the number and the records behind it agree. `mode` has no
  // read site on the shared drawer either. Both are left to the judgement
  // objectui#8970 asks for rather than settled here.
  const drillDrawer = drillEnabled ? (
    <DrillDownDrawer
      open
      onClose={() => setDrillOpen(false)}
      title={drawerTitle}
      target={drillDown?.target}
      objectName={objectName as string}
      filter={resolvedFilter}
      dataSource={dataSource}
      columns={drillDown?.columns}
      maxRows={drillDown?.maxRows ?? METRIC_DRILL_PAGE_SIZE}
      report={drillDown?.report as Record<string, unknown> | undefined}
      className="h-full"
    />
  ) : null;

  return (
    <>
      <MetricWidget
        label={label}
        value={displayValue}
        trend={effectiveTrend}
        icon={icon}
        className={className}
        description={description}
        loading={loading}
        error={error}
        colorVariant={colorVariant}
        format={inferredFormat}
        currency={inferredCurrency}
        prefix={prefix}
        suffix={suffix}
        variant={variant}
        onClick={drillEnabled ? () => setDrillOpen(true) : undefined}
      />
      {drillOpen && drillDrawer}
    </>
  );
};
