/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { ComponentInput, ListViewVisualization } from '@object-ui/core';
import { ListView } from './ListView';
import { ListViewBlock } from './ListViewBlock';
import { ViewSwitcher } from './ViewSwitcher';
import { ObjectGallery } from './ObjectGallery';

export { ListView, ListViewBlock, ViewSwitcher, ObjectGallery };
export { ViewSwitcherDropdown } from './ViewSwitcher';
export { TabBar, TabBarSelect } from './components/TabBar';
export type { TabBarProps, ViewTab } from './components/TabBar';
export { UserFilters } from './UserFilters';
export type { UserFiltersProps } from './UserFilters';
export { evaluateConditionalFormatting, normalizeFilterCondition, normalizeFilters } from './ListView';
// The provider-less fallback table, exported so objectui#4401's mirror gate can
// compare it against the `en` pack from a package that depends on both.
export { LIST_DEFAULT_TRANSLATIONS } from './ListView';
export type { ListViewProps, ListViewHandle } from './ListView';
export type { ObjectGalleryProps } from './ObjectGallery';
export type { ViewSwitcherProps, ViewType } from './ViewSwitcher';

/**
 * Registry entry point for `<ListView>`. Both bridges it carries — the
 * schema-renderer context onto the `dataSource` PROP (#3144), and the spec's
 * `PageComponentSchema.dataSource` BINDING onto the props `ListView` reads
 * (objectstack#5576) — are documented on {@link ListViewBlock}.
 */
/**
 * Designer label per visualization, and the `viewType` enum options both
 * registrations below are built from.
 *
 * A total `Record<ListViewVisualization, string>` (`ca3942729`). The two
 * registrations each carried their own seven-entry `{ label, value }` literal,
 * compared against nothing — so both had drifted, missing `chart` and `tree`,
 * which `ListView` has drawn for releases. Deriving the options from one total
 * record means the designer offers exactly what the renderer draws, and the
 * next visualization the spec adds fails the build HERE instead of quietly
 * going unofferable.
 *
 * ⚠️ `page` is absent by construction, not by omission: {@link ListViewVisualization}
 * excludes it because the spec models `type: 'page'` as a published page mounted
 * through `pageName` rather than a visualization. A designer picker cannot offer
 * it without also binding that page.
 */
const VIEW_TYPE_LABELS: Record<ListViewVisualization, string> = {
  grid: 'Grid',
  kanban: 'Kanban',
  gallery: 'Gallery',
  calendar: 'Calendar',
  timeline: 'Timeline',
  gantt: 'Gantt',
  map: 'Map',
  chart: 'Chart',
  tree: 'Tree',
};

const VIEW_TYPE_OPTIONS = Object.entries(VIEW_TYPE_LABELS).map(([value, label]) => ({ label, value }));

const ListViewRenderer = ListViewBlock;

/**
 * The `objectName` input both registrations below publish, spelled once so the
 * two cannot drift. Not required (objectui#11605): see the `list-view`
 * registration.
 */
const LIST_VIEW_OBJECT_NAME_INPUT: ComponentInput = {
  name: 'objectName',
  type: 'string',
  description:
    'Object this list view lists. Not required: the node\'s `dataSource` binding can name the object instead, and `dataSource.object` lands on this key, outranking an authored value. With neither, and no inline `data`, the list shows a hint naming this key instead of an empty list.',
} as const;

// Register ListView component
ComponentRegistry.register('list-view', ListViewRenderer, {
  namespace: 'plugin-list',
  label: 'List View',
  category: 'Views',
  icon: 'LayoutList',
  inputs: [
    // NOT required (objectui#11605). This block has no `ComponentPropsMap`
    // row; the contract is the binding doc (`content/docs/guide/data-source.md`,
    // "a node bound this way needs no `objectName` of its own") and the
    // `list-view` record-source rule `objectui validate` runs, which counts the
    // binding as a record source. `ListViewBlock` lands `dataSource.object`
    // here. The page compile reads this list, so `required: true` refused a
    // bound node the validator and the renderer accept. A node with neither is
    // answered by the gate's "no object named" hint.
    { ...LIST_VIEW_OBJECT_NAME_INPUT },
    { name: 'viewType', type: 'enum', enum: VIEW_TYPE_OPTIONS },
    { name: 'columns', type: 'array' },
    { name: 'filter', type: 'array' },
    { name: 'sort', type: 'array' },
    { name: 'options', type: 'object' },
  ],
  defaultProps: {
    objectName: '',
    viewType: 'grid',
    columns: [],
    filter: [],
    sort: [],
    options: {},
  }
});

// Alias for generic view, exposed only as `view:list`.
//
// `skipFallback` is required: the bare `list` key belongs to the bullet/numbered
// list DISPLAY primitive (`ui:list` in @object-ui/components), used by page
// schemas like `{ type: 'list', items: [...] }`. Without skipFallback this alias
// clobbered the bare key, so a hand-authored bullet list resolved to the
// data-bound ListView (which requires `objectName`) instead. Object list VIEWS
// are rendered via `type: 'list-view'`, never the bare `list` lookup, so the
// data view loses nothing by yielding the bare key.
ComponentRegistry.register('list', ListViewRenderer, {
  namespace: 'view',
  skipFallback: true,
  category: 'view',
  label: 'List',
  icon: 'LayoutList',
  inputs: [
    // Same renderer, same reason as `list-view` above.
    { ...LIST_VIEW_OBJECT_NAME_INPUT },
    { name: 'viewType', type: 'enum', enum: VIEW_TYPE_OPTIONS },
    { name: 'columns', type: 'array' },
    { name: 'filter', type: 'array' },
    { name: 'sort', type: 'array' },
    { name: 'options', type: 'object' },
  ]
});
