---
title: "Troubleshooting Guide"
description: "Solutions to common issues when using ObjectUI"
---

# Troubleshooting Guide

This guide helps you resolve common issues when working with ObjectUI.

## Installation Issues

### Package Installation Fails

**Symptom**: `npm install` or `pnpm install` fails with errors

**Solutions**:

1. **Check Node.js version**
   ```bash
   node --version  # Should be 18.0 or higher
   ```
   If too old, update Node.js from [nodejs.org](https://nodejs.org)

2. **Clear package manager cache**
   ```bash
   # npm
   npm cache clean --force
   
   # pnpm
   pnpm store prune
   
   # yarn
   yarn cache clean
   ```

3. **Delete lock files and node_modules**
   ```bash
   rm -rf node_modules package-lock.json pnpm-lock.yaml
   pnpm install
   ```

### Peer Dependency Warnings

**Symptom**: Warnings about peer dependencies for React or Tailwind

**Solution**: Ensure you have the correct versions:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## Build Issues

### Tailwind Styles Not Applied

**Symptom**: Components render but have no styling

**Solution 1**: Add ObjectUI packages to Tailwind content

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // ⚠️ CRITICAL: Add this line
    "./node_modules/@object-ui/**/*.{js,jsx,ts,tsx}"
  ],
  // ... rest of config
}
```

**Solution 2**: Verify Tailwind is processing styles

```bash
# Check if PostCSS is configured
cat postcss.config.js

# Should include:
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**Solution 3**: Import Tailwind CSS

```css
/* src/index.css or src/App.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### TypeScript Errors

**Symptom**: TypeScript compilation errors about missing types

**Solution 1**: Install type definitions

```bash
pnpm add -D @types/react @types/react-dom
```

**Solution 2**: Update tsconfig.json

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "types": ["node"],
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

### Build Fails with Module Not Found

**Symptom**: Error: "Cannot find module '@object-ui/xyz'"

**Solution**:

1. Verify package is installed:
   ```bash
   pnpm list @object-ui/core
   ```

2. If missing, install it:
   ```bash
   pnpm add @object-ui/core @object-ui/react @object-ui/components
   ```

3. Check import paths are correct:
   ```typescript
   // ✅ Correct
   import { SchemaRenderer } from '@object-ui/react';
   
   // ❌ Wrong
   import { SchemaRenderer } from '@object-ui/core';
   ```

## Runtime Issues

### Components Not Rendering

**Symptom**: `<SchemaRenderer>` renders nothing or shows errors

**Solution 1**: Register default renderers

```typescript
import { registerDefaultRenderers } from '@object-ui/components';

// Call this ONCE at app initialization (e.g., in main.tsx or App.tsx)
registerDefaultRenderers();
```

**Solution 2**: Check schema is valid

```typescript
import { validateSchema } from '@object-ui/core';

const schema = { type: 'page', body: { type: 'text', value: 'Hello' } };
const result = validateSchema(schema);

if (!result.valid) {
  console.error('Schema validation errors:', result.errors);
}
```

**Solution 3**: Verify schema type is registered

```typescript
import { getRegistry } from '@object-ui/core';

const registry = getRegistry();
console.log('Registered types:', registry.getTypes());
```

### Expression Errors

**Symptom**: Errors like "Cannot read property of undefined" in expressions

**Solution 1**: Provide required data

```typescript
// ❌ Error: data.user is undefined
<SchemaRenderer schema={schema} />

// ✅ Fixed: Provide data
<SchemaRenderer 
  schema={schema} 
  data={{ user: { name: 'John' } }} 
/>
```

**Solution 2**: Use safe navigation

```json
{
  "type": "text",
  "value": "${data?.user?.name || 'Guest'}"
}
```

**Solution 3**: Check expression syntax

```json
{
  "visibleOn": "${data.role === 'admin'}",  
  "hiddenOn": "${!data.isActive}"
}
```

### Actions Not Working

**Symptom**: Buttons or links don't trigger actions

**Solution 1**: Register action handlers

```typescript
import { registerAction } from '@object-ui/core';

registerAction('myCustomAction', (context, action) => {
  console.log('Action triggered:', action);
  // Your custom logic here
});
```

**Solution 2**: Verify action schema

```json
{
  "type": "button",
  "label": "Click Me",
  "onClick": {
    "actionType": "ajax",
    "api": "/api/submit",
    "method": "POST"
  }
}
```

## Data Loading Issues

### API Requests Fail

**Symptom**: Data doesn't load, network errors in console

**Solution 1**: Check CORS configuration

If API is on different domain:
```javascript
// Backend: Add CORS headers
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Solution 2**: Verify DataSource implementation

```typescript
import type { DataSource } from '@object-ui/types';

class MyDataSource implements DataSource {
  async find(resource: string, params?: any) {
    try {
      const response = await fetch(`/api/${resource}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('DataSource error:', error);
      throw error;
    }
  }
}
```

**Solution 3**: Add error boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <SchemaRenderer schema={schema} dataSource={dataSource} />
    </ErrorBoundary>
  );
}
```

### Data Not Updating

**Symptom**: Changes don't reflect in UI

**Solution**: Ensure you're passing updated data

```typescript
function App() {
  const [data, setData] = useState({ count: 0 });
  
  // ❌ This won't trigger re-render
  data.count = 1;
  
  // ✅ This will trigger re-render
  setData({ count: 1 });
  
  return <SchemaRenderer schema={schema} data={data} />;
}
```

## Development Issues

### Hot Module Replacement (HMR) Not Working

**Symptom**: Changes don't auto-reload in development

**Solution 1**: For Vite projects

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true  // Enable for some systems
    }
  }
});
```

**Solution 2**: For Next.js projects

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  }
};
```

### CLI Commands Not Working

**Symptom**: `objectui` command not found

**Solution 1**: Install CLI globally

```bash
npm install -g @object-ui/cli
```

**Solution 2**: Use npx

```bash
npx @object-ui/cli dev
```

**Solution 3**: Add to package.json scripts

```json
{
  "scripts": {
    "objectui": "objectui",
    "dev": "objectui dev app.json"
  }
}
```

## Performance Issues

### Slow Initial Load

**Solution 1**: Enable code splitting

```typescript
import { lazy, Suspense } from 'react';

const SchemaRenderer = lazy(() => import('@object-ui/react').then(m => ({ default: m.SchemaRenderer })));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchemaRenderer schema={schema} />
    </Suspense>
  );
}
```

**Solution 2**: Lazy-load plugins

```typescript
// Only load charts plugin when needed
const loadChartsPlugin = async () => {
  const { registerChartRenderers } = await import('@object-ui/plugin-charts');
  registerChartRenderers();
};
```

**Solution 3**: Optimize bundle size

```bash
# Analyze bundle
npx vite-bundle-visualizer

# Or for webpack
npx webpack-bundle-analyzer
```

### Memory Leaks

**Symptom**: Browser becomes slow over time

**Solution**: Clean up subscriptions and listeners

```typescript
useEffect(() => {
  const subscription = dataSource.subscribe(/* ... */);
  
  return () => {
    subscription.unsubscribe();  // Clean up
  };
}, []);
```

## Common Error Messages

### "Cannot read properties of undefined"

**Cause**: Accessing nested properties without null checking

**Fix**: Use optional chaining or provide defaults

```json
{
  "value": "${data?.user?.profile?.name || 'Unknown'}"
}
```

### "Component type 'xyz' is not registered"

**Cause**: Component renderer not registered

**Fix**: Register the component or check for typos

```typescript
// Register custom component
registerRenderer('xyz', MyXyzComponent);

// Or check schema has correct type
{
  "type": "button"  // Must match registered type exactly
}
```

### "Schema validation failed"

**Cause**: Invalid schema structure

**Fix**: Use TypeScript types and validate

```typescript
import type { ButtonSchema } from '@object-ui/types';

const schema: ButtonSchema = {
  type: 'button',
  label: 'Click Me',
  // TypeScript will catch errors here
};
```

## Getting More Help

### Enable Debug Mode

```typescript
import { setDebugMode } from '@object-ui/core';

setDebugMode(true);  // Enables verbose logging
```

### Check Browser Console

Most issues show detailed error messages in the browser console. Open DevTools (F12) and check:
- Console tab for errors
- Network tab for failed requests
- React DevTools for component tree

### Minimal Reproduction

Create a minimal example:

```typescript
import { SchemaRenderer } from '@object-ui/react';
import { registerDefaultRenderers } from '@object-ui/components';

registerDefaultRenderers();

function App() {
  const schema = {
    type: 'page',
    body: {
      type: 'text',
      value: 'Hello World'
    }
  };
  
  return <SchemaRenderer schema={schema} />;
}
```

If this works, gradually add complexity until you find the issue.

### Report an Issue

If you can't resolve the issue:

1. Check [existing issues](https://github.com/objectstack-ai/objectui/issues)
2. Create a minimal reproduction
3. [Open a new issue](https://github.com/objectstack-ai/objectui/issues/new) with:
   - Error message
   - Steps to reproduce
   - Environment (Node version, browser, etc.)
   - Code example

---

**Still stuck?**

- 💬 [Ask in Discussions](https://github.com/objectstack-ai/objectui/discussions)
- 📖 [Read the docs](https://objectui.org)
- 🐛 [Report a bug](https://github.com/objectstack-ai/objectui/issues)
