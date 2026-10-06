---
'@object-ui/core': patch
---

The action key inventory lists `requiresMembershipReach`, the key `@objectstack/spec` 17.7.0 adds to `ActionSchema` (objectui#11717), so an action carrying it is no longer reported as having an unknown key. The spec's parse lowers it into `visible`; the action runner does not read it.
