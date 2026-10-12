---
---

No release: tests only. `@object-ui/cli`'s namespaced refused-at-type ratchet no longer counts `field:` keys. A `field:` key is a record-form field widget, selected through a field's `widget` and never authored at a node's `type`, so counting it made every new field widget raise a pin that only falls. The population now leaves out the `field:` namespace, read from the key, and the pin drops by the `field:` keys on `main`. A probe pin holds that a new `field:` widget leaves the count alone, and a control holds that any other namespaced registration without an arm still turns it red. No executable code changed (objectui#12176).
