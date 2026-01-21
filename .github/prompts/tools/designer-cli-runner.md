# AI Prompt: Designer, CLI & Runner Tools

## Designer Package

### Overview

The Designer is a **visual drag-and-drop editor** for creating ObjectUI schemas without writing code.

**Package**: `@object-ui/designer`  
**Purpose**: Visual schema builder  
**Tech**: React DnD, Monaco Editor  

### Core Features

1. **Canvas**: Drag-and-drop interface
2. **Component Palette**: Available components
3. **Property Inspector**: Edit component props
4. **Schema Editor**: Raw JSON view
5. **Preview**: Live preview mode

### Architecture

```tsx
// Designer main component
export function Designer({ initialSchema, onSave }: DesignerProps) {
  const [schema, setSchema] = useState(initialSchema);
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Component Palette */}
      <ComponentPalette />
      
      {/* Canvas */}
      <Canvas schema={schema} onSelect={setSelectedComponent} />
      
      {/* Property Inspector */}
      <PropertyInspector 
        component={selectedComponent}
        onChange={(props) => updateComponent(selectedComponent.id, props)}
      />
      
      {/* Bottom Bar */}
      <div className="border-t p-4 flex justify-between">
        <SchemaEditor schema={schema} onChange={setSchema} />
        <Button onClick={() => onSave(schema)}>Save</Button>
      </div>
    </div>
  );
}
```

### Component Palette

```tsx
const COMPONENT_CATEGORIES = [
  {
    name: 'Basic',
    components: [
      { type: 'text', icon: Type, label: 'Text' },
      { type: 'image', icon: Image, label: 'Image' },
      { type: 'button', icon: MousePointer, label: 'Button' }
    ]
  },
  {
    name: 'Layout',
    components: [
      { type: 'grid', icon: Grid, label: 'Grid' },
      { type: 'flex', icon: Columns, label: 'Flex' }
    ]
  }
];
```

### Development Guidelines

- Use **React DnD** for drag-and-drop
- Support **undo/redo** via history stack
- **Auto-save** to local storage
- **Export** to JSON file
- **Import** from JSON file

---

## CLI Tool

### Overview

The CLI provides commands for **scaffolding**, **serving**, and **building** ObjectUI applications.

**Package**: `@object-ui/cli`  
**Purpose**: Command-line tool  
**Tech**: Commander.js, Vite  

### Commands

```bash
# Initialize new project
objectui init my-app

# Serve app from JSON
objectui serve app.json

# Build for production
objectui build app.json

# Create component
objectui create component my-component
```

### Implementation

```ts
// packages/cli/src/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('objectui')
  .description('ObjectUI CLI')
  .version('0.3.0');

// Init command
program
  .command('init <name>')
  .description('Create a new ObjectUI app')
  .action(async (name: string) => {
    await initProject(name);
  });

// Serve command
program
  .command('serve <file>')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(async (file: string, options) => {
    await serveApp(file, { port: options.port });
  });

program.parse();
```

### Serve Command

```ts
async function serveApp(schemaFile: string, options: { port: string }) {
  const schema = await fs.readFile(schemaFile, 'utf-8');
  
  // Create Vite server
  const server = await createServer({
    root: process.cwd(),
    server: { port: parseInt(options.port) },
    plugins: [
      react(),
      {
        name: 'objectui-schema',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/schema.json') {
              res.setHeader('Content-Type', 'application/json');
              res.end(schema);
            } else {
              next();
            }
          });
        }
      }
    ]
  });

  await server.listen();
  console.log(`Server running at http://localhost:${options.port}`);
}
```

### Init Command

```ts
async function initProject(name: string) {
  const projectPath = path.join(process.cwd(), name);
  
  // Create directory
  await fs.mkdir(projectPath, { recursive: true });
  
  // Copy template
  await fs.cp(
    path.join(__dirname, '../templates/default'),
    projectPath,
    { recursive: true }
  );
  
  // Update package.json
  const pkg = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
  pkg.name = name;
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );
  
  console.log(`✨ Created ${name}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}
```

### Project Template

```
templates/default/
├── package.json
├── index.html
├── src/
│   ├── main.tsx
│   └── App.tsx
├── app.json              # Schema file
└── README.md
```

---

## Runner Package

### Overview

The Runner provides a **development server** and **runtime** for executing ObjectUI apps from JSON schemas.

**Package**: `@object-ui/runner`  
**Purpose**: Development server & runtime  
**Tech**: Vite, React  

### Features

1. **Hot Module Replacement**: Live reload on schema changes
2. **Error Overlay**: Display schema errors
3. **DevTools**: Inspect component tree
4. **Multi-page**: Support routing

### Implementation

```tsx
// packages/runner/src/App.tsx
import { SchemaRenderer } from '@object-ui/react';
import { registerDefaultRenderers } from '@object-ui/components';
import { useEffect, useState } from 'react';

registerDefaultRenderers();

export function App() {
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchema();
    
    // Watch for changes (in dev mode)
    if (import.meta.hot) {
      import.meta.hot.on('schema-update', (newSchema) => {
        setSchema(newSchema);
      });
    }
  }, []);

  const loadSchema = async () => {
    try {
      const response = await fetch('/schema.json');
      const data = await response.json();
      setSchema(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return <ErrorOverlay error={error} />;
  }

  if (!schema) {
    return <LoadingScreen />;
  }

  return (
    <SchemaRenderer 
      schema={schema}
      onAction={handleAction}
    />
  );
}

function handleAction(action: ActionSchema) {
  console.log('Action:', action);
  // Handle actions
}
```

### Multi-page Support

```tsx
// Support routing with pages/*.json
const routes = {
  '/': 'pages/index.json',
  '/about': 'pages/about.json',
  '/contact': 'pages/contact.json'
};

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    loadPage(currentPath);
  }, [currentPath]);

  const loadPage = async (path: string) => {
    const schemaFile = routes[path] || routes['/'];
    const response = await fetch(schemaFile);
    const data = await response.json();
    setSchema(data);
  };

  return <SchemaRenderer schema={schema} />;
}
```

## Development Guidelines

### Designer
- Persist state to localStorage
- Support keyboard shortcuts
- Validate schemas in real-time
- Provide component search

### CLI
- Clear error messages
- Progress indicators
- Graceful error handling
- Help documentation

### Runner
- Fast HMR
- Clear error overlays
- Performance monitoring
- DevTools integration

## Testing

```tsx
describe('CLI', () => {
  it('creates new project', async () => {
    await exec('objectui init test-project');
    
    expect(fs.existsSync('test-project')).toBe(true);
    expect(fs.existsSync('test-project/package.json')).toBe(true);
  });
});

describe('Runner', () => {
  it('loads schema and renders', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });
});
```

## Checklist

### Designer
- [ ] Drag-and-drop working
- [ ] Property editing functional
- [ ] Schema validation
- [ ] Export/import JSON
- [ ] Undo/redo support

### CLI
- [ ] All commands working
- [ ] Templates complete
- [ ] Error handling
- [ ] Documentation
- [ ] Published to npm

### Runner
- [ ] HMR functional
- [ ] Error overlay
- [ ] Routing support
- [ ] Action handling
- [ ] Performance optimized

---

**Principle**: Tools provide **excellent DX** and **fast iteration**.
