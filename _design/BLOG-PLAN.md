# Blog on www.matchbox.health — plan

Status: **implemented** in PR "Blog: generator, design, checks and the blog agent" (2026-10-16). This was
the plan; where the implementation differs, the section "Implemented differently" at the end says so. How to
write a post is in the README.

Goal: a blog for Matchbox **implementers**. Posts are written as Markdown, polished by an agent in
the pull request, and published by merging. Only developers write posts and there are no comments.

## 1. How publishing works today (verified 2026-10-16)

Pages is configured as `build_type: legacy`, with source `main` / `/` (root), CNAME `www.matchbox.health`.

1. A commit lands on `main` (here: a PR is merged).
2. GitHub starts the built-in workflow **`pages-build-deployment`**. It shows up in the Actions tab as
   "dynamic" and is not a file in this repo.
   - `build`: checks out `main`. Because of `.nojekyll`, Jekyll is skipped and the tree is used as is.
     The tree is packed as the `github-pages` artifact.
   - `deploy`: publishes the artifact to the Pages CDN.
   - The last runs took **27–28 s**.
3. `www.matchbox.health` is a CNAME to `ahdis.github.io`. The apex `matchbox.health` gets a 301 to `www`.
4. Responses carry **`cache-control: max-age=600`**, so a visitor or the edge cache can see the old page
   for up to 10 minutes after the deploy. There is no manual purge.
5. A failed build (for example `687ab41`, the `node_modules` symlink) leaves the **previous
   deployment live**. The failure shows up as a red run in Actions.
6. To check a deployment: `gh api repos/ahdis/matchbox.health/pages/builds/latest`, or `curl -I` the new URL.

Nothing is built at deploy time. Pages serves exactly what is committed. **The generated HTML of a post
must therefore be in the merged commit.** The plan keeps this model: the PR contains both the Markdown
and the generated HTML.

Found while checking:

- **HTTPS is not enforced** (`https_enforced: false`). `http://www.matchbox.health/` serves a 200 instead
  of redirecting. Fix: Settings → Pages → "Enforce HTTPS".
- **`main` is unprotected.** Fix: require a PR and the `build` check (see §4).
- Everything in the tree was served, including `_build/`, `_design/`, `_reference/` and `README.md`
  (`/_build/build.py` returned 200). **Fix (branch `serve-from-docs`):** the site moves to `docs/` and
  the Pages source moves to `main` / `/docs`. That is the only other folder a branch deploy can serve.
  The publish steps above stay the same, except that only `docs/` is packed. All paths below that
  start with `blog/`, `assets/`, `sitemap.xml` or `robots.txt` are under `docs/`.

## 2. The workflow

```
author                         agent (GitHub Action)              CI (check.yml)
──────                         ─────────────────────              ──────────────
copy _build/posts/_template.md
fill front matter + notes
open PR ───────────────────►  first pass (on "opened"):
                              rewrite for implementers,
                              python3 _build/build.py,
                              commit .md + HTML to the PR branch,
                              comment: summary + open questions ─► build is up to date?
                                                                  links resolve?
review, comment "@claude …" ►  iterate on the same branch ───────► screenshots 1440/390
approve + merge ─────────────────────────────────────────────────► pages-build-deployment → live (~30 s)
```

Decisions behind this:

- **One PR, not two.** The agent commits to the author's PR branch. Review and iteration happen in one
  place, and the agent's commit diff shows exactly what it changed in the draft (the original stays in
  git history). Authors are developers working on branches of this repo, not forks, so the workflow has
  access to the secrets.
- **The agent edits the Markdown and regenerates the HTML.** The build stays deterministic Python. The
  agent never writes HTML by hand.
- **Iterating:** a comment with `@claude` on the PR or on a line in the diff. If the author edits the
  Markdown directly, they run `npm run build` locally, or comment `@claude rebuild`.
- **Merge = publish.** There is no draft flag. A post that is not ready stays in its PR.

## 3. What gets built

### Authoring

```
_build/posts/_template.md                    the template (ignored by the build: leading underscore)
_build/posts/2026-09-26-matchbox-memory.md   a post: date + slug → /blog/2026/matchbox-memory/
assets/img/blog/2026/<slug>/…                images of a post
```

Template (sketch):

```markdown
---
title: ""                    # what an implementer gets, not a teaser
date: 2026-10-16
author: Oliver Egger
github: oliveregger
summary: ""                  # 1–2 sentences: blog list, feed, link previews
tags: [validation]           # validation, mapping, docker, performance, release, ai, …
matchbox: 4.1.18             # optional: the release this post is about
source: []                   # optional: URLs the agent should read (issues, PRs, another article)
original:                    # optional: URL where the post first appeared. Renders "Originally
                             # published on …" and points the canonical URL there (see §3)
---

<!-- Notes for the agent: audience, what must stay, what to cut. The agent removes this block. -->

## What changes for you
## How to use it
## Details
## Links
```

### Generator (`_build/build.py`, `_build/layout.py`)

- Read `_build/posts/*.md` (front matter + body) and render it with **markdown-it-py** plus
  **mdit-py-plugins** (tables, footnotes, heading anchors). Code is highlighted at build time with
  **Pygments** into CSS classes, with no JavaScript.
- Output:
  - `blog/<year>/<slug>/index.html` through the existing `page()`, with the same URL scheme as ahdis.ch
    (`/en/blog/2026/matchbox-memory` → `/blog/2026/matchbox-memory/`). This adds `og:type=article`,
    `article:published_time` and an author byline, and `localize()` still applies.
  - With `original:` set, the page shows "Originally published on [ahdis.ch](…) on 26 Sep 2026" under
    the byline, and `<link rel="canonical">` points to the original instead of matchbox.health.
    Search engines then treat ahdis.ch as the source of the text and do not count the copy as
    duplicate content. Such posts stay in the blog index and the feed but are left out of
    `sitemap.xml`. A sitemap should only list URLs that are their own canonical.
  - `blog/index.html`: the list of posts, newest first, with date, title, summary and tags.
  - `blog/feed.xml`: an Atom feed, built with the standard library.
  - `sitemap.xml`: **generated** from now on (today it is hand-written and would miss posts).
- "Blog" goes right after "Get Help", both in `NAV` (the header and the mobile menu) and in the first
  footer column (Commercial Support, Get Help, **Blog**, GitHub). It is the first internal nav item;
  the comment in `layout.py` that says otherwise gets updated.
- `requirements.txt` with exact versions. `npm run build` keeps working; `npm run setup` creates the venv.

### Design (`docs/assets/css/site.css`)

A post page in the matchbox look, not ahdis.ch: the type scale and colours from
`_design/DESIGN-NOTES.md` / `_design/tokens/`.

- Prose: H2/H3, lists, blockquote, inline code.
- **Tables**: the memory article has four- and five-column tables, so they scroll sideways at 390px
  and the header is a different colour.
- **Code blocks**: monospace, horizontal scroll, Pygments theme in the site colours, a language label.
- Byline (date · author · GitHub handle), tags, and a "matchbox 4.1.18" badge when `matchbox:` is set.
- Blog index: a simple list, no cards with images. Post images are optional.

### Checks

- `_design/tools/linkcheck.mjs`: crawl from the home page instead of the hard-coded `PAGES`, so posts
  are covered.

## 4. GitHub setup

| What | Where | Who |
|---|---|---|
| Enforce HTTPS | Settings → Pages | repo admin |
| Protect `main`: PR required, check `build` required | Settings → Rules | repo admin |
| Claude GitHub App + secret | `/install-github-app` in Claude Code, or by hand | repo admin |

**`.github/workflows/check.yml`** runs on `pull_request`:

1. Install Python and `requirements.txt`, run `python3 _build/build.py`, then `git diff --exit-code`.
   This fails if the committed HTML is not what the sources produce.
2. Serve the tree and run `linkcheck.mjs` (Playwright is already a dev dependency).
3. Screenshot each new or changed post at 1440px and 390px, and upload the screenshots plus the built
   site as a workflow artifact. This is the preview, since Pages has no per-PR previews. For the real
   thing: `gh pr checkout <n> && npm run serve`.

**`.github/workflows/claude.yml`** uses
[`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action):

- On `pull_request` `opened` / `ready_for_review` with paths `_build/posts/**`: the first pass, with the
  prompt `/matchbox-blog <changed post>`. It does **not** run on `synchronize`, so later pushes do not
  start it again. The action also rejects bot actors by default, so the agent cannot trigger itself.
- On `issue_comment` / `pull_request_review_comment` containing `@claude`: iterating. By default the
  action only reacts to users with write access.
- Model `claude-opus-5-5`. Allowed tools are limited to editing files under `_build/posts/` and
  `assets/img/blog/`, running `python3 _build/build.py`, `git add/commit/push`, and WebFetch for the
  `source:` URLs.
- It pushes with the **Claude GitHub App token, not `GITHUB_TOKEN`**. Pushes made with `GITHUB_TOKEN` do
  not start other workflows, so `check.yml` would never run on the agent's commits and the required
  check would stay pending.
- **Auth: the subscription token of Oliver Egger.** Run `claude setup-token` locally, which creates a
  long-lived OAuth token (supported on Pro, Max, Team and Enterprise), store it as the repository secret
  `CLAUDE_CODE_OAUTH_TOKEN`, and pass it as `claude_code_oauth_token`. `/install-github-app` does all of
  this. Runs count against that subscription's usage limits, including runs started by colleagues'
  PRs, and nothing is billed through the API. Because the token belongs to one person, it stays a
  repository secret, not an organization secret, and has to be replaced if that person leaves or the
  plan changes.

### The agent's instructions

- `CLAUDE.md` (new): how the site is built, "never edit generated HTML", how to build and check.
- `.claude/skills/matchbox-blog/SKILL.md`: the editorial rules. The same skill works locally in VS Code
  and in the Action.
  - Readers are implementers and operators: lead with what changes for them (defaults, configuration,
    API, upgrade steps), then the details, and keep the story short.
  - Every command and configuration block must be runnable as written. Use exact versions, and link
    the release, issue and PR.
  - Keep measured numbers and claims exactly as in the source. Invent nothing; when something is
    missing, ask in the PR comment.
  - No marketing tone. Write "Matchbox" in prose and HL7® FHIR® on first use.
  - When the post is adapted from another article, link the original once.
  - Finish with `python3 _build/build.py`, a commit, and a PR comment listing what changed and the open
    questions.

## 5. The prototype: the memory article

Source: [ahdis-blog/202609-matchbox-memory.md](https://github.com/ahdis/ahdis-blog/blob/main/202609-matchbox-memory.md),
on ahdis.ch since 2026-09-26 at <https://www.ahdis.ch/en/blog/2026/matchbox-memory>.

**The text stays as it is: same order, same wording.** Only the look changes, to the matchbox design.

- URL `/blog/2026/matchbox-memory/`, the same slug as on ahdis.ch.
- Front matter instead of the first two lines: the `# Title` becomes `title:`, and
  "Sep 26, 2026 · @Oliver Egger" becomes `date:`, `author:` and `github:`.
- `original: https://www.ahdis.ch/en/blog/2026/matchbox-memory`, which renders "Originally published
  on ahdis.ch" and sets the canonical URL.
- The tables and the `docker run` block get the matchbox table and code styles. This makes the post a
  good test of the design, since it has two wide tables, inline code, a code block and nested links.

It doubles as the **end-to-end test of the pipeline**. Open a PR with a filled-in template (front
matter, the article text pasted in, and the note "keep the text unchanged"), let the
agent turn it into the post, iterate once with `@claude`, merge, and check that it is live.

## 6. Order of work

| # | Step | Result |
|---|---|---|
| 0 | Repo settings: HTTPS, rules, Claude app + secret | admin, before step 3 is merged |
| 1 | Generator, CSS, index, feed, sitemap, nav, `requirements.txt`, README section, written locally with a hand-written sample post | PR 1: review the look locally |
| 2 | `check.yml` + crawling linkcheck | in PR 1 |
| 3 | `CLAUDE.md`, `matchbox-blog` skill, `_template.md`, `claude.yml` | PR 2 |
| 4 | The memory article through the pipeline | PR 3, merged = first post live |

## Decisions (2026-10-16)

- Only developers write posts; there are no comments.
- Agent auth: Oliver Egger's Claude subscription token (`CLAUDE_CODE_OAUTH_TOKEN`).
- URLs as on ahdis.ch: `/blog/<year>/<slug>/`.
- "Blog" comes right after "Get Help", in the header and in the footer.
- The prototype is the ahdis.ch article unchanged, with "Originally published on ahdis.ch" and
  the canonical URL pointing to ahdis.ch.

## Open points

- Later, if posts are ever written outside a developer setup: switch Pages to "GitHub Actions" as the
  source and stop committing generated HTML. That is not needed now.

## Implemented differently

- **One PR for steps 1–3.** `claude.yml` has to be on `main` before it can run: the action only gets the
  Claude App token when the workflow file is identical to the copy on the default branch.
- **"Blog" appears in the nav only once there is a post.** Merging the infrastructure therefore changes
  nothing visible on the site; the first post brings the nav item, `/blog/` and the feed with it.
- **The agent cannot read private sources.** `ahdis/ahdis-blog` is private, and `WebFetch` returns a summary,
  not the exact text. To republish an article, the author pastes the Markdown into the post; `source:` is for
  public pages the agent should read.
- **The link check crawls** from the home page instead of reading a page list from the build.
- `test-consent.mjs` and `linkcheck.mjs` now exit non-zero on failure, so CI can rely on them.
- Actions are pinned to exact releases at least two weeks old, e.g. `anthropics/claude-code-action@v1.0.239`.
