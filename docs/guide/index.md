---
title: "Guide"
description: "Complete guide to using ObjectUI - from getting started to advanced concepts"
---

# ObjectUI Guide

Welcome to the ObjectUI Guide! This comprehensive guide covers everything you need to know to build powerful server-driven UIs with ObjectUI.

## Navigation

### 📚 Getting Started
Learn the basics and set up your first ObjectUI project
- **[Overview](/docs/guide/getting-started)** - Introduction to ObjectUI
- **[Quick Start](/docs/guide/getting-started/quick-start)** - Build your first app in 5 minutes
- **[Installation](/docs/guide/getting-started/installation)** - Detailed setup instructions
- **[CLI Tools](/docs/guide/getting-started/cli)** - Command-line tools reference

### 💡 Core Concepts
Understand the fundamental concepts behind ObjectUI
- **[Schema Rendering](/docs/guide/concepts/schema-rendering)** - How JSON becomes UI
- **[Component Registry](/docs/guide/concepts/component-registry)** - Component registration system
- **[Data Sources](/docs/guide/concepts/data-source)** - Connect to your backend
- **[Expressions](/docs/guide/concepts/expressions)** - Dynamic values and logic
- **[Plugins](/docs/guide/concepts/plugins)** - Extend ObjectUI functionality
- **[Lazy Loading](/docs/guide/concepts/lazy-loading)** - Optimize bundle size

### 🏗️ Architecture
Deep dive into ObjectUI's architecture
- **[System Overview](/docs/guide/architecture/architecture)** - High-level architecture
- **[Project Structure](/docs/guide/architecture/project-structure)** - Monorepo organization
- **[Component System](/docs/guide/architecture/component)** - How components work
- **[Base Components](/docs/guide/architecture/base-components)** - Foundation layer
- **[Component Library](/docs/guide/architecture/component-library)** - UI component layer
- **[Rendering Spec](/docs/guide/architecture/rendering-specification)** - Rendering protocol

### 📖 API Reference
Complete API documentation for ObjectUI packages
- **[Core API](/docs/guide/reference/api/core)** - @object-ui/core package
- **[React API](/docs/guide/reference/api/react)** - @object-ui/react package
- **[Protocol Specs](/docs/guide/reference/protocol/overview)** - Schema specifications

### ✨ Best Practices
Guidelines for building production-ready applications
- **[Security](/docs/guide/best-practices/security)** - Security best practices
- **[Best Practices](/docs/guide/best-practices/best-practices)** - General recommendations

### 🔧 Maintenance
Keep your ObjectUI projects up to date
- **[Versioning](/docs/guide/maintenance/versioning)** - Release management
- **[Migration from ObjectStack](/docs/guide/maintenance/from-objectstack)** - Upgrade guide

### 🆘 Support
Get help when you need it
- **[Troubleshooting](/docs/guide/support)** - Common issues and solutions
- **[FAQ](/docs/guide/support/faq)** - Frequently asked questions
- **[Contributing](/docs/guide/support/contributing)** - How to contribute
- **[Roadmap](/docs/guide/support/roadmap)** - Upcoming features

## What You'll Learn

This guide will teach you:

1. **How to build UIs from JSON schemas** - Transform declarative specifications into interactive interfaces
2. **How to integrate with your backend** - Connect to REST APIs, GraphQL, or any data source
3. **How to customize and extend ObjectUI** - Create custom components and plugins
4. **How to optimize for production** - Lazy loading, code splitting, and performance
5. **How to maintain ObjectUI projects** - Versioning, migration, and troubleshooting

## Prerequisites

Before you begin, you should have:

- Basic knowledge of React and JavaScript/TypeScript
- Familiarity with npm or pnpm package managers
- Understanding of JSON syntax
- (Optional) Experience with Tailwind CSS

## Quick Example

Here's a taste of what you can build with ObjectUI:

```json
{
  "type": "page",
  "title": "User Dashboard",
  "body": {
    "type": "container",
    "className": "p-6 space-y-6",
    "children": [
      {
        "type": "card",
        "title": "Welcome Back!",
        "description": "Here's what's happening today"
      },
      {
        "type": "data-table",
        "dataSource": {
          "api": "/api/users",
          "method": "GET"
        },
        "columns": [
          { "key": "name", "title": "Name", "sortable": true },
          { "key": "email", "title": "Email" },
          { "key": "role", "title": "Role" }
        ]
      }
    ]
  }
}
```

This simple schema creates a complete page with a card and a data table—no React code needed!

## Next Steps

Ready to get started? Choose your path:

- 🚀 **New to ObjectUI?** Start with the [Quick Start](/docs/guide/getting-started/quick-start)
- 📦 **Installing ObjectUI?** Check the [Installation Guide](/docs/guide/getting-started/installation)
- 🧩 **Looking for components?** Browse the [Component Library](/docs/components)
