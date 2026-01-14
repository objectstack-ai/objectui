import { ComponentRegistry } from '@object-ui/core';
import { Markdown } from '@/ui';

ComponentRegistry.register('markdown', 
  ({ schema, className, ...props }) => (
    <Markdown 
      content={schema.content || ''} 
      className={className}
      {...props}
    />
  ),
  {
    label: 'Markdown',
    inputs: [
      { 
        name: 'content', 
        type: 'string', 
        label: 'Markdown Content', 
        required: true,
        inputType: 'textarea'
      },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      content: '# Hello World\n\nThis is a **markdown** component with *formatting* support.\n\n- Item 1\n- Item 2\n- Item 3',
    }
  }
);
