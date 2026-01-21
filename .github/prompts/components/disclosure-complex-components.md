# AI Prompt: Disclosure Components & Complex Components

## Disclosure Components

### Overview

Disclosure components control **showing and hiding** content. They manage progressive disclosure patterns where content is revealed on demand.

**Category**: `disclosure`  
**Examples**: accordion, collapsible, tabs (disclosure aspect)  
**Complexity**: ⭐⭐ Moderate  

### Accordion Component

**Schema**:
```json
{
  "type": "accordion",
  "type": "single" | "multiple",
  "items": [
    {
      "value": "item-1",
      "trigger": "What is ObjectUI?",
      "content": "ObjectUI is a schema-driven UI framework..."
    },
    {
      "value": "item-2",
      "trigger": "How does it work?",
      "content": "It transforms JSON schemas into React components..."
    }
  ]
}
```

**Implementation**:
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/accordion';
import { SchemaRenderer } from '@object-ui/react';

export function AccordionRenderer({ schema }: RendererProps<AccordionSchema>) {
  return (
    <Accordion 
      type={schema.type || 'single'} 
      collapsible 
      className={schema.className}
    >
      {schema.items?.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent>
            {typeof item.content === 'string' ? (
              item.content
            ) : (
              <SchemaRenderer schema={item.content} />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

### Collapsible Component

**Schema**:
```json
{
  "type": "collapsible",
  "trigger": "Show more details",
  "content": {
    "type": "div",
    "children": [...]
  },
  "defaultOpen": false
}
```

**Implementation**:
```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui/collapsible';

export function CollapsibleRenderer({ schema }: RendererProps<CollapsibleSchema>) {
  const [open, setOpen] = useState(schema.defaultOpen || false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={schema.className}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2">
          {schema.trigger}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        {schema.content && <SchemaRenderer schema={schema.content} />}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

## Complex Components

### Overview

Complex components combine multiple simpler components into **high-level patterns** like CRUD interfaces, calendars, and kanban boards.

**Category**: `complex`  
**Examples**: crud, calendar, data-table, kanban, file-upload, rich-editor  
**Complexity**: ⭐⭐⭐⭐ Very Complex  

### CRUD Component

Complete Create-Read-Update-Delete interface.

**Schema**:
```json
{
  "type": "crud",
  "resource": "users",
  "api": "/api/users",
  "columns": [
    { "key": "name", "label": "Name", "sortable": true },
    { "key": "email", "label": "Email", "sortable": true },
    { "key": "role", "label": "Role" }
  ],
  "actions": {
    "create": true,
    "edit": true,
    "delete": true
  },
  "searchable": true,
  "pagination": true
}
```

**Implementation**:
```tsx
export function CrudRenderer({ schema }: RendererProps<CrudSchema>) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    const response = await fetch(`${schema.api}?page=${page}`);
    const result = await response.json();
    setData(result.data);
    setLoading(false);
  };

  return (
    <div className={cn('space-y-4', schema.className)}>
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        {schema.searchable && (
          <Input placeholder="Search..." className="max-w-sm" />
        )}
        
        {schema.actions?.create && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonRenderer schema={{ type: 'skeleton', count: 5 }} />
      ) : (
        <TableRenderer 
          schema={{
            type: 'table',
            columns: schema.columns,
            data: data
          }}
        />
      )}

      {/* Pagination */}
      {schema.pagination && (
        <PaginationRenderer
          schema={{
            type: 'pagination',
            currentPage: page,
            totalPages: 10,
            onPageChange: { type: 'action', name: 'changePage' }
          }}
        />
      )}
    </div>
  );
}
```

### Calendar Component

**Schema**:
```json
{
  "type": "calendar",
  "mode": "single" | "multiple" | "range",
  "selected": "2024-01-15",
  "onSelect": {
    "type": "action",
    "name": "selectDate"
  }
}
```

**Implementation**:
```tsx
import { Calendar } from '@/ui/calendar';
import { useDataContext, useAction } from '@object-ui/react';

export function CalendarRenderer({ schema }: RendererProps<CalendarSchema>) {
  const { data, setData } = useDataContext();
  const handleAction = useAction();
  const selected = data[schema.name || 'selectedDate'];

  const handleSelect = (date: Date | undefined) => {
    setData(schema.name || 'selectedDate', date);
    
    if (schema.onSelect) {
      handleAction({
        ...schema.onSelect,
        payload: { date }
      });
    }
  };

  return (
    <Calendar
      mode={schema.mode || 'single'}
      selected={selected}
      onSelect={handleSelect}
      className={schema.className}
    />
  );
}
```

### Resizable Component

Resizable panels for layouts.

**Schema**:
```json
{
  "type": "resizable",
  "direction": "horizontal" | "vertical",
  "panels": [
    { "defaultSize": 50, "content": {...} },
    { "defaultSize": 50, "content": {...} }
  ]
}
```

**Implementation**:
```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/ui/resizable';

export function ResizableRenderer({ schema }: RendererProps<ResizableSchema>) {
  return (
    <ResizablePanelGroup 
      direction={schema.direction || 'horizontal'}
      className={schema.className}
    >
      {schema.panels?.map((panel, index) => (
        <React.Fragment key={index}>
          <ResizablePanel defaultSize={panel.defaultSize}>
            {panel.content && <SchemaRenderer schema={panel.content} />}
          </ResizablePanel>
          
          {index < schema.panels.length - 1 && (
            <ResizableHandle />
          )}
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
}
```

## Development Guidelines

### Composition

Build complex components by composing simpler ones:

```tsx
// ✅ Good: Compose from primitives
export function CrudRenderer({ schema }: RendererProps<CrudSchema>) {
  return (
    <>
      <TableRenderer schema={tableSchema} />
      <PaginationRenderer schema={paginationSchema} />
    </>
  );
}

// ❌ Bad: Monolithic implementation
export function CrudRenderer() {
  return <div>{/* 500 lines of code */}</div>;
}
```

### State Management

Use data context for shared state:

```tsx
const { data, setData } = useDataContext();

// Store CRUD state
setData('crud_' + schema.resource + '_page', page);
setData('crud_' + schema.resource + '_search', search);
```

### API Integration

Support data sources:

```tsx
const dataSource = useDataSource();

const fetchData = async () => {
  const result = await dataSource.find(schema.resource, {
    page,
    perPage: 10,
    filters: { search }
  });
  setData(result.data);
};
```

## Testing

Complex components need comprehensive tests:

```tsx
describe('CrudRenderer', () => {
  it('renders table with data', async () => {
    // Mock API
    fetchMock.get('/api/users', { data: [...] });

    render(<SchemaRenderer schema={crudSchema} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    // Test pagination
  });

  it('handles search', async () => {
    // Test search
  });
});
```

## Common Patterns

### FAQ Accordion

```json
{
  "type": "accordion",
  "type": "single",
  "items": [
    { "value": "1", "trigger": "Question 1?", "content": "Answer 1" },
    { "value": "2", "trigger": "Question 2?", "content": "Answer 2" }
  ]
}
```

### Admin CRUD

```json
{
  "type": "crud",
  "resource": "products",
  "api": "/api/products",
  "columns": [
    { "key": "name", "label": "Product Name" },
    { "key": "price", "label": "Price", "format": "currency" },
    { "key": "stock", "label": "Stock" }
  ],
  "actions": { "create": true, "edit": true, "delete": true },
  "searchable": true,
  "filters": [
    { "type": "select", "name": "category", "options": [...] }
  ]
}
```

## Checklist

- [ ] Composed from simpler components
- [ ] State management via data context
- [ ] API integration supported
- [ ] Loading states
- [ ] Error handling
- [ ] Comprehensive tests

---

**Principle**: Complex components are **compositions** of simpler ones with **robust state management**.
