# Plugin AgGrid - Lazy-Loaded AG Grid Data Grid

A lazy-loaded data grid component for Object UI based on AG Grid Community Edition.

## Features

- **Internal Lazy Loading**: AG Grid libraries are loaded on-demand using `React.lazy()` and `Suspense`
- **Zero Configuration**: Just import the package and use `type: 'aggrid'` in your schema
- **Automatic Registration**: Components auto-register with the ComponentRegistry
- **Skeleton Loading**: Shows a skeleton while AG Grid loads
- **Full AG Grid Features**: Sorting, filtering, pagination, cell rendering, and more
- **Multiple Themes**: Support for Quartz, Alpine, Balham, and Material themes
- **Customizable**: Full access to AG Grid's GridOptions for advanced configuration

## Installation

```bash
pnpm add @object-ui/plugin-aggrid ag-grid-community ag-grid-react
```

Note: `ag-grid-community` and `ag-grid-react` are peer dependencies and must be installed separately.

## Usage

### Automatic Registration (Side-Effect Import)

```typescript
// In your app entry point (e.g., App.tsx or main.tsx)
import '@object-ui/plugin-aggrid';

// Now you can use aggrid type in your schemas
const schema = {
  type: 'aggrid',
  rowData: [
    { make: 'Tesla', model: 'Model Y', price: 64950 },
    { make: 'Ford', model: 'F-Series', price: 33850 },
    { make: 'Toyota', model: 'Corolla', price: 29600 }
  ],
  columnDefs: [
    { field: 'make', headerName: 'Make', sortable: true, filter: true },
    { field: 'model', headerName: 'Model', sortable: true, filter: true },
    { field: 'price', headerName: 'Price', sortable: true, filter: 'number' }
  ],
  pagination: true,
  paginationPageSize: 10,
  theme: 'quartz',
  height: 500
};
```

### Manual Integration

```typescript
import { aggridComponents } from '@object-ui/plugin-aggrid';
import { ComponentRegistry } from '@object-ui/core';

// Manually register if needed
Object.entries(aggridComponents).forEach(([type, component]) => {
  ComponentRegistry.register(type, component);
});
```

### TypeScript Support

The plugin exports TypeScript types for full type safety:

```typescript
import type { AgGridSchema, SimpleColumnDef } from '@object-ui/plugin-aggrid';

const schema: AgGridSchema = {
  type: 'aggrid',
  rowData: [
    { make: 'Tesla', model: 'Model Y', price: 64950 }
  ],
  columnDefs: [
    { field: 'make', headerName: 'Make', sortable: true, filter: true }
  ],
  pagination: true,
  theme: 'quartz'
};
```

## Schema API

```typescript
{
  type: 'aggrid',
  rowData?: any[],                              // Grid data (required)
  columnDefs?: ColDef[],                        // Column definitions (required)
  pagination?: boolean,                         // Enable pagination (default: false)
  paginationPageSize?: number,                  // Rows per page (default: 10)
  theme?: 'quartz' | 'alpine' | 'balham' | 'material',  // Grid theme (default: 'quartz')
  height?: number | string,                     // Grid height (default: 500)
  rowSelection?: 'single' | 'multiple',         // Row selection mode
  domLayout?: 'normal' | 'autoHeight' | 'print', // Layout mode
  animateRows?: boolean,                        // Animate row changes (default: true)
  gridOptions?: GridOptions,                    // Advanced AG Grid options
  className?: string                            // Tailwind classes
}
```

## Column Definition Examples

### Basic Column

```typescript
{
  field: 'name',
  headerName: 'Name',
  sortable: true,
  filter: true
}
```

### Numeric Column with Formatter

```typescript
{
  field: 'price',
  headerName: 'Price',
  sortable: true,
  filter: 'number',
  valueFormatter: (params) => '$' + params.value.toLocaleString()
}
```

### Column with Custom Cell Renderer

```typescript
{
  field: 'status',
  headerName: 'Status',
  cellRenderer: (params) => {
    return params.value === 'active' 
      ? '<span class="text-green-500">✓ Active</span>' 
      : '<span class="text-red-500">✗ Inactive</span>';
  }
}
```

## Themes

AG Grid comes with four built-in themes:

- **Quartz** (default): Modern, clean design
- **Alpine**: Traditional data grid appearance
- **Balham**: Professional business look
- **Material**: Google Material Design inspired

```typescript
const schema = {
  type: 'aggrid',
  theme: 'alpine', // or 'quartz', 'balham', 'material'
  // ... other props
};
```

## Lazy Loading Architecture

The plugin uses a two-file pattern for optimal code splitting:

1. **`AgGridImpl.tsx`**: Contains the actual AG Grid imports (heavy ~200-300 KB)
2. **`index.tsx`**: Entry point with `React.lazy()` wrapper (light)

When bundled, Vite automatically creates separate chunks:
- `index.js` (~200 bytes) - The entry point
- `AgGridImpl-xxx.js` (~200-300 KB) - The lazy-loaded implementation

The AG Grid library is only downloaded when an `aggrid` component is actually rendered, not on initial page load.

## Bundle Size Impact

By using lazy loading, the main application bundle stays lean:
- Without lazy loading: +200-300 KB on initial load
- With lazy loading: +0.19 KB on initial load, +200-300 KB only when grid is rendered

This results in significantly faster initial page loads for applications that don't use data grids on every page.

## Advanced Usage

### With GridOptions

```typescript
const schema = {
  type: 'aggrid',
  rowData: [...],
  columnDefs: [...],
  gridOptions: {
    suppressCellFocus: true,
    enableCellTextSelection: true,
    enableRangeSelection: true,
    rowMultiSelectWithClick: true,
    // Any AG Grid GridOptions property
  }
};
```

### Auto Height Layout

```typescript
const schema = {
  type: 'aggrid',
  rowData: [...],
  columnDefs: [...],
  domLayout: 'autoHeight', // Grid adjusts height to fit all rows
};
```

## Development

```bash
# Build the plugin
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check

# The package will generate proper ESM and UMD builds with lazy loading preserved
```

## License

MIT

## Resources

- [AG Grid Community Documentation](https://www.ag-grid.com/documentation/)
- [AG Grid Column Definitions](https://www.ag-grid.com/documentation/javascript/column-definitions/)
- [AG Grid Grid Options](https://www.ag-grid.com/documentation/javascript/grid-options/)
