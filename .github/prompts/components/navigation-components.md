# AI Prompt: Navigation Components

## Overview

Navigation components help users **move through** and **orient within** the application. They provide structure, hierarchy, and wayfinding for complex interfaces.

**Category**: `navigation`  
**Examples**: tabs, breadcrumb, menu, menubar, pagination, navigation-menu  
**Complexity**: ⭐⭐⭐ Complex  
**Package**: `@object-ui/components/src/renderers/navigation/`

## Purpose

Navigation components:
1. **Switch between views** (tabs, menu)
2. **Show current location** (breadcrumbs, active states)
3. **Navigate hierarchies** (nested menus, tree navigation)
4. **Page through data** (pagination)

## Core Navigation Components

### Tabs Component

**Schema**:
```json
{
  "type": "tabs",
  "defaultValue": "tab1",
  "items": [
    { "value": "tab1", "label": "Overview", "content": {...} },
    { "value": "tab2", "label": "Analytics", "content": {...} },
    { "value": "tab3", "label": "Reports", "content": {...} }
  ]
}
```

**Implementation**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { SchemaRenderer, useDataContext } from '@object-ui/react';

export function TabsRenderer({ schema }: RendererProps<TabsSchema>) {
  const { data, setData } = useDataContext();
  const activeTab = data[schema.name || 'activeTab'] || schema.defaultValue;

  const handleChange = (value: string) => {
    setData(schema.name || 'activeTab', value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleChange} className={schema.className}>
      <TabsList>
        {schema.items?.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {schema.items?.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content && <SchemaRenderer schema={item.content} />}
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

### Breadcrumb Component

**Schema**:
```json
{
  "type": "breadcrumb",
  "items": [
    { "label": "Home", "href": "/" },
    { "label": "Products", "href": "/products" },
    { "label": "Laptop", "href": "/products/laptop" }
  ]
}
```

**Implementation**:
```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/breadcrumb';

export function BreadcrumbRenderer({ schema }: RendererProps<BreadcrumbSchema>) {
  return (
    <Breadcrumb className={schema.className}>
      <BreadcrumbList>
        {schema.items?.map((item, index) => {
          const isLast = index === schema.items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Menu Component

**Schema**:
```json
{
  "type": "menu",
  "items": [
    {
      "label": "Dashboard",
      "icon": "Home",
      "href": "/dashboard"
    },
    {
      "label": "Settings",
      "icon": "Settings",
      "items": [
        { "label": "Profile", "href": "/settings/profile" },
        { "label": "Security", "href": "/settings/security" }
      ]
    }
  ]
}
```

**Implementation**:
```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/ui/navigation-menu';
import * as Icons from 'lucide-react';

export function MenuRenderer({ schema }: RendererProps<MenuSchema>) {
  return (
    <NavigationMenu className={schema.className}>
      <NavigationMenuList>
        {schema.items?.map((item, index) => (
          <NavigationMenuItem key={index}>
            {item.items ? (
              <>
                <NavigationMenuTrigger>
                  {item.icon && <Icon name={item.icon} className="mr-2 h-4 w-4" />}
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px]">
                    {item.items.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <NavigationMenuLink href={subItem.href}>
                          {subItem.label}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink href={item.href}>
                {item.icon && <Icon name={item.icon} className="mr-2 h-4 w-4" />}
                {item.label}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

### Pagination Component

**Schema**:
```json
{
  "type": "pagination",
  "currentPage": 1,
  "totalPages": 10,
  "onPageChange": {
    "type": "action",
    "name": "changePage"
  }
}
```

**Implementation**:
```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/pagination';
import { useAction, useExpression } from '@object-ui/react';

export function PaginationRenderer({ schema }: RendererProps<PaginationSchema>) {
  const handleAction = useAction();
  const currentPage = useExpression(schema.currentPage, {}, 1);
  const totalPages = useExpression(schema.totalPages, {}, 1);

  const handlePageChange = (page: number) => {
    if (schema.onPageChange) {
      handleAction({
        ...schema.onPageChange,
        payload: { page }
      });
    }
  };

  return (
    <Pagination className={schema.className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => handlePageChange(page)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## Development Guidelines

### Active State Management

Track and display active navigation item:

```tsx
const { data } = useDataContext();
const currentPath = data.currentPath || '/';

<NavigationMenuLink 
  href={item.href}
  className={cn(
    item.href === currentPath && 'bg-accent'
  )}
>
  {item.label}
</NavigationMenuLink>
```

### Keyboard Navigation

Support keyboard shortcuts:

```tsx
// Arrow keys, Home, End handled by Radix
<NavigationMenu>
  {/* Automatic keyboard navigation */}
</NavigationMenu>
```

### Accessibility

```tsx
// ✅ Good: Accessible navigation
<nav aria-label="Main navigation">
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink href="/">Home</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</nav>

// Breadcrumb
<nav aria-label="Breadcrumb">
  <Breadcrumb>
    {/* ... */}
  </Breadcrumb>
</nav>
```

## Testing

```tsx
describe('TabsRenderer', () => {
  it('renders tabs', () => {
    const schema = {
      type: 'tabs',
      items: [
        { value: 'tab1', label: 'Tab 1', content: { type: 'text', content: 'Content 1' } },
        { value: 'tab2', label: 'Tab 2', content: { type: 'text', content: 'Content 2' } }
      ]
    };

    render(<SchemaRenderer schema={schema} />);
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('switches tabs on click', () => {
    // Test tab switching
  });
});
```

## Common Patterns

### Dashboard Tabs

```json
{
  "type": "tabs",
  "items": [
    {
      "value": "overview",
      "label": "Overview",
      "content": {
        "type": "grid",
        "columns": 3,
        "items": [...]
      }
    },
    {
      "value": "analytics",
      "label": "Analytics",
      "content": {
        "type": "stack",
        "children": [...]
      }
    }
  ]
}
```

### Sidebar Navigation

```json
{
  "type": "stack",
  "spacing": 1,
  "className": "w-64 p-4",
  "children": [
    {
      "type": "menu",
      "items": [
        { "label": "Dashboard", "icon": "Home", "href": "/" },
        { "label": "Users", "icon": "Users", "href": "/users" },
        { "label": "Settings", "icon": "Settings", "href": "/settings" }
      ]
    }
  ]
}
```

## Checklist

- [ ] Active state tracking
- [ ] Keyboard navigation
- [ ] Accessible markup
- [ ] Nested navigation supported
- [ ] Tests added

---

**Principle**: Navigation is **clear**, **accessible**, and **keyboard-friendly**.
