import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import type { SchemaNode } from '@object-ui/protocol';

interface DesignerContextType {
  schema: SchemaNode;
  setSchema: (schema: SchemaNode) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  draggingType: string | null;
  setDraggingType: (type: string | null) => void;
  addNode: (parentId: string, node: SchemaNode, index?: number) => void;
  updateNode: (id: string, updates: Partial<SchemaNode>) => void;
  removeNode: (id: string) => void;
}

const DesignerContext = createContext<DesignerContextType | null>(null);

export const useDesigner = () => {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesigner must be used within a DesignerProvider');
  }
  return context;
};

interface DesignerProviderProps {
  children: ReactNode;
  initialSchema?: SchemaNode;
  onSchemaChange?: (schema: SchemaNode) => void;
}

// Helper: Ensure IDs
const ensureNodeIds = (node: SchemaNode, idPrefix = ''): SchemaNode => {
  const nodeId = node.id || `${idPrefix}${node.type}-${Math.random().toString(36).substr(2, 9)}`;
  const result: SchemaNode = { ...node, id: nodeId };

  if (node.body) {
    if (Array.isArray(node.body)) {
      result.body = node.body.map((child) => ensureNodeIds(child, `${nodeId}-`));
    } else if (typeof node.body === 'object') {
      result.body = ensureNodeIds(node.body as SchemaNode, `${nodeId}-`);
    }
  }

  return result;
};

// Helper: Find node
const findNode = (node: SchemaNode, id: string): SchemaNode | null => {
  if (node.id === id) return node;
  if (node.body) {
    if (Array.isArray(node.body)) {
      for (const child of node.body) {
        const found = findNode(child, id);
        if (found) return found;
      }
    } else if (typeof node.body === 'object') {
      return findNode(node.body as SchemaNode, id);
    }
  }
  return null;
};

// Helper: Update Node
const updateNodeById = (node: SchemaNode, id: string, updates: Partial<SchemaNode>): SchemaNode => {
  if (node.id === id) {
    return { ...node, ...updates };
  }
  if (node.body) {
    if (Array.isArray(node.body)) {
      return {
        ...node,
        body: node.body.map(child => updateNodeById(child, id, updates))
      };
    } else if (typeof node.body === 'object') {
      return {
        ...node,
        body: updateNodeById(node.body as SchemaNode, id, updates)
      };
    }
  }
  return node;
};

// Helper: Add Node
const addNodeToParent = (root: SchemaNode, parentId: string, newNode: SchemaNode, index?: number): SchemaNode => {
  if (root.id === parentId) {
    const body = Array.isArray(root.body) ? [...root.body] : (root.body ? [root.body as SchemaNode] : []);
    if (typeof index === 'number' && index >= 0) {
        body.splice(index, 0, newNode);
    } else {
        body.push(newNode);
    }
    return { ...root, body };
  }

  if (root.body) {
    if (Array.isArray(root.body)) {
      return {
        ...root,
        body: root.body.map(child => addNodeToParent(child, parentId, newNode, index))
      };
    } else if (typeof root.body === 'object') {
      return {
        ...root,
        body: addNodeToParent(root.body as SchemaNode, parentId, newNode, index)
      };
    }
  }

  return root;
};

const defaultSchema: SchemaNode = {
  type: 'div',
  className: 'h-full w-full p-4',
  body: []
};

export const DesignerProvider: React.FC<DesignerProviderProps> = ({ 
  children, 
  initialSchema, 
  onSchemaChange 
}) => {
  const [schema, setSchemaState] = useState<SchemaNode>(() => ensureNodeIds(initialSchema || defaultSchema));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<string | null>(null);

  // Notify parent on schema change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSchemaChange?.(schema);
  }, [schema, onSchemaChange]);

  const setSchema = useCallback((newSchema: SchemaNode) => {
    setSchemaState(newSchema);
  }, []);

  const addNode = useCallback((parentId: string, node: SchemaNode, index?: number) => {
    const nodeWithId = ensureNodeIds(node);
    setSchemaState(prev => addNodeToParent(prev, parentId, nodeWithId, index));
    // Auto select the new node
    setTimeout(() => setSelectedNodeId(nodeWithId.id || null), 0);
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<SchemaNode>) => {
    setSchemaState(prev => updateNodeById(prev, id, updates));
  }, []);
  
  const removeNode = useCallback((id: string) => {
    // TODO: Implement remove node logic
    console.log('removeNode called for', id);
  }, []);

  return (
    <DesignerContext.Provider value={{
      schema,
      setSchema,
      selectedNodeId,
      setSelectedNodeId,
      hoveredNodeId,
      setHoveredNodeId,
      draggingType,
      setDraggingType,
      addNode,
      updateNode,
      removeNode
    }}>
      {children}
    </DesignerContext.Provider>
  );
};
