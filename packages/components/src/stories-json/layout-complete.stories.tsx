import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';
import type { BaseSchema } from '@object-ui/types';

/**
 * Layout Components - Complete Coverage with MSW
 * 
 * Components covered:
 * - Container
 * - Grid
 * - Flex
 * - Stack
 * - Spacer
 * - Divider
 * - Section
 * - Header/Footer
 * - Sidebar
 */

const meta = {
  title: 'Components/Layout/All',
  component: SchemaRenderer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    schema: { table: { disable: true } },
  },
} satisfies Meta<typeof SchemaRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== CONTAINER ==========

export const ContainerDefault: Story = {
  render: (args) => (
    <div className="bg-gray-100 p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'container',
    className: 'bg-white p-6 rounded shadow',
    children: [
      { type: 'text', content: 'Container content goes here', className: 'text-center' },
    ],
  } as any,
};

export const ContainerSizes: Story = {
  render: (args) => (
    <div className="bg-gray-100 p-4 space-y-4">
      <SchemaRenderer 
        schema={{ 
          type: 'container',
          className: 'bg-white p-4 rounded shadow max-w-sm',
          children: [{ type: 'text', content: 'Small Container (max-w-sm)' }],
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'container',
          className: 'bg-white p-4 rounded shadow max-w-md',
          children: [{ type: 'text', content: 'Medium Container (max-w-md)' }],
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'container',
          className: 'bg-white p-4 rounded shadow max-w-lg',
          children: [{ type: 'text', content: 'Large Container (max-w-lg)' }],
        } as any} 
      />
    </div>
  ),
  args: {} as any,
};

// ========== GRID ==========

export const GridDefault: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'grid',
    className: 'grid-cols-3 gap-4',
    children: [
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-blue-100 rounded', children: [{ type: 'text', content: 'Grid Item 1' }] }] },
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-green-100 rounded', children: [{ type: 'text', content: 'Grid Item 2' }] }] },
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-yellow-100 rounded', children: [{ type: 'text', content: 'Grid Item 3' }] }] },
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-red-100 rounded', children: [{ type: 'text', content: 'Grid Item 4' }] }] },
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-purple-100 rounded', children: [{ type: 'text', content: 'Grid Item 5' }] }] },
      { type: 'card', children: [{ type: 'div', className: 'p-4 bg-pink-100 rounded', children: [{ type: 'text', content: 'Grid Item 6' }] }] },
    ],
  } as any,
};

export const GridResponsive: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'grid',
    className: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    children: Array.from({ length: 8 }, (_, i) => ({
      type: 'card',
      children: [{
        type: 'div',
        className: 'p-4 bg-blue-100 rounded text-center',
        children: [{ type: 'text', content: `Item ${i + 1}` }],
      }],
    })),
  } as any,
};

// ========== FLEX ==========

export const FlexDefault: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'flex',
    className: 'gap-4',
    children: [
      { type: 'div', className: 'p-4 bg-blue-100 rounded flex-1', children: [{ type: 'text', content: 'Flex 1' }] },
      { type: 'div', className: 'p-4 bg-green-100 rounded flex-1', children: [{ type: 'text', content: 'Flex 2' }] },
      { type: 'div', className: 'p-4 bg-yellow-100 rounded flex-1', children: [{ type: 'text', content: 'Flex 3' }] },
    ],
  } as any,
};

export const FlexJustify: Story = {
  render: (args) => (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-sm mb-2">Justify Start</div>
        <SchemaRenderer 
          schema={{ 
            type: 'flex',
            className: 'gap-4 justify-start border p-4',
            children: [
              { type: 'div', className: 'p-2 bg-blue-100 rounded', children: [{ type: 'text', content: 'Item' }] },
              { type: 'div', className: 'p-2 bg-green-100 rounded', children: [{ type: 'text', content: 'Item' }] },
            ],
          } as any} 
        />
      </div>
      <div>
        <div className="text-sm mb-2">Justify Center</div>
        <SchemaRenderer 
          schema={{ 
            type: 'flex',
            className: 'gap-4 justify-center border p-4',
            children: [
              { type: 'div', className: 'p-2 bg-blue-100 rounded', children: [{ type: 'text', content: 'Item' }] },
              { type: 'div', className: 'p-2 bg-green-100 rounded', children: [{ type: 'text', content: 'Item' }] },
            ],
          } as any} 
        />
      </div>
      <div>
        <div className="text-sm mb-2">Justify Between</div>
        <SchemaRenderer 
          schema={{ 
            type: 'flex',
            className: 'gap-4 justify-between border p-4',
            children: [
              { type: 'div', className: 'p-2 bg-blue-100 rounded', children: [{ type: 'text', content: 'Item' }] },
              { type: 'div', className: 'p-2 bg-green-100 rounded', children: [{ type: 'text', content: 'Item' }] },
            ],
          } as any} 
        />
      </div>
    </div>
  ),
  args: {} as any,
};

// ========== STACK ==========

export const StackVertical: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'stack',
    className: 'space-y-4',
    children: [
      { type: 'div', className: 'p-4 bg-blue-100 rounded', children: [{ type: 'text', content: 'Stack Item 1' }] },
      { type: 'div', className: 'p-4 bg-green-100 rounded', children: [{ type: 'text', content: 'Stack Item 2' }] },
      { type: 'div', className: 'p-4 bg-yellow-100 rounded', children: [{ type: 'text', content: 'Stack Item 3' }] },
    ],
  } as any,
};

export const StackHorizontal: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'stack',
    className: 'flex space-x-4',
    children: [
      { type: 'div', className: 'p-4 bg-blue-100 rounded', children: [{ type: 'text', content: 'Item 1' }] },
      { type: 'div', className: 'p-4 bg-green-100 rounded', children: [{ type: 'text', content: 'Item 2' }] },
      { type: 'div', className: 'p-4 bg-yellow-100 rounded', children: [{ type: 'text', content: 'Item 3' }] },
    ],
  } as any,
};

// ========== SECTION ==========

export const SectionDefault: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'section',
    className: 'bg-white p-6 rounded shadow',
    children: [
      { type: 'text', content: 'Section Title', className: 'text-2xl font-bold mb-4' },
      { type: 'text', content: 'This is section content. Sections help organize your page into logical groups.', className: 'text-gray-600' },
    ],
  } as any,
};

export const SectionMultiple: Story = {
  render: (args) => (
    <div className="p-4 space-y-6">
      <SchemaRenderer 
        schema={{ 
          type: 'section',
          className: 'bg-white p-6 rounded shadow',
          children: [
            { type: 'text', content: 'Introduction', className: 'text-xl font-bold mb-2' },
            { type: 'text', content: 'Welcome to our application.', className: 'text-gray-600' },
          ],
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'section',
          className: 'bg-white p-6 rounded shadow',
          children: [
            { type: 'text', content: 'Features', className: 'text-xl font-bold mb-2' },
            { type: 'text', content: 'Here are the key features of our product.', className: 'text-gray-600' },
          ],
        } as any} 
      />
      <SchemaRenderer 
        schema={{ 
          type: 'section',
          className: 'bg-white p-6 rounded shadow',
          children: [
            { type: 'text', content: 'Get Started', className: 'text-xl font-bold mb-2' },
            { type: 'text', content: 'Ready to begin? Click the button below.', className: 'text-gray-600' },
            { type: 'button', props: { variant: 'default' }, children: [{ type: 'text', content: 'Start Now' }] },
          ],
        } as any} 
      />
    </div>
  ),
  args: {} as any,
};

// ========== BREADCRUMB ==========

export const BreadcrumbDefault: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'breadcrumb',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Laptops' },
    ],
  } as any,
};

export const BreadcrumbWithIcons: Story = {
  render: (args) => (
    <div className="p-4">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'breadcrumb',
    items: [
      { label: 'Home', href: '/', icon: 'Home' },
      { label: 'Settings', href: '/settings', icon: 'Settings' },
      { label: 'Profile' },
    ],
  } as any,
};

// ========== TABS ==========

export const TabsDefault: Story = {
  render: (args) => (
    <div className="p-4 w-[600px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'tabs',
    defaultValue: 'tab1',
    tabs: [
      {
        value: 'tab1',
        label: 'Overview',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Overview content goes here' }] },
      },
      {
        value: 'tab2',
        label: 'Details',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Details content goes here' }] },
      },
      {
        value: 'tab3',
        label: 'Settings',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Settings content goes here' }] },
      },
    ],
  } as any,
};

export const TabsVertical: Story = {
  render: (args) => (
    <div className="p-4 w-[600px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'tabs',
    defaultValue: 'tab1',
    orientation: 'vertical',
    tabs: [
      {
        value: 'tab1',
        label: 'Account',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Account settings' }] },
      },
      {
        value: 'tab2',
        label: 'Security',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Security settings' }] },
      },
      {
        value: 'tab3',
        label: 'Notifications',
        content: { type: 'div', className: 'p-4', children: [{ type: 'text', content: 'Notification preferences' }] },
      },
    ],
  } as any,
};
