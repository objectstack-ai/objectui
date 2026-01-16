import { ComponentRegistry } from '@object-ui/core';
import type { SkeletonSchema } from '@object-ui/types';
import { Skeleton } from '../../ui';

ComponentRegistry.register('skeleton', 
  ({ schema, className, ...props }: { schema: SkeletonSchema; className?: string; [key: string]: any }) => (
    <Skeleton className={className} {...props} style={{ width: schema.width, height: schema.height }} />
  ),
  {
    label: 'Skeleton',
    inputs: [
      { name: 'width', type: 'string', label: 'Width' },
      { name: 'height', type: 'string', label: 'Height' },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      width: '100%',
      height: '20px',
      className: 'rounded-md'
    }
  }
);
