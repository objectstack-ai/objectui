---
'@object-ui/plugin-grid': patch
---

The import wizard now opens its mapping step with the object's saved mapping applied when the object ships exactly one that the target accepts (objectui#13343). Before, the step always opened on "Map columns manually", so a user who never opened the "Saved mapping" menu imported without the mapping's renames and transforms. The preselection applies the mapping the same way picking it from the menu does, and the wizard decides it once per opening: a re-fetched mapping list or a re-render does not apply it again after the user switches back to manual mapping. With no saved mapping, or with several the target accepts, the step still opens on manual mapping. A mapping whose write mode the target refuses is still listed disabled and is not counted.
