# ObjectUI组件命名规范

**版本**: v1.0  
**最后更新**: 2026年1月23日

---

## 概述

ObjectUI采用三层架构，每层有不同的组件命名约定。本文档明确定义各层组件的命名规则，避免混淆。

---

## 架构回顾

```
┌─────────────────────────────────────────────────────┐
│  Layer 3: ObjectUI Renderers (Schema-Driven)       │
│  - 76 components                                   │
│  - 路径: packages/components/src/renderers/       │
│  - 示例: InputRenderer, DataTableRenderer          │
└─────────────────────────────────────────────────────┘
                        ↓ 使用
┌─────────────────────────────────────────────────────┐
│  Layer 2: Shadcn UI Components (Design System)     │
│  - 60 components                                   │
│  - 路径: packages/components/src/ui/               │
│  - 示例: Input, Button, Table                      │
└─────────────────────────────────────────────────────┘
                        ↓ 基于
┌─────────────────────────────────────────────────────┐
│  Layer 1: Radix UI Primitives (Accessibility)      │
│  - Headless components                             │
│  - 外部依赖: @radix-ui/*                            │
└─────────────────────────────────────────────────────┘
```

---

## 命名规则

### Layer 1: Radix UI Primitives

**命名规则**: 由Radix UI定义，不受ObjectUI控制

**示例**:
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-select`

**使用方式**:
```tsx
import * as Dialog from '@radix-ui/react-dialog';
```

---

### Layer 2: Shadcn UI Components

**命名规则**: 
- ✅ 使用小写kebab-case文件名
- ✅ 导出PascalCase组件名
- ✅ 文件名与组件功能直接对应
- ✅ 保持简洁，单一职责

**文件位置**: `packages/components/src/ui/`

**命名模式**:

| 文件名 | 导出组件 | 说明 |
|--------|----------|------|
| `button.tsx` | `Button` | 基础按钮 |
| `input.tsx` | `Input` | 基础输入框 |
| `table.tsx` | `Table`, `TableHeader`, `TableBody`, ... | 表格原语 |
| `dialog.tsx` | `Dialog`, `DialogContent`, ... | 对话框原语 |
| `select.tsx` | `Select`, `SelectTrigger`, ... | 选择器原语 |

**示例**:
```tsx
// packages/components/src/ui/button.tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
```

**使用方式**:
```tsx
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Table, TableHeader, TableBody } from '@/ui/table';
```

---

### Layer 3: ObjectUI Renderers

**命名规则**:

#### 3.1 基础渲染器（对应Shadcn组件）

**规则**: 
- ✅ 文件名与对应的Shadcn组件相同
- ✅ 通过import路径区分（`renderers/` vs `ui/`）
- ✅ 渲染器名称添加`Renderer`后缀（实现中）

**文件位置**: `packages/components/src/renderers/{category}/`

**示例**:

| Shadcn组件 | ObjectUI渲染器 | 说明 |
|-----------|---------------|------|
| `ui/button.tsx` | `renderers/form/button.tsx` | 按钮渲染器 |
| `ui/input.tsx` | `renderers/form/input.tsx` | 输入框渲染器 |
| `ui/table.tsx` | `renderers/complex/table.tsx` | 简单表格渲染器 |
| `ui/dialog.tsx` | `renderers/overlay/dialog.tsx` | 对话框渲染器 |

**代码示例**:
```tsx
// packages/components/src/renderers/form/button.tsx
import { Button } from '@/ui/button'; // Shadcn组件

export function ButtonRenderer({ schema }: RendererProps<ButtonSchema>) {
  const handleClick = useAction(schema.onClick);
  
  return (
    <Button
      variant={schema.variant}
      onClick={handleClick}
      disabled={schema.disabled}
    >
      {schema.label}
    </Button>
  );
}

// 注册到ComponentRegistry
ComponentRegistry.register('button', ButtonRenderer);
```

**Schema使用**:
```json
{
  "type": "button",
  "label": "提交",
  "variant": "default",
  "onClick": "handleSubmit"
}
```

#### 3.2 高级/组合渲染器

**规则**: 
- ✅ 使用描述性名称，体现功能
- ✅ 添加功能前缀（`data-`, `object-`, `filter-`等）
- ✅ 避免与Shadcn组件重名

**示例**:

| 组件 | 说明 | 基于 |
|------|------|------|
| `data-table.tsx` | 企业级数据表（排序/过滤/分页） | `table` + 业务逻辑 |
| `filter-builder.tsx` | 可视化筛选器构建器 | `select` + `input` + 逻辑 |
| `file-upload.tsx` | 文件上传组件 | `input` + 上传逻辑 |

**命名建议**:

| 前缀 | 用途 | 示例 |
|------|------|------|
| `data-` | 数据驱动的高级组件 | `data-table`, `data-grid` |
| `object-` | Object协议相关 | `object-form`, `object-list`, `object-view` |
| `filter-` | 筛选相关 | `filter-builder`, `filter-panel` |
| 无前缀 | 基础渲染器 | `button`, `input`, `form` |

#### 3.3 基础元素渲染器

**规则**: 
- ✅ 使用HTML元素名
- ✅ 这些组件在Shadcn UI中不存在

**示例**:

| 组件 | 说明 |
|------|------|
| `div.tsx` | 通用容器 |
| `span.tsx` | 内联容器 |
| `text.tsx` | 文本渲染 |
| `image.tsx` | 图片渲染 |
| `html.tsx` | 原生HTML注入 |

---

### Layer 3.5: 插件组件

**命名规则**:
- ✅ 独立npm包，使用`@object-ui/plugin-{name}`格式
- ✅ 组件名称使用功能描述
- ✅ 避免与核心组件重名

**示例**:

| 包名 | 组件 | 说明 |
|------|------|------|
| `@object-ui/plugin-kanban` | `kanban` | 看板组件 |
| `@object-ui/plugin-charts` | `chart`, `bar-chart`, `line-chart` | 图表组件 |
| `@object-ui/plugin-editor` | `rich-text-editor` | 富文本编辑器 |
| `@object-ui/plugin-markdown` | `markdown-editor`, `markdown-viewer` | Markdown编辑器 |

**使用方式**:
```bash
pnpm add @object-ui/plugin-kanban
```

```tsx
import { registerKanbanRenderers } from '@object-ui/plugin-kanban';

registerKanbanRenderers();
```

```json
{
  "type": "kanban",
  "columns": [...],
  "cards": [...]
}
```

---

## 命名冲突处理

### 情况1: Shadcn组件 vs ObjectUI渲染器同名

**问题**: `table` 既存在于`ui/`也存在于`renderers/`

**解决方案**: 通过import路径区分

```tsx
// ✅ 正确：导入Shadcn组件
import { Table } from '@/ui/table';

// ✅ 正确：导入ObjectUI渲染器（通常通过ComponentRegistry）
import { ComponentRegistry } from '@object-ui/core';
const TableRenderer = ComponentRegistry.get('table');

// ✅ 正确：在渲染器中使用Shadcn组件
import { Table } from '@/ui/table'; // Shadcn
export function TableRenderer({ schema }) {
  return <Table>...</Table>; // 使用Shadcn的Table
}
```

### 情况2: 新增高级组件

**规则**: 如果组件提供超出基础UI的功能，使用描述性名称

**示例**:

```tsx
// ❌ 不推荐：与Shadcn的table冲突，功能不明确
renderers/complex/table.tsx  (已存在，用于简单表格)

// ✅ 推荐：功能明确，不冲突
renderers/complex/data-table.tsx  (企业级数据表)

// ✅ 推荐：未来的Object协议组件
renderers/object/object-form.tsx  (从Object定义生成表单)
renderers/object/object-list.tsx  (从Object定义生成列表)
renderers/object/object-detail.tsx  (从Object定义生成详情页)
```

### 情况3: 插件组件命名

**规则**: 使用独特的、功能描述性的名称

```tsx
// ✅ 正确：插件组件有独特名称
@object-ui/plugin-kanban → type: "kanban"
@object-ui/plugin-charts → type: "chart", "bar-chart", "line-chart"

// ❌ 避免：与核心组件重名
@object-ui/plugin-xxx → type: "button"  // 不要与核心button重名
```

---

## Schema中的type命名

### 基本规则

**type值必须与ComponentRegistry中注册的名称完全一致**

```tsx
// 注册
ComponentRegistry.register('button', ButtonRenderer);
ComponentRegistry.register('data-table', DataTableRenderer);

// Schema中使用
{
  "type": "button",      // ✅ 正确
  "type": "data-table"   // ✅ 正确
}
```

### 命名约定

| Schema type | 对应组件 | 说明 |
|------------|----------|------|
| `"button"` | `renderers/form/button.tsx` | 基础按钮 |
| `"input"` | `renderers/form/input.tsx` | 基础输入 |
| `"table"` | `renderers/complex/table.tsx` | 简单表格 |
| `"data-table"` | `renderers/complex/data-table.tsx` | 高级数据表 |
| `"form"` | `renderers/form/form.tsx` | 表单 |
| `"object-form"` | `renderers/object/object-form.tsx` | 对象表单（规划中） |
| `"kanban"` | `@object-ui/plugin-kanban` | 看板（插件） |

---

## 未来命名规划

### Object协议组件（Q2 2026）

| 组件名 | type | 说明 |
|--------|------|------|
| `object-form` | `"object-form"` | 从Object定义自动生成表单 |
| `object-list` | `"object-list"` | 从Object定义自动生成列表 |
| `object-detail` | `"object-detail"` | 从Object定义自动生成详情页 |
| `object-view` | `"object-view"` | 通用Object视图容器 |
| `field-renderer` | `"field-renderer"` | 动态字段渲染器 |
| `relationship-picker` | `"relationship-picker"` | 关系字段选择器 |

### 移动端组件（Q3 2026）

| 组件名 | type | 说明 |
|--------|------|------|
| `mobile-nav` | `"mobile-nav"` | 移动端导航 |
| `mobile-table` | `"mobile-table"` | 移动端表格（卡片模式） |
| `bottom-sheet` | `"bottom-sheet"` | 底部抽屉 |
| `pull-to-refresh` | `"pull-to-refresh"` | 下拉刷新 |

**命名原则**: 添加`mobile-`前缀，与桌面版区分

---

## 检查清单

开发新组件时，请检查：

### Shadcn UI组件（src/ui/）
- [ ] 文件名使用kebab-case
- [ ] 导出PascalCase组件名
- [ ] 只包含UI逻辑，无业务逻辑
- [ ] 基于Radix UI primitives
- [ ] 使用Tailwind CSS和cva

### ObjectUI渲染器（src/renderers/）
- [ ] 确认是否与Shadcn组件同名（如是，通过路径区分）
- [ ] 高级功能使用描述性名称（`data-`, `object-`等前缀）
- [ ] 在ComponentRegistry中正确注册
- [ ] Schema type值与注册名称一致
- [ ] 实现RendererProps接口
- [ ] 包含完整的TypeScript类型

### 插件组件（plugin packages）
- [ ] 使用`@object-ui/plugin-{name}`包名
- [ ] 组件名称独特，不与核心组件冲突
- [ ] 提供注册函数（如`registerKanbanRenderers()`）
- [ ] 独立的npm包

---

## 示例汇总

### 正确的命名示例

```tsx
// ✅ Shadcn UI组件
packages/components/src/ui/button.tsx
export const Button = ...

// ✅ ObjectUI基础渲染器（同名，路径区分）
packages/components/src/renderers/form/button.tsx
import { Button } from '@/ui/button';
export function ButtonRenderer({ schema }) { ... }

// ✅ ObjectUI高级渲染器（描述性名称）
packages/components/src/renderers/complex/data-table.tsx
export function DataTableRenderer({ schema }) { ... }

// ✅ Object协议组件（前缀区分）
packages/components/src/renderers/object/object-form.tsx
export function ObjectFormRenderer({ schema }) { ... }

// ✅ 插件组件（独立包）
packages/plugin-kanban/src/kanban.tsx
export function KanbanRenderer({ schema }) { ... }
```

### 错误的命名示例

```tsx
// ❌ Shadcn组件使用PascalCase文件名
packages/components/src/ui/Button.tsx  // 应该是button.tsx

// ❌ 渲染器与Shadcn组件同名但功能不同，应使用描述性名称
packages/components/src/renderers/complex/table.tsx
// 如果提供高级功能，应命名为data-table.tsx

// ❌ 插件组件名称与核心组件冲突
@object-ui/plugin-xxx → type: "button"  // 不要重复核心组件名

// ❌ type值与注册名称不一致
ComponentRegistry.register('data-table', ...);
{ "type": "dataTable" }  // 应该是"data-table"
```

---

## 常见问题

### Q1: 为什么允许Shadcn和渲染器同名？

A: 这是设计决策。渲染器是对Shadcn组件的Schema驱动包装，同名体现了这种对应关系。通过import路径可以清晰区分：
- `@/ui/button` → Shadcn组件
- `ComponentRegistry.get('button')` → ObjectUI渲染器

### Q2: 什么时候应该使用新名称而不是与Shadcn同名？

A: 当组件提供了超出基础UI的显著功能时。例如：
- `table` → 简单表格
- `data-table` → 企业级表格（排序/过滤/分页/导出等）

### Q3: 插件组件如何命名？

A: 插件组件应该：
1. 使用独特的、功能描述性的名称
2. 不与核心组件重名
3. 使用`@object-ui/plugin-{name}`包名格式

### Q4: Object协议组件为什么使用`object-`前缀？

A: 为了明确表示这些组件是Object协议的实现，与基础渲染器区分。例如：
- `form` → 通用表单渲染器
- `object-form` → 从Object定义自动生成的表单

---

## 相关文档

- [组件架构概览](./OBJECTSTACK_COMPONENT_EVALUATION.md#1-组件架构概览)
- [组件对照表](./COMPONENT_MAPPING_GUIDE.md)
- [开发路线图](./DEVELOPMENT_ROADMAP_2026.md)

---

**维护者**: ObjectUI核心团队  
**反馈**: https://github.com/objectstack-ai/objectui/issues
