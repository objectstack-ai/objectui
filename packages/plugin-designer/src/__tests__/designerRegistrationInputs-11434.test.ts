/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Every designer registration lists, as `inputs`, exactly the node members its
 * component reads (objectui#11434's sweep).
 *
 * `inputs` is an authoring surface: the html-tier page compiler builds its
 * manifest from every known registration, and its `validateTree` answers
 * `unknown-prop` for a node key no input names. A member the component reads
 * but `inputs` omits is therefore warned off although it works — which the
 * sweep measured on four of the six registrations (`process-designer` listed
 * neither `version` nor `lanes`, and only `page-designer` listed `canvas`).
 *
 * The expected set per type is the node declaration's members less what no
 * input should name: `type`, the two content channels every designer refuses
 * (`body`, `children`), and the retired tombstones (`autoLayout`,
 * `previewMode`).
 */

import { describe, it, expect } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';
import '../index';

const EXPECTED: Record<string, string[]> = {
  'page-designer': ['canvas', 'components', 'palette', 'propertyEditor', 'showComponentTree', 'undoRedo', 'readOnly'],
  'data-model-designer': ['entities', 'relationships', 'canvas', 'showRelationshipLabels', 'readOnly'],
  'process-designer': ['processName', 'version', 'nodes', 'edges', 'lanes', 'canvas', 'showMinimap', 'showToolbar', 'readOnly'],
  'report-designer': ['reportName', 'objectName', 'pageSize', 'orientation', 'margins', 'sections', 'showToolbar', 'showPropertyPanel', 'readOnly'],
  'object-manager': ['objects', 'showSystemObjects', 'readOnly'],
  'field-designer': ['objectName', 'fields', 'readOnly'],
};

describe('designer registrations list the members their components read (objectui#11434)', () => {
  it.each(Object.keys(EXPECTED))('`%s` inputs are exactly its read node members', (type) => {
    const config = ComponentRegistry.getConfig(type);
    expect(config, `no registration for ${type}`).toBeDefined();
    const names = (config?.inputs ?? []).map((input) => input.name);
    expect([...names].sort()).toEqual([...EXPECTED[type]].sort());
  });

  it('each row the sweep added declares the kind its value has', () => {
    const kind = (type: string, name: string) =>
      ComponentRegistry.getConfig(type)?.inputs?.find((input) => input.name === name)?.type;
    expect(kind('page-designer', 'palette')).toBe('array');
    expect(kind('page-designer', 'propertyEditor')).toBe('boolean');
    expect(kind('data-model-designer', 'canvas')).toBe('object');
    expect(kind('data-model-designer', 'showRelationshipLabels')).toBe('boolean');
    expect(kind('process-designer', 'version')).toBe('string');
    expect(kind('process-designer', 'lanes')).toBe('array');
    expect(kind('process-designer', 'canvas')).toBe('object');
    expect(kind('report-designer', 'margins')).toBe('object');
  });

  it('the two enumerated report inputs offer the declared vocabularies', () => {
    const inputs = ComponentRegistry.getConfig('report-designer')?.inputs ?? [];
    expect(inputs.find((i) => i.name === 'pageSize')?.enum).toEqual(['A4', 'A3', 'Letter', 'Legal', 'Tabloid']);
    expect(inputs.find((i) => i.name === 'orientation')?.enum).toEqual(['portrait', 'landscape']);
  });
});
