/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Overlay Component Zod Validators
 * 
 * Zod validation schemas for overlay, modal, and popup components.
 * Following @objectstack/spec UI specification format.
 * 
 * @module zod/overlay
 * @packageDocumentation
 */

import { z } from 'zod';
import { BaseSchema, SchemaNodeSchema } from './base.zod.js';
import type { MenuItem } from '../overlay.js';
import { aliasKeyRefusal, handlerKeyRefusal, retirementTombstone } from './tombstone.zod.js';

/**
 * Dialog Schema - Dialog/modal component
 */
export const DialogSchema = BaseSchema.extend({
  type: z.literal('dialog'),
  title: z.string().optional().describe('Dialog title'),
  description: z.string().optional().describe('Dialog description'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Dialog content'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Dialog trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  footer: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Dialog footer'),
  modal: z.boolean().optional().describe('Whether dialog is modal'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * The three ALERT-DIALOG FOOTER REFUSALS (objectui#7963) — `cancelLabel`,
 * `confirmLabel` and `confirmVariant`, retired from `AlertDialogSchema` on BOTH
 * faces under ADR-0049 enforce-or-remove (maintainer ruling 2026-09-10, taken
 * on the readings below; the direction is not re-opened by a later card).
 *
 * ## Why a REFUSAL and not a deletion
 *
 * `BaseSchemaCore` ends `.passthrough()` and the TS `BaseSchema` closes with
 * `[key: string]: any`, so a dropped MEMBER key is KEPT, not refused — deleting
 * these three declarations would have left the silent accept exactly as it was
 * and thrown away the diagnostic with it. {@link retirementTombstone} keeps the
 * key DECLARED and unwritable, which is what makes the refusal loud. Same
 * mechanism, same reasoning as the `actions` and `breadcrumbs` refusal arms on
 * `PageNodeSchema` (`./layout.zod.ts`, objectui#7926 / objectui#8871).
 * ⚠️ Both spelled WITHOUT a leading dot on purpose: objectui#8871 keeps a
 * TREE-SCOPED point-access probe standing over every tracked file, and a prose
 * mention here is a hit that probe cannot tell from a reader.
 *
 * ## What was measured — the frame is BASE `72bcd7783`, stated out loud
 *
 * ZERO readers, ⛔ measured with a POINT-ACCESS probe rather than a bare word.
 * Tree-wide on the base, `schema.cancelLabel`, `schema.confirmLabel` and
 * `schema.confirmVariant` each score **0**. The FIRING CONTROLS are the sibling
 * half on the very file under test
 * (`packages/components/src/renderers/overlay/alert-dialog.tsx`):
 * `schema.cancelText` = **15** (read at `:37`) and `schema.actionText` = **5**
 * (read at `:38`). The three zeros are therefore readings of the same
 * instrument on the same renderer the controls light up, ⛔ not a probe that
 * failed to run.
 *
 * ⛔ A BARE-WORD probe would have lied here, and it would have lied in the
 * DANGEROUS direction — these spellings are heavily overloaded in this tree,
 * and every other owner is LIVE: `FormSchema.cancelLabel` (`../form.ts`, read
 * at `renderers/form/form.tsx:1063,3266`), `objectql.ts`'s `confirmLabel`,
 * `plugin-designer`'s `ConfirmDialog` React props, `plugin-grid`'s
 * `def.confirmLabel`, and `plugin-form`'s `ModalForm` / `DrawerForm`, which
 * BUILD a local `cancelLabel` FROM `schema.cancelText` — the opposite
 * direction. A bare grep reports dozens of "readers", ⛔ none of them on an
 * `alert-dialog` node. This retirement touches none of them.
 *
 * ## The rest-spread near-miss, closed by MEASUREMENT rather than by reasoning
 *
 * The three keys DO reach the primitive: they are not on `SchemaRenderer`'s
 * strip list, so they ride `componentProps` into the renderer's `...props` and
 * onto `<AlertDialog {...props}>`. That is the same channel that made
 * `CollapsibleSchema.open` live (objectui#8236), so "no `schema.KEY` read" was
 * not safe to read as dead on its own. What settles it is a DOM reading:
 * `packages/components/src/__tests__/alert-dialog-footer-keys-liveness-7963.test.tsx`
 * varies one key per fixture through the real renderer and finds the normalised
 * dialog HTML unmoved, against a `CHANNEL` control (`open`, unread and live
 * through that same spread) and a `WIRED` control (`cancelText` / `actionText`
 * drawing both buttons). The mechanism it names: the `AlertDialog` root renders
 * a CONTEXT PROVIDER, not an element, so an unknown prop is dropped without
 * reaching any node. That pin is kept, not retired — a retirement does not
 * retire the measurement that justified it.
 *
 * ## No authored document is stranded
 *
 * Tree-wide, no fixture, catalog schema, example app, doc fence or template
 * authors any of the three ON AN `alert-dialog` NODE; the only sites that write
 * them are the two pins, which write them to TRIP the refusal.
 * `content/docs/components/overlay/alert-dialog.mdx` never taught them either
 * (asserted from the other side by `../__tests__/alert-dialog-read-dialect-7104.test.ts`).
 *
 * ## The capability, delivered under a DIFFERENT spelling (objectui#8978)
 *
 * The red destructive confirm decision batch #70 granted is live — as
 * `actionVariant`, declared above and read by the renderer. ⛔ `confirmVariant`
 * was not revived to carry it: a published key that reds must not go green
 * again, so the capability took a spelling in the `action*` dialect this node
 * already uses for that button, and the tombstone now names it as the remedy.
 *
 * Pinned in `../__tests__/alert-dialog-footer-keys-refusal-7963.test.ts`.
 */
const ALERT_DIALOG_CANCEL_LABEL_REFUSAL =
  '`cancelLabel` is RETIRED from the `alert-dialog` node (objectui#7963, ADR-0049 enforce-or-remove): ' +
  'nothing reads it, so an authored label drew no button at all and rode `.passthrough()` through the ' +
  'validator as a silent accept. Author the cancel button label as `cancelText` instead — the key the ' +
  'renderer reads and the key its registered `inputs` and `defaultProps` ship.';

const ALERT_DIALOG_CONFIRM_LABEL_REFUSAL =
  '`confirmLabel` is RETIRED from the `alert-dialog` node (objectui#7963, ADR-0049 enforce-or-remove): ' +
  'nothing reads it, so an authored label drew no button at all and rode `.passthrough()` through the ' +
  'validator as a silent accept. Author the confirm button label as `actionText` instead — the key the ' +
  'renderer reads and the key its registered `inputs` and `defaultProps` ship.';

/**
 * ⚠️ The key stays RETIRED; objectui#8978 moved only its MESSAGE. The separate
 * card the retirement pointed at has answered, so the message names the remedy
 * instead of saying there is none. ⛔ The key itself was NOT un-retired — a
 * published spelling that reds today must not go green again tomorrow
 * (「协议不应该改来改去啊，否则元数据应用怎么办」, 2026-09-10). And `cancelText` /
 * `actionText` are still NOT the remedy: they are the footer's two LABELS, and a
 * variant is not a label. `actionVariant` is.
 */
const ALERT_DIALOG_CONFIRM_VARIANT_REFUSAL =
  '`confirmVariant` is RETIRED from the `alert-dialog` node (objectui#7963, ADR-0049 enforce-or-remove): ' +
  'nothing ever read it, so an authored variant moved neither the confirm button\'s class nor any other ' +
  'byte of the rendered DOM, and it rode `.passthrough()` through the validator as a silent accept. ' +
  'Write `actionVariant` instead — the key objectui#8978 declared for this capability, read by the ' +
  'renderer and pinned against the confirm button\'s own class. ⛔ `cancelText` / `actionText` are NOT ' +
  'it: those are the footer\'s two LABELS, not a variant.';

/**
 * Alert Dialog Schema - Alert dialog component
 */
export const AlertDialogSchema = BaseSchema.extend({
  type: z.literal('alert-dialog'),
  title: z.string().optional().describe('Alert dialog title'),
  description: z.string().optional().describe('Alert dialog description'),
  content: z
    .union([SchemaNodeSchema, z.array(SchemaNodeSchema)])
    .optional()
    .describe('Dialog body, rendered between the header and the footer'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Dialog trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  cancelText: z
    .string()
    .optional()
    .describe('Cancel button label; the cancel button renders only when this is set (no renderer default)'),
  actionText: z
    .string()
    .optional()
    .describe('Confirm (action) button label; the action button renders only when this is set (no renderer default)'),
  actionVariant: z
    .enum(['default', 'destructive'])
    .optional()
    .describe(
      'Confirm (action) button variant; `destructive` paints the red confirm. Two values, not ' +
        '`ButtonSchema.variant`\'s six: the renderer applies this as a className OVERRIDE over the ' +
        'primitive\'s baked-in `buttonVariants()`, and the other three upstream variants set no background ' +
        'and/or no text colour, so the default\'s survives underneath them (objectui#8978)',
    ),
  cancelLabel: retirementTombstone(ALERT_DIALOG_CANCEL_LABEL_REFUSAL),
  confirmLabel: retirementTombstone(ALERT_DIALOG_CONFIRM_LABEL_REFUSAL),
  confirmVariant: retirementTombstone(ALERT_DIALOG_CONFIRM_VARIANT_REFUSAL),
  onAction: handlerKeyRefusal('onAction', 'runtime-slot', 'Action button click handler'),
  onConfirm: handlerKeyRefusal('onConfirm', 'retired', 'Confirm handler'),
  onCancel: handlerKeyRefusal('onCancel', 'retired', 'Cancel handler'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Sheet Schema - Sheet/side panel component
 */
export const SheetSchema = BaseSchema.extend({
  type: z.literal('sheet'),
  title: z.string().optional().describe('Sheet title'),
  description: z.string().optional().describe('Sheet description'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Sheet content'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Sheet trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  side: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Sheet position'),
  footer: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Sheet footer'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Drawer Schema - Drawer component
 */
export const DrawerSchema = BaseSchema.extend({
  type: z.literal('drawer'),
  title: z.string().optional().describe('Drawer title'),
  description: z.string().optional().describe('Drawer description'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Drawer content'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Drawer trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  direction: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Drawer direction'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Popover Schema - Popover component
 */
export const PopoverSchema = BaseSchema.extend({
  type: z.literal('popover'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Popover content'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Popover trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  side: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Popover side'),
  align: z.enum(['start', 'center', 'end']).optional().describe('Popover alignment'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Tooltip Schema - Tooltip component
 *
 * ⚠️ This member used to REQUIRE `children` and declare neither `trigger` nor
 * `body` (objectui#6939). No read site has ever consumed `children` here: the
 * renderer reads `schema.trigger` (`renderers/overlay/tooltip.tsx:28`) and
 * `schema.content || renderChildren(schema.body)` (:31), and the registration's
 * own `inputs` list `trigger` / `content` / `body` and never `children`. So the
 * validator refused documents the renderer draws and blessed a spelling that
 * paints an empty trigger — `declared !== enforced`, with the corpus on the
 * right side of it.
 *
 * `HoverCardSchema` two entries below is the settled in-repo shape for this
 * pair of slots and is what `trigger` follows here.
 *
 * ⛔ Do not "repair" a tooltip document by moving its trigger back under
 * `children`: `basic-tooltip` was ALREADY moved from `children` to `trigger` on
 * render evidence (objectui#4626 — it was a measured blank tile), and reverting
 * it is a named regression.
 *
 * Every slot is optional because the accept set may only WIDEN toward what
 * already renders: `children` stays legal (inherited from `BaseSchema`, where
 * it is optional), and nothing that validated before this change stops
 * validating.
 */
export const TooltipSchema = BaseSchema.extend({
  type: z.literal('tooltip'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe('Element the tooltip attaches to (objectui#6939)'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe('Tooltip content, checked before `body` — optional because `body` is the fallback for the same slot (objectui#6939)'),
  body: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe('Rich tooltip content — the fallback for `content`, listed by the registration as the "Rich Content" slot (objectui#6939)'),
  side: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Tooltip side'),
  align: z.enum(['start', 'center', 'end']).optional().describe('Tooltip alignment'),
  delayDuration: z.number().optional().describe('Delay before showing (ms)'),
  children: aliasKeyRefusal(
    'children',
    'body',
    'this tooltip node',
    '`tooltip` reads `content` first and `body` as the fallback for that same slot, and never `children` '
    + '(READ SITE, measured with the TypeScript type checker: packages/components/src/renderers/overlay/tooltip.tsx:31). '
    + '`children` is inherited from `BaseSchema`, so an authored `children` parsed green here and rendered '
    + 'an EMPTY element — no error, no warning. objectui#8284.',
  ),
});

/**
 * Hover Card Schema - Hover card component
 */
export const HoverCardSchema = BaseSchema.extend({
  type: z.literal('hover-card'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Hover card content'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Hover card trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  side: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Hover card side'),
  align: z.enum(['start', 'center', 'end']).optional()
    .describe('Alignment against the trigger, forwarded as `align` on `HoverCardContent`, beside the already-declared `side` (objectui#6150)'),
  openDelay: z.number().optional().describe('Delay before opening (ms)'),
  closeDelay: z.number().optional().describe('Delay before closing (ms)'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Menu Item Schema — a discriminated union (objectui#6523): a command item
 * (label required) or a divider (`separator: true`, no label). Mirrors the
 * TS union `MenuItem = MenuCommandItem | MenuDividerItem` in `../overlay.ts`;
 * see that file's doc comment for why this is a union rather than an
 * optional `label`, and why `type` is tombstoned on both arms.
 *
 * Both tombstones carry their guidance through `retirementTombstone()`
 * (objectui#6931), so the arm-level issue reads the remediation instead of
 * zod's generic `expected never`. Note what a UNION does to that: the
 * top-level issue this schema reports is zod's own `invalid_union`
 * (`"Invalid input"`, path `[]`), and the per-arm issues — where the guidance
 * lives — hang off it. A consumer that only prints top-level issues therefore
 * still shows `Invalid input` here; the guidance is reached by walking the
 * union's arm errors, and by the `.describe()` metadata, which is unchanged.
 *
 * INPUT FACE: both type arguments carry this mirror's existing TypeScript
 * declaration (objectui#7760, maintainer ruling, decision batch #69) — the annotation
 * still breaks the recursion in the initializer below, but it no longer publishes
 * `unknown` as what an author may write here. ⛔ Runtime accept set unchanged; ⛔ the
 * declaration unchanged. The reasoning lives once, on `SchemaNodeSchema` in
 * `base.zod.ts` — read it there before changing this line.
 */
export const MenuItemSchema: z.ZodType<MenuItem, MenuItem> = z.lazy(() =>
  z.union([
    z.object({
      label: z.string().describe('Menu item label'),
      icon: z.string().optional().describe('Menu item icon'),
      disabled: z.boolean().optional().describe('Whether item is disabled'),
      onClick: handlerKeyRefusal('onClick', 'runtime-slot', 'Click handler'),
      shortcut: z.string().optional().describe('Keyboard shortcut'),
      children: z.array(MenuItemSchema).optional().describe('Submenu items'),
      separator: z.literal(false).optional().describe('Not a divider'),
      type: retirementTombstone(
        'RETIRED (objectui#6523) — dividers are `{ separator: true }`; ' +
        '`type` (\'separator\' or \'label\') was an undeclared spelling two ' +
        'renderers used to read and is now a declared refusal, not a strip.'
      ),
    }),
    z.object({
      separator: z.literal(true).describe('Renders as a divider between items — no label'),
      type: retirementTombstone('RETIRED (objectui#6523) — see the command-item arm above.'),
    }),
  ])
);

/**
 * Dropdown Menu Schema - Dropdown menu component
 */
export const DropdownMenuSchema = BaseSchema.extend({
  type: z.literal('dropdown-menu'),
  items: z.array(MenuItemSchema).describe('Menu items'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).describe('Menu trigger'),
  defaultOpen: z.boolean().optional().describe('Default open state'),
  open: z.boolean().optional().describe('Controlled open state'),
  side: z.enum(['top', 'right', 'bottom', 'left']).optional().describe('Menu side'),
  align: z.enum(['start', 'center', 'end']).optional().describe('Menu alignment'),
  onOpenChange: handlerKeyRefusal('onOpenChange', 'runtime-slot', 'Open change handler'),
});

/**
 * Context Menu Schema - Context menu component
 *
 * ⚠️ This member used to REQUIRE `children`, which no read site consumes
 * (objectui#6939). The renderer reads `schema.trigger` and `schema.items`
 * (`renderers/overlay/context-menu.tsx:95,99`), so a document authoring its
 * right-clickable area under `children` loses it to the hardcoded placeholder
 * — `Right-click here` renders as `Right click here`. `children` stays legal
 * (inherited from `BaseSchema`, where it is optional); it is simply no longer
 * demanded, so the accept set only widens toward what already renders.
 *
 * `triggerClassName` / `contentClassName` / `modal` are read at :87, :88 and
 * :91 and were undeclared, surviving only on `BaseSchema.passthrough()`.
 */
export const ContextMenuSchema = BaseSchema.extend({
  type: z.literal('context-menu'),
  items: z.array(MenuItemSchema).describe('Menu items'),
  trigger: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional()
    .describe("Right-clickable area. Optional: the renderer substitutes a placeholder (`Right click here`) when omitted, so trigger-less documents are legal today (objectui#6150)"),
  triggerClassName: z.string().optional()
    .describe('Classes for the right-clickable area — falls back to `className` / `schema.className`, or a dashed-border default when none are set (objectui#6939)'),
  contentClassName: z.string().optional()
    .describe('Classes for the menu panel, applied to the underlying `ContextMenuContent` (objectui#6939)'),
  modal: z.boolean().optional()
    .describe('Forwarded to the Radix `ContextMenu` root as `modal` (objectui#6939)'),
});

/**
 * Menubar Menu Schema
 */
export const MenubarMenuSchema = z.object({
  label: z.string().describe('Menu label'),
  items: z.array(MenuItemSchema).describe('Menu items'),
});

/**
 * Menubar Schema - Menubar component
 */
export const MenubarSchema = BaseSchema.extend({
  type: z.literal('menubar'),
  menus: z.array(MenubarMenuSchema).optional().describe('Menubar menus'),
});

/**
 * Overlay Schema Union - All overlay component schemas
 */
export const OverlaySchema = z.discriminatedUnion('type', [
  DialogSchema,
  AlertDialogSchema,
  SheetSchema,
  DrawerSchema,
  PopoverSchema,
  TooltipSchema,
  HoverCardSchema,
  DropdownMenuSchema,
  ContextMenuSchema,
  MenubarSchema,
]);
