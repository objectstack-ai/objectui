import { defineStack } from '@objectstack/spec';
import { App } from '@objectstack/spec/ui';
import { KitchenSinkObject } from './src/objects/kitchen_sink.object';
import { AccountObject } from './src/objects/account.object';

// Helper to create dates relative to today
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export default defineStack({
  objects: [
    KitchenSinkObject,
    AccountObject
  ],
  apps: [
    App.create({
      name: 'analytics_app',
      label: 'Showcase',
      icon: 'sparkles',
      description: 'All field types, dashboard widgets, and page layouts',
      branding: {
        primaryColor: '#8B5CF6',
      },
      navigation: [
        {
          id: 'nav_dash',
          type: 'dashboard',
          dashboardName: 'showcase_dashboard',
          label: 'Dashboard',
          icon: 'layout-dashboard',
        },
        {
          id: 'nav_kitchen_sink',
          type: 'object',
          objectName: 'kitchen_sink',
          label: 'All Field Types',
          icon: 'test-tubes',
        },
        {
          id: 'nav_help',
          type: 'page',
          pageName: 'showcase_help',
          label: 'Help & Resources',
          icon: 'help-circle',
        },
      ],
    })
  ],
  dashboards: [
    {
      name: 'showcase_dashboard',
      label: 'Platform Showcase',
      description: 'Demonstrating all dashboard widget types',
      widgets: [
        // --- KPI Row ---
        {
          type: 'metric',
          layout: { x: 0, y: 0, w: 1, h: 1 },
          options: {
            label: 'Total Records',
            value: '5',
            icon: 'Database',
          },
        },
        {
          type: 'metric',
          layout: { x: 1, y: 0, w: 1, h: 1 },
          options: {
            label: 'Active Items',
            value: '4',
            trend: { value: 80, direction: 'up', label: 'active rate' },
            icon: 'Activity',
          },
        },
        {
          type: 'metric',
          layout: { x: 2, y: 0, w: 1, h: 1 },
          options: {
            label: 'Total Value',
            value: '$22,500',
            trend: { value: 15, direction: 'up', label: 'this quarter' },
            icon: 'DollarSign',
          },
        },
        {
          type: 'metric',
          layout: { x: 3, y: 0, w: 1, h: 1 },
          options: {
            label: 'Avg Rating',
            value: '4.2',
            trend: { value: 0.3, direction: 'up', label: 'improvement' },
            icon: 'Star',
          },
        },

        // --- Charts Row ---
        {
          title: 'Records by Category',
          type: 'donut',
          layout: { x: 0, y: 1, w: 2, h: 2 },
          options: {
            xField: 'category',
            yField: 'count',
          },
          data: {
            provider: 'value',
            items: [
              { category: 'Option A', count: 2 },
              { category: 'Option B', count: 2 },
              { category: 'Option C', count: 1 },
            ],
          },
        },
        {
          title: 'Value Distribution',
          type: 'bar',
          layout: { x: 2, y: 1, w: 2, h: 2 },
          options: {
            xField: 'name',
            yField: 'amount',
          },
          data: {
            provider: 'value',
            items: [
              { name: 'Alpha', amount: 1500 },
              { name: 'Beta', amount: 3200 },
              { name: 'Gamma', amount: 800 },
              { name: 'Delta', amount: 5000 },
              { name: 'Epsilon', amount: 12000 },
            ],
          },
        },

        // --- Trend Row ---
        {
          title: 'Monthly Trend',
          type: 'area',
          layout: { x: 0, y: 3, w: 4, h: 2 },
          options: {
            xField: 'month',
            yField: 'value',
          },
          data: {
            provider: 'value',
            items: [
              { month: 'Jan', value: 3200 },
              { month: 'Feb', value: 4500 },
              { month: 'Mar', value: 4100 },
              { month: 'Apr', value: 5800 },
              { month: 'May', value: 6200 },
              { month: 'Jun', value: 7500 },
            ],
          },
        },
      ],
    },
  ],
  pages: [
    {
      name: 'showcase_help',
      label: 'Help & Resources',
      type: 'app',
      regions: [
        {
          name: 'main',
          components: [
            {
              type: 'container',
              properties: {
                className: 'prose max-w-3xl mx-auto p-8 text-foreground',
                children: [
                  { type: 'text', properties: { value: '# Platform Showcase', className: 'text-3xl font-bold mb-6 block' } },
                  { type: 'text', properties: { value: 'This app demonstrates the full range of ObjectStack capabilities — all field types, dashboard widgets, and page layouts.', className: 'text-muted-foreground mb-6 block' } },
                  { type: 'text', properties: { value: '## Supported Field Types', className: 'text-xl font-semibold mb-3 block' } },
                  { type: 'text', properties: { value: '- **Text** — Text, Textarea, Code, Password, Rich Text\n- **Number** — Integer, Currency, Percentage, Rating\n- **Date** — Date, DateTime\n- **Selection** — Select (single), Multi-Select\n- **Contact** — Email, URL, Phone\n- **Media** — Image, File, Avatar, Signature\n- **Special** — Boolean, Color, Location, Formula, Auto Number\n- **Relations** — Lookup (references other objects)', className: 'whitespace-pre-line mb-6 block' } },
                  { type: 'text', properties: { value: '## Dashboard Widgets', className: 'text-xl font-semibold mb-3 block' } },
                  { type: 'text', properties: { value: '- **Metric** — KPI cards with trends\n- **Bar Chart** — Categorical comparisons\n- **Donut Chart** — Proportional breakdowns\n- **Area Chart** — Time-series trends\n- **Line Chart** — Multi-series trends\n- **Table** — Tabular data summaries', className: 'whitespace-pre-line mb-6 block' } },
                  { type: 'text', properties: { value: '## View Types', className: 'text-xl font-semibold mb-3 block' } },
                  { type: 'text', properties: { value: '- **Grid** — Default tabular view with sort, filter, search\n- **Kanban** — Card board grouped by any select field\n- **Calendar** — Date-based event visualization\n- **Gantt** — Project timeline with dependencies\n- **Timeline** — Chronological activity stream\n- **Map** — Geographic data on interactive map\n- **Gallery** — Visual card grid layout', className: 'whitespace-pre-line block' } },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  manifest: {
    id: 'com.example.kitchen-sink',
    version: '1.0.0',
    type: 'app',
    name: 'Platform Showcase',
    description: 'Demonstrates all field types, views, and dashboard widgets',
    data: [
      {
        object: 'kitchen_sink',
        mode: 'upsert',
        records: [
          {
            name: 'Alpha Configuration',
            description: 'Primary system settings panel for environment management',
            amount: 1500,
            price: 29.99,
            percent: 75.5,
            rating: 4,
            due_date: daysFromNow(10),
            event_time: daysFromNow(10),
            is_active: true,
            category: 'opt_a',
            tags: ['col_red', 'col_blue'],
            email: 'alpha@example.com',
            url: 'https://alpha.example.com',
            phone: '+1-555-0101',
            color: '#3B82F6',
          },
          {
            name: 'Beta Dashboard',
            description: 'Real-time monitoring interface with live metrics',
            amount: 3200,
            price: 149.99,
            percent: 42.0,
            rating: 5,
            due_date: daysFromNow(20),
            event_time: daysFromNow(20),
            is_active: true,
            category: 'opt_b',
            tags: ['col_green'],
            email: 'beta@example.com',
            url: 'https://beta.example.com',
            phone: '+1-555-0202',
            color: '#10B981',
          },
          {
            name: 'Gamma Report Engine',
            description: 'Automated report generation and distribution system',
            amount: 800,
            price: 49.99,
            percent: 90.25,
            rating: 3,
            due_date: daysFromNow(30),
            is_active: false,
            category: 'opt_c',
            tags: ['col_red', 'col_green', 'col_blue'],
            email: 'gamma@example.com',
            url: 'https://gamma.example.com',
            phone: '+1-555-0303',
            color: '#F59E0B',
          },
          {
            name: 'Delta API Gateway',
            description: 'Central API routing with rate limiting and auth',
            amount: 5000,
            price: 299.0,
            percent: 15.8,
            rating: 5,
            due_date: daysFromNow(-5),
            event_time: daysFromNow(-5),
            is_active: true,
            category: 'opt_a',
            email: 'delta@example.com',
            url: 'https://delta.example.com',
            phone: '+1-555-0404',
            color: '#EF4444',
          },
          {
            name: 'Epsilon ML Pipeline',
            description: 'Machine learning data processing and model training flow',
            amount: 12000,
            price: 599.99,
            percent: 60.0,
            rating: 4,
            due_date: daysFromNow(45),
            is_active: true,
            category: 'opt_b',
            tags: ['col_blue'],
            email: 'epsilon@example.com',
            url: 'https://epsilon.example.com',
            phone: '+1-555-0505',
            color: '#8B5CF6',
          },
        ],
      },
    ],
  },
});
