# ObjectUI Component Gallery

Complete catalog of all 79+ components available in ObjectUI with MSW support.

## 📊 Component Overview

### By Category

| Category | Count | Coverage |
|----------|-------|----------|
| **Basic Components** | 11 | ✅ 100% |
| **Form Components** | 17 | 🔄 In Progress |
| **Layout Components** | 9 | ✅ 100% |
| **Data Display** | 9 | ✅ 100% |
| **Overlay/Dialogs** | 10 | 🔄 In Progress |
| **Feedback** | 8 | ✅ 100% |
| **Navigation** | 2 | 🔄 In Progress |
| **Disclosure** | 3 | 🔄 In Progress |
| **Complex** | 6 | 🔄 In Progress |
| **Field Widgets** | 37 | 🔄 In Progress |
| **Plugins** | 14 | 🔄 In Progress |

**Total: 126 Components**

## 🎨 Basic Components (11)

Building blocks for any UI.

### Text & Typography
- **Text** - Plain text rendering
- **Span** - Inline text wrapper
- **HTML** - Raw HTML rendering

### Containers
- **Div** - Generic container
- **Container** - Responsive container

### Media
- **Image** - Image display with lazy loading
- **Icon** - Lucide icon library (1000+ icons)

### UI Elements
- **Button Group** - Grouped button controls
- **Separator** - Visual divider (horizontal/vertical)
- **Pagination** - Page navigation
- **Navigation Menu** - Multi-level navigation

**Storybook Coverage:** `Components/Basic/Text & Layout`

## 📝 Form Components (17)

Input controls for data collection.

### Text Inputs
- **Input** - Single-line text input
- **Textarea** - Multi-line text input
- **Password** - Password input with toggle

### Selections
- **Select** - Dropdown selection
- **Combobox** - Searchable dropdown
- **Radio Group** - Single choice from options
- **Checkbox** - Boolean selection
- **Switch** - Toggle switch

### Advanced Inputs
- **Slider** - Range selection
- **Date Picker** - Date selection calendar
- **Time Picker** - Time selection
- **Color Picker** - Color selection
- **File Upload** - File selection

### Special Inputs
- **Input OTP** - One-time password input
- **Command** - Command palette
- **Form** - Complete form wrapper
- **Label** - Form field label

**Storybook Coverage:** `Components/Form`

## 📐 Layout Components (9)

Structural components for page layout.

- **Container** - Content container with max-width
- **Grid** - CSS Grid layout
- **Flex** - Flexbox layout
- **Stack** - Vertical/horizontal stack
- **Section** - Semantic section
- **Header** - Page header
- **Footer** - Page footer
- **Sidebar** - Collapsible sidebar
- **Tabs** - Tabbed content

**Storybook Coverage:** `Components/Layout/All`

## 📊 Data Display (9)

Components for presenting data.

- **Badge** - Status indicators and labels
- **Avatar** - User images with fallback
- **Card** - Content container with elevation
- **Table** - Data table with sorting/filtering
- **List** - Vertical list of items
- **Tree View** - Hierarchical data display
- **Statistic** - KPI and metric display
- **Kbd** - Keyboard shortcut display
- **Tooltip** - Hover information

**Storybook Coverage:** `Components/Data Display/All`

## 🔔 Feedback Components (8)

User feedback and loading states.

### Progress Indicators
- **Progress** - Linear progress bar
- **Spinner** - Loading spinner
- **Skeleton** - Loading placeholder
- **Loading** - Full-page loader

### Messages
- **Alert** - Inline message (info/warning/error/success)
- **Toast** - Notification popup
- **Toaster** - Toast container
- **Empty** - Empty state placeholder

**Storybook Coverage:** `Components/Feedback/All`

## 🪟 Overlay Components (10)

Modal dialogs and popups.

- **Dialog** - Modal dialog
- **Alert Dialog** - Confirmation dialog
- **Sheet** - Slide-in panel
- **Drawer** - Side drawer
- **Popover** - Floating content
- **Dropdown Menu** - Action menu
- **Context Menu** - Right-click menu
- **Hover Card** - Hover preview
- **Menubar** - Application menu
- **Tooltip** - Hover tooltip

**Storybook Coverage:** `Components/Overlay`

## 🧭 Navigation Components (4)

Navigation and routing.

- **Navigation Menu** - Multi-level menu
- **Breadcrumb** - Breadcrumb trail
- **Tabs** - Tab navigation
- **Sidebar** - Navigation sidebar

**Storybook Coverage:** `Components/Navigation`

## 📂 Disclosure Components (3)

Expandable/collapsible content.

- **Accordion** - Expandable panels
- **Collapsible** - Single expandable section
- **Disclosure** - Toggle visibility

**Storybook Coverage:** `Components/Disclosure`

## 🎯 Complex Components (6)

Advanced composite components.

- **Data Table** - Full-featured data grid
- **Calendar** - Full calendar view
- **Command Palette** - Command menu
- **Carousel** - Image carousel
- **Resizable** - Resizable panels
- **Scroll Area** - Custom scrollbar

**Storybook Coverage:** `Components/Complex`

## 🔧 Field Widgets (37)

Specialized input widgets for ObjectStack forms.

### Text Fields
- TextField, TextAreaField, RichTextField, CodeField

### Numeric Fields
- NumberField, CurrencyField, PercentField, SliderField, RatingField

### Date/Time Fields
- DateField, DateTimeField, TimeField

### Selection Fields
- SelectField, BooleanField, ColorField

### Reference Fields
- LookupField, UserField, ObjectField, MasterDetailField

### Media Fields
- FileField, ImageField, AvatarField, SignatureField, QRCodeField

### Location Fields
- AddressField, LocationField, GeolocationField

### Special Fields
- AutoNumberField, FormulaField, SummaryField, VectorField, GridField

**Storybook Coverage:** `Fields/Gallery`

## 🔌 Plugin Components (14)

Plugin-based advanced features.

### Data Plugins
- **plugin-grid** - High-performance data grid
- **plugin-kanban** - Drag-and-drop kanban board
- **plugin-form** - Dynamic form builder
- **plugin-view** - Configurable data views
- **plugin-aggrid** - AG Grid integration

### Visualization Plugins
- **plugin-charts** - Chart.js integration
- **plugin-dashboard** - KPI dashboard
- **plugin-map** - Map integration
- **plugin-timeline** - Timeline view
- **plugin-gantt** - Gantt chart
- **plugin-calendar** - Calendar view

### Content Plugins
- **plugin-editor** - Rich text editor
- **plugin-markdown** - Markdown renderer
- **plugin-chatbot** - Chatbot interface

**Storybook Coverage:** `Plugins/*`

## 🎬 Usage Examples

### Basic Component

```typescript
{
  type: 'button',
  props: {
    variant: 'default',
  },
  children: [
    { type: 'text', content: 'Click Me' }
  ]
}
```

### With Mock Data

```typescript
import { mockData } from '@storybook-config/msw-handlers';

{
  type: 'table',
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ],
  data: mockData.contacts.slice(0, 10),
}
```

### With MSW Handlers

```typescript
import { pluginHandlers } from '@storybook-config/msw-handlers';

export const MyStory: Story = {
  parameters: {
    msw: {
      handlers: pluginHandlers.kanban,
    },
  },
  render: () => <KanbanBoard />,
};
```

## 📚 Resources

- [MSW Setup Guide](./.storybook/MSW_SETUP_GUIDE.md)
- [Component Development Guide](./CONTRIBUTING.md)
- [API Reference](https://www.objectui.org/docs)

## 🔍 Finding Components

### By Use Case

**Need to show a list?**
- Simple: `list`, `table`
- Advanced: `plugin-grid`, `plugin-aggrid`

**Need a form?**
- Simple: `form` with field components
- Advanced: `plugin-form` with dynamic fields

**Need to visualize data?**
- Charts: `plugin-charts`
- Dashboard: `plugin-dashboard`
- Timeline: `plugin-timeline`
- Gantt: `plugin-gantt`

**Need user interaction?**
- Buttons: `button`, `button-group`
- Dialogs: `dialog`, `alert-dialog`, `sheet`
- Menus: `dropdown-menu`, `context-menu`

**Need loading states?**
- Progress: `progress`, `spinner`
- Placeholders: `skeleton`, `loading`
- Empty states: `empty`

## 🎯 Testing Strategy

All components can be tested with MSW:

1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test component interactions
3. **Visual Tests** - Storybook visual regression
4. **Accessibility Tests** - Built-in a11y checks

See [MSW Setup Guide](./.storybook/MSW_SETUP_GUIDE.md) for details.

## 🚀 Performance

All components are optimized for:
- **Tree-shaking** - Only load what you use
- **Lazy loading** - Code splitting support
- **Virtual scrolling** - For large lists
- **Memoization** - Prevent unnecessary re-renders

## 📈 Roadmap

Coming soon:
- [ ] Virtual Table (100k+ rows)
- [ ] Advanced Gantt Chart
- [ ] Real-time Collaboration
- [ ] AI-powered Form Builder
- [ ] 3D Visualization
- [ ] Video Player
- [ ] Audio Recorder
- [ ] PDF Viewer

## 🤝 Contributing

Want to add a component?

1. Create the component in appropriate package
2. Add MSW handlers in `.storybook/msw-handlers.ts`
3. Create Storybook stories
4. Add to this documentation
5. Submit a PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
