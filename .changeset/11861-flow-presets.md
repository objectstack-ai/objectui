---
'@object-ui/app-shell': patch
---

Studio's "New automation" dialog opens on common starting points in plain words, with the trigger form under "Advanced" (objectui#11861: the automations entry, the last of the three).

The dialog used to ask for a name and then offer the Start node's whole trigger list ("Record before update", "Time-relative (date sweep)", "Manual / autolaunched", …), with "Choose later on the Start node" first (objectui#11788). It now asks "When it runs", with four starting points, the first one chosen:

- **When a record is created**, **When a record is updated**, **When a record is deleted** — a record-change automation on the object the author names right under the choice. A record trigger with no object is not the automation its name promises: it would watch every object's records. So Create sends nothing until the object is named, and the dialog says "Choose the object it watches."
- **When a button or another automation starts it** — an automation started by an action button ("Run a flow"), another automation, or a manual run. Nothing more to fill in.

Each starting point is one of the Start node's own trigger choices, written where the Start node writes it, so the new automation is exactly the one "Advanced" creates for that trigger: a Start node and an End node, born switched off (objectui#11779).

A schedule, a time-relative sweep and Webhook / API are not offered as starting points: package-authored scheduled work is off unless a deployment switches it on, and an API-triggered automation is refused without a secret, which this dialog does not ask for. All three stay in the trigger list under "Advanced", which is unchanged and writes what it wrote. No starting point adds a step or writes a script.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
