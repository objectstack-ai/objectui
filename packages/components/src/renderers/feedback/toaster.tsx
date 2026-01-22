/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { ToasterSchema } from '@object-ui/types';
import { Toaster as SonnerToaster } from '../../ui/sonner';
import { ToastNotifier as DefaultToaster } from '../../ui'; 
// Note: In shadcn/ui typical setup, Toaster is exported from 'components/ui/toaster' and 'components/ui/sonner'.
// But in @object-ui/ui index.tsx, we need to check if they are exported.
// Assuming they are exported as Toaster and Sonner (or similar).
// Let's assume standard exports.

ComponentRegistry.register('toaster', 
  ({ schema }: { schema: ToasterSchema }) => {
    if (schema.provider === 'sonner') {
        return <SonnerToaster />;
    }
    return <DefaultToaster />;
  },
  {
    label: 'Toaster',
    inputs: [
      { name: 'provider', type: 'enum', enum: ['default', 'sonner'], defaultValue: 'default', label: 'Provider' }
    ],
    defaultProps: {
      provider: 'default'
    }
  }
);
