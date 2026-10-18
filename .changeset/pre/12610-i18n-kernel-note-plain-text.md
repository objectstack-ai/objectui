---
'@object-ui/i18n': patch
---

**`marketplace.installedAdditiveNote` is plain text in all ten packs** (objectui#12610). Each value dropped its leading `<strong>Note:</strong>` markup (in that pack's language); the sentence after it is unchanged. The console draws the key as the tooltip of Installed Apps' Uninstall, which renders text, not HTML. The key's name does not change.

**Clause-②: yes.** The value is part of the published `en` pack and its nine siblings. A consumer that rendered this key as HTML now renders the same sentence without the bold "Note:" prefix; one that rendered it as text no longer shows literal tags.
