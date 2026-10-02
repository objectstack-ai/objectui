/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import { PageDesigner } from './PageDesigner';
import { DataModelDesigner } from './DataModelDesigner';
import { ProcessDesigner } from './ProcessDesigner';
import { ReportDesigner } from './ReportDesigner';
import { CollaborationProvider, ConnectionStatusIndicator } from './CollaborationProvider';
import { AppCreationWizard } from './AppCreationWizard';
import { NavigationDesigner } from './NavigationDesigner';
import { EditorModeToggle } from './EditorModeToggle';
import { DashboardEditor } from './DashboardEditor';
import { BrandingEditor } from './BrandingEditor';
import { ObjectManager } from './ObjectManager';
import { FieldDesigner } from './FieldDesigner';

export {
  PageDesigner,
  DataModelDesigner,
  ProcessDesigner,
  ReportDesigner,
  CollaborationProvider,
  ConnectionStatusIndicator,
  AppCreationWizard,
  NavigationDesigner,
  EditorModeToggle,
  DashboardEditor,
  BrandingEditor,
  ObjectManager,
  FieldDesigner,
};

export type { AppCreationWizardProps } from './AppCreationWizard';
export type { NavigationDesignerProps } from './NavigationDesigner';
export type { EditorModeToggleProps } from './EditorModeToggle';
export type { DashboardEditorProps } from './DashboardEditor';
export type { BrandingEditorProps } from './BrandingEditor';
export type { ObjectManagerProps } from './ObjectManager';
export type { FieldDesignerProps } from './FieldDesigner';

// Shared hooks
export { useUndoRedo } from './hooks/useUndoRedo';
export { useDesignerHistory } from './hooks/useDesignerHistory';
export { useConfirmDialog } from './hooks/useConfirmDialog';
export { useClipboard } from './hooks/useClipboard';
export { useMultiSelect } from './hooks/useMultiSelect';
export { useCanvasPanZoom } from './hooks/useCanvasPanZoom';
// The provider-less fallback table, exported so objectui#4401's mirror gate can
// compare it against the `en` pack from a package that depends on both.
export { DESIGNER_DEFAULT_TRANSLATIONS } from './hooks/useDesignerTranslation';

// Shared components
export { ConfirmDialog } from './components/ConfirmDialog';
export { Minimap } from './components/Minimap';
export { PropertyEditor } from './components/PropertyEditor';
export { VersionHistory } from './components/VersionHistory';

// Route-ready app authoring pages — host apps mount these at their
// preferred routes. Each page expects an active app/adapter context from
// @object-ui/app-shell and uses react-router-dom hooks
// (useParams/useNavigate) for navigation.
export { CreateAppPage } from './pages/CreateAppPage';
export { EditAppPage } from './pages/EditAppPage';
export { DashboardDesignPage } from './pages/DashboardDesignPage';

// Metadata management pages (Setup-app "Data Model" group). These talk
// directly to the metadata REST API (`/api/v1/meta/*`) via
// `MetadataClient` from `@object-ui/data-objectstack`, and do not require
// an app/adapter context. They are the visual counterpart of the
// `sys_metadata` object's `only_objects` / `only_fields` list views.
export { MetadataObjectsPage } from './MetadataObjectsPage';
export type { MetadataObjectsPageProps } from './MetadataObjectsPage';
export { MetadataFieldsPage } from './MetadataFieldsPage';
export type { MetadataFieldsPageProps } from './MetadataFieldsPage';

ComponentRegistry.register('page-designer', PageDesigner, {
  namespace: 'plugin-designer',
  label: 'Page Designer',
  category: 'Designer',
  inputs: [
    { name: 'canvas', type: 'code' },
    { name: 'components', type: 'code' },
    { name: 'showComponentTree', type: 'boolean' },
    { name: 'undoRedo', type: 'boolean' },
    { name: 'readOnly', type: 'boolean' },
  ],
});

ComponentRegistry.register('data-model-designer', DataModelDesigner, {
  namespace: 'plugin-designer',
  label: 'Data Model Designer',
  category: 'Designer',
  inputs: [
    { name: 'entities', type: 'code' },
    { name: 'relationships', type: 'code' },
    { name: 'readOnly', type: 'boolean' },
  ],
});

ComponentRegistry.register('process-designer', ProcessDesigner, {
  namespace: 'plugin-designer',
  label: 'Process Designer (BPMN)',
  category: 'Designer',
  inputs: [
    { name: 'processName', type: 'string' },
    { name: 'nodes', type: 'code' },
    { name: 'edges', type: 'code' },
    { name: 'showMinimap', type: 'boolean' },
    { name: 'showToolbar', type: 'boolean' },
    { name: 'readOnly', type: 'boolean' },
  ],
});

ComponentRegistry.register('report-designer', ReportDesigner, {
  namespace: 'plugin-designer',
  label: 'Report Designer',
  category: 'Designer',
  inputs: [
    { name: 'reportName', type: 'string' },
    { name: 'objectName', type: 'string' },
    { name: 'sections', type: 'code' },
    { name: 'showToolbar', type: 'boolean' },
    { name: 'showPropertyPanel', type: 'boolean' },
    { name: 'readOnly', type: 'boolean' },
  ],
});

/**
 * ⛔ Four node type keys are RETIRED here (objectui#10859 batch 8, phase 2b,
 * the seat's ruling on that card, by the objectui#10393 / objectui#8760
 * route): `app-creation-wizard`, `navigation-designer`, `dashboard-editor` and
 * `branding-editor`. `AppCreationWizard`, `NavigationDesigner`,
 * `DashboardEditor` and `BrandingEditor` stay named exports of this package.
 *
 * ## What was here, and why it went
 *
 * One `ComponentRegistry.register(KEY, Component, { namespace:
 * 'plugin-designer', category: 'Designer', ... })` per key — builder chrome
 * published as node keys, each storing `plugin-designer:KEY` and the bare
 * `KEY` fallback. No `@object-ui/types` arm claims any of them, so
 * `objectui validate` refused a node authored with one of these types at
 * `type` while the registry mounted it.
 *
 * ## Why unregistering is the whole retirement
 *
 * Nothing wrote the nodes: 0 occurrences of any of the four as a node type in
 * source, docs, examples, the catalog or objectstack, and 0 runtime emission,
 * re-measured for phase 2b. The React components are mounted directly
 * wherever they are used, so no host loses a path. The designer registrations
 * around this block (`page-designer`, `object-manager` and the rest) are not
 * part of this retirement.
 */

ComponentRegistry.register('object-manager', ObjectManager, {
  namespace: 'plugin-designer',
  label: 'Object Manager',
  category: 'Designer',
  inputs: [
    { name: 'objects', type: 'code' },
    { name: 'showSystemObjects', type: 'boolean' },
    { name: 'readOnly', type: 'boolean' },
  ],
});

ComponentRegistry.register('field-designer', FieldDesigner, {
  namespace: 'plugin-designer',
  label: 'Field Designer',
  category: 'Designer',
  inputs: [
    { name: 'objectName', type: 'string' },
    { name: 'fields', type: 'code' },
    { name: 'readOnly', type: 'boolean' },
  ],
});
