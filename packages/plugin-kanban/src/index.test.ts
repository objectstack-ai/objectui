import { describe, it, expect, beforeAll } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';

describe('Plugin Kanban', () => {
  // Import all renderers to register them
  beforeAll(async () => {
    await import('./index');
  });

  describe('kanban component', () => {
    it('should be registered in ComponentRegistry', () => {
      const kanbanRenderer = ComponentRegistry.get('kanban');
      expect(kanbanRenderer).toBeDefined();
    });

    it('should have proper metadata', () => {
      const config = ComponentRegistry.getConfig('kanban');
      expect(config).toBeDefined();
      expect(config?.label).toBe('Kanban Board');
      expect(config?.icon).toBe('LayoutDashboard');
      expect(config?.category).toBe('plugin');
      expect(config?.inputs).toBeDefined();
      expect(config?.defaultProps).toBeDefined();
    });

    it('should have expected inputs', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const inputNames = config?.inputs?.map((input: any) => input.name) || [];
      
      expect(inputNames).toContain('columns');
      expect(inputNames).toContain('onCardMove');
      expect(inputNames).toContain('className');
    });

    it('should have columns as required input', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const columnsInput = config?.inputs?.find((input: any) => input.name === 'columns');
      
      expect(columnsInput).toBeDefined();
      expect(columnsInput?.required).toBe(true);
      expect(columnsInput?.type).toBe('array');
      expect(columnsInput?.description).toBeDefined();
    });

    it('should have onCardMove as code input', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const onCardMoveInput = config?.inputs?.find((input: any) => input.name === 'onCardMove');
      
      expect(onCardMoveInput).toBeDefined();
      expect(onCardMoveInput?.type).toBe('code');
      expect(onCardMoveInput?.advanced).toBe(true);
      expect(onCardMoveInput?.description).toBeDefined();
    });

    it('should have sensible default props', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const defaults = config?.defaultProps;
      
      expect(defaults).toBeDefined();
      expect(defaults?.columns).toBeDefined();
      expect(Array.isArray(defaults?.columns)).toBe(true);
      expect(defaults?.columns.length).toBeGreaterThan(0);
      expect(defaults?.className).toBe('w-full');
    });

    it('should have default columns with proper structure', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const defaults = config?.defaultProps;
      const columns = defaults?.columns || [];
      
      // Verify at least 3 columns exist (todo, in-progress, done)
      expect(columns.length).toBeGreaterThanOrEqual(3);
      
      // Verify each column has required properties
      columns.forEach((column: any) => {
        expect(column.id).toBeDefined();
        expect(column.title).toBeDefined();
        expect(column.cards).toBeDefined();
        expect(Array.isArray(column.cards)).toBe(true);
      });
      
      // Verify at least one column has cards
      const hasCards = columns.some((column: any) => column.cards.length > 0);
      expect(hasCards).toBe(true);
    });

    it('should have cards with proper structure', () => {
      const config = ComponentRegistry.getConfig('kanban');
      const defaults = config?.defaultProps;
      const columns = defaults?.columns || [];
      
      // Find a column with cards
      const columnWithCards = columns.find((column: any) => column.cards.length > 0);
      expect(columnWithCards).toBeDefined();
      
      const card = columnWithCards.cards[0];
      expect(card.id).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.description).toBeDefined();
      expect(card.badges).toBeDefined();
      expect(Array.isArray(card.badges)).toBe(true);
    });
  });
});
