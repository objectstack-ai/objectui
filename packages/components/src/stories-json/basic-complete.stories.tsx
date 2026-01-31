import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';
import type { BaseSchema } from '@object-ui/types';

/**
 * Basic Components - Complete Coverage
 * 
 * This file provides comprehensive stories for all basic building blocks:
 * - Text, Span, Div, HTML
 * - Image
 * - Icon  
 * - Button Group
 * - Pagination
 * - Navigation Menu
 * - Separator
 */

const meta = {
  title: 'Components/Basic/Text & Layout',
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

// ========== TEXT ==========

export const Text: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'text',
    content: 'This is a text element',
  } as any,
};

export const TextWithClassName: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'text',
    content: 'Styled text with Tailwind',
    className: 'text-2xl font-bold text-blue-600',
  } as any,
};

// ========== SPAN ==========

export const Span: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'span',
    children: [
      { type: 'text', content: 'Inline span element' },
    ],
  } as any,
};

export const SpanWithStyling: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'span',
    className: 'bg-yellow-100 px-2 py-1 rounded font-semibold',
    children: [
      { type: 'text', content: 'Highlighted Text' },
    ],
  } as any,
};

// ========== DIV ==========

export const Div: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'div',
    className: 'p-4 bg-gray-100 rounded',
    children: [
      { type: 'text', content: 'This is a div container' },
    ],
  } as any,
};

export const DivWithMultipleChildren: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'div',
    className: 'p-6 bg-white border rounded-lg shadow space-y-2',
    children: [
      {
        type: 'text',
        content: 'Title',
        className: 'text-xl font-bold',
      },
      {
        type: 'text',
        content: 'This is the content inside the div',
        className: 'text-gray-600',
      },
      {
        type: 'button',
        props: { variant: 'outline' },
        children: [{ type: 'text', content: 'Action' }],
      },
    ],
  } as any,
};

// ========== HTML ==========

export const HTML: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'html',
    content: '<p>This is <strong>HTML</strong> content with <em>formatting</em></p>',
  } as any,
};

export const HTMLComplex: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'html',
    content: `
      <div class="prose">
        <h2>HTML Renderer</h2>
        <p>Supports <strong>bold</strong>, <em>italic</em>, and <u>underline</u></p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
      </div>
    `,
  } as any,
};

// ========== IMAGE ==========

export const Image: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'image',
    src: 'https://via.placeholder.com/300x200',
    alt: 'Placeholder image',
  } as any,
};

export const ImageWithCustomSize: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'image',
    src: 'https://via.placeholder.com/400x300',
    alt: 'Custom sized image',
    className: 'rounded-lg shadow-lg',
    width: 400,
    height: 300,
  } as any,
};

export const ImageResponsive: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'image',
    src: 'https://via.placeholder.com/800x600',
    alt: 'Responsive image',
    className: 'w-full h-auto rounded',
  } as any,
};

// ========== ICON ==========

export const Icon: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'icon',
    name: 'Home',
  } as any,
};

export const IconLarge: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'icon',
    name: 'Heart',
    className: 'w-12 h-12 text-red-500',
  } as any,
};

export const IconWithText: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'div',
    className: 'flex items-center gap-2',
    children: [
      {
        type: 'icon',
        name: 'Mail',
        className: 'text-blue-500',
      },
      {
        type: 'text',
        content: 'Email Us',
      },
    ],
  } as any,
};

// ========== SEPARATOR ==========

export const Separator: Story = {
  render: (args) => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Section 1</h4>
        <p className="text-sm text-muted-foreground">Content above separator</p>
      </div>
      <SchemaRenderer schema={args as unknown as BaseSchema} />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Section 2</h4>
        <p className="text-sm text-muted-foreground">Content below separator</p>
      </div>
    </div>
  ),
  args: {
    type: 'separator',
    className: 'my-4',
  } as any,
};

export const SeparatorVertical: Story = {
  render: (args) => (
    <div className="flex h-20 items-center">
      <div className="px-4">Section 1</div>
      <SchemaRenderer schema={args as unknown as BaseSchema} />
      <div className="px-4">Section 2</div>
    </div>
  ),
  args: {
    type: 'separator',
    orientation: 'vertical',
  } as any,
};

// ========== PAGINATION ==========

export const PaginationDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'pagination',
    total: 100,
    pageSize: 10,
    currentPage: 1,
  } as any,
};

export const PaginationWithManyPages: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'pagination',
    total: 1000,
    pageSize: 20,
    currentPage: 15,
  } as any,
};

// ========== BUTTON GROUP ==========

export const ButtonGroupDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'button-group',
    buttons: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  } as any,
};

export const ButtonGroupWithIcons: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'button-group',
    buttons: [
      { icon: 'AlignLeft', value: 'left' },
      { icon: 'AlignCenter', value: 'center' },
      { icon: 'AlignRight', value: 'right' },
      { icon: 'AlignJustify', value: 'justify' },
    ],
  } as any,
};

export const ButtonGroupVertical: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'button-group',
    orientation: 'vertical',
    buttons: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ],
  } as any,
};
