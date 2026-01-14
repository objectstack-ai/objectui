import { ComponentRegistry } from '@object-ui/core';
import type { SwitchSchema } from '@object-ui/types';
import { Switch, Label } from '@/ui';

ComponentRegistry.register('switch', 
  ({ schema, className, ...props }: { schema: SwitchSchema; className?: string; [key: string]: any }) => (
    <div className={`flex items-center space-x-2 ${schema.wrapperClass || ''}`}>
      <Switch id={schema.id} className={className} {...props} />
      <Label htmlFor={schema.id}>{schema.label}</Label>
    </div>
  ),
  {
    label: 'Switch',
    inputs: [
      { name: 'label', type: 'string', label: 'Label', required: true },
      { name: 'id', type: 'string', label: 'ID', required: true },
      { name: 'checked', type: 'boolean', label: 'Checked' }
    ],
    defaultProps: {
      label: 'Switch label',
      id: 'switch-field' // Will be made unique by designer's ensureNodeIds
    }
  }
);
