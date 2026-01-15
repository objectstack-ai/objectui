import { ComponentRegistry } from '@object-ui/core';
import type { DivSchema } from '@object-ui/types';
import { renderChildren } from '../../lib/utils';

ComponentRegistry.register('div', 
  ({ schema, className, ...props }: { schema: DivSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style,
        ...divProps
    } = props;
    
    return (
    <div 
        className={className} 
        {...divProps}
        // Apply designer props
        {...{ 'data-obj-id': dataObjId, 'data-obj-type': dataObjType, style }}
    >
      {renderChildren(schema.children || schema.body)}
    </div>
  );
  },
  {
    label: 'Container',
    inputs: [
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      className: 'p-4 border border-dashed border-gray-300 rounded min-h-[100px]'
    }
  }
);
