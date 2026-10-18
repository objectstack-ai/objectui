---
'@object-ui/i18n': patch
---

The marketplace load-error hint no longer tells a runtime that proxies a control plane that it serves the catalog itself (objectui#11726).

When the runtime config reports `cloudUrl: ''` and a catalog load fails for a reachability reason, Browse Marketplace showed "This runtime serves the marketplace catalog itself. Check that the runtime is online." `''` says only that requests stay on this origin, and the CLI's cloud-connected `os serve` reports it while its marketplace proxy forwards to a control plane, so on that runtime the sentence was false. `marketplace.load.failedHintSameOrigin` now reads, in `en`, "The marketplace catalog is reached through this runtime. Check that the runtime is online and can reach the catalog.", and the nine other packs say the same. It names no host, because no failure the proxy returns carries the upstream host in a field or a header.

A runtime that reports its control plane keeps the hint that names it, `marketplace.load.failedHintConfigured`, unchanged. No key is added or removed.
