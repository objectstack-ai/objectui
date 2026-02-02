
import { describe, it, expect } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';
import '../renderers'; // Ensure side-effects are run

describe('Component Registry', () => {
  it('should register standard page types', () => {
    expect(ComponentRegistry.get('page')).toBeDefined();
    expect(ComponentRegistry.get('app')).toBeDefined();
    expect(ComponentRegistry.get('utility')).toBeDefined();
    expect(ComponentRegistry.get('home')).toBeDefined();
    expect(ComponentRegistry.get('record')).toBeDefined();
  });

  it('should register standard layout components', () => {
    expect(ComponentRegistry.get('container')).toBeDefined();
    expect(ComponentRegistry.get('grid')).toBeDefined();
    expect(ComponentRegistry.get('stack')).toBeDefined();
    expect(ComponentRegistry.get('card')).toBeDefined();
  });
});
