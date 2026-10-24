---
'@object-ui/console': patch
---

Settings: a setting's `visible` predicate is evaluated with the renderer's expression interpreter, and a predicate that does not evaluate hides the setting.

The settings page used to compile a manifest's `visible` string into a JavaScript function and show the setting whenever that failed. It now evaluates the string with `ExpressionEvaluator` from `@object-ui/core`, the CSP-safe interpreter every other `visible` predicate in the renderer uses, with the namespace's values bound as `data` (`${data.provider === 'cloudflare'}`). A predicate it cannot evaluate hides the setting, the same way the server refuses a save whose `visible` it cannot parse. Every predicate the shipped manifests declare (comparisons, `&&`, `||`, `!` over `data.<key>`) reads as before.
