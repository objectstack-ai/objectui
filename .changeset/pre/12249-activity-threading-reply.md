---
---

No package released: one test, no behaviour change. `@object-ui/app-shell` gains a pin that an authored record page whose only feed block is a `record:activity` declaring `enableThreading: true` (no `record:discussion` anywhere on the page) shows a stored reply under its parent, and offers the reply input on every comment under a create grant on `sys_comment` (objectui#12249). Both already hold on this tree: objectui#12144's change landed them, and its pins measure the synthesized default page's `record:discussion` only. This pin is the first to read the `record:activity` renderer's own `enableThreading` and the host `onAddReply` it forwards, through the real record page.
