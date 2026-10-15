---
'@object-ui/console': patch
---

The developer Public Forms page lists a form as published exactly when the server's anonymous form routes serve it (objectui#11545).

The routes serve a form only when its `sharing` declares `enabled: true`, `allowAnonymous: true` and a `publicLink` slug. The page used to decide on `allowAnonymous` and a link alone, so a form withdrawn by clearing `enabled`, which the routes answer with a 404, still showed as published. It now asks `anonymousFormIntakeCandidates` from `@objectstack/spec/ui`, the same function `@objectstack/metadata-core` hands those routes, of each item `GET /meta/view` serves.

- **The page reads the shape the server serves.** That list carries `ViewItem`s with the form under `config`. The page looked for the form at the item's top level, so on a real server it listed no public form, and offered nothing to publish. A fully opted-in form, such as the showcase app's contact form, is now listed under the slug the routes answer.
- **Publish and Edit write the form's `config`.** Both dialogs wrote `sharing`, and Edit also wrote `submitBehavior`, at the item's top level. `ViewItemSchema` refuses both keys there, and `ViewMetadataSchema`, which the save path parses a `view` body with, drops them, so a publish could save without opening the form. Both keys are now written under `config`, and the Edit dialog reads the stored post-submit behaviour from there.
- **What the page still cannot see.** The routes also refuse a form that another metadata layer withdraws, and one whose bound object cannot take an anonymous submission on this deployment's tenancy posture. The list read carries neither, so such a form is listed while the routes answer it 404.

**Clause-②: no.** The page is internal to `@object-ui/console`. No export, prop or language-pack key is added or removed.
