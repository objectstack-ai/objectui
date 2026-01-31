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

ComponentRegistry.register('toaster', 
  () => {
    return <SonnerToaster />;
  },
  {
    namespace: 'ui',
    label: 'Toaster',
    inputs: [],
    defaultProps: {}
  }
);
