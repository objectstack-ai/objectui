import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '@object-ui/react';
import type { BaseSchema } from '@object-ui/types';

const meta = {
  title: 'JSON/Complex/Data Table',
  component: SchemaRenderer,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    schema: { table: { disable: true } }
  }
} satisfies Meta<typeof SchemaRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderStory = (args: any) => <SchemaRenderer schema={args as unknown as BaseSchema} />;

export const Default: Story = {
  render: renderStory,
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
  } as any,
};

export const FullFeatures: Story = {
    render: renderStory,
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
          { header: 'ID', accessorKey: 'id', width: '60px' },
          { header: 'Product', accessorKey: 'product' },
          { header: 'Price', accessorKey: 'price' },
          { header: 'Stock', accessorKey: 'stock' },
      ],
      data: Array.from({length: 20}).map((_, i) => ({
          id: i + 1,
          product: `Product ${i + 1}`,
          price: `$${(Math.random() * 100).toFixed(2)}`,
          stock: Math.floor(Math.random() * 50)
      }))
    } as any,
  };
