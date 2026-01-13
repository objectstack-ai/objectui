import React from 'react';
import { ComponentRegistry } from '@object-ui/renderer';
import { useDesigner } from '../context/DesignerContext';
import type { ComponentInput, ComponentMeta } from '@object-ui/renderer/src/registry';

interface ComponentPaletteProps {
  className?: string;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ className }) => {
  const { addNode, selectedNodeId, setDraggingType } = useDesigner();

  const allConfigs = ComponentRegistry.getAllConfigs();

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingType(type);
  };
  
  const handleDragEnd = () => {
    setDraggingType(null);
  };

  const handleComponentClick = (type: string) => {
    const config = ComponentRegistry.getConfig(type);
    if (!config) return;

    const newNode = {
      type,
      ...(config.defaultProps || {}),
      body: config.defaultChildren || undefined
    };
    
    // Add to selected node if it exists, otherwise add to root
    // This logic might need refinement: adding to root might not be what we want if root is 'div'
    const parentId = selectedNodeId || 'root'; 
    // In a real app we'd verify if parent can accept children.
    // For now we assume 'root' exists or we find a way to get root ID.
    // Actually, usually user selects a container.
    addNode(parentId, newNode);
  };

  // Group components by category
  const categories = allConfigs.reduce((acc, config) => {
    const category = getCategoryForType(config.type);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(config);
    return acc;
  }, {} as Record<string, typeof allConfigs>);

  return (
    <div className={`h-full overflow-y-auto bg-gray-50 border-r ${className || ''}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        
        {Object.entries(categories).map(([category, components]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase">{category}</h3>
            <div className="space-y-1">
              {components.map(config => (
                <div
                  key={config.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, config.type)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleComponentClick(config.type)}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing bg-white border border-gray-100 shadow-sm"
                >
                  {config.icon && <span className="text-gray-500">{config.icon}</span>}
                  <span>{config.label || config.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to categorize components
function getCategoryForType(type: string): string {
  if (['button', 'input', 'textarea', 'select', 'checkbox', 'switch', 'radio-group', 'slider', 'toggle', 'input-otp', 'calendar'].includes(type)) {
    return 'Form';
  }
  if (['div', 'span', 'text', 'separator'].includes(type)) {
    return 'Basic';
  }
  if (['card', 'tabs', 'accordion', 'collapsible', 'resizable'].includes(type)) {
    return 'Layout';
  }
  if (['dialog', 'sheet', 'popover', 'tooltip', 'alert-dialog', 'drawer', 'hover-card', 'dropdown-menu', 'context-menu'].includes(type)) {
    return 'Overlay';
  }
  if (['badge', 'avatar', 'alert'].includes(type)) {
    return 'Data Display';
  }
  if (['progress', 'skeleton', 'toaster'].includes(type)) {
    return 'Feedback';
  }
  return 'Other';
}
