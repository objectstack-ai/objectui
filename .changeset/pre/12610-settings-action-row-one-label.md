---
'@object-ui/console': patch
---

**A settings action row draws its label once, on the button** (objectui#12610). The settings renderer's `action_button` row printed the manifest's `label` as the row label and again on the button, so Mail Delivery read "Send test email" twice and AI & Embedder repeated "Test connection", "Reset to environment defaults" and "Test embedder". The button now carries the label alone. The row's left side holds the specifier's `description` when the manifest declares one, as one line of muted text, and nothing otherwise. Settings keys, values and save behaviour do not change.
