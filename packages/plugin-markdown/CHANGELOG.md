# @object-ui/plugin-markdown

## 0.3.2

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
  - @object-ui/types@0.3.2

## 0.3.1

### Patch Changes

- Maintenance release - Documentation and build improvements
- Updated dependencies
  - @object-ui/types@0.3.1
  - @object-ui/core@0.3.1
  - @object-ui/react@0.3.1
  - @object-ui/components@0.3.1

## 0.3.0

### Minor Changes

- Unified version across all packages to 0.3.0 for consistent versioning

## 0.2.2

### Patch Changes

- New plugin-object and ObjectQL SDK updates

  **Added:**
  - New Plugin: @object-ui/plugin-object - ObjectQL plugin for automatic table and form generation
    - ObjectTable: Auto-generates tables from ObjectQL object schemas
    - ObjectForm: Auto-generates forms from ObjectQL object schemas with create/edit/view modes
    - Full TypeScript support with comprehensive type definitions
  - Type Definitions: Added ObjectTableSchema and ObjectFormSchema to @object-ui/types
  - ObjectQL Integration: Enhanced ObjectQLDataSource with getObjectSchema() method using MetadataApiClient

  **Changed:**
  - Updated @objectql/sdk from ^1.8.3 to ^1.9.1
  - Updated @objectql/types from ^1.8.3 to ^1.9.1

- Updated dependencies
  - @object-ui/types@0.3.0
  - @object-ui/core@0.2.2
  - @object-ui/react@0.2.2
  - @object-ui/components@0.2.2

## 0.2.1

### Patch Changes

- Patch release: Add automated changeset workflow and CI/CD improvements

  This release includes infrastructure improvements:
  - Added changeset-based version management
  - Enhanced CI/CD workflows with GitHub Actions
  - Improved documentation for contributing and releasing

- Updated dependencies
  - @object-ui/types@0.2.1
  - @object-ui/core@0.2.1
  - @object-ui/react@0.2.1
  - @object-ui/components@0.2.1
