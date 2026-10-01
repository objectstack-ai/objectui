/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react"
import { cn, cva } from "@object-ui/components"
import type { VariantProps } from "class-variance-authority"

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn("relative ml-3 border-l border-gray-200", className)}
    {...props}
  />
))
Timeline.displayName = "Timeline"

const timelineItemVariants = cva("ml-6", {
  variants: {
    density: {
      default: "mb-10",
      compact: "mb-3",
      comfortable: "mb-6",
    },
  },
  defaultVariants: { density: "default" },
})

const TimelineItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement> & VariantProps<typeof timelineItemVariants>
>(({ className, density, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(timelineItemVariants({ density }), className)}
    {...props}
  />
))
TimelineItem.displayName = "TimelineItem"

const timelineMarkerVariants = cva(
  "absolute -left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-blue-200 border-blue-400",
        success: "bg-emerald-200 border-emerald-500",
        warning: "bg-amber-200 border-amber-500",
        danger: "bg-red-200 border-red-500",
        info: "bg-purple-200 border-purple-500",
        todo: "bg-slate-200 border-slate-400",
        "in-progress": "bg-blue-200 border-blue-500",
        done: "bg-emerald-200 border-emerald-500",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

type TimelineMarkerVariant = VariantProps<typeof timelineMarkerVariants>["variant"]

const TimelineMarker = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: TimelineMarkerVariant
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(timelineMarkerVariants({ variant }), className)}
      {...props}
    />
  )
})
TimelineMarker.displayName = "TimelineMarker"

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  />
))
TimelineContent.displayName = "TimelineContent"

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-lg mb-1", className)}
    {...props}
  />
))
TimelineTitle.displayName = "TimelineTitle"

const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement>
>(({ className, ...props }, ref) => (
  <time
    ref={ref}
    className={cn("text-sm font-normal text-gray-500 mb-2 block", className)}
    {...props}
  />
))
TimelineTime.displayName = "TimelineTime"

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-base text-gray-700", className)}
    {...props}
  />
))
TimelineDescription.displayName = "TimelineDescription"

// Horizontal Timeline Components
const TimelineHorizontal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex overflow-x-auto py-8", className)}
    {...props}
  />
))
TimelineHorizontal.displayName = "TimelineHorizontal"

const TimelineHorizontalItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("shrink-0 w-64 relative", className)}
    {...props}
  />
))
TimelineHorizontalItem.displayName = "TimelineHorizontalItem"

// Gantt-style Timeline Components (Airtable-like)
const TimelineGantt = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full border rounded-lg overflow-hidden", className)}
    {...props}
  />
))
TimelineGantt.displayName = "TimelineGantt"

const TimelineGanttHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex border-b bg-gray-50", className)}
    {...props}
  />
))
TimelineGanttHeader.displayName = "TimelineGanttHeader"

const TimelineGanttRowLabels = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-48 border-r bg-white", className)}
    {...props}
  />
))
TimelineGanttRowLabels.displayName = "TimelineGanttRowLabels"

const TimelineGanttGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-x-auto", className)}
    {...props}
  />
))
TimelineGanttGrid.displayName = "TimelineGanttGrid"

const TimelineGanttRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center border-b min-h-12", className)}
    {...props}
  />
))
TimelineGanttRow.displayName = "TimelineGanttRow"

const TimelineGanttLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 py-2 font-medium text-sm truncate", className)}
    {...props}
  />
))
TimelineGanttLabel.displayName = "TimelineGanttLabel"

const TimelineGanttBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    start?: number
    width?: number
    variant?: "default" | "success" | "warning" | "danger" | "info"
  }
>(({ className, start = 0, width = 100, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-blue-500 hover:bg-blue-600",
    success: "bg-green-500 hover:bg-green-600",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    danger: "bg-red-500 hover:bg-red-600",
    info: "bg-purple-500 hover:bg-purple-600",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute h-8 rounded-md transition-colors cursor-pointer",
        variantClasses[variant],
        className
      )}
      style={{
        left: `${start}%`,
        width: `${width}%`,
      }}
      {...props}
    />
  )
})
TimelineGanttBar.displayName = "TimelineGanttBar"

const TimelineGanttBarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1 text-white text-xs font-medium truncate", className)}
    {...props}
  />
))
TimelineGanttBarContent.displayName = "TimelineGanttBarContent"

export {
  Timeline,
  TimelineItem,
  timelineItemVariants,
  TimelineMarker,
  timelineMarkerVariants,
  TimelineContent,
  TimelineTitle,
  TimelineTime,
  TimelineDescription,
  TimelineHorizontal,
  TimelineHorizontalItem,
  TimelineGantt,
  TimelineGanttHeader,
  TimelineGanttRowLabels,
  TimelineGanttGrid,
  TimelineGanttRow,
  TimelineGanttLabel,
  TimelineGanttBar,
  TimelineGanttBarContent,
}

// Export renderer to register the component with ObjectUI
export * from './renderer';

// Export ObjectTimeline
export { ObjectTimeline } from './ObjectTimeline';
export type { ObjectTimelineProps } from './ObjectTimeline';

import { ComponentRegistry, elementDataSourceBlock } from '@object-ui/core';
import { ObjectTimeline } from './ObjectTimeline';
import {
  ElementDataSourceGate,
  useSchemaContext,
  type ElementDataSourceMapping,
} from '@object-ui/react';

/**
 * `object-timeline` maps `object` + `filter` + `sort` + `limit` — every key its
 * fetch now reads (objectstack#7137).
 *
 * Until objectstack-ai/objectstack#7137 the fetch was `dataSource.find(schema.objectName, { options: { $top:
 * 100 } })`: no `$filter`, no `$orderby`, and a cap nested under a key no adapter
 * reads. objectstack#7121 therefore mapped `object` alone and said so, rather than
 * writing the composed filter/sort/limit onto keys nobody read — which would have
 * looked like the binding was honoured while changing nothing about the rows.
 * objectstack-ai/objectstack#7137 added the read sites (`$filter` / `$orderby` / `$top: schema.limit ?? 100`),
 * so the flags come with them and a named `view` now actually narrows the rail.
 *
 * `columns` stays unmapped for the same reason a calendar's does: a timeline
 * projects the fields its `timeline` config names (title / start / end /
 * description / color / groupBy), not a view's column list.
 */
const OBJECT_TIMELINE_DATA_SOURCE: ElementDataSourceMapping = {
  filter: true,
  sort: true,
  limit: 'limit',
};

// Register object-timeline component
export const ObjectTimelineRenderer: React.FC<any> = elementDataSourceBlock(({ schema, ...props }) => {
  const { dataSource } = useSchemaContext() || {};
  // The spec's `PageComponentSchema.dataSource` binding (objectstack#7121): a
  // timeline authored with the binding and no flat `objectName` never fetched —
  // every branch of its effect is gated on `schema.objectName` — and rendered an
  // empty rail with no request and no error.
  return (
    <ElementDataSourceGate
      schema={schema}
      mapping={OBJECT_TIMELINE_DATA_SOURCE}
      dataSource={dataSource}
      testId="object-timeline"
      errorTitle="This timeline’s data source could not be resolved"
    >
      {(bound) => <ObjectTimeline schema={bound} dataSource={dataSource} {...props} />}
    </ElementDataSourceGate>
  );
});

// `filter` and `sort` are declared on BOTH registrations of this renderer
// (objectui#8220): `ObjectTimeline` lowers both onto its object query
// (`$filter` / `$orderby`), and `@objectstack/spec`'s `object-timeline` row
// declares both, so without an input the html tier's `validateTree` reported a
// working key as `unknown-prop` on either tag. `view:timeline` is the same
// renderer under a second tag, so it declares the same pair — the
// `view:calendar` precedent (objectui#7712 / objectui#8171). `filter` is the
// RULE-ARRAY arm only — the spec refuses the MongoDB-style record form at this
// door, and `type: 'array'` makes the html tier refuse it too. Pinned in
// `__tests__/queryKeysDeclared-8220.test.tsx`.
const TIMELINE_FILTER_DESCRIPTION = 'Base query filter in the rule-array form `[{ field, operator, value }, ...]`, narrowing the records the timeline fetches. Context tokens such as `{current_user_id}` are resolved first, then the filter is lowered to `$filter` on the query. Authored `items` or `data` suppress that query, so the key then narrows nothing. The MongoDB-style record form is not this key’s shape.';
const TIMELINE_SORT_DESCRIPTION = 'Entry order in `[{ field, order }]` form, ordering the records the timeline fetches. Lowered to `$orderby` on the same query.';

// ## `navigation` — objectui#8654 (the timeline arm of objectui#8652's ruling 「B」)
//
// `@objectstack/spec` 17.5.0 declares it on the `object-timeline` row, for this
// block standalone — the platform half of the ruling. This row is the objectui
// half, together with the `navigation` member of `ObjectTimelineProps`'s schema
// in `./ObjectTimeline`. It is declared on both tags for the reason `filter` and
// `sort` are above: `view:timeline` is the same renderer under a second tag,
// the precedent the calendar's shared input list follows for this key.
//
// The description states what `ObjectTimeline` does with each member, measured
// on the real component, and it differs from the board's and the calendar's in
// two places: this renderer supplies no drawer default, so an ABSENT key opens
// nothing, and it hands the split shell no main panel, so `split` opens nothing
// either. `page`, and a block without `mode`, open nothing as on the siblings
// (objectui#11293). Members pinned in
// `__tests__/timelineNavigationMembers-8654.test.tsx`; a renderer that changes
// any of these reddens those rows, and the fix is to rewrite this description.
const TIMELINE_NAVIGATION_DESCRIPTION = 'What an entry click opens — the `{ mode, size, openNewTab, preventNavigation }` block a list view declares. Write it with `mode`: with the key ABSENT, or with a block that omits `mode` (it takes the spec’s `page` default), a click opens nothing on a timeline no parent view navigates for. `drawer`, `modal` and `popover` open the entry’s record in that overlay; `new_window` opens the record page in a new tab; `page`, `none` and `split` open nothing here, because the timeline hands the split shell no main panel. `openNewTab: true` opens the record page in a new tab and outranks the mode, `preventNavigation: true` opens nothing, and `size` sets the overlay width. A click handler from a parent view outranks the whole key.';

ComponentRegistry.register('object-timeline', ObjectTimelineRenderer, {
  namespace: 'plugin-timeline',
  label: 'Object Timeline',
  category: 'view',
  inputs: [
    { name: 'objectName', type: 'string', required: true },
    { name: 'variant', type: 'enum', enum: ['vertical', 'horizontal', 'gantt'] },
    { name: 'filter', type: 'array', description: TIMELINE_FILTER_DESCRIPTION },
    { name: 'sort', type: 'array', description: TIMELINE_SORT_DESCRIPTION },
    { name: 'navigation', type: 'object', description: TIMELINE_NAVIGATION_DESCRIPTION },
  ]
});

ComponentRegistry.register('timeline', ObjectTimelineRenderer, {
  namespace: 'view',
  label: 'Timeline View',
  category: 'view',
  inputs: [
    { name: 'objectName', type: 'string', required: true },
    { name: 'variant', type: 'enum', enum: ['vertical', 'horizontal', 'gantt'] },
    { name: 'filter', type: 'array', description: TIMELINE_FILTER_DESCRIPTION },
    { name: 'sort', type: 'array', description: TIMELINE_SORT_DESCRIPTION },
    { name: 'navigation', type: 'object', description: TIMELINE_NAVIGATION_DESCRIPTION },
  ]
});
