import { ObjectSchema, Field } from '@objectstack/spec/data';

export const ContactObject = ObjectSchema.create({
  name: 'contact',
  label: 'Contact',
  fields: {
    name: Field.text({ label: 'Name', required: true }),
    email: Field.email({ label: 'Email' }),
    phone: Field.text({ label: 'Phone' }),
    title: Field.text({ label: 'Title' }),
    company: Field.text({ label: 'Company' }),
    status: Field.select(['Active', 'Lead', 'Customer'], { label: 'Status' }),
    priority: Field.number({ label: 'Priority', defaultValue: 5 }),
    is_active: Field.boolean({ label: 'Active', defaultValue: true }),
    notes: Field.textarea({ label: 'Notes' })
  }
});
