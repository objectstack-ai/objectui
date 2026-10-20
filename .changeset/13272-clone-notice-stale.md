---
'@object-ui/app-shell': patch
---

The permission-set editor no longer keeps the clone notice once the copy is held or saved (objectui#13272).

"Clone to customize" opens the copy with the server's notice: what was not copied, and that the copy is held by nobody yet. The notice is the server's answer at the moment of the clone. It stayed on the copy for as long as the copy was open, so after a user was assigned and the copy was saved it still said nobody held it. The notice now goes when the copy's Assigned Users list first shows anyone (a direct grant or a holder through a position), or when a save of the copy succeeds. A refused save keeps it, and so does a failed read of the holders. On an embedded host, where the copy is announced on the set it was cloned from, saving that set keeps it too. While the notice shows, it is still shown whole and in the server's words.
