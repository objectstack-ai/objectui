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
 * `element:button` and `element:divider`.
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
 * (`element:divider`, below). The only node-level member any arm adds is an
 * `on*` key a renderer reads off the node (`page:tabs`'s `onTabChange`),
 * refused by name with `handlerKeyRefusal` as `check:handler-key-reads`
 * requires of every such read.
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
 * judged by the base's own type, and a flat `body` is refused on both faces by
 * the base's objectui#6771 retirement. Whether the flat spelling is ALSO an authoring channel for
 * the `page:` / `record:` families (their renderers read the hoisted node
 * keys) is left open on objectui#10872 rather than decided by this module —
 * declaring it later is additive, and it must never extend to `element:*`,
 * whose renderers do not read a flat key at all.
 *
 * `properties` is optional on every arm, as it is on `PageComponentSchema`:
 * the spec's own props gate (`validateComponentProps`, `@objectstack/lint`)
 * judges a bag only when the node carries one, and so does this face.
 *
 * ## The public blocks NOT armed here, and why
 *
 * Held by objectui#10872 batch 1 with the evidence on that card — each is a
 * reading, not an oversight:
 *
 *   - `element:number` — its row requires `object`, which the spec's props gate
 *     waives when the node binds through `dataSource` (`DATASOURCE_SUPPLIED_PROP`
 *     in `@objectstack/lint`). The row alone would refuse that spec-valid node.
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
  ElementButtonPropsSchema as SpecElementButtonPropsSchema,
} from '@objectstack/spec/ui';
import { BaseSchema } from './base.zod.js';
import { stripImportedDefaults } from './imported-defaults.js';
import { handlerKeyRefusal } from './tombstone.zod.js';

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

/** `page:header` — `ComponentPropsMap['page:header']`. */
export const PageHeaderBlockSchema = BaseSchema.extend({
  type: z.literal('page:header'),
  properties: propsBag('page:header', stripImportedDefaults(SpecPageHeaderProps)),
});

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
 */
export const PageTabsBlockSchema = BaseSchema.extend({
  type: z.literal('page:tabs'),
  properties: propsBag('page:tabs', stripImportedDefaults(SpecPageTabsProps)),
  onTabChange: handlerKeyRefusal('onTabChange', 'runtime-slot', 'Tab switch callback'),
});

/** `page:card` — `ComponentPropsMap['page:card']`. */
export const PageCardBlockSchema = BaseSchema.extend({
  type: z.literal('page:card'),
  properties: propsBag('page:card', stripImportedDefaults(SpecPageCardProps)),
});

/** `page:accordion` — `ComponentPropsMap['page:accordion']`. */
export const PageAccordionBlockSchema = BaseSchema.extend({
  type: z.literal('page:accordion'),
  properties: propsBag('page:accordion', stripImportedDefaults(SpecPageAccordionProps)),
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

/** `record:details` — `ComponentPropsMap['record:details']`. */
export const RecordDetailsBlockSchema = BaseSchema.extend({
  type: z.literal('record:details'),
  properties: propsBag('record:details', stripImportedDefaults(SpecRecordDetailsProps)),
});

/** `record:highlights` — `ComponentPropsMap['record:highlights']`. */
export const RecordHighlightsBlockSchema = BaseSchema.extend({
  type: z.literal('record:highlights'),
  properties: propsBag('record:highlights', stripImportedDefaults(SpecRecordHighlightsProps)),
});

/** `record:related_list` — `ComponentPropsMap['record:related_list']`. */
export const RecordRelatedListBlockSchema = BaseSchema.extend({
  type: z.literal('record:related_list'),
  properties: propsBag('record:related_list', stripImportedDefaults(SpecRecordRelatedListProps)),
});

/** `record:path` — `ComponentPropsMap['record:path']`. */
export const RecordPathBlockSchema = BaseSchema.extend({
  type: z.literal('record:path'),
  properties: propsBag('record:path', stripImportedDefaults(SpecRecordPathProps)),
});

/** `record:activity` — `ComponentPropsMap['record:activity']`. */
export const RecordActivityBlockSchema = BaseSchema.extend({
  type: z.literal('record:activity'),
  properties: propsBag('record:activity', stripImportedDefaults(SpecRecordActivityProps)),
});

/**
 * `record:discussion` — `ComponentPropsMap['record:discussion']`, which the
 * spec binds to the SAME row object as `record:chatter` (one renderer, one
 * accept face). `record:chatter` is not a public block and is not armed here.
 */
export const RecordDiscussionBlockSchema = BaseSchema.extend({
  type: z.literal('record:discussion'),
  properties: propsBag('record:discussion', stripImportedDefaults(SpecRecordChatterProps)),
});

/** `record:history` — `ComponentPropsMap['record:history']`. */
export const RecordHistoryBlockSchema = BaseSchema.extend({
  type: z.literal('record:history'),
  properties: propsBag('record:history', stripImportedDefaults(SpecRecordHistoryProps)),
});

/** `record:quick_actions` — `ComponentPropsMap['record:quick_actions']`. */
export const RecordQuickActionsBlockSchema = BaseSchema.extend({
  type: z.literal('record:quick_actions'),
  properties: propsBag('record:quick_actions', stripImportedDefaults(SpecRecordQuickActionsProps)),
});

/** `record:reference_rail` — `ComponentPropsMap['record:reference_rail']`. */
export const RecordReferenceRailBlockSchema = BaseSchema.extend({
  type: z.literal('record:reference_rail'),
  properties: propsBag('record:reference_rail', stripImportedDefaults(SpecRecordReferenceRailProps)),
});

/** `record:alert` — `ComponentPropsMap['record:alert']`. */
export const RecordAlertBlockSchema = BaseSchema.extend({
  type: z.literal('record:alert'),
  properties: propsBag('record:alert', stripImportedDefaults(SpecRecordAlertProps)),
});

/* ── element: — content blocks ──────────────────────────────────────────── */

/** `element:text` — `ComponentPropsMap['element:text']`. */
export const ElementTextBlockSchema = BaseSchema.extend({
  type: z.literal('element:text'),
  properties: propsBag('element:text', stripImportedDefaults(SpecElementTextPropsSchema)),
});

/** `element:button` — `ComponentPropsMap['element:button']`. */
export const ElementButtonBlockSchema = BaseSchema.extend({
  type: z.literal('element:button'),
  properties: propsBag('element:button', stripImportedDefaults(SpecElementButtonPropsSchema)),
});

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
  ElementButtonBlockSchema,
  ElementDividerBlockSchema,
]);
