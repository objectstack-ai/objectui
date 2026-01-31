import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';
import type { BaseSchema } from '@object-ui/types';
import { mockData } from '@storybook-config/msw-handlers';

/**
 * Data Display Components - Complete Coverage with MSW
 * 
 * Components covered:
 * - Badge (status indicators)
 * - Avatar (user images)
 * - List (item lists)
 * - Table (data tables)
 * - Tree View (hierarchical data)
 * - Statistic (KPI display)
 * - Card (content containers)
 * - Kbd (keyboard shortcuts)
 */

const meta = {
  title: 'Components/Data Display/All',
  component: SchemaRenderer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    schema: { table: { disable: true } },
  },
} satisfies Meta<typeof SchemaRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== BADGE ==========

export const BadgeDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'badge',
    children: [{ type: 'text', content: 'Default' }],
  } as any,
};

export const BadgeVariants: Story = {
  render: (args) => (
    <div className="flex gap-2 flex-wrap">
      <SchemaRenderer schema={{ type: 'badge', variant: 'default', children: [{ type: 'text', content: 'Default' }] } as any} />
      <SchemaRenderer schema={{ type: 'badge', variant: 'secondary', children: [{ type: 'text', content: 'Secondary' }] } as any} />
      <SchemaRenderer schema={{ type: 'badge', variant: 'destructive', children: [{ type: 'text', content: 'Destructive' }] } as any} />
      <SchemaRenderer schema={{ type: 'badge', variant: 'outline', children: [{ type: 'text', content: 'Outline' }] } as any} />
    </div>
  ),
  args: {} as any,
};

export const BadgeWithData: Story = {
  render: (args) => (
    <div className="flex gap-2 flex-wrap">
      {mockData.tasks.slice(0, 10).map((task) => (
        <SchemaRenderer 
          key={task.id}
          schema={{ 
            type: 'badge', 
            variant: task.status === 'done' ? 'default' : task.status === 'in-progress' ? 'secondary' : 'outline',
            children: [{ type: 'text', content: task.status }] 
          } as any} 
        />
      ))}
    </div>
  ),
  args: {} as any,
};

// ========== AVATAR ==========

export const AvatarDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'avatar',
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User Avatar',
  } as any,
};

export const AvatarSizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <SchemaRenderer schema={{ type: 'avatar', src: 'https://i.pravatar.cc/150?img=1', className: 'h-8 w-8' } as any} />
      <SchemaRenderer schema={{ type: 'avatar', src: 'https://i.pravatar.cc/150?img=2', className: 'h-12 w-12' } as any} />
      <SchemaRenderer schema={{ type: 'avatar', src: 'https://i.pravatar.cc/150?img=3', className: 'h-16 w-16' } as any} />
      <SchemaRenderer schema={{ type: 'avatar', src: 'https://i.pravatar.cc/150?img=4', className: 'h-20 w-20' } as any} />
    </div>
  ),
  args: {} as any,
};

export const AvatarWithFallback: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'avatar',
    fallback: 'JD',
  } as any,
};

export const AvatarList: Story = {
  render: (args) => (
    <div className="flex -space-x-2">
      {mockData.users.slice(0, 5).map((user, i) => (
        <SchemaRenderer 
          key={user.id}
          schema={{ 
            type: 'avatar', 
            src: `https://i.pravatar.cc/150?img=${i + 1}`,
            alt: user.name,
            className: 'border-2 border-white'
          } as any} 
        />
      ))}
    </div>
  ),
  args: {} as any,
};

// ========== STATISTIC ==========

export const StatisticDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'statistic',
    title: 'Total Revenue',
    value: '$125,000',
    trend: 'up',
    change: '12.5%',
  } as any,
};

export const StatisticDashboard: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      <SchemaRenderer 
        schema={{ 
          type: 'statistic', 
          title: 'Revenue',
          value: '$' + mockData.dashboardMetrics.revenue.value.toLocaleString(),
          trend: mockData.dashboardMetrics.revenue.trend,
          change: mockData.dashboardMetrics.revenue.change + '%',
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'statistic', 
          title: 'Users',
          value: mockData.dashboardMetrics.users.value.toLocaleString(),
          trend: mockData.dashboardMetrics.users.trend,
          change: mockData.dashboardMetrics.users.change + '%',
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'statistic', 
          title: 'Orders',
          value: mockData.dashboardMetrics.orders.value.toLocaleString(),
          trend: mockData.dashboardMetrics.orders.trend,
          change: mockData.dashboardMetrics.orders.change + '%',
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'statistic', 
          title: 'Conversion',
          value: mockData.dashboardMetrics.conversion.value + '%',
          trend: mockData.dashboardMetrics.conversion.trend,
          change: mockData.dashboardMetrics.conversion.change + '%',
        } as any} 
      />
    </div>
  ),
  args: {} as any,
};

// ========== CARD ==========

export const CardDefault: Story = {
  render: (args) => (
    <div className="w-[350px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'card',
    children: [
      {
        type: 'div',
        className: 'p-6',
        children: [
          { type: 'text', content: 'Card Title', className: 'text-xl font-bold mb-2' },
          { type: 'text', content: 'This is the card content. You can put any components here.', className: 'text-gray-600' },
        ],
      },
    ],
  } as any,
};

export const CardWithData: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-4 w-[700px]">
      {mockData.contacts.slice(0, 4).map((contact) => (
        <SchemaRenderer 
          key={contact.id}
          schema={{ 
            type: 'card',
            children: [
              {
                type: 'div',
                className: 'p-6 space-y-2',
                children: [
                  { type: 'text', content: contact.name, className: 'text-lg font-bold' },
                  { type: 'text', content: contact.email, className: 'text-sm text-gray-600' },
                  { type: 'text', content: contact.company, className: 'text-sm text-gray-500' },
                  { 
                    type: 'badge', 
                    variant: contact.status === 'active' ? 'default' : 'secondary',
                    children: [{ type: 'text', content: contact.status }] 
                  },
                ],
              },
            ],
          } as any} 
        />
      ))}
    </div>
  ),
  args: {} as any,
};

// ========== KBD ==========

export const KbdDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'kbd',
    children: [{ type: 'text', content: 'Ctrl' }],
  } as any,
};

export const KbdShortcuts: Story = {
  render: (args) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm w-32">Copy:</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'Ctrl' }] } as any} />
        <span>+</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'C' }] } as any} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm w-32">Paste:</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'Ctrl' }] } as any} />
        <span>+</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'V' }] } as any} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm w-32">Save:</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'Ctrl' }] } as any} />
        <span>+</span>
        <SchemaRenderer schema={{ type: 'kbd', children: [{ type: 'text', content: 'S' }] } as any} />
      </div>
    </div>
  ),
  args: {} as any,
};

// ========== LIST ==========

export const ListDefault: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'list',
    items: [
      { id: '1', content: 'Item 1' },
      { id: '2', content: 'Item 2' },
      { id: '3', content: 'Item 3' },
    ],
  } as any,
};

export const ListWithData: Story = {
  render: (args) => (
    <div className="w-[500px] border rounded-lg p-4">
      <h3 className="font-bold mb-4">Recent Tasks</h3>
      <div className="space-y-2">
        {mockData.tasks.slice(0, 5).map((task) => (
          <div key={task.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex-1">
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-gray-600">{task.description}</div>
            </div>
            <SchemaRenderer 
              schema={{ 
                type: 'badge', 
                variant: task.status === 'done' ? 'default' : 'outline',
                children: [{ type: 'text', content: task.status }] 
              } as any} 
            />
          </div>
        ))}
      </div>
    </div>
  ),
  args: {} as any,
};

// ========== TABLE ==========

export const TableDefault: Story = {
  render: (args) => (
    <div className="w-[700px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'table',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'status', header: 'Status' },
    ],
    data: mockData.contacts.slice(0, 5),
  } as any,
};

export const TableWithActions: Story = {
  render: (args) => (
    <div className="w-[800px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'table',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'company', header: 'Company' },
      { key: 'status', header: 'Status' },
      { key: 'actions', header: 'Actions' },
    ],
    data: mockData.contacts.slice(0, 10),
  } as any,
};
