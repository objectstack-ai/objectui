---
'@object-ui/app-shell': patch
---

Studio's metadata draft saves send the version they were built on (objectui#11773). Once an editor has saved, its later saves no longer replace a draft that was saved elsewhere in the meantime without saying so.

Each guarded draft save of an existing item now sends `If-Match` with the `version` the editor's previous save received, and records the new receipt's version. The `/meta` draft door refuses a stale version with `409 METADATA_CONFLICT`. The editor then shows a dialog with three choices: reload the saved version (unsaved edits on screen are dropped), overwrite it after a second confirmation (the save is sent again without `If-Match`), or keep editing (nothing is saved, and the next save is refused again). The destructive-change confirmation (`409 DESTRUCTIVE_CHANGE`) is a separate flow and is unchanged.

The guarded saves are the Data pillar's object autosave and column reorder, the Automations pillar's flow autosave and enable switch, the Interfaces pillar's autosave of the open item (a page, dashboard or other item it edits) and its navigation autosave, the metadata designer's draft save, the Access pillar's package-scoped permission-set save, and the object Hooks panel's save. Creating an item sends no `If-Match`.

The protection starts at an editor's second save. A draft read serves no version, so the first save after an editor loads, reloads or switches items is still sent without `If-Match`.

Nothing on the package entry changes. The guard (`useDraftSaveGuard`) and its dialog are not exported from `@object-ui/app-shell`, and the new strings are rows in the designer's module-local string table, not language-pack keys.
