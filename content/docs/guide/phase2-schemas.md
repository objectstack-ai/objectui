---
title: "Phase 2 Schema Reference"
description: "Complete reference for ObjectUI Phase 2 schemas including App, Theme, Reports, Blocks, and Enhanced Actions"
---

# Phase 2 Schema Reference

ObjectUI Phase 2 introduces advanced schemas for enterprise applications, providing comprehensive solutions for theming, reporting, reusable components, and complex action workflows.

## New Schemas

### Application Configuration

#### [App Schema](/docs/core/app-schema)
Define your entire application structure with navigation, branding, and global settings.

```typescript
const app: AppSchema = {
  type: 'app',
  title: 'My Application',
  layout: 'sidebar',
  menu: [...],
  actions: [...]
};
```

**Use Cases:**
- Multi-page applications
- Admin dashboards
- CRM systems
- Internal tools

---

### Theming & Branding

#### [Theme Schema](/docs/core/theme-schema)
Dynamic theming with light/dark modes, color palettes, and typography.

```typescript
const theme: ThemeSchema = {
  type: 'theme',
  mode: 'dark',
  themes: [{
    name: 'professional',
    light: { primary: '#3b82f6', ... },
    dark: { primary: '#60a5fa', ... }
  }]
};
```

**Features:**
- Light/dark mode switching
- 20+ semantic colors
- Typography system
- CSS variables
- Tailwind integration

---

### Advanced Actions

#### [Enhanced Actions](/docs/core/enhanced-actions)
Powerful action system with AJAX calls, chaining, conditions, and callbacks.

```typescript
const action: ActionSchema = {
  type: 'action',
  actionType: 'ajax',
  api: '/api/submit',
  chain: [...],
  condition: { expression: '${...}', then: {...} },
  onSuccess: {...},
  tracking: {...}
};
```

**New Action Types:**
- **`ajax`** - API calls with full request configuration
- **`confirm`** - Confirmation dialogs
- **`dialog`** - Modal/dialog actions

**Advanced Features:**
- Action chaining (sequential/parallel)
- Conditional execution (if/then/else)
- Success/failure callbacks
- Event tracking
- Retry logic

---

### Reporting

#### [Report Schema](/docs/core/report-schema)
Enterprise reports with aggregation, export, and scheduling.

```typescript
const report: ReportSchema = {
  type: 'report',
  title: 'Sales Report',
  fields: [
    { name: 'revenue', aggregation: 'sum' },
    { name: 'orders', aggregation: 'count' }
  ],
  schedule: {
    frequency: 'monthly',
    recipients: ['team@company.com']
  }
};
```

**Features:**
- Field aggregation (sum, avg, count, min, max)
- Multiple export formats (PDF, Excel, CSV)
- Scheduled reports
- Email distribution
- Interactive builder

---

### Reusable Components

#### [Block Schema](/docs/blocks/block-schema)
Reusable component blocks with variables, slots, and marketplace support.

```typescript
const block: BlockSchema = {
  type: 'block',
  meta: { name: 'hero-section', category: 'Marketing' },
  variables: [
    { name: 'title', type: 'string', defaultValue: 'Welcome' }
  ],
  slots: [
    { name: 'content', label: 'Content Area' }
  ],
  template: { type: 'div', children: [...] }
};
```

**Features:**
- Typed variables (props)
- Content slots
- Block templates
- Marketplace support
- Version control

---

## Quick Comparison

| Schema | Purpose | Best For |
|--------|---------|----------|
| **AppSchema** | Application structure | Multi-page apps, dashboards |
| **ThemeSchema** | Visual theming | Brand consistency, white-labeling |
| **Enhanced Actions** | Complex workflows | API integration, multi-step processes |
| **ReportSchema** | Data reporting | Analytics, business intelligence |
| **BlockSchema** | Reusable components | Marketing pages, component libraries |

## View Components

Phase 2 also includes enhanced view components:

### [Detail View](/docs/components/detail-view)
Rich detail pages with sections, tabs, and related records.

### [View Switcher](/docs/components/view-switcher)
Toggle between list, grid, kanban, calendar, timeline, and map views.

### [Filter UI](/docs/components/filter-ui)
Advanced filtering interface with multiple field types.

### [Sort UI](/docs/components/sort-ui)
Sort configuration with multiple fields.

## Getting Started

### Installation

All Phase 2 schemas are included in `@object-ui/types`:

```bash
npm install @object-ui/types
# or
pnpm add @object-ui/types
```

### Basic Usage

```typescript
import type { 
  AppSchema, 
  ThemeSchema, 
  ActionSchema,
  ReportSchema,
  BlockSchema 
} from '@object-ui/types';
```

### Runtime Validation

Use Zod schemas for runtime validation:

```typescript
import { 
  AppSchema,
  ThemeSchema,
  ActionSchema,
  ReportSchema,
  BlockSchema
} from '@object-ui/types/zod';

const result = AppSchema.safeParse(myConfig);
if (result.success) {
  // Valid configuration
} else {
  // Handle validation errors
}
```

## Examples

### Complete Application

```typescript
import type { AppSchema, ThemeSchema } from '@object-ui/types';

const app: AppSchema = {
  type: 'app',
  name: 'enterprise-crm',
  title: 'Enterprise CRM',
  layout: 'sidebar',
  
  menu: [
    {
      type: 'item',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/dashboard'
    },
    {
      type: 'group',
      label: 'Sales',
      children: [
        { type: 'item', label: 'Leads', path: '/leads' },
        { type: 'item', label: 'Deals', path: '/deals' }
      ]
    }
  ],
  
  actions: [
    {
      type: 'user',
      label: 'User Name',
      items: [
        { type: 'item', label: 'Profile', path: '/profile' },
        { type: 'item', label: 'Logout', path: '/logout' }
      ]
    }
  ]
};

const theme: ThemeSchema = {
  type: 'theme',
  mode: 'system',
  themes: [{
    name: 'professional',
    light: { primary: '#3b82f6', background: '#fff' },
    dark: { primary: '#60a5fa', background: '#0f172a' }
  }],
  allowSwitching: true,
  persistPreference: true
};
```

## Migration Guide

If you're upgrading from Phase 1, here's what's new:

### ActionSchema Enhancements
- ✅ New `ajax`, `confirm`, `dialog` action types
- ✅ Action chaining with `chain` array
- ✅ Conditional execution with `condition`
- ✅ Callbacks with `onSuccess` and `onFailure`
- ✅ Tracking with `tracking` config

### New Top-Level Schemas
- ✅ `AppSchema` - Application configuration
- ✅ `ThemeSchema` - Theming system
- ✅ `ReportSchema` - Reporting system
- ✅ `BlockSchema` - Reusable blocks

### View Enhancements
- ✅ `DetailViewSchema` - Rich detail pages
- ✅ `ViewSwitcherSchema` - View mode toggling
- ✅ `FilterUISchema` - Enhanced filtering
- ✅ `SortUISchema` - Sort configuration

## Resources

### Documentation
- [PHASE2_IMPLEMENTATION.md](https://github.com/objectstack-ai/objectui/blob/main/packages/types/PHASE2_IMPLEMENTATION.md) - Complete implementation guide
- [PHASE2_QUICK_START.md](https://github.com/objectstack-ai/objectui/blob/main/PHASE2_QUICK_START.md) - Quick start guide

### API Reference
- [TypeScript Types](https://github.com/objectstack-ai/objectui/tree/main/packages/types/src)
- [Zod Validation](https://github.com/objectstack-ai/objectui/tree/main/packages/types/src/zod)

### Examples
- [Test Suite](https://github.com/objectstack-ai/objectui/blob/main/packages/types/src/__tests__/phase2-schemas.test.ts) - 40+ example configurations

## Support

Need help? Check out:
- [GitHub Issues](https://github.com/objectstack-ai/objectui/issues)
- [Discussions](https://github.com/objectstack-ai/objectui/discussions)
- [Documentation](https://objectui.com/docs)

## Next Steps

1. Review individual schema documentation
2. Check out the [Quick Start Guide](https://github.com/objectstack-ai/objectui/blob/main/PHASE2_QUICK_START.md)
3. Explore [test examples](https://github.com/objectstack-ai/objectui/blob/main/packages/types/src/__tests__/phase2-schemas.test.ts)
4. Build your first Phase 2 application!
