import React from 'react';
import type { SchemaNode } from '@object-ui/protocol';
import { Button, Box } from '@object-ui/ui';

const ComponentRegistry: Record<string, React.FC<any>> = {
  'button': (props: any) => <Button {...props}>{props.schema.label}</Button>,
  'div': (props: any) => <Box {...props}>{props.children}</Box>,
  'page': (props: any) => <div className="p-8 max-w-4xl mx-auto">{props.children}</div>,
  'tpl': (props: any) => <span>{props.schema.tpl}</span>
};

export const SchemaRenderer: React.FC<{ schema: SchemaNode }> = ({ schema }) => {
  const Component = ComponentRegistry[schema.type];

  if (!Component) {
    return <div className="text-red-500">Unknown component type: {schema.type}</div>;
  }

  const { body, ...rest } = schema;

  return (
    <Component schema={schema} {...rest}>
      {body ? (
        Array.isArray(body) ? (
          body.map((child, idx) => <SchemaRenderer key={idx} schema={child} />)
        ) : (
          <SchemaRenderer schema={body} />
        )
      ) : null}
    </Component>
  );
};
