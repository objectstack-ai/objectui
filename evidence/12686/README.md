objectui#12686 live reading, showcase @objectstack/cli 18.0.0-next.2 (published) served at /_console on :4010.

## before (vendored @objectstack/console 18.0.0-next.2)
    sign-in 200
    doc url http://localhost:4010/_console/docs/manual/showcase_index
    before href /docs/showcase_docs_guide
    before new-tab http://localhost:4010/docs/showcase_docs_guide 404
    before new-tab landed http://localhost:4010/docs/showcase_docs_guide "{\"success\":false,\"error\":{\"code\":\"ENDPOINT_NOT_FOUND\",\"message\":\"Not found\"}}"
    before plain-click landed http://localhost:4010/_console/docs/manual/showcase_docs_guide

## after (branch claude/issue-12686-doc-links-basename at 4f2fa92, vite-built and swapped into the throwaway copy's dist)
    sign-in 200
    doc url http://localhost:4010/_console/docs/manual/showcase_index
    after href /_console/docs/showcase_docs_guide
    after new-tab http://localhost:4010/_console/docs/showcase_docs_guide 200
    after new-tab landed http://localhost:4010/_console/docs/manual/showcase_docs_guide "Documentation\n/\nDocumentation Guide\nShowcase Manual\nGETTING STARTED\nShowcase\nGUIDED TOUR\nTour · Data\nTour · UI\nTour · Automation\nTour · System\nTour · Security\nG"
    after plain-click landed http://localhost:4010/_console/docs/manual/showcase_docs_guide
