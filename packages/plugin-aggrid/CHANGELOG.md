# @object-ui/plugin-aggrid

## 0.4.2

### Patch Changes

- ### Bug Fixes & Improvements
  - **Components**: Fixed duplicate component registry imports
  - **MSW Integration**: Enhanced MSW plugin configuration with robust manual handlers for API endpoints
  - **Data Binding**: Improved data fetching and binding in ObjectKanban and ObjectTimeline components
  - **Form Components**: Enhanced form components with loading state, required and disabled props, improved event handling
  - **Field Components**: Added disabled prop support to various field components for enhanced flexibility
  - **Grid Components**: Improved metadata handling and className utility in form and grid components
  - **Layout**: Enhanced layout components with improved props handling and responsive configurations
  - **Testing**: Added comprehensive unit tests for field widgets and improved test configurations
  - **Dependencies**: Updated ObjectStack dependencies to version 0.8.2 across multiple packages

- Updated dependencies
  - @object-ui/core@0.3.2
  - @object-ui/react@0.3.2
  - @object-ui/components@0.3.2
  - @object-ui/data-objectstack@0.3.2
  - @object-ui/types@0.3.2

## 0.4.1

### Patch Changes

- Maintenance release - Documentation and build improvements
- Updated dependencies
  - @object-ui/types@0.3.1
  - @object-ui/core@0.3.1
  - @object-ui/react@0.3.1
  - @object-ui/components@0.3.1

## 0.4.0

### Minor Changes

- **Cell & Row Editing**: Added inline editing support with `editable` prop and `singleClickEdit` option
- **CSV Export**: Built-in export functionality with configurable options
- **Event Callbacks**: Support for `onCellClicked`, `onRowClicked`, `onSelectionChanged`, `onCellValueChanged`, and `onExport` callbacks
- **Status Bar**: Display aggregations (count, sum, avg, min, max) at the bottom of the grid
- **Column Configuration**: Global column settings with `columnConfig` for resizable, sortable, and filterable columns
- **Range Selection**: Enable Excel-like range selection with `enableRangeSelection`
- **Context Menu**: Customizable right-click context menu with built-in and custom actions
- **Enhanced TypeScript Types**: Added `AgGridCallbacks`, `ExportConfig`, `StatusBarConfig`, `ColumnConfig`, and `ContextMenuConfig` types
- **Improved API**: Extended schema with editing, export, status bar, column configuration, and context menu

## 0.3.0

### Minor Changes

- Initial release of AG Grid plugin
- Support for AG Grid Community Edition
- Lazy loading with React.Suspense
- Multiple theme support (Quartz, Alpine, Balham, Material)
- Full pagination, sorting, and filtering support
- TypeScript support with type definitions
- Automatic component registration
- Comprehensive test coverage
