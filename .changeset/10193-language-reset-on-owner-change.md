---
'@object-ui/auth': minor
'@object-ui/app-shell': patch
'@object-ui/console': patch
'@object-ui/i18n': patch
---

fix(auth,app-shell,console): a browser that changes hands no longer keeps the previous account's UI language

Both device language slots (`objectui-locale` and `objectui-locale-seed`) hold the
language of whoever last signed in on the browser. A boot resolves its language from
them before anyone is signed in. When the session then turns out to belong to someone
else (an SSO redirect back into the console, or a sign-in in another window),
`SessionUserScope.adopt` already purged both slots (objectui#5664). But the live
language had already been derived from them, and nothing re-derived it. A new account
with no `sys_user.locale` of its own therefore read the previous account's language
for its whole first session.

- `@object-ui/auth` (new exports, hence minor): `getSessionOwnerChangeCount()` and
  `subscribeSessionOwnerChange(listener)` report that the change-of-owner purge ran
  in this page-load. They are held in memory, with no new storage key.
  `SessionUserScope.adopt` now returns `true` when it purged a previous owner.
- `@object-ui/app-shell`: `useSignedInUserLocale` resets the UI language on an owner
  change, the same way a boot of the swept storage would resolve it. It then
  re-reads the new owner's `sys_user.locale`, which applies after the reset.
- `@object-ui/console`: `LocalizationFetchProvider` and the boot-time seed fetch no
  longer write an answer that was requested before an owner change. Such an answer
  describes the previous owner.
- `@object-ui/i18n` (docs only): the seed was documented as the "tenant's" locale.
  It is the server's resolved locale for the signed-in caller: their own
  `sys_user.locale`, else `Accept-Language`, else the deployment default. The docs
  now say so, and declare what a visitor who has not signed in reads: the last
  owner's language, until someone else signs in.
