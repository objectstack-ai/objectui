# @object-ui/designer

A drag-and-drop visual editor to generate Object UI schemas.

## Features

- **Visual Schema Editor**: Edit Object UI schemas visually with a live preview
- **Drag-and-Drop**: Drag components from the palette to the canvas and reorder them within the canvas
- **Component Palette**: Browse and add components from a categorized list
- **Property Editor**: Configure component properties with a dynamic form
- **JSON Import/Export**: Import and export schemas as JSON
- **Real-time Preview**: See changes immediately in the canvas
- **Selection & Highlighting**: Click to select components and edit their properties

## Installation

```bash
npm install @object-ui/designer @object-ui/renderer @object-ui/ui
# or
yarn add @object-ui/designer @object-ui/renderer @object-ui/ui
# or
pnpm add @object-ui/designer @object-ui/renderer @object-ui/ui
```

## Usage

### Basic Example

```tsx
import { Designer } from '@object-ui/designer';
import { useState } from 'react';
import type { SchemaNode } from '@object-ui/protocol';

function App() {
  const [schema, setSchema] = useState<SchemaNode>({
    type: 'div',
    className: 'p-8',
    body: []
  });
  
  return (
    <Designer 
      initialSchema={schema} 
      onSchemaChange={setSchema}
    />
  );
}
```

### With Initial Schema

```tsx
const initialSchema: SchemaNode = {
  type: 'div',
  className: 'p-8 max-w-4xl mx-auto',
  body: [
    {
      type: 'card',
      title: 'Welcome',
      body: [
        {
          type: 'text',
          content: 'This is a starter template'
        }
      ]
    }
  ]
};

function App() {
  return <Designer initialSchema={initialSchema} />;
}
```

### Custom Layout

You can use individual designer components to create a custom layout:

```tsx
import { 
  DesignerProvider, 
  Canvas, 
  ComponentPalette, 
  PropertyPanel,
  Toolbar 
} from '@object-ui/designer';

function CustomDesigner() {
  return (
    <DesignerProvider>
      <div className="flex flex-col h-screen">
        <Toolbar />
        <div className="flex-1 flex">
          <ComponentPalette className="w-64" />
          <Canvas className="flex-1" />
          <PropertyPanel className="w-80" />
        </div>
      </div>
    </DesignerProvider>
  );
}
```

## Components

### `<Designer />`

The main designer component that includes all panels and functionality.

**Props:**
- `initialSchema?: SchemaNode` - Initial schema to load
- `onSchemaChange?: (schema: SchemaNode) => void` - Callback when schema changes

### `<DesignerProvider />`

Context provider for designer state.

**Props:**
- `initialSchema?: SchemaNode` - Initial schema
- `onSchemaChange?: (schema: SchemaNode) => void` - Change callback
- `children: ReactNode` - Child components

### `<Canvas />`

The visual editor canvas that renders the schema.

**Props:**
- `className?: string` - Additional CSS classes

### `<ComponentPalette />`

Sidebar showing available components to add.

**Props:**
- `className?: string` - Additional CSS classes

### `<PropertyPanel />`

Right sidebar for editing selected component properties.

**Props:**
- `className?: string` - Additional CSS classes

### `<Toolbar />`

Top toolbar with import/export and other actions.

**Props:**
- `className?: string` - Additional CSS classes

## Hooks

### `useDesigner()`

Access the designer context in custom components.

```tsx
import { useDesigner } from '@object-ui/designer';

function CustomComponent() {
  const { 
    schema, 
    setSchema,
    selectedNodeId,
    setSelectedNodeId,
    updateNode,
    addNode,
    deleteNode
  } = useDesigner();
  
  // Use designer state and methods
}
```

## API

### Context API

```typescript
interface DesignerContextValue {
  schema: SchemaNode;
  setSchema: (schema: SchemaNode) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<SchemaNode>) => void;
  addNode: (parentId: string | null, node: SchemaNode, index?: number) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, targetParentId: string | null, targetIndex: number) => void;
}
```

## Styling

The designer uses Tailwind CSS. Make sure to include the designer components in your Tailwind configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@object-ui/designer/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
}
```

## Features Roadmap

- [x] Drag and drop components from palette
- [x] Drag to reorder components in canvas
- [ ] Undo/redo functionality
- [ ] Schema validation
- [ ] Component tree view
- [ ] Copy/paste components
- [ ] Keyboard shortcuts
- [ ] Component search in palette
- [ ] Custom component templates
- [ ] Export to React code

## Examples

See the [examples/designer-demo](../../examples/designer-demo) directory for a complete working example.

## License

MIT
