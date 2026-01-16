import { ComponentRegistry } from '@object-ui/core';
import type { ProgressSchema } from '@object-ui/types';
import { Progress } from '../../ui';

ComponentRegistry.register('progress', 
  ({ schema, className, ...props }: { schema: ProgressSchema; className?: string; [key: string]: any }) => (
    <Progress value={schema.value} className={className} {...props} />
  ),
  {
    label: 'Progress',
    inputs: [
      { name: 'value', type: 'number', label: 'Value', defaultValue: 0 },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      value: 50,
      className: 'w-full'
    }
  }
);
