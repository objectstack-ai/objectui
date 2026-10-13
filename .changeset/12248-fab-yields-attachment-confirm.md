---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
'@object-ui/i18n': minor
---

The console's assistant button no longer covers the record page's inline-edit Save or an attachment's Download and Delete, and deleting an attachment asks first (objectui#12248).

- **The assistant button steps aside.** It sits in the bottom-right corner of every page, and at common desktop widths the inline-edit bar's Save and, when the attachments panel is the page's last content, the last row's Delete land under it. A click there opened the assistant instead, and an inline save could be lost that way. The button is now hidden while one of those controls is under it, and it comes back as soon as the corner is free. The assistant stays reachable from the top bar and with Cmd/Ctrl+Shift+I. On a phone, where the button sits higher, nothing changes.
- **`InlineEditSaveBar` marks its bar** with a `data-fab-yield` attribute, which a host's floating launcher can read. No prop or export is added.
- **Attachment delete asks for confirmation** through the console's usual destructive confirm dialog, the one the record page's own Delete uses. The dialog names the file. Cancel deletes nothing.
- **`@object-ui/i18n`:** one new key, `detail.deleteAttachmentConfirm`, in all ten language packs.
