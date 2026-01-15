# Object UI CLI Demo

这是一个使用 Object UI CLI 创建的演示应用。
This is a demo application created with Object UI CLI.

## 使用方法 / Usage

### 1. 启动开发服务器 / Start Development Server

从仓库根目录运行：
Run from the repository root:

```bash
pnpm objectui serve examples/cli-demo/app.schema.json
```

或者 / Or:

```bash
node packages/cli/dist/cli.js serve examples/cli-demo/app.schema.json
```

### 2. 打开浏览器 / Open Browser

访问 / Visit: http://localhost:3000

### 3. 编辑 Schema / Edit Schema

修改 `app.schema.json` 文件，保存后浏览器会自动刷新。
Edit the `app.schema.json` file and the browser will auto-reload.

## 特性展示 / Features Demonstrated

- ✅ 表单组件 / Form components
- ✅ 卡片布局 / Card layouts
- ✅ 响应式设计 / Responsive design
- ✅ Tailwind CSS 样式 / Tailwind CSS styling
- ✅ 中英文双语 / Bilingual (Chinese & English)
- ✅ 渐变背景 / Gradient backgrounds
- ✅ 图标和 emoji / Icons and emoji

## 学习更多 / Learn More

- [CLI 使用指南 / CLI Guide](../../docs/CLI_GUIDE.md)
- [组件文档 / Component Docs](../../docs/api/components.md)
- [协议规范 / Protocol Spec](../../docs/protocol/overview.md)
