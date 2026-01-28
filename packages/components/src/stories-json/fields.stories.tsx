import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  TextField, 
  CurrencyField, 
  SelectField, 
  DateField,
  BooleanField,
  NumberField,
  PercentField,
  UrlField,
  PhoneField,
  EmailField,
  PasswordField,
  TextAreaField,
  AutoNumberField,
  LookupField
} from '@object-ui/fields';
import { FieldMetadata } from '@object-ui/types';

/**
 * **Field Widgets** from `@object-ui/fields`.
 * 
 * These components handle data formatting, validation, and display logic for specific data types.
 * They are typically used within `ObjectForm` or `ObjectGrid` but can be used standalone.
 * 
 * Note: These widgets implement the `FieldWidgetProps` interface.
 */
const meta = {
  title: 'Schema/Fields',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<any>;

// Wrapper to handle state since these are controlled components
const FieldWrapper = ({ 
  Component, 
  field, 
  initialValue,
  readonly = false
}: { 
  Component: any, 
  field: Partial<FieldMetadata>, 
  initialValue?: any,
  readonly?: boolean
}) => {
  const [value, setValue] = useState(initialValue);
  
  // Ensure field has minimal required props
  const fullField = {
    name: 'test_field',
    label: 'Test Field',
    type: 'text',
    ...field
  } as FieldMetadata;

  return (
    <div className="w-[300px] space-y-2 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{fullField.label}</label>
        {readonly && <span className="text-[10px] bg-gray-100 px-1 rounded">Read Only</span>}
      </div>
      
      <Component
        value={value}
        onChange={(val: any) => {
          console.log('onChange', val);
          setValue(val);
        }}
        field={fullField}
        readonly={readonly}
      />
      
      {!readonly && (
        <div className="text-xs text-muted-foreground mt-4 pt-2 border-t font-mono">
          Value: {JSON.stringify(value)}
        </div>
      )}
    </div>
  );
};

export const Text: Story = {
  render: () => (
    <FieldWrapper 
      Component={TextField}
      field={{ label: 'Deal Name', type: 'text', placeholder: 'Enter deal name...' }}
      initialValue="Big Enterprise Deal"
    />
  )
};

export const TextArea: Story = {
  render: () => (
    <FieldWrapper 
      Component={TextAreaField}
      field={{ label: 'Description', type: 'textarea', rows: 4 }}
      initialValue="This is a multi-line description text area."
    />
  )
};

export const Number: Story = {
  render: () => (
    <FieldWrapper 
      Component={NumberField}
      field={{ label: 'Quantity', type: 'number', scale: 0 }}
      initialValue={42}
    />
  )
};

export const Currency: Story = {
  render: () => (
    <FieldWrapper 
      Component={CurrencyField}
      field={{ label: 'Amount', type: 'currency', currency: 'USD', precision: 2 }}
      initialValue={1234567.89}
    />
  )
};

export const Percent: Story = {
  render: () => (
    <FieldWrapper 
      Component={PercentField}
      field={{ label: 'Probability', type: 'percent', precision: 2 }}
      initialValue={0.75}
    />
  )
};

export const Boolean: Story = {
  render: () => (
    <FieldWrapper 
      Component={BooleanField}
      field={{ label: 'Is Active?', type: 'boolean' }}
      initialValue={true}
    />
  )
};

export const Date: Story = {
  render: () => (
    <FieldWrapper 
      Component={DateField}
      field={{ label: 'Close Date', type: 'date' }}
      initialValue={new Date().toISOString()}
    />
  )
};

export const Select: Story = {
  render: () => (
    <FieldWrapper 
      Component={SelectField}
      field={{ 
        label: 'Stage', 
        type: 'select',
        options: [
          { label: 'Prospecting', value: 'prospecting' },
          { label: 'Qualification', value: 'qualification' },
          { label: 'Proposal', value: 'proposal' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ]
      }}
      initialValue="proposal"
    />
  )
};

export const Password: Story = {
  render: () => (
    <FieldWrapper 
      Component={PasswordField}
      field={{ label: 'Secret Key', type: 'password' }}
      initialValue="supersecret"
    />
  )
};

export const ReadOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FieldWrapper 
        Component={TextField}
        field={{ label: 'Read Only Text', type: 'text' }}
        initialValue="You cannot edit this"
        readonly={true}
      />
      <FieldWrapper 
        Component={CurrencyField}
        field={{ label: 'Read Only Currency', type: 'currency' }}
        initialValue={9999.99}
        readonly={true}
      />
    </div>
  )
};
