---
"@object-ui/i18n": minor
---

The ten locale packs follow `@objectstack/spec` 18's platform capability set (objectui#12030): `capability.label.manage_mailboxes` is added, and `capability.label.manage_org_presentation` is removed with the capability spec 18 retired from `PLATFORM_CAPABILITIES`.

**For consumers:** a reader of `capability.label.manage_org_presentation` now gets no translation. Scored `minor`, not `patch`, because a key a consumer could read is removed; objectui's own breaking changes ship as `minor` (AGENTS.md §版本号策略).
