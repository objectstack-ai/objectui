---
'@object-ui/app-shell': patch
'@object-ui/data-objectstack': patch
---

Studio shows a refused save as a sentence the author can act on, with the technical detail behind a "Details" disclosure (objectui#11785).

- **Studio's save strips.** The Data, Automations and Interfaces pages used to print the refusal verbatim: the write guard's developer prose, or the server's raw issue paths such as `nodes.2.config.title — …`. Each strip now shows one sentence that names the input the refusal is about, in the terms the editor shows. On the Data page that is the field's label. On the Automations page it is the step's label and the inspector input, so a refusal at `nodes.2.config.title` reads "Check Title on the step “Notify approver” — …". On the Interfaces page it is the navigation item and its input. A "Show me" button opens that field, step or navigation item. The raw text stays under a closed "Details" disclosure, unchanged. A path Studio cannot place on the open page keeps its line there, and the sentence says the draft was refused.
- **A Picklist with no options.** Switching a field to Picklist before it has an option now says "Changes not saved: the field “Status” needs at least one option…", instead of the guard's message.
- **The object write guard's message names no code.** `assertObjectMetadataWritable` no longer prints the door's class name, a package name or tracker ids. Its message is the same at every door, so the other surfaces that show it as their banner read the field, its type and the remedy. Its signature, error type and exports are unchanged.

`formatMetadataError` is unchanged, so every other surface that calls it prints what it printed before. Nothing is added to either package entry: no export, prop, type member or language-pack key. The new sentences are rows in the metadata-admin designer's own string tables (en and zh).
