---
"@object-ui/app-shell": minor
"@object-ui/types": minor
"@object-ui/core": minor
"@object-ui/plugin-calendar": minor
"@object-ui/plugin-designer": minor
"@object-ui/plugin-detail": minor
"@object-ui/plugin-kanban": minor
"@object-ui/console": minor
"@object-ui/runner": minor
---

Resolve `@objectstack/*` `18.0.0-next.3` (objectui#12873).

The console and the runner bundle `18.0.0-next.3`. Every package keeps its `@objectstack/*` range (`^18.0.0-next.1`, or `^18.0.0-next.2` for `@object-ui/types` and `@object-ui/app-shell`), which already admits it.

**An accept set that narrows with it.** `@object-ui/types` validates a `page:header` node's `properties` through the spec's own `page:header` row, so its faces (`safeValidateSchema` and `StrictAnyComponentSchema`) now refuse `showStar`, which `18.0.0-next.3` retires: the follow star it switched on is not drawn by any renderer. It was accepted before. Delete the key.

**A type that widens with it.** `SelectOptionBase`, and the field and form option types built on it, take the spec's select option by reference, so they now carry its optional `kind` (`'open' | 'won' | 'lost'`), the lifecycle category `18.0.0-next.3` adds. The spec takes it on a single-value `select` or `radio` field's options and requires it on every option of the field an object's `stageField` names.
