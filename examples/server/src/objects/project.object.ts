import { ObjectSchema, Field } from '@objectstack/spec/data';

export const ProjectObject = ObjectSchema.create({
  name: 'project',
  label: 'Project',
  fields: {
    name: Field.text({ label: 'Project Name', required: true }),
    owner: Field.text({ label: 'Owner' }),
    status: Field.select({
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Done', value: 'done' }
      ]
    }),
    start_date: Field.date({ label: 'Start Date' })
  }
});
