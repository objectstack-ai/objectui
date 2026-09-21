---
'@object-ui/app-shell': minor
'@object-ui/i18n': patch
---

A signed-in user's language has one source of truth: `sys_user.locale`.

One word 「语言」 named two settings. The profile page's language card wrote the
server column `sys_user.locale`; the console's globe menu switched a
device-local UI language in `localStorage`. Neither writer could see the other,
so a user who chose 日本語 on their profile went on reading an English console,
with no refusal and no notice — and the profile card's own description said the
two were separate, which was true and is what this change ends.

For a signed-in user the column now decides, and the wiring is what makes that
hold rather than anyone's discipline:

- the globe writes `sys_user.locale` through the same adapter the profile card
  already used, so there is one writer path rather than two settings;
- `@object-ui/app-shell` reads the column back once per shell, on mount and on
  every `sys_user` mutation the invalidation bus reports — which includes the
  profile card's save, so changing the language in either place changes it in
  both, in the same session and with no reload;
- the device-local value is kept and demoted to a CACHE: it still decides before
  sign-in and for the first paint of a boot (the column cannot be read
  synchronously), and it is overwritten by the column as soon as the row is
  read. A stale device value can no longer outlive one round trip.

A failed write is reported to the user and the local switch stands until the
next successful read, which then takes the UI back to what the column says —
never a silent no-op. A signed-out visitor is unaffected: with no `sys_user`
row nothing is read and nothing is written, and the globe is the device-local
switch it has always been.

`@object-ui/i18n` is prose only here. Its precedence chain still adjudicates
what it can see (device choice → tenant seed → browser → `en`), and its
docblocks now say that a signed-in user's language is not one of those tiers:
reading a `sys_user` row needs an authenticated data adapter, which a renderer
package does not take as a dependency, so the host applies the column through
the ordinary `changeLanguage`.
