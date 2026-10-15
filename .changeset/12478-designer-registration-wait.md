---
---

Test-only (objectui#12478): `entryRegistersBuiltinDesigners-11939` loads the module the entry dynamically imports at its own module scope, so the wait for the entry's registration covers only the `.then`, not ~32 module loads. No published file changes.
