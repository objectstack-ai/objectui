/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Example: FormRenderer Usage
 * 
 * This example demonstrates how to use the FormRenderer component
 * with @objectstack/spec FormView schema.
 */

import type { FormView } from '@objectstack/spec/ui';

/**
 * Simple contact form example
 */
export const contactFormSchema: FormView = {
  type: 'simple',
  sections: [
    {
      label: 'Contact Information',
      collapsible: false,
      collapsed: false,
      columns: 2,
      fields: [
        {
          field: 'firstName',
          label: 'First Name',
          placeholder: 'John',
          required: true,
          widget: 'text',
        },
        {
          field: 'lastName',
          label: 'Last Name',
          placeholder: 'Doe',
          required: true,
          widget: 'text',
        },
        {
          field: 'email',
          label: 'Email Address',
          placeholder: 'john.doe@example.com',
          required: true,
          widget: 'email',
          helpText: 'We will never share your email',
        },
        {
          field: 'phone',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
          widget: 'tel',
        },
        {
          field: 'message',
          label: 'Message',
          placeholder: 'Your message here...',
          required: true,
          widget: 'textarea',
          colSpan: 2, // Span across both columns
        },
        {
          field: 'newsletter',
          label: 'Subscribe to newsletter',
          widget: 'checkbox',
          helpText: 'Get updates about our products',
        },
      ],
    },
  ],
};

/**
 * User profile form with multiple sections
 */
export const userProfileSchema: FormView = {
  type: 'simple',
  sections: [
    {
      label: 'Personal Details',
      collapsible: true,
      collapsed: false,
      columns: 2,
      fields: [
        {
          field: 'username',
          label: 'Username',
          placeholder: 'johndoe',
          required: true,
          widget: 'text',
        },
        {
          field: 'age',
          label: 'Age',
          placeholder: '25',
          widget: 'number',
        },
        {
          field: 'birthdate',
          label: 'Date of Birth',
          widget: 'date',
        },
        {
          field: 'bio',
          label: 'Biography',
          placeholder: 'Tell us about yourself...',
          widget: 'textarea',
          colSpan: 2,
        },
      ],
    },
    {
      label: 'Account Settings',
      collapsible: true,
      collapsed: true,
      columns: 1,
      fields: [
        {
          field: 'emailNotifications',
          label: 'Email Notifications',
          widget: 'checkbox',
          helpText: 'Receive notifications via email',
        },
        {
          field: 'twoFactorAuth',
          label: 'Enable Two-Factor Authentication',
          widget: 'checkbox',
          helpText: 'Add an extra layer of security',
        },
      ],
    },
  ],
};

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { FormRenderer } from '@object-ui/react';
 * import { contactFormSchema } from './examples/form-renderer-example';
 * 
 * function ContactPage() {
 *   const handleSubmit = (data: Record<string, any>) => {
 *     console.log('Form submitted:', data);
 *     // Handle form submission
 *   };
 * 
 *   const handleChange = (data: Record<string, any>) => {
 *     console.log('Form changed:', data);
 *     // Handle form changes
 *   };
 * 
 *   return (
 *     <div className="container mx-auto p-4">
 *       <h1>Contact Us</h1>
 *       <FormRenderer
 *         schema={contactFormSchema}
 *         onSubmit={handleSubmit}
 *         onChange={handleChange}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * With initial data:
 * ```tsx
 * function EditProfilePage() {
 *   const initialData = {
 *     username: 'johndoe',
 *     age: 25,
 *     bio: 'Software developer',
 *     emailNotifications: true,
 *   };
 * 
 *   return (
 *     <FormRenderer
 *       schema={userProfileSchema}
 *       data={initialData}
 *       onSubmit={(data) => console.log('Updated:', data)}
 *     />
 *   );
 * }
 * ```
 */
