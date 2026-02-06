/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { ObjectForm } from './ObjectForm';

export { ObjectForm };
export type { ObjectFormProps } from './ObjectForm';

// Register object-form component
const ObjectFormRenderer: React.FC<{ schema: any }> = ({ schema }) => {
  return <ObjectForm schema={schema} />;
};

ComponentRegistry.register('object-form', ObjectFormRenderer, {
  namespace: 'plugin-form',
  label: 'Object Form',
  category: 'plugin',
  inputs: [
    { name: 'objectName', type: 'string', label: 'Object Name', required: true },
    { name: 'fields', type: 'array', label: 'Fields' },
    { name: 'mode', type: 'enum', label: 'Mode', enum: ['create', 'edit', 'view'] },
  ]
});

// Register as view:form for the standard view protocol
// This allows using { type: 'view:form', objectName: '...' } in schemas
// skipFallback prevents overwriting the basic 'form' component from @object-ui/components
ComponentRegistry.register('form', ObjectFormRenderer, {
  namespace: 'view',
  skipFallback: true,
  label: 'Data Form View',
  category: 'view',
  inputs: [
    { name: 'objectName', type: 'string', label: 'Object Name', required: true },
    { name: 'fields', type: 'array', label: 'Fields' },
    { name: 'mode', type: 'enum', label: 'Mode', enum: ['create', 'edit', 'view'] },
  ]
});

// Note: 'form' type (without namespace) is handled by @object-ui/components Form component
// This plugin registers as 'view:form' (with view namespace) for the view protocol
// ObjectForm internally uses { type: 'form' } to render the basic Form component
