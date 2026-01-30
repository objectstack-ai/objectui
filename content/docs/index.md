---
title: "You Define the Intent. We Render the Reality."
description: "ObjectUI - The Universal Schema-Driven UI Engine for React"
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

## 🆕 Phase 2: Advanced Features

ObjectUI Phase 2 introduces enterprise-grade capabilities:

### Application Framework
- **[AppSchema](/docs/core/app-schema)** - Complete app configuration with navigation, branding, and layouts
- **[ThemeSchema](/docs/core/theme-schema)** - Dynamic theming with light/dark modes and color palettes

### Advanced Actions
- **[Enhanced Actions](/docs/core/enhanced-actions)** - AJAX calls, confirmation dialogs, action chaining, and conditional execution
- **Callbacks** - Success/failure handlers with tracking

### Reporting & Analytics
- **[ReportSchema](/docs/core/report-schema)** - Enterprise reports with aggregation, export (PDF/Excel/CSV), and scheduling
- **Data Visualization** - Charts, metrics, and dashboards

### Reusable Components
- **[BlockSchema](/docs/blocks/block-schema)** - Reusable component blocks with variables, slots, and marketplace support
- **Component Library** - Share and discover pre-built blocks

[**Learn more about Phase 2 →**](/docs/guide/phase2-schemas)

---
