/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Layout Component Zod Validators
 * 
 * Zod validation schemas for layout and container components.
 * Following @objectstack/spec UI specification format.
 * 
 * @module zod/layout
 * @packageDocumentation
 */

import { z } from 'zod';
import { aliasKeyRefusal, handlerKeyRefusal, retirementTombstone } from './tombstone.zod.js';
import {
  PageSchema as SpecPageSchema,
  PageTypeSchema as SpecPageTypeSchema,
  PageVariableSchema as SpecPageVariableSchema,
} from '@objectstack/spec/ui';
import { BaseSchema, SchemaNodeSchema, specFieldsExcept } from './base.zod.js';
import { stripImportedDefaults } from './imported-defaults.js';

/**
 * ⭐ THE IMPORT BOUNDARY (objectui#8317, decision batch #90, 2026-09-08).
 *
 * **This mirror authors no default, imported subschemas included.** Batch #69
 * (objectui#7735) ruled that a validator validates and does not write values
 * into an author's document; batch #90 ruled that this holds for EVERY key
 * `safeValidateSchema` answers, not only the sites this repository wrote. So a
 * schema arriving from `@objectstack/spec` crosses into a mirror shape only
 * through `stripImportedDefaults`, which removes each reachable `ZodDefault`
 * with `.removeDefault()` and keeps the key omissible. Keys, types, checks and
 * the accept set are untouched, and a subtree carrying no default comes back
 * reference-equal — so this is a no-op the day the spec adopts the same
 * principle.
 *
 * ⛔ Spelled at every crossing rather than once per file, deliberately: a local
 * `const Spec… = stripImportedDefaults(…)` would put the spec's provenance one
 * hop away from every declaration that reads it, and `check:spec-symbols`
 * (rule 1) reads exactly one hop — a mirror export under a spec-owned name has
 * to show the spec binding in its OWN initializer. The verbosity is the
 * provenance.
 *
 * ⚠️ A read that is NOT a crossing stays unwrapped and is declared as such: a
 * value VOCABULARY (`./views.zod.ts`'s `SpecListViewTypeEnum` and
 * `./objectql.zod.ts`'s `ViewKindEnum`, which unwrap the spec's own
 * `.default('grid')` to reach its enum) and a TYPE position — neither puts a
 * default into a parsed document. `../__tests__/imported-defaults-8317.test.ts`
 * re-derives that exception list from the source rather than trusting this
 * paragraph, and fails if an entry stops matching a real read.
 */


/**
 * Div Schema - Basic HTML container
 */
export const DivSchema = BaseSchema.extend({
  type: z.literal('div'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
});

/**
 * Box Schema - Neutral block container (objectui#3965)
 *
 * The class-transparent replacement for the deprecated `div` on the JSON
 * authoring surface: renders `children`, authored `className` passes through
 * verbatim, zero injected classes. Mirrors {@link ../layout.ts BoxSchema};
 * the pairing is registered in `__tests__/zod-mirror-parity.test.ts`.
 */
export const BoxSchema = BaseSchema.extend({
  type: z.literal('box'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this box node',
    '`box` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/layout/box.tsx:56). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Span Schema - Inline text container
 */
export const TextSpanSchema = BaseSchema.extend({
  type: z.literal('span'),
  value: z.string().optional().describe('Text content'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this span node',
    '`span` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/basic/span.tsx:143). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Text Schema - Text display component
 */
export const TextSchema = BaseSchema.extend({
  type: z.literal('text'),
  content: z.string().optional()
    .describe('Text content — the one content spelling `text` reads (declared by objectui#6150; its `value` fallback spelling was retired by objectui#6951)'),
  // ADR-0049 RETIREMENT TOMBSTONE (objectui#6951 / objectui#7016, maintainer
  // ruling A1 of 2026-09-04). `value` was the second spelling of the one
  // content slot; the renderer now reads `content` alone, so a plain deletion
  // here would let an authored `value` ride `BaseSchema.passthrough()` into a
  // silent blank. The tombstone refuses it BY NAME instead — one string, both
  // channels (parse-time message and `.describe()`), see `./tombstone.zod.ts`.
  value: retirementTombstone(
    'RETIRED (objectui#6951) — `value` is no longer part of TextSchema; write `content`. It was a second '
    + 'spelling of the one content slot, read only as the fallback limb of `schema.content || schema.value`, '
    + 'and was retired under ADR-0049 enforce-or-remove with no deprecation window (maintainer ruling A1, '
    + '2026-09-04). The renderer reads `content` alone now, so an authored `value` would render nothing. '
    + 'Rename the key; the string is unchanged.',
  ),
  variant: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'overline'])
    .optional()
    .describe('Text variant/style'),
  align: z.enum(['left', 'center', 'right', 'justify']).optional().describe('Text alignment'),
});

/**
 * Image Schema - Image component
 */
export const ImageSchema = BaseSchema.extend({
  type: z.literal('image'),
  src: z.string().describe('Image source URL'),
  alt: z.string().optional().describe('Alt text for accessibility'),
  width: z.union([z.string(), z.number()]).optional().describe('Image width'),
  height: z.union([z.string(), z.number()]).optional().describe('Image height'),
  objectFit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).optional().describe('Object fit property'),
});

/**
 * Icon Schema - Icon component (Lucide icons)
 *
 * ## `icon`, not `name` — and why the rejection message carries a migration
 *
 * The glyph key on this node is `icon` (objectui#5631, maintainer rulings
 * 2026-08-22 option A and 2026-08-24 「5631 A′，按一次正经的契约迁移立项。」).
 * `name` reverts to the SDUI identity key it always was, inherited optional
 * from {@link BaseSchema}. The declaration in `../layout.ts` carries the full
 * reasoning; this mirror carries the enforcement.
 *
 * This mirror is the half that had to move for the ruling to be landable at
 * all. It previously declared `name: z.string()` REQUIRED, which measured as:
 *
 * ```text
 * REJECT  { type:'icon', icon:'check' }  -> invalid_type at [name]
 * ACCEPT  { type:'icon', name:'check' }
 * ```
 *
 * i.e. the published contract refused the ruled shape and required the broken
 * one — contract-first exactly backwards, and the reason the renderer could
 * not be migrated on its own.
 *
 * `icon` is REQUIRED here, exactly as `name` was: this is a key rename at
 * constant strictness, not a loosening. Keeping the same requiredness is also
 * what keeps the `__tests__/zod-mirror-parity.test.ts` ledger silent — an
 * optional mirror key against a required declaration is drift that guard
 * measures and would demand a `KnownDrift` entry for.
 *
 * ## The rejection message IS the conversion story's first half
 *
 * A stored node authored before this migration reaches here as
 * `{ type:'icon', name:'check' }` and is refused. Zod's default message for
 * that is `invalid_type at [icon]: expected string, received undefined`, which
 * is true and tells the author nothing about what happened to their metadata.
 * The custom `error` below replaces it, for the ABSENT case only, with the
 * rename and where to convert in bulk. Deliberate mechanics:
 *
 *  - it fires only when `icon` is `undefined`, so a genuine type error
 *    (`icon: 42`) still gets zod's own precise message — returning `undefined`
 *    from the callback falls back to the default;
 *  - it is a MESSAGE, not an accept. ⛔ There is no `icon ?? name` read here
 *    or in the renderer; the legacy shape is refused, loudly, by design. That
 *    tolerant shape was ruled out by name on 2026-08-22 and the ruling of
 *    2026-08-24 restates it;
 *  - it lives on the FIELD rather than in an object-level `.check()`, because
 *    zod 4 skips object-level checks once a field issue exists — an
 *    object-level diagnostic for a missing key would never run. Measured.
 */
export const IconSchema = BaseSchema.extend({
  type: z.literal('icon'),
  icon: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "ui:icon names its glyph with `icon` (e.g. `icon: 'check'`). If this node still "
            + 'names it with `name`, that key moved: `name` is the SDUI identity key on every '
            + 'node and is no longer read as a glyph name (objectui#5631). Rename `name` to '
            + '`icon`, or convert stored metadata in bulk with `migrateIconNodeKeys` from '
            + '`@object-ui/types`.'
          : undefined,
    })
    .describe('Lucide glyph name, kebab-case (objectui#5631: was `name`)'),
  size: z.number().optional().describe('Icon size in pixels'),
  color: z.string().optional().describe('Icon color'),
});

/**
 * Separator Schema - Divider component
 */
export const SeparatorSchema = BaseSchema.extend({
  type: z.literal('separator'),
  orientation: z.enum(['horizontal', 'vertical']).optional().describe('Separator orientation'),
  decorative: z.boolean().optional().describe('Whether decorative'),
});

/**
 * Container Schema - Generic container component
 */
export const ContainerSchema = BaseSchema.extend({
  type: z.literal('container'),
  maxWidth: z.union([
    z.enum(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'screen']),
    z.boolean(),
  ]).optional().describe('Max width constraint'),
  centered: z.boolean().optional().describe('Center the container'),
  padding: z.number().optional().describe('Padding value'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this container node',
    '`container` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/layout/container.tsx:101). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Flex Schema - Flexbox layout component
 */
export const FlexSchema = BaseSchema.extend({
  type: z.literal('flex'),
  direction: z.enum(['row', 'col', 'row-reverse', 'col-reverse'])
    .optional()
    .describe('Flex direction'),
  justify: z.enum(['start', 'end', 'center', 'between', 'around', 'evenly'])
    .optional()
    .describe('Justify content alignment'),
  align: z.enum(['start', 'end', 'center', 'baseline', 'stretch'])
    .optional()
    .describe('Align items'),
  gap: z.number().optional().describe('Gap between items (Tailwind scale 0-8)'),
  wrap: z.boolean().optional().describe('Allow items to wrap'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this flex node',
    '`flex` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/layout/flex.tsx:93). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Stack Schema - Vertical flex layout (shortcut)
 */
export const StackSchema = BaseSchema.extend({
  type: z.literal('stack'),
  direction: z.enum(['row', 'col', 'row-reverse', 'col-reverse']).optional(),
  justify: z.enum(['start', 'end', 'center', 'between', 'around', 'evenly']).optional(),
  align: z.enum(['start', 'end', 'center', 'baseline', 'stretch']).optional(),
  gap: z.number().optional(),
  wrap: z.boolean().optional(),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this stack node',
    '`stack` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/layout/stack.tsx:99). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Grid Schema - CSS Grid layout component
 */
export const GridSchema = BaseSchema.extend({
  type: z.literal('grid'),
  /**
   * Keyed by the BREAKPOINT VOCABULARY, not by `string` (objectui#8516).
   *
   * `z.partialRecord`, ⛔ never `z.record(z.enum([…]), …)`: measured on zod
   * 4.4.3, the plain `z.record` over an enum key REQUIRES every member, so
   * `{ md: 2 }` — which the declaration explicitly invites, and which
   * `grid-breakpoint-columns-7097.test.tsx` pins the renderer as reading —
   * stops parsing. That spelling trades this divergence for its opposite.
   *
   * The six names are the whole of `BreakpointName` (`../mobile.ts`). They are
   * spelled here rather than derived because `mobile.ts` has no zod mirror to
   * derive from; the equality is held by a type-level pin in
   * `__tests__/mirror-partial-record-narrowing-8516.test.ts`, so adding or
   * dropping a breakpoint on either face fails to compile.
   */
  columns: z.union([
    z.number(),
    z.partialRecord(z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']), z.number()),
  ]).optional().describe('Number of columns (responsive)'),
  gap: z.number().optional().describe('Gap between items (Tailwind scale 0-8)'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this grid node',
    '`grid` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/layout/grid.tsx:168). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Card Schema - Card component
 */
export const CardSchema = BaseSchema.extend({
  type: z.literal('card'),
  title: z.string().optional().describe('Card title'),
  description: z.string().optional().describe('Card description'),
  header: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Card header content'),
  body: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Card body content'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Child components'),
  footer: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Card footer content'),
  variant: z.enum(['default', 'outline', 'ghost']).optional().describe('Card variant style'),
  hoverable: z.boolean().optional().describe('Whether the card is hoverable'),
  clickable: z.boolean().optional().describe('Whether the card is clickable'),
  onClick: handlerKeyRefusal('onClick', 'runtime-slot', 'Click handler'),
});

/**
 * Tab Item Schema
 */
export const TabItemSchema = z.object({
  value: z.string().describe('Unique tab identifier'),
  label: z.string().describe('Tab label'),
  icon: z.string().optional().describe('Tab icon'),
  disabled: z.boolean().optional().describe('Whether tab is disabled'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Tab content'),
});

/**
 * Tabs Schema - Tabs component
 */
export const TabsSchema = BaseSchema.extend({
  type: z.literal('tabs'),
  defaultValue: z.string().optional().describe('Default active tab value'),
  value: z.string().optional().describe('Controlled active tab value'),
  orientation: z.enum(['horizontal', 'vertical']).optional().describe('Tabs orientation'),
  items: z.array(TabItemSchema).describe('Tab items configuration'),
  onValueChange: handlerKeyRefusal('onValueChange', 'runtime-slot', 'Change handler'),
});

/**
 * Scroll Area Schema
 */
export const ScrollAreaSchema = BaseSchema.extend({
  type: z.literal('scroll-area'),
  height: z.union([z.string(), z.number()]).optional().describe('Height of scroll container'),
  width: z.union([z.string(), z.number()]).optional().describe('Width of scroll container'),
  orientation: z.enum(['vertical', 'horizontal', 'both']).optional().describe('Scrollbar orientation'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional(),
  body: aliasKeyRefusal(
    'body',
    'children',
    'this scroll-area node',
    '`scroll-area` reads `children`, never `body` (READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/complex/scroll-area.tsx:34). '
    + '`body` is inherited from `BaseSchema`, so an authored `body` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Resizable Panel Schema
 */
export const ResizablePanelSchema = z.object({
  id: z.string().describe('Unique panel identifier'),
  defaultSize: z.number().optional().describe('Default size (percentage 0-100)'),
  minSize: z.number().optional().describe('Minimum size (percentage 0-100)'),
  maxSize: z.number().optional().describe('Maximum size (percentage 0-100)'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Panel content'),
});

/**
 * Resizable Schema - Resizable panels component
 */
export const ResizableSchema = BaseSchema.extend({
  type: z.literal('resizable'),
  direction: z.enum(['horizontal', 'vertical']).optional().describe('Direction of resizable panels'),
  minHeight: z.union([z.string(), z.number()]).optional().describe('Minimum height'),
  withHandle: z.boolean().optional().describe('Show resize handle'),
  panels: z.array(ResizablePanelSchema).describe('Resizable panels'),
});

/**
 * Aspect Ratio Schema
 */
export const AspectRatioSchema = BaseSchema.extend({
  type: z.literal('aspect-ratio'),
  ratio: z.number().optional().describe('Aspect ratio (width / height)'),
  image: z.string().optional().describe('Image URL to display'),
  alt: z.string().optional().describe('Image alt text'),
  body: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Child components (alternative to image)'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Child components'),
});

/**
 * Page Region Width Schema
 */
export const PageRegionWidthSchema = z.enum(['small', 'medium', 'large', 'full']);

/**
 * Page Region Schema — zod twin of `layout.ts`'s `PageNodeRegion`, renamed off
 * the spec's `PageRegionSchema` name (objectstack#4115) for the reason given
 * there: this validates a region of the objectui page NODE (renderer
 * components, plus a semantic `type` and `className`), the spec's validates a
 * region of the authored page (`PageComponent`s). See {@link PageNodeSchema},
 * whose `regions` note has pointed at this entry since objectui#3074.
 *
 * Tripwire: `__tests__/page-nav-misc-spec-parity.test.ts`.
 */
export const PageNodeRegionSchema = z.object({
  name: z.string().describe('Region name (e.g. "sidebar", "main", "header")'),
  type: z.enum(['header', 'sidebar', 'main', 'footer', 'aside']).optional().describe('Semantic region type'),
  width: z.union([PageRegionWidthSchema, z.string()]).optional().describe('Region width'),
  components: z.array(SchemaNodeSchema).describe('Components in this region'),
  className: z.string().optional().describe('CSS class overrides'),
});

/**
 * Page Variable Schema — `@objectstack/spec/ui` schema re-exported **by
 * reference** (objectstack#4115), for exactly the reason the sibling
 * {@link PageTypeSchema} below documents.
 *
 * The mirror this replaces had drifted twice over: it omitted `source` — the
 * whole ADR-0049 write-binding, so a spec-authored master/detail page
 * (`{ name: 'selectedProjectId', source: 'project_picker' }`) parsed into a
 * variable nothing could ever write — and its `type` enum was missing
 * `record_id`, so a spec-valid record-picker variable was rejected outright.
 */
export const PageVariableSchema = stripImportedDefaults(SpecPageVariableSchema);

/**
 * Page Type Schema — `@objectstack/spec/ui` schema re-exported **by reference**
 * (issue #2231; formerly a hand-written mirror).
 *
 * The mirror was missing `list`, so a spec-valid `list` page failed validation
 * here — and it shadowed the spec's export under the same symbol name, so an
 * importer could not tell the two apart. Note the sibling TS `PageType` in
 * `layout.ts` had drifted the OPPOSITE way (it carried five visualization names
 * the spec explicitly repudiates); both now come from the spec.
 */
export const PageTypeSchema = stripImportedDefaults(SpecPageTypeSchema);

/**
 * Spec-owned Page fields, flowing in **by reference** (objectstack#4115).
 *
 * `BaseSchema` is `.passthrough()` while the spec's `PageSchema` is strict, so
 * before this derivation every spec-only key rode through objectui completely
 * unvalidated — `interfaceConfig`, `kind`, `slots`, `source`, `requires` and
 * `aria` were neither checked nor even declared. `source` was the sharpest
 * hole: `kind: 'html' | 'react'` pages carry their body in `source`, so a
 * source-authored page could not be expressed here at all.
 *
 * Omitted, each for a stated reason:
 *  - `name`/`label`/`description` — component-envelope keys owned by BaseSchema;
 *  - `type` — the names genuinely collide: spec's `type` IS the page kind
 *    (`record|app|utility|list|home`), objectui's is the component
 *    discriminator (`'page'`) and the kind lives on `pageType` below.
 *    Reconciling the two is a rename decision tracked separately;
 *  - `regions` — objectui's `PageNodeRegionSchema` adds `type`/`className` and
 *    widens `width`; migration deferred (it is its own ledger entry).
 *
 * `.partial()` guarantees no *future* spec field can become required and
 * silently invalidate stored objectui pages.
 */
const SpecPageFields = specFieldsExcept(stripImportedDefaults(SpecPageSchema).shape, [
  'name',
  'label',
  'description',
  'type',
  'regions',
] as const);

/**
 * The `actions` REFUSAL on the `page` node (objectui#7926, maintainer ruling
 * 2026-09-09, decision batch #107 item 2 — option A).
 *
 * ## What was measured
 *
 * `PageNodeSchema` never declared `actions`, and `PageRenderer` never read it:
 * `git grep -ni action packages/components/src/renderers/layout/page.tsx`
 * returns only the `PageVariableActionBridge` import and its render, with
 * `schema.title` / `schema.pageType` (3 hits in the same file) as the lit
 * control. Rendered through the real `SchemaRenderer`, a `page` node carrying
 * `actions: [{type:'button',label:'Add Product'}, …]` drew **0** buttons and
 * the label appeared nowhere in the DOM; the SAME two buttons moved into
 * `body` drew **2**.
 *
 * `BaseSchema` is `.passthrough()`, so the array was not refused — it was KEPT,
 * and until objectui#7933 it was spread onto the wrapper element as
 * `actions="[object Object],[object Object]"`. That half is closed (`toDomProps`,
 * `page.tsx:521`), which leaves the silent half: an author writes a key, the
 * validator says yes, and nothing draws.
 *
 * ## Why a REFUSAL rather than a reader
 *
 * This was the THIRD surface carrying an `actions` array no reader consumes
 * (objectui#7469 — the app node; objectui#7693 — the alert-dialog fixtures),
 * and the authorable action FORM was already ruled on 2026-08-25 for
 * objectui#6497 / #6182 (option A: the declarative action object). Growing a
 * reader here would have minted a FOURTH `actions` shape, so the ruling pulls
 * the node back to its declared contract instead.
 *
 * ⛔ NOT `.strict()` on the node, and that is the census talking rather than
 * taste. Measured over this tree before the refusal was written: 91 authored
 * `page`-tagged objects, 8 sites the census could not read (7 elided doc fences
 * plus one literal carrying a spread), and the undeclared keys that survive
 * passthrough on a real `page` NODE are exactly `actions` (3 sites, all of them
 * the `content/docs/guide/layout.md` passages this card rewrites) and
 * `breadcrumbs` (its own question — objectui#7926 does not rule on it; RULED
 * and refused separately by objectui#8871, see {@link PAGE_BREADCRUMBS_REFUSAL}
 * below, which also corrects the "1 site" reading recorded here to THREE — two
 * were missed for two DIFFERENT reasons: one passage's literal does carry
 * `type: 'page'` but sits inside a markdown `typescript` fence, a fence
 * LANGUAGE the census's `json`-fence reader never visits; the other is a
 * `json`-fenced fragment that never writes `type` at all).
 * Every other undeclared key the grep found sits on a DIFFERENT declaration
 * that merely spells `type: 'page'` — nav items (`pageName`, `href`, `badge`,
 * `labelKey`, `requiredPermissions`), `registerMetadataResource` rows
 * (`domain`, `listColumns`, `anchors`, `create*`) and spec `page` LIST VIEWS
 * (`pageName` + empty `columns`) — none of which this schema parses. And
 * `page-app-dashboard-spec-parity.test.ts` PINS the node staying open
 * ("the component envelope still passes unknown renderer props through"), so a
 * strict node would have taken a living pin with it. One key, by name.
 *
 * Same helper and the same reasoning as `MenuItemSchema.type`
 * (`./overlay.zod.ts`, objectui#6523): a spelling the type never declared,
 * turned into a named refusal that carries the remedy.
 */
const PAGE_ACTIONS_REFUSAL =
  '`actions` is not a key of the `page` node and never was (objectui#7926): no renderer ' +
  'reads it, so an authored array drew nothing and rode `.passthrough()` onto the wrapper ' +
  'element. Author the buttons as NODES in `body` (a `button` node, or an `action:button` ' +
  'node with a declared `actionType`); on a record page declare them on a `page:header` ' +
  'block instead, whose own `actions` are ACTION IDS resolved from the object metadata ' +
  '(objectui#7182), not nodes.';

/**
 * The `breadcrumbs` REFUSAL on the `page` node (objectui#8871) — the key
 * objectui#7926 measured on this same node and deliberately left parsing, so
 * that retiring it would be a DECISION rather than an accident. This is that
 * decision, taken under ADR-0049 enforce-or-remove.
 *
 * ## Why ADR-0049 governs this, and not a fresh ruling
 *
 * objectui#7926's maintainer ruling covers `actions` and, by its own comments,
 * nothing else — so it is NOT borrowed here. What reaches this key instead is
 * the standing enforce-or-remove discipline, which this repository applies to
 * this exact face: {@link retirementTombstone} is documented as the "ADR-0049
 * RETIREMENT TOMBSTONE" helper and is internal to these zod modules; 63
 * changesets under `.changeset/` cite the ADR; and `PageNodeSchema` itself
 * already carries one of its refusal arms one member up. "Declared-or-authored
 * but unread" is the population the gate names, and this key is in it.
 *
 * ## What was measured (objectui#8871, on this branch's BASE `93127bd6f`)
 *
 * ZERO readers — and the FRAME is load-bearing: every number below is a
 * reading on the BASE unless it says HEAD. On the base,
 * `git grep -E "\.breadcrumbs"` over the whole tree returns nothing (exit 1);
 * the same shape one letter shorter, `"\.breadcrumb\b"`, returns 12 files
 * tree-wide (10 under `packages/`) — the lit control that says the probe
 * runs. At HEAD those two read 16 and 13, and `\.breadcrumbs` itself turns
 * exit 0 over 4 files / 6 lines, because THIS branch's own four files — the
 * changeset, `page-breadcrumbs-refusal-8871.test.ts`, `layout.ts` and this one
 * — QUOTE the probe string; subtract the eight exclusions the tree-scoped pin
 * spells out and HEAD is back at exit 1. `layout.ts`'s twin docblock states the
 * same frame, and the two must not be allowed to drift apart on it again.
 * ⛔ A BARE-WORD probe is useless here and the reason this note
 * spells the shape out: `breadcrumbs` is heavily overloaded in this tree, and
 * a bare grep hits Sentry's own unrelated breadcrumbs concept
 * (`app-shell/src/observability/sentry.ts`) plus two comments listing UI
 * surfaces (`core/src/utils/record-title.ts`, `layout/src/NavigationRenderer.tsx`)
 * — three prose sites, no reader, no declaration. A bare probe reads "5
 * readers" and every one of them is false.
 *
 * THREE author sites, all of them teaching passages in one file — and the
 * count corrects objectui#7926's "1 site", which came from a census that
 * reads every git-tracked JSON file, every `json` fence in `.md`/`.mdx`, and
 * every TS/TSX object literal via the TypeScript AST (PR #8870). It
 * undercounted for TWO DIFFERENT reasons: the Schema API block declared the
 * member outright and its literal does carry `type: 'page'`, but that literal
 * sits inside a markdown `typescript` fence — a fence LANGUAGE the census's
 * `json`-fence reader never visits, so it was never read at all. Best
 * Practices §2 authored it on a fragment inside a `json` fence the census
 * DOES read, but that fragment never writes `type`, so a `page`-TAGGED filter
 * correctly excluded it. The "Detail Page with Actions" fence is the one site
 * both instruments would see — a `json` fence, tagged `type: 'page'` — and is
 * the "1 site" the earlier census counted. No example app, catalog fixture,
 * template or customer document writes the key; this refusal therefore
 * strands no authored document in the tree.
 *
 * ## Why a REFUSAL and not a bare deletion
 *
 * There is nothing to delete: the key was never in the shape. `BaseSchema` is
 * `.passthrough()`, so an undeclared key is not refused, it is KEPT — deleting
 * a declaration that does not exist would leave the silent accept exactly as it
 * is. Declaring the refusal is what makes it audible, and it is what converts a
 * write from OUTSIDE this repository — the half no in-tree census can read —
 * into a named refusal carrying its own remedy.
 *
 * ## Why a REFUSAL and not a reader
 *
 * The remedy is a NODE, and it already ships. `breadcrumb` is a REGISTERED,
 * live component (`ComponentRegistry.register('breadcrumb', …)` in
 * `packages/components/src/renderers/data-display/breadcrumb.tsx`) whose
 * `BreadcrumbSchema.items` takes the very `{ label, href }` shape these
 * passages authored, and which honours `separator`, `maxItems` and per-item
 * `icon` besides. Growing a second road to the same trail would mint a rival
 * spelling for a vocabulary that already renders — the `wrap` test
 * (objectui#5453) run in the opposite direction: there the key was retired
 * because it had NO second road to a consumer; here it is retired because the
 * road that exists is the one that draws.
 *
 * ⛔ NOT `.strict()` on the node, for the reason {@link PAGE_ACTIONS_REFUSAL}
 * records above: the census found only these two keys on a real `page` node,
 * and `page-app-dashboard-spec-parity.test.ts` pins the node staying open to
 * unknown renderer props. One key, by name — again.
 */
const PAGE_BREADCRUMBS_REFUSAL =
  '`breadcrumbs` is not a key of the `page` node and never was (objectui#8871, ADR-0049 ' +
  'enforce-or-remove): no renderer reads it, so an authored trail drew nothing and rode ' +
  '`.passthrough()` through the validator as a silent accept. Author the trail as a NODE ' +
  'in `body` instead — { "type": "breadcrumb", "items": [{ "label": "Home", "href": "/" }] } ' +
  '— which is a registered renderer and takes the same item shape, plus `separator` and ' +
  '`maxItems`. ⛔ Not the `page:header` block\'s `breadcrumb` either: that one is SINGULAR ' +
  'and a BOOLEAN display toggle, not a list of links.';

/**
 * Page Schema — top-level page layout, derived from `@objectstack/spec/ui`
 * `PageSchema` (see {@link SpecPageFields}). The drift guard is
 * `__tests__/page-app-dashboard-spec-parity.test.ts`.
 */
export const PageNodeSchema = BaseSchema.extend(SpecPageFields.shape).extend({
  type: z.literal('page'),
  actions: retirementTombstone(PAGE_ACTIONS_REFUSAL),
  breadcrumbs: retirementTombstone(PAGE_BREADCRUMBS_REFUSAL),
  title: z.string().optional().describe('Page title'),
  icon: z.string().optional().describe('Page icon (Lucide icon name)'),
  description: z.string().optional().describe('Page description'),
  pageType: PageTypeSchema.optional().describe('Page type (record, home, app, utility)'),
  object: z.string().optional().describe('Bound object name (for record pages)'),
  template: z.string().optional().describe('Layout template name'),
  variables: z.array(PageVariableSchema).optional().describe('Local page state variables'),
  regions: z.array(PageNodeRegionSchema).optional().describe('Page layout regions'),
  // objectui#8310: ONE node or a list, mirroring the TS face and the runtime.
  // `FlatContent` in `page.tsx` normalizes a bare node into a one-element list,
  // and the root README's flagship example authors exactly that; array-only here
  // made this the only `body` in this file that is not the union (`CardSchema`
  // and `AspectRatioSchema` already spell it, as does `BaseSchema`).
  body: z
    .union([SchemaNodeSchema, z.array(SchemaNodeSchema)])
    .optional()
    .describe('Main content — one node or a list of nodes'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Alternative content prop'),
  isDefault: z.boolean().optional().describe('Whether this is the default page'),
  assignedProfiles: z.array(z.string()).optional().describe('Profiles that can access this page'),
});

/**
 * Semantic Element Schema — the seven HTML sectioning tags
 * `packages/components/src/renderers/layout/semantic.tsx` registers
 * (objectui#8499).
 *
 * ## The defect this closes
 *
 * These seven are REGISTERED, LIVE renderers with nine catalog fixtures of
 * their own under `examples/schema-catalog/src/schemas/components-layout-semantic/`,
 * and `AnyComponentSchema` had no arm for any of them. So a document that
 * renders correctly in the browser was REFUSED by `objectui check` — the
 * expensive direction, because the author's likely reaction is to stop trusting
 * the validator rather than to fix the document (objectui#8499 triage).
 *
 * The two faces disagreed BY CONSTRUCTION: `check:doc-types` judges a `type`
 * literal against the RENDERER registry (656 keys at the time of writing), not
 * against this union (107 arms), and nothing compared them at a node slot.
 * `../__tests__/node-slot-registered-arms-8499.test.ts` compares the literal set
 * below against `semantic.tsx`'s own `tags` array, so a tag added there without
 * an arm here goes red instead of diverging silently.
 *
 * ## Why one arm and not seven
 *
 * The factory in `semantic.tsx` builds ONE component over all seven tags: it
 * renders `renderChildren(schema.children || schema.body)` inside the tag and
 * declares exactly one authoring input, `className`. Seven arms would restate
 * the same shape seven times with no key to tell them apart.
 *
 * ## What is NOT declared here, and why
 *
 * Nothing beyond `type` and the child slot. Every other key the factory touches
 * — `data-obj-id`, `data-obj-type`, `style` — is a DESIGNER prop injected by the
 * renderer host, never authored metadata, and `className` is already a
 * {@link BaseSchema} member. Following the `BarChartSchema` discipline (`./data-display.zod.ts`):
 * only keys the renderer demonstrably reads, nothing on the strength of what a
 * sectioning tag "should" accept.
 */
export const SemanticElementSchema = BaseSchema.extend({
  type: z.enum(['aside', 'main', 'header', 'nav', 'footer', 'section', 'article'])
    .describe('HTML sectioning tag — the seven `renderers/layout/semantic.tsx` registers'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe('Child components — read as `schema.children || schema.body` by the factory'),
});

/**
 * Html Element Schema — the safe flow/inline HTML passthrough set
 * `packages/components/src/renderers/basic/html-elements.tsx` registers
 * (objectui#8499).
 *
 * ## Why these must resolve
 *
 * That module's own docblock states the purpose: a `kind:'html'` page is PARSED
 * (never executed) into the SDUI tree, so "the everyday HTML tags an author
 * reaches for — headings, paragraphs, lists, links, images, emphasis — must each
 * resolve to a renderer (otherwise the parser flags them `unknown-component`)".
 * They resolved in the RENDERER registry and in no arm of `AnyComponentSchema`,
 * which is objectui#8499: `content/docs/utilities/runner.mdx` teaches the reader
 * to save a document carrying `h1`, and the document it teaches renders and is
 * refused.
 *
 * ⚠️ One arm over the whole set, deliberately, and it is a real cost: `h1`
 * becomes legal at EVERY node slot, including slots where it is absurd (a
 * `header-bar`'s `logo`, a `dialog`'s `trigger`). That is not new laxity
 * — every one of the 107 pre-existing arms is already legal at every one of the
 * 249 declared node slots, because there is exactly ONE node-slot vocabulary in
 * this face ({@link SchemaNodeSchema}) and a discriminated union selects its arm
 * from the authored literal alone, with no way for a slot to narrow it. A
 * per-slot vocabulary is a different programme, not a variant of this arm.
 *
 * ## The per-tag keys, and why they are typed wider than the registration
 *
 * `PER_TAG_INPUTS` in that module declares `img`'s `width`/`height` as
 * `number`. The renderer FORWARDS them verbatim onto the DOM element, which
 * accepts `"100"` as readily as `100`, so a number-only declaration here would
 * refuse a document the renderer draws — this card's own defect, rebuilt one
 * key down. The declaration follows the read site, not the authoring hint.
 *
 * ⚠️ The keys are declared on the whole set rather than per tag, so
 * `{ type: 'p', href: '…' }` parses. {@link BaseSchema} passes unknown keys
 * through, so it parsed before this arm existed too — declaring them narrows
 * nothing and gains the author a typed surface.
 */
export const HtmlElementSchema = BaseSchema.extend({
  type: z.enum([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'blockquote', 'pre',
    'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'sub', 'sup', 'del', 'ins', 'abbr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'figure', 'figcaption', 'img', 'hr', 'br', 'time', 'address', 'cite', 'q',
  ]).describe('Safe HTML tag — the set `renderers/basic/html-elements.tsx` registers'),
  children: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe('Child components — read as `schema.children ?? schema.body`; ignored for the void tags `img` / `hr` / `br`'),
  href: z.string().optional()
    .describe('`a` link target; scheme-sanitised (`javascript:` / `data:` / `vbscript:` are dropped)'),
  target: z.string().optional().describe('`a` browsing context — an internal link navigates through the SPA router unless this names another target'),
  rel: z.string().optional().describe('`a` link relationship'),
  title: z.string().optional().describe('Advisory title — declared for `a`, `img` and `abbr`'),
  src: z.string().optional().describe('`img` source URL'),
  alt: z.string().optional().describe('`img` alternative text'),
  width: z.union([z.string(), z.number()]).optional().describe('`img` width — forwarded verbatim to the DOM attribute'),
  height: z.union([z.string(), z.number()]).optional().describe('`img` height — forwarded verbatim to the DOM attribute'),
  dateTime: z.string().optional().describe('`time` machine-readable datetime'),
  cite: z.string().optional().describe('`q` / `blockquote` source URL'),
});

/**
 * Layout Schema Union - All layout component schemas
 */
export const LayoutSchema = z.discriminatedUnion('type', [
  DivSchema,
  BoxSchema,
  TextSpanSchema,
  TextSchema,
  ImageSchema,
  IconSchema,
  SeparatorSchema,
  ContainerSchema,
  FlexSchema,
  StackSchema,
  GridSchema,
  CardSchema,
  TabsSchema,
  ScrollAreaSchema,
  ResizableSchema,
  AspectRatioSchema,
  PageNodeSchema,
  SemanticElementSchema,
  HtmlElementSchema,
]);
