import { ComponentRegistry } from '@object-ui/core';
import type { TextareaSchema } from '@object-ui/types';
import { Textarea, Label } from '@/ui';

ComponentRegistry.register('textarea', 
  ({ schema, className, ...props }: { schema: TextareaSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
      'data-obj-id': dataObjId, 
      'data-obj-type': dataObjType,
      style, 
      ...inputProps 
    } = props;

    return (
      <div 
        className={`grid w-full gap-1.5 ${schema.wrapperClass || ''}`}
        data-obj-id={dataObjId}
        data-obj-type={dataObjType}
        style={style}
      >
        {schema.label && <Label htmlFor={schema.id}>{schema.label}</Label>}
        <Textarea 
          id={schema.id} 
          placeholder={schema.placeholder} 
          className={className} 
          {...inputProps} 
        />
      </div>
    );
  },
  {
    label: 'Textarea',
    inputs: [
      { name: 'label', type: 'string', label: 'Label' },
      { name: 'placeholder', type: 'string', label: 'Placeholder' },
      { name: 'id', type: 'string', label: 'ID', required: true }
    ],
    defaultProps: {
      label: 'Textarea label',
      placeholder: 'Enter text here...',
      id: 'textarea-field' // Will be made unique by designer's ensureNodeIds
    }
  }
);
