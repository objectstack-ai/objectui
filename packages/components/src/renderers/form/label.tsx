import { ComponentRegistry } from '@object-ui/core';
import type { LabelSchema } from '@object-ui/types';
import { Label } from '../../ui';

ComponentRegistry.register('label', 
  ({ schema, className, ...props }: { schema: LabelSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...labelProps 
    } = props;

    return (
      <Label 
        className={className} 
        {...labelProps}
        // Apply designer props
        {...{ 'data-obj-id': dataObjId, 'data-obj-type': dataObjType, style }}
      >
        {schema.text || schema.label || schema.content}
      </Label>
    );
  },
  {
    label: 'Label',
    inputs: [
      { name: 'text', type: 'string', label: 'Text', required: true },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      text: 'Label Text'
    }
  }
);
