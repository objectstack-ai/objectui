// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The metric tile's layout rule — ONE home, read by every metric tile in this
 * package: the plain cards (`MetricCard`, `MetricWidget`, and through it
 * `ObjectMetricWidget` and every `object-metric` page block) and the
 * dataset-bound tile (`DatasetWidget`) (objectui#12623).
 *
 *  - The title owns the first line: 13 px / 500, up to two lines, an ellipsis
 *    on the second. Nothing shares its line but the plain card's icon chip.
 *  - The value never wraps. It is one step smaller (20 px) in a tile narrower
 *    than 160 px, 24 px from 160 px up.
 *  - The measure label (dataset-bound tile only) is an 11 px muted line under
 *    the value, dropped below 160 px. The title's tooltip carries it, so it is
 *    still there at every width.
 *
 * Width rules key off the TILE's own box (`@container` on the tile, `@[160px]:`
 * variants), never the viewport: a dashboard grid, a page block and the
 * Studio's folded canvas each size the same tile differently.
 *
 * Class strings stay static literals so Tailwind's content scanner sees them
 * (`apps/console/src/index.css` sources this package's `src/**`).
 */

/** Put on the tile's root: the box the width rules below are measured against. */
export const METRIC_TILE_CONTAINER_CLASS = '@container';

/** The title: owns the first line, at most two lines, an ellipsis on the second. */
export const METRIC_TILE_TITLE_CLASS = 'min-w-0 line-clamp-2 break-words text-[13px] font-medium leading-snug text-foreground';

/** The value: never wraps; 20 px below a 160 px tile, 24 px from 160 px up. */
export const METRIC_TILE_VALUE_CLASS = 'max-w-full overflow-hidden text-ellipsis whitespace-nowrap tabular-nums text-xl @[160px]:text-2xl';

/** The measure label: an 11 px muted line under the value, dropped below 160 px. */
export const METRIC_TILE_MEASURE_LABEL_CLASS = 'hidden max-w-full truncate text-[11px] text-muted-foreground @[160px]:block';

/**
 * The title's tooltip: the description when one is authored, else the title,
 * then the measure label on its own line — the one place the label survives in
 * a tile too narrow to draw it.
 */
export function metricTileTooltip(title: string | undefined, description?: string, measureLabel?: string): string | undefined {
  const text = [description || title, measureLabel].filter(Boolean).join('\n');
  return text || undefined;
}
