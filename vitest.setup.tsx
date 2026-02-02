/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import '@testing-library/jest-dom';
import React from 'react';

// Import packages to register components (side-effect imports)
import '@object-ui/components'; // Register all ObjectUI components
import '@object-ui/fields'; // Register field widgets
import '@object-ui/plugin-dashboard'; // Register dashboard components
import '@object-ui/plugin-grid'; // Register grid components

// Manually re-register basic text component to override field widget
// This is necessary because @object-ui/fields has @object-ui/components as a dependency,
// so components gets loaded BEFORE fields registers its widgets, causing fields to overwrite.
import { ComponentRegistry } from '@object-ui/core';
import type { TextSchema } from '@object-ui/types';

ComponentRegistry.register('text', 
  ({ schema, ...props }: { schema: TextSchema; [key: string]: any }) => {
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style,
        ...rest 
    } = props;

    if (dataObjId || schema.className || rest.className) {
        return (
            <span 
                data-obj-id={dataObjId}
                data-obj-type={dataObjType}
                style={style}
                className={schema.className || rest.className}
                {...rest}
            >
                {schema.content || schema.value}
            </span>
        );
    }

    return <>{schema.content || schema.value}</>;
  },
  {
    namespace: 'ui',
    label: 'Text',
  }
);

// Polyfill ResizeObserver for Radix UI (Shadcn) components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

