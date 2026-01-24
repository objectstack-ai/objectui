/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { FormField } from '@objectstack/spec/ui';

export interface FieldFactoryProps {
  /**
   * Field configuration from FormFieldSchema
   */
  field: FormField;
  /**
   * React Hook Form methods
   */
  methods: UseFormReturn<any>;
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
}

/**
 * FieldFactory component that renders different input types based on
 * the widget property or field type
 */
export const FieldFactory: React.FC<FieldFactoryProps> = ({
  field,
  methods,
  disabled = false,
}) => {
  const { register, formState: { errors } } = methods;
  
  // Determine the widget type
  const widgetType = field.widget || 'text';
  const fieldName = field.field;
  const error = errors[fieldName];

  // Handle conditional visibility
  // Note: visibleOn expression evaluation is not yet implemented
  // Fields are always visible unless explicitly hidden
  // Skip if explicitly hidden
  if (field.hidden) {
    return null;
  }

  // Common field wrapper
  const renderField = (input: React.ReactNode) => (
    <div className="space-y-2">
      {field.label && (
        <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {input}
      {field.helpText && (
        <p className="text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );

  // Render based on widget type
  switch (widgetType.toLowerCase()) {
    case 'text':
    case 'string':
    case 'email':
    case 'password':
    case 'url':
    case 'tel':
      return renderField(
        <input
          id={fieldName}
          type={widgetType === 'string' ? 'text' : widgetType}
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );

    case 'number':
    case 'integer':
    case 'float':
      return renderField(
        <input
          id={fieldName}
          type="number"
          placeholder={field.placeholder}
          disabled={disabled}
          step={widgetType === 'integer' ? '1' : 'any'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
            valueAsNumber: true,
          })}
        />
      );

    case 'checkbox':
    case 'boolean':
      return (
        <div className="flex items-start space-x-2">
          <input
            id={fieldName}
            type="checkbox"
            disabled={disabled}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            {...register(fieldName)}
          />
          <div className="flex-1">
            {field.label && (
              <label htmlFor={fieldName} className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {field.helpText && (
              <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-1">{error.message as string}</p>
            )}
          </div>
        </div>
      );

    case 'textarea':
      return renderField(
        <textarea
          id={fieldName}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );

    case 'select':
    case 'dropdown':
      // Note: This is a basic implementation without options support
      // To properly support select fields, options would need to be passed
      // via an extended FormField schema or external configuration
      return renderField(
        <select
          id={fieldName}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        >
          <option value="">{field.placeholder || 'Select an option'}</option>
          {/* TODO: Add options support - requires extending FormField schema or external options provider */}
        </select>
      );

    case 'date':
      return renderField(
        <input
          id={fieldName}
          type="date"
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );

    case 'datetime':
    case 'datetime-local':
      return renderField(
        <input
          id={fieldName}
          type="datetime-local"
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );

    case 'time':
      return renderField(
        <input
          id={fieldName}
          type="time"
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );

    default:
      // Default to text input
      return renderField(
        <input
          id={fieldName}
          type="text"
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          {...register(fieldName, {
            required: field.required ? `${field.label || fieldName} is required` : false,
          })}
        />
      );
  }
};

FieldFactory.displayName = 'FieldFactory';
