import React, { DragEvent } from 'react';
import { SchemaRenderer, ComponentRegistry } from '@object-ui/renderer';
import { useDesigner } from '../context/DesignerContext';
import { cn } from '@object-ui/ui/lib/utils'; // Assuming this exists or I should use string interp

// Helper to check if type is container (can accept children)
const isContainer = (type: string) => {
    // For now, based on categories or whitelist
    // Or we check if defaultChildren is defined in registry? No.
    // Basic containers:
    if (['div', 'card', 'tabs', 'accordion', 'collapsible', 'dialog', 'sheet', 'drawer', 'popover', 'resizable'].includes(type)) return true;
    return false;
};

interface CanvasProps {
    className?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ className }) => {
    const { 
        schema, 
        selectedNodeId, 
        setSelectedNodeId, 
        hoveredNodeId, 
        setHoveredNodeId,
        draggingType,
        addNode,
        setDraggingType
    } = useDesigner();

    const handleClick = (e: React.MouseEvent) => {
        const target = (e.target as Element).closest('[data-obj-id]');
        if (target) {
            e.stopPropagation();
            const id = target.getAttribute('data-obj-id');
            setSelectedNodeId(id);
        } else {
            setSelectedNodeId(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!draggingType) return;
        e.preventDefault();
        
        const target = (e.target as Element).closest('[data-obj-id]');
        if (target) {
            e.stopPropagation();
            const id = target.getAttribute('data-obj-id');
            setHoveredNodeId(id);
        } else {
            setHoveredNodeId(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!draggingType) return;
        e.preventDefault();
        e.stopPropagation();
        
        const target = (e.target as Element).closest('[data-obj-id]');
        const targetId = target?.getAttribute('data-obj-id');

        if (targetId) {
            // Can we drop here?
            // Retrieve target node to check type? We only have ID.
            // Maybe just try adding.
            
            // Construct new node
             const config = ComponentRegistry.getConfig(draggingType);
             if (config) {
                 const newNode = {
                    type: draggingType,
                    ...(config.defaultProps || {}),
                    body: config.defaultChildren || undefined
                };
                addNode(targetId, newNode);
             }
        }
        
        setHoveredNodeId(null);
        // dragEnd in palette will clear draggingType
    };
    
    // Inject styles for selection/hover using a style tag or dynamic CSS?
    // Doing it via CSS in JS style injection to avoid dependencies
    // targeting data-obj-id attributes.
    
    const highlightStyles = `
        [data-obj-id="${selectedNodeId}"] {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -2px;
        }
        [data-obj-id="${hoveredNodeId}"] {
            outline: 2px dashed #93c5fd !important;
            outline-offset: -2px;
            background-color: rgba(59, 130, 246, 0.05);
        }
    `;

    return (
        <div 
            className={`h-full overflow-auto bg-gray-100 p-8 ${className || ''}`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <style>{highlightStyles}</style>
            <div className="min-h-full max-w-6xl mx-auto bg-white shadow-sm p-8 rounded-lg">
                <SchemaRenderer schema={schema} />
            </div>
        </div>
    );
};
