---
'@object-ui/create-plugin': patch
---

create-plugin: refuse a licence id the generator has no text for, instead of scaffolding a plugin whose LICENSE contradicts its own manifest

`buildLicenseFile` used to answer an unoffered licence id with MIT's text. The id
reaches a scaffolded plugin through six statements and that was the only one
that resolved it — `package.json`, the README's `## License` line and four
source-file headers take it verbatim — so the substitution did not remove the
"a manifest claiming a licence with no text beside it" state its docblock
promised to remove. It authored a worse one: a plugin naming one licence five
times and carrying a different licence's text, which the author then publishes.

The unoffered id is refused now, with an error naming the offending id and the
ids that would be accepted. Nothing reachable changes: `resolveLicenseId` is
total onto the four offered ids and the CLI is the only caller, so no scaffold
that works today starts failing.
