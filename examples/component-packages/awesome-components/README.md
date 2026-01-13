# Awesome Components for ObjectQL

A collection of beautiful, production-ready UI components for ObjectQL applications.

## 🚀 Installation

### Via npm

```bash
npm install @mycompany/awesome-components
```

### Via ObjectQL Marketplace

```bash
objectql install @mycompany/awesome-components
```

Or install through the ObjectQL Studio UI: Marketplace → Browse → Install

## 📦 Components Included

- **AwesomeTable** - Advanced data table with sorting, filtering, and pagination
- **AwesomeForm** - Flexible form builder with validation
- **AwesomeChart** - Data visualization charts

## 💻 Usage

### Method 1: Direct Import (React)

```tsx
import { AwesomeTable } from '@mycompany/awesome-components';

function MyPage() {
  return (
    <AwesomeTable
      object="projects"
      columns={[
        { field: 'name', label: 'Name' },
        { field: 'status', label: 'Status' }
      ]}
      sortable={true}
      filterable={true}
    />
  );
}
```

### Method 2: Via ObjectQL Metadata

```yaml
# dashboard.page.yml
components:
  - id: projects_table
    component: awesome_table
    props:
      object: projects
      sortable: true
      filterable: true
```

### Method 3: UMD (Browser)

```html
<script src="https://unpkg.com/@mycompany/awesome-components@1.0.0/dist/index.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@mycompany/awesome-components@1.0.0/dist/style.css">

<script>
  const { AwesomeTable } = window.AwesomeComponents;
  // Use components
</script>
```

## 📖 Documentation

- [Component API Reference](https://docs.mycompany.com/awesome-components/api)
- [Examples & Demos](https://docs.mycompany.com/awesome-components/examples)
- [Migration Guide](https://docs.mycompany.com/awesome-components/migration)

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📄 License

MIT © MyCompany

## 🤝 Support

- Email: support@mycompany.com
- Issues: https://github.com/mycompany/awesome-components/issues
- Documentation: https://docs.mycompany.com/awesome-components
