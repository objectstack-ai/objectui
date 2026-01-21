# AI Prompt: Plugin Development

## Overview

Plugins extend ObjectUI with specialized functionality that's **lazy-loaded** on demand. They follow the same schema-driven architecture while adding domain-specific components and features.

**Purpose**: Extend ObjectUI without bloating core bundle  
**Examples**: charts, editor, kanban, markdown, custom data sources  
**Loading**: Lazy-loaded via dynamic imports  

## Plugin Architecture

### Package Structure

```
packages/plugin-{name}/
├── package.json
├── src/
│   ├── index.ts              # Plugin registration
│   ├── components/           # Plugin-specific components
│   │   ├── ChartRenderer.tsx
│   │   └── ...
│   ├── types.ts             # Type definitions
│   └── utils/               # Helper functions
└── README.md
```

### Plugin Registration

Every plugin exports a `register` function:

```ts
// packages/plugin-charts/src/index.ts
import { registerRenderer } from '@object-ui/core';
import { ChartRenderer } from './components/ChartRenderer';

export function registerChartsPlugin() {
  registerRenderer('chart', ChartRenderer);
  registerRenderer('bar-chart', BarChartRenderer);
  registerRenderer('line-chart', LineChartRenderer);
  registerRenderer('pie-chart', PieChartRenderer);
}

// Export types
export * from './types';
```

### Lazy Loading

Plugins are loaded on-demand:

```tsx
// In your app
const loadChartsPlugin = async () => {
  const { registerChartsPlugin } = await import('@object-ui/plugin-charts');
  registerChartsPlugin();
};

// Load when needed
if (schema.type === 'chart') {
  await loadChartsPlugin();
}
```

## Example Plugins

### Charts Plugin

Visualization components using Chart.js or Recharts.

**Schema**:
```json
{
  "type": "chart",
  "chartType": "line" | "bar" | "pie",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [100, 200, 150]
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "legend": { "display": true }
    }
  }
}
```

**Implementation**:
```tsx
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useExpression } from '@object-ui/react';

export function ChartRenderer({ schema }: RendererProps<ChartSchema>) {
  const data = useExpression(schema.data, {}, { labels: [], datasets: [] });
  
  const ChartComponent = {
    line: Line,
    bar: Bar,
    pie: Pie
  }[schema.chartType];

  if (!ChartComponent) {
    return <div>Unsupported chart type: {schema.chartType}</div>;
  }

  return (
    <div className={schema.className}>
      <ChartComponent data={data} options={schema.options} />
    </div>
  );
}
```

### Rich Editor Plugin

WYSIWYG text editor using TipTap or Slate.

**Schema**:
```json
{
  "type": "editor",
  "name": "content",
  "placeholder": "Start writing...",
  "toolbar": ["bold", "italic", "link", "heading"],
  "defaultValue": "<p>Hello world</p>"
}
```

**Implementation**:
```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useDataContext } from '@object-ui/react';

export function EditorRenderer({ schema }: RendererProps<EditorSchema>) {
  const { data, setData } = useDataContext();

  const editor = useEditor({
    extensions: [StarterKit],
    content: data[schema.name] || schema.defaultValue || '',
    onUpdate: ({ editor }) => {
      setData(schema.name, editor.getHTML());
    }
  });

  return (
    <div className={cn('border rounded-md', schema.className)}>
      <Toolbar editor={editor} items={schema.toolbar} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Kanban Plugin

Drag-and-drop kanban board.

**Schema**:
```json
{
  "type": "kanban",
  "columns": [
    {
      "id": "todo",
      "title": "To Do",
      "items": [
        { "id": "1", "title": "Task 1", "description": "..." }
      ]
    },
    {
      "id": "in-progress",
      "title": "In Progress",
      "items": []
    }
  ],
  "onMove": {
    "type": "action",
    "name": "moveCard"
  }
}
```

**Implementation**:
```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useAction, useExpression } from '@object-ui/react';

export function KanbanRenderer({ schema }: RendererProps<KanbanSchema>) {
  const handleAction = useAction();
  const columns = useExpression(schema.columns, {}, []);

  const handleDragEnd = (event: DragEndEvent) => {
    if (schema.onMove) {
      handleAction({
        ...schema.onMove,
        payload: {
          itemId: event.active.id,
          fromColumn: event.over?.data.current?.columnId,
          toColumn: event.over?.id
        }
      });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={cn('flex gap-4', schema.className)}>
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </DndContext>
  );
}
```

### Markdown Plugin

Markdown renderer with syntax highlighting.

**Schema**:
```json
{
  "type": "markdown",
  "content": "# Hello\n\nThis is **markdown**.",
  "className": "prose"
}
```

**Implementation**:
```tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export function MarkdownRenderer({ schema }: RendererProps<MarkdownSchema>) {
  return (
    <div className={cn('prose dark:prose-invert', schema.className)}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter language={match[1]} {...props}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {schema.content}
      </ReactMarkdown>
    </div>
  );
}
```

## Development Guidelines

### Keep Plugins Independent

```ts
// ✅ Good: Self-contained plugin
export function registerChartsPlugin() {
  // All dependencies bundled
  registerRenderer('chart', ChartRenderer);
}

// ❌ Bad: Depends on core changes
export function registerChartsPlugin(coreConfig) {
  // Tightly coupled to core
}
```

### Size Budget

Plugins should be:
- **Lazy-loadable**: Only loaded when used
- **Tree-shakable**: Import only what's needed
- **Optimized**: Minified and compressed

```json
{
  "bundlesize": [
    {
      "path": "./dist/index.js",
      "maxSize": "100kb"  // Plugin-specific limit
    }
  ]
}
```

### Peer Dependencies

Declare peer dependencies properly:

```json
{
  "peerDependencies": {
    "@object-ui/core": "workspace:*",
    "@object-ui/react": "workspace:*",
    "react": "^18.0.0"
  },
  "dependencies": {
    "chart.js": "^4.0.0",  // Plugin-specific dependency
    "react-chartjs-2": "^5.0.0"
  }
}
```

## Testing

```tsx
describe('ChartRenderer', () => {
  beforeAll(async () => {
    // Load plugin before tests
    const { registerChartsPlugin } = await import('@object-ui/plugin-charts');
    registerChartsPlugin();
  });

  it('renders line chart', () => {
    const schema = {
      type: 'chart',
      chartType: 'line',
      data: {
        labels: ['A', 'B'],
        datasets: [{ data: [1, 2] }]
      }
    };

    render(<SchemaRenderer schema={schema} />);
    
    // Assert chart is rendered
  });
});
```

## Plugin Template

```bash
# Create new plugin
pnpm create-plugin my-plugin

# Generated structure:
packages/plugin-my-plugin/
├── package.json
├── src/
│   ├── index.ts
│   ├── components/
│   │   └── MyRenderer.tsx
│   └── types.ts
├── README.md
└── tsconfig.json
```

## Documentation

Every plugin must have:

1. **README.md** with:
   - Installation instructions
   - Usage examples
   - Schema documentation
   - API reference

2. **Type definitions**:
   ```ts
   export interface MyPluginSchema extends ComponentSchema {
     type: 'my-component';
     // Plugin-specific props
   }
   ```

3. **Examples**:
   ```json
   // examples/my-plugin-demo.json
   {
     "type": "my-component",
     "prop": "value"
   }
   ```

## Checklist

- [ ] Self-contained (no core modifications)
- [ ] Lazy-loadable
- [ ] Size optimized (< 100KB)
- [ ] Peer dependencies declared
- [ ] Types exported
- [ ] Tests added
- [ ] Documentation complete
- [ ] Examples provided

---

**Principle**: Plugins **extend** without **bloating** the core.
