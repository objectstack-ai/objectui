import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DesignerProvider, useDesigner } from '../context/DesignerContext';
import { SchemaNode } from '@object-ui/core';
import React from 'react';

// Test component to access designer context
const TestComponent = () => {
  const { 
    schema, 
    selectedNodeId, 
    setSelectedNodeId,
    copyNode,
    cutNode,
    duplicateNode,
    pasteNode,
    moveNodeUp,
    moveNodeDown,
    canPaste
  } = useDesigner();
  
  return (
    <div>
      <div data-testid="schema">{JSON.stringify(schema)}</div>
      <div data-testid="selected">{selectedNodeId || 'none'}</div>
      <div data-testid="can-paste">{canPaste ? 'yes' : 'no'}</div>
      <button onClick={() => setSelectedNodeId('child-1')} data-testid="select-child-1">Select Child 1</button>
      <button onClick={() => copyNode('child-1')} data-testid="copy">Copy</button>
      <button onClick={() => cutNode('child-1')} data-testid="cut">Cut</button>
      <button onClick={() => duplicateNode('child-1')} data-testid="duplicate">Duplicate</button>
      <button onClick={() => pasteNode('root')} data-testid="paste">Paste</button>
      <button onClick={() => moveNodeUp('child-2')} data-testid="move-up">Move Up</button>
      <button onClick={() => moveNodeDown('child-1')} data-testid="move-down">Move Down</button>
      <button onClick={() => moveNodeUp('child-1')} data-testid="move-up-first">Move Up First</button>
      <button onClick={() => moveNodeDown('child-3')} data-testid="move-down-last">Move Down Last</button>
      <button onClick={() => cutNode('nonexistent-id')} data-testid="cut-nonexistent">Cut Nonexistent</button>
    </div>
  );
};

describe('Keyboard Shortcuts and Navigation', () => {
  const initialSchema: SchemaNode = {
    type: 'div',
    id: 'root',
    body: [
      { type: 'text', id: 'child-1', content: 'First' },
      { type: 'text', id: 'child-2', content: 'Second' },
      { type: 'text', id: 'child-3', content: 'Third' }
    ]
  };

  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should copy a node', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    expect(getByTestId('can-paste').textContent).toBe('no');
    
    fireEvent.click(getByTestId('copy'));
    
    expect(getByTestId('can-paste').textContent).toBe('yes');
  });

  it('should cut a node and allow paste', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    expect(getByTestId('can-paste').textContent).toBe('no');
    
    fireEvent.click(getByTestId('cut'));
    
    // Should be able to paste after cut
    expect(getByTestId('can-paste').textContent).toBe('yes');
    
    // The schema should have the node removed
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    expect(schema.body).toHaveLength(2); // One node was cut
  });

  it('should duplicate a node', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    const initialBody = JSON.parse(getByTestId('schema').textContent || '{}').body;
    const initialLength = initialBody.length;

    fireEvent.click(getByTestId('duplicate'));
    
    // Schema should have an extra node
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    expect(schema.body.length).toBe(initialLength + 1);
    
    // The duplicated node should have the same type as the original
    expect(schema.body[1].type).toBe('text');
    expect(schema.body[1].content).toBe('First');
    
    // The duplicated node should be positioned right after the original (at index 1)
    expect(schema.body[1].id).not.toBe('child-1'); // Should have a new ID
  });

  it('should handle moving a node up when already at top', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    const schemaBeforeMove = JSON.parse(getByTestId('schema').textContent || '{}');
    
    // Try to move the first node up (should do nothing)
    fireEvent.click(getByTestId('move-up-first'));
    
    const schemaAfterMove = JSON.parse(getByTestId('schema').textContent || '{}');
    // Schema should remain unchanged
    expect(schemaAfterMove.body[0].id).toBe(schemaBeforeMove.body[0].id);
  });

  it('should handle moving a node down when already at bottom', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    const schemaBeforeMove = JSON.parse(getByTestId('schema').textContent || '{}');
    
    // Try to move the last node down (should do nothing)
    fireEvent.click(getByTestId('move-down-last'));
    
    const schemaAfterMove = JSON.parse(getByTestId('schema').textContent || '{}');
    // Schema should remain unchanged
    expect(schemaAfterMove.body[2].id).toBe(schemaBeforeMove.body[2].id);
  });

  it('should handle cutting a non-existent node gracefully', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    const initialLength = JSON.parse(getByTestId('schema').textContent || '{}').body.length;
    
    // Try to cut a node that doesn't exist
    fireEvent.click(getByTestId('cut-nonexistent'));
    
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    // Schema should remain unchanged
    expect(schema.body.length).toBe(initialLength);
  });

  it('should paste a copied node', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    fireEvent.click(getByTestId('copy'));
    fireEvent.click(getByTestId('paste'));
    
    // Schema should have an extra node
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    expect(schema.body.length).toBeGreaterThan(3);
  });

  it('should move a node up', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    fireEvent.click(getByTestId('move-up'));
    
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    // child-2 should now be at index 0 after moving up
    expect(schema.body[0].id).toBe('child-2');
  });

  it('should move a node down', () => {
    const { getByTestId } = render(
      <DesignerProvider initialSchema={initialSchema}>
        <TestComponent />
      </DesignerProvider>
    );

    fireEvent.click(getByTestId('move-down'));
    
    const schema = JSON.parse(getByTestId('schema').textContent || '{}');
    // child-1 should now be at index 1 after moving down
    expect(schema.body[1].id).toBe('child-1');
  });
});
