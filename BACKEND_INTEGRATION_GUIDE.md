# Backend Integration Guide

## Overview

ObjectUI is a **Universal Schema-Driven UI Engine** designed to work seamlessly with any backend through its modular DataSource architecture. This guide explains how to integrate ObjectUI with your backend, with special focus on ObjectStack integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      ObjectUI Frontend                       │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ SchemaRenderer │→│ ComponentReg │→│ UI Components   │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│           ↓                                     ↑            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           DataSource Interface (Universal)              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ↓                         ↓                         ↓
┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│ ObjectStackAdapter │  │  REST Adapter      │  │ GraphQL Adapter  │
│  (Built-in)        │  │  (Custom)          │  │  (Custom)        │
└─────────┬──────────┘  └─────────┬──────────┘  └─────────┬────────┘
          │                       │                        │
          ↓                       ↓                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Your Backend                              │
│    (ObjectStack / REST API / GraphQL / Firebase / etc.)         │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Options

### Option 1: ObjectStack Backend (Recommended)

ObjectStack is the official backend protocol for ObjectUI, providing:
- ✅ **Zero-config integration** with `@object-ui/data-objectstack`
- ✅ **Full feature support** (CRUD, filters, sorting, pagination, metadata)
- ✅ **Type safety** with shared TypeScript definitions
- ✅ **Advanced features** (ObjectQL, triggers, permissions, validation)

#### Installation

```bash
npm install @object-ui/data-objectstack
```

#### Basic Usage

```typescript
import { createObjectStackAdapter } from '@object-ui/data-objectstack';
import { SchemaRenderer } from '@object-ui/react';

// 1. Create the adapter
const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.yourcompany.com',
  token: 'your-auth-token', // Optional: for authenticated requests
  metadata: {
    cache: true,      // Enable schema caching
    ttl: 3600000,     // Cache TTL: 1 hour
    maxSize: 100      // Max cached schemas
  }
});

// 2. Use with SchemaRenderer
function App() {
  const schema = {
    type: 'object-view',
    objectName: 'users',
    columns: ['name', 'email', 'role']
  };

  return <SchemaRenderer schema={schema} dataSource={dataSource} />;
}
```

#### Full CRUD Example

```typescript
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

const dataSource = createObjectStackAdapter({
  baseUrl: 'https://api.yourcompany.com',
  token: localStorage.getItem('authToken')
});

// CREATE
const newUser = await dataSource.create('users', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});

// READ (with filters, sorting, pagination)
const users = await dataSource.find('users', {
  $filter: 'role eq "admin" and age gt 18',
  $orderby: 'name asc',
  $top: 10,
  $skip: 0,
  $select: ['name', 'email', 'createdAt']
});

// READ ONE
const user = await dataSource.findOne('users', '12345');

// UPDATE
const updated = await dataSource.update('users', '12345', {
  role: 'editor'
});

// DELETE
await dataSource.delete('users', '12345');

// BULK OPERATIONS
const result = await dataSource.bulk('users', {
  create: [{ name: 'Alice' }, { name: 'Bob' }],
  update: [{ id: '1', name: 'Charlie' }],
  delete: ['2', '3']
});
```

#### Advanced Features

**Metadata & Schema Discovery:**

```typescript
// Get object schema with field definitions
const schema = await dataSource.getObjectSchema('users');

console.log(schema);
// {
//   name: 'users',
//   label: 'Users',
//   fields: [
//     { name: 'name', type: 'text', label: 'Name', required: true },
//     { name: 'email', type: 'email', label: 'Email', unique: true },
//     { name: 'role', type: 'select', options: ['admin', 'editor', 'viewer'] }
//   ]
// }
```

**Filter Operators:**

The ObjectStack adapter supports 40+ filter operators:

```typescript
// Comparison
$filter: 'age gt 18 and age lt 65'
$filter: 'status eq "active"'
$filter: 'salary ge 50000'

// Logical
$filter: '(role eq "admin" or role eq "editor") and active eq true'

// String
$filter: 'name like "%John%"'
$filter: 'startswith(email, "admin")'

// Date ranges
$filter: 'createdAt gt 2024-01-01 and createdAt lt 2024-12-31'

// Lookup filters
$filter: 'department/name eq "Engineering"'
$filter: 'manager/email eq "boss@company.com"'

// Array operations
$filter: 'tags/any(t: t eq "featured")'
$filter: 'skills/all(s: s in ["React", "TypeScript"])'
```

---

### Option 2: Custom REST API Backend

For existing REST APIs, create a custom adapter:

```typescript
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';

export class RestApiAdapter implements DataSource {
  constructor(private baseUrl: string, private authToken?: string) {}

  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const url = new URL(`${this.baseUrl}/${resource}`);
    
    // Convert ObjectUI params to REST query string
    if (params?.$filter) url.searchParams.set('filter', params.$filter);
    if (params?.$top) url.searchParams.set('limit', params.$top.toString());
    if (params?.$skip) url.searchParams.set('offset', params.$skip.toString());
    if (params?.$orderby) url.searchParams.set('sort', params.$orderby);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return {
      items: data.results,
      total: data.count,
      hasMore: data.next !== null
    };
  }

  async findOne(resource: string, id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    return response.json();
  }

  async create(resource: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${resource}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async update(resource: string, id: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(resource: string, id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
  }

  // Optional: Implement bulk, getObjectSchema, etc.
  async bulk(resource: string, operations: any): Promise<any> {
    throw new Error('Bulk operations not supported by this adapter');
  }

  async getObjectSchema(objectName: string): Promise<any> {
    // Fetch schema from your API or define statically
    const response = await fetch(`${this.baseUrl}/schema/${objectName}`);
    return response.json();
  }
}

// Usage
const dataSource = new RestApiAdapter('https://api.example.com', authToken);
```

---

### Option 3: GraphQL Backend

```typescript
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';
import { ApolloClient, gql } from '@apollo/client';

export class GraphQLAdapter implements DataSource {
  constructor(private client: ApolloClient<any>) {}

  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const query = gql`
      query Get${resource}($filter: String, $limit: Int, $offset: Int) {
        ${resource}(filter: $filter, limit: $limit, offset: $offset) {
          items {
            id
            ... on ${resource} {
              # Add fields dynamically
            }
          }
          total
        }
      }
    `;

    const { data } = await this.client.query({
      query,
      variables: {
        filter: params?.$filter,
        limit: params?.$top,
        offset: params?.$skip
      }
    });

    return {
      items: data[resource].items,
      total: data[resource].total,
      hasMore: data[resource].items.length === params?.$top
    };
  }

  // Implement other methods...
}
```

---

### Option 4: Firebase/Firestore

```typescript
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';
import { getFirestore, collection, query, where, limit, getDocs } from 'firebase/firestore';

export class FirestoreAdapter implements DataSource {
  private db = getFirestore();

  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const collectionRef = collection(this.db, resource);
    let q = query(collectionRef);

    // Apply filters
    if (params?.$filter) {
      // Parse simple filters (you'd need a parser for complex ones)
      const [field, op, value] = params.$filter.split(' ');
      q = query(q, where(field, op as any, value));
    }

    // Apply limit
    if (params?.$top) {
      q = query(q, limit(params.$top));
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      items,
      total: items.length,
      hasMore: items.length === params?.$top
    };
  }

  // Implement other methods...
}
```

---

## DataSource Interface Reference

All adapters must implement the `DataSource` interface:

```typescript
interface DataSource {
  /**
   * Find multiple records with filtering, sorting, pagination
   */
  find(resource: string, params?: QueryParams): Promise<QueryResult>;

  /**
   * Find a single record by ID
   */
  findOne(resource: string, id: string): Promise<any>;

  /**
   * Create a new record
   */
  create(resource: string, data: any): Promise<any>;

  /**
   * Update an existing record
   */
  update(resource: string, id: string, data: any): Promise<any>;

  /**
   * Delete a record
   */
  delete(resource: string, id: string): Promise<void>;

  /**
   * Bulk operations (optional)
   */
  bulk?(resource: string, operations: BulkOperations): Promise<BulkResult>;

  /**
   * Get object schema/metadata (optional)
   */
  getObjectSchema?(objectName: string): Promise<ObjectSchema>;
}
```

### QueryParams

```typescript
interface QueryParams {
  $filter?: string;      // OData-style filter string
  $select?: string[];    // Fields to return
  $orderby?: string;     // Sort expression (e.g., "name asc, age desc")
  $top?: number;         // Limit (page size)
  $skip?: number;        // Offset (for pagination)
  $expand?: string[];    // Include related objects
}
```

### QueryResult

```typescript
interface QueryResult {
  items: any[];          // Array of records
  total: number;         // Total count (for pagination)
  hasMore: boolean;      // Whether more records exist
}
```

---

## Best Practices

### 1. Error Handling

Always implement proper error handling in your adapter:

```typescript
async find(resource: string, params?: QueryParams): Promise<QueryResult> {
  try {
    const response = await fetch(/*...*/);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${resource}:`, error);
    throw error;
  }
}
```

### 2. Caching

Implement caching for frequently accessed data:

```typescript
class CachedAdapter implements DataSource {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const cacheKey = `${resource}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await this.fetchFromApi(resource, params);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

### 3. Authentication

Handle authentication at the adapter level:

```typescript
class AuthenticatedAdapter implements DataSource {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
    };
  }

  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    // ...
  }
}
```

### 4. Type Safety

Use TypeScript for type-safe adapters:

```typescript
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';

export class TypeSafeAdapter implements DataSource {
  async find<T = any>(
    resource: string,
    params?: QueryParams
  ): Promise<QueryResult<T>> {
    // Implementation
  }
}
```

---

## Testing Your Integration

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

describe('ObjectStackAdapter', () => {
  it('should fetch data with filters', async () => {
    const adapter = createObjectStackAdapter({
      baseUrl: 'https://api.test.com'
    });

    const result = await adapter.find('users', {
      $filter: 'active eq true',
      $top: 10
    });

    expect(result.items).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
  });
});
```

### Integration Tests

Test with a mock server (MSW):

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.test.com/users', (req, res, ctx) => {
    return res(
      ctx.json({
        items: [{ id: '1', name: 'John' }],
        total: 1
      })
    );
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
```

---

## Production Deployment

### Environment Configuration

```typescript
const dataSource = createObjectStackAdapter({
  baseUrl: process.env.VITE_API_URL || 'https://api.production.com',
  token: localStorage.getItem('authToken'),
  metadata: {
    cache: process.env.NODE_ENV === 'production',
    ttl: 3600000
  }
});
```

### Performance Monitoring

```typescript
class MonitoredAdapter implements DataSource {
  async find(resource: string, params?: QueryParams): Promise<QueryResult> {
    const start = performance.now();
    
    try {
      const result = await this.actualFind(resource, params);
      const duration = performance.now() - start;
      
      console.log(`[${resource}] Query took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      console.error(`[${resource}] Query failed:`, error);
      throw error;
    }
  }
}
```

---

## Example: Complete CRM Application

See `/examples/crm-app` for a full working example that demonstrates:

✅ ObjectStack backend integration  
✅ CRUD operations  
✅ Filters, sorting, pagination  
✅ Form validation  
✅ Related data (lookups)  
✅ Bulk operations  
✅ Error handling  
✅ Authentication  

---

## Support & Resources

- 📖 [ObjectUI Documentation](https://www.objectui.org)
- 📖 [ObjectStack Documentation](https://github.com/objectstack-ai)
- 🔗 [API Reference](/packages/types/src/data-protocol.ts)
- 🔗 [Example Adapters](/packages/types/examples/)
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectui/issues)

---

**Last Updated:** 2026-01-31  
**ObjectUI Version:** 0.4.0  
**ObjectStack Protocol:** 0.7.2
