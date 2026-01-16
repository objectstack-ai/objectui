import { ComponentRegistry } from '@object-ui/core';
import type { FlexSchema } from '@object-ui/types'; // TODO: Create StackSchema if needed, but FlexSchema is usually compatible
import { renderChildren } from '../../lib/utils';
import { cn } from '../../lib/utils';

// Stack is essentially a Flex container that defaults to column direction
ComponentRegistry.register('stack', 
  ({ schema, className, ...props }: { schema: FlexSchema; className?: string; [key: string]: any }) => {
    // Default to column for Stack
    const direction = schema.direction || 'col';
    const justify = schema.justify || 'start';
    const align = schema.align || 'stretch'; // Stack items usually stretch
    const gap = schema.gap || 2;
    const wrap = schema.wrap || false;
    
    const stackClass = cn(
      'flex',
      // Direction
      direction === 'row' && 'flex-row',
      direction === 'col' && 'flex-col',
      direction === 'row-reverse' && 'flex-row-reverse',
      direction === 'col-reverse' && 'flex-col-reverse',
      // Justify content
      justify === 'start' && 'justify-start',
      justify === 'end' && 'justify-end',
      justify === 'center' && 'justify-center',
      justify === 'between' && 'justify-between',
      justify === 'around' && 'justify-around',
      justify === 'evenly' && 'justify-evenly',
      // Align items
      align === 'start' && 'items-start',
      align === 'end' && 'items-end',
      align === 'center' && 'items-center',
      align === 'baseline' && 'items-baseline',
      align === 'stretch' && 'items-stretch',
      // Gap
      gap === 0 && 'gap-0',
      gap === 1 && 'gap-1',
      gap === 2 && 'gap-2',
      gap === 3 && 'gap-3',
      gap === 4 && 'gap-4',
      gap === 5 && 'gap-5',
      gap === 6 && 'gap-6',
      gap === 8 && 'gap-8',
      gap === 10 && 'gap-10',
      // Wrap
      wrap && 'flex-wrap',
      className
    );

    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...stackProps 
    } = props;

    return (
      <div 
        className={stackClass} 
        {...stackProps}
        // Apply designer props
        data-obj-id={dataObjId}
        data-obj-type={dataObjType}
        style={style}
      >
        {schema.children && renderChildren(schema.children)}
      </div>
    );
  },
  {
    label: 'Stack',
    inputs: [
      { 
        name: 'direction', 
        type: 'enum', 
        label: 'Direction', 
        enum: ['col', 'row', 'col-reverse', 'row-reverse'], 
        defaultValue: 'col' 
      },
      { 
        name: 'gap', 
        type: 'number', 
        label: 'Gap', 
        defaultValue: 2 
      },
      { 
        name: 'align', 
        type: 'enum', 
        label: 'Align Items',
        enum: ['start', 'end', 'center', 'stretch', 'baseline'],
        defaultValue: 'stretch'
      },
      { 
        name: 'justify', 
        type: 'enum', 
        label: 'Justify Content',
        enum: ['start', 'end', 'center', 'between', 'around', 'evenly'],
        defaultValue: 'start'
      },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      direction: 'col',
      gap: 2,
      align: 'stretch',
      children: []
    },
    isContainer: true,
    resizable: true,
    resizeConstraints: {
        width: true,
        height: true,
        minWidth: 100,
        minHeight: 50
    }
  }
);
