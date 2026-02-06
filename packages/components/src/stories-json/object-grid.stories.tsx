import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import type { BaseSchema } from '@object-ui/types';
import { createStorybookDataSource } from '@storybook-config/datasource';

const meta = {
  title: 'Plugins/Data Views/Object Grid',
  component: SchemaRenderer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    schema: { table: { disable: true } },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create a DataSource instance that connects to MSW
const dataSource = createStorybookDataSource();

const renderStory = (args: any) => (
  <SchemaRendererProvider dataSource={dataSource}>
    <SchemaRenderer schema={args as unknown as BaseSchema} />
  </SchemaRendererProvider>
);

export const UserGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'User',
    columns: [
      { field: 'id', header: 'ID', width: 80 },
      { field: 'name', header: 'Name', sortable: true, filterable: true },
      { field: 'email', header: 'Email', sortable: true, filterable: true },
      { field: 'role', header: 'Role', sortable: true },
      { field: 'status', header: 'Status', sortable: true }
    ],
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' }
    ],
    pagination: true,
    pageSize: 10,
    className: 'w-full'
  } as any,
};

export const ProductGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'Product',
    columns: [
      { field: 'sku', header: 'SKU', width: 120 },
      { field: 'name', header: 'Product Name', sortable: true, filterable: true },
      { field: 'category', header: 'Category', sortable: true, filterable: true },
      { field: 'price', header: 'Price', sortable: true, type: 'currency' },
      { field: 'stock', header: 'In Stock', sortable: true, type: 'number' }
    ],
    data: [
      { sku: 'PROD-001', name: 'Laptop', category: 'Electronics', price: 1299.99, stock: 15 },
      { sku: 'PROD-002', name: 'Mouse', category: 'Electronics', price: 29.99, stock: 120 },
      { sku: 'PROD-003', name: 'Desk Chair', category: 'Furniture', price: 249.99, stock: 8 },
      { sku: 'PROD-004', name: 'Monitor', category: 'Electronics', price: 399.99, stock: 22 }
    ],
    pagination: true,
    pageSize: 5,
    className: 'w-full'
  } as any,
};

export const WithActions: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'Order',
    columns: [
      { field: 'orderId', header: 'Order ID', width: 120 },
      { field: 'customer', header: 'Customer', sortable: true },
      { field: 'date', header: 'Order Date', sortable: true, type: 'date' },
      { field: 'total', header: 'Total', sortable: true, type: 'currency' },
      { field: 'status', header: 'Status', sortable: true }
    ],
    actions: [
      { label: 'View', action: 'view' },
      { label: 'Edit', action: 'edit' },
      { label: 'Delete', action: 'delete', variant: 'destructive' }
    ],
    data: [
      { orderId: 'ORD-1001', customer: 'Alice Brown', date: '2024-01-15', total: 159.99, status: 'Completed' },
      { orderId: 'ORD-1002', customer: 'Charlie Davis', date: '2024-01-18', total: 89.50, status: 'Processing' },
      { orderId: 'ORD-1003', customer: 'Eve Wilson', date: '2024-01-20', total: 299.99, status: 'Shipped' }
    ],
    pagination: true,
    pageSize: 10,
    className: 'w-full'
  } as any,
};

/**
 * Contacts Grid - Uses MSW-backed data from ObjectStack runtime
 * 
 * This story demonstrates integration with the MSW plugin runtime mode.
 * Data is fetched from /api/v1/data/contact via the ObjectStack kernel.
 */
export const ContactsGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'contact',
    data: {
      provider: 'object',
      object: 'contact',
    },
    columns: [
      { field: 'name', header: 'Name', sortable: true, filterable: true },
      { field: 'email', header: 'Email', sortable: true, filterable: true },
      { field: 'title', header: 'Title', sortable: true },
      { field: 'company', header: 'Company', sortable: true },
      { field: 'status', header: 'Status', sortable: true }
    ],
    pagination: true,
    pageSize: 10,
    className: 'w-full'
  } as any,
};

/**
 * Opportunities Grid - Uses MSW-backed data from ObjectStack runtime
 * 
 * This story demonstrates fetching opportunity data from the MSW runtime.
 */
export const OpportunitiesGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'opportunity',
    data: {
      provider: 'object',
      object: 'opportunity',
    },
    columns: [
      { field: 'name', header: 'Name', sortable: true, filterable: true },
      { field: 'amount', header: 'Amount', sortable: true, type: 'currency' },
      { field: 'stage', header: 'Stage', sortable: true },
      { field: 'closeDate', header: 'Close Date', sortable: true, type: 'date' }
    ],
    pagination: true,
    pageSize: 10,
    className: 'w-full'
  } as any,
};

/**
 * Editable Grid - Simple Inline Cell Editing
 * 
 * This story demonstrates basic inline editing capabilities:
 * - Double-click or press Enter to edit a cell
 * - Press Enter to save, Escape to cancel
 * - ID column is read-only (editable: false)
 * - Changes are immediately reported via onCellChange callback
 */
export const EditableGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'User',
    columns: [
      { field: 'id', header: 'ID', width: 80, editable: false },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'email', header: 'Email', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      { field: 'status', header: 'Status', sortable: true }
    ],
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
      { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User', status: 'Active' }
    ],
    editable: true,
    pagination: false,
    className: 'w-full',
    onCellChange: (rowIndex: number, columnKey: string, newValue: any, row: any) => {
      console.log('Cell changed:', { rowIndex, columnKey, newValue, row });
      alert(`✓ Cell updated immediately:\n${columnKey} = "${newValue}"`);
    }
  } as any,
};

/**
 * Batch Edit Grid - Multi-Row Editing with Batch Save
 * 
 * **💡 How to use:**
 * 1. Double-click any cell (except SKU) to start editing
 * 2. Press Enter to confirm the edit (cell becomes highlighted in amber)
 * 3. Edit more cells across different rows
 * 4. Watch the toolbar appear showing "X rows modified" with Save/Cancel buttons
 * 5. Row-level save buttons (✓) appear in the Actions column for edited rows
 * 6. Click "Save All" to batch save, or click row save buttons individually
 * 
 * **Features demonstrated:**
 * - Edit multiple cells across multiple rows
 * - Modified rows are highlighted with amber background
 * - Modified cells shown in bold amber text
 * - Row-level save/cancel buttons appear after editing
 * - Batch save all changes at once using "Save All" button
 * - Cancel changes per row or all at once
 * - Toolbar shows count of modified rows
 */
export const BatchEditGrid: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'Product',
    columns: [
      { field: 'sku', header: 'SKU', width: 120, editable: false },
      { field: 'name', header: 'Product Name', sortable: true },
      { field: 'category', header: 'Category', sortable: true },
      { field: 'price', header: 'Price', sortable: true },
      { field: 'stock', header: 'Stock', sortable: true }
    ],
    data: [
      { sku: 'PROD-001', name: 'Laptop', category: 'Electronics', price: '$1299.99', stock: 15 },
      { sku: 'PROD-002', name: 'Mouse', category: 'Electronics', price: '$29.99', stock: 120 },
      { sku: 'PROD-003', name: 'Keyboard', category: 'Accessories', price: '$79.99', stock: 45 },
      { sku: 'PROD-004', name: 'Monitor', category: 'Electronics', price: '$399.99', stock: 22 },
      { sku: 'PROD-005', name: 'USB Cable', category: 'Accessories', price: '$12.99', stock: 200 }
    ],
    editable: true,
    pagination: false,
    rowActions: true,
    className: 'w-full',
    onRowSave: async (rowIndex: number, changes: Record<string, any>, row: any) => {
      console.log('Saving row:', { rowIndex, changes, row });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const changeList = Object.entries(changes).map(([k, v]) => `  ${k}: "${v}"`).join('\n');
      alert(`✓ Saved changes for "${row.name}":\n\n${changeList}`);
    },
    onBatchSave: async (allChanges: Array<{ rowIndex: number; changes: Record<string, any>; row: any }>) => {
      console.log('Batch saving:', allChanges);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const summary = allChanges.map(c => 
        `${c.row.name}: ${Object.keys(c.changes).join(', ')}`
      ).join('\n');
      alert(`✓ Batch saved ${allChanges.length} rows:\n\n${summary}`);
    }
  } as any,
};

/**
 * Advanced Batch Editing - Real-World Inventory Management
 * 
 * **💡 Instructions:**
 * - Double-click any cell (except ID and SKU which are read-only)
 * - Make edits across multiple rows and pages
 * - Save buttons appear in Actions column after editing
 * - Batch save toolbar appears when there are pending changes
 * 
 * **Complete workflow demonstration:**
 * - Large dataset with pagination
 * - Multiple editable fields
 * - Read-only columns (ID, SKU)
 * - Both row-level and batch save operations
 * - Search and filter capabilities
 */
export const AdvancedBatchEdit: Story = {
  render: renderStory,
  args: {
    type: 'object-grid',
    objectName: 'Inventory',
    columns: [
      { field: 'id', header: 'ID', width: 60, editable: false },
      { field: 'sku', header: 'SKU', width: 100, editable: false },
      { field: 'name', header: 'Product Name', sortable: true },
      { field: 'category', header: 'Category', sortable: true },
      { field: 'price', header: 'Price ($)', sortable: true },
      { field: 'stock', header: 'Stock', sortable: true },
      { field: 'reorderLevel', header: 'Reorder At', sortable: true }
    ],
    data: [
      { id: 1, sku: 'ELEC-001', name: 'Wireless Mouse', category: 'Electronics', price: '29.99', stock: 45, reorderLevel: 20 },
      { id: 2, sku: 'ELEC-002', name: 'USB Keyboard', category: 'Electronics', price: '49.99', stock: 32, reorderLevel: 15 },
      { id: 3, sku: 'FURN-001', name: 'Desk Lamp', category: 'Furniture', price: '34.99', stock: 18, reorderLevel: 10 },
      { id: 4, sku: 'ELEC-003', name: 'Webcam HD', category: 'Electronics', price: '79.99', stock: 12, reorderLevel: 10 },
      { id: 5, sku: 'ACC-001', name: 'HDMI Cable', category: 'Accessories', price: '15.99', stock: 150, reorderLevel: 50 },
      { id: 6, sku: 'FURN-002', name: 'Monitor Stand', category: 'Furniture', price: '45.99', stock: 28, reorderLevel: 12 },
      { id: 7, sku: 'ELEC-004', name: 'USB Hub', category: 'Electronics', price: '24.99', stock: 65, reorderLevel: 25 },
      { id: 8, sku: 'ACC-002', name: 'Mouse Pad', category: 'Accessories', price: '9.99', stock: 200, reorderLevel: 75 }
    ],
    editable: true,
    pagination: true,
    pageSize: 5,
    rowActions: true,
    className: 'w-full',
    onRowSave: async (rowIndex: number, changes: Record<string, any>, row: any) => {
      console.log('Saving inventory row:', { rowIndex, changes, row });
      await new Promise(resolve => setTimeout(resolve, 600));
      alert(`✓ Updated inventory for "${row.name}"\n\nChanges:\n${JSON.stringify(changes, null, 2)}`);
    },
    onBatchSave: async (allChanges: Array<{ rowIndex: number; changes: Record<string, any>; row: any }>) => {
      console.log('Batch updating inventory:', allChanges);
      await new Promise(resolve => setTimeout(resolve, 1200));
      alert(`✓ Batch updated ${allChanges.length} inventory items\n\nProcessed successfully!`);
    }
  } as any,
};

