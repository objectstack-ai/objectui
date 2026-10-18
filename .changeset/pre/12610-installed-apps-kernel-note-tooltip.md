---
'@object-ui/app-shell': patch
---

**Installed Apps' kernel note is the tooltip of the Uninstall it qualifies** (objectui#12610). The "kernel API is additive only" note was a paragraph at the foot of the list, shown under the empty state too. It now opens as a tooltip on hover or focus of a loaded local row's Uninstall, and is that button's accessible description. A not-loaded row's Uninstall carries no note, since that package left nothing in the running kernel (objectui#11645), and a cloud-bound list, which offers no Uninstall, carries none either. The note renders as text; the widget no longer passes it through `dangerouslySetInnerHTML`.
