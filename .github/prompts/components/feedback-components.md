# AI Prompt: Feedback Components

## Overview

Feedback components provide **visual feedback** to users about system state, progress, and asynchronous operations. They inform users when things are loading, processing, or completing.

**Category**: `feedback`  
**Examples**: loading, progress, skeleton, toast, spinner  
**Complexity**: ⭐⭐ Moderate  
**Package**: `@object-ui/components/src/renderers/feedback/`

## Purpose

Feedback components:
1. **Show loading states** (spinners, skeletons)
2. **Display progress** (progress bars, percentages)
3. **Notify users** (toasts, alerts)
4. **Indicate activity** (pulsing, animations)

## Core Feedback Components

### Loading Component
Spinning loader indicator.

**Schema**:
```json
{
  "type": "loading",
  "size": "sm" | "md" | "lg",
  "text": "Loading...",
  "fullscreen": false
}
```

**Implementation**:
```tsx
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';

const loadingVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    }
  },
  defaultVariants: {
    size: 'md'
  }
});

export function LoadingRenderer({ schema }: RendererProps<LoadingSchema>) {
  const content = (
    <div className={cn('flex flex-col items-center gap-2', schema.className)}>
      <Loader2 className={loadingVariants({ size: schema.size })} />
      {schema.text && (
        <p className="text-sm text-muted-foreground">{schema.text}</p>
      )}
    </div>
  );

  if (schema.fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}
```

### Progress Component
Progress bar showing completion percentage.

**Schema**:
```json
{
  "type": "progress",
  "value": 65,
  "max": 100,
  "showLabel": true,
  "variant": "default" | "success" | "warning" | "danger"
}
```

**Implementation**:
```tsx
import { Progress as ShadcnProgress } from '@/ui/progress';
import { useExpression } from '@object-ui/react';

export function ProgressRenderer({ schema }: RendererProps<ProgressSchema>) {
  const value = useExpression(schema.value, {}, 0);
  const max = schema.max || 100;
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn('space-y-2', schema.className)}>
      {schema.showLabel && (
        <div className="flex justify-between text-sm">
          <span>{schema.label}</span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
      )}
      
      <ShadcnProgress 
        value={percentage}
        className={cn(
          schema.variant === 'success' && '[&>div]:bg-green-500',
          schema.variant === 'warning' && '[&>div]:bg-yellow-500',
          schema.variant === 'danger' && '[&>div]:bg-red-500'
        )}
      />
    </div>
  );
}
```

### Skeleton Component
Placeholder for loading content.

**Schema**:
```json
{
  "type": "skeleton",
  "variant": "text" | "circular" | "rectangular",
  "width": "100%",
  "height": "20px",
  "count": 3
}
```

**Implementation**:
```tsx
import { Skeleton as ShadcnSkeleton } from '@/ui/skeleton';

export function SkeletonRenderer({ schema }: RendererProps<SkeletonSchema>) {
  const count = schema.count || 1;

  const skeletonStyle = {
    width: schema.width,
    height: schema.height
  };

  const skeletonClass = cn(
    schema.variant === 'circular' && 'rounded-full',
    schema.variant === 'rectangular' && 'rounded-md',
    schema.className
  );

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <ShadcnSkeleton
          key={index}
          className={skeletonClass}
          style={skeletonStyle}
        />
      ))}
    </div>
  );
}
```

### Toast Component
Temporary notification message.

**Schema**:
```json
{
  "type": "toast",
  "title": "Success",
  "description": "Your changes have been saved.",
  "variant": "default" | "destructive",
  "duration": 3000
}
```

**Implementation**:
```tsx
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function ToastRenderer({ schema }: RendererProps<ToastSchema>) {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: schema.title,
      description: schema.description,
      variant: schema.variant,
      duration: schema.duration || 3000
    });
  }, [schema.title, schema.description, schema.variant, schema.duration]);

  return null;  // Toast is rendered in portal
}
```

## Development Guidelines

### Loading States

Show loading during async operations:

```tsx
// In button component
{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

// Full page loading
{isLoading && (
  <LoadingRenderer schema={{ type: 'loading', fullscreen: true }} />
)}
```

### Progress Updates

Support real-time progress updates:

```tsx
const progress = useExpression(schema.value, data, 0);

useEffect(() => {
  // Update progress from data context
}, [progress]);
```

### Skeleton Patterns

Match skeleton to actual content structure:

```tsx
// Card skeleton
{
  "type": "stack",
  "spacing": 2,
  "children": [
    { "type": "skeleton", "variant": "rectangular", "height": "200px" },
    { "type": "skeleton", "variant": "text", "width": "60%" },
    { "type": "skeleton", "variant": "text", "width": "40%" }
  ]
}
```

### Accessibility

```tsx
// Loading state
<div role="status" aria-live="polite">
  <Loader2 className="animate-spin" />
  <span className="sr-only">Loading...</span>
</div>

// Progress bar
<div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
  <Progress value={value} />
</div>
```

## Testing

```tsx
describe('LoadingRenderer', () => {
  it('renders loading spinner', () => {
    const schema = { type: 'loading', text: 'Loading...' };
    render(<SchemaRenderer schema={schema} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders fullscreen loading', () => {
    const schema = { type: 'loading', fullscreen: true };
    const { container } = render(<SchemaRenderer schema={schema} />);
    
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Button with Loading

```json
{
  "type": "button",
  "label": "Submit",
  "loading": "${data.isSubmitting}",
  "onClick": { "type": "action", "name": "submit" }
}
```

### Skeleton Card

```json
{
  "type": "card",
  "className": "p-6",
  "body": {
    "type": "stack",
    "spacing": 3,
    "children": [
      { "type": "skeleton", "variant": "circular", "width": "40px", "height": "40px" },
      { "type": "skeleton", "variant": "text", "width": "80%" },
      { "type": "skeleton", "variant": "text", "width": "60%" }
    ]
  }
}
```

### Upload Progress

```json
{
  "type": "stack",
  "spacing": 2,
  "children": [
    { "type": "text", "content": "Uploading file..." },
    {
      "type": "progress",
      "value": "${data.uploadProgress}",
      "showLabel": true,
      "variant": "default"
    }
  ]
}
```

## Performance

### Avoid Excessive Animation

```tsx
// ✅ Good: Single loader
<Loader2 className="animate-spin" />

// ❌ Bad: Many loaders
{items.map(() => <Loader2 className="animate-spin" />)}
```

### Debounce Updates

```tsx
// For frequent progress updates
const debouncedProgress = useDebounce(progress, 100);
```

## Checklist

- [ ] Loading states handled
- [ ] Progress updates smoothly
- [ ] Skeletons match content
- [ ] Accessible ARIA attributes
- [ ] Animations performant
- [ ] Tests added

---

**Principle**: Provide **clear**, **timely** feedback about system state.
