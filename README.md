# www.matchbox.health

Static rebuild of the Squarespace 7.1 site for **matchbox**, ahdis's open-source
FHIR validation and mapping server, ready to serve from GitHub Pages.

Plain HTML, CSS and one small script. No Jekyll and no build step at serve
time: the generated pages are committed, and Pages serves them as they are.

```
docs/        the published site — the only directory GitHub Pages serves
  index.html  features/  privacy-policy/  blog/  404.html
  assets/     css, js, images, webfonts
  CNAME  robots.txt  sitemap.xml  .nojekyll
_build/      the generator (shared chrome, page bodies, blog)
  posts/      one Markdown file per blog post, and _template.md
.claude/     the blog agent's instructions (skills/matchbox-blog)
.github/     check.yml (every PR) and claude.yml (the blog agent)
_design/     measurement tools, design notes, privacy review, blog plan
_reference/  the archived Squarespace original
```

Everything outside `docs/` stays in the repo and is not served on the site.

## Working on it

```sh
npm run setup    # once: .venv with requirements.txt, Playwright for the checks
npm run build    # regenerate docs/ from _build/
npm run serve    # http://localhost:8081
npm run check    # links and consent, against the running server
```

Edit `_build/`, `docs/assets/css/site.css` or `docs/assets/js/site.js` —
**never** the generated HTML in `docs/`, `docs/sitemap.xml` or `docs/blog/`,
which are overwritten on every build. Commit the regenerated `docs/` together
with the change: CI fails a PR whose `docs/` differs from what the build
produces.

`docs/.nojekyll` tells GitHub Pages to serve the folder as it is, without
running Jekyll.

## Blog

Posts are Markdown files in `_build/posts/`, published at
`/blog/<year>/<slug>/` (the URL scheme of the ahdis.ch blog), with an index at
`/blog/` and an Atom feed at `/blog/feed.xml`. "Blog" appears in the header and
footer once there is at least one post.

1. Copy `_build/posts/_template.md` to `_build/posts/YYYY-MM-DD-<slug>.md`, fill
   in the front matter and write the draft. The HTML comment at the top is for
   notes to the agent ("keep the text unchanged", who it is for). To
   republish an article, paste its Markdown into the post: the agent cannot
   read private repositories such as `ahdis/ahdis-blog`, and `WebFetch` only
   gives it a summary of a page, not the text.
2. Open a PR. The **Check** on this first commit fails while the draft is
   incomplete; that is expected. The **Claude** workflow runs the
   `matchbox-blog` skill: it completes the front matter, edits the text for
   implementers (unless told not to), builds, commits to the PR branch and
   comments what it did.
3. Iterate with PR comments that mention `@claude`. `@claude rebuild` just
   regenerates `docs/`.
4. The **Check** workflow attaches a `preview` artifact with the built site and
   screenshots of every blog page at 1440 and 390px. For the real thing:
   `gh pr checkout <n> && npm run serve`. If the Check on one of the agent's
   commits says it is waiting for approval, click **Approve and run** on the
   PR: GitHub treats the agent's bot accounts as first-time contributors.
5. Merge once the Check is green; `main` does not accept a merge before. The
   post is live about 30 seconds later.

A post that first appeared elsewhere sets `original:`. It then says
"Originally published on …", its canonical URL points to the original, and it
is left out of `sitemap.xml`.

The agent authenticates with a Claude subscription token, created with
`claude setup-token` and stored as the repository secret
`CLAUDE_CODE_OAUTH_TOKEN`. It uses that subscription's limits. The Claude
GitHub App must be installed on the repository. Only users with write access
can start the agent. Each run writes its turns, tokens, cost at API prices and
any denied tool calls to the run's summary page (Actions → the Claude run).

The agent cannot change `.claude/` (its skill) or `.github/workflows/`; it puts
the text for such changes in its PR comment, and a person makes them in a PR.
A change to `claude.yml` only takes effect once it is on `main`: the action
refuses to run from a workflow file that differs from the copy on `main`.

## Checking it against the original

While the Squarespace site is still up:

```sh
npm install                                  # playwright, for the tools only
node _design/tools/compare.mjs               # page heights, live vs local
node _design/tools/diff.mjs /                # per-landmark x/w/y/h/font-size
VP=mobile node _design/tools/diff.mjs /      # ...at 390px
node _design/tools/menu-diff.mjs             # the mobile menu overlay
node _design/tools/linkcheck.mjs             # every link and asset resolves
node _design/tools/test-consent.mjs          # analytics stays off until Accept
node _design/tools/subpath.mjs               # renders under /<repo>/ too
```

Current state, against the live site:

| page | desktop 1440px | mobile 390px |
|---|---|---|
| home | −3px (−0.1%) | −27px (−0.7%) |
| features | −1px (0.0%) | −24px (−0.7%) |
| privacy-policy | +133px (+2.1%) | +232px (+2.5%) |

Every landmark matches the original in **x and width at both breakpoints**, and
the mobile menu overlay matches link-for-link. The home and features deltas are
one dropped element: an empty anchor to squarespace.com that renders as a blank
line in the original footer. The privacy policy is legitimately longer because
its text was amended — see `_design/PRIVACY-REVIEW.md`.

## Analytics

Google Analytics `G-NJ6P4XSZMC` is retained behind a consent banner. Consent
Mode starts `denied` and the Google tag is not fetched at all until Accept, so
declining leaves no request to Google on the wire. The choice is stored in
`localStorage` under `matchbox-consent`, and the privacy policy links back to
the banner so a visitor can change it.

## The archive

`_reference/squarespace/` holds the original: every page, every asset at full
resolution, the theme CSS and the webfonts. `./_reference/archive.sh` re-runs it.

**Keep this.** Once the Squarespace subscription lapses the original is
unrecoverable.

## Notes worth reading before changing the design

`_design/DESIGN-NOTES.md` — the measured type scale, the two breakpoints, the
12-column row model, and the traps (a fluid scale that changes *unit* at 768px,
italic webfonts labelled as normal, and why forcing `opacity: 1` corrupts colour
readings).

## Hosting

Live on GitHub Pages at <https://www.matchbox.health>, cut over from Squarespace
on 2026-08-19. Pages serves `main` / `/docs`; `docs/CNAME` holds
`www.matchbox.health`. (It served `main` / root until 2026-10, which published
the generator, the design notes and the Squarespace archive along with the site.)
HTTPS is enforced, so `http://` redirects to `https://`.

`main` is protected by the ruleset "main: PR and Check required": every change
goes through a PR, the **Check** job (`build`) must pass before merging, and
force pushes and deletion are blocked. Repository admins can bypass it in an
emergency, for example a rollback (`gh api repos/ahdis/matchbox.health/rulesets`
lists it).

Publishing is a push to `main`, normally a merged PR. GitHub then runs its
built-in `pages-build-deployment` workflow (it is not a file in this repo),
which packs `docs/` as it is and deploys it, in about 30 seconds. Pages sends
`cache-control: max-age=600`, so visitors may see the old page for up to ten
minutes. If the deployment fails, the previous version stays live. To check:
`gh api repos/ahdis/matchbox.health/pages/builds/latest`. Changing the Pages
source does not start a build on its own; `gh api -X POST
repos/ahdis/matchbox.health/pages/builds` does.

DNS is Google Cloud DNS, zone `matchbox-health` in project `fhir-ch`:

| record | value |
|---|---|
| `matchbox.health` A | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` |
| `www` CNAME | `ahdis.github.io.` |

Both are TTL 300, so a rollback to Squarespace propagates in five minutes.
The apex is served too — GitHub 301-redirects `matchbox.health` to the `www`
host named in `CNAME`.

A leftover `638pnhw7wxaatxmb5xhk` CNAME to `verify.squarespace.com` is still in
the zone. It is harmless; remove it once Squarespace is cancelled.

The repo is **public** because it has to be: the ahdis org is on the free plan,
which only serves Pages from public repos. `ahdis/matchbox` publishes its mkdocs
at `ahdis.github.io/matchbox/` with no CNAME, so there is no collision.

Note that `ahdis.github.io/matchbox.health/` no longer works — Pages redirects
it to the custom domain once one is set. That is unavoidable, not a bug.

## Licence

Apache-2.0 for the code. Site copy, logos and images are © ahdis ag.
