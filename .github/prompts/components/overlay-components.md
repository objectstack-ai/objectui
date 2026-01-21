# AI Prompt: Overlay Components

## Overview

Overlay components display content **on top of the main interface** in layers. They include modals, popovers, tooltips, and dropdowns that temporarily cover or augment the main content.

**Category**: `overlay`  
**Examples**: dialog, popover, tooltip, dropdown-menu, context-menu, sheet, drawer  
**Complexity**: ⭐⭐⭐ Complex  
**Package**: `@object-ui/components/src/renderers/overlay/`

## Purpose

Overlay components:
1. **Display modal content** (dialogs, alerts)
2. **Show contextual info** (tooltips, popovers)
3. **Present actions** (dropdown menus, context menus)
4. **Slide-in panels** (sheets, drawers)

## Core Overlay Components

### Dialog Component
Modal dialog box.

**Schema**:
```json
{
  "type": "dialog",
  "title": "Confirm Action",
  "description": "Are you sure you want to proceed?",
  "trigger": {
    "type": "button",
    "label": "Open Dialog"
  },
  "content": {
    "type": "div",
    "children": [...]
  },
  "footer": {
    "type": "flex",
    "justify": "end",
    "gap": 2,
    "children": [
      { "type": "button", "label": "Cancel", "variant": "outline" },
      { "type": "button", "label": "Confirm", "variant": "primary" }
    ]
  }
}
```

**Implementation**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { SchemaRenderer } from '@object-ui/react';

export function DialogRenderer({ schema }: RendererProps<DialogSchema>) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {schema.trigger && (
        <DialogTrigger asChild>
          <SchemaRenderer schema={schema.trigger} />
        </DialogTrigger>
      )}
      
      <DialogContent className={schema.className}>
        <DialogHeader>
          {schema.title && <DialogTitle>{schema.title}</DialogTitle>}
          {schema.description && <DialogDescription>{schema.description}</DialogDescription>}
        </DialogHeader>
        
        {schema.content && (
          <SchemaRenderer schema={schema.content} />
        )}
        
        {schema.footer && (
          <DialogFooter>
            <SchemaRenderer schema={schema.footer} />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Popover Component
Floating content container.

**Schema**:
```json
{
  "type": "popover",
  "trigger": {
    "type": "button",
    "label": "Open Popover"
  },
  "content": {
    "type": "div",
    "className": "p-4",
    "children": [
      { "type": "text", "content": "Popover content here" }
    ]
  }
}
```

**Implementation**:
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/popover';

export function PopoverRenderer({ schema }: RendererProps<PopoverSchema>) {
  return (
    <Popover>
      {schema.trigger && (
        <PopoverTrigger asChild>
          <SchemaRenderer schema={schema.trigger} />
        </PopoverTrigger>
      )}
      
      <PopoverContent className={schema.className}>
        {schema.content && (
          <SchemaRenderer schema={schema.content} />
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### Tooltip Component
Hover information display.

**Schema**:
```json
{
  "type": "tooltip",
  "content": "Click to copy",
  "trigger": {
    "type": "button",
    "label": "Copy"
  }
}
```

**Implementation**:
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';

export function TooltipRenderer({ schema }: RendererProps<TooltipSchema>) {
  return (
    <TooltipProvider>
      <Tooltip>
        {schema.trigger && (
          <TooltipTrigger asChild>
            <SchemaRenderer schema={schema.trigger} />
          </TooltipTrigger>
        )}
        
        <TooltipContent>
          <p>{schema.content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### Dropdown Menu Component
Action menu overlay.

**Schema**:
```json
{
  "type": "dropdown-menu",
  "trigger": {
    "type": "button",
    "label": "Actions"
  },
  "items": [
    { "label": "Edit", "onClick": { "type": "action", "name": "edit" } },
    { "label": "Delete", "onClick": { "type": "action", "name": "delete" } }
  ]
}
```

**Implementation**:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { useAction } from '@object-ui/react';

export function DropdownMenuRenderer({ schema }: RendererProps<DropdownMenuSchema>) {
  const handleAction = useAction();

  return (
    <DropdownMenu>
      {schema.trigger && (
        <DropdownMenuTrigger asChild>
          <SchemaRenderer schema={schema.trigger} />
        </DropdownMenuTrigger>
      )}
      
      <DropdownMenuContent>
        {schema.items?.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => item.onClick && handleAction(item.onClick)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Sheet Component
Slide-in side panel.

**Schema**:
```json
{
  "type": "sheet",
  "side": "right" | "left" | "top" | "bottom",
  "title": "Settings",
  "description": "Manage your preferences",
  "trigger": {
    "type": "button",
    "label": "Open Settings"
  },
  "content": {
    "type": "div",
    "children": [...]
  }
}
```

**Implementation**:
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/ui/sheet';

export function SheetRenderer({ schema }: RendererProps<SheetSchema>) {
  return (
    <Sheet>
      {schema.trigger && (
        <SheetTrigger asChild>
          <SchemaRenderer schema={schema.trigger} />
        </SheetTrigger>
      )}
      
      <SheetContent side={schema.side || 'right'}>
        <SheetHeader>
          {schema.title && <SheetTitle>{schema.title}</SheetTitle>}
          {schema.description && <SheetDescription>{schema.description}</SheetDescription>}
        </SheetHeader>
        
        {schema.content && (
          <div className="mt-4">
            <SchemaRenderer schema={schema.content} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

## Development Guidelines

### State Management

Control open/close state via data context:

```tsx
const { data, setData } = useDataContext();
const isOpen = data[schema.id + '_open'] || false;

<Dialog open={isOpen} onOpenChange={(open) => setData(schema.id + '_open', open)}>
```

### Focus Management

Manage focus properly:

```tsx
// Focus trap in dialog
<DialogContent>
  <DialogTitle>Title</DialogTitle>
  {/* Focus automatically trapped */}
  <input autoFocus />
</DialogContent>

// Return focus on close
onOpenChange={(open) => {
  if (!open) {
    // Focus returns to trigger automatically
  }
}}
```

### Keyboard Navigation

Support keyboard shortcuts:

```tsx
// Close on Escape
<Dialog onEscapeKeyDown={() => setOpen(false)}>

// Navigation in menu
<DropdownMenu>
  {/* Arrow keys navigate automatically */}
</DropdownMenu>
```

### Accessibility

```tsx
// ✅ Good: Accessible dialog
<Dialog>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogDescription>This action cannot be undone.</DialogDescription>
  <DialogContent>
    <button>Cancel</button>
    <button>Confirm</button>
  </DialogContent>
</Dialog>

// Proper ARIA attributes are added automatically by Shadcn/Radix
```

## Testing

```tsx
describe('DialogRenderer', () => {
  it('opens dialog on trigger click', async () => {
    const schema = {
      type: 'dialog',
      title: 'Test Dialog',
      trigger: { type: 'button', label: 'Open' },
      content: { type: 'text', content: 'Dialog content' }
    };

    render(<SchemaRenderer schema={schema} />);
    
    fireEvent.click(screen.getByText('Open'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });
  });

  it('closes dialog on backdrop click', async () => {
    // Test backdrop click
  });
});
```

## Common Patterns

### Confirmation Dialog

```json
{
  "type": "dialog",
  "title": "Delete Item",
  "description": "This action cannot be undone.",
  "trigger": {
    "type": "button",
    "label": "Delete",
    "variant": "destructive"
  },
  "footer": {
    "type": "flex",
    "justify": "end",
    "gap": 2,
    "children": [
      { "type": "button", "label": "Cancel", "variant": "outline" },
      {
        "type": "button",
        "label": "Delete",
        "variant": "destructive",
        "onClick": { "type": "action", "name": "confirmDelete" }
      }
    ]
  }
}
```

### Filter Popover

```json
{
  "type": "popover",
  "trigger": {
    "type": "button",
    "label": "Filters"
  },
  "content": {
    "type": "stack",
    "spacing": 3,
    "className": "p-4 w-64",
    "children": [
      { "type": "input", "name": "search", "placeholder": "Search..." },
      { "type": "select", "name": "category", "label": "Category", "options": [...] },
      { "type": "button", "label": "Apply", "variant": "primary" }
    ]
  }
}
```

## Performance

### Lazy Load Content

```tsx
// Load content only when opened
{isOpen && <DialogContent>{/* Heavy content */}</DialogContent>}
```

### Portal Rendering

Overlays are rendered in portals (handled by Shadcn/Radix):

```tsx
// Automatically rendered at document.body
<Dialog>
  <DialogContent>{/* Rendered in portal */}</DialogContent>
</Dialog>
```

## Checklist

- [ ] Open/close state managed
- [ ] Focus management implemented
- [ ] Keyboard navigation supported
- [ ] Accessible ARIA attributes
- [ ] Backdrop/overlay handled
- [ ] Tests added

---

**Principle**: Overlays are **accessible**, **keyboard-friendly**, and **properly layered**.
