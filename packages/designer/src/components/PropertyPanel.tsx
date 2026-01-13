import React, { useState, useEffect } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { ComponentRegistry } from '@object-ui/renderer';

interface PropertyPanelProps {
    className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ className }) => {
    const { schema, selectedNodeId, updateNode } = useDesigner();
    
    // Find selected node in schema (recursive helper needed or flatten?)
    // This is inefficient but works for small schemas.
    // Better to have a map in context.
    const findNode = (node: any, id: string): any => {
        if (node.id === id) return node;
        if (node.body) {
            if (Array.isArray(node.body)) {
                for (const child of node.body) {
                    const found = findNode(child, id);
                    if (found) return found;
                }
            } else if (typeof node.body === 'object') {
                return findNode(node.body, id);
            }
        }
        return null;
    };
    
    const selectedNode = selectedNodeId ? findNode(schema, selectedNodeId) : null;
    const [jsonInput, setJsonInput] = useState('');

    useEffect(() => {
        if (selectedNode) {
            // Exclude body from props editing to avoid massive JSON
            const { body, ...props } = selectedNode;
            setJsonInput(JSON.stringify(props, null, 2));
        } else {
            setJsonInput('');
        }
    }, [selectedNodeId, schema]); // Should depend on selectedNode deep?

    const handleApply = () => {
        try {
            if (!selectedNodeId) return;
            const parsed = JSON.parse(jsonInput);
            updateNode(selectedNodeId, parsed);
        } catch (e) {
            alert('Invalid JSON');
        }
    };

    if (!selectedNode) {
        return (
            <div className={`p-4 bg-gray-50 border-l ${className || ''}`}>
                <div className="text-gray-500 text-sm">Select a component to edit properties</div>
            </div>
        );
    }
    
    const config = ComponentRegistry.getConfig(selectedNode.type);

    return (
        <div className={`w-80 bg-white border-l flex flex-col ${className || ''}`}>
            <div className="p-4 border-b">
                <h3 className="font-semibold">{config?.label || selectedNode.type}</h3>
                <div className="text-xs text-gray-500 font-mono">{selectedNode.id}</div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* 
                   Here we could generate form inputs based on config.inputs
                   For now, a simple JSON editor for props
                */}
                <div>
                   <label className="block text-sm font-medium mb-1">Properties (JSON)</label>
                   <textarea 
                        className="w-full h-60 font-mono text-xs border rounded p-2"
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                   />
                </div>
                <button 
                    onClick={handleApply}
                    className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
                >
                    Apply Changes
                </button>
            </div>
        </div>
    );
};
