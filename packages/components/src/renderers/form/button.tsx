import { ComponentRegistry } from '@object-ui/core';
import type { ButtonSchema } from '@object-ui/types';
import { Button } from '@/ui';
import { renderChildren } from '../../lib/utils';

ComponentRegistry.register('button', 
  ({ schema, ...props }: { schema: ButtonSchema; [key: string]: any }) => (
    <Button variant={schema.variant} size={schema.size} className={schema.className} {...props}>
      {schema.label || renderChildren(schema.body)}
    </Button>
  ),
  {
    label: 'Button',
    inputs: [
      { name: 'label', type: 'string', label: 'Label', defaultValue: 'Button' },
      { 
        name: 'variant', 
        type: 'enum', 
        label: 'Variant',
        enum: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
        defaultValue: 'default'
      },
      {
        name: 'size',
        type: 'enum',
        label: 'Size',
        enum: ['default', 'sm', 'lg', 'icon'],
        defaultValue: 'default'
      },
      { name: 'className', type: 'string', label: 'CSS Class', advanced: true }
    ],
    defaultProps: {
      label: 'Button',
      variant: 'default',
      size: 'default'
    }
  }
);
