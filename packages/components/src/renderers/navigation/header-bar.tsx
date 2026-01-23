/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import type { HeaderBarSchema } from '@object-ui/types';
import {
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '../../ui';

ComponentRegistry.register('header-bar', 
  ({ schema }: { schema: HeaderBarSchema }) => (
    <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {schema.crumbs?.map((crumb: any, idx: number) => (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {idx === schema.crumbs.length - 1 ? (
                   <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                   <BreadcrumbLink href={crumb.href || '#'}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {idx < schema.crumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  ),
  {
    label: 'Header Bar',
    inputs: [
       { name: 'crumbs', type: 'array', label: 'Breadcrumbs' }
    ],
    defaultProps: {
      crumbs: [
        { label: 'Home', href: '#' },
        { label: 'Current Page' }
      ]
    }
  }
);
