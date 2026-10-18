---
'@object-ui/console': minor
---

The audit log browser (`audit:log`) offers `sys_audit_log`'s list views as presets and links to the object list (objectui#12667, the objectui half of objectstack#23890).

- **Presets.** A "Presets" row above the filters offers one button per list view the platform serves on `sys_audit_log` (plugin-audit's Writes, Auth, Record Views, Config, …), by its served label and in served order. The page reads them from the console's object metadata, the same read the object list's view switcher uses, and names none of them itself. Choosing a preset sends that view's own `filter`, lowered by `@object-ui/core`'s `toFilterNodeSafely` exactly as the object list lowers it, beside the bar's action, object, actor and date filters under one `and`. Choosing it again, or "Clear filters", removes it. Columns, sort and page size stay the browser's own.
- **A view the browser cannot express is never approximated.** A view whose filter the lowering refuses, or one bound to another data source, is shown disabled with its reason on hover and a link to that view in the list. It never sends a filter.
- **"Open as list".** The page header links to the `sys_audit_log` object list, on the active preset's own view (`…/sys_audit_log/view/KEY`) when one is chosen.

The copy is English literals, as the rest of the page's copy is. No language-pack key, export or prop is added.

Clause-②: no
