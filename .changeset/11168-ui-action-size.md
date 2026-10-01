---
'@object-ui/types': minor
---

`UIActionSchema.size` takes the `action:button` row's vocabulary by reference (objectui#11168 slice 3). Before this, the type was `'sm' | 'md' | 'lg'`. That made `size: 'default'` and `size: 'icon'` a TypeScript error, although `@objectstack/spec` 17.5.0's `action:button` row accepts both, the `action:button` registration publishes them, and the Button primitive draws them.

The type is also the member type of the `action:group`, `action:menu` and `action:bar` lists. Measured through the real `SchemaRenderer`, a group member draws each of the five sizes exactly as an `action:button` does, and a member's own `md` renders as `default`. A size outside the five is still refused.
