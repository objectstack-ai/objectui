---
'@object-ui/plugin-chatbot': patch
---

fix(plugin-chatbot): a reloaded multi-step build no longer shows an empty 「执行过程」 block under every step (objectui#10899)

The conversation store persists each step of an agent turn as its own assistant
row whose only text is a `(called …)` placeholder, so a reloaded build (the
in-app dock, the Studio copilot) hydrates into one message per step. Each one
rendered its tool row, then the italic 执行过程 note, then the message action
bar — invisible until hover but full height — so every step read as an empty
block with a large gap.

- The 执行过程 note is now only the fallback for a placeholder turn that shows
  nothing else. A turn whose tool row, build panel or design panel is on screen
  does not repeat it.
- The copy / regenerate bar renders only for a turn with visible prose. A
  prose-less step has nothing to copy, and Copy used to copy the internal
  placeholder.
