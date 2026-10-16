---
name: matchbox-blog
description: Turn a draft blog post in _build/posts/ into a finished post for www.matchbox.health - check and complete the front matter, edit the text for Matchbox implementers (or leave it unchanged when the notes say so), build the site, commit to the PR branch and report in the PR. Use for a new or changed post in a pull request, when asked to write, edit, polish, republish or rebuild a blog post, or when invoked as /matchbox-blog <owner/repo/pull/N>.
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Bash(python3 _build/build.py), Bash(git:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr comment:*)
---

# Write a matchbox.health blog post

Posts live in `_build/posts/YYYY-MM-DD-<slug>.md` and are published at `/blog/<year>/<slug>/` when the PR is
merged. `_build/posts/_template.md` shows every field. The site is built by `python3 _build/build.py` into
`docs/`, which is what GitHub Pages serves, so **the generated files are committed together with the post**.

## 1. Find the post

With a PR argument (`owner/repo/pull/N`), the posts are the files the PR changes:

```bash
git diff --name-only origin/main...HEAD -- _build/posts/
```

Ignore `_template.md`. Read each post completely, including the HTML comment with **notes for the agent**: they
override the defaults below (for example "keep the text unchanged", "only check and build", who the post is for).

## 2. Front matter

| Field | Rule |
| --- | --- |
| `title` | Required. If the draft starts with a `# Title` line instead, move it here and delete the line. Quote it when it contains `:`. |
| `date` | Required, `YYYY-MM-DD`, and **must match the file name**. If the draft has a byline like "Sep 26, 2026 · @Name", use that date, rename the file to match (`git mv`), and delete the byline line. |
| `author`, `github` | Full name, and the GitHub handle without `@`. |
| `summary` | Required. 1–2 sentences, used in the blog list, the feed and link previews. Factual, taken from the post. |
| `tags` | A few lowercase tags, reusing the ones existing posts use (validation, mapping, docker, performance, release, terminology, ai). |
| `matchbox` | The release the post is about, if there is one (e.g. `4.1.18`). |
| `original` | The URL where the post first appeared, if it was published elsewhere first. The build then shows "Originally published on …" and points the canonical URL there. |
| `source` | URLs the author gave you to read. Keep the field; it is not rendered. |

Empty optional fields (`""`, `[]`) can be removed.

## 3. The text

Readers are **implementers and operators**: they deploy Matchbox, configure it, and integrate it.

Unless the notes say to keep the text as it is:

- Lead with what changes for the reader: defaults, configuration, API, upgrade steps. Then the details. Keep the
  story short.
- Every command and configuration block must work as written: exact image names, versions, flags. Use a fenced
  block with a language (`bash`, `yaml`, `json`, `xml`, `properties`).
- Link the release, the issue and the PR when a change is mentioned.
- No marketing tone, no superlatives. Plain, specific sentences. Write "Matchbox" in prose and HL7® FHIR® on
  first use.
- `##` for sections, `###` below them. No `#` heading: the title comes from the front matter.

Always, also when the text stays unchanged:

- **Keep every number, measurement and claim exactly as in the source.** Never invent a figure, a version, a
  link or a quote. If something is missing or contradictory, leave it and ask in the PR comment.
- Do not change the meaning of a sentence the author wrote. Corrections of obvious typos are fine; list them.
- Check that links are well-formed. A link to `https://www.matchbox.health/...` may become a site path
  (`/blog/`, `/features/`).
- Images go to `docs/assets/img/blog/<year>/<slug>/` and are referenced as `/assets/img/blog/<year>/<slug>/<file>`
  with a meaningful alt text.
- Delete the notes-for-the-agent comment once you have acted on it (the build strips comments anyway).

Sources: `WebFetch` returns a summary of a page, not its exact text. To republish an article word for word, the
author has to paste it into the post; ask for that in the PR comment instead of reconstructing it from a summary.

## 4. Build

```bash
python3 _build/build.py
```

It fails with a clear message on a broken post (missing field, date and file name differ, a `#` title). Fix the
post and run it again. Never edit files in `docs/` by hand; they are overwritten by the build.

## 5. Commit and report

Commit the post, any images and the generated `docs/` changes together on the PR branch, and push:

```bash
git add _build/posts docs
git commit -m "Blog: <title>"
git push
```

Then comment on the PR (`gh pr comment <N> --body ...`) with:

- what you changed, as a short list (front matter, edits, renamed file, typo fixes),
- what you left unchanged on purpose,
- open questions for the author, if any,
- the URL the post will have: `https://www.matchbox.health/blog/<year>/<slug>/`.

When you were started by an `@claude` comment, do what the comment asks, then build, commit, push and reply the
same way. `@claude rebuild` means: run the build, commit the generated files, push.
