---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The Console top bar no longer flashes a green "Connected" chip for two seconds after load (objectui#12891).

A successful connect draws nothing from the first frame: the 2000 ms timer is gone. The connecting, reconnecting, disconnected and error chips are unchanged. The `topbar.connection.connected` language-pack key had no reader left and is removed from all ten packs.
