# MSW Setup Guide for ObjectUI Component Development

## Overview

This guide explains how to use Mock Service Worker (MSW) for frontend-first component development in ObjectUI. With MSW, you can develop and test all components without requiring a backend server.

## Architecture

```
React Component → API Call → MSW (Service Worker) → ObjectStack Kernel (Browser) → In-Memory Driver
```

MSW intercepts all API calls and routes them to an ObjectStack Kernel running entirely in your browser's memory.

## Quick Start (< 30 seconds)

### 1. Start Storybook

```bash
pnpm storybook
```

That's it! Storybook automatically:
- Initializes the MSW service worker
- Starts the ObjectStack kernel in browser memory
- Loads mock data for all components
- Enables hot reload for instant feedback

### 2. View Components

Open http://localhost:6006 in your browser. All 79+ components are ready to use with mock data.

### 3. Debug MSW

Click the "🐛 MSW Debug" button in the bottom-right corner to:
- View all API requests and responses
- Inspect ObjectStack kernel state
- Browse available mock data collections

## Using MSW in Your Stories

### Basic Example

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '../SchemaRenderer';

const meta = {
  title: 'Components/MyComponent',
  component: SchemaRenderer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SchemaRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SchemaRenderer schema={args as any} />,
  args: {
    type: 'my-component',
    props: {
      variant: 'default',
    },
  },
};
```

### Using Mock Data

```typescript
import { mockData } from '@storybook-config/msw-handlers';

export const WithData: Story = {
  render: (args) => <SchemaRenderer schema={args as any} />,
  args: {
    type: 'data-table',
    props: {
      data: mockData.contacts.slice(0, 10),
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ],
    },
  },
};
```

### Custom MSW Handlers

```typescript
import { http, HttpResponse } from 'msw';

export const CustomAPI: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/custom/endpoint', () => {
          return HttpResponse.json({ data: 'custom response' });
        }),
      ],
    },
  },
  render: (args) => <SchemaRenderer schema={args as any} />,
  args: {
    type: 'my-component',
  },
};
```

## Available Mock Data

The following mock data collections are available in `@storybook-config/msw-handlers`:

| Collection | Count | Use Case |
|------------|-------|----------|
| `mockData.contacts` | 50 | Contact forms, lists, CRM demos |
| `mockData.tasks` | 100 | Task lists, project management |
| `mockData.users` | 20 | User lookups, assignments |
| `mockData.kanbanColumns` | 4 | Kanban boards |
| `mockData.kanbanCards` | 30 | Kanban cards |
| `mockData.chartData` | - | Charts and graphs |
| `mockData.dashboardMetrics` | - | Dashboard statistics |
| `mockData.calendarEvents` | 20 | Calendar views |
| `mockData.timelineItems` | 15 | Timeline displays |
| `mockData.mapLocations` | 25 | Map components |
| `mockData.ganttTasks` | 10 | Gantt charts |
| `mockData.chatMessages` | 30 | Chat interfaces |

## Plugin Testing

### Form Plugin

```typescript
import { pluginHandlers } from '@storybook-config/msw-handlers';

export const FormStory: Story = {
  parameters: {
    msw: {
      handlers: pluginHandlers.form,
    },
  },
  render: () => <ObjectForm object="contact" />,
};
```

### Grid Plugin

```typescript
export const GridStory: Story = {
  parameters: {
    msw: {
      handlers: pluginHandlers.grid,
    },
  },
  render: () => <ObjectGrid object="task" />,
};
```

### Kanban Plugin

```typescript
export const KanbanStory: Story = {
  parameters: {
    msw: {
      handlers: pluginHandlers.kanban,
    },
  },
  render: () => <KanbanBoard />,
};
```

## Creating Custom Mock Data

### Step 1: Define Your Data

```typescript
// In your story file
const customData = Array.from({ length: 20 }, (_, i) => ({
  id: `item-${i}`,
  name: `Item ${i}`,
  value: Math.random() * 100,
}));
```

### Step 2: Create CRUD Handlers

```typescript
import { createCrudHandlers } from '@storybook-config/msw-handlers';

export const CustomDataStory: Story = {
  parameters: {
    msw: {
      handlers: createCrudHandlers('custom-object', customData),
    },
  },
  render: () => <YourComponent />,
};
```

## Debugging

### Enable Request Logging

The MSW debug panel automatically logs all requests. To see console logs:

```typescript
// Already enabled in .storybook/msw-browser.ts
kernel.use(new MSWPlugin({
  enableBrowser: true,
  baseUrl: '/api/v1',
  logRequests: true, // ← Already enabled
}));
```

### Inspect Kernel State

Open the MSW Debug Panel and click the "Kernel State" tab to view:
- Kernel status
- Loaded plugins
- Configuration

### View Request History

Open the MSW Debug Panel and click the "Requests" tab to:
- See all API requests
- View request/response payloads
- Check response times
- Filter by HTTP method

## Common Patterns

### Loading States

```typescript
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/data/contact', async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return HttpResponse.json({ data: mockData.contacts });
        }),
      ],
    },
  },
  render: () => <ContactList />,
};
```

### Error States

```typescript
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/data/contact', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
  render: () => <ContactList />,
};
```

### Empty States

```typescript
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/data/contact', () => {
          return HttpResponse.json({ data: [], total: 0 });
        }),
      ],
    },
  },
  render: () => <ContactList />,
};
```

## Accessibility Testing

All stories automatically include accessibility checks via `@storybook/addon-a11y`. View the "Accessibility" tab in Storybook to see:
- WCAG violations
- Best practice recommendations
- Color contrast issues
- Keyboard navigation issues

## Interactive Controls

Add interactive controls to your stories using `argTypes`:

```typescript
const meta = {
  title: 'Components/Button',
  component: SchemaRenderer,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof SchemaRenderer>;
```

## Hot Reload

When you edit:
- **Story files**: Changes appear instantly (< 1 second)
- **Component files**: Vite HMR rebuilds (< 5 seconds)
- **Schema files**: Changes reflected in next render

## Troubleshooting

### Service Worker Not Starting

**Problem**: MSW fails to initialize

**Solution**:
```bash
# Re-initialize MSW public scripts
pnpm dlx msw init public/ --save
```

### Mock Data Not Loading

**Problem**: API calls return 404

**Solution**:
1. Check MSW Debug Panel → Requests tab
2. Verify the request URL matches your handler pattern
3. Ensure handlers are imported in `.storybook/mocks.ts`

### Kernel Bootstrap Failure

**Problem**: ObjectStack kernel fails to start

**Solution**:
1. Open browser console
2. Look for "[Storybook MSW]" logs
3. Check if config is loaded: `crmConfig` should exist
4. Verify all required plugins are installed

### Story Not Updating

**Problem**: Changes don't appear after edit

**Solution**:
1. Check for TypeScript errors in terminal
2. Verify file is saved
3. Try force refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. Restart Storybook if HMR fails

## Performance Tips

### 1. Use Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const Heavy: Story = {
  render: () => (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  ),
};
```

### 2. Limit Mock Data

```typescript
// Instead of loading all 100 tasks
const data = mockData.tasks; // ❌ Slow

// Load only what you need
const data = mockData.tasks.slice(0, 10); // ✅ Fast
```

### 3. Use CSF3 Format

```typescript
// Modern format (CSF3) - faster rendering
export const Default: Story = {
  args: { /* ... */ },
};

// Old format - avoid
export const Default = () => <Component />;
```

## Best Practices

### ✅ DO

- Use `mockData` collections for consistency
- Add interactive controls for all configurable props
- Test loading, error, and empty states
- Enable accessibility checks
- Use meaningful story names
- Document edge cases

### ❌ DON'T

- Don't mock external APIs (Google Maps, payment providers)
- Don't use real credentials or tokens
- Don't create stories with side effects
- Don't skip accessibility testing
- Don't use inline styles (use Tailwind classes)

## Migration to Production

When ready to connect to a real backend:

### 1. Keep Your Stories

Stories remain useful for:
- Component documentation
- Visual regression testing
- Design system reference
- Onboarding new developers

### 2. Switch Data Source

In your app (not Storybook):

```typescript
// Development with MSW
const client = new ObjectStackClient({ baseUrl: '/api/v1' });

// Production with real API
const client = new ObjectStackClient({ baseUrl: 'https://api.yourapp.com' });
```

### 3. Reuse Schemas

Your ObjectStack configs work unchanged:

```typescript
// objectstack.config.ts - works in both MSW and production
export default defineStack({
  objects: [
    { name: 'contact', fields: { /* ... */ } },
  ],
});
```

## Next Steps

- [Component Gallery](./COMPONENT_GALLERY.md) - Browse all 79+ components
- [Plugin Development](./PLUGIN_DEVELOPMENT.md) - Create custom plugins
- [Testing Guide](./TESTING_GUIDE.md) - Write comprehensive tests
- [Deployment](./DEPLOYMENT.md) - Deploy Storybook to GitHub Pages

## Support

- GitHub Issues: https://github.com/objectstack-ai/objectui/issues
- Documentation: https://www.objectui.org
- Examples: `/examples/msw-todo`
