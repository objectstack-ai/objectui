---
"@object-ui/i18n": minor
---

The ten locale packs follow `@objectstack/spec` 18's platform capability set (objectui#12030): the key `capability.label.manage_org_presentation` is replaced by `capability.label.manage_mailboxes`, as spec 18 retires `manage_org_presentation` from `PLATFORM_CAPABILITIES` and adds `manage_mailboxes`.

**For consumers:** a reader of `capability.label.manage_org_presentation` now gets no translation, and the exported `TranslationKeys` type loses that key and gains the new one. Scored `minor`, not `patch`, because a key a consumer could read is replaced; objectui's own breaking changes ship as `minor` (AGENTS.md §版本号策略).
