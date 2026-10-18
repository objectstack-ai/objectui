---
'@object-ui/components': minor
---

The record page header draws the record's picture beside its title, from the field the object names in its object-level `imageField` (`@objectstack/spec` 17.6.0, objectstack#21182) (objectui#11383). The picture is the served row's value of that `image` or `avatar` field: the expanded `{ url }`, a bare file id (drawn from the stable download path), a URL string, or the first drawable entry of a list. An object that declares no `imageField`, an empty value, or a field the reader may not see draws nothing, with no initials or placeholder; `recordChrome: false` keeps the bare header. The declaration is the only channel: no `page:header` prop is read and no field is read by a conventional name such as `logo` or `avatar`.
