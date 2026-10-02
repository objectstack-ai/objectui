/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Visual Designer Zod Validators
 *
 * Zod mirrors of the six designer node declarations in `../designer.ts` —
 * `PageDesignerSchema`, `DataModelDesignerSchema`, `ProcessDesignerSchema`,
 * `ReportDesignerSchema`, `ObjectManagerSchema` and `FieldDesignerSchema` —
 * which `@object-ui/plugin-designer` registers as `page-designer`,
 * `data-model-designer`, `process-designer`, `report-designer`,
 * `object-manager` and `field-designer`, and of the record types those six
 * declare as their members' values.
 *
 * ## Why this module exists (objectui#10859)
 *
 * The six keys were REGISTERED and DECLARED on the published TypeScript face,
 * while `AnyComponentSchema` carried no arm for them — so `safeValidateSchema`
 * and `objectui validate` refused every document naming one with
 * `invalid_union` at `type`. The arms below restate the declarations member for
 * member; `DesignerUnionSchema` is the category union `AnyComponentSchema`
 * lists.
 *
 * ## What is NOT mirrored, and why (ruling on objectui#10859)
 *
 * The card's ruling: "A zod arm does not mirror an unread declared member onto
 * a second face." The registered components take the node's keys as React
 * props (`SchemaRenderer` spreads them; none of the six components spreads a
 * rest prop onward), so a node member is READ exactly when its component
 * destructures it and uses the binding. Measured that way, and with a runtime
 * probe through the real registry that varied only the one key, six declared
 * node members have no reader:
 *
 *   - `ProcessDesignerSchema.variables` and `ReportDesignerSchema.parameters`
 *     — no reader and no producer, so both were REMOVED from the TypeScript
 *     face in the same change (see the notes where they stood in
 *     `../designer.ts`); neither face declares them now.
 *   - `ProcessDesignerSchema.version` and `.lanes`, `DataModelDesignerSchema
 *     .autoLayout`, `ReportDesignerSchema.previewMode` — declared on the
 *     TypeScript face and deliberately NOT mirrored here. Each is recorded in
 *     `zod-mirror-parity.test.ts`'s `UnmirroredDeclared` ledger for the seat to
 *     rule (retire, or implement a reader); the TypeScript face is not narrowed
 *     by this module.
 *
 * Every other node member is mirrored, and every one of them has a reader. The
 * record types under the nodes (`BPMNNode`, `DataModelRelationship`, …) are
 * mirrored member for member as declared.
 *
 * ## Content channels
 *
 * None of the six components reads `body` or `children` (objectui#9256, family
 * D), so both are refused by name here, as the TypeScript twins refuse them
 * with `?: never` — one {@link neitherContentChannelGuidance} string per node,
 * fed to both members.
 *
 * ⛔ No `.default()` anywhere in this module — see the "authors no default"
 * note in `index.zod.ts`. Each component has its own fallbacks; this face
 * validates and writes nothing into a document.
 *
 * @module zod/designer
 * @packageDocumentation
 */

import { z } from 'zod';
import { BaseSchema } from './base.zod.js';
import { neitherContentChannelGuidance, retirementTombstone } from './tombstone.zod.js';
import { DESIGNER_FIELD_TYPES, type DesignerComponent } from '../designer.js';

/**
 * The route every designer node takes to its component, for the objectui#9256
 * guidance: the registration hands the node to the component as props, and
 * the component reads no `children` prop of its own.
 */
const propsRoute = (component: string) =>
  'its registration (`@object-ui/plugin-designer`) takes no `schema` prop: `SchemaRenderer` spreads the '
  + `node's other keys into \`${component}\` as props, and \`${component}\` reads no \`children\` prop of its own`;

const PAGE_DESIGNER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'page-designer',
  propsRoute('PageDesigner'),
  'the designer UI `PageDesigner` draws from `canvas`, `components`, `palette`, `propertyEditor`, '
    + '`showComponentTree`, `undoRedo` and `readOnly`',
);
const DATA_MODEL_DESIGNER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'data-model-designer',
  propsRoute('DataModelDesigner'),
  'the designer UI `DataModelDesigner` draws from `entities`, `relationships`, `canvas`, '
    + '`showRelationshipLabels` and `readOnly`',
);
const PROCESS_DESIGNER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'process-designer',
  propsRoute('ProcessDesigner'),
  'the designer UI `ProcessDesigner` draws from `processName`, `nodes`, `edges`, `canvas`, `showMinimap`, '
    + '`showToolbar` and `readOnly`',
);
const REPORT_DESIGNER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'report-designer',
  propsRoute('ReportDesigner'),
  'the designer UI `ReportDesigner` draws from `reportName`, `objectName`, `pageSize`, `orientation`, '
    + '`margins`, `sections`, `showToolbar`, `showPropertyPanel` and `readOnly`',
);
const OBJECT_MANAGER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'object-manager',
  propsRoute('ObjectManager'),
  'the designer UI `ObjectManager` draws from `objects`, `showSystemObjects` and `readOnly`',
);
const FIELD_DESIGNER_NEITHER_CHANNEL = neitherContentChannelGuidance(
  'field-designer',
  propsRoute('FieldDesigner'),
  'the designer UI `FieldDesigner` draws from `objectName`, `fields` and `readOnly`',
);

/** A canvas length: pixels, grid units, or a CSS length string (`number | string` on the TS face). */
const CanvasLength = z.union([z.number(), z.string()]);

// ============================================================================
// Page Designer
// ============================================================================

/**
 * Designer Position — mirrors `DesignerPosition` (`../designer.ts`).
 */
export const DesignerPositionSchema = z.object({
  x: z.number().describe('X coordinate (pixels or grid units)'),
  y: z.number().describe('Y coordinate (pixels or grid units)'),
  width: CanvasLength.describe('Width'),
  height: CanvasLength.describe('Height'),
});

/**
 * Designer Canvas Config — mirrors `DesignerCanvasConfig` (`../designer.ts`).
 */
export const DesignerCanvasConfigSchema = z.object({
  width: z.number().describe('Canvas width'),
  height: z.number().describe('Canvas height'),
  gridSize: z.number().optional().describe('Grid snap size'),
  showGrid: z.boolean().optional().describe('Whether to show grid'),
  snapToGrid: z.boolean().optional().describe('Whether to enable snap-to-grid'),
  zoom: z.number().optional().describe('Zoom level (1.0 = 100%)'),
  backgroundColor: z.string().optional().describe('Background color'),
});

/**
 * Designer Component — mirrors `DesignerComponent` (`../designer.ts`), a
 * component placed on the page designer's canvas.
 *
 * INPUT FACE: both type arguments carry the TypeScript declaration, the
 * `TreeNodeSchema` construct (objectui#7760): the annotation breaks the
 * recursion through `children` in the initializer below, and `tsc` compares the
 * mirror against the declaration as a whole type at the annotation itself.
 */
export const DesignerComponentSchema: z.ZodType<DesignerComponent, DesignerComponent> = z.lazy(() =>
  z.object({
    id: z.string().describe('Unique component ID'),
    type: z.string().describe('Component type'),
    label: z.string().optional().describe('Display label'),
    position: DesignerPositionSchema.describe('Position on canvas'),
    props: z.record(z.string(), z.unknown()).describe('Component properties'),
    children: z.array(DesignerComponentSchema).optional().describe('Child components'),
    parentId: z.string().optional().describe('Parent component ID'),
    locked: z.boolean().optional().describe('Lock state'),
    visible: z.boolean().optional().describe('Visibility'),
    zIndex: z.number().optional().describe('Z-index for layering'),
  }),
);

/**
 * Designer Palette Item — mirrors `DesignerPaletteItem` (`../designer.ts`).
 */
export const DesignerPaletteItemSchema = z.object({
  type: z.string().describe('Component type'),
  label: z.string().describe('Display label'),
  icon: z.string().optional().describe('Icon'),
  defaultProps: z.record(z.string(), z.unknown()).optional().describe('Default properties'),
  defaultSize: z
    .object({ width: CanvasLength, height: CanvasLength })
    .optional()
    .describe('Default size'),
  preview: z.string().optional().describe('Preview image URL'),
});

/**
 * Designer Palette Category — mirrors `DesignerPaletteCategory` (`../designer.ts`).
 */
export const DesignerPaletteCategorySchema = z.object({
  name: z.string().describe('Category name'),
  label: z.string().describe('Category label'),
  icon: z.string().optional().describe('Category icon'),
  items: z.array(DesignerPaletteItemSchema).describe('Available components'),
});

/**
 * Page Designer Schema — mirrors `PageDesignerSchema` (`../designer.ts`).
 */
export const PageDesignerSchema = BaseSchema.extend({
  type: z.literal('page-designer'),
  canvas: DesignerCanvasConfigSchema.describe('Canvas configuration'),
  components: z.array(DesignerComponentSchema).describe('Components on the canvas'),
  palette: z.array(DesignerPaletteCategorySchema).optional().describe('Available component palette'),
  propertyEditor: z.boolean().optional().describe('Property editor configuration'),
  showComponentTree: z.boolean().optional().describe('Component tree visibility'),
  undoRedo: z.boolean().optional().describe('Undo/redo support'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  body: retirementTombstone(PAGE_DESIGNER_NEITHER_CHANNEL),
  children: retirementTombstone(PAGE_DESIGNER_NEITHER_CHANNEL),
});

// ============================================================================
// Data Model Designer
// ============================================================================

/**
 * Data Model Field — mirrors `DataModelField` (`../designer.ts`).
 */
export const DataModelFieldSchema = z.object({
  name: z.string().describe('Field name'),
  label: z.string().optional().describe('Display label'),
  type: z.string().describe('Field data type'),
  primaryKey: z.boolean().optional().describe('Whether this is a primary key'),
  required: z.boolean().optional().describe('Whether this field is required'),
  unique: z.boolean().optional().describe('Whether this field is unique'),
  defaultValue: z.unknown().optional().describe('Default value'),
  description: z.string().optional().describe('Field description'),
});

/**
 * Data Model Entity — mirrors `DataModelEntity` (`../designer.ts`).
 */
export const DataModelEntitySchema = z.object({
  id: z.string().describe('Entity identifier'),
  name: z.string().describe('Entity name'),
  label: z.string().describe('Display label'),
  fields: z.array(DataModelFieldSchema).describe('Entity fields'),
  position: z.object({ x: z.number(), y: z.number() }).describe('Position on canvas'),
  color: z.string().optional().describe('Entity color'),
  description: z.string().optional().describe('Entity description'),
});

/** The cascade vocabulary `DataModelRelationship.onDelete` / `.onUpdate` share on the TS face. */
const CascadeBehavior = z.enum(['cascade', 'set-null', 'restrict', 'no-action']);

/**
 * Data Model Relationship — mirrors `DataModelRelationship` (`../designer.ts`).
 *
 * `onDelete` / `onUpdate` are a referential-action VOCABULARY, not handler
 * keys: the TypeScript face declares the four literals, and so does this one.
 */
export const DataModelRelationshipSchema = z.object({
  id: z.string().describe('Relationship identifier'),
  sourceEntity: z.string().describe('Source entity ID'),
  sourceField: z.string().describe('Source field'),
  targetEntity: z.string().describe('Target entity ID'),
  targetField: z.string().describe('Target field'),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']).describe('Relationship type'),
  label: z.string().optional().describe('Relationship label'),
  onDelete: CascadeBehavior.optional().describe('Cascade behavior on delete'),
  onUpdate: CascadeBehavior.optional().describe('Cascade behavior on update'),
});

/**
 * Data Model Designer Schema — mirrors `DataModelDesignerSchema`
 * (`../designer.ts`), less `autoLayout`: `DataModelDesigner` never reads it
 * (the toolbar's "Auto Layout" button runs on demand), so it is not mirrored
 * and stands in `UnmirroredDeclared` for the seat to rule.
 */
export const DataModelDesignerSchema = BaseSchema.extend({
  type: z.literal('data-model-designer'),
  entities: z.array(DataModelEntitySchema).describe('Entities in the model'),
  relationships: z.array(DataModelRelationshipSchema).describe('Relationships between entities'),
  canvas: DesignerCanvasConfigSchema.optional().describe('Canvas configuration'),
  showRelationshipLabels: z.boolean().optional().describe('Show relationship labels'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  body: retirementTombstone(DATA_MODEL_DESIGNER_NEITHER_CHANNEL),
  children: retirementTombstone(DATA_MODEL_DESIGNER_NEITHER_CHANNEL),
});

// ============================================================================
// Process Designer (BPMN 2.0)
// ============================================================================

/** The BPMN node vocabulary — mirrors `BPMNNodeType` (`../designer.ts`). */
const BPMNNodeTypeSchema = z.enum([
  'start-event',
  'end-event',
  'task',
  'user-task',
  'service-task',
  'script-task',
  'send-task',
  'receive-task',
  'manual-task',
  'business-rule-task',
  'sub-process',
  'call-activity',
  'exclusive-gateway',
  'parallel-gateway',
  'inclusive-gateway',
  'event-based-gateway',
  'intermediate-catch-event',
  'intermediate-throw-event',
  'boundary-event',
  'timer-event',
  'message-event',
  'signal-event',
  'error-event',
  'compensation-event',
]);

/**
 * BPMN Node — mirrors `BPMNNode` (`../designer.ts`).
 */
export const BPMNNodeSchema = z.object({
  id: z.string().describe('Node identifier'),
  type: BPMNNodeTypeSchema.describe('Node type'),
  label: z.string().describe('Display label'),
  position: z.object({ x: z.number(), y: z.number() }).describe('Position on canvas'),
  properties: z.record(z.string(), z.unknown()).optional().describe('Node properties'),
  assignee: z.string().optional().describe('Assigned user/role (for user tasks)'),
  dueDate: z.string().optional().describe('Due date expression'),
  script: z.string().optional().describe('Script content (for script tasks)'),
  serviceEndpoint: z.string().optional().describe('Service endpoint (for service tasks)'),
  description: z.string().optional().describe('Description'),
});

/**
 * BPMN Edge — mirrors `BPMNEdge` (`../designer.ts`).
 */
export const BPMNEdgeSchema = z.object({
  id: z.string().describe('Edge identifier'),
  source: z.string().describe('Source node ID'),
  target: z.string().describe('Target node ID'),
  condition: z.string().optional().describe('Condition expression (for conditional flows)'),
  label: z.string().optional().describe('Edge label'),
  isDefault: z.boolean().optional().describe('Whether this is the default flow'),
});

/**
 * Process Designer Schema — mirrors `ProcessDesignerSchema`
 * (`../designer.ts`), less two members `ProcessDesigner` never reads:
 * `version` (declared on its props, never destructured) and `lanes`
 * (destructured into an unused binding). Neither is mirrored; both stand in
 * `UnmirroredDeclared` for the seat to rule. `variables` left BOTH faces with
 * objectui#10859 (no reader, no producer).
 */
export const ProcessDesignerSchema = BaseSchema.extend({
  type: z.literal('process-designer'),
  processName: z.string().describe('Process name'),
  nodes: z.array(BPMNNodeSchema).describe('BPMN nodes'),
  edges: z.array(BPMNEdgeSchema).describe('BPMN edges/flows'),
  canvas: DesignerCanvasConfigSchema.optional().describe('Canvas configuration'),
  showMinimap: z.boolean().optional().describe('Show minimap'),
  showToolbar: z.boolean().optional().describe('Show toolbar'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  body: retirementTombstone(PROCESS_DESIGNER_NEITHER_CHANNEL),
  children: retirementTombstone(PROCESS_DESIGNER_NEITHER_CHANNEL),
});

// ============================================================================
// Report Designer
// ============================================================================

/** The report section vocabulary — mirrors `ReportSectionType` (`../designer.ts`). */
const ReportSectionTypeSchema = z.enum([
  'header',
  'detail',
  'footer',
  'group-header',
  'group-footer',
  'page-header',
  'page-footer',
]);

/**
 * Report Designer Element — mirrors `ReportDesignerElement` (`../designer.ts`).
 */
export const ReportDesignerElementSchema = z.object({
  id: z.string().describe('Element identifier'),
  type: z
    .enum(['text', 'field', 'image', 'chart', 'table', 'barcode', 'line', 'rectangle', 'expression'])
    .describe('Element type'),
  position: DesignerPositionSchema.describe('Position within section'),
  properties: z.record(z.string(), z.unknown()).describe('Element properties'),
  dataBinding: z.string().optional().describe('Data binding expression'),
  format: z
    .object({
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      fontWeight: z.enum(['normal', 'bold']).optional(),
      fontStyle: z.enum(['normal', 'italic']).optional(),
      color: z.string().optional(),
      backgroundColor: z.string().optional(),
      alignment: z.enum(['left', 'center', 'right']).optional(),
      verticalAlignment: z.enum(['top', 'middle', 'bottom']).optional(),
      border: z.string().optional(),
      padding: z.string().optional(),
      numberFormat: z.string().optional(),
      dateFormat: z.string().optional(),
    })
    .optional()
    .describe('Formatting options'),
});

/**
 * Report Designer Section — mirrors `ReportDesignerSection` (`../designer.ts`).
 */
export const ReportDesignerSectionSchema = z.object({
  type: ReportSectionTypeSchema.describe('Section type'),
  height: z.number().describe('Section height'),
  elements: z.array(ReportDesignerElementSchema).describe('Elements in this section'),
  groupField: z.string().optional().describe('Group field (for group headers/footers)'),
  repeat: z.boolean().optional().describe('Whether section repeats'),
  pageBreakBefore: z.boolean().optional().describe('Page break before'),
});

/**
 * Report Designer Schema — mirrors `ReportDesignerSchema` (`../designer.ts`),
 * less `previewMode`: `ReportDesigner` declares it on its props and never
 * destructures it, so it is not mirrored and stands in `UnmirroredDeclared`
 * for the seat to rule. `parameters` left BOTH faces with objectui#10859 (no
 * reader, no producer).
 */
export const ReportDesignerSchema = BaseSchema.extend({
  type: z.literal('report-designer'),
  reportName: z.string().describe('Report name'),
  objectName: z.string().describe('Data source object'),
  pageSize: z.enum(['A4', 'A3', 'Letter', 'Legal', 'Tabloid']).optional().describe('Page size'),
  orientation: z.enum(['portrait', 'landscape']).optional().describe('Page orientation'),
  margins: z
    .object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() })
    .optional()
    .describe('Page margins'),
  sections: z.array(ReportDesignerSectionSchema).describe('Report sections'),
  showToolbar: z.boolean().optional().describe('Show designer toolbar'),
  showPropertyPanel: z.boolean().optional().describe('Show property panel'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  body: retirementTombstone(REPORT_DESIGNER_NEITHER_CHANNEL),
  children: retirementTombstone(REPORT_DESIGNER_NEITHER_CHANNEL),
});

// ============================================================================
// Object Manager
// ============================================================================

/**
 * Object Definition Relationship — mirrors `ObjectDefinitionRelationship`
 * (`../designer.ts`).
 */
export const ObjectDefinitionRelationshipSchema = z.object({
  relatedObject: z.string().describe('Related object name'),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']).describe('Relationship type'),
  label: z.string().optional().describe('Relationship label'),
  foreignKey: z.string().optional().describe('Foreign key field'),
});

/**
 * Object Definition — mirrors `ObjectDefinition` (`../designer.ts`).
 */
export const ObjectDefinitionSchema = z.object({
  id: z.string().describe('Unique object identifier'),
  name: z.string().describe('API name (snake_case)'),
  label: z.string().describe('Display label'),
  pluralLabel: z.string().optional().describe('Plural display label'),
  description: z.string().optional().describe('Object description'),
  icon: z.string().optional().describe('Icon name (Lucide icon)'),
  group: z.string().optional().describe('Grouping/category'),
  sortOrder: z.number().optional().describe('Sort order within group'),
  isSystem: z.boolean().optional().describe('Whether this is a system object (non-deletable)'),
  fieldCount: z.number().optional().describe('Field count (read-only, for display)'),
  relationships: z.array(ObjectDefinitionRelationshipSchema).optional().describe('Relationships to other objects'),
});

/**
 * Object Manager Schema — mirrors `ObjectManagerSchema` (`../designer.ts`).
 */
export const ObjectManagerSchema = BaseSchema.extend({
  type: z.literal('object-manager'),
  objects: z.array(ObjectDefinitionSchema).describe('List of object definitions'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  showSystemObjects: z.boolean().optional().describe('Show system objects'),
  body: retirementTombstone(OBJECT_MANAGER_NEITHER_CHANNEL),
  children: retirementTombstone(OBJECT_MANAGER_NEITHER_CHANNEL),
});

// ============================================================================
// Field Designer
// ============================================================================

/**
 * Designer Field Option — mirrors `DesignerFieldOption` (`../designer.ts`).
 */
export const DesignerFieldOptionSchema = z.object({
  label: z.string().describe('Option label'),
  value: z.string().describe('Option value'),
  color: z.string().optional().describe('Option color (for badge display)'),
});

/**
 * Designer Validation Rule — mirrors `DesignerValidationRule` (`../designer.ts`).
 */
export const DesignerValidationRuleSchema = z.object({
  type: z.enum(['min', 'max', 'minLength', 'maxLength', 'pattern', 'custom']).describe('Rule type'),
  value: z.union([z.string(), z.number()]).describe('Rule value'),
  message: z.string().optional().describe('Error message'),
});

/**
 * Designer Field Definition — mirrors `DesignerFieldDefinition`
 * (`../designer.ts`). `type` is the designer's own vocabulary,
 * `DESIGNER_FIELD_TYPES`, read from the declaration module rather than
 * restated, so the two cannot drift.
 */
export const DesignerFieldDefinitionSchema = z.object({
  id: z.string().describe('Unique field identifier'),
  name: z.string().describe('API name (snake_case)'),
  label: z.string().describe('Display label'),
  type: z.enum(DESIGNER_FIELD_TYPES).describe('Field type'),
  group: z.string().optional().describe('Field group/section'),
  description: z.string().optional().describe('Field description / help text'),
  required: z.boolean().optional().describe('Whether field is required'),
  unique: z.boolean().optional().describe('Whether field is unique'),
  readonly: z.boolean().optional().describe('Whether field is read-only'),
  hidden: z.boolean().optional().describe('Whether field is hidden'),
  defaultValue: z.unknown().optional().describe('Default value'),
  placeholder: z.string().optional().describe('Placeholder text'),
  options: z.array(DesignerFieldOptionSchema).optional().describe('Select options (for select type)'),
  validationRules: z.array(DesignerValidationRuleSchema).optional().describe('Validation rules'),
  isSystem: z.boolean().optional().describe('Whether this is a system field'),
  externalId: z.boolean().optional().describe('External ID flag'),
  trackHistory: z.boolean().optional().describe('Track field history'),
  referenceTo: z.string().optional().describe('Lookup reference object (for lookup type)'),
});

/**
 * Field Designer Schema — mirrors `FieldDesignerSchema` (`../designer.ts`).
 */
export const FieldDesignerSchema = BaseSchema.extend({
  type: z.literal('field-designer'),
  objectName: z.string().describe('Object name this field designer belongs to'),
  fields: z.array(DesignerFieldDefinitionSchema).describe('List of field definitions'),
  readOnly: z.boolean().optional().describe('Read-only mode'),
  body: retirementTombstone(FIELD_DESIGNER_NEITHER_CHANNEL),
  children: retirementTombstone(FIELD_DESIGNER_NEITHER_CHANNEL),
});

/**
 * Union of the six designer node arms — the category member
 * `AnyComponentSchema` lists (objectui#10859). Named `DesignerUnionSchema`
 * because `DesignerComponentSchema` is the canvas component's mirror above
 * (the `ReportUnionSchema` precedent in `reports.zod.ts`).
 */
export const DesignerUnionSchema = z.discriminatedUnion('type', [
  PageDesignerSchema,
  DataModelDesignerSchema,
  ProcessDesignerSchema,
  ReportDesignerSchema,
  ObjectManagerSchema,
  FieldDesignerSchema,
]);
