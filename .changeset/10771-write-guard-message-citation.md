---
'@object-ui/data-objectstack': patch
---

fix(data-objectstack): the object-metadata write refusal no longer points at an issue that answers 404

`assertObjectMetadataWritable` throws when an object-metadata write carries a relationship
field with no usable target, and a host surfaces that message on screen or in a log. Its
reason ended with two issue pointers, and one of them answers 404, so a reader who followed
it found nothing. The message now cites only objectui#7714, the ruling the refusal enforces.

Nothing else in the message moves: the door name it opens with, the field it names, the
target state it describes and the advice it closes with are unchanged, and the guard refuses
exactly the writes it refused before.
