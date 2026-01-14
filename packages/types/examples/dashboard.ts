/**
 * Example: Dashboard Layout
 * 
 * This example demonstrates a complete dashboard layout with
 * sidebar, header, and data table.
 */

import type { FlexSchema, SidebarSchema, HeaderBarSchema, CardSchema, DataTableSchema } from '../src/index';

export const dashboardSchema: FlexSchema = {
  type: 'flex',
  direction: 'col',
  className: 'h-screen',
  
  children: [
    // Header
    {
      type: 'header-bar',
      title: 'Object UI Dashboard',
      logo: '/logo.svg',
      sticky: true,
      right: [
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
      direction: 'row',
      className: 'flex-1',
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
    }
  ]
};
