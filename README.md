# mrpia-home

The home page at https://mrpia.ch: one terminal window with who I am, the
small tools and games I've built, and how to reach me. Scroll it like a page,
or type `help` at the prompt at the bottom.

Plain HTML and CSS, with a little JavaScript for the live prompt and the theme
switch. No build step, no framework, no cookies, nothing loaded from another
host. Without JavaScript the page still shows everything; only the prompt goes
away.

## Files

| Path | What it holds |
|---|---|
| `public/index.html` | All the content. Each project is one `<li class="card">`. |
| `public/style.css` | Colors as CSS variables. Dark by default, light when the system asks for it or the visitor clicks ◐. |
| `public/theme.js` | Applies a saved theme before first paint, so it never flashes. |
| `public/app.js` | The prompt: `help`, `ls`, `open <name>`, `src <name>`, `cv`, `contact`, `theme`, `clear`/`reset`, Tab completion, ↑/↓ history. |
| `public/404.html`, `404.js` | The not-found page (`bash: cd: /path: No such file or directory`). |
| `public/og.png` | The link preview image (1200×630), generated from `tools/og-image.html`. |
| `tools/og-image.html` | Source of `og.png`. Not deployed. |
| `firebase.json` | Hosting config: clean URLs, response headers. |
| `docs/cutover.md` | Moving mrpia.ch from Infomaniak's page builder to this site. |

The prompt reads the project cards, the bio, the CV stub and the contact list
from the page itself. To add a project, copy a card in `index.html`; `ls`,
`open` and Tab completion pick it up. A card without an `a.play` link, like
arena-starter, counts as source-only: `open` explains that and opens GitHub.

## Run locally

```sh
firebase serve --only hosting --port 5055
```

This applies `firebase.json`, so the CSP header and the 404 page behave as they
do in production. `python3 -m http.server -d public` works too, but skips the
headers.

## Link preview image

`index.html` points `og:image` at `https://mrpia.ch/og.png`. Social apps
need a PNG or JPEG there; SVG doesn't work. After changing
`tools/og-image.html` (say, a new project in the `ls` line), render it again:

```sh
npx --yes playwright@1.65.1 screenshot --viewport-size="1200, 630" \
  "file://$PWD/tools/og-image.html" public/og.png
```

It needs Playwright's Chromium (`npx playwright@1.65.1 install chromium` once)
and the DejaVu Sans Mono and Noto Color Emoji fonts; other fonts render, but
the layout was tuned for these. Apps cache the previews they fetch; LinkedIn's
[Post Inspector](https://www.linkedin.com/post-inspector/) makes it fetch again.

## Headers

`firebase.json` sends a strict Content Security Policy (`default-src 'self'`).
Inline `<script>` and `<style>` blocks, `style="…"` attributes and anything from
another host are blocked: put code in a file under `public/`. The browser
console reports a violation if something slips through.

Every response is `Cache-Control: no-cache`. Browsers revalidate with the ETag
on each load, so a deploy shows up at once and there are no hashed file names
to maintain. At this page's size the extra round trip doesn't matter.

## Deploy

Firebase Hosting, site `mrpia-home` in project `modern-ally-102412`: the same
project as math-quizz, geo-quizz, arena-race and arena-maze. Deploying needs
`firebase-tools` logged in with an account on that project:

```sh
firebase deploy --only hosting
```

The site's default URL is https://mrpia-home.web.app. The custom domains
`mrpia.ch` and `www.mrpia.ch` are set up in the Firebase console, with DNS at
Infomaniak; see [docs/cutover.md](docs/cutover.md).

## The CV

`cat cv.md` answers "still compiling" for now. When the CV is ready, add
`public/cv.html` (clean URLs serve it at `/cv`) and point the `#cv` section in
`index.html` at it.

## License

[MIT](LICENSE)
