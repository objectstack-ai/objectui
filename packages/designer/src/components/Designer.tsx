import React from 'react';
import { DesignerProvider } from '../context/DesignerContext';
import { ComponentPalette } from './ComponentPalette';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { Toolbar } from './Toolbar';
import type { SchemaNode } from '@object-ui/protocol';

interface DesignerProps {
  initialSchema?: SchemaNode;
  onSchemaChange?: (schema: SchemaNode) => void;
}

export const Designer: React.FC<DesignerProps> = ({ initialSchema, onSchemaChange }) => {
  return (
    <DesignerProvider initialSchema={initialSchema} onSchemaChange={onSchemaChange}>
      <div className="h-screen flex flex-col bg-white text-gray-900">
        <Toolbar />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 flex-shrink-0">
             <ComponentPalette className="h-full" />
          </div>
          
          <div className="flex-1 relative">
             <Canvas className="h-full" />
          </div>
          
          <div className="w-80 flex-shrink-0">
             <PropertyPanel className="h-full" />
          </div>
        </div>
      </div>
    </DesignerProvider>
  );
};
