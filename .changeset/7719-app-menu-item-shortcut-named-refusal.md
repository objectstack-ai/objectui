---
'@object-ui/types': minor
---

`AppAction.items` 上的 `shortcut` 由「静默剥掉」改为「具名拒收」

⚠️ **这是一次已发布 mirror 的收窄**：今天一份在 app action 的菜单项上写了 `shortcut` 的文档
`safeParse` 是**绿**的（键被 `MenuItemSchema` 无声丢弃，作者拿不到任何提示），此后在该键上**转红**，
issue 指向 `NavigationItem`。TS 面同步收窄：`AppMenuItem.shortcut?: never`，在编写处就被 `tsc` 拒掉。

零迁移面：objectui#6854 的普查（两把各自带活正控制的仪器，594 个 JSON + 全部 TS/TSX）在本仓测得
**零作者**写过这个键，且 `@object-ui/runner` 不发布库入口，没有绕过校验器塞进来的路径。

裁决：director seat decision batch #70（objectui#7719，2026-09-07，维护者「同意」）。
⛔ 选项 B（给已弃用的 `AppMenuItem` 长一个真正的 `shortcut` 成员并渲染它）与选项 C（把
`AppAction.items` 改成 overlay 的 `MenuItem`）**均被拒绝**。唯一的改动是**诊断**：

- TS 面 —— `AppMenuItem.shortcut?: never`；
- zod 面 —— `MenuItemSchema.shortcut` 走 `retirementTombstone()`，一条 guidance 同时喂 parse
  消息与 `.describe()`（即已发布的 JSON-Schema 描述）。

⛔ `LayoutRenderer` 未恢复任何读点，objectui#6854 的那枚 pin 断言原样保留；本次只修了它与
`LayoutRenderer.tsx` 里已经过期的散文（两处都在把一个已裁决的问题描述成悬而未决）。
`@object-ui/runner` 的改动**仅为注释**，无任何已发布行为变化。

⚠️ 受影响的**不是** `AppAction.shortcut`：那是 header 按钮自己的快捷键，一直声明着、本次不动，
并由控制断言钉住——只有它下面一层的 `items[]` 被收窄。

键盘快捷键若确实需要，它是 `NavigationItem` 那条线的能力（`@objectstack/spec` 在 17.0.0 的审计
收尾里已把 `action.shortcut` 连同 tombstone 一起移除），⛔ 不在这条已弃用的 legacy 面上补。
