---
'@object-ui/app-shell': patch
---

Changing the ⌘K query no longer blanks the console (objectui#13387).

The palette lists record hits under one heading per object. When a new query stopped finding an object, that object's heading went away while cmdk's own sort still walked it, and the error unmounted the whole console until a reload. The palette already decides which entries show (its own matching, and the server's ranked record hits), so cmdk's filter and sort are now off: what the palette renders is what shows, in the order it renders it. A record hit's value no longer carries the query.

The palette also sits behind its own error boundary. An error inside it closes the palette and is reported; the console stays, and the next ⌘K opens a fresh palette.

Clause-②: no
Metadata-protocol: none
