---
---

Comment-only in `@object-ui/plugin-designer`: the two comments in `MetadataFieldsPage`'s `toFieldsMap` that called `__proto__` a spec-legal field name (one quoting a 17.2.0 `success = true` reading, the other naming `__proto__` and `constructor` as "the two spec-legal names") now state the 17.5.0 contract. `@objectstack/spec` refuses a `fields` map that carries an own `__proto__` key, at `fields.__proto__`, and refuses `constructor` / `prototype` on the same map by a reserved-name rule. The half that is still true is kept: building the map by assignment would invoke the prototype setter and drop the field, so the spec's refusal could never name it. The `__proto__` verdict now points at the instrument that re-measures it (objectui#9787).

Declared as releasing nothing because the emit was measured rather than assumed: `toFieldsMap` is not exported, so neither it nor its docblock reaches the emitted `MetadataFieldsPage.d.ts`; the bundled `.js` carries no comment text, and the comment-stripped transpile of the file is identical to the base. No published behaviour changes.
