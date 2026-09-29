---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

fix(app-shell): a failed reaction write takes the reaction back and says so, instead of staying shown as applied (objectui#10899)

A reaction click on the record page's discussion shows at once and is stored in
the background with a `sys_comment` update. That update was issued from inside
the React state updater and its rejection was discarded, so a refused write
left the reaction on screen as applied, with no message, until a reload. In a
StrictMode development build the updater also ran twice, so one click sent two
updates.

`RecordDetailView` now computes the toggle and issues the write from the click
handler, one write per click. When a write is refused, the row shows the newest
reaction set a write stored or can still store, and a localized error toast
(`detail.reactionFailed`, new in all ten packs) says the reaction was not
saved. A refused click that a later click's write also carries is kept, because
each write stores the row's whole reaction set. The stored
`{ emoji: userIds[] }` shape is unchanged.
