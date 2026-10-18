---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

Console copy names the system the user is already in, not the cloud noun "environment" (objectui#12956). Inside a running deployment, the Settings subtitle and its first category, the timezone prompt, the read-rate banner, the sign-in, sign-up and email-verification notices, the profile password descriptions, the home page loading, empty and build-refusal states, the system-settings quick action, the Connect-an-agent endpoint card and the AI model status error now say "this system" (zh 「本系统」), or drop the noun where the sentence reads without it. The Settings category that holds Company, Branding and Localization reads "General" (zh 「常规」). All ten language packs follow; no key is renamed, added or removed. Inline English fallbacks at the call sites follow the `en` values.
