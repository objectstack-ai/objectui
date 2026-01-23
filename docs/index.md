---
title: "You Define the Intent. We Render the Reality."
description: "ObjectUI - The Universal Schema-Driven UI Engine for React"
layout: home

hero:
  name: ObjectUI
  text: Stop Hand-Coding Enterprise UIs
  tagline: A Server-Driven UI Engine that turns JSON into pixel-perfect React + Tailwind + Shadcn components. Build complex dashboards, forms, and data views faster—without sacrificing design quality or flexibility.
  actions:
    - theme: brand
      text: Get Started
      link: /docs/guide/quick-start
    - theme: alt
      text: View Components
      link: /docs/components/
    - theme: alt
      text: Read Docs
      link: /docs/guide/

features:
  - title: 🎨 The Stack You Love
    details: Built on React, Radix primitives (Shadcn), and native Tailwind CSS. Not a black box—override styles with utility classes. No hidden CSS modules. Just pure, modern frontend tech.
  - title: ⚡️ Server-Driven Agility
    details: Update layouts, fields, and validation rules instantly from your backend—no frontend redeployment needed. Change a form in production? Just update the JSON. The UI adapts in real-time.
  - title: 🏢 Enterprise Ready-Made
    details: Built-in support for complex patterns like Kanbans, Gantt charts, multi-step forms, and data tables with sorting/filtering. Stop rebuilding the same components from scratch.
---

## Quick Links

### For Users
- 📖 [**Quick Start**](/docs/guide/quick-start) - Get started in 5 minutes
- 🎨 [**Showcase**](/docs/guide/showcase) - See all 60+ components in action
- 📦 [**Installation**](/docs/guide/installation) - Setup instructions
- 🧩 [**Components**](/docs/components/) - Component library reference

### For Developers
- 🤝 [**Contributing Guide**](/docs/community/contributing) - How to contribute
- 📚 [**Architecture**](/docs/architecture/architecture) - Technical architecture
- 🔧 [**API Reference**](/docs/reference/api/core) - Complete API docs
- 🗺️ [**Roadmap**](/docs/community/roadmap) - Upcoming features

### Need Help?
- ❓ [**FAQ**](/docs/faq) - Frequently asked questions
- 🔧 [**Troubleshooting**](/docs/troubleshooting) - Common issues and solutions
- 🔒 [**Security**](/docs/security) - Security best practices
- 💬 [**Discussions**](https://github.com/objectstack-ai/objectui/discussions) - Ask questions

---

## What is ObjectUI?

Frontend development for enterprise apps is repetitive. You spend 80% of your time gluing together form libraries, data tables, and validation logic—writing the same boilerplate over and over.

**ObjectUI turns UI into Data.** Define your interface in standard JSON, and let our engine render pixel-perfect, accessible React + Tailwind components.

### The Magic: JSON → Beautiful UI

ObjectUI bridges the gap between configuration speed and design quality:

**Input: The Protocol (JSON Schema)**

```json
{
  "type": "data-table",
  "className": "rounded-lg border",
  "dataSource": {
    "api": "/api/users",
    "method": "GET"
  },
  "columns": [
    {
      "key": "name",
      "title": "User Name",
      "sortable": true
    },
    {
      "key": "email",
      "title": "Email Address"
    }
  ]
}
```

**Output: Production-Ready Shadcn Component**

The engine transforms your JSON into a **fully interactive, accessible data table** with:
- ✅ Server-side data fetching
- ✅ Column sorting and filtering
- ✅ Responsive design
- ✅ Light/dark theme support
- ✅ WCAG 2.1 AA accessibility

---

## Why ObjectUI?

### 1. The Stack You Love 🎨

ObjectUI is built on the modern frontend stack:
- **React 18+** with hooks and concurrent rendering
- **Radix UI primitives** (the foundation of Shadcn)
- **Tailwind CSS** for styling—use utility classes directly
- **TypeScript-first** with complete type definitions

### 2. Server-Driven Agility ⚡️

In traditional development, changing a form field requires:
1. Editing React code
2. Running tests
3. Building the app
4. Deploying to production

With ObjectUI, the UI is a **configuration**. Change the schema on the backend, and the dashboard updates instantly—**no code push required.**

### 3. Enterprise Ready-Made 🏢

Stop rebuilding components from scratch. ObjectUI includes:
- 📊 **Data Tables** with sorting, filtering, pagination
- 📋 **Multi-step Forms** with validation
- 🗂️ **Kanban Boards** with drag-and-drop
- 📈 **Dashboards** with real-time updates
- All components are accessible, responsive, and themeable

---

## Getting Started

Choose your path:

### Option A: CLI (Fastest)

Perfect for building dashboards and admin panels without writing React code:

```bash
# Install CLI
npm install -g @object-ui/cli

# Create new app
objectui init my-admin

# Start development server
cd my-admin
objectui dev
```

[**📖 CLI Guide →**](/guide/cli/getting-started)

### Option B: React Library

Integrate ObjectUI into an existing React project:

```bash
# Install packages
pnpm add @object-ui/react @object-ui/components
```

```tsx
import { SchemaRenderer } from '@object-ui/react';
import { registerDefaultRenderers } from '@object-ui/components';

registerDefaultRenderers();

function App() {
  const schema = {
    type: "page",
    title: "Dashboard",
    body: { /* ... */ }
  };
  
  return <SchemaRenderer schema={schema} />;
}
```

[**📖 Installation Guide →**](/guide/installation)

---

## Documentation Structure

### 📘 Getting Started
Start here if you're new to ObjectUI
- [Quick Start](/guide/quick-start)
- [Installation](/guide/installation)
- [Showcase](/guide/showcase)

### 🧩 Components
Browse all available components
- [Component Gallery](/components/)
- [Form Components](/components/form/)
- [Layout Components](/components/layout/)

### 💡 Core Concepts
Understand how ObjectUI works
- [Schema Rendering](/concepts/schema-rendering)
- [Expressions](/concepts/expressions)
- [Data Sources](/concepts/data-source)

### 🔌 Plugins
Extend ObjectUI with plugins
- [Plugin System](/concepts/plugins)
- [Charts Plugin](/plugins/plugin-charts)
- [Kanban Plugin](/plugins/plugin-kanban)

### 📚 Reference
Detailed API documentation
- [Core API](/reference/api/core)
- [React API](/reference/api/react)
- [Protocol Specifications](/reference/protocol/overview)

### 🏗️ Architecture
For contributors and advanced users
- [System Architecture](/architecture/architecture)
- [Project Structure](/architecture/project-structure)
- [Component Specs](/architecture/component)

### 🌐 Ecosystem
Integration and deployment
- [ObjectQL Integration](/ecosystem/objectql)
- [API Integration](/ecosystem/api)
- [Deployment Guide](/ecosystem/deployment/showcase-deployment)

### 🆘 Support
Get help when you need it
- [FAQ](/faq) - Common questions
- [Troubleshooting](/troubleshooting) - Problem solving
- [Security](/security) - Security best practices
- [Migration](/migration/from-objectstack) - Migration guides

### 🤝 Community
Contribute and collaborate
- [Contributing](/community/contributing)
- [Roadmap](/community/roadmap)
- [Best Practices](/community/best-practices)

---

## Ready to Build Faster?

Stop writing repetitive UI code. Start building with ObjectUI.

<div style="display: flex; gap: 1rem; margin-top: 2rem;">
  <a href="/guide/quick-start" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Get Started →</a>
  <a href="/components/" style="padding: 0.75rem 1.5rem; border: 1px solid #3b82f6; color: #3b82f6; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">View Components</a>
  <a href="/guide/showcase" style="padding: 0.75rem 1.5rem; border: 1px solid #6b7280; color: #6b7280; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Try Showcase</a>
</div>

