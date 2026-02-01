import React from 'react';
import { Button, Badge } from '@object-ui/components';
import { Plus, X, ExternalLink } from 'lucide-react';
import { FieldWidgetProps } from './types';

/**
 * Master-Detail relationship data structure
 */
export interface MasterDetailValue {
  id: string;
  label: string;
  [key: string]: any;
}

/**
 * Master-Detail field widget - manages one-to-many relationships
 * Displays related records with add/remove capabilities
 */
export function MasterDetailField({ 
  value, 
  onChange, 
  readonly
}: FieldWidgetProps<MasterDetailValue[]>) {
  const items = value || [];

  const handleAdd = () => {
    // This would typically open a dialog to select/create related records
    // For now, we'll just show a placeholder
    const newItem: MasterDetailValue = {
      id: `new-${Date.now()}`,
      label: 'New Related Record',
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleView = (item: MasterDetailValue) => {
    // This would typically navigate to the detail view
    console.log('View detail:', item);
  };

  if (readonly) {
    return (
      <div className="space-y-2">
        {items.length === 0 ? (
          <span className="text-sm text-muted-foreground">No related records</span>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
            >
              <span className="text-sm">{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleView(item)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'record' : 'records'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 p-2 border rounded hover:bg-muted/50"
          >
            <div className="flex items-center gap-2 flex-1">
              <Badge variant="outline">{item.id}</Badge>
              <span className="text-sm flex-1">{item.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleView(item)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
                disabled={readonly || props.disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!readonly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Related Record
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        {items.length} {items.length === 1 ? 'record' : 'records'}
      </p>
    </div>
  );
}
