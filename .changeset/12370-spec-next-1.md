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
"@object-ui/console": minor
"@object-ui/runner": minor
---

Depend on `@objectstack/*` `18.0.0-next.1` (objectui#12370).

Every `@objectstack/*` range these packages declare moves from `^18.0.0-next.0` to `^18.0.0-next.1`; the console and the runner bundle `18.0.0-next.1`. A consumer moves its own `@objectstack/*` packages to `18.0.0-next.1` with this release.

**Accept sets that narrow with it.** `@object-ui/types` validates page action rows and view data bindings through the spec's own rows, so its faces (`safeValidateSchema` and `StrictAnyComponentSchema`) now refuse what `18.0.0-next.1` refuses. Each was accepted on `18.0.0-next.0`:

- `onSuccess` on an `action:button` / `action:icon` row, or an `action:group` / `action:menu` member, whose executor is the `url`, `navigation`, `modal`, `flow` or `form` built-in, or that has no executor at all. Write the hop on an `api` or `script` action (or a host handler name), or drop it.
- `onSuccess` beside `operation: 'update'`, and an `onSuccess` block carrying a key outside `{ navigate, openIn }`.
- `actionType: 'navigation'` on a row (and `type: 'navigation'` on a container member): write `'url'`.
- A `url` executor's `target` that is not openable, judged on the executor the runner runs, including a row whose `name` selects it.
- A view `data` binding with `provider: 'api'`: bind the object or static rows; an API call is the page element's binding.
