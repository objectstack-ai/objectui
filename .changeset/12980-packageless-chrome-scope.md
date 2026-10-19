---
'@object-ui/app-shell': patch
---

In an app that names no package (an app created in the console is stored bound to none), two chrome readers no longer load the whole object registry (`GET /api/v1/meta/object`) while nothing else has asked for it (objectui#12980, part 6).

- **Whether an object exists** (`useObjectPresence`, which the bell's activity feed and the record page's reactions ask): the one object asked about is read by name through the names-only object scope, as an app with a package already does through its package scope.
- **Which view labels the server already translated** (`useServedViewItems`, read by the header and an object's view tabs): the object documents come from the names-only scope, through the objects the app's navigation requires, which the app route already asks for. An app that requires none reads no object document there.

Outside an app (the home page) and once anything has loaded the whole registry, both read the whole registry, as before. Inside an app with a package nothing changes. The sidebar's capability gate (`useNavMemberGates`) still reads the whole registry in such an app. Nothing is added to a package entry: no export, prop or type member.
