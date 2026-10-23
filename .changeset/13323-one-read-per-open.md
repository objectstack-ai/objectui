---
'@object-ui/react': minor
'@object-ui/app-shell': patch
---

A navigation entry's API `dataSource` and a page element bound to the same read now make one request per console open (objectui#13323). Before, `readElementApi` shared a request only while it was in flight, so when the sidebar's read for an entry's `visible` had settled before the page element mounted, the element sent a second `GET` for an answer the console already held.

`@object-ui/react` exports `ElementApiOpenScope` (with `useElementApiOpen` and the `ElementApiOpen` type): inside it, a read that has already answered under the same `open` name is answered again with no request. A failed read is not kept, a read under another `open` asks again, and any `notifyDataChanged` drops what the open kept. `readElementApi` takes the open as an optional third argument; without one it behaves as before.

`@object-ui/app-shell`'s `ConnectedShell` mounts the scope and names one open per visit of a history entry: following a link or a navigation entry, and Back or Forward, start a new open and read again, even on an entry visited before; a redirect that replaces the address (the app root's landing on its first entry) stays in the open. A language switch starts over. No read happens at a different time than before; only whether a second read in one open reaches the network changes.
