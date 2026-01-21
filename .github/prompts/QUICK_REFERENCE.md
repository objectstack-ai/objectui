# ObjectUI AI 开发提示词快速参考 / Quick Reference

[English](#english) | [中文](#中文)

---

## 中文

### 概述

这个目录包含了 ObjectUI 各个核心组件的 AI 开发和优化提示词。这些提示词可以用于指导 AI 助手（如 GitHub Copilot、ChatGPT、Claude 等）在开发 ObjectUI 组件时遵循正确的模式和最佳实践。

### 文件组织

```
.github/prompts/
├── README.md                           # 主文档（英文）
├── QUICK_REFERENCE.md                  # 本文件（中英双语）
├── core-packages/                      # 核心包提示词
│   ├── types-package.md               # 类型定义包
│   ├── core-package.md                # 核心引擎包
│   ├── react-package.md               # React 绑定包
│   └── components-package.md          # UI 组件包
├── components/                         # 组件类别提示词
│   ├── basic-components.md            # 基础组件
│   ├── layout-components.md           # 布局组件
│   ├── form-components.md             # 表单组件
│   ├── data-display-components.md     # 数据展示组件
│   ├── feedback-components.md         # 反馈组件
│   ├── overlay-components.md          # 浮层组件
│   ├── navigation-components.md       # 导航组件
│   └── disclosure-complex-components.md # 折叠与复杂组件
├── plugins/                            # 插件开发
│   └── plugin-development.md          # 插件开发指南
└── tools/                              # 开发工具
    └── designer-cli-runner.md         # 设计器、CLI 和运行器
```

### 使用方法

#### 1. 开发新组件时

选择对应类别的提示词文件，例如：

- 开发按钮组件 → `components/form-components.md`
- 开发网格布局 → `components/layout-components.md`
- 开发对话框 → `components/overlay-components.md`

#### 2. 使用 AI 助手

将提示词内容复制给 AI 助手：

```
我需要开发一个新的表单组件。请参考这个开发指南：
[粘贴 form-components.md 的内容]

现在帮我创建一个日期选择器组件...
```

#### 3. 使用 GitHub Copilot Chat

```
使用 .github/prompts/components/form-components.md 中的指南帮我添加一个新的日期选择器组件
```

### 核心原则

所有 ObjectUI 组件开发都应遵循以下原则：

1. **JSON Schema 优先**: 所有组件必须完全可通过 JSON 配置
2. **零运行时开销**: 只使用 Tailwind CSS，禁止内联样式
3. **无状态组件**: 组件由 schema props 控制
4. **关注点分离**: types → core → react → components
5. **TypeScript 严格模式**: 所有代码必须通过 `tsc --strict`
6. **可访问性优先**: WCAG 2.1 AA 标准
7. **测试要求**: 逻辑单元测试 + 渲染器集成测试

### 快速链接

**核心包开发:**
- [类型定义 (types)](core-packages/types-package.md) - 纯 TypeScript 接口
- [核心逻辑 (core)](core-packages/core-package.md) - Schema 验证和引擎
- [React 绑定 (react)](core-packages/react-package.md) - Hooks 和 Context
- [UI 组件 (components)](core-packages/components-package.md) - Shadcn 实现

**组件类别:**
- [基础组件](components/basic-components.md) - text, image, icon, div
- [布局组件](components/layout-components.md) - grid, flex, container, card
- [表单组件](components/form-components.md) - input, select, checkbox, button
- [数据展示](components/data-display-components.md) - list, table, badge, avatar
- [反馈组件](components/feedback-components.md) - loading, progress, skeleton
- [浮层组件](components/overlay-components.md) - dialog, popover, tooltip
- [导航组件](components/navigation-components.md) - tabs, breadcrumb, menu
- [复杂组件](components/disclosure-complex-components.md) - accordion, crud, calendar

**扩展开发:**
- [插件开发](plugins/plugin-development.md) - 创建自定义插件
- [工具开发](tools/designer-cli-runner.md) - Designer、CLI、Runner

### 统计信息

- **总文件数**: 15 个 Markdown 文件
- **总行数**: ~6,500 行
- **覆盖组件**: 60+ 组件类型
- **包含示例**: 200+ 代码示例

---

## English

### Overview

This directory contains AI development and optimization prompts for each core component of ObjectUI. These prompts guide AI assistants (like GitHub Copilot, ChatGPT, Claude, etc.) to follow correct patterns and best practices when developing ObjectUI components.

### File Organization

See the Chinese section above for the directory structure.

### How to Use

#### 1. When Developing a New Component

Choose the corresponding prompt file, for example:

- Developing a button → `components/form-components.md`
- Developing a grid layout → `components/layout-components.md`
- Developing a dialog → `components/overlay-components.md`

#### 2. With AI Assistants

Copy the prompt content to your AI assistant:

```
I need to develop a new form component. Please refer to this development guide:
[Paste content from form-components.md]

Now help me create a date picker component...
```

#### 3. With GitHub Copilot Chat

```
Use the guide from .github/prompts/components/form-components.md to help me add a new date picker component
```

### Core Principles

All ObjectUI component development should follow these principles:

1. **JSON Schema First**: All components must be fully configurable via JSON
2. **Zero Runtime Overhead**: Only Tailwind CSS, no inline styles
3. **Stateless Components**: Controlled by schema props
4. **Separation of Concerns**: types → core → react → components
5. **TypeScript Strict Mode**: All code must pass `tsc --strict`
6. **Accessibility First**: WCAG 2.1 AA minimum
7. **Testing Required**: Unit tests for logic + integration tests for renderers

### Quick Links

**Core Packages:**
- [Types (types)](core-packages/types-package.md) - Pure TypeScript interfaces
- [Core Logic (core)](core-packages/core-package.md) - Schema validation & engine
- [React Bindings (react)](core-packages/react-package.md) - Hooks & Context
- [UI Components (components)](core-packages/components-package.md) - Shadcn implementation

**Component Categories:**
- [Basic Components](components/basic-components.md) - text, image, icon, div
- [Layout Components](components/layout-components.md) - grid, flex, container, card
- [Form Components](components/form-components.md) - input, select, checkbox, button
- [Data Display](components/data-display-components.md) - list, table, badge, avatar
- [Feedback Components](components/feedback-components.md) - loading, progress, skeleton
- [Overlay Components](components/overlay-components.md) - dialog, popover, tooltip
- [Navigation Components](components/navigation-components.md) - tabs, breadcrumb, menu
- [Complex Components](components/disclosure-complex-components.md) - accordion, crud, calendar

**Extensions:**
- [Plugin Development](plugins/plugin-development.md) - Creating custom plugins
- [Tools Development](tools/designer-cli-runner.md) - Designer, CLI, Runner

### Statistics

- **Total Files**: 15 Markdown files
- **Total Lines**: ~6,500 lines
- **Component Coverage**: 60+ component types
- **Code Examples**: 200+ examples

### Usage Examples

#### Example 1: Creating a New Form Component

```bash
# 1. Read the form components guide
cat .github/prompts/components/form-components.md

# 2. Ask AI to help
"Using the patterns in form-components.md, create a DatePicker component
that supports:
- Single date selection
- Date range selection
- Min/max date validation
- Custom date format"
```

#### Example 2: Developing a Plugin

```bash
# 1. Read the plugin development guide
cat .github/prompts/plugins/plugin-development.md

# 2. Create plugin structure
"Following the plugin-development.md guide, scaffold a new maps plugin
that integrates Google Maps with ObjectUI schemas"
```

#### Example 3: Optimizing Existing Component

```bash
# 1. Identify component category
# 2. Read relevant guide
cat .github/prompts/components/overlay-components.md

# 3. Ask for optimization
"Review my Dialog component against the overlay-components.md guide
and suggest improvements for accessibility and performance"
```

---

## Contributing

To add or update prompts:

1. Follow the existing structure and format
2. Include concrete, working examples
3. Specify constraints clearly
4. Link to relevant documentation
5. Test the prompt with an AI agent before committing

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-21  
**Maintainer**: ObjectUI Team
