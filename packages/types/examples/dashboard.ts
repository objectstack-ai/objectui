/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Example: Dashboard Layout
 * 
 * This example demonstrates a complete dashboard layout with
 * sidebar, header, and data table.
 */

import type { BaseSchema, FlexLayoutProps, SidebarSchema, HeaderBarSchema, CardSchema, DataTableSchema } from '../src/index';

// An authored `flex` node takes its props, the child list included, in its
// `properties` bag (objectui#11276); `satisfies FlexLayoutProps` checks each bag.
export const dashboardSchema: BaseSchema = {
  type: 'flex',
  className: 'h-screen',
  properties: {
    direction: 'col',
    children: [
      // Header
      {
        type: 'header-bar',
        crumbs: [{ label: 'Object UI Dashboard' }],
        actions: [
          {
            type: 'button',
            label: 'Profile',
            variant: 'ghost',
            icon: 'User'
          }
        ]
      } as HeaderBarSchema,

      // Main content with sidebar
      {
        type: 'flex',
        className: 'flex-1',
        properties: {
          direction: 'row',
          children: [
            // Sidebar
            {
              type: 'sidebar',
              collapsible: true,
              nav: [
                { label: 'Dashboard', href: '/', icon: 'Home', active: true },
                { label: 'Users', href: '/users', icon: 'Users' },
                { label: 'Settings', href: '/settings', icon: 'Settings' }
              ]
            } as SidebarSchema,

            // Main content area
            {
              type: 'container',
              className: 'flex-1 p-6',
              children: [
                {
                  type: 'card',
                  title: 'User Management',
                  description: 'Manage your users and permissions',
                  content: {
                    type: 'data-table',
                    columns: [
                      { header: 'ID', accessorKey: 'id', width: '80px' },
                      { header: 'Name', accessorKey: 'name' },
                      { header: 'Email', accessorKey: 'email' },
                      { header: 'Role', accessorKey: 'role' },
                      { header: 'Status', accessorKey: 'status' }
                    ],
                    data: [
                      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
                      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
                      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' }
                    ],
                    pagination: true,
                    pageSize: 10,
                    searchable: true,
                    selectable: true,
                    sortable: true,
                    exportable: true,
                    rowActions: true,
                    onRowEdit: (row) => console.log('Edit:', row),
                    onRowDelete: (row) => console.log('Delete:', row)
                  } as DataTableSchema
                } as CardSchema
              ]
            }
          ]
        } satisfies FlexLayoutProps
      }
    ]
  } satisfies FlexLayoutProps
};
