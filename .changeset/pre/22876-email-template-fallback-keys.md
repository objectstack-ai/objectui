---
'@object-ui/app-shell': patch
---

The Studio fallback form for an email template no longer offers `category` or `isSystem`, and the fallback skill form no longer offers `triggerPhrases` (objectstack-ai/objectstack#22876).

`@objectstack/spec` retires `email_template.category` and `email_template.isSystem` (ADR-0049 enforce-or-remove): nothing ever read either key, so the spec refuses both with a migration note. `skill.triggerPhrases` was retired the same way in spec 17. The metadata admin's fallback schemas (`default-schemas.ts`) still offered all three, so against a server that serves no schema for the type, the form could write a key the server refuses.

A current server serves its own schema for both types, and the edit page reads that schema before the fallback one. So against a current server the form is unchanged. The file's header comment, which said the fallback is used for every type, now says when it is used.

Nothing is added or removed on the package entry.
