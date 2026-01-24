/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormView, FormSection } from '@objectstack/spec/ui';
import { z } from 'zod';
import { FieldFactory } from './FieldFactory';

export interface FormRendererProps {
  /**
   * The FormView schema from @objectstack/spec
   */
  schema: FormView;
  /**
   * Initial form data
   */
  data?: Record<string, any>;
  /**
   * Form submission handler
   */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  /**
   * Form change handler
   */
  onChange?: (data: Record<string, any>) => void;
  /**
   * Custom class name for the form
   */
  className?: string;
  /**
   * Whether the form is disabled
   */
  disabled?: boolean;
}

/**
 * FormRenderer component that renders forms based on FormViewSchema
 * from @objectstack/spec
 */
export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  data = {},
  onSubmit,
  onChange,
  className = '',
  disabled = false,
}) => {
  // Create form methods with react-hook-form
  const methods = useForm({
    defaultValues: data,
    mode: 'onChange',
  });

  const { handleSubmit, watch } = methods;

  // Watch for form changes
  React.useEffect(() => {
    if (onChange) {
      const subscription = watch((value) => {
        onChange(value as Record<string, any>);
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, onChange]);

  // Handle form submission
  const onSubmitForm = handleSubmit(async (formData) => {
    if (onSubmit) {
      await onSubmit(formData);
    }
  });

  // Render sections or fields
  const renderContent = () => {
    if (!schema.sections || schema.sections.length === 0) {
      return null;
    }

    return (
      <div className="space-y-6">
        {schema.sections.map((section, index) => (
          <FormSectionRenderer
            key={index}
            section={section}
            methods={methods}
            disabled={disabled}
          />
        ))}
      </div>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmitForm} className={`space-y-6 ${className}`}>
        {renderContent()}
        
        {/* Submit button - optional, can be customized */}
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

interface FormSectionRendererProps {
  section: FormSection;
  methods: UseFormReturn<any>;
  disabled?: boolean;
}

/**
 * Renders a form section with grid layout
 */
const FormSectionRenderer: React.FC<FormSectionRendererProps> = ({
  section,
  methods,
  disabled = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(section.collapsed || false);

  // Determine grid columns based on section.columns
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[section.columns || 1];

  const handleToggleCollapse = () => {
    if (section.collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      {section.label && (
        <div
          className={`flex items-center justify-between mb-4 ${
            section.collapsible ? 'cursor-pointer' : ''
          }`}
          onClick={handleToggleCollapse}
        >
          <h3 className="text-lg font-semibold">{section.label}</h3>
          {section.collapsible && (
            <span className="text-sm text-gray-500">
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
        </div>
      )}

      {!isCollapsed && (
        <div className={`grid ${gridCols} gap-4`}>
          {section.fields.map((field, index) => {
            // Handle both string fields (legacy) and FormFieldSchema objects
            const fieldName = typeof field === 'string' ? field : field.field;
            const fieldConfig = typeof field === 'string' ? { field: fieldName } : field;

            // Skip hidden fields
            if (fieldConfig.hidden) {
              return null;
            }

            // Calculate colSpan for grid
            const colSpan = fieldConfig.colSpan || 1;
            const colSpanClass = {
              1: 'col-span-1',
              2: 'col-span-2',
              3: 'col-span-3',
              4: 'col-span-4',
            }[Math.min(colSpan, section.columns || 1)];

            return (
              <div key={`${fieldName}-${index}`} className={colSpanClass}>
                <FieldFactory
                  field={fieldConfig}
                  methods={methods}
                  disabled={disabled || fieldConfig.readonly}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

FormRenderer.displayName = 'FormRenderer';
