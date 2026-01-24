/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormRenderer } from './FormRenderer';
import type { FormView } from '@objectstack/spec/ui';

describe('FormRenderer', () => {
  it('should render a simple form with text fields', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Personal Information',
          collapsible: false,
          collapsed: false,
          columns: 2,
          fields: [
            {
              field: 'firstName',
              label: 'First Name',
              required: true,
              widget: 'text',
            },
            {
              field: 'lastName',
              label: 'Last Name',
              required: true,
              widget: 'text',
            },
          ],
        },
      ],
    };

    const { container } = render(<FormRenderer schema={schema} />);
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
  });

  it('should render form with initial data', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'User Details',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'username',
              label: 'Username',
              widget: 'text',
            },
          ],
        },
      ],
    };

    const data = { username: 'john_doe' };

    render(<FormRenderer schema={schema} data={data} />);
    
    const input = screen.getByLabelText('Username') as HTMLInputElement;
    expect(input.value).toBe('john_doe');
  });

  it('should handle multi-column layout', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Contact',
          collapsible: false,
          collapsed: false,
          columns: 3,
          fields: [
            {
              field: 'email',
              label: 'Email',
              widget: 'email',
            },
            {
              field: 'phone',
              label: 'Phone',
              widget: 'tel',
            },
            {
              field: 'address',
              label: 'Address',
              widget: 'textarea',
              colSpan: 3,
            },
          ],
        },
      ],
    };

    render(<FormRenderer schema={schema} />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
  });

  it('should hide fields marked as hidden', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Form',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'visible',
              label: 'Visible Field',
              widget: 'text',
            },
            {
              field: 'hidden',
              label: 'Hidden Field',
              widget: 'text',
              hidden: true,
            },
          ],
        },
      ],
    };

    render(<FormRenderer schema={schema} />);
    
    expect(screen.getByLabelText('Visible Field')).toBeInTheDocument();
    expect(screen.queryByLabelText('Hidden Field')).not.toBeInTheDocument();
  });

  it('should support legacy string field format', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Legacy Form',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: ['username', 'email'],
        },
      ],
    };

    const { container } = render(<FormRenderer schema={schema} />);
    
    // String fields should still render as inputs
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should handle number fields', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Numbers',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'age',
              label: 'Age',
              widget: 'number',
              required: true,
            },
          ],
        },
      ],
    };

    render(<FormRenderer schema={schema} />);
    
    const input = screen.getByLabelText(/Age/) as HTMLInputElement;
    expect(input.type).toBe('number');
  });

  it('should handle checkbox fields', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Preferences',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'subscribe',
              label: 'Subscribe to newsletter',
              widget: 'checkbox',
            },
          ],
        },
      ],
    };

    render(<FormRenderer schema={schema} />);
    
    const checkbox = screen.getByLabelText('Subscribe to newsletter') as HTMLInputElement;
    expect(checkbox.type).toBe('checkbox');
  });

  it('should render help text when provided', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Help Text',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'password',
              label: 'Password',
              widget: 'password',
              helpText: 'Must be at least 8 characters',
            },
          ],
        },
      ],
    };

    render(<FormRenderer schema={schema} />);
    
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('should mark required fields with asterisk', () => {
    const schema: FormView = {
      type: 'simple',
      sections: [
        {
          label: 'Required',
          collapsible: false,
          collapsed: false,
          columns: 1,
          fields: [
            {
              field: 'name',
              label: 'Name',
              widget: 'text',
              required: true,
            },
          ],
        },
      ],
    };

    const { container } = render(<FormRenderer schema={schema} />);
    
    // Check for asterisk
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk?.textContent).toContain('*');
  });
});
