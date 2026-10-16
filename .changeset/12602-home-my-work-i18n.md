---
'@object-ui/i18n': minor
---

Locale keys for the console home's "My work" section (objectui#12602), in all ten packs.

- **Added:** `home.myWork.title`, `home.myWork.openInbox`, `home.myWork.viewAll`, `home.myWork.approvals`, `home.myWork.approvalsEmpty`, `home.myWork.notifications` and `home.myWork.notificationsEmpty`. For the pending-drafts row: `home.pendingDrafts.title` (a count family), `home.pendingDrafts.inPackage`, `home.pendingDrafts.waiting` and `home.pendingDrafts.nameSeparator`.
- **Removed:** `home.actionCenter.title`, `home.actionCenter.empty` and the `home.pendingDrafts.message` count family. Their only readers were the retired action-centre card and the retired drafts banner, and nothing in this repository reads them now.

**Clause-②: yes.** The exported `en` pack is typed by its literal content, so its type gains the keys above and loses the removed ones.
