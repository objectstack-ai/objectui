import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';

const meta: Meta = {
  title: 'Components/Table',
  component: SchemaRenderer,
  tags: ['autodocs'],
  argTypes: {
    // Schema properties
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DataTable: Story = {
  args: {
    type: 'data-table',
    caption: 'Employees',
    columns: [
        { header: 'ID', accessorKey: 'id', width: '80px' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Role', accessorKey: 'role' },
    ],
    data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
    ]
  },
  render: (args) => <SchemaRenderer schema={args} />
};

export const FullFeatures: Story = {
    args: {
      type: 'data-table',
      caption: 'Full Feature Table',
      searchable: true,
      pagination: true,
      selectable: true,
      sortable: true,
      exportable: true,
      rowActions: true,
      pageSize: 5,
      columns: [
          { header: 'Invoice', accessorKey: 'invoice' },
          { header: 'Status', accessorKey: 'status' },
          { header: 'Amount', accessorKey: 'amount', enableSorting: true },
          { header: 'Method', accessorKey: 'method' }
      ],
      data: Array.from({ length: 20 }).map((_, i) => ({
          invoice: `INV-${1000 + i}`,
          status: i % 3 === 0 ? 'Paid' : 'Pending',
          amount: `$${(Math.random() * 500).toFixed(2)}`,
          method: i % 2 === 0 ? 'Credit Card' : 'PayPal'
      }))
    },
    render: (args) => <SchemaRenderer schema={args} />
  };

export const EditableTable: Story = {
    args: {
      type: 'data-table',
      caption: 'Editable Product Inventory - Simple Cell Editing',
      searchable: false,
      pagination: false,
      editable: true,
      columns: [
          { header: 'SKU', accessorKey: 'sku', width: '100px', editable: false },
          { header: 'Product Name', accessorKey: 'name' },
          { header: 'Price', accessorKey: 'price' },
          { header: 'Stock', accessorKey: 'stock' }
      ],
      data: [
          { sku: 'PROD-001', name: 'Laptop', price: '$1299.99', stock: 15 },
          { sku: 'PROD-002', name: 'Mouse', price: '$29.99', stock: 120 },
          { sku: 'PROD-003', name: 'Keyboard', price: '$79.99', stock: 45 },
          { sku: 'PROD-004', name: 'Monitor', price: '$399.99', stock: 22 }
      ],
      onCellChange: (rowIndex: number, columnKey: string, newValue: any, row: any) => {
        console.log('Cell edited:', { rowIndex, columnKey, newValue, row });
        alert(`Updated ${columnKey} to "${newValue}" for ${row.name}`);
      }
    },
    render: (args) => <SchemaRenderer schema={args} />
  };

export const BatchEditTable: Story = {
    args: {
      type: 'data-table',
      caption: 'Batch Edit Mode - Edit Multiple Rows & Save Together (💡 Double-click cells to edit, then see save buttons appear)',
      searchable: false,
      pagination: false,
      editable: true,
      rowActions: true,
      columns: [
          { header: 'ID', accessorKey: 'id', width: '60px', editable: false },
          { header: 'Product Name', accessorKey: 'name' },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Price', accessorKey: 'price' },
          { header: 'Stock', accessorKey: 'stock' }
      ],
      data: [
          { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: '$29.99', stock: 50 },
          { id: 2, name: 'USB-C Cable', category: 'Accessories', price: '$12.99', stock: 100 },
          { id: 3, name: 'Laptop Stand', category: 'Accessories', price: '$45.99', stock: 25 },
          { id: 4, name: 'Webcam HD', category: 'Electronics', price: '$79.99', stock: 15 },
          { id: 5, name: 'Desk Lamp', category: 'Furniture', price: '$34.99', stock: 30 }
      ],
      onRowSave: async (rowIndex: number, changes: Record<string, any>, row: any) => {
        console.log('Saving single row:', { rowIndex, changes, row });
        await new Promise(resolve => setTimeout(resolve, 500));
        alert(`✓ Saved changes for "${row.name}":\n${JSON.stringify(changes, null, 2)}`);
      },
      onBatchSave: async (allChanges: Array<{ rowIndex: number; changes: Record<string, any>; row: any }>) => {
        console.log('Batch saving all rows:', allChanges);
        await new Promise(resolve => setTimeout(resolve, 800));
        const summary = allChanges.map(c => `${c.row.name}: ${Object.keys(c.changes).length} field(s)`).join('\n');
        alert(`✓ Batch saved ${allChanges.length} rows:\n\n${summary}`);
      }
    },
    render: (args) => <SchemaRenderer schema={args} />
  };

