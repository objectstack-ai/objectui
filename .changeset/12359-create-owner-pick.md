---
'@object-ui/plugin-form': patch
---

A New form now saves the owner the user picks (objectui#12359). When the form's layout shows Owner, the user could pick a user and see that user's chip. The create request still carried no `owner_id`, so the server saved the record under the creator, answered 201 and showed no error.

Every create writer in the package now sends `owner_id` when the user picked an owner that differs from the value the form opened with. The six writers are `ModalForm`, `DrawerForm`, and the simple, tabbed, split and wizard layouts of `ObjectForm`. They read the same admission objectui#12205 gave the Edit form. An owner the form was seeded with and the user left alone is still not sent. That covers the acting user from a `current_user` default and an owner in the caller's initial values. The caller's field-level security and an owner the object declares `readonly` still refuse it. The client does not decide whether the caller may assign another owner. The server judges the pick: an insert that names another user is refused without the transfer grant (`allowTransfer` or `modifyAllRecords`), and the form shows that refusal as its error.

Not published: nothing changes on the package entry. No export, prop or type member is added or removed.
