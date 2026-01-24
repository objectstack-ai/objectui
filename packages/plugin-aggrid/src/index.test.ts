/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';

describe('Plugin AgGrid', () => {
  // Import all renderers to register them
  beforeAll(async () => {
    await import('./index');
  });

  describe('aggrid component', () => {
    it('should be registered in ComponentRegistry', () => {
      const aggridRenderer = ComponentRegistry.get('aggrid');
      expect(aggridRenderer).toBeDefined();
    });

    it('should have proper metadata', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      expect(config).toBeDefined();
      expect(config?.label).toBe('AG Grid');
      expect(config?.icon).toBe('Table');
      expect(config?.category).toBe('plugin');
      expect(config?.inputs).toBeDefined();
      expect(config?.defaultProps).toBeDefined();
    });

    it('should have expected inputs', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const inputNames = config?.inputs?.map((input: any) => input.name) || [];
      
      // Original inputs
      expect(inputNames).toContain('rowData');
      expect(inputNames).toContain('columnDefs');
      expect(inputNames).toContain('pagination');
      expect(inputNames).toContain('paginationPageSize');
      expect(inputNames).toContain('theme');
      expect(inputNames).toContain('height');
      expect(inputNames).toContain('rowSelection');
      expect(inputNames).toContain('domLayout');
      expect(inputNames).toContain('animateRows');
      expect(inputNames).toContain('gridOptions');
      expect(inputNames).toContain('className');
      
      // New inputs for enterprise features
      expect(inputNames).toContain('editable');
      expect(inputNames).toContain('singleClickEdit');
      expect(inputNames).toContain('exportConfig');
      expect(inputNames).toContain('statusBar');
      expect(inputNames).toContain('callbacks');
      expect(inputNames).toContain('columnConfig');
      expect(inputNames).toContain('enableRangeSelection');
      expect(inputNames).toContain('enableCharts');
      expect(inputNames).toContain('contextMenu');
    });

    it('should have rowData and columnDefs as required inputs', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const rowDataInput = config?.inputs?.find((input: any) => input.name === 'rowData');
      const columnDefsInput = config?.inputs?.find((input: any) => input.name === 'columnDefs');
      
      expect(rowDataInput).toBeDefined();
      expect(rowDataInput?.required).toBe(true);
      expect(rowDataInput?.type).toBe('array');
      
      expect(columnDefsInput).toBeDefined();
      expect(columnDefsInput?.required).toBe(true);
      expect(columnDefsInput?.type).toBe('array');
    });

    it('should have theme as enum input', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const themeInput = config?.inputs?.find((input: any) => input.name === 'theme');
      
      expect(themeInput).toBeDefined();
      expect(themeInput?.type).toBe('enum');
      expect(themeInput?.enum).toBeDefined();
      expect(Array.isArray(themeInput?.enum)).toBe(true);
      
      const enumValues = themeInput?.enum?.map((e: any) => e.value) || [];
      expect(enumValues).toContain('quartz');
      expect(enumValues).toContain('alpine');
      expect(enumValues).toContain('balham');
      expect(enumValues).toContain('material');
    });

    it('should have sensible default props', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const defaults = config?.defaultProps;
      
      expect(defaults).toBeDefined();
      expect(defaults?.pagination).toBe(true);
      expect(defaults?.paginationPageSize).toBe(10);
      expect(defaults?.theme).toBe('quartz');
      expect(defaults?.height).toBe(500);
      expect(defaults?.animateRows).toBe(true);
      expect(defaults?.domLayout).toBe('normal');
      expect(defaults?.rowData).toBeDefined();
      expect(Array.isArray(defaults?.rowData)).toBe(true);
      expect(defaults?.rowData.length).toBeGreaterThan(0);
      expect(defaults?.columnDefs).toBeDefined();
      expect(Array.isArray(defaults?.columnDefs)).toBe(true);
      expect(defaults?.columnDefs.length).toBeGreaterThan(0);
    });

    it('should have default columnDefs with proper structure', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const defaults = config?.defaultProps;
      const columnDefs = defaults?.columnDefs || [];
      
      expect(columnDefs.length).toBeGreaterThan(0);
      
      // Verify each column has required properties
      columnDefs.forEach((col: any) => {
        expect(col.field).toBeDefined();
        expect(typeof col.field).toBe('string');
      });
    });

    it('should have default rowData with proper structure', () => {
      const config = ComponentRegistry.getConfig('aggrid');
      const defaults = config?.defaultProps;
      const rowData = defaults?.rowData || [];
      
      expect(rowData.length).toBeGreaterThan(0);
      
      // Verify first row has expected properties
      const firstRow = rowData[0];
      expect(firstRow).toBeDefined();
      expect(typeof firstRow).toBe('object');
    });
  });
});
