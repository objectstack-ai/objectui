---
'@object-ui/plugin-detail': patch
---

Record page sections: a collapsible section's header is now a real button named by the section title (objectui#12625). It carries `aria-expanded`, is reachable by Tab, and Enter or Space toggles it; a click anywhere on the header still toggles as before. The per-field copy-value icon button is named "Copy to clipboard". A non-collapsible section's header is unchanged.
