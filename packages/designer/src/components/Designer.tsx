import React, { useEffect } from 'react';
import { DesignerProvider } from '../context/DesignerContext';
import { ComponentPalette } from './ComponentPalette';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { Toolbar } from './Toolbar';
import { useDesigner } from '../context/DesignerContext';
import type { SchemaNode } from '@object-ui/core';

interface DesignerProps {
  initialSchema?: SchemaNode;
  onSchemaChange?: (schema: SchemaNode) => void;
}


const DesignerContent: React.FC = () => {
  const { undo, redo, copyNode, pasteNode, removeNode, selectedNodeId, canUndo, canRedo } = useDesigner();
  
  // Keyboard shortcuts
// ...existing code...
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copyNode, pasteNode, removeNode, selectedNodeId, canUndo, canRedo]);

  return (
    <div className="h-full flex flex-col bg-white text-gray-900 font-sans">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}}
        <div className="w-72 flex-shrink-0 z-10 shadow-[1px_0_5px_rgba(0,0,0,0.03)] h-full">
           <ComponentPalette className="h-full border-r-0" />
        </div>
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-gray-100 z-0">
           <Canvas className="h-full w-full" />
        </div>
        
        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 z-10 shadow-[-1px_0_5px_rgba(0,0,0,0.03)] h-full">
           <PropertyPanel className="h-full border-l-0 shadow-none border-l custom-scrollbar" />
        </div>
      </div>
    </div>
  );
};

export const Designer: React.FC<DesignerProps> = ({ initialSchema, onSchemaChange }) => {
  return (
    <DesignerProvider initialSchema={initialSchema} onSchemaChange={onSchemaChange}>
      <DesignerContent />
    </DesignerProvider>
  );
};
