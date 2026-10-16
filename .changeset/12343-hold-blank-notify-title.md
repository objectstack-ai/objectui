---
'@object-ui/app-shell': patch
---

Studio holds a Notify step whose Title is blank, the way it already holds a missing one (objectui#12343, the objectui half of `@objectstack/spec` 18 refusing a blank Notify title).

Since spec 18 the flow parse refuses a blank Notify `title` at `nodes.N.config.title`. Studio's Automations pillar held a Notify step only when its Title was absent, so a title of spaces was sent and the server's refusal showed after the save. Now the step is held before anything is sent, with the same "needs input" line naming Title on the step.

The hold stays no stricter than the contract. An input is held as blank only when its value is a string that is empty or all whitespace and the flow parse refuses the flow at that input. A filled title, a `{{ }}` template title, and a `template` in place of a title are still sent. A blank title on a step whose contract accepts one, such as a Screen, is still sent. A value the parse refuses for something other than being blank, such as a `null` title, still shows its refusal.
