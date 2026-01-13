# Object UI Designer - Visual Layout

## Designer Interface Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Object UI Designer          [Import JSON] [Export JSON] [Copy JSON]     │
├──────────────┬───────────────────────────────────────────┬───────────────┤
│              │                                           │               │
│ Components   │              Canvas                       │  Properties   │
│              │                                           │               │
│ Form         │  ┌─────────────────────────────────────┐ │  Component    │
│ ├ Button     │  │ div (root)                          │ │  Type:        │
│ ├ Input      │  │ ┌─────────────────────────────────┐ │ │  Container    │
│ ├ Textarea   │  │ │ card                            │ │ │               │
│ ├ Select     │  │ │ Title: Welcome to Designer      │ │ │  Properties:  │
│ └ Checkbox   │  │ │ ┌───────────────────────────┐   │ │ │               │
│              │  │ │ │ text                      │   │ │ │  Label:       │
│ Basic        │  │ │ │ "Start by adding..."      │   │ │ │  [        ]   │
│ ├ Container  │  │ │ └───────────────────────────┘   │ │ │               │
│ ├ Text       │  │ └─────────────────────────────────┘ │ │  Variant:     │
│ ├ Span       │  │                                     │ │ │  [default ▼]  │
│ └ Separator  │  │  (Click components to edit)         │ │ │               │
│              │  └─────────────────────────────────────┘ │ │  CSS Class:   │
│ Layout       │                                           │ │  [        ]   │
│ ├ Card       │                                           │ │               │
│ ├ Tabs       │                                           │ │  [Delete]     │
│ └ Accordion  │                                           │ │               │
│              │                                           │                 │
│ ...          │                                           │                 │
│              │                                           │                 │
└──────────────┴───────────────────────────────────────────┴───────────────┘
```

## Features Demonstrated

### Left Panel: Component Palette
- **Categorized Components**: Form, Basic, Layout, Overlay, etc.
- **Click to Add**: Click any component to add it to the canvas
- **Organized by Type**: Easy to find the component you need

### Center Panel: Canvas
- **Live Preview**: See your schema rendered in real-time
- **Visual Selection**: Click to select components
- **Highlight on Hover**: Components highlight when you hover over them
- **Selection Indicator**: Selected component shows blue outline with type/ID label

### Right Panel: Properties
- **Dynamic Forms**: Forms adapt based on selected component
- **Type-specific Controls**: 
  - Text inputs for strings
  - Number inputs for numbers
  - Dropdowns for enums
  - Checkboxes for booleans
- **CSS Class Editor**: Edit Tailwind classes directly
- **Delete Button**: Remove selected component

### Top Toolbar
- **Import JSON**: Load a schema from JSON
- **Export JSON**: View and copy the schema as JSON
- **Copy JSON**: Copy schema to clipboard

## User Workflow

1. **Start with Empty Canvas**
   - Designer loads with a basic container

2. **Add Components**
   - Browse components in left panel
   - Click to add to canvas
   - Components are added to selected parent (or root)

3. **Edit Properties**
   - Click component in canvas to select
   - Edit properties in right panel
   - See changes immediately

4. **Configure Styling**
   - Add Tailwind CSS classes
   - Customize colors, spacing, typography

5. **Export Schema**
   - Click "Export JSON" to see the schema
   - Copy to use in your application
   - Or save for later editing

## Component Categories

### Form Components
- Button, Input, Textarea, Select, Checkbox, Switch, Radio Group, Slider, Toggle, Calendar

### Basic Components
- Container (div), Text, Span, Separator

### Layout Components
- Card, Tabs, Accordion, Collapsible

### Overlay Components
- Dialog, Sheet, Popover, Tooltip, Alert Dialog, Drawer, Dropdown Menu, Context Menu

### Data Display
- Badge, Avatar, Alert

### Feedback
- Progress, Skeleton, Toaster

### Navigation
- Sidebar, Header Bar

### Complex
- Table, Carousel, Scroll Area, Resizable

## Example Use Cases

1. **Form Builder**
   - Add form components
   - Configure validation
   - Set labels and placeholders

2. **Dashboard Layout**
   - Use cards for widgets
   - Add tabs for sections
   - Include data display components

3. **Landing Page**
   - Create hero sections
   - Add CTAs with buttons
   - Build feature sections

4. **Admin Panel**
   - Use sidebar for navigation
   - Tables for data display
   - Forms for CRUD operations

## Technical Architecture

```
DesignerContext
    ↓
    ├── Schema State
    ├── Selection State
    ├── CRUD Operations
    └── Event Handlers
        ↓
    ┌───┴───┬──────────┬────────────┐
    │       │          │            │
Canvas  Palette  Properties   Toolbar
    │       │          │            │
    └───┬───┴──────────┴────────────┘
        ↓
   User Actions
```

All components share the same state through React Context, ensuring synchronized updates across the entire interface.
