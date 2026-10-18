---
'@object-ui/data-objectstack': patch
---

A console page load reads `sys_user_preference` once, not once per preference key (objectui#12187).

- **The user-state adapters share one read per load.** `createObjectStackUserStateAdapter`'s `load()` now joins an open read for its data source, resource and user. Every load of that scope issued before the next microtask adds its key, the read is sent once, and each adapter takes its own row from the answer. The console's favorites, recent items and flow palette recents used to make three requests, one per key; they now make one, `user_id = USER and key in (the three keys)`, with `$top` set to the number of keys. The object's unique index on `(user_id, key)` bounds the answer to one row per key.
- **A read that collects one key is unchanged.** It sends the same per-key query, `$top: 1`, as before.
- **Nothing is kept past the request.** The read closes when it is sent. A later `load()`, such as a new adapter after a language or account switch, asks the server again. A different user or data source never joins another's read.
- **Writes are unchanged.** `save()` still finds and writes its own row, and the stored rows and their shape are the same.

No export, option or type changes.
