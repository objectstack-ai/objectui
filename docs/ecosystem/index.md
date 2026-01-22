---
title: "Ecosystem"
description: "ObjectUI integrations and ecosystem"
---

# ObjectUI Ecosystem

ObjectUI integrates seamlessly with various backends and tools to create a complete development experience.

## Backend Integration

### ObjectQL

[ObjectQL](https://github.com/objectstack-ai/objectql) is the recommended backend for ObjectUI, providing a complete type-safe API layer from YAML schemas.

**Benefits:**
- 🎯 **Protocol-Driven**: Define APIs and UIs from schemas
- 🔒 **Type-Safe**: End-to-end TypeScript types
- ⚡ **Fast Development**: Build full-stack apps faster
- 🔄 **Real-time Sync**: Schema changes update both frontend and backend

[**Learn more →**](./objectql)

### REST APIs

ObjectUI works with any REST API through the DataSource interface.

**Features:**
- Universal adapter pattern
- Built-in error handling
- Request/response transformation
- Authentication support

[**Learn more →**](./api)

### GraphQL

Create a custom DataSource adapter for GraphQL backends.

**Example:**
```typescript
import type { DataSource } from '@object-ui/types';

class GraphQLDataSource implements DataSource {
  async find(resource: string, params?: any) {
    const query = `
      query Get${resource}($id: ID!) {
        ${resource}(id: $id) { id name }
      }
    `;
    // ... implementation
  }
}
```

## Deployment

### Static Hosting

Deploy ObjectUI apps to:
- **Vercel** - Recommended for Next.js apps
- **Netlify** - Great for static sites
- **GitHub Pages** - Free hosting
- **Cloudflare Pages** - Global CDN

[**Deployment Guide →**](./deployment/showcase-deployment)

### Containerization

Deploy with Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Cloud Platforms

Deploy to cloud providers:
- **AWS** (S3 + CloudFront, ECS, Lambda)
- **Google Cloud** (Cloud Run, App Engine)
- **Azure** (Static Web Apps, App Service)
- **DigitalOcean** (App Platform, Droplets)

## Development Tools

### VSCode Extension

The ObjectUI VSCode extension provides:
- **IntelliSense** for JSON schemas
- **Live preview** of components
- **Validation** and error checking
- **Snippets** for common patterns

[**Get Extension →**](https://marketplace.visualstudio.com/items?itemName=objectui.vscode-objectui)

### CLI

The ObjectUI CLI helps you:
- Scaffold new projects
- Run development servers
- Generate components
- Validate schemas

[**CLI Guide →**](/guide/cli/getting-started)

### Designer

The visual designer allows you to:
- Build UIs with drag-and-drop
- Preview in real-time
- Export to JSON schemas
- Collaborate on designs

[**Designer Guide →**](/guide/studio)

## Plugins

Extend ObjectUI with plugins:

### Official Plugins

- **[@object-ui/plugin-charts](../plugins/plugin-charts)** - Chart components using Chart.js
- **[@object-ui/plugin-kanban](../plugins/plugin-kanban)** - Kanban board with drag-and-drop
- **[@object-ui/plugin-editor](../plugins/plugin-editor)** - Rich text editor
- **[@object-ui/plugin-markdown](../plugins/plugin-markdown)** - Markdown renderer

### Community Plugins

Browse community plugins:
- [Awesome ObjectUI](https://github.com/objectstack-ai/awesome-objectui)

### Creating Plugins

Create your own plugin:

```typescript
import { registerRenderer } from '@object-ui/core';

export function registerMyPlugin() {
  registerRenderer('my-component', MyComponent);
}
```

[**Plugin Development Guide →**](/concepts/plugins)

## Frameworks

ObjectUI works with popular React frameworks:

### Next.js

Perfect for:
- Server-side rendering
- Static site generation
- API routes
- Edge functions

```bash
npx create-next-app my-app
cd my-app
pnpm add @object-ui/react @object-ui/components
```

### Vite

Ideal for:
- Fast development
- Optimized builds
- Modern tooling

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
pnpm add @object-ui/react @object-ui/components
```

### Remix

Great for:
- Progressive enhancement
- Nested routing
- Data loading

```bash
npx create-remix@latest
pnpm add @object-ui/react @object-ui/components
```

## Testing

### Unit Testing

Test components with Vitest:

```typescript
import { render } from '@testing-library/react';
import { SchemaRenderer } from '@object-ui/react';

test('renders schema', () => {
  const schema = { type: 'text', value: 'Hello' };
  const { getByText } = render(<SchemaRenderer schema={schema} />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

### E2E Testing

Test with Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('form submission', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Monitoring

### Error Tracking

Integrate with error tracking services:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn',
  integrations: [new Sentry.BrowserTracing()],
});

<SchemaRenderer 
  schema={schema}
  onError={(error) => Sentry.captureException(error)}
/>
```

### Analytics

Track usage with analytics:

```typescript
import { registerAction } from '@object-ui/core';
import analytics from './analytics';

registerAction('track', (context, action) => {
  analytics.track(action.event, action.properties);
});
```

## Resources

- **Documentation**: [objectui.org](https://objectui.org)
- **GitHub**: [github.com/objectstack-ai/objectui](https://github.com/objectstack-ai/objectui)
- **Examples**: [Examples folder](https://github.com/objectstack-ai/objectui/tree/main/examples)
- **Discussions**: [GitHub Discussions](https://github.com/objectstack-ai/objectui/discussions)
- **Blog**: [ObjectUI Blog](https://blog.objectui.org)

---

**Questions about the ecosystem?**

- 💬 [Ask in Discussions](https://github.com/objectstack-ai/objectui/discussions)
- 📧 [Email us](mailto:hello@objectui.org)
