---
title: "Component Overview"
---

The `@object-ui/components` package provides pre-built UI components that implement the Object UI protocol.

## Installation

```bash
npm install @object-ui/components
```

## Registration

Register all default components:

```tsx
import { registerDefaultRenderers } from '@object-ui/components'

registerDefaultRenderers()
```

## Component Categories

Browse components organized by category:

### [Basic Components](./basic)

Fundamental UI elements for displaying simple content.
- Text, Icon, Image, HTML, Separator

### [Form Components](./form)

Components for user input and data collection.
- Button, Input, Select, Checkbox, Switch, Textarea, Slider

### [Layout Components](./layout)

Organize and structure your interface.
- Container, Card, Grid, Flex, Stack, Tabs

### [Data Display](./data-display)

Present information and data to users.
- Badge, Avatar, Alert, List

### [Feedback](./feedback)

Provide visual feedback to user actions.
- Loading, Progress, Skeleton

### [Overlay](./overlay)

Floating UI elements and modals.
- Dialog, Drawer, Tooltip, Popover

### [Disclosure](./disclosure)

Show and hide content progressively.
- Accordion, Collapsible

### [Complex](./complex)

Advanced components for complex UIs.
- Table

## Plugins

Additional specialized components are available as plugins:

*   [Charts](./charts) - Visualization components (Bar, Line, Pie, etc.)
*   [Kanban](./kanban) - Board view for task management
*   [Markdown](./markdown) - Rich text rendering
*   [Calendar View](./calendar-view) - Full-featured calendar
