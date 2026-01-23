# ObjectUI vs Shadcn: 组件对照表

**快速参考**: 了解ObjectUI渲染器与Shadcn UI组件的关系

---

## 概念区分

### Shadcn UI组件
- 📦 **纯UI组件库**
- 🎨 基于Radix UI + Tailwind CSS
- 💻 需要编写React代码
- 🔧 通过Props控制

### ObjectUI渲染器
- 🔄 **Schema解释器**
- 📋 基于JSON配置驱动
- 🚀 零代码即可使用
- 🔗 自动数据绑定和验证

---

## 一对一映射关系

| Shadcn UI | ObjectUI渲染器 | 增强功能 |
|-----------|---------------|---------|
| `<Input />` | `{ type: "input" }` | ✅ 表达式, ✅ 验证, ✅ 数据绑定 |
| `<Button />` | `{ type: "button" }` | ✅ 动作映射, ✅ 加载状态 |
| `<Select />` | `{ type: "select" }` | ✅ 动态选项, ✅ 远程搜索 |
| `<Dialog />` | `{ type: "dialog" }` | ✅ 条件显示, ✅ 表单集成 |
| `<Table />` | `{ type: "table" }` | ✅ 基础表格渲染 |
| `<Card />` | `{ type: "card" }` | ✅ 动态内容, ✅ 操作按钮 |
| `<Form />` | `{ type: "form" }` | ✅ 验证引擎, ✅ 提交处理 |
| `<Tabs />` | `{ type: "tabs" }` | ✅ 动态标签, ✅ 懒加载 |
| `<Badge />` | `{ type: "badge" }` | ✅ 状态映射, ✅ 颜色规则 |
| `<Alert />` | `{ type: "alert" }` | ✅ 条件显示, ✅ 自动关闭 |

---

## ObjectUI独有组件

这些组件没有直接对应的Shadcn组件，是ObjectUI的高级业务组件：

| 组件 | 类型 | 用途 |
|------|------|------|
| **data-table** | 复杂组件 | 带排序/过滤/分页的高级表格 |
| **timeline** | 复杂组件 | 时间线/甘特图 |
| **filter-builder** | 复杂组件 | 可视化查询构建器 |
| **chatbot** | 复杂组件 | 对话机器人界面 |
| **tree-view** | 数据展示 | 树形结构 |
| **statistic** | 数据展示 | 统计数值卡片 |

---

## 使用场景对比

### 场景1: 简单表单

#### Shadcn方式 (React代码)
```tsx
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input 
        type="password"
        value={password} 
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

#### ObjectUI方式 (JSON Schema)
```json
{
  "type": "form",
  "api": "/api/login",
  "fields": [
    {
      "name": "email",
      "type": "input",
      "inputType": "email",
      "placeholder": "Email",
      "required": true
    },
    {
      "name": "password",
      "type": "input",
      "inputType": "password",
      "placeholder": "Password",
      "required": true
    }
  ],
  "actions": [
    {
      "type": "button",
      "label": "Login",
      "actionType": "submit"
    }
  ]
}
```

### 场景2: 数据表格

#### Shadcn方式
```tsx
import { Table } from '@/ui/table';

function UserTable() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name');
  
  useEffect(() => {
    fetchUsers(page, sort).then(setUsers);
  }, [page, sort]);
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => setSort('name')}>Name</TableHead>
            <TableHead onClick={() => setSort('email')}>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} onChange={setPage} />
    </div>
  );
}
```

#### ObjectUI方式
```json
{
  "type": "data-table",
  "api": "/api/users",
  "columns": [
    {
      "name": "name",
      "label": "Name",
      "sortable": true
    },
    {
      "name": "email",
      "label": "Email",
      "sortable": true
    }
  ],
  "pagination": {
    "pageSize": 20
  }
}
```

---

## 选择指南

### 使用Shadcn UI（直接使用原生组件）
✅ 需要高度定制化的交互逻辑  
✅ 组件行为复杂，难以用Schema表达  
✅ 性能极致优化（避免Schema解析开销）  
✅ 已有大量React组件代码  

### 使用ObjectUI渲染器（推荐）
✅ 快速构建数据管理界面  
✅ 配置驱动，易于维护  
✅ 需要动态UI（从服务端获取配置）  
✅ 低代码/无代码平台  
✅ 需要AI生成UI  

---

## 混合使用

ObjectUI支持在Schema中嵌入自定义React组件：

```json
{
  "type": "page",
  "body": [
    {
      "type": "card",
      "title": "用户统计",
      "body": {
        "type": "custom",
        "component": "CustomChart",
        "props": {
          "data": "${chartData}"
        }
      }
    },
    {
      "type": "data-table",
      "api": "/api/users"
    }
  ]
}
```

```tsx
// 注册自定义组件
import { registerRenderer } from '@object-ui/react';
import CustomChart from './CustomChart';

registerRenderer('custom', ({ schema }) => {
  const Component = schema.component; // "CustomChart"
  return <CustomChart {...schema.props} />;
});
```

---

## 常见问题

### Q: ObjectUI渲染器性能如何？
A: 相比直接使用Shadcn有轻微开销（<10%），但通过虚拟化和缓存优化，在实际应用中差异不明显。

### Q: 可以覆盖ObjectUI渲染器的样式吗？
A: 可以！通过`className`属性传入Tailwind类名即可覆盖。

### Q: 如何扩展ObjectUI不支持的组件？
A: 使用`registerRenderer`注册自定义渲染器，或使用`type: "custom"`嵌入React组件。

### Q: ObjectUI渲染器支持TypeScript吗？
A: 完全支持！所有Schema都有完整的TypeScript类型定义。

---

## 更多资源

- 📚 [组件API文档](./components/)
- 🎨 [Storybook示例](https://storybook.objectui.org)
- 🔧 [自定义渲染器指南](./guide/custom-renderers.md)
- 💡 [最佳实践](./community/best-practices.md)

---

*最后更新: 2026-01-23*
