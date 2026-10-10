# @object-ui/permissions

Role-Based Access Control (RBAC) for Object UI — permission guards, field-level access, and policy evaluation.

## Features

- 🔐 **PermissionProvider** - Context provider for permission-aware applications
- 🛡️ **PermissionGuard** - Conditionally render components based on user permissions
- 🎣 **usePermissions** - Hook for checking access to actions and resources
- 📝 **Field-Level Permissions** - Control visibility and editability per field with `useFieldPermissions`
- 🔍 **Row-Level Security** - Filter data based on permission conditions
- ⚡ **Permission Evaluator** - Programmatic permission checking engine
- 🎯 **Type-Safe** - Full TypeScript support with exported types

## Installation

```bash
npm install @object-ui/permissions
```

**Peer Dependencies:**
- `react` ^18.0.0 || ^19.0.0

## Quick Start

```tsx
import {
  PermissionProvider,
  PermissionGuard,
  usePermissions,
  type ObjectPermissionConfig,
  type RoleDefinition,
} from '@object-ui/permissions';

const roles: RoleDefinition[] = [
  { name: 'admin', label: 'Administrator' },
  { name: 'editor', label: 'Editor' },
];

const permissions: ObjectPermissionConfig[] = [
  {
    object: 'orders',
    roles: {
      editor: { actions: ['read', 'create', 'update'] },
    },
  },
];

function App() {
  return (
    <PermissionProvider roles={roles} permissions={permissions} userRoles={['editor']}>
      <Dashboard />
    </PermissionProvider>
  );
}

function Dashboard() {
  const { can } = usePermissions();

  return (
    <div>
      <h1>Orders</h1>
      <PermissionGuard object="orders" action="create" fallback="custom" fallbackContent={<p>No access</p>}>
        <button>Create Order</button>
      </PermissionGuard>
      {can('orders', 'delete') && <button>Delete</button>}
    </div>
  );
}
```

Roles are `RoleDefinition` records (identity and inheritance); what a role may
do lives in each object's `ObjectPermissionConfig.roles` map, and `userRoles`
names the roles the current user actually holds.

## API

### PermissionProvider

Wraps your application with permission context:

```tsx
import {
  PermissionProvider,
  type ObjectPermissionConfig,
  type RoleDefinition,
} from '@object-ui/permissions';

declare const roleDefinitions: RoleDefinition[];
declare const permissionMap: ObjectPermissionConfig[];

function App() {
  return <div>Your application</div>;
}

const tree = (
  <PermissionProvider roles={roleDefinitions} permissions={permissionMap} userRoles={['editor']}>
    <App />
  </PermissionProvider>
);
```

### usePermissions

Hook for checking permissions programmatically. `can` and `cannot` take the
object first and the action second:

```tsx
import { usePermissions } from '@object-ui/permissions';

function OrderToolbar() {
  const { can, cannot, roles } = usePermissions();

  if (can('orders', 'update')) {
    // allow editing
  }

  return <p>{cannot('orders', 'delete') ? 'Read only' : roles.join(', ')}</p>;
}
```

### useFieldPermissions

Hook for field-level permission checks. It takes the object name, and returns
predicates you call per field:

```tsx
import { useFieldPermissions } from '@object-ui/permissions';

function DiscountField() {
  const { canRead, canWrite } = useFieldPermissions('orders');

  const isVisible = canRead('discount');
  const isEditable = canWrite('discount');

  return isVisible ? <input readOnly={!isEditable} /> : null;
}
```

### `checkField` — which write a field question is about

`usePermissions().checkField(object, field, action)` answers three questions.
`'read'` asks whether the caller may see the field. `'write'` asks whether they
may change it on an EXISTING record (the server's update rule) and `'create'`
whether they may set it on a NEW one (its insert rule). The two write questions
differ only for a field the permission set does not mention: the server lets
such a field through and object admission decides, so `'write'` falls back to
the object's `allowEdit` and `'create'` to its `allowCreate`. An explicit
field-level entry answers both the same way.

```tsx
import { usePermissions } from '@object-ui/permissions';

function TitleInput({ mode }: { mode: 'create' | 'edit' }) {
  const { checkField } = usePermissions();
  // A create form asks the create question: a role that may create orders but
  // not edit them can still fill a new order's title.
  const writable = checkField('orders', 'title', mode === 'create' ? 'create' : 'write');
  return <input disabled={!writable} />;
}
```

Console affordances do not pick the question themselves: they read it from the
affordance-to-grant map in `@object-ui/core` (`AFFORDANCE_GRANTS`,
`resolveAffordance`, `resolveFieldAffordance`).

### PermissionGuard

Conditionally renders children based on permissions. `fallback` selects the
denied behaviour, and `fallbackContent` carries the node rendered for
`fallback="custom"`:

```tsx
import { PermissionGuard } from '@object-ui/permissions';

function DeleteButton() {
  return <button>Delete</button>;
}

const guard = (
  <PermissionGuard object="orders" action="delete" fallback="custom" fallbackContent={<span>Read only</span>}>
    <DeleteButton />
  </PermissionGuard>
);
```

### evaluatePermission

Programmatic permission evaluation:

```tsx
import {
  evaluatePermission,
  type ObjectPermissionConfig,
  type RoleDefinition,
} from '@object-ui/permissions';

declare const roleDefinitions: RoleDefinition[];
declare const permissionConfig: ObjectPermissionConfig[];

const result = evaluatePermission({
  roles: roleDefinitions,
  permissions: permissionConfig,
  userRoles: ['editor'],
  user: { id: 'user-1', roles: ['editor'] },
  object: 'orders',
  action: 'update',
});

result.allowed; // true | false
```

### createPermissionStore

Creates a permission store for advanced use cases:

```tsx
import {
  createPermissionStore,
  type ObjectPermissionConfig,
  type RoleDefinition,
} from '@object-ui/permissions';

declare const roleDefinitions: RoleDefinition[];
declare const permissionConfig: ObjectPermissionConfig[];

const store = createPermissionStore({
  roles: roleDefinitions,
  permissions: permissionConfig,
  userRoles: ['editor'],
});

store.check('orders', 'read'); // PermissionCheckResult: { allowed, reason?, ... }
```

## Links

- 📦 [npm package](https://www.npmjs.com/package/@object-ui/permissions)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Report an issue](https://github.com/objectstack-ai/objectui/issues)
- 🤝 [Contributing Guide](https://github.com/objectstack-ai/objectui/blob/main/CONTRIBUTING.md)
- 🗺️ [Roadmap](https://github.com/objectstack-ai/objectui/blob/main/ROADMAP.md)

## License

MIT — see [LICENSE](./LICENSE).
