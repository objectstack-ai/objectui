---
'@object-ui/plugin-detail': patch
---

The README's Activity tab authors `record:activity`'s declared inputs in `properties` (`{ limit: 20, showCompleted: false }`) instead of a host feed in `items` (objectui#11515).

`items` is the host's feed slot, which `@object-ui/types` refuses by name on the node (objectui#11321), so the example taught a key the node's declaration refuses. The note under the example now says where the block's feed comes from: a record host, such as the console's record page, or, in a bare `<DetailView>` like the example, the block's empty state ("No activity recorded"), which is what the tab draws there. No package source changes.
