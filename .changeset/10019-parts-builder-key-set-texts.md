---
---

Comment-only in `@object-ui/app-shell`: the cache-write comment inside `sanitizeChatMessagesForCache` described the AI-chat parts builder by a literal key list, which objectui#10017 retired when it made that builder construct a discriminated tool part per state. The comment now cites `toSdkToolPart` — the builder that owns the key set — rather than restating it, and the argument it exists to make is unchanged. No published behaviour changes (objectui#10019).
