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
 * structure blocks, the `record:` blocks that carry a row, `element:text`,
 * `element:number`, `element:button`, `element:divider`,
 * `element:definition-list` and `element:repeater`, and the four `action:`
 * controls (`action:button`, `action:icon`, `action:group`, `action:menu`).
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
 * (`element:divider`, below). Every arm also declares the node-level
 * envelope the spec's `PageComponentSchema` declares beside `properties` and a
 * producer writes — today `responsiveStyles` alone, spread from ONE fragment,
 * `NODE_ENVELOPE` (objectui#10872 batch 8; shared with three arms outside
 * this module since batch 9). The node-level members an
 * arm adds of its own are four kinds: an `on*` key a renderer reads off the
 * node, declared as
 * `check:handler-key-reads` requires of every such read — refused by name with
 * `handlerKeyRefusal` where it is a runtime slot (`page:tabs`'s `onTabChange`,
 * the `action:button` / `action:icon` `onClick`), or refused with an alias
 * refusal naming its bag member where the row declares it (the same two
 * blocks' `onSuccess`, below); `element:number`'s `dataSource`, the spec's own
 * binding schema by reference (below); the content-channel refusals (next
 * section) — the tombstones, and `record:alert`'s flat-`body` alias refusal;
 * and the host feed slots of `record:activity` (`items`) and `record:history`
 * (`entries`), each with the `loading` flag paired with it, refused by name as
 * the host's channel (objectui#11321, `hostFeedSlotGuidance` below).
 * Beneath all four, every arm whose row declares a member spreads the
 * flat-prop refusals (`flatPropRefusals`, objectui#10872 batch 10): each row
 * member written on the node instead of in the bag is refused by name. An
 * arm's own member of the same name, declared after the spread, wins.
 *
 * ## The content channels (objectui#9256)
 *
 * Every block here except the four `page:` containers (`page:card`,
 * `page:section`, `page:footer`, `page:sidebar`, which render the node's child
 * list) reads NEITHER content channel: no read of the node's `children` or
 * `body` reaches the renderer, and `SchemaRenderer` strips both out of the
 * props bag it spreads. So each of those arms declares `children` as a
 * by-name refusal, and restates `body` with the same guidance — `BaseSchema`
 * already refuses `body` (objectui#6771), but its message names `children` as
 * the remedy, which these blocks do not read either. Both stay MEMBERS
 * (`retirementTombstone`), so the refusal sits at the key's own path.
 *
 * The six arms objectui#10872 batch 4 added (the four `action:` controls,
 * `element:definition-list`, `element:repeater`) had no arm when
 * objectui#9256 measured, so objectui#10872 batch 5 took the same measurement
 * for them — the TypeScript type checker over the `@object-ui/components`
 * program, where all six register, on a built tree — and took it again at
 * runtime, through the real `SchemaRenderer` and registry. Both readings were
 * taken once, are recorded on objectui#10872, and nothing here re-derives
 * them. They carry the same two refusals, built by the same two helpers.
 * `@objectstack/spec`'s own `PageComponentSchema` refuses a node-level
 * `children` on each of the six as an unrecognized key, so these refusals
 * align this face with the spec rather than add a rule of objectui's own;
 * `../__tests__/held-block-content-channels-10872.test.ts` re-reads that
 * verdict from the installed spec.
 *
 * The four `page:` containers are the other half (objectui#10872 batch 6).
 * They DO render a child list, and each one's spec row declares it as its
 * `children` member (`PageCardProps`; `PageContainerProps` for the other
 * three), so the list's home is `properties.children` — the path the page
 * designer's canvas addresses (`childGroups` in `PageBlockCanvas`) and the key
 * `SchemaRenderer`'s `properties` hoist puts on the node the renderer reads.
 * `@objectstack/spec`'s own `PageComponentSchema` refuses a node-level
 * `children` on all four as an unrecognized key, so these arms refuse it too,
 * and restate `body`, with one string (`pageContainerChildListGuidance`) that
 * names `properties.children` rather than the neither-channel text: the same
 * two `retirementTombstone` members, a different message. That the bag
 * spelling renders the same page
 * was measured once, through the real `SchemaRenderer` and registry, and is
 * recorded on objectui#10872; nothing here re-derives it. The renderers keep
 * READING the node-level spellings for stored documents — this module judges
 * what is authored, not what is stored.
 * `../__tests__/container-children-channel-10872.test.ts` re-reads the spec's
 * verdict and the row's `children` member from the installed spec.
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
 * A member of the block's row written FLAT on the node
 * (`{ "type": "record:details", "columns": "2" }`) is refused by name on both
 * faces, at its own path, with a message naming its bag member
 * (`properties.columns`) — objectui#10872 batch 10, `flatPropRefusals` below.
 * The flat spelling is not a second authoring channel: triage's answer A on
 * objectui#10872 made the bag the contract, because `@objectstack/spec`'s
 * strict `PageComponentSchema` refuses a block's prop on the node as
 * mis-layered (ADR-0089 D3a), and a face that kept it would accept what
 * `os validate` refuses. That holds for the members `BaseSchema` also declares
 * (`visible`, `disabled`, `name`, `description`, `data`), whose base type used
 * to judge them, and for `children`, which the content-channel refusals above
 * already restated. Two kinds of row member are left alone: one the spec's page
 * component itself declares at node level (`label`, `aria`), which keeps its
 * node-level meaning; and one the row retires, which keeps the row's own
 * retirement when written flat. A key that is in neither the row nor the base
 * is left as every arm leaves an undeclared key: unjudged by the tolerant face,
 * refused by the strict one. Nothing at render time moves: `SchemaRenderer`
 * still reads both spellings, so stored documents and nodes composed in code
 * keep rendering; this face judges what is authored.
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
 *
 * The six held until `@objectstack/spec` 17.5.0 — `action:button`,
 * `action:group`, `action:menu`, `action:icon`, `element:definition-list` and
 * `element:repeater` — are armed below (objectui#10872 batch 4), from the rows
 * objectstack-ai/objectstack#20371 measured at the renderers' read points.
 * Those rows follow the READS, not the registrations: a key a registration
 * publishes and no renderer reads is refused by the row, and so by the arm.
 * Where a registration's `inputs` and its row disagree, the difference is
 * booked and re-derived by `apps/console/src/__tests__/registry-inputs-spec-parity.test.ts`,
 * not restated here.
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
  ElementDefinitionListPropsSchema as SpecElementDefinitionListPropsSchema,
  ElementRepeaterPropsSchema as SpecElementRepeaterPropsSchema,
  ActionButtonPropsSchema as SpecActionButtonPropsSchema,
  ActionIconPropsSchema as SpecActionIconPropsSchema,
  ActionGroupPropsSchema as SpecActionGroupPropsSchema,
  ActionMenuPropsSchema as SpecActionMenuPropsSchema,
  // objectui#10872 batch 8 — the node-level per-breakpoint style maps
  // (`PageComponentSchema.responsiveStyles`), declared once below
  // (`NODE_ENVELOPE`) and spread into every public-block arm (and, since
  // batch 9, into `flex`, `object-grid` and `object-chart`).
  ResponsiveStylesSchema as SpecResponsiveStylesSchema,
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
 *
 * The ONE copy: `./objectql.zod.ts`'s public-block arms import it rather than
 * restate it (objectui#10872). Internal to this package's zod modules — deliberately NOT
 * re-exported from `index.zod.ts`, like the helpers in `./tombstone.zod.ts`.
 *
 * `description` replaces the provenance text for a bag that is NOT a spec row:
 * `object-chart` and `flex` (objectui#11276) have no `ComponentPropsMap` row,
 * so each bag is its flat mirror's own members, and its description says that
 * rather than naming a row that does not exist. Every other caller omits it,
 * and its description is unchanged.
 */
export function propsBag<T extends z.ZodType>(type: string, row: T, description?: string) {
  return row
    .optional()
    .describe(
      description
        ?? `The \`${type}\` props bag — \`@objectstack/spec\` \`ComponentPropsMap['${type}']\`, by reference. `
          + 'Judged only when present, as the spec\'s props gate judges it.',
    );
}

/**
 * The node-level ENVELOPE every public-block arm declares beside `properties`
 * (objectui#10872 batch 8) — spread into each arm below and into
 * `./objectql.zod.ts`'s public-block arms, so the one declaration is shared and
 * no arm restates it.
 *
 * objectui#10872 batch 9 spread the same fragment into three arms OUTSIDE the
 * public-block set: `flex` (`./layout.zod.ts`), `object-grid` and
 * `object-chart` (`./objectql.zod.ts`). Those are the arms whose nodes the
 * objectstack showcase and UI skill write with `responsiveStyles`; that reading
 * is recorded on objectui#10872 too, and nothing here re-derives it. So the
 * fragment is no longer the public blocks' alone, and batch 9 renamed it from
 * `PUBLIC_BLOCK_ENVELOPE`: the old name would have told a reader of
 * `FlexSchema` that `flex` is a public block. It stays in this module because
 * nothing here imports `./layout.zod.ts` or `./objectql.zod.ts`, so neither
 * import makes a cycle. Every other arm, and `BaseSchema`, leaves the key
 * undeclared, because that reading found no producer on them.
 * `../__tests__/flat-arm-responsive-styles-10872.test.ts` pins which arms
 * carry the fragment, read off the live union.
 *
 * `@objectstack/spec`'s `PageComponentSchema` declares six node-level keys
 * beside `properties`: `events`, `responsiveStyles`, `dataSource`, `aria`,
 * `visibility` and the retired `responsive`. One has a measured producer, and
 * is the one declared here: `responsiveStyles`, the per-breakpoint CSS maps
 * that `SchemaRenderer` compiles to CSS scoped to the node (ADR-0065) on every
 * node it renders. The objectstack showcase writes it on public-block nodes and
 * objectstack's UI skill teaches it; that reading is recorded on objectui#10872
 * and nothing here re-derives it. It is the spec's `ResponsiveStylesSchema`, BY
 * REFERENCE through the objectui#8317 boundary, so its breakpoints
 * (`large`, `medium`, `small`, `xsmall`), its strictness and its own
 * unknown-breakpoint guidance all arrive from the spec. Before this, the strict
 * authoring face refused a spec-valid node by name, and the tolerant face kept
 * any value unjudged — a breakpoint the spec does not have parsed clean and
 * styled nothing.
 *
 * ⛔ The other five stay undeclared (no producer; release condition "additive,
 * when a producer needs them", objectui#10872). `dataSource` is declared per
 * arm where a renderer reads the binding (`element:number`, and the ObjectQL
 * blocks), not here. ⛔ Not on `BaseSchema`: that widens every arm of
 * `AnyComponentSchema`, a different accept-set change from the arms above,
 * each of which has a measured producer.
 *
 * Internal to this package's zod modules, like `propsBag` — deliberately NOT
 * re-exported from `index.zod.ts`.
 */
export const NODE_ENVELOPE = {
  responsiveStyles: stripImportedDefaults(SpecResponsiveStylesSchema)
    .optional()
    .describe(
      'Per-breakpoint scoped style maps (ADR-0065) — `@objectstack/spec` `ResponsiveStylesSchema`, the schema '
      + '`PageComponentSchema.responsiveStyles` declares, by reference. `SchemaRenderer` compiles it to CSS scoped '
      + 'to this node: `large` is the unconditional base, `medium` / `small` / `xsmall` are max-width overrides.',
    ),
};

/**
 * The node-level keys of `@objectstack/spec`'s `PageComponentSchema`: every key
 * a page component may carry BESIDE its `properties` bag (objectui#10872
 * batch 10).
 *
 * A row member with one of these names is NOT mis-layered when it is written on
 * the node. The spec's page component declares the key there itself, so its
 * node-level meaning is the spec's, not the row's (`label`, the display label;
 * `aria`, the node's ARIA attributes; `type`, the discriminator `page:tabs`'s
 * row also names). `flatPropRefusals` below leaves these keys alone, as
 * `./objectql.zod.ts`'s `object-gantt` arm leaves its row's `label`.
 *
 * ⚠️ Transcribed, not imported: the spec exports the page component as a lazy,
 * transformed strict object, and the objectui#8317 boundary admits a spec
 * binding only when it is passed straight to `stripImportedDefaults`.
 * `../__tests__/flat-props-refusal-10872.test.ts` re-derives the key set from the
 * installed spec's own shape and goes red the day the two part.
 */
const PAGE_COMPONENT_NODE_KEYS = [
  'type',
  'id',
  'label',
  'properties',
  'events',
  'style',
  'className',
  'responsiveStyles',
  'visibleWhen',
  'visibility',
  'dataSource',
  'responsive',
  'aria',
] as const;

/** One node-level key of the spec's page component — a TYPE position. */
type PageComponentNodeKey = (typeof PAGE_COMPONENT_NODE_KEYS)[number];

/**
 * The refusal detail a row member written flat on a `type` node gets
 * (objectui#10872 batch 10). `aliasKeyRefusal` puts the key and its bag member
 * in front of it: "Did you mean `title` → `properties.title`?".
 */
function flatPropGuidance(type: string, key: string): string {
  return 'A `' + type + '` node takes its props in its `properties` bag, where `@objectstack/spec`\'s '
    + '`ComponentPropsMap[\'' + type + '\']` row declares them: write `{ "type": "' + type + '", "properties": '
    + '{ "' + key + '": … } }` (objectui#10872). The spec\'s own page component refuses a prop written on the '
    + 'node as mis-layered (ADR-0089 D3a), so this face and `os validate` agree. In the bag the prop reaches the '
    + 'block on every read path: `SchemaRenderer` hoists each `properties` key onto the node before the '
    + 'renderer runs (`type` and `id` excepted), and the `element:*` renderers read the bag alone.';
}

/** Is this row member one of the spec's own retirements — a `z.never` member? */
function isRetiredRowMember(member: z.ZodType): boolean {
  const def = (member as unknown as { _zod: { def: { type: string; innerType?: unknown } } })._zod.def;
  const inner = def.type === 'optional'
    ? (def.innerType as { _zod: { def: { type: string } } })._zod.def
    : def;
  return inner.type === 'never';
}

/** The members `flatPropRefusals` returns for a row of shape `S` — a TYPE position. */
type FlatPropRefusals<S> = {
  [K in Exclude<keyof S & string, PageComponentNodeKey>]-?: z.ZodOptional<z.ZodNever>;
};

/**
 * One by-name refusal for every member of a public block's spec row written
 * FLAT on the node (objectui#10872 batch 10), keyed by the row's own key set:
 * read off the row, not transcribed, so a member the spec adds is refused flat
 * the day it lands.
 *
 * ## Why (triage's answer A on objectui#10872)
 *
 * The bag is the contract. `@objectstack/spec`'s strict `PageComponentSchema`
 * refuses a block's prop written on the node as mis-layered (ADR-0089 D3a), so
 * a face that kept the flat spelling would be a second dialect: `objectui
 * validate` accepting what `os validate` refuses. Before this, a flat key the
 * node base does not declare passed the tolerant face unjudged and was refused
 * by the strict face only as an unnamed `unrecognized_keys`, and a flat key the
 * base does declare (`visible`, `disabled`, `name`, `description`, `data`)
 * passed both faces against the base's own type. Now every one is refused on
 * both faces, at its own path, with a message naming `properties.KEY`.
 *
 * ## What it leaves alone
 *
 *   - A key the spec's page component declares at node level
 *     (`PAGE_COMPONENT_NODE_KEYS` above): it keeps its node-level meaning.
 *   - A key the row itself retires (a `z.never` member, such as `page:header`'s
 *     `icon`): written flat, it gets the row's OWN retirement, the same object
 *     by reference, so the author meets the spec's prescription rather than a
 *     pointer to a bag member that is refused too. `object-chart`'s retired
 *     spellings take the same route in `./objectql.zod.ts`.
 *   - Whatever the arm declares AFTER the spread: an arm's own refusal of a row
 *     key (`record:alert`'s `body`, the `action:` controls' `onSuccess`, the
 *     content-channel tombstones) overrides the generated one, because a later
 *     member of an object shape wins.
 *
 * Nothing at render time changes: `SchemaRenderer` still reads both spellings,
 * and a node composed in code (an action bar's menu, a dashboard's metric
 * tile, a form's master-detail node) never passes through this face.
 *
 * The ONE copy: every public-block arm here, `./objectql.zod.ts`'s
 * `object-metric`, `object-master-detail-form`, `object-timeline` and
 * `object-grid` (objectui#11276) arms, and `./layout.zod.ts`'s `flex` arm
 * (objectui#11276) spread it. Internal to this package's zod modules, like `propsBag`:
 * deliberately NOT re-exported from `index.zod.ts`.
 *
 * `guidance` replaces the refusal detail for a bag that is NOT a spec row, as
 * `propsBag`'s `description` does: `flex` (objectui#11276) has no
 * `ComponentPropsMap` row, so the default detail, which names the row, would
 * point the author at a declaration that does not exist. Every other caller
 * omits it, and its messages are unchanged.
 *
 * @param type     the registered `type`, spelled into every message
 * @param row      the spec row, already through the import boundary (or, with
 *                 `guidance`, the bag the arm declares in its place)
 * @param guidance the refusal detail for a bag with no spec row
 */
export function flatPropRefusals<S extends Record<string, z.ZodType>>(
  type: string,
  row: { readonly shape: S },
  guidance?: string,
): FlatPropRefusals<S> {
  return Object.fromEntries(
    Object.entries(row.shape)
      .filter(([key]) => !(PAGE_COMPONENT_NODE_KEYS as readonly string[]).includes(key))
      .map(([key, member]) => [
        key,
        isRetiredRowMember(member)
          ? member
          : aliasKeyRefusal(key, `properties.${key}`, `this \`${type}\` node`, guidance ?? flatPropGuidance(type, key)),
      ]),
  ) as FlatPropRefusals<S>;
}

/**
 * objectui#10872 batch 6: ONE refusal string for both node-level content
 * channels of a `page:` container — `page:card`, `page:section`, `page:footer`,
 * `page:sidebar`.
 *
 * These four DO render a child list, so the objectui#9256 neither-channel
 * guidance does not apply to them: their child list is live, and its home is
 * the `children` member of the spec row, `properties.children`. The node-level
 * spelling is what `@objectstack/spec`'s `PageComponentSchema` refuses as an
 * unrecognized key (ADR-0089 D3a), so the refusal names the bag member instead.
 * `body` is restated with the same string because `BaseSchema`'s objectui#6771
 * refusal names the node-level `children` as its remedy, which these arms now
 * refuse too.
 *
 * @param type the registered `type`, spelled into the message
 * @param row  the spec row's exported name, so the reader can find the member
 */
function pageContainerChildListGuidance(type: string, row: string): string {
  return 'REFUSED (objectui#10872) — a `' + type + '` node takes its child list in `properties.children`, the '
    + 'member `@objectstack/spec`\'s `ComponentPropsMap[\'' + type + '\']` row (`' + row + '`) declares: write '
    + '`{ "type": "' + type + '", "properties": { "children": [ … ] } }`. A child list written on the node itself '
    + '— `children`, or `body`, the spelling objectui#6771 retired — is refused, as `@objectstack/spec`\'s '
    + '`PageComponentSchema` refuses a node-level `children` on a page component (an unrecognized key, '
    + 'ADR-0089 D3a), so this face and `os validate` agree. Moving it changes nothing at render time: '
    + '`SchemaRenderer` hoists every `properties` key onto the node before the renderer runs (`type` and `id` '
    + 'excepted), so the container reads the same child list.';
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:header', stripImportedDefaults(SpecPageHeaderProps)),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:tabs', stripImportedDefaults(SpecPageTabsProps)),
  properties: propsBag('page:tabs', stripImportedDefaults(SpecPageTabsProps)),
  onTabChange: handlerKeyRefusal('onTabChange', 'runtime-slot', 'Tab switch callback'),
  // objectui#9256: the NODE's content channels only — each item's `children` stays live.
  body: retirementTombstone(PAGE_TABS_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_TABS_NEITHER_CHANNEL),
});

/** objectui#10872 batch 6: ONE refusal string for both node-level content channels of `page:card`. */
const PAGE_CARD_CHILD_LIST = pageContainerChildListGuidance('page:card', 'PageCardProps');

/**
 * `page:card` — `ComponentPropsMap['page:card']`. It renders a child list, and
 * its home is `properties.children`; the node-level `children` and `body` are
 * refused by name, pointed there (objectui#10872 batch 6).
 */
export const PageCardBlockSchema = BaseSchema.extend({
  type: z.literal('page:card'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:card', stripImportedDefaults(SpecPageCardProps)),
  properties: propsBag('page:card', stripImportedDefaults(SpecPageCardProps)),
  // objectui#10872 batch 6: the child list is the row's `children` member, in the bag.
  body: retirementTombstone(PAGE_CARD_CHILD_LIST),
  children: retirementTombstone(PAGE_CARD_CHILD_LIST),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:accordion', stripImportedDefaults(SpecPageAccordionProps)),
  properties: propsBag('page:accordion', stripImportedDefaults(SpecPageAccordionProps)),
  // objectui#9256: the NODE's content channels only — each item's `children` stays live.
  body: retirementTombstone(PAGE_ACCORDION_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_ACCORDION_NEITHER_CHANNEL),
});

/** objectui#10872 batch 6: ONE refusal string for both node-level content channels of `page:section`. */
const PAGE_SECTION_CHILD_LIST = pageContainerChildListGuidance('page:section', 'PageContainerProps');

/**
 * `page:section` — `ComponentPropsMap['page:section']`, the spec's shared
 * thin-container row (`PageContainerProps`), as for `page:footer` and
 * `page:sidebar`. The row's one member is the child list, `properties.children`;
 * the node-level `children` and `body` are refused by name, pointed there, on
 * all three (objectui#10872 batch 6).
 */
export const PageSectionBlockSchema = BaseSchema.extend({
  type: z.literal('page:section'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:section', stripImportedDefaults(SpecPageContainerProps)),
  properties: propsBag('page:section', stripImportedDefaults(SpecPageContainerProps)),
  // objectui#10872 batch 6: the child list is the row's `children` member, in the bag.
  body: retirementTombstone(PAGE_SECTION_CHILD_LIST),
  children: retirementTombstone(PAGE_SECTION_CHILD_LIST),
});

/** objectui#10872 batch 6: ONE refusal string for both node-level content channels of `page:footer`. */
const PAGE_FOOTER_CHILD_LIST = pageContainerChildListGuidance('page:footer', 'PageContainerProps');

/** `page:footer` — `ComponentPropsMap['page:footer']` (`PageContainerProps`). */
export const PageFooterBlockSchema = BaseSchema.extend({
  type: z.literal('page:footer'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:footer', stripImportedDefaults(SpecPageContainerProps)),
  properties: propsBag('page:footer', stripImportedDefaults(SpecPageContainerProps)),
  // objectui#10872 batch 6: the child list is the row's `children` member, in the bag.
  body: retirementTombstone(PAGE_FOOTER_CHILD_LIST),
  children: retirementTombstone(PAGE_FOOTER_CHILD_LIST),
});

/** objectui#10872 batch 6: ONE refusal string for both node-level content channels of `page:sidebar`. */
const PAGE_SIDEBAR_CHILD_LIST = pageContainerChildListGuidance('page:sidebar', 'PageContainerProps');

/** `page:sidebar` — `ComponentPropsMap['page:sidebar']` (`PageContainerProps`). */
export const PageSidebarBlockSchema = BaseSchema.extend({
  type: z.literal('page:sidebar'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('page:sidebar', stripImportedDefaults(SpecPageContainerProps)),
  properties: propsBag('page:sidebar', stripImportedDefaults(SpecPageContainerProps)),
  // objectui#10872 batch 6: the child list is the row's `children` member, in the bag.
  body: retirementTombstone(PAGE_SIDEBAR_CHILD_LIST),
  children: retirementTombstone(PAGE_SIDEBAR_CHILD_LIST),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:details', stripImportedDefaults(SpecRecordDetailsProps)),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:highlights', stripImportedDefaults(SpecRecordHighlightsProps)),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:related_list', stripImportedDefaults(SpecRecordRelatedListProps)),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:path', stripImportedDefaults(SpecRecordPathProps)),
  properties: propsBag('record:path', stripImportedDefaults(SpecRecordPathProps)),
  // objectui#9256: the renderer reads NEITHER content channel, so both are refused by name, each
  // kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(RECORD_PATH_NEITHER_CHANNEL),
  children: retirementTombstone(RECORD_PATH_NEITHER_CHANNEL),
});

/**
 * objectui#11321: the refusal detail for a HOST FEED SLOT written on a
 * `record:activity` or `record:history` node — `items` / `entries`, and the
 * `loading` flag paired with each.
 *
 * ## Why these keys are refused, and why by name
 *
 * Both renderers take a feed a host already owns: `record:activity` reads
 * `items` (`hostItems` in its renderer) and `record:history` reads `entries`
 * (`hostEntries`), each with a `loading` flag beside it, on the node or in
 * `properties`. A host supplies them in code, on a node it composes: a TSX
 * composition (the plugin-detail README hands `record:activity` its `items`
 * inside a `DetailView` tab), or the record page's synthesizer
 * (`buildDefaultPageSchema({ history })` writes `record:history`'s `entries`).
 * Such a node is rendered by `SchemaRenderer` and never passes through this
 * validator. None of the four keys is authorable metadata: a feed written into
 * a JSON document is a snapshot that never updates, and an authored `loading:
 * true` pins the loading state on forever, because the host flag wins over the
 * block's own fetch state.
 *
 * Before this, an author who copied `items` from that composition into a JSON
 * page met no reason at all. Written on the node it passed the tolerant face
 * (`safeValidateSchema`) unjudged, because `BaseSchema` keeps an undeclared
 * key, and the strict authoring face refused it only as an unnamed
 * `unrecognized_keys`. Each arm now declares the keys as by-name refusals, so
 * both faces refuse them at their own path with this text.
 *
 * ## The bag half belongs to the spec row
 *
 * In `properties` the keys meet the spec row, which this module takes by
 * reference and does not restate. `ComponentPropsMap['record:history']`
 * already names `entries` and `loading` as the host's channel in its own
 * unrecognized-key message, and both faces carry that text unchanged.
 * `ComponentPropsMap['record:activity']` does not name `items` or `loading`,
 * so that refusal stays the row's generic one until the spec adds the same
 * guidance its history row carries. Nothing here moves when it does: the arm
 * reads the row.
 *
 * ## Why `retirementTombstone`, and not `handlerKeyRefusal`
 *
 * `handlerKeyRefusal(KEY, 'runtime-slot', …)` is the runtime-slot refusal of
 * this package, and it was measured against these keys and does not fit. Its
 * text says the key is a host-supplied FUNCTION and that "JSON has no function
 * value", which is false of a feed array, and it prescribes authoring
 * behaviour as a node type, which is not this remedy. Its `z.custom` primitive
 * also makes `z.toJSONSchema` throw on the arm. `retirementTombstone` is the
 * same `z.never` refusal the content-channel tombstones on these arms use:
 * `invalid_type` at the key's own path, and ONE string feeding both the issue
 * message and the `.describe()` metadata.
 *
 * No TypeScript declaration in this package restates these nodes (the
 * `zod-mirror-parity.test.ts` ledger rows for both arms say so), so no
 * TypeScript twin needs a `?: never`. The renderers' own props interfaces keep
 * `items` / `entries` / `loading` typed, which is the channel a host uses.
 *
 * @param type   the registered `type`, spelled into the message
 * @param key    the refused key
 * @param what   what the key carries for the host, and why authoring it fails
 * @param omit   what the block does when the key is omitted
 */
function hostFeedSlotGuidance(type: string, key: string, what: string, omit: string): string {
  return '`' + key + '` is a HOST FEED SLOT on `' + type + '`, not authorable metadata (objectui#11321): '
    + what + ' A host supplies it in code, on the node it composes and renders through `SchemaRenderer` '
    + '(TSX composition), and that node never passes through this validator. Neither `@objectstack/spec`\'s '
    + 'page component (on the node) nor its `ComponentPropsMap[\'' + type + '\']` row (in `properties`) '
    + 'declares it. Omit it: ' + omit;
}

/** objectui#11321: the `record:activity` host feed slot, refused by name. */
const RECORD_ACTIVITY_HOST_ITEMS = hostFeedSlotGuidance(
  'record:activity',
  'items',
  'it is the feed a host that already owns one passes in, and the renderer presents it in place of its own '
    + 'sources. Written into a JSON document it is a snapshot that never updates.',
  'with no host `items` the block presents a mounted discussion context\'s feed, or fetches the record\'s '
    + 'own `sys_activity` rows.',
);

/** objectui#11321: the loading flag paired with `record:activity`'s `items`, refused by name. */
const RECORD_ACTIVITY_HOST_LOADING = hostFeedSlotGuidance(
  'record:activity',
  'loading',
  'it is the host\'s fetch state, paired with the `items` feed slot, and it wins over the block\'s own '
    + 'state, so an authored `true` pins the loading state on forever.',
  'with `items` omitted the block manages its own loading state.',
);

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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:activity', stripImportedDefaults(SpecRecordActivityProps)),
  properties: propsBag('record:activity', stripImportedDefaults(SpecRecordActivityProps)),
  // objectui#11321: the host feed slot and its loading flag, refused by name on the node
  // (see `hostFeedSlotGuidance`).
  items: retirementTombstone(RECORD_ACTIVITY_HOST_ITEMS),
  loading: retirementTombstone(RECORD_ACTIVITY_HOST_LOADING),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:discussion', stripImportedDefaults(SpecRecordChatterProps)),
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

/** objectui#11321: the `record:history` host feed slot, refused by name. */
const RECORD_HISTORY_HOST_ENTRIES = hostFeedSlotGuidance(
  'record:history',
  'entries',
  'it is the rows a host that already fetched them passes in, as the record page\'s synthesizer does '
    + '(`buildDefaultPageSchema({ history })`). Written into a JSON document it is a static audit trail '
    + 'that never updates.',
  'with no host `entries` the block fetches the record\'s own `sys_activity` history.',
);

/** objectui#11321: the loading flag paired with `record:history`'s `entries`, refused by name. */
const RECORD_HISTORY_HOST_LOADING = hostFeedSlotGuidance(
  'record:history',
  'loading',
  'it is the host\'s fetch state, paired with the `entries` feed slot, and it wins over the block\'s own '
    + 'state, so an authored `true` pins the loading state on forever.',
  'with `entries` omitted the block manages its own loading state.',
);

/** `record:history` — `ComponentPropsMap['record:history']`. */
export const RecordHistoryBlockSchema = BaseSchema.extend({
  type: z.literal('record:history'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:history', stripImportedDefaults(SpecRecordHistoryProps)),
  properties: propsBag('record:history', stripImportedDefaults(SpecRecordHistoryProps)),
  // objectui#11321: the host feed slot and its loading flag, refused by name on the node
  // (see `hostFeedSlotGuidance`).
  entries: retirementTombstone(RECORD_HISTORY_HOST_ENTRIES),
  loading: retirementTombstone(RECORD_HISTORY_HOST_LOADING),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:quick_actions', stripImportedDefaults(SpecRecordQuickActionsProps)),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:reference_rail', stripImportedDefaults(SpecRecordReferenceRailProps)),
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
 * admitting it would be the flat-props channel that triage's answer A on
 * objectui#10872 ruled out: every row member written flat is refused by name
 * (`flatPropRefusals`, batch 10). So a flat `body` is refused with
 * `invalid_type` at `body`, on both faces, and this member, declared after the
 * spread, keeps only its own prescription: the one that says why `children` is
 * no remedy here.
 */
export const RecordAlertBlockSchema = BaseSchema.extend({
  type: z.literal('record:alert'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('record:alert', stripImportedDefaults(SpecRecordAlertProps)),
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
  '`properties.content` as the heading level (`h1`-`h6`) or the paragraph style (`body`, `caption`, '
    + '`overline`) chosen by `variant`, aligned by `align`',
);

/** `element:text` — `ComponentPropsMap['element:text']`. */
export const ElementTextBlockSchema = BaseSchema.extend({
  type: z.literal('element:text'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('element:text', stripImportedDefaults(SpecElementTextPropsSchema)),
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
 * Does this node's `dataSource` name the object it binds? The spec gate's
 * `suppliedByDataSource` answer, read for one node: a `dataSource` that is a
 * record whose `object` is a NON-EMPTY string. An empty name, a non-string, a
 * non-record, or no binding supplies nothing — the gate's `strName` refuses the
 * same three, and so does the runtime's `isElementDataSourceConfig`
 * (`@object-ui/core`), which is what decides whether `ElementDataSourceGate`
 * lands a binding on the node at all.
 *
 * The ONE copy of that predicate (objectui#11117): `element:number`'s waiver
 * below reads it, and so does `./objectql.zod.ts`'s `requireRecordSource`,
 * which counts the binding as a record source on every gate-wrapped arm that
 * has one. Internal to this package's zod modules, like `propsBag` —
 * deliberately NOT re-exported from `index.zod.ts`. It reads the raw input
 * defensively, because both callers run it from a refinement installed with
 * `when: () => true`, where the node may be anything.
 */
export function dataSourceSuppliesObject(node: unknown): boolean {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  const dataSource = (node as { dataSource?: unknown }).dataSource;
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('element:number', ElementNumberPropsBag),
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
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('element:button', stripImportedDefaults(SpecElementButtonPropsSchema)),
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
  ...NODE_ENVELOPE,
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

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `element:definition-list`. */
const ELEMENT_DEFINITION_LIST_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:definition-list',
  'its registration (`element:definition-list`, `@object-ui/components`) hands the node to '
    + '`DefinitionListRenderer`, an `any`-typed renderer that reads the props bag (`readProps`) and `className` '
    + 'and nothing else off the node',
  'one term / description pair per `properties.items` entry (`{ term, description }`), in one or two '
    + '`columns`',
);

/**
 * `element:definition-list` — `ComponentPropsMap['element:definition-list']`
 * (objectui#10872 batch 4).
 *
 * Its renderer reads the props bag only (`readProps`), so the row is the whole
 * of what an author configures. The row was measured at those reads: `columns`
 * is the NUMBER the renderer compares against, so a string `'2'` is refused
 * with the row's own prescription, and each item is a strict `{ term,
 * description }`, so the `label` / `value` items the designer once wrote
 * (objectui#8279) are refused by name rather than rendered blank.
 *
 * Its content is `properties.items`; the node's own `children` and `body` are
 * refused (objectui#10872 batch 5, the objectui#9256 method).
 */
export const ElementDefinitionListBlockSchema = BaseSchema.extend({
  type: z.literal('element:definition-list'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('element:definition-list', stripImportedDefaults(SpecElementDefinitionListPropsSchema)),
  properties: propsBag('element:definition-list', stripImportedDefaults(SpecElementDefinitionListPropsSchema)),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_DEFINITION_LIST_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_DEFINITION_LIST_NEITHER_CHANNEL),
});

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `element:repeater`. */
const ELEMENT_REPEATER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'element:repeater',
  'its registration (`element:repeater`, `@object-ui/components`) hands the node to `RepeaterRenderer`, an '
    + '`any`-typed renderer that reads the props bag (`readProps`) and `className` and nothing else off the node',
  'one line per record of `properties.object` that its query returns, printing that record\'s '
    + '`titleField` and `fields` values. It has NO content channel: no per-row template and no child slot',
);

/**
 * `element:repeater` — `ComponentPropsMap['element:repeater']` (objectui#10872
 * batch 4).
 *
 * Its renderer reads the props bag only (`readProps`), and never the node's
 * `dataSource` binding, so the row's query keys are the only way to aim it. The
 * row requires `object`, as `element:number`'s does, but with NO waiver: a
 * repeater with no `object` never queries, so a bag without one is refused at
 * `properties.object`. A `fields` entry is a bare name or a strict `{ field }`;
 * a `label` there is refused by name, because the list has no header row to
 * print it in.
 *
 * It has no content channel at all — each row prints fields of the queried
 * record, and nothing an author writes is placed inside a row — so the node's
 * own `children` and `body` are refused, and the message names no channel to
 * move them to (objectui#10872 batch 5, the objectui#9256 method).
 */
export const ElementRepeaterBlockSchema = BaseSchema.extend({
  type: z.literal('element:repeater'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('element:repeater', stripImportedDefaults(SpecElementRepeaterPropsSchema)),
  properties: propsBag('element:repeater', stripImportedDefaults(SpecElementRepeaterPropsSchema)),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ELEMENT_REPEATER_NEITHER_CHANNEL),
  children: retirementTombstone(ELEMENT_REPEATER_NEITHER_CHANNEL),
});

/* ── action: — action controls ──────────────────────────────────────────── */

/**
 * The refusal of a flat `onSuccess` on `action:button`, and its reason. ONE
 * string per block, as the tombstones above keep theirs.
 */
const ACTION_BUTTON_FLAT_ON_SUCCESS =
  'An `action:button`\'s post-success block (`{ navigate, openIn }`) is the `onSuccess` member of its '
  + '`properties` bag, where `@objectstack/spec`\'s `ComponentPropsMap[\'action:button\']` row declares it: write '
  + '`{ "type": "action:button", "properties": { "onSuccess": { "navigate": "…" } } }` (objectui#10872). '
  + 'The spec\'s own page component refuses the key on the node as mis-layered.';

/** The same refusal, for `action:icon`. */
const ACTION_ICON_FLAT_ON_SUCCESS =
  'An `action:icon`\'s post-success block (`{ navigate, openIn }`) is the `onSuccess` member of its '
  + '`properties` bag, where `@objectstack/spec`\'s `ComponentPropsMap[\'action:icon\']` row declares it: write '
  + '`{ "type": "action:icon", "properties": { "onSuccess": { "navigate": "…" } } }` (objectui#10872). '
  + 'The spec\'s own page component refuses the key on the node as mis-layered.';

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `action:button`. */
const ACTION_BUTTON_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'action:button',
  'its registration (`action:button`, `@object-ui/components`) hands the node to `ActionButtonRenderer`, which '
    + 'reads the action keys `SchemaRenderer` hoists onto the node from the `properties` bag (`label`, `icon`, '
    + '`actionType`, `target`, …)',
  'one button labelled `properties.label`, with `properties.icon`, that runs the action '
    + '`properties.actionType` names. It has no child slot: its label and icon are its whole content',
);

/**
 * `action:button` — `ComponentPropsMap['action:button']` (objectui#10872 batch
 * 4), plus the two handler keys its renderer reads off the node, plus the
 * content-channel refusals (objectui#10872 batch 5, the objectui#9256 method):
 * the button's content is its `label` and `icon`, and the node's own
 * `children` and `body` are refused.
 *
 * The row is the spec's page-node declaration of the button, measured at the
 * renderer's reads (objectstack-ai/objectstack#20371) — ⛔ not the spec's
 * object-metadata `Action` declaration, which requires `name`. The renderer
 * reads `name ?? label`, so `name` is optional here, as it is read, and
 * AGENTS.md #4's taught node, which carries none, is not refused for lacking
 * one.
 *
 * The renderer reads `schema.X` — the node with its `properties` hoisted onto
 * it by `SchemaRenderer` — so it also reads two `on*` keys there, and
 * `check:handler-key-reads` requires each to be a declared member:
 *
 *   - `onClick` is a RUNTIME SLOT (objectui#6124): the renderer calls it only
 *     when it is a function, which reaches it from a code-composed schema (an
 *     `action:bar` member spread onto the node), never from JSON. Refused by
 *     name, as `ButtonSchema.onClick` is. The row does not declare it either.
 *   - `onSuccess` is DATA, the spec's post-success `{ navigate, openIn }` block,
 *     and the row declares it in the bag. On the node it is the flat spelling
 *     of that member — the case `aliasKeyRefusal` exists for, as `record:alert`'s
 *     flat `body` is — so it is refused with a message naming
 *     `properties.onSuccess`. The strict face and the spec's own
 *     `PageComponentSchema` refuse it there as well.
 */
export const ActionButtonBlockSchema = BaseSchema.extend({
  type: z.literal('action:button'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('action:button', stripImportedDefaults(SpecActionButtonPropsSchema)),
  properties: propsBag('action:button', stripImportedDefaults(SpecActionButtonPropsSchema)),
  onClick: handlerKeyRefusal('onClick', 'runtime-slot', 'Click handler'),
  onSuccess: aliasKeyRefusal('onSuccess', 'properties.onSuccess', 'this `action:button` node', ACTION_BUTTON_FLAT_ON_SUCCESS),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ACTION_BUTTON_NEITHER_CHANNEL),
  children: retirementTombstone(ACTION_BUTTON_NEITHER_CHANNEL),
});

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `action:icon`. */
const ACTION_ICON_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'action:icon',
  'its registration (`action:icon`, `@object-ui/components`) hands the node to `ActionIconRenderer`, which '
    + 'reads the action keys `SchemaRenderer` hoists onto the node from the `properties` bag (`icon`, `label`, '
    + '`actionType`, `target`, …)',
  'one icon button showing `properties.icon`, named and tooltipped by `properties.label`, that runs the '
    + 'action `properties.actionType` names. It has no child slot: its icon and label are its whole content',
);

/**
 * `action:icon` — `ComponentPropsMap['action:icon']` (objectui#10872 batch 4),
 * plus the same two handler keys as `action:button`, read the same way by its
 * renderer. Its own row, measured separately: it declares no `size`, and
 * forwards neither `undoable` nor `recordIdField`. Its content is its `icon`
 * and `label`; the node's own `children` and `body` are refused (objectui#10872
 * batch 5, the objectui#9256 method).
 */
export const ActionIconBlockSchema = BaseSchema.extend({
  type: z.literal('action:icon'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('action:icon', stripImportedDefaults(SpecActionIconPropsSchema)),
  properties: propsBag('action:icon', stripImportedDefaults(SpecActionIconPropsSchema)),
  onClick: handlerKeyRefusal('onClick', 'runtime-slot', 'Click handler'),
  onSuccess: aliasKeyRefusal('onSuccess', 'properties.onSuccess', 'this `action:icon` node', ACTION_ICON_FLAT_ON_SUCCESS),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ACTION_ICON_NEITHER_CHANNEL),
  children: retirementTombstone(ACTION_ICON_NEITHER_CHANNEL),
});

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `action:group`. */
const ACTION_GROUP_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'action:group',
  'its registration (`action:group`, `@object-ui/components`) hands the node to `ActionGroupRenderer`, which '
    + 'reads the group keys `SchemaRenderer` hoists onto the node from the `properties` bag and draws each '
    + 'member of `actions` itself',
  'the members of `properties.actions`, in order: a row of buttons, or with `display: "dropdown"` one '
    + 'trigger labelled `properties.label` whose menu lists them. A member goes in `properties.actions`',
);

/**
 * `action:group` — `ComponentPropsMap['action:group']` (objectui#10872 batch
 * 4). The row declares `actions` as a list of member objects, each one read
 * and forwarded by the renderer, and refuses a group-level `name` with its own
 * prescription: the renderer never reads it.
 *
 * Its content is `properties.actions`; the node's own `children` and `body`
 * are refused (objectui#10872 batch 5, the objectui#9256 method).
 */
export const ActionGroupBlockSchema = BaseSchema.extend({
  type: z.literal('action:group'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('action:group', stripImportedDefaults(SpecActionGroupPropsSchema)),
  properties: propsBag('action:group', stripImportedDefaults(SpecActionGroupPropsSchema)),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ACTION_GROUP_NEITHER_CHANNEL),
  children: retirementTombstone(ACTION_GROUP_NEITHER_CHANNEL),
});

/** objectui#10872 batch 5 (the objectui#9256 method): ONE refusal string for both content channels of `action:menu`. */
const ACTION_MENU_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'action:menu',
  'its registration (`action:menu`, `@object-ui/components`) hands the node to `ActionMenuRenderer`, which '
    + 'reads the menu keys `SchemaRenderer` hoists onto the node from the `properties` bag and draws each '
    + 'member of `actions` itself',
  'one trigger button (`properties.label`, `properties.icon`) whose dropdown lists the members of '
    + '`properties.actions`, in order. A menu item goes in `properties.actions`',
);

/**
 * `action:menu` — `ComponentPropsMap['action:menu']` (objectui#10872 batch 4).
 * Its `variant` and `size` reach the Button primitive unmapped, so the row
 * declares neither `primary` nor `md`.
 *
 * Its content is `properties.actions`; the node's own `children` and `body`
 * are refused (objectui#10872 batch 5, the objectui#9256 method).
 */
export const ActionMenuBlockSchema = BaseSchema.extend({
  type: z.literal('action:menu'),
  ...NODE_ENVELOPE,
  // objectui#10872 batch 10: a row member written flat on the node is refused by name, toward `properties.KEY`.
  ...flatPropRefusals('action:menu', stripImportedDefaults(SpecActionMenuPropsSchema)),
  properties: propsBag('action:menu', stripImportedDefaults(SpecActionMenuPropsSchema)),
  // objectui#10872 batch 5: the renderer reads NEITHER content channel, so both are refused by name,
  // each kept a MEMBER (see "The content channels" above).
  body: retirementTombstone(ACTION_MENU_NEITHER_CHANNEL),
  children: retirementTombstone(ACTION_MENU_NEITHER_CHANNEL),
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
  ElementDefinitionListBlockSchema,
  ElementRepeaterBlockSchema,
  ActionButtonBlockSchema,
  ActionIconBlockSchema,
  ActionGroupBlockSchema,
  ActionMenuBlockSchema,
]);
