---
"@object-ui/app-shell": minor
"@object-ui/auth": minor
"@object-ui/cli": minor
"@object-ui/components": minor
"@object-ui/core": minor
"@object-ui/data-objectstack": minor
"@object-ui/fields": minor
"@object-ui/layout": minor
"@object-ui/permissions": minor
"@object-ui/plugin-chatbot": minor
"@object-ui/plugin-dashboard": minor
"@object-ui/plugin-designer": minor
"@object-ui/plugin-detail": minor
"@object-ui/plugin-form": minor
"@object-ui/plugin-gantt": minor
"@object-ui/plugin-grid": minor
"@object-ui/plugin-list": minor
"@object-ui/plugin-timeline": minor
"@object-ui/plugin-tree": minor
"@object-ui/plugin-view": minor
"@object-ui/react": minor
"@object-ui/types": minor
---

Depend on the `@objectstack/*` 18 prerelease line (objectui#12030).

Every `@objectstack/*` range these packages declare in `dependencies` or `peerDependencies` moves from `^17.x` to `^18.0.0-next.0`, the `next` prerelease of `@objectstack/*` 18 (raised to `^18.0.0-next.1` by objectui#12370 before release).

**Breaking for consumers:** an install that resolves `@objectstack/spec` (or `@objectstack/client`, `@objectstack/formula`, `@objectstack/lint`) 17.x no longer satisfies these ranges. A consumer must move its own `@objectstack/*` packages to the 18 line, starting with `18.0.0-next.1` (objectui#12370), at the same time as it takes this release.

**objectui's own surface moves with it:**

- `element:record_picker`'s registration stops publishing the `object`, `filter`, `sort` and `limit` inputs, which spec 18 retires; a JSX page that writes one now gets `unknown-prop`.
- The `CapabilityMultiSelectField` widget's curated capability set (`@object-ui/fields`) follows spec 18: `manage_mailboxes` in, `manage_org_presentation` out.
- `element:number` and `element:repeater` nodes that bind no object are accepted, as spec 18's row and `PageComponentSchema` accept them; the two `ELEMENT_*_OBJECT_REQUIRED` refusals are gone.

**Retired with the spec:** `@objectstack/spec` 18 tombstones `object-grid`'s `defaultFilters` and refuses it by name, and `ObjectGrid` and `ObjectView` stop reading it (`table.defaultFilters` on an `object-view` included). A view that still carries it renders unfiltered: rename the key to `filter`, whose value is the same rule array.
