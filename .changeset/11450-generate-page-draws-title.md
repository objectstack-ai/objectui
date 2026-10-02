---
'@object-ui/cli': patch
---

`objectui generate page NAME` writes a page that draws its title (objectui#11450).

The generated `pages/NAME.json` had a `title` and no `pageType`. A page with no `pageType` is a `record` page, and a record page draws neither `title` nor `description`: it leaves its `h1` to a `page:header` block. So the generated title never showed. The generator now writes `"pageType": "app"`, which draws `title` as the page's `h1`.

The markdown child under it now reads `Welcome to NAME` instead of `# Welcome to NAME`. With the title drawn, a `#` heading in the markdown would draw a second `h1` beneath it. A page you generated before this release keeps its old shape; add `"pageType": "app"` to it, and drop the `# ` from its markdown, to get the same result.
