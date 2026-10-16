# www.matchbox.health

Static rebuild of the Squarespace 7.1 site for **matchbox**, ahdis's open-source
FHIR validation and mapping server, ready to serve from GitHub Pages.

Plain HTML, CSS and one small script. No Jekyll, no Actions, no build step at
serve time — the generated pages are committed.

```
docs/        the published site — the only directory GitHub Pages serves
  index.html  features/  privacy-policy/  404.html
  assets/     css, js, images, webfonts
  CNAME  robots.txt  sitemap.xml  .nojekyll
_build/      the generator (shared chrome + page bodies)
_design/     measurement tools, design notes, privacy review
_reference/  the archived Squarespace original
```

Everything outside `docs/` stays in the repo and is not served on the site.

## Working on it

```sh
python3 _build/build.py             # regenerate the pages  (npm run build)
python3 -m http.server 8081 -d docs # serve locally         (npm run serve)
```

Edit `_build/`, `docs/assets/css/site.css` or `docs/assets/js/site.js` —
**never** the generated `docs/index.html`, `docs/features/index.html`,
`docs/privacy-policy/index.html` or `docs/404.html`, which are overwritten on
every build.

`docs/.nojekyll` tells GitHub Pages to serve the folder as it is, without
running Jekyll.

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
