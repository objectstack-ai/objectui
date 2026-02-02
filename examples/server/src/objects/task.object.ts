import { ObjectSchema, Field } from '@objectstack/spec/data';

export const TaskObject = ObjectSchema.create({
  name: 'task',
  label: 'Task',
  fields: {
    name: Field.text({ label: 'Task Name', required: true }),
    status: Field.select({
      label: 'Status',
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'In Progress', value: 'doing' },
        { label: 'Done', value: 'done' }
      ]
    }),
    priority: Field.number({ label: 'Priority', scale: 0 }),
    due_date: Field.date({ label: 'Due Date' }),
    is_done: Field.boolean({ label: 'Completed', defaultValue: false }),
    project: Field.lookup('project', { label: 'Project' })
  }
});
