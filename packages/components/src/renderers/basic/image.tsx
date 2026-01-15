import { ComponentRegistry } from '@object-ui/core';
import type { ImageSchema } from '@object-ui/types';

ComponentRegistry.register('image',
  ({ schema, className, ...props }: { schema: ImageSchema; className?: string; [key: string]: any }) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...imgProps 
    } = props;

    return (
    <img
      src={schema.src}
      alt={schema.alt || ''}
      className={className}
      {...imgProps}
      // Apply designer props
      data-obj-id={dataObjId}
      data-obj-type={dataObjType}
      style={style}
    />
  );
  },
  {
    label: 'Image',
    icon: 'image',
    category: 'basic',
    inputs: [
      { name: 'src', type: 'string', label: 'Source URL' },
      { name: 'alt', type: 'string', label: 'Alt Text' },
      { name: 'className', type: 'string', label: 'Classes' }
    ]
  }
);
