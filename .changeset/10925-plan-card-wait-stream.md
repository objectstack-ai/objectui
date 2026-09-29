---
'@object-ui/plugin-chatbot': patch
---

fix(plugin-chatbot): the proposed-plan card's actions wait until no turn is in flight

The proposed-plan card renders as soon as `propose_blueprint` returns, but the
turn that proposed it keeps streaming after that, and the server stores each of
its remaining steps as it goes. Build it, Adjust and the one-click answer chips
were live the whole time. In a cloud E2E run the user clicked Build it inside
that window. The next turn was sent while the previous one was still being
stored, and the stored history interleaved the two turns.

These actions are now disabled while `isLoading` is true, on the structured plan
card and on the fallback confirm card alike. `isLoading` is the signal that
already turns the composer's send into a stop button. The actions come back once
the response stream has been read to its end, and the buttons carry the native
`disabled` attribute while they wait. The gate also covers two windows that a
message's own `streaming` flag misses: a request that is out but has no reply
yet, and a newer turn streaming below an older plan card.

Ordering replayed history by turn in the conversation store is a separate
server-side fix.
