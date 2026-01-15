import { describe, it, expect, beforeAll } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';

describe('Plugin Markdown', () => {
  // Import all renderers to register them
  beforeAll(async () => {
    await import('./index');
  });

  describe('markdown component', () => {
    it('should be registered in ComponentRegistry', () => {
      const markdownRenderer = ComponentRegistry.get('markdown');
      expect(markdownRenderer).toBeDefined();
    });

    it('should have proper metadata', () => {
      const config = ComponentRegistry.getConfig('markdown');
      expect(config).toBeDefined();
      expect(config?.label).toBe('Markdown');
      expect(config?.category).toBe('plugin');
      expect(config?.inputs).toBeDefined();
      expect(config?.defaultProps).toBeDefined();
    });

    it('should have expected inputs', () => {
      const config = ComponentRegistry.getConfig('markdown');
      const inputNames = config?.inputs?.map((input: any) => input.name) || [];
      
      expect(inputNames).toContain('content');
      expect(inputNames).toContain('className');
    });

    it('should have content as required input', () => {
      const config = ComponentRegistry.getConfig('markdown');
      const contentInput = config?.inputs?.find((input: any) => input.name === 'content');
      
      expect(contentInput).toBeDefined();
      expect(contentInput?.required).toBe(true);
      expect(contentInput?.type).toBe('string');
      expect(contentInput?.inputType).toBe('textarea');
    });

    it('should have sensible default props', () => {
      const config = ComponentRegistry.getConfig('markdown');
      const defaults = config?.defaultProps;
      
      expect(defaults).toBeDefined();
      expect(defaults?.content).toBeDefined();
      expect(typeof defaults?.content).toBe('string');
      expect(defaults?.content.length).toBeGreaterThan(0);
      // Verify it contains markdown syntax
      expect(defaults?.content).toContain('#');
    });
  });
});
