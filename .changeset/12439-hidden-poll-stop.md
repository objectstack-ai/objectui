---
'@object-ui/app-shell': patch
---

A browser tab left hidden for 10 minutes stops polling the console's shared feeds, so a forgotten tab no longer keeps a scale-to-zero backend awake (objectui#12439).

The pending-approvals count and the inbox used to poll every 60 s while the tab was in the background, forever. Each of those requests counted as activity, so a single tab left open kept a server that scales to zero running around the clock. Now:

- For the first 10 minutes of a continuous hide, the hidden cadence is unchanged (60 s).
- After 10 minutes hidden, the feeds send nothing more and arm no timer, however long the tab stays hidden. The clock restarts at each hide: switching back to the tab, even briefly, resets it.
- Coming back to the tab refetches each feed once, immediately, as before, and the normal foreground cadence (10 s inbox, 30 s approvals) resumes from there.

The cost: an inbox message that arrives after the tab has been hidden for 10 minutes raises no desktop notification while the tab stays hidden. It appears as the usual in-page toast and bell badge as soon as the user returns.

The 10-minute limit is a fixed value, not a setting. Nothing is added to the package entry: no export, prop or type member.
