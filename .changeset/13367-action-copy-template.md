---
'@object-ui/core': minor
'@object-ui/react': patch
'@object-ui/app-shell': patch
---

An action's `confirmText`, `successMessage` and `errorMessage` read the `template` envelope and fill `{{ }}` holes (objectui#13367).

`@objectstack/spec` is making these three keys `template` slots (objectstack#24814), so a parsed action serves `{ dialect: 'template', source }` where it served a string. Before this change the success toast skipped the envelope and showed the default text, and the error toast showed the generic failure. `ActionRunner` now reads a string or the envelope for all three, and fills `{{ path }}` / `{{ path | formatter }}` holes with `@objectstack/formula`'s `templateEngine`, the engine the flow notifications render with:

- `confirmText`: `record` (the record the action runs against, the clicked row on a list) and `params` (the action's static params);
- `successMessage`: `result` (the payload `${result.*}` reads) and `record`;
- `errorMessage`: no hole is filled; the text shows as written.

A sentence with no `{{ }}` hole keeps today's `${…}` reading, so the platform's own `${result.email}`-style success sentences still work until the spec converts them. A sentence is read in one dialect only: a value filled into a `{{ }}` hole is never read again as `${…}`. An envelope with no text never reaches the dialog or a toast as an object; a `confirmText` envelope with no text still asks for confirmation.

`useActionTextLocalizer` keeps the envelope: it used to read it as a per-locale map and hand the runner the word `template`. A bundle entry replaces the envelope's `source`. On a flow action the console reads the envelope too, so the action's own success copy still outranks the flow's (`flowSuccessCopy`). `@object-ui/core` exports the reader it uses: `ActionCopyTemplate`, `isActionCopyEnvelope`, `actionCopySource`, `hasTemplateHoles` and `fillTemplateHoles`.

Clause-②: yes
Metadata-protocol: none
