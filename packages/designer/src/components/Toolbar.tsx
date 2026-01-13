import React from 'react';

export const Toolbar: React.FC = () => {
    return (
        <div className="h-12 border-b bg-white flex items-center px-4">
            <div className="font-bold text-gray-700">Object UI Designer</div>
            <div className="ml-auto flex gap-2">
                {/* Actions like Save, undo/redo could go here */}
            </div>
        </div>
    );
};
