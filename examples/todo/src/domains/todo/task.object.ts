import { ObjectSchema, Field } from '@objectstack/spec/data';

export const TodoTask = ObjectSchema.create({
  name: 'todo_task',
  label: 'Task',
  icon: 'check-circle-2',
  titleFormat: '{subject}',
  compactLayout: ['subject', 'status', 'priority', 'assignee', 'due_date'],
  enable: {
    apiEnabled: true,
    trackHistory: true,
    feeds: true,
    activities: true,
    mru: true,
  },
  fields: {
    subject: Field.text({ label: 'Subject', required: true, searchable: true }),
    status: Field.select(
      ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'],
      { label: 'Status', defaultValue: 'Todo' }
    ),
    priority: Field.select(
      ['Critical', 'High', 'Medium', 'Low'],
      { label: 'Priority', defaultValue: 'Medium' }
    ),
    assignee: Field.text({ label: 'Assignee' }),
    category: Field.select(
      ['Bug', 'Feature', 'Documentation', 'Design', 'Chore'],
      { label: 'Category' }
    ),
    due_date: Field.date({ label: 'Due Date' }),
    is_completed: Field.boolean({ label: 'Completed', defaultValue: false }),
    estimated_hours: Field.number({ label: 'Est. Hours', scale: 1 }),
    description: Field.textarea({ label: 'Description' }),
  },
  list_views: {
    all: {
      label: 'All Tasks',
      columns: ['subject', 'status', 'priority', 'assignee', 'category', 'due_date', 'is_completed'],
    },
    board: {
      label: 'Board',
      type: 'kanban',
      groupField: 'status',
      titleField: 'subject',
      cardFields: ['priority', 'assignee', 'due_date'],
    } as any,
    calendar: {
      label: 'Calendar',
      type: 'calendar',
      startDateField: 'due_date',
      titleField: 'subject',
      defaultView: 'month',
    } as any,
    active: {
      label: 'Active',
      columns: ['subject', 'status', 'priority', 'assignee', 'due_date'],
      filter: [['status', '!=', 'Done']],
      sort: [['priority', 'asc']],
    },
  },
});
