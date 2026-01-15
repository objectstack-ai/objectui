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
    const { 
        copyNode, 
        cutNode, 
        duplicateNode, 
        pasteNode, 
        removeNode, 
        moveNodeUp,
        moveNodeDown,
        canPaste
    } = useDesigner();
    
    const handleCopy = useCallback(() => {
        if (targetNodeId) {
            copyNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, copyNode, onClose]);
    
    const handleCut = useCallback(() => {
        if (targetNodeId) {
            cutNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, cutNode, onClose]);
    
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
            duplicateNode(targetNodeId);
            onClose();
        }
    }, [targetNodeId, duplicateNode, onClose]);

    const handleMoveUp = useCallback(() => {
        if (targetNodeId) {
            moveNodeUp(targetNodeId);
            onClose();
        }
    }, [targetNodeId, moveNodeUp, onClose]);

    const handleMoveDown = useCallback(() => {
        if (targetNodeId) {
            moveNodeDown(targetNodeId);
            onClose();
        }
    }, [targetNodeId, moveNodeDown, onClose]);
    
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
            shortcut: '⌘D',
            divider: true
        },
        {
            label: 'Move Up',
            icon: MoveUp,
            action: handleMoveUp,
            shortcut: '↑'
        },
        {
            label: 'Move Down',
            icon: MoveDown,
            action: handleMoveDown,
            shortcut: '↓',
            divider: true
        },
        {
            label: 'Delete',
            icon: Trash2,
            action: handleDelete,
            shortcut: 'Del'
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
