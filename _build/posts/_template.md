---
# Copy to _build/posts/YYYY-MM-DD-<slug>.md. The date in the file name must match
# `date:`, and the post is published at /blog/<year>/<slug>/.
title: ""                  # what an implementer gets, not a teaser
date: 2026-01-01
author: ""                 # full name
github: ""                 # GitHub handle, without @
summary: ""                # 1-2 sentences: blog list, feed and link previews
tags: []                   # e.g. validation, mapping, docker, performance, release, terminology, ai
matchbox: ""               # optional: the Matchbox release the post is about, e.g. 4.1.18
original: ""               # optional: URL where the post first appeared. Renders "Originally
                           # published on ..." and points the canonical URL there.
source: []                 # optional, for the agent: URLs to read (issues, PRs, an article)
---

<!--
Notes for the agent. Say who the post is for, what must stay as it is, and what
to cut or add. HTML comments never reach the site. The agent removes this block.

If the post is ready as you wrote it, say so ("only check and build"); the agent
then fixes the format and links but leaves the text alone.
-->

## What changes for you

## How to use it

```bash
docker run -d --name matchbox -p 8080:8080 europe-west6-docker.pkg.dev/ahdis-ch/ahdis/matchbox:latest
```

## Details

## Links
