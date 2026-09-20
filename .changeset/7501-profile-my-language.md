---
'@object-ui/console': minor
'@object-ui/i18n': minor
---

feat(console): a "Language" item on the profile page, writing the signed-in user's own
`sys_user.locale` (objectui#7501).

The platform made that column user-writable on 2026-09-03 and nothing in the product let
anyone set it — the profile page edited `name` and the avatar and carried no language
control at all, which is the `{name, image}` whitelist the ruling widened. Two people in
one deployment were already receiving their notifications in different languages with no
way for either of them to choose.

The new card reads and writes the user's own `sys_user` row through the data adapter, and
it is deliberately a card of its own rather than another field in the Personal Information
form: that form is written by `useAuth().updateUser`, which posts to better-auth's
`/update-user`, and `locale` is not a better-auth `additionalFields` entry, so that
endpoint cannot carry the column. Its feedback vocabulary is the form's — the same success
and failure `Alert`s, the same disabled-while-saving submit.

What it offers is the i18n provider's own `offerableLanguages` (the deployment's published
locales intersected with what this renderer can resolve) — the same set `LocaleSwitcher`
renders, so no second language list is introduced. Each entry is named in its own language.
A stored tag the deployment no longer publishes is shown rather than dropped, so the
control never displays a value that is not the account's.

Clearing is a first-class option: "Use the deployment default" writes `null`, which is the
documented meaning of an unset column and the only way back once a tag has been stored.

A refused tag (`400 VALIDATION_FAILED` with a per-field `locale` entry) is rendered on the
item, with `aria-invalid` and `aria-describedby` pointing at it, rather than as an
undirected alert. When the deployment's write route is not this user's — the field/object
permission answer for `sys_user.locale` — the control is read-only and says why instead of
offering a button that would answer 403, and it does not render at all while the row is
unread or if the read is refused.

**This does not change the interface language.** The UI language is a per-device
preference the i18n provider keeps in `localStorage` and the globe menu switches;
`sys_user.locale` is a per-user server column read per recipient at delivery time. The two
stayed separate here on purpose; whether they should be joined is a product decision that
has not been made.

`@object-ui/i18n` gains the seven `profile.language.*` keys, in all ten packs.
