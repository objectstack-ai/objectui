# MSW-Based Component Development Guide
# 基于 MSW 的组件开发指南

> **Frontend-First Development with ObjectStack**  
> **使用 ObjectStack 的前端优先开发**

---

## Overview / 概述

This guide explains how to develop and test ObjectUI components using the MSW (Mock Service Worker) plugin, enabling **zero-backend development** where the entire ObjectStack runtime runs in your browser.

本指南说明如何使用 MSW（Mock Service Worker）插件开发和测试 ObjectUI 组件，实现**零后端开发**，整个 ObjectStack 运行时在浏览器中运行。

---

## Why MSW-Based Development? / 为什么使用基于 MSW 的开发？

### Benefits / 优势

1. **Zero Backend Dependencies** / **零后端依赖**
   - Develop and test all 79 components without a server
   - 无需服务器即可开发和测试所有79个组件

2. **Instant Feedback Loop** / **即时反馈循环**
   - < 5 second component iteration time with hot reload
   - 热重载时组件迭代时间 < 5秒

3. **Real Validation Logic** / **真实验证逻辑**
   - Uses actual ObjectStack Kernel with schema validation
   - 使用具有模式验证的实际 ObjectStack 内核

4. **Easy Sharing & Demonstration** / **轻松共享与演示**
   - Share component demos without backend setup
   - 无需后端设置即可共享组件演示

5. **Component Isolation** / **组件隔离**
   - Test components independently with mock data
   - 使用模拟数据独立测试组件

---

## Architecture / 架构

```
┌─────────────────────────────────────────────────────────────┐
│                  Browser Environment                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Components (79 UI Components)                   │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  @objectstack/client                                    │ │
│  │  (Makes API calls to /api/v1/...)                      │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service Worker (MSW)                                   │ │
│  │  Intercepts all /api/v1/* requests                     │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ObjectStack Kernel (@objectstack/runtime)             │ │
│  │  - ObjectQL Plugin (Query Engine)                       │ │
│  │  - InMemory Driver (Database)                          │ │
│  │  - App Plugin (Schema from objectstack.config.ts)      │ │
│  │  - MSW Plugin (API Exposure)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start / 快速开始

### 1. Setup MSW in Your Project / 在项目中设置 MSW

```bash
# Initialize MSW public worker script
pnpm dlx msw init public/ --save

# Install dependencies (if not already installed)
pnpm add @objectstack/runtime @objectstack/objectql @objectstack/driver-memory @objectstack/plugin-msw msw
```

### 2. Define Your ObjectStack Schema / 定义 ObjectStack 模式

Create `objectstack.config.ts`:

```typescript
import { defineStack } from '@objectstack/spec';

export const ContactObject = {
  name: 'contact',
  label: 'Contact',
  fields: {
    name: { type: 'text', required: true, label: 'Name' },
    email: { type: 'email', required: true, label: 'Email' },
    phone: { type: 'text', label: 'Phone' },
    company: { type: 'text', label: 'Company' },
    status: { 
      type: 'select', 
      label: 'Status',
      options: ['active', 'inactive', 'pending'],
      defaultValue: 'active'
    }
  }
};

export default defineStack({
  name: 'MyApp',
  version: '1.0.0',
  objects: [ContactObject],
  manifest: {
    // Optional: Seed data
    data: [
      {
        object: 'contact',
        records: [
          { name: 'John Doe', email: 'john@example.com', phone: '555-0100', company: 'Acme Inc', status: 'active' },
          { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0101', company: 'Tech Corp', status: 'active' }
        ]
      }
    ]
  }
});
```

### 3. Create MSW Browser Setup / 创建 MSW 浏览器设置

Create `src/mocks/browser.ts`:

```typescript
import { ObjectKernel, DriverPlugin, AppPlugin } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { MSWPlugin } from '@objectstack/plugin-msw';
import { http, HttpResponse } from 'msw';
import config from '../../objectstack.config';

let kernel: ObjectKernel | null = null;

export async function startMockServer() {
  if (kernel) return kernel;

  console.log('[MSW] Starting ObjectStack Runtime in Browser...');

  // 1. Initialize In-Memory Database
  const driver = new InMemoryDriver();

  // 2. Create and Configure Kernel
  kernel = new ObjectKernel();
  
  kernel
    .use(new ObjectQLPlugin())                    // Query Engine
    .use(new DriverPlugin(driver, 'memory'))      // Database Driver
    .use(new AppPlugin(config))                   // Load Schema
    .use(new MSWPlugin({                          // API Exposure
      enableBrowser: true,
      baseUrl: '/api/v1',
      logRequests: true,
      customHandlers: [
        // Handle index endpoint for client.connect()
        http.get('/api/v1/index.json', () => {
          return HttpResponse.json({
            version: '1.0',
            objects: config.objects?.map(o => o.name) || [],
            endpoints: {
              data: '/api/v1/data',
              metadata: '/api/v1/metadata'
            }
          });
        })
      ]
    }));

  // 3. Bootstrap Kernel
  await kernel.bootstrap();
  console.log('[MSW] Kernel Ready!');

  // 4. Seed Initial Data
  if (config.manifest?.data) {
    for (const dataSet of config.manifest.data) {
      console.log(`[MSW] Seeding ${dataSet.object}...`);
      if (dataSet.records) {
        for (const record of dataSet.records) {
          await driver.create(dataSet.object, record);
        }
      }
    }
  }

  return kernel;
}

export { kernel };
```

### 4. Initialize in Your App Entry Point / 在应用入口点初始化

Update `src/main.tsx`:

```typescript
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { startMockServer } from './mocks/browser';

async function bootstrap() {
  // Wait for MSW to be ready
  await startMockServer();
  
  // Now render the app
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap().catch(console.error);
```

### 5. Use ObjectStack Client in Components / 在组件中使用 ObjectStack 客户端

```typescript
import { ObjectStackClient } from '@objectstack/client';
import { SchemaRenderer } from '@object-ui/react';
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

function ContactList() {
  // Create client (will use MSW-intercepted endpoints)
  const dataSource = createObjectStackAdapter({
    baseUrl: '' // Relative path, intercepted by MSW
  });

  const schema = {
    type: 'object-view',
    objectName: 'contact',
    columns: ['name', 'email', 'phone', 'company', 'status']
  };

  return <SchemaRenderer schema={schema} dataSource={dataSource} />;
}
```

---

## Component Development Workflow / 组件开发工作流

### Step 1: Define Component Schema / 定义组件模式

```typescript
const formSchema = {
  type: 'object-form',
  objectName: 'contact',
  fields: ['name', 'email', 'phone', 'company', 'status'],
  submitAction: {
    type: 'ajax',
    api: '/api/v1/data/contact',
    method: 'POST'
  }
};
```

### Step 2: Render with Mock Data / 使用模拟数据渲染

```tsx
<SchemaRenderer schema={formSchema} dataSource={dataSource} />
```

### Step 3: Test Interactions / 测试交互

- Fill form fields
- Submit form
- Validate data in browser DevTools (Application → Storage)
- Check MSW logs in Console

### Step 4: Iterate Quickly / 快速迭代

- Modify schema
- Save file
- Hot reload updates component instantly (< 5s)

---

## Storybook Integration / Storybook 集成

### Setup Storybook with MSW / 使用 MSW 设置 Storybook

Install Storybook addon:

```bash
pnpm add -D msw-storybook-addon
```

Configure in `.storybook/preview.ts`:

```typescript
import { initialize, mswLoader } from 'msw-storybook-addon';
import { startMockServer } from '../.storybook/msw-browser';

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass'
});

// Start ObjectStack kernel
startMockServer();

export default {
  parameters: {
    // ...
  },
  loaders: [mswLoader]
};
```

### Create Component Stories / 创建组件故事

```typescript
// src/components/ContactForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SchemaRenderer } from '@object-ui/react';
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

const dataSource = createObjectStackAdapter({ baseUrl: '' });

const meta: Meta<typeof SchemaRenderer> = {
  title: 'Components/ContactForm',
  component: SchemaRenderer,
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    schema: {
      type: 'object-form',
      objectName: 'contact',
      fields: ['name', 'email', 'phone', 'company', 'status']
    },
    dataSource
  }
};

export const WithValidation: Story = {
  args: {
    schema: {
      type: 'object-form',
      objectName: 'contact',
      fields: ['name', 'email', 'phone', 'company', 'status'],
      validation: {
        rules: [
          { field: 'email', rule: 'email', message: 'Invalid email' }
        ]
      }
    },
    dataSource
  }
};
```

---

## Testing All 79 Components / 测试所有79个组件

### Form Components (18) / 表单组件 (18)

```typescript
// Test input component
const inputSchema = {
  type: 'input',
  name: 'username',
  label: 'Username',
  placeholder: 'Enter username',
  required: true
};

// Test select component
const selectSchema = {
  type: 'select',
  name: 'role',
  label: 'Role',
  options: ['admin', 'editor', 'viewer']
};

// Test date-picker component
const dateSchema = {
  type: 'date-picker',
  name: 'birthdate',
  label: 'Birth Date'
};
```

### Layout Components (10) / 布局组件 (10)

```typescript
// Test grid component
const gridSchema = {
  type: 'grid',
  columns: 3,
  gap: 4,
  items: [
    { type: 'card', title: 'Card 1' },
    { type: 'card', title: 'Card 2' },
    { type: 'card', title: 'Card 3' }
  ]
};

// Test tabs component
const tabsSchema = {
  type: 'tabs',
  items: [
    { label: 'Tab 1', content: { type: 'text', value: 'Content 1' } },
    { label: 'Tab 2', content: { type: 'text', value: 'Content 2' } }
  ]
};
```

### Data Display Components (8) / 数据展示组件 (8)

```typescript
// Test table component
const tableSchema = {
  type: 'data-table',
  dataSource: 'contact',
  columns: [
    { field: 'name', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'status', label: 'Status' }
  ]
};
```

### Plugin Testing / 插件测试

```typescript
// Test plugin-form
const formPluginSchema = {
  type: 'object-form',
  objectName: 'contact',
  mode: 'create'
};

// Test plugin-grid
const gridPluginSchema = {
  type: 'object-grid',
  objectName: 'contact',
  pageSize: 10
};

// Test plugin-kanban
const kanbanSchema = {
  type: 'kanban',
  dataSource: 'contact',
  statusField: 'status',
  columns: ['pending', 'active', 'inactive']
};
```

---

## Debugging / 调试

### 1. Check MSW Logs / 检查 MSW 日志

Open browser DevTools Console:

```
[MSW] Starting ObjectStack Runtime in Browser...
[MSW] Kernel Ready!
[MSW] Seeding contact...
[MSW] GET /api/v1/data/contact
[MSW] Response: { items: [...], total: 2 }
```

### 2. Inspect Kernel State / 检查内核状态

```typescript
import { kernel } from './mocks/browser';

// In browser console
console.log(kernel.getRegisteredObjects());
console.log(kernel.driver);
```

### 3. View In-Memory Data / 查看内存数据

Use browser DevTools Application tab:
- Navigate to IndexedDB or Local Storage
- Inspect stored records

### 4. Network Tab / 网络选项卡

Check intercepted requests:
- All `/api/v1/*` requests should show `(from ServiceWorker)`
- Response bodies should contain mock data

---

## Best Practices / 最佳实践

### 1. Seed Realistic Data / 提供真实数据

```typescript
manifest: {
  data: [
    {
      object: 'contact',
      records: Array.from({ length: 100 }, (_, i) => ({
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        company: ['Acme Inc', 'Tech Corp', 'Data Systems'][i % 3],
        status: ['active', 'inactive', 'pending'][i % 3]
      }))
    }
  ]
}
```

### 2. Test Edge Cases / 测试边界情况

```typescript
// Empty state
{ object: 'contact', records: [] }

// Large dataset
{ object: 'contact', records: Array(10000).fill({ name: 'Test' }) }

// Special characters
{ name: "O'Brien <script>alert('xss')</script>" }
```

### 3. Use Environment Variables / 使用环境变量

```typescript
const USE_MSW = import.meta.env.VITE_USE_MSW !== 'false';

if (USE_MSW) {
  await startMockServer();
}
```

### 4. Clean Up on Unmount / 卸载时清理

```typescript
useEffect(() => {
  return () => {
    // Clean up MSW handlers if needed
  };
}, []);
```

---

## Migration to Production / 迁移到生产

### Step 1: Keep Schema / 保留模式

`objectstack.config.ts` remains unchanged!

### Step 2: Deploy ObjectStack Server / 部署 ObjectStack 服务器

```bash
# Use the same config
cp objectstack.config.ts server/
cd server
pnpm start
```

### Step 3: Update Client Configuration / 更新客户端配置

```typescript
const dataSource = createObjectStackAdapter({
  baseUrl: process.env.VITE_API_URL || 'https://api.production.com'
});
```

### Step 4: Remove MSW Initialization / 移除 MSW 初始化

```typescript
// main.tsx
async function bootstrap() {
  // Remove: await startMockServer();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}
```

**No frontend code changes needed!** / **无需前端代码更改！**

---

## Troubleshooting / 故障排除

### Issue: Service Worker Not Registered / 服务工作线程未注册

**Solution:**
```bash
pnpm dlx msw init public/ --save
```

Ensure `mockServiceWorker.js` exists in `public/` directory.

### Issue: Requests Not Intercepted / 请求未被拦截

**Solution:**
Check baseUrl configuration:
```typescript
// Must be relative or match MSW handler
baseUrl: '' // ✅ Correct
baseUrl: '/api/v1' // ✅ Correct
baseUrl: 'http://localhost:3000' // ❌ Wrong (will bypass MSW)
```

### Issue: Schema Not Found / 找不到模式

**Solution:**
Verify AppPlugin is loading config:
```typescript
kernel.use(new AppPlugin(config));
console.log('Objects:', config.objects?.map(o => o.name));
```

### Issue: Data Not Persisting / 数据未持久化

**Solution:**
MSW uses in-memory storage. Data clears on refresh. To persist:
```typescript
// Save to localStorage on changes
localStorage.setItem('contacts', JSON.stringify(contacts));

// Restore on startup
const savedData = localStorage.getItem('contacts');
if (savedData) {
  // Seed from localStorage
}
```

---

## Performance Tips / 性能提示

### 1. Lazy Load Large Plugins / 懒加载大型插件

```typescript
const loadKanban = () => import('@object-ui/plugin-kanban');
```

### 2. Optimize Seed Data / 优化种子数据

```typescript
// Generate data only when needed
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
};
```

### 3. Use Pagination / 使用分页

```typescript
const schema = {
  type: 'data-table',
  objectName: 'contact',
  pagination: {
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  }
};
```

---

## Resources / 资源

### Documentation / 文档
- [MSW Documentation](https://mswjs.io/)
- [ObjectStack Runtime](https://github.com/objectstack-ai/objectstack)
- [ObjectUI Components](https://www.objectui.org)

### Examples / 示例
- [examples/msw-todo](/examples/msw-todo) - Complete MSW setup
- [examples/crm-app](/examples/crm-app) - Production-ready example
- [.storybook/msw-browser.ts](/.storybook/msw-browser.ts) - Storybook integration

### Video Tutorials / 视频教程
- Coming soon! / 即将推出！

---

**Last Updated:** 2026-01-31  
**ObjectUI Version:** 0.4.1+  
**MSW Version:** 2.12.7+  
**ObjectStack Protocol:** 0.7.2
