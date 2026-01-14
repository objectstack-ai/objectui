# Lazy-Loaded Plugins Architecture

This document explains how Object UI implements lazy-loaded plugins to optimize bundle size.

## Overview

Object UI supports heavy components (like Monaco Editor and Recharts) as separate plugin packages that are lazy-loaded on demand. This keeps the main application bundle small while still providing powerful functionality.

## Architecture

### Traditional Approach (Bad ❌)
```typescript
// This loads Monaco Editor immediately, even if never used
import Editor from '@monaco-editor/react';

function CodeEditor() {
  return <Editor {...props} />;
}
```

### Lazy Loading - Host App Responsibility (Not Ideal ⚠️)
```typescript
// Forces every app to implement lazy loading
const CodeEditor = React.lazy(() => import('./CodeEditor'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CodeEditor />
    </Suspense>
  );
}
```

### Internal Lazy Loading (Best ✅)
```typescript
// The plugin handles lazy loading internally
import '@object-ui/plugin-editor';

// Monaco is NOT loaded yet
// It only loads when a code-editor component is rendered
const schema = { type: 'code-editor', value: '...' };
```

## Implementation Pattern

Each plugin package follows this structure:

### 1. Heavy Implementation File (`XxxImpl.tsx`)
```typescript
// packages/plugin-editor/src/MonacoImpl.tsx
import Editor from '@monaco-editor/react'; // Heavy import

export default function MonacoImpl(props) {
  return <Editor {...props} />;
}
```

### 2. Lazy Wrapper (`index.tsx`)
```typescript
// packages/plugin-editor/src/index.tsx
import React, { Suspense } from 'react';
import { Skeleton } from '@object-ui/components';

// Lazy load the implementation
const LazyMonacoEditor = React.lazy(() => import('./MonacoImpl'));

export const CodeEditorRenderer = (props) => (
  <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
    <LazyMonacoEditor {...props} />
  </Suspense>
);

// Auto-register with ComponentRegistry
ComponentRegistry.register('code-editor', CodeEditorRenderer);

// Export for manual integration
export const editorComponents = {
  'code-editor': CodeEditorRenderer
};
```

### 3. Build Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ObjectUIPluginEditor',
    },
    rollupOptions: {
      // Externalize dependencies
      external: ['react', 'react-dom', '@object-ui/components', '@object-ui/core'],
    },
  },
});
```

## Bundle Analysis

### Plugin-Editor Build Output
```
dist/index.js                 0.19 kB │ gzip:   0.15 kB
dist/MonacoImpl-DCiwKyYW.js  19.42 kB │ gzip:   5.89 kB
dist/index-CpP31686.js       22.42 kB │ gzip:   6.74 kB
dist/index.umd.cjs           30.37 kB │ gzip:  10.88 kB
```

### Plugin-Charts Build Output
```
dist/index.js                 0.19 kB │ gzip:   0.15 kB
dist/index-JeMjZMU4.js       22.38 kB │ gzip:   6.69 kB
dist/ChartImpl-BJBP1UnW.js  541.17 kB │ gzip: 136.04 kB
dist/index.umd.cjs          393.20 kB │ gzip: 118.97 kB
```

### Playground Build Output
When the playground imports both plugins, the chunks are preserved:
```
dist/assets/MonacoImpl-DCiwKyYW-D65z0X-D.js     15.26 kB │ gzip:   5.25 kB
dist/assets/ChartImpl-BJBP1UnW-DO38vX_d.js     348.10 kB │ gzip: 104.54 kB
dist/assets/index-CyDHUpwF.js                2,212.33 kB │ gzip: 561.16 kB
```

Notice that:
- `MonacoImpl` and `ChartImpl` are separate chunks
- They are NOT included in the main `index.js` bundle
- They will only be fetched when the components are rendered

## Creating New Lazy-Loaded Plugins

1. **Create the package structure**:
```bash
mkdir -p packages/plugin-yourfeature/src
```

2. **Create the heavy implementation** (`HeavyImpl.tsx`):
```typescript
import HeavyLibrary from 'heavy-library';

export default function HeavyImpl(props) {
  return <HeavyLibrary {...props} />;
}
```

3. **Create the lazy wrapper** (`index.tsx`):
```typescript
import React, { Suspense } from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { Skeleton } from '@object-ui/components';

const LazyComponent = React.lazy(() => import('./HeavyImpl'));

export const YourRenderer = (props) => (
  <Suspense fallback={<Skeleton />}>
    <LazyComponent {...props} />
  </Suspense>
);

ComponentRegistry.register('your-component', YourRenderer);

export const yourComponents = {
  'your-component': YourRenderer
};
```

4. **Configure build** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ObjectUIPluginYourFeature',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@object-ui/components', '@object-ui/core'],
    },
  },
});
```

5. **Use in the app**:
```typescript
// app/src/App.tsx
import '@object-ui/plugin-yourfeature';

// Now use it in schemas
const schema = { type: 'your-component', ... };
```

## Benefits

1. **Smaller Initial Bundle**: Heavy libraries are not included in the main bundle
2. **Faster Page Loads**: Initial page load only includes essential code
3. **Better UX**: Components show loading skeletons while chunks download
4. **Zero Configuration for Users**: The plugin handles all lazy loading internally
5. **Automatic Code Splitting**: Vite automatically splits the code at build time

## Verification

You can verify lazy loading works by:

1. **Build the playground**:
```bash
cd apps/playground
pnpm build
ls -lh dist/assets/ | grep -E "(Monaco|Chart)"
```

2. **Check for separate chunks**:
```
MonacoImpl-xxx.js  (~15-20 KB)
ChartImpl-xxx.js   (~350-540 KB)
```

3. **Test in browser**:
- Open DevTools → Network tab
- Load a page WITHOUT the plugin components
- The Monaco/Chart chunks should NOT be loaded
- Navigate to a page WITH the plugin components
- The chunks should NOW be loaded

## References

- React.lazy() documentation: https://react.dev/reference/react/lazy
- Vite code splitting: https://vitejs.dev/guide/features.html#code-splitting
- Rollup chunking: https://rollupjs.org/configuration-options/#output-manualchunks
