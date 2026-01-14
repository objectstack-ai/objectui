import React, { useCallback, useEffect, useState } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { cn } from '@object-ui/components';
import { 
    Copy, 
    Trash2, 
    ClipboardPaste, 
    MoveUp, 
    MoveDown,
    Eye,
    EyeOff,
    Code,
    Scissors,
    type LucideIcon
} from 'lucide-react';

interface ContextMenuProps {
    position: { x: number; y: number } | null;
    targetNodeId: string | null;
    onClose: () => void;
}

interface MenuAction {
    label: string;
    icon: LucideIcon;
    action: () => void;
    shortcut?: string;
    disabled?: boolean;
    divider?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, targetNodeId, onClose }) => {
    const { copyNode, pasteNode, removeNode, canPaste, selectedNodeId } = useDesigner();
    
    const handleCopy = useCallback(() => {
        if (targetNodeId) {
            copyNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, copyNode, onClose]);
    
    const handleCut = useCallback(() => {
        if (targetNodeId) {
            copyNode(targetNodeId);
            removeNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, copyNode, removeNode, onClose]);
    
    const handlePaste = useCallback(() => {
        if (targetNodeId && canPaste) {
            pasteNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, canPaste, pasteNode, onClose]);
    
    const handleDelete = useCallback(() => {
        if (targetNodeId) {
            removeNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, removeNode, onClose]);
    
    const handleDuplicate = useCallback(() => {
        if (targetNodeId) {
            copyNode(targetNodeId);
            pasteNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, copyNode, pasteNode, onClose]);
    
    // Close on click outside or Escape key
    useEffect(() => {
        const handleClickOutside = () => onClose();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        
        if (position) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [position, onClose]);
    
    if (!position || !targetNodeId) return null;
    
    const menuActions: MenuAction[] = [
        {
            label: 'Copy',
            icon: Copy,
            action: handleCopy,
            shortcut: '⌘C'
        },
        {
            label: 'Cut',
            icon: Scissors,
            action: handleCut,
            shortcut: '⌘X'
        },
        {
            label: 'Paste',
            icon: ClipboardPaste,
            action: handlePaste,
            shortcut: '⌘V',
            disabled: !canPaste
        },
        {
            label: 'Duplicate',
            icon: Copy,
            action: handleDuplicate,
            shortcut: '⌘D'
        },
        {
            label: 'Delete',
            icon: Trash2,
            action: handleDelete,
            shortcut: 'Del',
            divider: true
        }
    ];
    
    // Adjust position to keep menu within viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 220),
        y: Math.min(position.y, window.innerHeight - (menuActions.length * 40))
    };
    
    return (
        <div
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
            style={{
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {menuActions.map((action, index) => (
                <React.Fragment key={index}>
                    <button
                        onClick={action.action}
                        disabled={action.disabled}
                        className={cn(
                            "w-full px-4 py-2 flex items-center gap-3 text-sm text-left transition-colors",
                            action.disabled 
                                ? "text-gray-400 cursor-not-allowed" 
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        )}
                    >
                        <action.icon size={16} className="flex-shrink-0" />
                        <span className="flex-1">{action.label}</span>
                        {action.shortcut && (
                            <span className="text-xs text-gray-400 font-mono">
                                {action.shortcut}
                            </span>
                        )}
                    </button>
                    {action.divider && index < menuActions.length - 1 && (
                        <div className="h-px bg-gray-200 my-1" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

ContextMenu.displayName = 'ContextMenu';
