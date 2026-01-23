---
title: "Frequently Asked Questions"
description: "Common questions about ObjectUI and their answers"
---

# Frequently Asked Questions

## General Questions

### What is ObjectUI?

ObjectUI is a universal, server-driven UI engine that transforms JSON schemas into pixel-perfect React components using Tailwind CSS and Shadcn/UI primitives. It enables you to build complex enterprise UIs (dashboards, forms, CRUDs, Kanbans) through configuration instead of code.

### How is ObjectUI different from other low-code platforms?

ObjectUI is unique because it:
- Uses **modern frontend stack** (React 18+, Tailwind CSS, Shadcn/UI) - not a proprietary framework
- Produces **standard React components** - no vendor lock-in
- Is **fully customizable** - override any component or style
- Has **small bundle size** (~50KB vs 300KB+ for alternatives)
- Is **developer-friendly** - TypeScript-first with complete type safety

### Is ObjectUI production-ready?

Yes! ObjectUI has:
- 85%+ test coverage
- Active development and maintenance
- Security scanning with CodeQL
- Comprehensive documentation
- Real-world usage in production applications

## Getting Started

### Do I need to know React to use ObjectUI?

**For JSON-based apps (using CLI)**: No. You can build complete applications using only JSON schemas.

**For library integration**: Basic React knowledge is helpful for integrating ObjectUI into existing projects.

### Can I use ObjectUI with my existing React app?

Yes! ObjectUI is designed to work seamlessly with existing React applications. You can:
- Use `<SchemaRenderer>` components alongside your existing components
- Gradually migrate parts of your UI to JSON schemas
- Mix ObjectUI components with hand-coded React

### What are the prerequisites?

- **Node.js** 18 or higher
- **React** 18 or higher (for library usage)
- **Tailwind CSS** 3 or higher (for styling)

## Technical Questions

### Does ObjectUI work with Next.js / Vite / Create React App?

Yes! ObjectUI works with any React-based framework:
- **Next.js** (App Router and Pages Router)
- **Vite**
- **Create React App**
- **Remix**
- Any other React framework

### Can I use ObjectUI with TypeScript?

Absolutely! ObjectUI is built with TypeScript and provides complete type definitions for all packages. You get full IntelliSense and type checking.

### How do I handle authentication and authorization?

ObjectUI provides several approaches:
1. **Expression-based visibility**: Use `visibleOn` to conditionally show/hide components based on user roles
2. **Data sources**: Implement authentication in your `DataSource` adapter
3. **Custom components**: Create custom auth components and register them
4. **Backend integration**: Let your backend control what schemas are served to different users

### Can I customize the styling?

Yes! You have full control over styling:
- Use Tailwind utility classes directly in your JSON schemas
- Override component styles with `className` prop
- Create custom component variants
- Extend the Tailwind theme configuration
- Replace built-in components with your own

### How do I handle forms and validation?

ObjectUI has built-in form support with:
- **Schema-based validation**: Define validation rules in JSON
- **Real-time validation**: Automatic client-side validation
- **Custom validators**: Create custom validation functions
- **Multi-step forms**: Built-in support for wizard-style forms
- **Conditional fields**: Show/hide fields based on other field values

## Data & Backend

### Do I need a specific backend?

No! ObjectUI is backend-agnostic. It works with:
- **REST APIs** (most common)
- **GraphQL** endpoints
- **ObjectQL** (recommended for full-stack experience)
- **Firebase / Supabase**
- **Static JSON files** (for prototyping)
- Any backend via custom `DataSource` implementations

### How do I connect to my API?

Implement the `DataSource` interface:

```typescript
import type { DataSource } from '@object-ui/types';

class MyDataSource implements DataSource {
  async find(resource: string, params?: any) {
    const response = await fetch(`/api/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response.json();
  }
  // ... other methods
}
```

### Can I use ObjectUI without a backend?

Yes! For prototyping and demos, you can:
- Use static JSON data passed to `<SchemaRenderer>`
- Load schemas from static files
- Use mock data sources

## Customization & Extension

### Can I create custom components?

Yes! Register custom components:

```typescript
import { registerRenderer } from '@object-ui/core';
import { MyWidget } from './components/MyWidget';

registerRenderer('my-widget', MyWidget);
```

Then use in schemas:
```json
{
  "type": "my-widget",
  "props": { ... }
}
```

### Can I override built-in components?

Yes! Simply register your component with the same type name:

```typescript
registerRenderer('button', MyCustomButton);
```

### How do I add custom business logic?

Several approaches:
1. **Actions**: Define action handlers in JSON schemas
2. **Custom hooks**: Use React hooks in custom components
3. **Expression system**: Write logic in expression strings
4. **Event handlers**: Register global event handlers
5. **Plugins**: Create reusable plugin packages

## Performance

### What's the bundle size?

Core packages are very small:
- `@object-ui/core`: ~20KB
- `@object-ui/react`: ~15KB
- `@object-ui/components`: ~50KB
- **Total**: ~85KB (gzipped)

Plugins are lazy-loaded on demand.

### Does ObjectUI support code splitting?

Yes! ObjectUI supports:
- **Automatic code splitting** per component
- **Lazy-loaded plugins** (charts, editors, etc.)
- **Dynamic imports** for large schemas
- **Tree-shaking** to eliminate unused code

### How does performance compare to hand-coded React?

ObjectUI has minimal overhead:
- **Initial load**: Comparable to hand-coded React
- **Runtime**: Near-identical (same React rendering)
- **Bundle size**: Often smaller due to shared components
- **Optimization**: Automatic React optimizations (memoization, etc.)

## Deployment & Production

### How do I deploy an ObjectUI app?

Deploy like any React application:
- **Static hosting**: Netlify, Vercel, GitHub Pages
- **Traditional servers**: nginx, Apache
- **Cloud platforms**: AWS, Google Cloud, Azure
- **Containers**: Docker, Kubernetes

### Can I use ObjectUI in a monorepo?

Yes! ObjectUI itself is a monorepo. It works well with:
- Turborepo
- Nx
- Lerna
- pnpm workspaces

### Is ObjectUI suitable for enterprise applications?

Yes! ObjectUI is designed for enterprise use:
- **Security**: Regular security scanning, no known vulnerabilities
- **Scalability**: Used in production applications
- **Maintainability**: Clear architecture, comprehensive tests
- **Support**: Active development, responsive community

## Troubleshooting

### My styles aren't working

**Solution**: Ensure Tailwind is scanning ObjectUI packages:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@object-ui/**/*.{js,jsx,ts,tsx}" // Add this
  ]
}
```

### Components aren't rendering

**Solution**: Make sure you registered renderers:

```typescript
import { registerDefaultRenderers } from '@object-ui/components';
registerDefaultRenderers(); // Call this once at app startup
```

### TypeScript errors in JSON schemas

**Solution**: Use the schema types:

```typescript
import type { PageSchema } from '@object-ui/types';

const schema: PageSchema = {
  type: "page",
  // ... TypeScript will validate this
}
```

For more troubleshooting, see the [Troubleshooting Guide](/troubleshooting).

## Community & Support

### How do I get help?

- **Documentation**: [objectui.org](https://objectui.org)
- **GitHub Discussions**: Ask questions and share ideas
- **GitHub Issues**: Report bugs and request features
- **Examples**: Check the `/examples` folder in the repository

### How can I contribute?

We welcome contributions! See the [Contributing Guide](/community/contributing) for:
- Code contributions
- Documentation improvements
- Bug reports
- Feature requests

### Is there a roadmap?

Yes! See our [Roadmap](/community/roadmap) for:
- Upcoming features
- Release timeline
- Current priorities

### Where can I find examples?

- **Documentation**: Component examples throughout the docs
- **Storybook**: (coming soon)

## Licensing & Commercial Use

### What's the license?

ObjectUI is MIT licensed. You can:
- Use it in commercial projects
- Modify and distribute it
- Use it in closed-source projects
- No attribution required (but appreciated!)

### Can I use ObjectUI in a commercial product?

Yes! The MIT license allows commercial use without restrictions.

### Do I need to pay for ObjectUI?

No! ObjectUI is completely free and open-source.

---

**Still have questions?** 

- 💬 [Ask in GitHub Discussions](https://github.com/objectstack-ai/objectui/discussions)
- 🐛 [Report an issue](https://github.com/objectstack-ai/objectui/issues)
- 📧 [Email us](mailto:hello@objectui.org)
