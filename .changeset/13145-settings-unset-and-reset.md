---
'@object-ui/i18n': patch
'@object-ui/console': patch
---

A settings value can go back to unset, and an override back to the inherited value (objectui#13145).

- **`@object-ui/console`**: emptying a text, email, URL, phone, password or textarea box on a settings page (and the free-text box of a `valueDomain` select) now saves the key as `null`, which the settings service reads as "clear this layer's value", instead of `""`. A cleared SMTP host is no longer refused as incomplete; a key the server requires with no default is still refused, as before. A row whose source badge reads "Overrides" gains a small "Reset to default" action beside the badge: it clears the key in the draft, Save sends it as `null`, and the badge then shows what the server answers for the row.
- **`@object-ui/i18n`** adds `console.settingsView.resetToDefault` to all ten bundles.
