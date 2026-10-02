---
'@object-ui/app-shell': patch
---

`MetadataService` changes in comments only: its notes on the object payload now say that `ObjectDefinition.relationships` is retired from the UI model as well as kept off the wire (objectui#11434). The payload `saveObject` writes is unchanged.
