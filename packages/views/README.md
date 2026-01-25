# @object-ui/views

Core Object UI views package, providing seamless integration with ObjectStack backends through auto-generated components.

## Features

- **ObjectGrid**: A specialized grid/table component with CRUD operations, search, filters, and pagination
- **ObjectForm**: A smart form component that generates forms from ObjectStack object schemas
- **ObjectView**: A complete object management interface combining grid and form components
- **ObjectKanban**: A kanban board view with drag-and-drop support for organizing data by status
- **ObjectCalendar**: A calendar view for displaying time-based records as events
- **ObjectGantt**: A Gantt chart view for project timeline visualization with progress tracking
- **ObjectMap**: A geographic map view for location-based data visualization

## Installation

```bash
npm install @object-ui/views @object-ui/core
```

## Usage

### ObjectGrid

Display data in a table/grid format with sorting, filtering, and pagination.

```tsx
import { ObjectGrid } from '@object-ui/views';
import { createObjectStackAdapter } from '@object-ui/core';

const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.example.com',
  token: 'your-auth-token'
});

function UsersTable() {
  return (
    <ObjectGrid 
      schema={{
        type: 'object-grid',
        objectName: 'users',
        columns: ['name', 'email', 'status'],
        searchableFields: ['name', 'email'],
        pagination: { pageSize: 25 }
      }}
      dataSource={dataSource}
    />
  );
}
```

### ObjectForm

Create or edit records with auto-generated forms.

```tsx
import { ObjectForm } from '@object-ui/views';
import { createObjectStackAdapter } from '@object-ui/core';

const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.example.com',
  token: 'your-auth-token'
});

function UserForm() {
  return (
    <ObjectForm 
      schema={{
        type: 'object-form',
        objectName: 'users',
        mode: 'create',
        fields: ['name', 'email', 'role'],
        onSuccess: (data) => console.log('Created:', data)
      }}
      dataSource={dataSource}
    />
  );
}
```

### ObjectView

Complete CRUD interface with grid and form integration.

```tsx
import { ObjectView } from '@object-ui/views';
import { createObjectStackAdapter } from '@object-ui/core';

const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.example.com',
  token: 'your-auth-token'
});

function UsersView() {
  return (
    <ObjectView 
      schema={{
        type: 'object-view',
        objectName: 'users',
        showSearch: true,
        showFilters: true,
        layout: 'drawer'
      }}
      dataSource={dataSource}
    />
  );
}
```

### ObjectKanban

Display data as a kanban board grouped by a status field.

```tsx
import { ObjectKanban } from '@object-ui/views';

function TasksKanban() {
  return (
    <ObjectKanban 
      schema={{
        type: 'object-grid',
        objectName: 'tasks',
        data: { provider: 'object', object: 'tasks' },
        filter: {
          kanban: {
            groupByField: 'status',
            columns: ['title', 'priority', 'assignee'],
            summarizeField: 'estimated_hours'
          }
        }
      }}
      dataSource={dataSource}
      onCardMove={(cardId, fromColumn, toColumn) => {
        console.log(`Moved ${cardId} from ${fromColumn} to ${toColumn}`);
      }}
    />
  );
}
```

### ObjectCalendar

Display time-based records as calendar events.

```tsx
import { ObjectCalendar } from '@object-ui/views';

function EventsCalendar() {
  return (
    <ObjectCalendar 
      schema={{
        type: 'object-grid',
        objectName: 'events',
        data: { provider: 'object', object: 'events' },
        filter: {
          calendar: {
            startDateField: 'start_date',
            endDateField: 'end_date',
            titleField: 'title',
            colorField: 'category'
          }
        }
      }}
      dataSource={dataSource}
      onEventClick={(event) => console.log('Event clicked:', event)}
    />
  );
}
```

### ObjectGantt

Visualize project tasks with a Gantt chart timeline.

```tsx
import { ObjectGantt } from '@object-ui/views';

function ProjectGantt() {
  return (
    <ObjectGantt 
      schema={{
        type: 'object-grid',
        objectName: 'tasks',
        data: { provider: 'object', object: 'tasks' },
        filter: {
          gantt: {
            startDateField: 'start_date',
            endDateField: 'end_date',
            titleField: 'title',
            progressField: 'progress',
            dependenciesField: 'dependencies'
          }
        }
      }}
      dataSource={dataSource}
      onTaskClick={(task) => console.log('Task clicked:', task)}
    />
  );
}
```

### ObjectMap

Display location-based data on a map.

```tsx
import { ObjectMap } from '@object-ui/views';

function LocationsMap() {
  return (
    <ObjectMap 
      schema={{
        type: 'object-grid',
        objectName: 'locations',
        data: { provider: 'object', object: 'locations' },
        filter: {
          map: {
            latitudeField: 'latitude',
            longitudeField: 'longitude',
            titleField: 'name',
            descriptionField: 'address'
          }
        }
      }}
      dataSource={dataSource}
      onMarkerClick={(location) => console.log('Location clicked:', location)}
    />
  );
}
```

## Data Providers

All view components support three data provider types:

### 1. Object Provider (ObjectStack)
Automatically connects to ObjectStack Metadata and Data APIs.

```tsx
data: {
  provider: 'object',
  object: 'users'
}
```

### 2. API Provider (Custom REST API)
Use your own REST endpoints.

```tsx
data: {
  provider: 'api',
  read: { url: '/api/users', method: 'GET' },
  write: { url: '/api/users', method: 'POST' }
}
```

### 3. Value Provider (Static Data)
Use hardcoded data arrays for demos or testing.

```tsx
data: {
  provider: 'value',
  items: [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ]
}
```

## Schema Integration

All components automatically integrate with ObjectStack's schema system to:
- Display appropriate field types
- Apply field-level permissions
- Validate data according to schema rules
- Handle relationships between objects

## License

MIT
