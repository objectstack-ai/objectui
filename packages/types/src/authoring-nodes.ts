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
 * them is declared by the spec, and the renderer draws it.
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
import type { NODE_ENVELOPE, PublicBlockComponentSchema } from './zod/public-blocks.zod.js';
import type { retirementTombstone } from './zod/tombstone.zod.js';

/**
 * A zod object arm's authoring input, read off its shape with the object
 * config left closed: the arm's `.passthrough()` index signature does not
 * reach the type. Distributes over a union of arms. Anything that is not an
 * object arm maps to `never`, and the pin file checks that no arm is lost
 * that way.
 */
type ClosedArmInput<Arm> = Arm extends z.ZodObject ? z.input<z.ZodObject<Arm['shape']>> : never;

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
export type AuthoringNode = PublicBlockNode | ElementTextInputNode | ElementRecordPickerNode | PageDocumentNode;
