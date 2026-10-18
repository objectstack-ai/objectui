---
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

**The AI build cards draw the plan and result details the build agent now sends** (objectui#12724).

- **The plan card.** Each object's fields are chips. A field whose sample data is held to a format shows it in mono type (「ISBN 13 位数字」, 「邮箱 邮箱格式」). A field the agent added on its own (you did not name it) has a dashed chip marked 「补充」 / "suggested". An object that declares its name field gets a 「名称：书名」 / "Name: Title" line. Each view shows one line saying what it does, for example 「列表 · 筛选 状态 = 逾期 且 归还日期 为空 · 按应还日期升序」. The assumptions are a bulleted list, and the count line ends with the sample data the build will stage (「示例数据 12 条/对象」).
- **The result card.** A finished build shows a 「核对通过 7/7」 / "Checks passed 7/7" chip and the lines the agent verified on the built app, objects in one column and views and sample data in the other. Those lines replace the list of staged artifacts. When the agent re-checks the build later in the same turn, the card shows that newer check. 打开应用 opens the app the build landed in, and 在 Studio 中查看 opens its package.
- **Step names.** The steps in the progress line read as short sentences in your language, for example 「记下后续检查项」 for the agent's to-do step and "List the existing objects" in English. Before, the English names were the tool names with their underscores removed.

Each of these reads a field of the build agent's plan or result. When an older agent does not send that field, the card looks as it did before.

`@object-ui/plugin-chatbot`: `ProposedPlan` gains optional `planCard` and `viewIntents`. `@object-ui/i18n`: new `chatbot.plan.suggestedField`, `chatbot.plan.nameField` and `chatbot.build.checksPassed` in every pack, and every pack's `chatbot.tool.*` values are reworded.
