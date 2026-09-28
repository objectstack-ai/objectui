---
'@object-ui/plugin-chatbot': patch
---

fix(plugin-chatbot): the confirm-changes card's actions wait until no turn is in flight

The confirm-changes card renders as soon as a tool such as `update_metadata`
returns `changes_proposed`, but the turn that proposed the change keeps
streaming after that. Confirm and Adjust were live the whole time, and Confirm
sends its confirmation straight away, so a click in that window sent the next
turn while the previous one was still in flight. The proposed-plan card's
actions were fixed for the same overlap.

Confirm and Adjust are now disabled while `isLoading` is true, the signal the
proposed-plan card's actions already wait on. They carry the native `disabled`
attribute while they wait and come back once no turn is in flight. Because the
signal is not tied to the card's own message, the gate also holds an older card
while a newer turn is in flight below it, including a request that is out with
no reply yet.

Only those two buttons change. The card's other states render as before: the
Applying badge, the blocked state after an AI quota refusal, the Confirmed
badge, and the reply hint shown when the host passes no `onSendMessage`.
