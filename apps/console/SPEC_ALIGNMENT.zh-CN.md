# ObjectStack 规范对齐

本文档详细说明了 ObjectUI Console 如何与 ObjectStack Specification v0.8.2 对齐。

## 概述

ObjectStack Spec 定义了构建数据驱动应用程序的通用协议。ObjectUI Console 实现此规范，以提供一个标准的、动态的 UI，可以渲染任何符合 ObjectStack 的应用程序。

## 规范覆盖范围

### 1. AppSchema（UI 层）

`AppSchema` 定义了 ObjectStack 中应用程序的结构和行为。

| 功能 | 规范字段 | 实现状态 | 位置 |
|------|---------|---------|------|
| **基本元数据** |
| 应用名称 | `name` | ✅ 已实现 | `App.tsx`, `AppSidebar.tsx` |
| 应用标签 | `label` | ✅ 已实现 | `AppSidebar.tsx` |
| 应用图标 | `icon` | ✅ 已实现 | `AppSidebar.tsx`（Lucide 图标）|
| 应用版本 | `version` | ✅ 已实现 | 插件元数据 |
| 应用描述 | `description` | ✅ 已实现 | `AppSidebar.tsx`（下拉菜单显示）|
| **导航** |
| 主页 | `homePageId` | ✅ 已实现 | `App.tsx` - 应用加载时导航 |
| 导航树 | `navigation[]` | ✅ 已实现 | `AppSidebar.tsx` |
| **品牌** |
| 主色调 | `branding.primaryColor` | ✅ 已实现 | `AppSidebar.tsx`（内联样式）|
| Logo | `branding.logo` | ✅ 已实现 | `AppSidebar.tsx`（图片渲染）|
| Favicon | `branding.favicon` | ⚠️ 部分实现 | 尚未应用到文档头部 |
| **安全** |
| 必需权限 | `requiredPermissions[]` | ⚠️ 部分实现 | 已解析但未强制执行（无认证系统）|
| 活跃标志 | `active` | 🔄 计划中 | 过滤非活跃应用 |
| 默认应用 | `isDefault` | 🔄 计划中 | 首次加载时自动选择 |

### 2. NavigationItem（导航层）

规范支持多种导航项类型，实现灵活的菜单结构。

| 类型 | 规范字段 | 实现状态 | 位置 |
|------|---------|---------|------|
| **对象导航** | | |
| 类型 | `type: "object"` | ✅ 已实现 | `AppSidebar.tsx` |
| 对象名称 | `objectName` | ✅ 已实现 | 路由到 `/{objectName}` |
| 视图名称 | `viewName` | 🔄 计划中 | 尚不支持自定义视图 |
| **仪表板导航** | | |
| 类型 | `type: "dashboard"` | ✅ 已实现 | `AppSidebar.tsx` |
| 仪表板名称 | `dashboardName` | ✅ 已实现 | 路由到 `/dashboard/{name}` |
| **页面导航** | | |
| 类型 | `type: "page"` | ✅ 已实现 | `AppSidebar.tsx` |
| 页面名称 | `pageName` | ✅ 已实现 | 路由到 `/page/{name}` |
| 参数 | `params` | 🔄 计划中 | URL 参数尚未传递 |
| **URL 导航** | | |
| 类型 | `type: "url"` | ✅ 已实现 | `AppSidebar.tsx` |
| URL | `url` | ✅ 已实现 | 打开外部链接 |
| 目标 | `target`（_self/_blank）| ✅ 已实现 | 遵循 target 属性 |
| **分组导航** | | |
| 类型 | `type: "group"` | ✅ 已实现 | `AppSidebar.tsx` |
| 子项 | `children[]` | ✅ 已实现 | 递归渲染 |
| 展开状态 | `expanded` | 🔄 计划中 | 可折叠分组 |
| **通用字段** | | |
| ID | `id` | ✅ 已实现 | 用作 React key |
| 标签 | `label` | ✅ 已实现 | 显示文本 |
| 图标 | `icon` | ✅ 已实现 | Lucide 图标映射 |
| 可见性 | `visible` | ✅ 已实现 | 基本字符串/布尔检查 |

### 3. ObjectSchema（数据层）

对象定义数据模型和 CRUD 操作。

| 功能 | 规范字段 | 实现状态 | 位置 |
|------|---------|---------|------|
| **对象定义** |
| 对象名称 | `name` | ✅ 已实现 | `ObjectView.tsx`, `dataSource.ts` |
| 对象标签 | `label` | ✅ 已实现 | 页面标题、面包屑 |
| 对象图标 | `icon` | ✅ 已实现 | 导航项 |
| 标题格式 | `titleFormat` | 🔄 计划中 | 记录标题渲染 |
| **字段** |
| 字段类型 | 所有标准类型 | ✅ 已实现 | `@object-ui/fields` 包 |
| 字段标签 | `label` | ✅ 已实现 | 表单和网格标题 |
| 必填字段 | `required` | ✅ 已实现 | 表单验证 |
| 默认值 | `defaultValue` | ✅ 已实现 | 表单初始化 |
| **CRUD 操作** |
| 创建 | API 集成 | ✅ 已实现 | `ObjectForm.tsx` |
| 读取 | API 集成 | ✅ 已实现 | `ObjectGrid.tsx` |
| 更新 | API 集成 | ✅ 已实现 | `ObjectForm.tsx` |
| 删除 | API 集成 | ✅ 已实现 | `ObjectGrid.tsx` |
| **高级功能** |
| 权限 | `permissions` | 🔄 计划中 | 字段级权限 |
| 触发器 | `triggers` | 🔄 计划中 | 前/后钩子 |
| 验证规则 | `validationRules` | 🔄 计划中 | 高级验证 |

### 4. Manifest（数据填充）

应用的初始数据填充。

| 功能 | 规范字段 | 实现状态 | 位置 |
|------|---------|---------|------|
| Manifest ID | `manifest.id` | ✅ 已实现 | `objectstack.config.ts` |
| 数据种子 | `manifest.data[]` | ✅ 已实现 | 通过 MSW 插件加载 |
| Upsert 模式 | `mode: "upsert"` | ✅ 已实现 | MSW 数据处理器 |
| Insert 模式 | `mode: "insert"` | ✅ 已实现 | MSW 数据处理器 |

## 实现架构

```
┌─────────────────────────────────────────────────────────┐
│                  ObjectStack Console                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   App.tsx    │  │ AppSidebar   │  │  AppHeader   │  │
│  │              │  │              │  │              │  │
│  │ - 应用切换   │  │ - 导航树     │  │ - 面包屑     │  │
│  │ - 路由       │  │ - 品牌       │  │ - 操作       │  │
│  │ - homePageId │  │ - 图标       │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              ObjectView.tsx                       │  │
│  │                                                   │  │
│  │  - Object Grid（列表视图）                       │  │
│  │  - Object Form（创建/编辑对话框）                │  │
│  │  - CRUD 操作                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
                          │ 实现
                          │
┌─────────────────────────────────────────────────────────┐
│              ObjectStack Spec v0.8.2                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  • AppSchema          • ObjectSchema                    │
│  • NavigationItem     • FieldSchema                     │
│  • AppBranding        • Manifest                        │
│  • 权限系统           • 触发器系统                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 未来增强

### 短期（下一个版本）

1. **Favicon 支持** - 将 `branding.favicon` 应用到文档头部
2. **默认应用选择** - 自动选择 `isDefault: true` 的应用
3. **活跃应用过滤** - 隐藏 `active: false` 的应用
4. **可折叠分组** - 支持导航分组的 `expanded` 标志
5. **视图选择** - 支持对象导航项的 `viewName`

### 中期（2026 年 Q2）

1. **权限强制执行** - 与认证系统集成
2. **自定义页面** - 支持带自定义组件的 `page` 导航类型
3. **仪表板路由** - 实现仪表板视图渲染
4. **URL 参数** - 将参数传递给页面导航项
5. **高级可见性** - 评估 `visible` 字段的表达式字符串

### 长期（2026 年 Q3-Q4）

1. **触发器支持** - 在 CRUD 操作时执行对象触发器
2. **字段级权限** - 基于用户权限显示/隐藏/只读
3. **高级验证** - 实现验证规则引擎
4. **自定义视图** - 支持每个对象的多个视图
5. **主题自定义** - 从品牌配置完全支持主题

## 测试策略

### 单元测试

- ✅ 导航渲染（`AppSidebar.test.tsx`）
- ✅ 对象 CRUD 操作（`ObjectForm.test.tsx`、`ObjectGrid.test.tsx`）
- ✅ 规范合规性测试（`SpecCompliance.test.tsx` - 20 个测试）

### 集成测试

- ✅ MSW 服务器模拟（`MSWServer.test.tsx`）
- ✅ 服务器定义（`ServerDefinitions.test.tsx`）
- 🔄 多应用导航（计划中）
- 🔄 权限强制执行（计划中）

### E2E 测试

- 🔄 完整应用工作流（计划中）
- 🔄 跨应用导航（计划中）
- 🔄 端到端 CRUD 操作（计划中）

## 版本兼容性

| ObjectStack Spec 版本 | Console 版本 | 支持状态 |
|----------------------|-------------|---------|
| 0.8.x | 0.1.0 | ✅ 当前 |
| 0.7.x | 0.1.0 | ✅ 兼容 |
| 0.6.x 及以下 | - | ❌ 不支持 |

## 参考资料

- [ObjectStack Spec 仓库](https://github.com/objectstack-ai/objectstack)
- [ObjectUI 文档](https://www.objectui.org)
- [Console 源代码](https://github.com/objectstack-ai/objectui/tree/main/apps/console)

## 贡献

要改进规范对齐：

1. 查看本文档中未实现的功能（🔄 或 ⚠️）
2. 参考 ObjectStack Spec 了解预期行为
3. 实现功能并编写测试
4. 更新本文档以反映更改
5. 提交拉取请求

---

**最后更新**：2026-02-02  
**规范版本**：0.8.2  
**Console 版本**：0.1.0
