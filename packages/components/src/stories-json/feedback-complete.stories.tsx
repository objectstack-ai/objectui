import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';
import type { BaseSchema } from '@object-ui/types';

/**
 * Feedback Components - Complete Coverage with MSW
 * 
 * Components covered:
 * - Progress (linear, circular)
 * - Spinner (loading indicator)
 * - Skeleton (loading placeholders)
 * - Loading (full page/section loader)
 * - Empty (empty states)
 * - Toast/Toaster (notifications)
 * - Alert (inline messages)
 */

const meta = {
  title: 'Components/Feedback/All',
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

// ========== PROGRESS ==========

export const ProgressDefault: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'progress',
    value: 60,
  } as any,
};

export const ProgressStates: Story = {
  render: (args) => (
    <div className="w-[400px] space-y-4">
      <div>
        <div className="text-sm mb-2">Starting (10%)</div>
        <SchemaRenderer schema={{ type: 'progress', value: 10 } as any} />
      </div>
      <div>
        <div className="text-sm mb-2">In Progress (45%)</div>
        <SchemaRenderer schema={{ type: 'progress', value: 45 } as any} />
      </div>
      <div>
        <div className="text-sm mb-2">Almost Done (80%)</div>
        <SchemaRenderer schema={{ type: 'progress', value: 80 } as any} />
      </div>
      <div>
        <div className="text-sm mb-2">Complete (100%)</div>
        <SchemaRenderer schema={{ type: 'progress', value: 100 } as any} />
      </div>
    </div>
  ),
  args: {} as any,
};

export const ProgressWithLabel: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <div className="flex justify-between text-sm mb-2">
        <span>Uploading file...</span>
        <span>75%</span>
      </div>
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'progress',
    value: 75,
  } as any,
};

// ========== SPINNER ==========

export const SpinnerDefault: Story = {
  render: (args) => <SchemaRenderer schema={args as unknown as BaseSchema} />,
  args: {
    type: 'spinner',
  } as any,
};

export const SpinnerSizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <SchemaRenderer schema={{ type: 'spinner', size: 'sm' } as any} />
        <div className="text-xs mt-2">Small</div>
      </div>
      <div className="text-center">
        <SchemaRenderer schema={{ type: 'spinner', size: 'md' } as any} />
        <div className="text-xs mt-2">Medium</div>
      </div>
      <div className="text-center">
        <SchemaRenderer schema={{ type: 'spinner', size: 'lg' } as any} />
        <div className="text-xs mt-2">Large</div>
      </div>
    </div>
  ),
  args: {} as any,
};

export const SpinnerWithText: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <SchemaRenderer schema={{ type: 'spinner' } as any} />
      <span className="text-sm text-gray-600">Loading data...</span>
    </div>
  ),
  args: {} as any,
};

// ========== SKELETON ==========

export const SkeletonDefault: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'skeleton',
    className: 'h-12 w-full',
  } as any,
};

export const SkeletonCard: Story = {
  render: (args) => (
    <div className="w-[350px] space-y-3">
      <SchemaRenderer schema={{ type: 'skeleton', className: 'h-[125px] w-full rounded-xl' } as any} />
      <div className="space-y-2">
        <SchemaRenderer schema={{ type: 'skeleton', className: 'h-4 w-full' } as any} />
        <SchemaRenderer schema={{ type: 'skeleton', className: 'h-4 w-4/5' } as any} />
      </div>
    </div>
  ),
  args: {} as any,
};

export const SkeletonList: Story = {
  render: (args) => (
    <div className="w-[400px] space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <SchemaRenderer schema={{ type: 'skeleton', className: 'h-12 w-12 rounded-full' } as any} />
          <div className="space-y-2 flex-1">
            <SchemaRenderer schema={{ type: 'skeleton', className: 'h-4 w-full' } as any} />
            <SchemaRenderer schema={{ type: 'skeleton', className: 'h-4 w-3/4' } as any} />
          </div>
        </div>
      ))}
    </div>
  ),
  args: {} as any,
};

// ========== LOADING ==========

export const LoadingDefault: Story = {
  render: (args) => (
    <div className="w-[400px] h-[300px] border rounded-lg relative">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'loading',
    message: 'Loading...',
  } as any,
};

export const LoadingWithCustomMessage: Story = {
  render: (args) => (
    <div className="w-[400px] h-[300px] border rounded-lg relative">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'loading',
    message: 'Fetching your data...',
  } as any,
};

// ========== EMPTY ==========

export const EmptyDefault: Story = {
  render: (args) => (
    <div className="w-[400px] h-[300px] border rounded-lg flex items-center justify-center">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'empty',
    message: 'No data available',
  } as any,
};

export const EmptyWithAction: Story = {
  render: (args) => (
    <div className="w-[400px] h-[300px] border rounded-lg flex items-center justify-center">
      <div className="text-center space-y-4">
        <SchemaRenderer schema={{ type: 'empty', message: 'No contacts found' } as any} />
        <SchemaRenderer 
          schema={{ 
            type: 'button', 
            props: { variant: 'default' },
            children: [{ type: 'text', content: 'Add Contact' }] 
          } as any} 
        />
      </div>
    </div>
  ),
  args: {} as any,
};

export const EmptyStates: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-4 w-[800px]">
      <div className="border rounded-lg p-8 text-center">
        <SchemaRenderer schema={{ type: 'empty', message: 'No tasks yet', icon: 'ListTodo' } as any} />
      </div>
      <div className="border rounded-lg p-8 text-center">
        <SchemaRenderer schema={{ type: 'empty', message: 'No messages', icon: 'Mail' } as any} />
      </div>
      <div className="border rounded-lg p-8 text-center">
        <SchemaRenderer schema={{ type: 'empty', message: 'No notifications', icon: 'Bell' } as any} />
      </div>
      <div className="border rounded-lg p-8 text-center">
        <SchemaRenderer schema={{ type: 'empty', message: 'No files uploaded', icon: 'Upload' } as any} />
      </div>
    </div>
  ),
  args: {} as any,
};

// ========== ALERT ==========

export const AlertInfo: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'alert',
    variant: 'default',
    title: 'Information',
    description: 'This is an informational alert message.',
  } as any,
};

export const AlertSuccess: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'alert',
    variant: 'default',
    title: 'Success',
    description: 'Your changes have been saved successfully.',
    className: 'border-green-500 bg-green-50',
  } as any,
};

export const AlertWarning: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'alert',
    variant: 'default',
    title: 'Warning',
    description: 'Please review your information before submitting.',
    className: 'border-yellow-500 bg-yellow-50',
  } as any,
};

export const AlertError: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'alert',
    variant: 'destructive',
    title: 'Error',
    description: 'Something went wrong. Please try again.',
  } as any,
};

export const AlertWithoutTitle: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  ),
  args: {
    type: 'alert',
    variant: 'default',
    description: 'This is a simple alert without a title.',
  } as any,
};
