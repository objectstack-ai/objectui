import { defineStack } from '@objectstack/spec';
import { App } from '@objectstack/spec/ui';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { AppPlugin, DriverPlugin } from '@objectstack/runtime';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { ProjectObject } from './src/objects/project.object';
import { TaskObject } from './src/objects/task.object';

const stack = defineStack({
  metadata: {
    name: 'objectstack-server',
    version: '0.1.0',
    description: 'ObjectStack server example using @objectstack/cli'
  },
  objects: [ProjectObject, TaskObject],
  apps: [
    App.create({
      name: 'objectstack_server_app',
      label: 'ObjectStack Server',
      icon: 'server',
      navigation: [
        {
          id: 'nav_projects',
          type: 'object',
          objectName: 'project',
          label: 'Projects'
        },
        {
          id: 'nav_tasks',
          type: 'object',
          objectName: 'task',
          label: 'Tasks'
        }
      ]
    })
  ],
  manifest: {
    id: 'com.example.objectstack-server',
    version: '1.0.0',
    type: 'app',
    name: 'ObjectStack Server Example',
    description: 'Metadata app served by ObjectStack CLI',
    data: [
      {
        object: 'project',
        mode: 'upsert',
        records: [
          {
            _id: 'p1',
            name: 'Console Revamp',
            owner: 'Ada Lovelace',
            status: 'active',
            start_date: '2026-02-01'
          },
          {
            _id: 'p2',
            name: 'Schema Editor',
            owner: 'Alan Turing',
            status: 'paused',
            start_date: '2026-01-15'
          }
        ]
      },
      {
        object: 'task',
        mode: 'upsert',
        records: [
          {
            _id: 't1',
            name: 'Draft object schemas',
            status: 'doing',
            priority: 1,
            due_date: '2026-02-10',
            is_done: false,
            project: 'p1'
          },
          {
            _id: 't2',
            name: 'Review navigation',
            status: 'todo',
            priority: 2,
            due_date: '2026-02-15',
            is_done: false,
            project: 'p1'
          }
        ]
      }
    ]
  }
});

export default {
  ...stack,
  plugins: [
    new ObjectQLPlugin(),
    new DriverPlugin(new InMemoryDriver()),
    new AppPlugin(stack)
  ]
};
