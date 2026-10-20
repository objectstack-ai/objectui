---
'@object-ui/app-shell': patch
---

The permission-set editor no longer keeps the clone notice after the copy is saved (objectui#13272).

"Clone to customize" opens the copy with the server's notice: what was not copied, and that the copy is held by nobody yet. The notice is the server's answer at the moment of the clone. It stayed on the copy for as long as the copy was open, so after a save it still read as if nothing had happened. A successful save of the copy now removes it. A refused save keeps it, and on an embedded host, where the copy is announced on the set it was cloned from, saving that set keeps it too. The notice is still shown whole and in the server's words while it shows.
