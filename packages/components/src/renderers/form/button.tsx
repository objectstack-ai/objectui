/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { ButtonSchema } from '@object-ui/types';
import { Button } from '../../ui';
import { renderChildren } from '../../lib/utils';
import { forwardRef } from 'react';

const ButtonRenderer = forwardRef<HTMLButtonElement, { schema: ButtonSchema; [key: string]: any }>(
  ({ schema, ...props }, ref) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...buttonProps 
    } = props;

    return (
    <Button 
        ref={ref}
        variant={schema.variant} 
        size={schema.size} 
        className={schema.className} 
        {...buttonProps}
        // Apply designer props
        {...{ 'data-obj-id': dataObjId, 'data-obj-type': dataObjType, style }}
    >
      {schema.label || renderChildren(schema.body || schema.children)}
    </Button>
  );
  }
);
ButtonRenderer.displayName = 'ButtonRenderer';

ComponentRegistry.register('button', ButtonRenderer,
  {
    namespace: 'ui',
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
