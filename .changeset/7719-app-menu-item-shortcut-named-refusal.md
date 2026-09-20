---
'@object-ui/types': minor
---

`AppAction.items` 上的 `shortcut` 由「静默剥掉」改为「具名拒收」

⚠️ **这是一次已发布 mirror 的收窄**：本次改动**之前**，一份在 app action 的菜单项上写了 `shortcut`
的文档 `safeParse` 是**绿**的（键被 `MenuItemSchema` 无声丢弃，作者拿不到任何提示）；**之后**在该键上**转红**，
issue 指向 `NavigationItem`。TS 面同步收窄：`AppMenuItem.shortcut?: never`，在编写处就被 `tsc` 拒掉。

零迁移面：本仓**零作者**写过这个键，且 `@object-ui/runner` 不发布库入口，没有绕过校验器塞进来的
路径。⛔ 这里刻意不冻结任何总数 —— objectui#6854 当初普查的那个 JSON 总体此后已经变动，冻进散文
的数字没有东西会去重新求值。判据写成可复跑的规则：**结构化**地 `JSON.parse` 每一个 tracked
`*.json`，无限深度遍历，报出「经由字面名为 `items` 的键抵达的数组、其元素对象自带 `shortcut`」者；
在本次改动的头上跑出 0 命中，注入 fixture 的正控制会开火（含一处嵌套命中），且不会把 action 层的 `shortcut`
兄弟键误计。总体数随树变化，规则不变。

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

键盘快捷键若确实需要，它是 `NavigationItem` 那条线的能力，⛔ 不在这条已弃用的 legacy 面上补。

⚠️ 协议侧的现状，实测于**已解析安装**的 `@objectstack/spec@17.4.0`（⛔ 不是读源码推断）：
`action.shortcut` 在 17.0.0 的审计收尾里被移除的是**可编写性**，它的 tombstone 是**保留着的** ——
`ActionSchema.safeParse({ name, type, label, shortcut })` 返回 `success: false`，issue 落在
`shortcut` 上、`code` 为 `invalid_type`，消息开头即
「`action.shortcut` was removed in @objectstack/spec 17.0.0 (audit close-out)」。
正控制：换一个协议从未声明过的兄弟键，同样被拒，但**没有**落在 `shortcut` 上的 issue ——
⇒ 上面那条读数是关于这个键的，不是 strict 对象的通用效果。
⚠️ 两边的**终局形状**一致 —— 键不可编写、拒收具名；但**路径不同**，不要把它们说成一回事：
协议那边是先声明、再移除可编写性、留下 tombstone；本仓这个键在 `AppMenuItem` 上**从未声明过**，
它走的是「静默剥掉」→「具名拒收」，⛔ 没有任何可编写性被移除。
