/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - ADR-0080 Public Block Zod Validators
 *
 * Arms for the namespaced ADR-0080 PUBLIC blocks — the curated AI-authoring
 * vocabulary `PUBLIC_BLOCKS` in `@object-ui/core`
 * (`packages/core/src/registry/public-blocks.ts`) — whose props
 * `@objectstack/spec` declares as a `ComponentPropsMap` row: the `page:`
 * structure blocks, the `record:` blocks that carry a row, and `element:text`,
 * `element:number`, `element:button` and `element:divider`.
 *
 * ## Why this module exists (objectui#10872)
 *
 * Every one of these types is REGISTERED (`@object-ui/components`,
 * `@object-ui/plugin-detail`), CURATED as platform contract by ADR-0080 and
 * DECLARED by the spec, while `AnyComponentSchema` carried no arm for any of
 * them — so `safeValidateSchema` and `objectui validate` refused every document
 * naming one with `invalid_union` at `type`, and a page built from the public
 * vocabulary could not validate at all. The count of registered namespaced
 * types still refused there is ratcheted, and printed, by
 * `packages/cli/src/__tests__/registered-types-validate-ratchet-10859.test.ts`.
 *
 * ## Where the props live: `properties`, by reference
 *
 * A `ComponentPropsMap` row is the spec's declaration of a page component's
 * props BAG — the `properties` member of `PageComponentSchema` ("Component
 * props passed to the widget") — not of the node's own keys. So each arm
 * declares `properties` as that row, BY REFERENCE, crossing the objectui#8317
 * import boundary (`stripImportedDefaults`) like every other spec read in this
 * directory: the row's members, value types, `.describe()` text, strictness,
 * refinements and retired-key tombstones all arrive from the spec, and a row
 * the spec changes changes the arm the same day. No member is restated here,
 * so none can drift — except the one row the spec does not export by name
 * (`element:divider`, below). The node-level members an arm adds are three
 * kinds: an `on*` key a renderer reads off the node (`page:tabs`'s
 * `onTabChange`), refused by name with `handlerKeyRefusal` as
 * `check:handler-key-reads` requires of every such read; `element:number`'s
 * `dataSource`, the spec's own binding schema by reference (below); and the
 * content-channel refusals (next section) — the tombstones, and
 * `record:alert`'s flat-`body` alias refusal.
 *
 * ## The content channels (objectui#9256)
 *
 * Every block armed here except the four `page:` containers (`page:card`,
 * `page:section`, `page:footer`, `page:sidebar`, which render the node's child
 * list) reads NEITHER content channel: no read of the node's `children` or
 * `body` reaches the renderer, and `SchemaRenderer` strips both out of the
 * props bag it spreads. So each of those arms declares `children` as a
 * by-name refusal, and restates `body` with the same guidance — `BaseSchema`
 * already refuses `body` (objectui#6771), but its message names `children` as
 * the remedy, which these blocks do not read either. Both stay MEMBERS
 * (`retirementTombstone`), so the refusal sits at the key's own path.
 *
 * Two carve-outs, each stated on its arm: `page:tabs` and `page:accordion`
 * render the `children` of each ITEM in their `items` bag member, which is
 * the spec row's and stays live — only the node's own `children` is refused;
 * and `record:alert` reads a key named `body` as its message TEXT, so its
 * `body` is not a content channel and gets no tombstone. Its message text is
 * `properties.body`, the spec row's member; a `body` written flat on the node
 * is refused by an alias refusal that names `properties.body` (objectui#10872),
 * where `BaseSchema`'s objectui#6771 refusal would name `children`, a channel
 * this block does not render.
 *
 * The bag is the one spelling every block here is read through at runtime:
 * `SchemaRenderer` hoists each `properties` key onto the node before the
 * renderer runs (`type` / `id` excepted), and the `element:*` renderers read
 * ONLY the bag (`readProps` in `@object-ui/components`). It is also the
 * spelling the platform's own producers write — the default record-page
 * synthesizer (`buildDefaultPageSchema`'s `componentNode`) and the page
 * designer both emit `{ type, properties }`.
 *
 * ⚠️ A key written FLAT on the node is not judged against the block's row. One
 * the shared node base does not declare (`{ "type": "record:details",
 * "columns": "2" }`) passes the tolerant face unjudged, exactly as every
 * undeclared key of every arm does, and the strict authoring face refuses it;
 * one `BaseSchema` does declare (`children`, `label`, `disabled`, `visible`) is
 * judged by the base's own type — unless the arm declares it again, as the
 * content-channel tombstones below do for `children` on every block but the
 * four `page:` containers. A flat `body` is refused on both faces: by those
 * tombstones; on `record:alert`, by its alias refusal naming `properties.body`;
 * and on the four containers, by the base's objectui#6771 retirement, whose
 * `children` remedy they do render. Whether the flat spelling is ALSO an authoring channel for
 * the `page:` / `record:` families (their renderers read the hoisted node
 * keys) is left open on objectui#10872 rather than decided by this module —
 * declaring it later is additive, and it must never extend to `element:*`,
 * whose renderers do not read a flat key at all.
 *
 * `properties` is optional on every arm, as it is on `PageComponentSchema`:
 * the spec's own props gate (`validateComponentProps`, `@objectstack/lint`)
 * judges a bag only when the node carries one, and so does this face.
 *
 * ## The one waiver: `element:number`'s `object` (objectui#10872 batch 2)
 *
 * `ComponentPropsMap['element:number']` requires `object`, and the spec's props
 * gate waives exactly that one member when the node's `dataSource.object` is a
 * non-empty name (`DATASOURCE_SUPPLIED_PROP` and `suppliedByDataSource` in
 * `@objectstack/lint`'s `validate-component-props.ts`). The row alone would
 * refuse that spec-valid node, so this arm mirrors the waiver — and only it —
 * in two halves, both by reference: the bag is the row with `object` alone made
 * optional (`ElementNumberPropsBag`), and a node refinement puts the
 * requiredness back wherever the waiver does not apply
 * (`elementNumberObjectIsSupplied`). The waiver covers an OMITTED `object`, as
 * the gate's own docblock states it ("the one prop whose absence this rule does
 * NOT report"); the gate's code matches the issue by path alone and so also
 * passes a wrong-typed `object` beside a binding, which this arm leaves to the
 * row to refuse. The node also declares `dataSource`, as the
 * spec's `ElementDataSourceSchema` read by reference — the same schema
 * `PageComponentSchema.dataSource` is.
 *
 * ## The public blocks NOT armed here, and why
 *
 * Held by objectui#10872 with the evidence on that card — each is a reading,
 * not an oversight:
 *
 *   - `record:line_items` — the spec carries no row, on purpose: its
 *     `STRING_ARM_REGISTERED_TYPES` ledger records the row as still to be
 *     measured from the renderer's read points.
 *   - `element:definition-list`, `element:repeater` — the spec's `element:`
 *     namespace is a closed vocabulary at author time and does not declare
 *     either type.
 *   - `action:button`, `action:group`, `action:menu`, `action:icon` — no spec
 *     row yet; one is being measured from the renderers' read points upstream
 *     (objectstack-ai/objectstack#20371).
 *
 * ⛔ No `.default()` anywhere in this module — see the "authors no default"
 * note in `index.zod.ts`.
 *
 * @module zod/public-blocks
 * @packageDocumentation
 */

import { z } from 'zod';
import {
  PageHeaderProps as SpecPageHeaderProps,
  PageTabsProps as SpecPageTabsProps,
  PageCardProps as SpecPageCardProps,
  PageAccordionProps as SpecPageAccordionProps,
  PageContainerProps as SpecPageContainerProps,
  RecordDetailsProps as SpecRecordDetailsProps,
  RecordHighlightsProps as SpecRecordHighlightsProps,
  RecordRelatedListProps as SpecRecordRelatedListProps,
  RecordPathProps as SpecRecordPathProps,
  RecordActivityProps as SpecRecordActivityProps,
  RecordChatterProps as SpecRecordChatterProps,
  RecordHistoryProps as SpecRecordHistoryProps,
  RecordQuickActionsProps as SpecRecordQuickActionsProps,
  RecordReferenceRailProps as SpecRecordReferenceRailProps,
  RecordAlertProps as SpecRecordAlertProps,
  ElementTextPropsSchema as SpecElementTextPropsSchema,
  ElementNumberPropsSchema as SpecElementNumberPropsSchema,
  ElementButtonPropsSchema as SpecElementButtonPropsSchema,
  ElementDataSourceSchema as SpecElementDataSourceSchema,
} from '@objectstack/spec/ui';
import { BaseSchema } from './base.zod.js';
import { stripImportedDefaults } from './imported-defaults.js';
import {
  aliasKeyRefusal,
  handlerKeyRefusal,
  neitherContentChannelGuidance,
  retirementTombstone,
} from './tombstone.zod.js';

/**
 * The `properties` member of one public block: the spec row, optional, with
 * the provenance spelled into its description. The row is passed in already
 * through the import boundary, so this helper never touches a spec binding.
 */
function propsBag<T extends z.ZodType>(type: string, row: T) {
  return row
    .optional()
    .describe(
      `The \`${type}\` props bag — \`@objectstack/spec\` \`ComponentPropsMap['${type}']\`, by reference. `
      + 'Judged only when present, as the spec\'s props gate judges it.',
    );
}

/* ── page: — structure ──────────────────────────────────────────────────── */

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `page:header`. */
const PAGE_HEADER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'page:header',
  'its registration (`page:header`, `@object-ui/components`) hands the node to `PageHeaderRenderer`, an '
    + '`any`-typed renderer whose reads, attributed in its own file, are the header keys and the `properties` bag',
  'the page title bar — `title`, `subtitle`, `breadcrumb` and the `actions` toolbar',
);

/** `page:header` — `ComponentPropsMap['page:header']`. */
export const PageHeaderBlockSchema = BaseSchema.extend({
  type: z.literal('page:header'),
  properties: propsBag('page:header', stripImportedDefaults(SpecPageHeaderProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(PAGE_HEADER_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_HEADER_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `page:tabs`. */
const PAGE_TABS_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'page:tabs',
  'its registration (`page:tabs`, `@object-ui/components`) hands the node to `PageTabsRenderer`, an '
    + '`any`-typed renderer that reads `items` and renders the `children` of each ITEM, never the node\'s own',
  'one tab per `items` entry, whose content is that item\'s own `children` (`properties.items[].children`, '
    + 'which stays live)',
);

/**
 * `page:tabs` — `ComponentPropsMap['page:tabs']`, plus the one handler key its
 * renderer reads off the node.
 *
 * `onTabChange` is not a prop the spec declares: it is the host callback
 * `@object-ui/app-shell` injects onto the node (`withPageTabsUrlSync`, which
 * writes `?tab=` back), and the `page:tabs` renderer CALLS it on every switch.
 * So it is a RUNTIME SLOT (objectui#6124): refused by name when authored,
 * because JSON has no function value, rather than left to `.passthrough()` to
 * keep an authored value and hand it to a call site.
 *
 * The node's own `children` and `body` are refused (objectui#9256): the
 * renderer draws each tab from the `children` of that ITEM of `items`, never
 * from the node's child list. The item-level `children` is the spec row's
 * member and stays live.
 */
export const PageTabsBlockSchema = BaseSchema.extend({
  type: z.literal('page:tabs'),
  properties: propsBag('page:tabs', stripImportedDefaults(SpecPageTabsProps)),
  onTabChange: handlerKeyRefusal('onTabChange', 'runtime-slot', 'Tab switch callback'),
  // objectui#9256: the NODE's content channels only — each item's `children` stays live.
  body: retirementTombstone(PAGE_TABS_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_TABS_NEITHER_CHANNEL),
});

/** `page:card` — `ComponentPropsMap['page:card']`. */
export const PageCardBlockSchema = BaseSchema.extend({
  type: z.literal('page:card'),
  properties: propsBag('page:card', stripImportedDefaults(SpecPageCardProps)),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `page:accordion`. */
const PAGE_ACCORDION_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'page:accordion',
  'its registration (`page:accordion`, `@object-ui/components`) hands the node to `PageAccordionRenderer`, an '
    + '`any`-typed renderer that reads `items` and renders the `children` of each ITEM, never the node\'s own',
  'one collapsible panel per `items` entry, whose content is that item\'s own `children` '
    + '(`properties.items[].children`, which stays live)',
);

/**
 * `page:accordion` — `ComponentPropsMap['page:accordion']`. The node's own
 * `children` and `body` are refused (objectui#9256); each item's `children`
 * is the spec row's member and stays live, as on `page:tabs`.
 */
export const PageAccordionBlockSchema = BaseSchema.extend({
  type: z.literal('page:accordion'),
  properties: propsBag('page:accordion', stripImportedDefaults(SpecPageAccordionProps)),
  // objectui#9256: the NODE's content channels only — each item's `children` stays live.
  body: retirementTombstone(PAGE_ACCORDION_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_ACCORDION_NEITHER_CHANNEL),
});

/**
 * `page:section` — `ComponentPropsMap['page:section']`, the spec's shared
 * thin-container row (`PageContainerProps`), as for `page:footer` and
 * `page:sidebar`.
 */
export const PageSectionBlockSchema = BaseSchema.extend({
  type: z.literal('page:section'),
  properties: propsBag('page:section', stripImportedDefaults(SpecPageContainerProps)),
});

/** `page:footer` — `ComponentPropsMap['page:footer']` (`PageContainerProps`). */
export const PageFooterBlockSchema = BaseSchema.extend({
  type: z.literal('page:footer'),
  properties: propsBag('page:footer', stripImportedDefaults(SpecPageContainerProps)),
});

/** `page:sidebar` — `ComponentPropsMap['page:sidebar']` (`PageContainerProps`). */
export const PageSidebarBlockSchema = BaseSchema.extend({
  type: z.literal('page:sidebar'),
  properties: propsBag('page:sidebar', stripImportedDefaults(SpecPageContainerProps)),
});

/* ── record: — record-context blocks ────────────────────────────────────── */

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:details`. */
const RECORD_DETAILS_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:details',
  'its registration (`record:details`, `@object-ui/plugin-detail`) hands the node to `RecordDetailsRenderer`, '
    + 'which reads the record-layout keys (`sections`, `fields`, `columns`, `hideFields`, `inlineEdit`, `showHeader`)',
  'the current record\'s fields, laid out by `sections`, `fields` and `columns`',
);

/** `record:details` — `ComponentPropsMap['record:details']`. */
export const RecordDetailsBlockSchema = BaseSchema.extend({
  type: z.literal('record:details'),
  properties: propsBag('record:details', stripImportedDefaults(SpecRecordDetailsProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_DETAILS_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_DETAILS_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:highlights`. */
const RECORD_HIGHLIGHTS_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:highlights',
  'its registration (`record:highlights`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordHighlightsRenderer`, which reads `fields`',
  'a strip of the current record\'s key `fields`',
);

/** `record:highlights` — `ComponentPropsMap['record:highlights']`. */
export const RecordHighlightsBlockSchema = BaseSchema.extend({
  type: z.literal('record:highlights'),
  properties: propsBag('record:highlights', stripImportedDefaults(SpecRecordHighlightsProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_HIGHLIGHTS_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_HIGHLIGHTS_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:related_list`. */
const RECORD_RELATED_LIST_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:related_list',
  'its registration (`record:related_list`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordRelatedListRenderer`, which resolves its `dataSource` binding and reads the list keys '
    + '(`objectName`, `relationshipField`, `columns`, `filter`, `sort`, `limit`)',
  'the records of `objectName` that point back at the current record through `relationshipField`, in `columns`',
);

/** `record:related_list` — `ComponentPropsMap['record:related_list']`. */
export const RecordRelatedListBlockSchema = BaseSchema.extend({
  type: z.literal('record:related_list'),
  properties: propsBag('record:related_list', stripImportedDefaults(SpecRecordRelatedListProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_RELATED_LIST_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_RELATED_LIST_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:path`. */
const RECORD_PATH_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:path',
  'its registration (`record:path`, `@object-ui/plugin-detail`) hands the node to `RecordPathRenderer`, '
    + 'which reads `statusField` and `stages`',
  'a stage path over the current record\'s `statusField`, drawn from `stages`',
);

/** `record:path` — `ComponentPropsMap['record:path']`. */
export const RecordPathBlockSchema = BaseSchema.extend({
  type: z.literal('record:path'),
  properties: propsBag('record:path', stripImportedDefaults(SpecRecordPathProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_PATH_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_PATH_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:activity`. */
const RECORD_ACTIVITY_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:activity',
  'its registration (`record:activity`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordActivityRenderer`, which reads the feed keys by name (`types`, `filterMode`, '
    + '`limit`, `showCompleted`, `unifiedTimeline` and the comment and reaction switches)',
  'the current record\'s activity feed, filtered by `types` and `filterMode` and paged by `limit`',
);

/** `record:activity` — `ComponentPropsMap['record:activity']`. */
export const RecordActivityBlockSchema = BaseSchema.extend({
  type: z.literal('record:activity'),
  properties: propsBag('record:activity', stripImportedDefaults(SpecRecordActivityProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_ACTIVITY_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_ACTIVITY_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:discussion`. */
const RECORD_DISCUSSION_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:discussion',
  'its registration (`record:discussion`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordChatterRenderer` (shared with `record:chatter`), which copies the node into its panel config; the '
    + 'config is read for `position`, `width`, `collapsible`, `defaultCollapsed` and `feed` only',
  'the current record\'s discussion feed, placed by `position` and configured by `feed`',
);

/**
 * `record:discussion` — `ComponentPropsMap['record:discussion']`, which the
 * spec binds to the SAME row object as `record:chatter` (one renderer, one
 * accept face). `record:chatter` is not a public block and is not armed here.
 */
export const RecordDiscussionBlockSchema = BaseSchema.extend({
  type: z.literal('record:discussion'),
  properties: propsBag('record:discussion', stripImportedDefaults(SpecRecordChatterProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_DISCUSSION_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_DISCUSSION_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:history`. */
const RECORD_HISTORY_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:history',
  'its registration (`record:history`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordHistoryRenderer`, which reads `limit`, `emptyText` and `unknownUserText`',
  'the current record\'s field-change history, with `emptyText` when it has none',
);

/** `record:history` — `ComponentPropsMap['record:history']`. */
export const RecordHistoryBlockSchema = BaseSchema.extend({
  type: z.literal('record:history'),
  properties: propsBag('record:history', stripImportedDefaults(SpecRecordHistoryProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_HISTORY_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_HISTORY_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:quick_actions`. */
const RECORD_QUICK_ACTIONS_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:quick_actions',
  'its registration (`record:quick_actions`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordQuickActionsRenderer`, which reads the toolbar keys (`actionNames`, `location`, `align`, '
    + '`inline`, `variant`, `size`)',
  'a toolbar of the current record\'s actions, chosen by `actionNames` or by `location`',
);

/** `record:quick_actions` — `ComponentPropsMap['record:quick_actions']`. */
export const RecordQuickActionsBlockSchema = BaseSchema.extend({
  type: z.literal('record:quick_actions'),
  properties: propsBag('record:quick_actions', stripImportedDefaults(SpecRecordQuickActionsProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_QUICK_ACTIONS_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_QUICK_ACTIONS_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `record:reference_rail`. */
const RECORD_REFERENCE_RAIL_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'record:reference_rail',
  'its registration (`record:reference_rail`, `@object-ui/plugin-detail`) hands the node to '
    + '`RecordReferenceRailRenderer`, which reads `entries` and `hideEmpty`',
  'a rail of related-record lists, one per `entries` item',
);

/** `record:reference_rail` — `ComponentPropsMap['record:reference_rail']`. */
export const RecordReferenceRailBlockSchema = BaseSchema.extend({
  type: z.literal('record:reference_rail'),
  properties: propsBag('record:reference_rail', stripImportedDefaults(SpecRecordReferenceRailProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_REFERENCE_RAIL_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_REFERENCE_RAIL_NEITHER_CHANNEL),
});

/**
 * objectui#9256 (public-block slice): the `children` refusal of `record:alert` — its OWN string, because
 * `neitherContentChannelGuidance` says no read consumes `body` or `children`, and this renderer does read
 * a key named `body`: its message TEXT. That key is not a child list, so it gets no tombstone; a `body`
 * written flat on the node gets the alias refusal on the arm below instead (objectui#10872).
 */
const RECORD_ALERT_NO_CHILD_LIST =
  'REFUSED (objectui#9256, ADR-0049) — `record:alert` renders no child list: measured with the TypeScript '
  + 'type checker over one program per workspace package on a BUILT tree, its registration (`record:alert`, '
  + '`@object-ui/plugin-detail`) hands the node to `RecordAlertRenderer`, which merges the node\'s own keys '
  + 'with `properties` (`readProps`) and reads `severity`, `title`, `body`, `icon`, `action`, `dismissible`, '
  + '`dismissKey` and `visible` from the result — never `children` — and `SchemaRenderer` strips `children` '
  + 'out of the props bag it spreads. An authored child list therefore rendered NOTHING — no render-time '
  + 'error or warning and no element; only the parser tier\'s `not-a-container` warning (objectui#9910) '
  + 'noticed it. What it renders instead: one callout of `severity`, with its `title` and its `body` message '
  + 'TEXT, both set in `properties`.';

/**
 * `record:alert` — `ComponentPropsMap['record:alert']`.
 *
 * Declares `children` (objectui#9256) and `body` (objectui#10872), and neither
 * is a content channel on this block.
 *
 * `body` is this block's message TEXT, a member of the spec row, so its home is
 * `properties.body`. A `body` written flat on the node is a sibling SPELLING of
 * that member, which is the case `aliasKeyRefusal` exists for: the arm restates
 * `body` with a refusal that names `properties.body`. Without it the node
 * inherits `BaseSchema`'s objectui#6771 refusal, whose remedy is `children`, the
 * key this same arm refuses because the block renders no child list. An author
 * who followed that message moved the text to a key nothing renders.
 *
 * ⛔ Not a `retirementTombstone` and not the neither-channel guidance: both say
 * the key is dead, and this block's `body` is live in the bag (the objectui#9256
 * ruling: `record:alert` gets its `children` narrowed, never a `body`
 * tombstone). ⛔ Not an accept either. A flat `body` does render, because the
 * renderer merges the node's own keys under `properties` (`readProps`), but
 * admitting it is the flat-props channel that objectui#10872 holds for every
 * block armed here. So the accept set stays where `BaseSchema` put it (a flat
 * `body` is refused with `invalid_type` at `body`, on both faces), and only the
 * prescription is this arm's own.
 */
export const RecordAlertBlockSchema = BaseSchema.extend({
  type: z.literal('record:alert'),
  properties: propsBag('record:alert', stripImportedDefaults(SpecRecordAlertProps)),
  // objectui#10872: the flat spelling of the row's `body`, refused by name with the key that holds the text.
  body: aliasKeyRefusal(
    'body',
    'properties.body',
    'this `record:alert` node',
    'A `record:alert` banner\'s message text is the `body` member of its `properties` bag, where '
    + '`@objectstack/spec`\'s `ComponentPropsMap[\'record:alert\']` row declares it: write '
    + '`{ "type": "record:alert", "properties": { "body": "…" } }` (objectui#10872). Not `children`: '
    + 'this block renders no child list and refuses that key (objectui#9256), so the node-level '
    + '`body` → `children` rename of objectui#6771 does not apply here.',
  ),
  // objectui#9256: the block renders no child list.
  children: retirementTombstone(RECORD_ALERT_NO_CHILD_LIST),
});

/* ── element: — content blocks ──────────────────────────────────────────── */

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `element:text`. */
const ELEMENT_TEXT_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:text',
  'its registration (`element:text`, `@object-ui/components`) hands the node to `ElementTextRenderer`, an '
    + '`any`-typed renderer that reads the props bag (`readProps`) and `className` and nothing else off the node',
  '`properties.content` as a heading, subheading or paragraph chosen by `variant`, aligned by `align`',
);

/** `element:text` — `ComponentPropsMap['element:text']`. */
export const ElementTextBlockSchema = BaseSchema.extend({
  type: z.literal('element:text'),
  properties: propsBag('element:text', stripImportedDefaults(SpecElementTextPropsSchema)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_TEXT_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_TEXT_NEITHER_CHANNEL),
});

/**
 * The `element:number` bag: `ComponentPropsMap['element:number']` with ONE
 * member, `object`, made optional — the half of the spec's `dataSource` waiver
 * that lives in the bag (`elementNumberObjectIsSupplied` below is the other).
 *
 * By reference, and here is how: zod 4's `.partial({ object: true })` clones
 * the row's own def — so its strictness (`catchall` never) and its unknown-key
 * guidance travel — and replaces exactly the masked member with a `ZodOptional`
 * wrapped around the row's OWN `object` schema.
 * Every other member (`field`, `aggregate`, `filter`, `format`, `prefix`,
 * `suffix`, `aria`) is handed through as the very object the row holds. No
 * member is restated, so a row the spec widens or narrows moves this bag the
 * same day. `.partial()` THROWS on an object that carries refinements, which is
 * the loud answer this module wants if the spec ever installs one on the row:
 * the waiver then has to be re-decided, not silently lose the check.
 *
 * Not exported: the zod-mirror parity census reads `export const` out of this
 * directory, and this is a derivation of the spec row, not a mirror of a
 * declaration in this package.
 */
const ElementNumberPropsBag = stripImportedDefaults(SpecElementNumberPropsSchema).partial({ object: true });

/**
 * Does this node's `dataSource` name the object `element:number` aggregates
 * over? The spec gate's `suppliedByDataSource` answer, read for this one node:
 * a `dataSource` that is a record whose `object` is a NON-EMPTY string. An
 * empty name, a non-string, a non-record, or no binding supplies nothing — the
 * gate's `strName` refuses the same three.
 */
function dataSourceSuppliesObject(node: { dataSource?: unknown }): boolean {
  const dataSource = node.dataSource;
  if (!dataSource || typeof dataSource !== 'object' || Array.isArray(dataSource)) return false;
  const object = (dataSource as { object?: unknown }).object;
  return typeof object === 'string' && object.length > 0;
}

/**
 * The node half of the waiver: a bag that omits `object` is refused at
 * `properties.object` UNLESS `dataSource.object` supplies it — which is the
 * spec row's requiredness, put back everywhere the spec gate does not waive it.
 * A node with no bag at all is not judged, exactly as the gate skips a node
 * whose `properties` is absent (and as every other arm here leaves its bag
 * optional). A bag whose `object` is PRESENT is left to the row's own member
 * verdict, so a wrong `object` is reported once, by the row.
 *
 * ⚠️ `when: () => true` is load-bearing: zod skips a refinement once an earlier
 * issue aborts the parse, and the gate reports a missing `object` BESIDE every
 * other bag issue. Without it, a bag with a bad `aggregate` and no `object`
 * would report only the `aggregate`. So the body reads the raw input
 * defensively — the bag may be anything when it runs.
 */
function elementNumberObjectIsSupplied(
  node: { properties?: unknown; dataSource?: unknown },
  ctx: z.core.$RefinementCtx,
): void {
  const bag = node.properties;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return;
  if ((bag as { object?: unknown }).object !== undefined) return;
  if (dataSourceSuppliesObject(node)) return;
  ctx.addIssue({
    code: 'custom',
    path: ['properties', 'object'],
    params: { code: 'ELEMENT_NUMBER_OBJECT_REQUIRED' },
    message:
      '`element:number` names no object to aggregate: set `properties.object`, or bind the node '
      + 'through `dataSource.object` (a non-empty object name). `ComponentPropsMap[\'element:number\']` '
      + 'requires `object`, and the spec waives it only beside `dataSource.object`.',
  });
}

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `element:number`. */
const ELEMENT_NUMBER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:number',
  'its registration (`element:number`, `@object-ui/components`) hands the node to `ElementNumberRenderer`, an '
    + '`any`-typed renderer that reads the props bag (`readProps`), the node\'s `dataSource` binding and `className`',
  'one aggregate — `aggregate` of `field` over `object` (or `dataSource.object`), formatted by `format` with '
    + '`prefix` and `suffix`',
);

/**
 * `element:number` — `ComponentPropsMap['element:number']`, with the spec's one
 * `dataSource` waiver on its required `object` (see the module docblock and the
 * two helpers above), and the node's `dataSource` declared as the spec's
 * `ElementDataSourceSchema`, by reference.
 */
export const ElementNumberBlockSchema = BaseSchema.extend({
  type: z.literal('element:number'),
  properties: ElementNumberPropsBag
    .optional()
    .describe(
      'The `element:number` props bag — `@objectstack/spec` `ComponentPropsMap[\'element:number\']`, by reference, '
      + 'with `object` optional only because the spec waives it beside `dataSource.object`; without that binding a '
      + 'bag must name `object`. Judged only when present, as the spec\'s props gate judges it.',
    ),
  dataSource: stripImportedDefaults(SpecElementDataSourceSchema)
    .optional()
    .describe(
      'Per-element data binding — `@objectstack/spec` `ElementDataSourceSchema`, the schema '
      + '`PageComponentSchema.dataSource` declares, by reference.',
    ),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_NUMBER_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_NUMBER_NEITHER_CHANNEL),
}).superRefine(elementNumberObjectIsSupplied, { when: () => true });

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `element:button`. */
const ELEMENT_BUTTON_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:button',
  'its registration (`element:button`, `@object-ui/components`) hands the node to `ElementButtonRenderer`, an '
    + '`any`-typed renderer that reads the props bag (`readProps`) and `className` and nothing else off the node',
  'a button labelled `properties.label` that runs `properties.action`',
);

/** `element:button` — `ComponentPropsMap['element:button']`. */
export const ElementButtonBlockSchema = BaseSchema.extend({
  type: z.literal('element:button'),
  properties: propsBag('element:button', stripImportedDefaults(SpecElementButtonPropsSchema)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_BUTTON_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_BUTTON_NEITHER_CHANNEL),
});

/** objectui#9256 (public-block slice): ONE refusal string for both content channels of `element:divider`. */
const ELEMENT_DIVIDER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:divider',
  'its registration (`element:divider`, `@object-ui/components`) hands the node to `ElementDividerRenderer`, an '
    + '`any`-typed renderer that reads `className` and nothing else',
  'a horizontal separator, styled by `className`',
);

/**
 * `element:divider` — the ONE row restated rather than read by reference.
 *
 * `ComponentPropsMap['element:divider']` is built inline by the spec
 * (`emptyProps('element:divider')`) and `@objectstack/spec/ui` exports it under
 * no name, so it cannot cross the objectui#8317 boundary the way the rows
 * above do — the boundary census admits only a spec binding passed straight
 * to `stripImportedDefaults`. The row declares no member and is strict, so
 * the restatement is a closed object with no member: it accepts exactly `{}`.
 * `../__tests__/public-block-arms-10872.test.ts` pins its key set and its
 * accept set to the row's, so a prop the spec later adds reddens there.
 */
export const ElementDividerBlockSchema = BaseSchema.extend({
  type: z.literal('element:divider'),
  properties: z
    .strictObject({})
    .optional()
    .describe(
      'The `element:divider` props bag — `@objectstack/spec` `ComponentPropsMap[\'element:divider\']` declares '
      + 'no prop, so the only bag it accepts is `{}`. The divider takes its styling from `className`.',
    ),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_DIVIDER_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_DIVIDER_NEITHER_CHANNEL),
});

/**
 * Union of the public-block arms — the category member `AnyComponentSchema`
 * lists (objectui#10872).
 */
export const PublicBlockComponentSchema = z.discriminatedUnion('type', [
  PageHeaderBlockSchema,
  PageTabsBlockSchema,
  PageCardBlockSchema,
  PageAccordionBlockSchema,
  PageSectionBlockSchema,
  PageFooterBlockSchema,
  PageSidebarBlockSchema,
  RecordDetailsBlockSchema,
  RecordHighlightsBlockSchema,
  RecordRelatedListBlockSchema,
  RecordPathBlockSchema,
  RecordActivityBlockSchema,
  RecordDiscussionBlockSchema,
  RecordHistoryBlockSchema,
  RecordQuickActionsBlockSchema,
  RecordReferenceRailBlockSchema,
  RecordAlertBlockSchema,
  ElementTextBlockSchema,
  ElementNumberBlockSchema,
  ElementButtonBlockSchema,
  ElementDividerBlockSchema,
]);
