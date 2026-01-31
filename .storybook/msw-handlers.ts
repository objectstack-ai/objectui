/**
 * MSW Handlers Library for ObjectUI Components
 * 
 * This file provides reusable MSW handlers for all component types and plugins.
 * These handlers can be used in Storybook stories or tests to mock backend responses.
 */

import { http, HttpResponse } from 'msw';

/**
 * Mock data generators for different component types
 */
export const mockData = {
  // Form data
  contacts: Array.from({ length: 50 }, (_, i) => ({
    id: `contact-${i + 1}`,
    name: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    phone: `+1-555-${String(i + 1).padStart(4, '0')}`,
    company: `Company ${String.fromCharCode(65 + (i % 26))}`,
    status: ['active', 'inactive', 'pending'][i % 3],
    createdAt: new Date(2024, 0, 1 + i).toISOString(),
  })),

  // Grid/Table data
  tasks: Array.from({ length: 100 }, (_, i) => ({
    id: `task-${i + 1}`,
    title: `Task ${i + 1}`,
    description: `Description for task ${i + 1}`,
    priority: ['low', 'medium', 'high', 'urgent'][i % 4],
    status: ['todo', 'in-progress', 'done', 'blocked'][i % 4],
    assignee: `User ${(i % 10) + 1}`,
    dueDate: new Date(2024, 0, 1 + i).toISOString(),
    progress: Math.floor((i % 10) * 10),
  })),

  // Kanban data
  kanbanColumns: [
    { id: 'todo', title: 'To Do', order: 0 },
    { id: 'in-progress', title: 'In Progress', order: 1 },
    { id: 'review', title: 'Review', order: 2 },
    { id: 'done', title: 'Done', order: 3 },
  ],

  kanbanCards: Array.from({ length: 30 }, (_, i) => ({
    id: `card-${i + 1}`,
    title: `Card ${i + 1}`,
    description: `Description for card ${i + 1}`,
    columnId: ['todo', 'in-progress', 'review', 'done'][i % 4],
    order: i,
    labels: ['bug', 'feature', 'enhancement'].slice(0, (i % 3) + 1),
  })),

  // Chart data
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
      },
      {
        label: 'Expenses',
        data: [8000, 12000, 10000, 15000, 13000, 18000],
      },
    ],
  },

  // Dashboard metrics
  dashboardMetrics: {
    revenue: { value: 125000, change: 12.5, trend: 'up' },
    users: { value: 1250, change: 8.3, trend: 'up' },
    orders: { value: 342, change: -3.2, trend: 'down' },
    conversion: { value: 4.2, change: 0.5, trend: 'up' },
  },

  // Calendar events
  calendarEvents: Array.from({ length: 20 }, (_, i) => ({
    id: `event-${i + 1}`,
    title: `Event ${i + 1}`,
    start: new Date(2024, 0, 1 + i, 10).toISOString(),
    end: new Date(2024, 0, 1 + i, 12).toISOString(),
    allDay: i % 5 === 0,
    type: ['meeting', 'call', 'task', 'reminder'][i % 4],
  })),

  // Timeline data
  timelineItems: Array.from({ length: 15 }, (_, i) => ({
    id: `timeline-${i + 1}`,
    title: `Milestone ${i + 1}`,
    description: `Description for milestone ${i + 1}`,
    date: new Date(2024, 0, 1 + i * 2).toISOString(),
    type: ['milestone', 'event', 'task'][i % 3],
    status: ['completed', 'in-progress', 'pending'][i % 3],
  })),

  // Map locations
  mapLocations: Array.from({ length: 25 }, (_, i) => ({
    id: `location-${i + 1}`,
    name: `Location ${i + 1}`,
    lat: 37.7749 + (Math.random() - 0.5) * 2,
    lng: -122.4194 + (Math.random() - 0.5) * 2,
    type: ['office', 'warehouse', 'store', 'client'][i % 4],
  })),

  // Gantt tasks
  ganttTasks: Array.from({ length: 10 }, (_, i) => ({
    id: `gantt-task-${i + 1}`,
    name: `Project Phase ${i + 1}`,
    start: new Date(2024, 0, 1 + i * 5).toISOString(),
    end: new Date(2024, 0, 10 + i * 5).toISOString(),
    progress: Math.floor(Math.random() * 100),
    dependencies: i > 0 ? [`gantt-task-${i}`] : [],
  })),

  // Chat messages
  chatMessages: Array.from({ length: 30 }, (_, i) => ({
    id: `msg-${i + 1}`,
    text: `Message ${i + 1} - This is a sample chat message`,
    sender: i % 2 === 0 ? 'user' : 'bot',
    timestamp: new Date(Date.now() - (30 - i) * 60000).toISOString(),
  })),

  // Users for lookup fields
  users: Array.from({ length: 20 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    role: ['admin', 'user', 'manager'][i % 3],
  })),
};

/**
 * Generic CRUD handlers that work with ObjectStack pattern
 */
export const createCrudHandlers = (objectName: string, data: any[]) => {
  let items = [...data];

  return [
    // List/Find
    http.get(`/api/v1/data/${objectName}`, ({ request }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      
      return HttpResponse.json({
        data: items.slice(offset, offset + limit),
        total: items.length,
        offset,
        limit,
      });
    }),

    // Get by ID
    http.get(`/api/v1/data/${objectName}/:id`, ({ params }) => {
      const item = items.find((i: any) => i.id === params.id);
      if (!item) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(item);
    }),

    // Create
    http.post(`/api/v1/data/${objectName}`, async ({ request }) => {
      const body = await request.json() as any;
      const newItem = {
        id: `${objectName}-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
      };
      items.push(newItem);
      return HttpResponse.json(newItem, { status: 201 });
    }),

    // Update
    http.put(`/api/v1/data/${objectName}/:id`, async ({ params, request }) => {
      const body = await request.json() as any;
      const index = items.findIndex((i: any) => i.id === params.id);
      if (index === -1) {
        return new HttpResponse(null, { status: 404 });
      }
      items[index] = { ...items[index], ...body, updatedAt: new Date().toISOString() };
      return HttpResponse.json(items[index]);
    }),

    // Delete
    http.delete(`/api/v1/data/${objectName}/:id`, ({ params }) => {
      const index = items.findIndex((i: any) => i.id === params.id);
      if (index === -1) {
        return new HttpResponse(null, { status: 404 });
      }
      items.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
};

/**
 * Plugin-specific handlers
 */
export const pluginHandlers = {
  // Form plugin handlers
  form: [
    http.get('/api/v1/metadata/form/:formName', ({ params }) => {
      return HttpResponse.json({
        name: params.formName,
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'email', type: 'email', label: 'Email', required: true },
          { name: 'phone', type: 'phone', label: 'Phone' },
          { name: 'company', type: 'text', label: 'Company' },
          { name: 'status', type: 'select', label: 'Status', options: ['active', 'inactive'] },
        ],
      });
    }),
  ],

  // View plugin handlers
  view: [
    http.get('/api/v1/metadata/view/:viewName', ({ params }) => {
      return HttpResponse.json({
        name: params.viewName,
        columns: [
          { field: 'name', header: 'Name', width: 200 },
          { field: 'email', header: 'Email', width: 200 },
          { field: 'status', header: 'Status', width: 100 },
        ],
      });
    }),
  ],

  // Grid plugin handlers
  grid: createCrudHandlers('grid-items', mockData.tasks),

  // Kanban plugin handlers
  kanban: [
    http.get('/api/v1/kanban/columns', () => {
      return HttpResponse.json(mockData.kanbanColumns);
    }),
    http.get('/api/v1/kanban/cards', () => {
      return HttpResponse.json(mockData.kanbanCards);
    }),
    http.post('/api/v1/kanban/cards/:id/move', async ({ params, request }) => {
      const body = await request.json() as any;
      return HttpResponse.json({ id: params.id, columnId: body.columnId });
    }),
  ],

  // Charts plugin handlers
  charts: [
    http.get('/api/v1/charts/data', () => {
      return HttpResponse.json(mockData.chartData);
    }),
  ],

  // Dashboard plugin handlers
  dashboard: [
    http.get('/api/v1/dashboard/metrics', () => {
      return HttpResponse.json(mockData.dashboardMetrics);
    }),
  ],

  // Calendar plugin handlers
  calendar: [
    http.get('/api/v1/calendar/events', () => {
      return HttpResponse.json(mockData.calendarEvents);
    }),
  ],

  // Timeline plugin handlers
  timeline: [
    http.get('/api/v1/timeline/items', () => {
      return HttpResponse.json(mockData.timelineItems);
    }),
  ],

  // Map plugin handlers
  map: [
    http.get('/api/v1/map/locations', () => {
      return HttpResponse.json(mockData.mapLocations);
    }),
  ],

  // Gantt plugin handlers
  gantt: [
    http.get('/api/v1/gantt/tasks', () => {
      return HttpResponse.json(mockData.ganttTasks);
    }),
  ],

  // Chatbot plugin handlers
  chatbot: [
    http.get('/api/v1/chat/messages', () => {
      return HttpResponse.json(mockData.chatMessages);
    }),
    http.post('/api/v1/chat/messages', async ({ request }) => {
      const body = await request.json() as any;
      return HttpResponse.json({
        id: `msg-${Date.now()}`,
        text: `Echo: ${body.text}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      });
    }),
  ],
};

/**
 * All handlers combined
 */
export const allHandlers = [
  ...createCrudHandlers('contact', mockData.contacts),
  ...createCrudHandlers('task', mockData.tasks),
  ...createCrudHandlers('user', mockData.users),
  ...pluginHandlers.form,
  ...pluginHandlers.view,
  ...pluginHandlers.grid,
  ...pluginHandlers.kanban,
  ...pluginHandlers.charts,
  ...pluginHandlers.dashboard,
  ...pluginHandlers.calendar,
  ...pluginHandlers.timeline,
  ...pluginHandlers.map,
  ...pluginHandlers.gantt,
  ...pluginHandlers.chatbot,
];
