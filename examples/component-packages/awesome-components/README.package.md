# Example Component Package: Awesome Components

This is a complete example of an ObjectQL component package that can be published as an npm UMD module and installed from an application marketplace.

## 📦 Package Structure

```
awesome-components/
├── package.json                  # npm package configuration
├── objectql.package.json         # ObjectQL package manifest
├── rollup.config.js             # UMD build configuration
├── README.md                     # Package documentation
├── src/
│   ├── index.ts                 # Main entry point
│   ├── types.ts                 # TypeScript type definitions
│   └── components/
│       ├── AwesomeTable.tsx     # Table component
│       └── AwesomeForm.tsx      # Form component
├── metadata/
│   ├── awesome_table.component.yml
│   └── awesome_form.component.yml
└── dist/                        # Built output (generated)
    ├── index.umd.js             # UMD bundle
    ├── index.esm.js             # ES module bundle
    ├── index.d.ts               # TypeScript definitions
    └── style.css                # Compiled styles
```

## 🚀 Key Features

1. **UMD Format**: Can be used in browser, CommonJS, and ES modules
2. **TypeScript**: Full type definitions included
3. **Tailwind CSS**: Styled with Tailwind utility classes
4. **ObjectQL Metadata**: Complete component metadata for marketplace
5. **Multiple Exports**: Named and default exports for flexibility

## 📋 Building the Package

```bash
# Install dependencies
npm install

# Build UMD bundle
npm run build

# This creates:
# - dist/index.umd.js (UMD bundle for browsers)
# - dist/index.esm.js (ES module for bundlers)
# - dist/index.d.ts (TypeScript definitions)
# - dist/style.css (Compiled styles)
```

## 📦 Publishing

### To npm

```bash
npm publish --access public
```

### To ObjectQL Marketplace

```bash
objectql publish --package ./objectql.package.json
```

## 💻 Usage After Installation

### Method 1: ES Modules (React)

```tsx
import { AwesomeTable, AwesomeForm } from '@mycompany/awesome-components';

function MyPage() {
  return (
    <div>
      <AwesomeTable object="projects" sortable={true} />
      <AwesomeForm object="projects" mode="create" />
    </div>
  );
}
```

### Method 2: UMD (Browser)

```html
<script src="node_modules/@mycompany/awesome-components/dist/index.umd.js"></script>
<link rel="stylesheet" href="node_modules/@mycompany/awesome-components/dist/style.css">

<script>
  const { AwesomeTable, AwesomeForm } = window.AwesomeComponents;
  
  // Use components via React.createElement or JSX transpiler
  ReactDOM.render(
    React.createElement(AwesomeTable, { object: 'projects' }),
    document.getElementById('root')
  );
</script>
```

### Method 3: Via ObjectQL Metadata

```yaml
# dashboard.page.yml
components:
  - id: projects_table
    component: awesome_table  # From installed package
    props:
      object: projects
      sortable: true
```

## 🔧 Package Manifest (objectql.package.json)

The `objectql.package.json` file contains:

- **metadata**: Display information for marketplace
- **components**: List of components in the package
- **dependencies**: Required npm packages
- **marketplace**: Marketplace-specific settings (pricing, support, etc.)
- **build**: Build configuration

## 📝 Component Metadata

Each component has a `.component.yml` file in the `metadata/` directory:

- Component props and types
- Events and handlers
- UMD-specific configuration (bundle path, global name, export name)
- Features, platforms, accessibility info
- AI context for understanding
- Usage examples

## 🎯 Key Differences from Regular npm Packages

1. **objectql.package.json**: Additional manifest for ObjectQL marketplace
2. **metadata/**: Component metadata in YAML format
3. **UMD Build**: Configured for browser usage via `<script>` tags
4. **Global Name**: Components available on `window.AwesomeComponents`
5. **Component Registry**: Auto-registers with ObjectQL on install

## 📚 Related Documentation

- [Component Package Specification](../../../docs/spec/component-package.md)
- [Component Metadata Specification](../../../docs/spec/component.md)
- [Publishing Guide](../../../docs/guide/publishing-components.md)

## ✅ Validation Checklist

Before publishing, ensure:

- [ ] `package.json` is complete and valid
- [ ] `objectql.package.json` exists with all required fields
- [ ] All component metadata files exist
- [ ] UMD bundle builds successfully
- [ ] TypeScript definitions are generated
- [ ] README.md is comprehensive
- [ ] LICENSE file exists
- [ ] Tests pass
- [ ] No security vulnerabilities
