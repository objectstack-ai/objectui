---
'@object-ui/app-shell': patch
---

An app's landing waits for the API reads of its navigation entries (objectui#13097).

A navigation entry that declares an API `dataSource` is hidden while its read is pending (objectui#13029). The app root picks its landing from the entries the member is shown, so before this fix a pending entry was already gone when it chose. Two things went wrong:

- An app whose entries were all bound showed "Nothing in this app is available to you yet" until the reads answered.
- An app whose first entry was bound and whose second was plain navigated to the second entry on first render. The bound entry could never be the landing.

Now, while a pending read ahead of the first decided entry could still change the landing, the app root shows a skeleton. It does not navigate and does not show the no-access state. When the reads answer, it lands on the first entry the member is shown. A failed read hides its entry, and the landing moves on to the next one. An app with no bound entry lands on its first render, as before. No new requests are made: the landing reuses the reads the sidebar already makes.

Nothing is added to the package entry.
