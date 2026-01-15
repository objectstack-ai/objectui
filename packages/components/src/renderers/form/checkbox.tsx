import { ComponentRegistry } from '@object-ui/core';
import type { CheckboxSchema } from '@object-ui/types';
import { Checkbox, Label } from '@/ui';

ComponentRegistry.register('checkbox', 
  ({ schema, className, ...props }: { schema: CheckboxSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...checkboxProps 
    } = props;

    return (
    <div 
        className={`flex items-center space-x-2 ${schema.wrapperClass || ''}`}
        data-obj-id={dataObjId}
        data-obj-type={dataObjType}
        style={style}
    >
      <Checkbox id={schema.id} className={className} {...checkboxProps} />
      <Label htmlFor={schema.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {schema.label}
      </Label>
    </div>
  );
  },
  {
    label: 'Checkbox',
    inputs: [
      { name: 'label', type: 'string', label: 'Label', required: true },
      { name: 'id', type: 'string', label: 'ID', required: true },
      { name: 'checked', type: 'boolean', label: 'Checked' }
    ],
    defaultProps: {
      label: 'Checkbox label',
      id: 'checkbox-field' // Will be made unique by designer's ensureNodeIds
    }
  }
);
