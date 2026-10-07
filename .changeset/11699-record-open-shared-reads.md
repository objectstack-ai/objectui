---
'@object-ui/data-objectstack': patch
'@object-ui/plugin-detail': patch
---

A record open no longer sends the same record read twice at once, and asks each explain question once, with concurrent callers sharing the request (objectui#11699).

A record page open sent `GET /api/v1/data/OBJ/ID` twice at the same moment and `POST /api/v1/security/explain` four times: the `update` and the `delete` question, each asked twice. Both reads came from the details block, whose load effect runs again while its first read is still on the wire. Each question was asked by the page header and by the details block, which mounts while the header's answer is still pending. The record page's own `$expand` read of the record, which it sends again when the object definition changes identity, is not changed here.

- **`ObjectStackAdapter.findOne` shares an in-flight read**, the way `find` already did. Calls for the same resource, id and params that arrive while a read is pending get that read's answer. The entry is dropped when the read settles, so a later call reads again: this is not a response cache. A failed read reaches every caller that shared it and is not remembered. A write through the adapter (`create`, `update`, `delete`, the bulk and batch writes) drops the pending `findOne` reads of the resource it wrote, so a record read asked after a save never gets an answer sent before it.
- **The record-level edit and delete probe (`useRecordEditable`) shares an unanswered question.** Mounts asking the same question (same principal, object, record and operation) while it is pending wait on one request. A question whose record changes while it is pending is not shared, so the re-ask is a fresh request. No pending question is shared across a change of the signed-in principal.

Nothing is added to either package entry: no export, prop, type member or language-pack key. `findOne` keeps its signature.
