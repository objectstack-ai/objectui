import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import type { BaseSchema } from '@object-ui/types';
import { createStorybookDataSource } from '@storybook-config/datasource';

const meta = {
  title: 'Plugins/Forms/Form Variants',
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

const dataSource = createStorybookDataSource();

const renderStory = (args: any) => (
  <SchemaRendererProvider dataSource={dataSource}>
    <div className="max-w-4xl mx-auto">
      <SchemaRenderer schema={args as unknown as BaseSchema} />
    </div>
  </SchemaRendererProvider>
);

// ==========================================
// Sectioned Form
// ==========================================

export const SectionedForm: Story = {
  name: 'Sectioned Form',
  render: renderStory,
  args: {
    type: 'object-form',
    objectName: 'Employee',
    formType: 'simple',
    sections: [
      {
        name: 'personal',
        label: 'Personal Information',
        description: 'Basic employee details',
        columns: 2,
        collapsible: true,
        fields: [
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
        ]
      },
      {
        name: 'employment',
        label: 'Employment Details',
        description: 'Job-related information',
        columns: 2,
        collapsible: true,
        fields: [
          { name: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Sales', 'Marketing', 'HR'] },
          { name: 'title', label: 'Job Title', type: 'text' },
          { name: 'startDate', label: 'Start Date', type: 'date' },
          { name: 'salary', label: 'Salary', type: 'number' },
        ]
      },
      {
        name: 'address',
        label: 'Address',
        columns: 1,
        collapsible: true,
        collapsed: true,
        fields: [
          { name: 'street', label: 'Street Address', type: 'text' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'zip', label: 'ZIP Code', type: 'text' },
        ]
      }
    ],
    className: 'w-full'
  } as any,
};

// ==========================================
// Tabbed Form
// ==========================================

export const TabbedForm: Story = {
  name: 'Tabbed Form',
  render: renderStory,
  args: {
    type: 'object-form',
    objectName: 'Contact',
    formType: 'tabbed',
    defaultTab: 'basic',
    sections: [
      {
        name: 'basic',
        label: 'Basic Info',
        columns: 2,
        fields: [
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'company', label: 'Company', type: 'text' },
        ]
      },
      {
        name: 'social',
        label: 'Social Media',
        columns: 2,
        fields: [
          { name: 'linkedin', label: 'LinkedIn', type: 'url' },
          { name: 'twitter', label: 'Twitter', type: 'text' },
          { name: 'github', label: 'GitHub', type: 'text' },
          { name: 'website', label: 'Website', type: 'url' },
        ]
      },
      {
        name: 'notes',
        label: 'Notes',
        columns: 1,
        fields: [
          { name: 'notes', label: 'Additional Notes', type: 'textarea', rows: 6 },
          { name: 'tags', label: 'Tags', type: 'text' },
        ]
      }
    ],
    className: 'w-full'
  } as any,
};

// ==========================================
// Wizard Form
// ==========================================

export const WizardForm: Story = {
  name: 'Wizard Form',
  render: renderStory,
  args: {
    type: 'object-form',
    objectName: 'Account',
    formType: 'wizard',
    showStepIndicator: true,
    nextText: 'Continue',
    prevText: 'Go Back',
    sections: [
      {
        name: 'step1',
        label: 'Company Details',
        description: 'Tell us about your company',
        columns: 2,
        fields: [
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Finance', 'Healthcare', 'Retail'] },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'employees', label: 'Employee Count', type: 'number' },
        ]
      },
      {
        name: 'step2',
        label: 'Primary Contact',
        description: 'Who should we contact?',
        columns: 2,
        fields: [
          { name: 'contactName', label: 'Contact Name', type: 'text', required: true },
          { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true },
          { name: 'contactPhone', label: 'Phone', type: 'tel' },
          { name: 'contactRole', label: 'Role', type: 'text' },
        ]
      },
      {
        name: 'step3',
        label: 'Preferences',
        description: 'Configure your preferences',
        columns: 1,
        fields: [
          { name: 'plan', label: 'Plan', type: 'select', options: ['Starter', 'Professional', 'Enterprise'] },
          { name: 'newsletter', label: 'Subscribe to Newsletter', type: 'checkbox' },
          { name: 'notes', label: 'Additional Notes', type: 'textarea', rows: 4 },
        ]
      }
    ],
    className: 'w-full'
  } as any,
};

// ==========================================
// Simple Form (Default)
// ==========================================

export const SimpleForm: Story = {
  name: 'Simple Form (Default)',
  render: renderStory,
  args: {
    type: 'object-form',
    objectName: 'Task',
    customFields: [
      { name: 'title', label: 'Task Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'assignee', label: 'Assignee', type: 'text' },
    ],
    className: 'w-full max-w-2xl'
  } as any,
};
