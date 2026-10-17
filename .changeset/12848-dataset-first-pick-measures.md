---
'@object-ui/app-shell': patch
---

Dataset designer: picking a new dataset's base object no longer drops the template's `count` measure, so a dataset created by opening it, picking an object and saving keeps its row count. Moving a dataset to another object still clears its joins, dimensions, filter and every measure that names a field; a measure that names no field (a plain row count) is kept, because it means the same on the new object. The hint under the base-object picker now says so: field measures are cleared and a row count is kept.
