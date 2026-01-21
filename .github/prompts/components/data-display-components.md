# AI Prompt: Data Display Components

## Overview

Data display components present **information** to users in structured, visual formats. They transform data into readable, scannable UI elements like lists, tables, badges, and statistics.

**Category**: `data-display`  
**Examples**: list, table, badge, avatar, statistic, alert, card  
**Complexity**: ⭐⭐ Moderate  
**Package**: `@object-ui/components/src/renderers/data-display/`

## Purpose

Data display components:
1. **Present structured data** (lists, tables)
2. **Highlight information** (badges, statistics)
3. **Show status** (alerts, indicators)
4. **Display user info** (avatars, profiles)

## Core Data Display Components

### List Component
Display items in a vertical list.

**Schema**:
```json
{
  "type": "list",
  "items": [
    { "type": "text", "content": "Item 1" },
    { "type": "text", "content": "Item 2" },
    { "type": "text", "content": "Item 3" }
  ],
  "divider": true,
  "className": "space-y-2"
}
```

**Implementation**:
```tsx
import { Separator } from '@/ui/separator';
import { SchemaRenderer } from '@object-ui/react';

export function ListRenderer({ schema }: RendererProps<ListSchema>) {
  return (
    <div className={cn('space-y-0', schema.className)}>
      {schema.items?.map((item, index) => (
        <React.Fragment key={item.id || index}>
          <div className="py-2">
            <SchemaRenderer schema={item} />
          </div>
          {schema.divider && index < schema.items.length - 1 && (
            <Separator />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

### Badge Component
Small label or status indicator.

**Schema**:
```json
{
  "type": "badge",
  "label": "New",
  "variant": "default" | "secondary" | "destructive" | "outline",
  "className": ""
}
```

**Implementation**:
```tsx
import { Badge as ShadcnBadge } from '@/ui/badge';

export function BadgeRenderer({ schema }: RendererProps<BadgeSchema>) {
  return (
    <ShadcnBadge 
      variant={schema.variant}
      className={schema.className}
    >
      {schema.label}
    </ShadcnBadge>
  );
}
```

### Avatar Component
User profile picture or initials.

**Schema**:
```json
{
  "type": "avatar",
  "src": "https://example.com/avatar.jpg",
  "alt": "John Doe",
  "fallback": "JD",
  "size": "md"
}
```

**Implementation**:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { cva } from 'class-variance-authority';

const avatarVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg'
    }
  },
  defaultVariants: {
    size: 'md'
  }
});

export function AvatarRenderer({ schema }: RendererProps<AvatarSchema>) {
  return (
    <Avatar className={cn(avatarVariants({ size: schema.size }), schema.className)}>
      {schema.src && (
        <AvatarImage src={schema.src} alt={schema.alt || ''} />
      )}
      <AvatarFallback>{schema.fallback || '?'}</AvatarFallback>
    </Avatar>
  );
}
```

### Statistic Component
Display a metric or number with label.

**Schema**:
```json
{
  "type": "statistic",
  "label": "Total Users",
  "value": "1,234",
  "trend": "+12.5%",
  "trendDirection": "up" | "down"
}
```

**Implementation**:
```tsx
import { ArrowUp, ArrowDown } from 'lucide-react';

export function StatisticRenderer({ schema }: RendererProps<StatisticSchema>) {
  const TrendIcon = schema.trendDirection === 'up' ? ArrowUp : ArrowDown;
  const trendColor = schema.trendDirection === 'up' 
    ? 'text-green-500' 
    : 'text-red-500';

  return (
    <div className={cn('space-y-1', schema.className)}>
      <p className="text-sm text-muted-foreground">
        {schema.label}
      </p>
      
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">
          {schema.value}
        </p>
        
        {schema.trend && (
          <p className={cn('text-sm flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {schema.trend}
          </p>
        )}
      </div>
      
      {schema.description && (
        <p className="text-sm text-muted-foreground">
          {schema.description}
        </p>
      )}
    </div>
  );
}
```

### Alert Component
Important message or notification.

**Schema**:
```json
{
  "type": "alert",
  "title": "Success",
  "description": "Your changes have been saved.",
  "variant": "default" | "destructive"
}
```

**Implementation**:
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function AlertRenderer({ schema }: RendererProps<AlertSchema>) {
  const Icon = schema.variant === 'destructive' ? AlertCircle : CheckCircle2;

  return (
    <Alert variant={schema.variant} className={schema.className}>
      <Icon className="h-4 w-4" />
      
      {schema.title && (
        <AlertTitle>{schema.title}</AlertTitle>
      )}
      
      {schema.description && (
        <AlertDescription>{schema.description}</AlertDescription>
      )}
    </Alert>
  );
}
```

### Table Component
Data table with columns and rows.

**Schema**:
```json
{
  "type": "table",
  "columns": [
    { "key": "name", "label": "Name" },
    { "key": "email", "label": "Email" },
    { "key": "role", "label": "Role" }
  ],
  "data": [
    { "name": "John Doe", "email": "john@example.com", "role": "Admin" },
    { "name": "Jane Smith", "email": "jane@example.com", "role": "User" }
  ]
}
```

**Implementation**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';

export function TableRenderer({ schema }: RendererProps<TableSchema>) {
  return (
    <div className={cn('rounded-md border', schema.className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {schema.columns?.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {schema.data?.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {schema.columns?.map((column) => (
                <TableCell key={column.key}>
                  {row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Development Guidelines

### Data Binding

Support expression evaluation for dynamic data:

```tsx
const value = useExpression(schema.value, data, '');
const items = useExpression(schema.items, data, []);
```

### Formatting

Support data formatting:

```tsx
// Numbers
const formatted = new Intl.NumberFormat('en-US').format(value);

// Currency
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(value);

// Dates
const formatted = new Date(value).toLocaleDateString();
```

### Empty States

Handle empty data gracefully:

```tsx
if (!schema.items || schema.items.length === 0) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {schema.emptyMessage || 'No data available'}
    </div>
  );
}
```

## Testing

```tsx
describe('BadgeRenderer', () => {
  it('renders badge with label', () => {
    const schema = {
      type: 'badge',
      label: 'New'
    };

    render(<SchemaRenderer schema={schema} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const schema = {
      type: 'badge',
      label: 'Error',
      variant: 'destructive' as const
    };

    render(<SchemaRenderer schema={schema} />);
    
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-destructive');
  });
});
```

## Common Patterns

### Status Badge

```json
{
  "type": "badge",
  "label": "${data.status}",
  "variant": "${data.status === 'active' ? 'default' : 'secondary'}"
}
```

### User Profile Card

```json
{
  "type": "flex",
  "gap": 3,
  "align": "center",
  "children": [
    {
      "type": "avatar",
      "src": "${data.user.avatar}",
      "fallback": "${data.user.initials}"
    },
    {
      "type": "stack",
      "spacing": 1,
      "children": [
        { "type": "text", "content": "${data.user.name}", "className": "font-semibold" },
        { "type": "text", "content": "${data.user.email}", "className": "text-sm text-muted-foreground" }
      ]
    }
  ]
}
```

### Statistics Dashboard

```json
{
  "type": "grid",
  "columns": 3,
  "gap": 4,
  "items": [
    {
      "type": "statistic",
      "label": "Total Users",
      "value": "${data.stats.users}",
      "trend": "${data.stats.userGrowth}",
      "trendDirection": "up"
    },
    {
      "type": "statistic",
      "label": "Revenue",
      "value": "${data.stats.revenue}",
      "trend": "${data.stats.revenueGrowth}",
      "trendDirection": "up"
    },
    {
      "type": "statistic",
      "label": "Orders",
      "value": "${data.stats.orders}",
      "trend": "${data.stats.orderGrowth}",
      "trendDirection": "down"
    }
  ]
}
```

## Checklist

- [ ] Supports dynamic data via expressions
- [ ] Handles empty states
- [ ] Proper data formatting
- [ ] Accessible markup
- [ ] Tests added
- [ ] Visual variants implemented

---

**Principle**: Present data in **clear**, **scannable** formats with **proper formatting**.
