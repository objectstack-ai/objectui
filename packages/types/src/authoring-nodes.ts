/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TypeScript AUTHORING types for the nodes `@objectstack/spec` declares and the
 * renderer draws, derived BY REFERENCE (objectui#11364, the preparation
 * objectui#8347's `BaseSchema` index-signature removal needs; direction from
 * objectui#7927's ruling, "the real extension keys are declared").
 *
 * ## Why these exist
 *
 * `BaseSchema` carries `[key: string]: any`, so today every key on every node
 * compiles. Once objectui#8347 removes it, a node may author only the keys some
 * TypeScript declaration names. The nodes below had none: an `element:text`
 * with its `properties` bag, a `page:tabs` with `properties.items`, an
 * `action:button` with its executor keys in the bag (objectui#11183), and a
 * stored page document handed to `SchemaRenderer` under its page kind. Each of
 * them is declared by the spec, and the renderer draws it. objectui#11468 adds
 * the other authored `properties`-bag carriers the zod face arms: the eight
 * ObjectQL blocks (`object-map`, `object-grid`, …) and `flex`.
 *
 * ## How each one is derived
 *
 *   - {@link PublicBlockNode}: one member per arm of
 *     `PublicBlockComponentSchema` (`./zod/public-blocks.zod.ts`), each the
 *     arm's own `z.input`. The arm is `BaseSchema.extend(...)`, and the zod
 *     `BaseSchema` is `.passthrough()`, so a bare `z.input` of it carries
 *     `[k: string]: unknown`, which would put back the index signature
 *     objectui#8347 removes. So the arm's SHAPE is read and the object's
 *     config is left closed. Every member, value type and refusal is the arm's,
 *     and through the arm the spec row's (`propsBag`); nothing is restated, and
 *     an arm added to that union is typed here the same day.
 *   - {@link ObjectQLPublicBlockNode} and {@link FlexBlockNode}
 *     (objectui#11468): the same derivation, over the arms of
 *     `ObjectQLPublicBlockComponentSchema` (`./zod/objectql.zod.ts`) and over
 *     `FlexBlockSchema` (`./zod/layout.zod.ts`), the authored
 *     `properties`-bag carriers outside `PublicBlockComponentSchema`. Two of
 *     their bags are not spec rows: `flex` and `object-chart` have no
 *     `ComponentPropsMap` row, so each bag is its flat mirror's own members,
 *     kept `.passthrough()` for the tolerant face (objectui#11276). The
 *     derivation reads a bag's shape the way it reads the arm's, so the type
 *     is closed where the strict authoring face closes it. A spec-row bag is
 *     already closed, and the derivation changes nothing for it.
 *   - {@link ElementTextInputNode} and {@link ElementRecordPickerNode}: no zod
 *     arm exists for these two. `AnyComponentSchema` still refuses both at
 *     `type`, and `registered-types-validate-ratchet-10859` in
 *     `@object-ui/cli` counts that population. The spec carries both rows
 *     (`ComponentPropsMap`), so each node is built the way an arm is built:
 *     the zod `BaseSchema` shape extended with the `type` literal, the node
 *     envelope (`NODE_ENVELOPE`: `responsiveStyles`, which `SchemaRenderer`
 *     compiles on every node), `properties` as the row, and the `body` /
 *     `children` tombstones, each by reference. The spec's own
 *     `PageComponentSchema` refuses a node-level `children` on both types as an
 *     unrecognized key, as it does on `element:text`.
 *     `element:record_picker` also declares `dataSource` (the
 *     spec's `ElementDataSourceSchema`), because its renderer reads the node's
 *     binding, the same rule `ElementNumberBlockSchema` follows. Its bag leaves
 *     `object` optional, because the spec's props gate waives that one member
 *     beside a `dataSource.object` for every row that requires it. A type
 *     cannot carry the waiver's condition, which is also true of the
 *     `element:number` arm's `z.input`.
 *   - {@link PageDocumentNode}: the spec's `PageSchema` input. `PageView`
 *     hands a stored page to `SchemaRenderer` with its page KIND written into
 *     `type` (objectui#9642), so `type` is required here, while the spec
 *     defaults it. `PageNodeSchema` is the separate `type: 'page'` node, and
 *     stays as it is.
 *
 * ## What these types do, and what they do NOT do
 *
 * `SchemaRendererProps.schema` (`@object-ui/react`) accepts {@link AuthoringNode}
 * beside `BaseSchema`. In that union, TypeScript discriminates on the literal
 * `type`, so a node of one of these types has its own keys judged: a misspelled
 * key inside an `element:text` bag, or a bag on a node type that declares none,
 * is refused once objectui#8347 lands (`authoring-nodes-11364.test.ts` pins it).
 * The union does not make a member's REQUIRED keys required, because
 * `BaseSchema` (`type: string`) still accepts the same node structurally.
 * Requiredness is the validator's to judge.
 *
 * ⛔ `SchemaNode` is not widened here. Every reader of a `SchemaNode` that
 * reads an undeclared key compiles today only through `BaseSchema`'s index
 * signature, and a closed member in the union turns that read into TS2339.
 */

import type { z } from 'zod';
import type {
  ElementDataSourceSchema as SpecElementDataSourceSchema,
  ElementRecordPickerPropsSchema as SpecElementRecordPickerPropsSchema,
  ElementTextInputPropsSchema as SpecElementTextInputPropsSchema,
  PageSchema as SpecPageSchema,
} from '@objectstack/spec/ui';
import type { BaseSchema as BaseSchemaMirror } from './zod/base.zod.js';
import type { FlexBlockSchema } from './zod/layout.zod.js';
import type { ObjectQLPublicBlockComponentSchema } from './zod/objectql.zod.js';
import type { NODE_ENVELOPE, PublicBlockComponentSchema } from './zod/public-blocks.zod.js';
import type { retirementTombstone } from './zod/tombstone.zod.js';

/**
 * An arm's `properties` member, read the way {@link ClosedArmInput} reads the
 * arm: when the bag is a zod object, its shape with the object config left
 * closed. A bag that is a spec row is already closed, so this changes nothing
 * for it. A bag built from a flat `.passthrough()` mirror (`flex`'s
 * `FlexPropsBag`, `object-chart`'s `ObjectChartPropsBag`, objectui#11276) keeps
 * the mirror's tolerant posture, which the strict authoring face closes, and
 * this type closes it the same way. Any other member is left as it is.
 */
type ClosedBag<Member> = Member extends z.ZodOptional<infer Bag extends z.ZodObject>
  ? z.ZodOptional<z.ZodObject<Bag['shape']>>
  : Member;

/**
 * A zod object arm's authoring input, read off its shape with the object
 * config left closed: the arm's `.passthrough()` index signature does not
 * reach the type, nor does its bag's ({@link ClosedBag}). Distributes over a
 * union of arms. Anything that is not an object arm maps to `never`, and the
 * pin file checks that no arm is lost that way.
 */
type ClosedArmInput<Arm> = Arm extends z.ZodObject ? z.input<z.ZodObject<ClosedArmShape<Arm['shape']>>> : never;

/** An arm's shape with its `properties` member closed ({@link ClosedBag}); every other member as it is. */
type ClosedArmShape<Shape> = { [K in keyof Shape]: K extends 'properties' ? ClosedBag<Shape[K]> : Shape[K] };

/** What `.extend()` does to a shape: `Own`'s keys replace `Base`'s, the rest stay. */
type ExtendedShape<Base, Own> = Omit<Base, keyof Own> & Own;

/**
 * The refusal every arm declares on `body` and `children` (objectui#9256,
 * objectui#10872): the schema type `retirementTombstone` returns, by reference.
 * Its input is `?: never`. The guidance text differs per arm; the type does not.
 */
type NodeTombstone = ReturnType<typeof retirementTombstone>;

/**
 * A node built from a spec `ComponentPropsMap` row with no zod arm, the way
 * every arm is built: `BaseSchema.extend({ type, ...NODE_ENVELOPE, properties,
 * body, children })`. So the zod `BaseSchema` shape (the base every arm
 * extends), with the `type` literal, the node envelope (`NODE_ENVELOPE`, whose
 * `responsiveStyles` is the spec's `ResponsiveStylesSchema`), `properties` as
 * the row, and the `body` / `children` tombstones, each by reference, plus any
 * further node-level member the renderer reads, each a spec schema by
 * reference.
 */
type SpecRowNode<
  Type extends string,
  Bag extends z.ZodType,
  NodeMembers extends z.core.$ZodShape = Record<never, never>,
> = z.input<
  z.ZodObject<
    ExtendedShape<
      (typeof BaseSchemaMirror)['shape'],
      {
        type: z.ZodLiteral<Type>;
        properties: z.ZodOptional<Bag>;
        body: NodeTombstone;
        children: NodeTombstone;
      } & typeof NODE_ENVELOPE & NodeMembers
    >
  >
>;

/**
 * Every ADR-0080 public block the zod face arms (`element:text`, `page:tabs`,
 * `action:button`, and the rest of `PublicBlockComponentSchema`), each the
 * arm's own authoring input. The block's props are its `properties` bag, which
 * is the spec's `ComponentPropsMap` row.
 */
export type PublicBlockNode = ClosedArmInput<(typeof PublicBlockComponentSchema)['options'][number]>;

/** The {@link PublicBlockNode} member whose `type` is `T`. */
export type PublicBlockNodeOf<T extends PublicBlockNode['type']> = Extract<PublicBlockNode, { type: T }>;

/**
 * The ObjectQL public blocks the zod face arms in their own union,
 * `ObjectQLPublicBlockComponentSchema` (`./zod/objectql.zod.ts`, objectui#10859
 * and objectui#11276): `object-metric`, `object-master-detail-form`,
 * `object-timeline`, `object-form`, `object-map`, `object-chart`,
 * `object-gantt` and `object-grid`, each the arm's own authoring input
 * (objectui#11468), derived exactly as {@link PublicBlockNode} is. The block's
 * props are its `properties` bag: the spec's `ComponentPropsMap` row, or, for
 * `object-chart`, which has no row, the `ObjectChartSchema` mirror's own
 * members, closed ({@link ClosedBag}).
 *
 * ⚠️ Not the TypeScript twins in `./objectql.ts` (`ObjectFormSchema`,
 * `ObjectMapSchema`, `ObjectGanttSchema`, `ObjectChartSchema`,
 * `ObjectGridSchema`): each of those is the node as its renderer reads it after
 * `SchemaRenderer` hoists the bag, and as code composes it. These are the
 * authored node, its props in the bag.
 */
export type ObjectQLPublicBlockNode = ClosedArmInput<(typeof ObjectQLPublicBlockComponentSchema)['options'][number]>;

/** The {@link ObjectQLPublicBlockNode} member whose `type` is `T`. */
type ObjectQLPublicBlockNodeOf<T extends ObjectQLPublicBlockNode['type']> = Extract<ObjectQLPublicBlockNode, { type: T }>;

/** An authored `object-metric` node: the `ObjectMetricBlockSchema` arm's input. */
export type ObjectMetricBlockNode = ObjectQLPublicBlockNodeOf<'object-metric'>;

/** An authored `object-master-detail-form` node: the `ObjectMasterDetailFormBlockSchema` arm's input. */
export type ObjectMasterDetailFormBlockNode = ObjectQLPublicBlockNodeOf<'object-master-detail-form'>;

/** An authored `object-timeline` node: the `ObjectTimelineBlockSchema` arm's input. */
export type ObjectTimelineBlockNode = ObjectQLPublicBlockNodeOf<'object-timeline'>;

/** An authored `object-form` node: the `ObjectFormBlockSchema` arm's input. */
export type ObjectFormBlockNode = ObjectQLPublicBlockNodeOf<'object-form'>;

/** An authored `object-map` node: the `ObjectMapBlockSchema` arm's input. */
export type ObjectMapBlockNode = ObjectQLPublicBlockNodeOf<'object-map'>;

/** An authored `object-chart` node: the `ObjectChartBlockSchema` arm's input. */
export type ObjectChartBlockNode = ObjectQLPublicBlockNodeOf<'object-chart'>;

/** An authored `object-gantt` node: the `ObjectGanttBlockSchema` arm's input. */
export type ObjectGanttBlockNode = ObjectQLPublicBlockNodeOf<'object-gantt'>;

/** An authored `object-grid` node: the `ObjectGridBlockSchema` arm's input. */
export type ObjectGridBlockNode = ObjectQLPublicBlockNodeOf<'object-grid'>;

/**
 * An authored `flex` node: the `FlexBlockSchema` arm's input (objectui#11468),
 * derived as {@link PublicBlockNode} is. Its props, the child list included,
 * are its `properties` bag: the `FlexSchema` mirror's own members
 * (`direction`, `justify`, `align`, `gap`, `wrap`, `children`), closed
 * ({@link ClosedBag}), because `@objectstack/spec` has no `flex` row
 * (objectui#11276). The TypeScript `FlexSchema` (`./layout.ts`) stays the node
 * as the `flex` renderer reads it after the hoist.
 */
export type FlexBlockNode = ClosedArmInput<typeof FlexBlockSchema>;

/**
 * `element:text_input`: `ComponentPropsMap['element:text_input']`
 * (`ElementTextInputPropsSchema`) as its `properties` bag, by reference.
 */
export type ElementTextInputNode = SpecRowNode<'element:text_input', typeof SpecElementTextInputPropsSchema>;

type RecordPickerRowShape = (typeof SpecElementRecordPickerPropsSchema)['shape'];

/**
 * `element:record_picker`: `ComponentPropsMap['element:record_picker']`
 * (`ElementRecordPickerPropsSchema`) as its `properties` bag, with `object`
 * optional for the spec's `dataSource` waiver, plus the node-level
 * `dataSource` (`ElementDataSourceSchema`) its renderer reads. Both by
 * reference.
 */
export type ElementRecordPickerNode = SpecRowNode<
  'element:record_picker',
  z.ZodObject<Omit<RecordPickerRowShape, 'object'> & { object: z.ZodOptional<RecordPickerRowShape['object']> }>,
  { dataSource: z.ZodOptional<typeof SpecElementDataSourceSchema> }
>;

type SpecPageInput = z.input<typeof SpecPageSchema>;

/**
 * A stored page document as it reaches `SchemaRenderer`: the spec's `PageSchema`
 * input, whose `type` is the page kind (`PageTypeSchema`) and whose `kind` is
 * the override mode. `type` is required, because it is the discriminator the
 * registry dispatches on.
 */
export type PageDocumentNode = SpecPageInput & { type: NonNullable<SpecPageInput['type']> };

/**
 * Every node this module types, so the one place that accepts them all
 * (`SchemaRendererProps.schema`) names one type.
 */
export type AuthoringNode =
  | PublicBlockNode
  | ObjectQLPublicBlockNode
  | FlexBlockNode
  | ElementTextInputNode
  | ElementRecordPickerNode
  | PageDocumentNode;
