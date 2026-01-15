import { ComponentRegistry } from '@object-ui/core';
import type { BadgeSchema } from '@object-ui/types';
import { Badge } from '@/ui';
import { renderChildren } from '../../lib/utils';

ComponentRegistry.register('badge', 
  ({ schema, ...props }: { schema: BadgeSchema; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style,
        ...badgeProps
    } = props;
    
    return (
    <Badge 
        variant={schema.variant} 
        className={schema.className} 
        {...badgeProps}
        // Apply designer props
        {...{ 'data-obj-id': dataObjId, 'data-obj-type': dataObjType, style }}
    >
      {schema.label || renderChildren(schema.body)}
    </Badge>
  );
  },
  {
    label: 'Badge',
    inputs: [
      { name: 'label', type: 'string', label: 'Label' },
      { 
        name: 'variant', 
        type: 'enum', 
        enum: ['default', 'secondary', 'destructive', 'outline'], 
        defaultValue: 'default',
        label: 'Variant'
      },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      label: 'Badge',
      variant: 'default'
    }
  }
);
