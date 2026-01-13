import React, { useState } from 'react';
import { SchemaRenderer, ComponentRegistry } from '@object-ui/renderer';
import { useDesigner } from '../context/DesignerContext';
import { cn } from '@object-ui/ui/lib/utils';
import { MousePointer2 } from 'lucide-react';

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
    } = useDesigner();

    const [scale, setScale] = useState(1);

    const handleClick = (e: React.MouseEvent) => {
        // Find closest element with data-obj-id
        const target = (e.target as Element).closest('[data-obj-id]');
        if (target) {
            e.stopPropagation();
            const id = target.getAttribute('data-obj-id');
            setSelectedNodeId(id);
        } else {
            // Clicked on empty canvas area
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
            e.dataTransfer.dropEffect = 'copy';
        } else {
            setHoveredNodeId(null);
        }
    };
    
    const handleDragLeave = () => {
        setHoveredNodeId(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggingType) return;

        const target = (e.target as Element).closest('[data-obj-id]');
        const targetId = target?.getAttribute('data-obj-id');

        if (targetId) {
            e.stopPropagation();
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
    };
    
    // Inject styles for selection/hover using dynamic CSS
    // Using a more refined outline style
    const highlightStyles = `
        [data-obj-id] {
            position: relative; 
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        [data-obj-id="${selectedNodeId}"] {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -1px;
            z-index: 10;
        }
        
        [data-obj-id="${selectedNodeId}"]::before {
            content: '';
            position: absolute;
            top: -24px;
            left: -2px;
            height: 24px;
            padding: 0 8px;
            background: #3b82f6;
            color: white;
            font-size: 10px;
            font-family: inherit;
            display: flex;
            align-items: center;
            border-radius: 4px 4px 0 0;
            pointer-events: none;
            white-space: nowrap;
            font-weight: 600;
        }
        
        [data-obj-id="${hoveredNodeId}"] {
            outline: 2px dashed #60a5fa !important;
            outline-offset: -2px;
            background-color: rgba(59, 130, 246, 0.05);
            cursor: copy;
        }
    `;

    return (
        <div 
            className={cn(
                "h-full overflow-hidden bg-gray-100/50 flex flex-col relative", 
                className
            )}
        >
            {/* Toolbar for Canvas controls (Zoom etc - simplified) */}
            <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                 <div className="bg-white rounded-md shadow-sm border p-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                     <span className="px-2">{Math.round(scale * 100)}%</span>
                     <button onClick={() => setScale(s => Math.max(0.25, s - 0.1))} className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center">-</button>
                     <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center">+</button>
                     <button onClick={() => setScale(1)} className="px-2 hover:bg-gray-100 rounded">Reset</button>
                 </div>
            </div>

            <div 
                className="flex-1 overflow-auto p-12 relative flex justify-center"
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    // Dot grid background
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    perspective: '1000px'
                }}
            >
                <style>{highlightStyles}</style>
                
                <div 
                    className="bg-white shadow-lg transition-transform origin-top duration-200 ease-out"
                    style={{
                        width: '100%',
                        maxWidth: '1024px', // Standard desktop width
                        minHeight: '800px', // Standard height
                        transform: `scale(${scale})`,
                    }}
                >
                    {/* Render the Schema */}
                    <div className="h-full w-full">
                         <SchemaRenderer schema={schema} />
                    </div>
                </div>

                {/* Empty State Overlay if schema is empty/invalid? */}
                {(!schema || !schema.body || (Array.isArray(schema.body) && schema.body.length === 0 && !schema.props)) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center p-8 text-gray-400">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MousePointer2 size={32} />
                             </div>
                             <h3 className="text-lg font-medium text-gray-500">Start Building</h3>
                             <p className="max-w-xs mx-auto mt-2">Drag components from the left sidebar to start creating your UI.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
