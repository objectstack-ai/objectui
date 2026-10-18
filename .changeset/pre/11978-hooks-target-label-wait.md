---
---

No release: a test change only. `@object-ui/app-shell`'s `ObjectHooksPanel.newHookTarget-11820` test now waits for the object roster's labels before it reads them. The panel's read of this package's objects and the hook editor's own roster read answer at their own pace, and until the roster answers the selected object is drawn by its bare name (objectui#10585). The test used to read the labels synchronously once the "This package" group appeared, so whether it passed depended on which read answered first (objectui#11978).
