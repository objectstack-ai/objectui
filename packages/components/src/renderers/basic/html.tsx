import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import type { HtmlSchema } from '@object-ui/types';
import { cn } from '@/lib/utils';

ComponentRegistry.register('html', 
  ({ schema, className, ...props }: { schema: HtmlSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...htmlProps 
    } = props;

    return (
    <div 
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)} 
      dangerouslySetInnerHTML={{ __html: schema.html }}
      {...htmlProps}
      // Apply designer props
      data-obj-id={dataObjId}
      data-obj-type={dataObjType}
      style={style}
    />
    );
  },
  {
    label: 'HTML Content',
    inputs: [
      { name: 'html', type: 'string', label: 'HTML', description: 'Raw HTML content' }
    ]
  }
);
