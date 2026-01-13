import { describe, it, expect, beforeAll } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';

// Import the component to ensure it's registered
import '../data-table';

describe('Data Table Component', () => {
  it('should register data-table component', () => {
    expect(ComponentRegistry.has('data-table')).toBe(true);
  });

  it('should have correct component metadata', () => {
    const config = ComponentRegistry.getConfig('data-table');
    expect(config).toBeDefined();
    expect(config?.label).toBe('Data Table');
    expect(config?.inputs).toBeDefined();
    expect(config?.defaultProps).toBeDefined();
  });

  it('should have required inputs defined', () => {
    const config = ComponentRegistry.getConfig('data-table');
    const inputNames = config?.inputs?.map(input => input.name) || [];
    
    expect(inputNames).toContain('columns');
    expect(inputNames).toContain('data');
    expect(inputNames).toContain('pagination');
    expect(inputNames).toContain('searchable');
    expect(inputNames).toContain('selectable');
    expect(inputNames).toContain('sortable');
    expect(inputNames).toContain('exportable');
    expect(inputNames).toContain('rowActions');
  });

  it('should have default props with sample data', () => {
    const config = ComponentRegistry.getConfig('data-table');
    expect(config?.defaultProps).toBeDefined();
    expect(config?.defaultProps?.columns).toBeDefined();
    expect(Array.isArray(config?.defaultProps?.columns)).toBe(true);
    expect(config?.defaultProps?.data).toBeDefined();
    expect(Array.isArray(config?.defaultProps?.data)).toBe(true);
  });

  it('should have correct default feature flags', () => {
    const config = ComponentRegistry.getConfig('data-table');
    expect(config?.defaultProps?.pagination).toBe(true);
    expect(config?.defaultProps?.searchable).toBe(true);
    expect(config?.defaultProps?.selectable).toBe(true);
    expect(config?.defaultProps?.sortable).toBe(true);
    expect(config?.defaultProps?.exportable).toBe(true);
    expect(config?.defaultProps?.rowActions).toBe(true);
  });
});
