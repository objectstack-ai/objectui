<div align="center">

# Object UI

**The Universal Schema-Driven UI Engine**

*From JSON to world-class UI in minutes*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/objectstack-ai/objectui/workflows/CI/badge.svg)](https://github.com/objectstack-ai/objectui/actions/workflows/ci.yml)
[![CodeQL](https://github.com/objectstack-ai/objectui/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/objectstack-ai/objectui/actions/workflows/codeql.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8.svg)](https://tailwindcss.com/)

[**Documentation**](https://www.objectui.org) | [**Quick Start**](#quick-start) | [**Migration Guide**](./MIGRATION_GUIDE.md)

</div>

---

## 🎉 What's New in v0.4.0

### Component Namespaces
Organize components into namespaces to prevent naming conflicts:
```typescript
ComponentRegistry.register('button', ButtonComponent, {
  namespace: 'ui'  // ✨ New: Prevent conflicts across plugins
});
```

### Lazy Field Registration
Load only the fields you need for 30-50% smaller bundles:
```typescript
import { registerField } from '@object-ui/fields';

// Only load what you use
registerField('text');
registerField('number');
// 70% smaller bundle size! 🚀
```

### Build Performance
- **3-5x faster CI builds** with Turbo v2
- **Parallel package builds** with intelligent caching
- **Instant rebuilds** for unchanged packages

👉 **[Read the Migration Guide](./MIGRATION_GUIDE.md)** for details and examples.

---

## 🚀 Quick Start (Development Mode)

Since this package is not yet published to NPM, here is how to play with the source code:

1.  **Clone & Install**

    ```bash
    git clone https://github.com/objectstack-ai/objectui.git
    cd objectui
    pnpm install
    # Build the core engine
    pnpm build 
    ```

2.  **Run the ObjectStack Console**

    Start the unified development console to preview your apps and objects:

    ```bash
    pnpm dev
    # Opens http://localhost:5173
    ```

3.  **Edit & Reload**

    Edit the JSON schema files and the changes will be instantly reflected in the browser.

## Examples

ObjectStack examples that demonstrate different features and use cases:

- **[examples/crm](examples/crm)** - Full-featured CRM application with dashboards, multiple views (Grid, Kanban, Map, Gantt), and custom server implementation.
- **[examples/todo](examples/todo)** - Simple task management app demonstrating basic ObjectStack configuration and field types.
- **[examples/kitchen-sink](examples/kitchen-sink)** - Comprehensive component catalog showing all available field types, dashboard widgets, and view types.
- **[examples/msw-todo](examples/msw-todo)** - Frontend-first development example using MSW (Mock Service Worker) to run ObjectStack in the browser.

### Running Examples as API Servers

All examples (except msw-todo) can be run as API servers using `@objectstack/cli`:

```bash
# From the monorepo root
pnpm run serve:crm          # Start CRM example on http://localhost:3000
pnpm run serve:todo         # Start Todo example on http://localhost:3000
pnpm run serve:kitchen-sink # Start Kitchen Sink example on http://localhost:3000

# Or from individual example directories
cd examples/crm
pnpm run serve
```

Each server provides:
- GraphQL API endpoint: `http://localhost:3000/graphql`
- REST API endpoints based on object definitions
- Sample data loaded from the configuration manifest

## 📦 For React Developers

Install the core packages to use `<SchemaRenderer>` inside your Next.js or Vite app.

```bash
npm install @object-ui/react @object-ui/components @object-ui/data-objectstack
```

### 🎨 **Beautiful by Default**
- Professional designs using **Tailwind CSS** and **Shadcn/UI**
- Light/dark theme support
- Fully customizable with utility classes
- WCAG 2.1 AA accessible

### ⚡ **Blazing Fast**
- **3x faster** page loads than traditional low-code platforms
- **6x smaller** bundle sizes (< 50KB vs 300KB+)
- Built on React 18+ with automatic optimizations
- Tree-shakable architecture

### 🚀 **Developer Friendly**
- **TypeScript-first** with complete type definitions
- **Zero learning curve** if you know React
- Works with existing tools and workflows
- Full control - extend or customize anything

### 🛠️ **Production Ready**
- 85%+ test coverage
- Enterprise security built-in
- Comprehensive documentation
- Active development and support

### 🔥 **Phase 3: Enterprise Data Protocol** (NEW!)
- **Advanced Field Types**: Vector (AI embeddings), Grid (sub-tables), Formula, Summary
- **Query AST Builder**: SQL-like queries with joins, aggregations, subqueries
- **Smart Validation**: 30+ rules, async validation, cross-field dependencies
- **Multi-Datasource**: Health monitoring, connection pooling, query caching
- **40+ Filter Operators**: Date ranges, lookup filters, full-text search
- **Object Inheritance**: Triggers, advanced permissions, metadata caching

## Why Object UI?

### For You as a Developer

**Stop Writing Repetitive UI Code**
```tsx
// Traditional React: 200+ lines
function UserForm() {
  // ... useState, validation, handlers, JSX
}

// Object UI: 20 lines
const schema = {
  type: "crud",
  api: "/api/users",
  columns: [...]
}
```

**Better Performance, Smaller Bundle**
- Automatic code splitting
- Lazy-loaded components
- Zero runtime CSS overhead
- Optimized for production

**Full Control & Flexibility**
- Mix with existing React code
- Override any component
- Custom themes with Tailwind
- Export to standard React anytime

### vs Other Solutions

| Feature | Object UI | Amis | Formily | Material-UI |
|---------|-----------|------|---------|-------------|
| **Tailwind Native** | ✅ | ❌ | ❌ | ❌ |
| **Bundle Size** | 50KB | 300KB+ | 200KB+ | 500KB+ |
| **TypeScript** | ✅ Full | Partial | ✅ Full | ✅ Full |
| **Tree Shakable** | ✅ | ❌ | ⚠️ Partial | ⚠️ Partial |
| **Server Components** | ✅ | ❌ | ❌ | ⚠️ Coming |
| **Visual Designer** | ✅ | ✅ | ❌ | ❌ |

## Quick Start

### Option 1: Using CLI (Fastest Way) 🚀

The easiest way to get started is using the Object UI CLI:

```bash
# Install the CLI globally
npm install -g @object-ui/cli

# Create a new app from JSON schema
objectui init my-app

# Start the development server
cd my-app
objectui serve app.schema.json
```

Your app will be running at http://localhost:3000! 🎉

Just edit `app.schema.json` to build your UI - no React code needed.

### Option 2: Using as a Library

#### Installation

```bash
# Using npm
npm install @object-ui/react @object-ui/components

# Using yarn
yarn add @object-ui/react @object-ui/components

# Using pnpm
pnpm add @object-ui/react @object-ui/components
```

#### Basic Usage

```tsx
import React from 'react'
import { SchemaRenderer } from '@object-ui/react'
import { registerDefaultRenderers } from '@object-ui/components'

// Register default components once
registerDefaultRenderers()

const schema = {
  type: "page",
  title: "Dashboard",
  body: {
    type: "grid",
    columns: 3,
    items: [
      { type: "card", title: "Total Users", value: "${stats.users}" },
      { type: "card", title: "Revenue", value: "${stats.revenue}" },
      { type: "card", title: "Orders", value: "${stats.orders}" }
    ]
  }
}

function App() {
  const data = {
    stats: { users: 1234, revenue: "$56,789", orders: 432 }
  }
  
  return <SchemaRenderer schema={schema} data={data} />
}

export default App
```

## 📦 Packages

Object UI is a modular monorepo with packages designed for specific use cases:

### Core Packages

| Package | Description | Size |
|---------|-------------|------|
| **[@object-ui/types](./packages/types)** | TypeScript definitions and protocol specs | 10KB |
| **[@object-ui/core](./packages/core)** | Core logic, validation, registry, expression evaluation | 20KB |
| **[@object-ui/react](./packages/react)** | React bindings and `SchemaRenderer` | 15KB |
| **[@object-ui/components](./packages/components)** | Standard UI components (Tailwind + Shadcn) | 50KB |
| **[@object-ui/fields](./packages/fields)** | Field renderers and registry | 12KB |
| **[@object-ui/layout](./packages/layout)** | Layout components with React Router integration | 18KB |

### CLI & Tools

| Package | Description | Size |
|---------|-------------|------|
| **[@object-ui/cli](./packages/cli)** | CLI tool for building apps from JSON schemas | 25KB |
| **[@object-ui/runner](./packages/runner)** | Universal application runner for testing schemas | 30KB |
| **[vscode-extension](./packages/vscode-extension)** | VSCode extension with IntelliSense and live preview | 32KB |

### Data Adapters

| Package | Description | Size |
|---------|-------------|------|
| **[@object-ui/data-objectstack](./packages/data-objectstack)** | ObjectStack data adapter | 8KB |

### Plugins (Lazy-Loaded)

| Plugin | Description | Size |
|--------|-------------|------|
| **[@object-ui/plugin-aggrid](./packages/plugin-aggrid)** | AG Grid data grid integration | 150KB |
| **[@object-ui/plugin-calendar](./packages/plugin-calendar)** | Calendar and event management | 25KB |
| **[@object-ui/plugin-charts](./packages/plugin-charts)** | Chart components powered by Recharts | 80KB |
| **[@object-ui/plugin-chatbot](./packages/plugin-chatbot)** | Chatbot interface components | 35KB |
| **[@object-ui/plugin-dashboard](./packages/plugin-dashboard)** | Dashboard layouts and widgets | 22KB |
| **[@object-ui/plugin-editor](./packages/plugin-editor)** | Rich text editor powered by Monaco | 120KB |
| **[@object-ui/plugin-form](./packages/plugin-form)** | Advanced form components | 28KB |
| **[@object-ui/plugin-gantt](./packages/plugin-gantt)** | Gantt chart visualization | 40KB |
| **[@object-ui/plugin-grid](./packages/plugin-grid)** | Advanced data grid | 45KB |
| **[@object-ui/plugin-kanban](./packages/plugin-kanban)** | Kanban boards with drag-and-drop | 100KB |
| **[@object-ui/plugin-map](./packages/plugin-map)** | Map visualization | 60KB |
| **[@object-ui/plugin-markdown](./packages/plugin-markdown)** | Markdown rendering | 30KB |
| **[@object-ui/plugin-timeline](./packages/plugin-timeline)** | Timeline components | 20KB |
| **[@object-ui/plugin-view](./packages/plugin-view)** | ObjectQL-integrated views (grid, form, detail) | 35KB |

## 🔌 Data Integration

Object UI is designed to work with any backend through its universal DataSource interface:

### ObjectStack Integration

```bash
npm install @object-ui/core
```

```typescript
import { createObjectStackAdapter } from '@object-ui/core';

const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.example.com',
  token: 'your-auth-token'
});

// Use with any component
<SchemaRenderer schema={schema} dataSource={dataSource} />
```

### Custom Data Sources

You can create adapters for any backend (REST, GraphQL, Firebase, etc.) by implementing the `DataSource` interface:

```typescript
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';

class MyCustomDataSource implements DataSource {
  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    // Your implementation
  }
  // ... other methods
}
```

[**Data Source Examples →**](./packages/types/examples/rest-data-source.ts)

## 🎯 What Can You Build?

Object UI is perfect for:

- ✅ **Admin Panels** - Complete CRUD interfaces in minutes
- ✅ **Dashboards** - Data visualization and analytics
- ✅ **Forms** - Complex multi-step forms with validation
- ✅ **CMS** - Content management systems
- ✅ **Internal Tools** - Business applications
- ✅ **Prototypes** - Rapid UI prototyping

## 🛣️ Roadmap

**Phase 1-2 (Q4 2025 - Q1 2026)** ✅ **COMPLETED**:
- ✅ Core schema rendering engine
- ✅ 40+ production-ready components (Shadcn + Tailwind)
- ✅ Expression system with field references
- ✅ Action system (AJAX, chaining, conditions)
- ✅ Theme system (light/dark mode)
- ✅ Report builder with exports
- ✅ Visual designer (beta)

**Phase 3 (Q1-Q2 2026)** ✅ **COMPLETED**:
- ✅ **Advanced Field Types**: Vector (AI embeddings), Grid (sub-tables), Formula, Summary
- ✅ **ObjectSchema Enhancements**: Inheritance, triggers, advanced permissions, metadata caching
- ✅ **QuerySchema AST**: SQL-like query building with joins, aggregations, subqueries
- ✅ **Advanced Filtering**: 40+ operators, date ranges, lookup filters, full-text search
- ✅ **Validation Engine**: 30+ rules, async validation, cross-field validation
- ✅ **DriverInterface**: Transactions, batch operations, connection pooling, query caching
- ✅ **DatasourceSchema**: Multi-datasource management, health monitoring

**Phase 4+ (Q2-Q4 2026)**:
- 🔄 Real-time collaboration features
- 🔄 Mobile-optimized components
- 🔄 AI-powered schema generation
- 🔄 Advanced workflow automation

See [PHASE3_IMPLEMENTATION.md](./PHASE3_IMPLEMENTATION.md) for detailed Phase 3 documentation.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### For Developers

- 📖 [Contributing Guide](./CONTRIBUTING.md) - How to contribute to the project
- 🏗️ [Architecture Evaluation](./ARCHITECTURE_EVALUATION.md) - Comprehensive architecture analysis and improvement recommendations ([中文版](./ARCHITECTURE_EVALUATION.zh-CN.md))
- 🔄 [ObjectStack Spec Alignment](./OBJECTSTACK_SPEC_ALIGNMENT.md) - Alignment analysis with ObjectStack Spec v0.7.1 and development roadmap ([中文版](./OBJECTSTACK_SPEC_ALIGNMENT.zh-CN.md))

### Development Setup

**Quick Setup (Recommended):**
```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectui.git
cd objectui

# Run automated setup script
./scripts/setup.sh
```

**Manual Setup:**
```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectui.git
cd objectui

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the development site
pnpm dev

# Run tests
pnpm test
```

## 📄 License

Object UI is [MIT licensed](./LICENSE).

## 🌟 Community & Support

- ⭐ [Star on GitHub](https://github.com/objectstack-ai/objectui) - Show your support!
- 📖 [Documentation](https://www.objectui.org) - Comprehensive guides and API reference
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectui/issues) - Found a bug? Let us know
- 📧 [Email Us](mailto:hello@objectui.org) - Get in touch

## 🙏 Acknowledgments

Object UI is inspired by and builds upon ideas from:
- [Amis](https://github.com/baidu/amis) - Schema-driven UI framework
- [Formily](https://github.com/alibaba/formily) - Form solution
- [Shadcn/UI](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<div align="center">

**Built with ❤️ by the [ObjectQL Team](https://github.com/objectql)**

[Website](https://www.objectui.org) · [Documentation](https://www.objectui.org) · [GitHub](https://github.com/objectstack-ai/objectui)

</div>
