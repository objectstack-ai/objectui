---
'@object-ui/app-shell': minor
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

**The AI build conversation stays on the conversation and reads more compactly** (objectui#12724).

- **No automatic navigation after a build.** When a build finishes, the page no longer moves you into Studio. The finished build card offers two buttons: 打开应用 / Open app (primary), which opens the app on its first navigation item, and 在 Studio 中查看 / View in Studio. Both are in-app navigations. The conversation is still bound to the built app, so Studio's copilot resumes the same thread.
- **One collapsed line per phase.** A turn's tool activity reads as one line, for example "设计方案 · 4 步 · 0:48 · 读取编写规范 · 列出对象 ×3 …". Repeated calls of a tool fold into one step with a count, and a chevron expands the per-tool rows. The rows open on their own while a step is running. The elapsed time shows only for a turn this page watched; a reopened conversation shows no time.
- **The finished build card.** Its header reads 「已搭建并上线 · APP」 / "Built and live · APP" once the build is published, and "Built APP" otherwise. Below the buttons, a line lists the build's next steps as things you can say, followed by the sentence 「之后的修改先存草稿，由你在 Studio 发布」. The progress bar is gone once the build is done. A whole-app build no longer repeats its next steps as a list on the draft card.
- **The plan card.** The header names the app the plan builds and shows 等待确认 / Awaiting confirmation until you decide. Each object gets a row with one chip per field from the plan's `blueprint.objects[].fields`. The plan's views get their own rows, and the reply hint sits beside 开始搭建 / 调整方案. A plan without field rows (for example one restored from the local cache) shows the object chips with field counts, as before.
- **The composer.** Outside an app, the build agent's placeholder reads 「描述你想搭建的应用，或要改的地方…」 / "Describe the app you want to build, or what to change…" and no longer names the agent. Inside an app it still reads "Ask about your data, or ask me to change this app…". The key hint reads 「↵ 发送 · Shift+↵ 换行」.

`@object-ui/plugin-chatbot`: `ProposedPlan` gains optional `appLabel`, `views` and `objects[].fields`, and `ChatbotLabels` gains an optional `newlineHint`. `@object-ui/i18n`: new `console.ai.describeAppToBuild`, `console.ai.newlineHint`, `console.ai.viewBuiltAppInStudio`, `chatbot.phase.*`, `chatbot.plan.awaitingConfirm` / `objectsAndFields` / `views` and `chatbot.build.builtAndLive` / `nextStepsLead` / `nextStepQuote` / `draftPosture` in every pack. `console.ai.designBuiltApp` is retired.
