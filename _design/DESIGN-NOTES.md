# What was measured, and what it means

Everything in `assets/css/site.css` came from the live Squarespace site rather
than from its 1.3 MB theme bundle. This file records the findings that were not
obvious, so the next person does not have to re-derive them.

Tools are in `_design/tools/`. The loop that mattered: `compare.mjs` for page
heights, `diff.mjs` for per-landmark x/width/y/height/font-size against the
live page, matched **by text** rather than by selector.

---

## 1. The type scale switches units at the breakpoint

`font-size = 16px + N x unit`, and **N is the same in both regimes** — only the
unit changes:

| | below 768px | 768px and above |
|---|---|---|
| unit | `vmax` | `vw` |

So one custom property flips the whole scale:

```css
:root { --u: 1vmax; }
@media (min-width: 768px) { :root { --u: 1vw; } }
```

The coefficients, fitted across 390/480/767/768/1024/1280/1440/1920 with
**zero residual**:

| role | N | line-height | used by |
|---|---|---|---|
| `--fs-hero` | 0.48 | 1.3776 | the three hero paragraphs |
| `--fs-display` | 1.80 | 1.5 (p) / 1.316 (h2) | "Product Features", the tagline, "Features in Detail" |
| `--fs-title` | 1.08 | 1.5 | feature-card descriptions |
| `--fs-card` | 0.84 | 1.361 | features-page card titles, the policy title |
| `--fs-body` | 0.12 | 1.5 | body copy, footer, most buttons |
| policy `h4` | 0.24 | 1.389 | privacy policy sub-headings only |
| nav, hero button | fixed 16px | | |

**This is the finding that would otherwise have caused permanent mobile drift.**
`vw` and `vmax` are identical at 1440x900, so measuring only at that viewport
cannot tell them apart. They were separated by holding the width and varying
the viewport height (`probe-vmax.mjs`): at 390px wide, body copy is 17.0128px on
an 844-tall viewport and 17.08px on a 900-tall one.

The mobile values are exactly the desktop formula evaluated at 900px, which is a
useful cross-check: 0.48 x 9 + 16 = 20.32, and so on.

## 2. Section padding is vmax at *every* width; header padding is vw

Confirmed on a tall viewport where the two disagree (`probe-units.mjs`):

| | value |
|---|---|
| hero content | `3.3vmax` |
| product-features section | `4vmax` top, `8vmax` bottom |
| tagline band | `2.2vmax` |
| footer | `1vmax` |
| features panel, policy | `6.6vmax` |
| header | `2.7vw` desktop, `6vw` mobile |

## 3. Two different breakpoints

- **768px** — type scale unit, `content-width--medium`, column stacking.
- **800px** — the header swaps to its desktop layout (logo 121x51 -> 258x109,
  plus-button -> inline nav).

They really are different; both were measured.

## 4. Gutters

`5vw` at 768px and up, `6vw` below — **except** the product-features list, which
keeps `5vw` at every width, and the features page's inset panel background,
which is `5vw` everywhere too.

## 5. The classic 12-column row

Squarespace's classic layout is a row with `margin: 0 -17px` whose blocks each
carry `17px` of padding. Reproducing that inset makes every measured column
width fall out exactly, so it is kept rather than approximated:

- hero: `3fr 1fr 8fr` (image / spacer / text)
- privacy policy: `5fr 1fr 6fr` (title / spacer / prose)
- tagline logo: a `col-2` centred by two `col-5` spacers, i.e. `width: 100%/6`
  of the row box — note the row box **already** includes the 34px, so adding it
  again makes the logo 5px too wide.

Empty spacer blocks that the original emits between sections collapse to nothing
on mobile; they are replaced here by explicit margins (68px on the features
page) rather than emitted as empty elements.

## 6. Things that look like bugs and are not

- **An image block sits one body line-height below the top of its own block.**
  27px at 1440, 25.6px at 390 — exactly `1.5 x --fs-body` at both. It applies to
  the hero image and to the features-page cards.
- **The palette names lie.** `--black` is `rgb(90,114,138)`, a slate blue used
  for body copy on white; `--accent` is the teal `rgb(97,162,171)`.
- **Sections are transparent.** `<section>` computes to `rgba(0,0,0,0)`; the
  colour is painted by a `.section-background` child. Same for the header band
  (`div.header-background-solid`).
- **Section padding is asymmetric on the hero** — 234px top vs 48px bottom at
  1440 — because the transparent header's height is added to the top.
- **The menu control is a plus, not a hamburger** (`header-menu-icon-plus`),
  rotating 45deg into a cross. With the overlay open the header band goes
  transparent, so the logo's dark wordmark disappears into the dark ground and
  only the mint lizard shows. That is the original's behaviour, reproduced.
- **`overflow-wrap: break-word`** is load-bearing. The narrow feature cards break
  "implementations" mid-word; without it the line count, and every height below
  it, is wrong.

## 7. Two traps that cost real time here

**The archived font set contains italics labelled as normal.** Each weight of
Poppins is delivered twice under identical `font-family`/`font-weight`/
`font-style: normal` declarations, and one of each pair is the *italic* cut.
Picking by declaration order gives the wrong face for weight 500 — the weight
used by every heading, nav item and button. The faces were checked by rendering
(`fonttest.mjs`); the upright ones are:

| weight | latin | latin-ext |
|---|---|---|
| 400 | `da0c3c0d` | `d03c0883` |
| 500 | `abb8d202` | `106cf02d` |
| 700 | `95402d3d` | `ab5cf469` |

**Forcing `opacity: 1` to defeat the scroll animation corrupts colour readings.**
Capturing a screenshot with `.preFade { opacity: 1 !important }` catches elements
mid-transition and reports blended colours — it suggested a card background of
`rgb(161,218,193)` and an icon of `rgb(89,120,136)`, neither of which exists.
Left to animate naturally, the same card is exactly `rgb(151,214,186)` and
`rgb(61,92,115)`. The override is fine for **geometry** and wrong for **colour**.

## 8. Images

All three content images are circles: the hero GIF via an SVG `clipPath`
(`clipPathUnits="objectBoundingBox"`, a two-arc circle) and the two feature
icons via `border-radius: 50%`. `border-radius: 50%` reproduces both. The PNGs
are opaque squares with the pale mint baked in, so without the clip they render
as pale squares.

Three uploads share the name `matchbox_logo_color.png` under different UUIDs;
two are byte-identical and the third differs only in the RGB beneath fully
transparent pixels. The two feature icons appear twice each (home and features)
and are pixel-identical, so one file each is shipped. Archived files are keyed by
asset UUID for exactly this reason.

The hero GIF is animated; `gif2webp` preserved all 4 frames (verified by frame
count) and the GIF ships as the `<picture>` fallback.

## 9. Where the rebuild deliberately differs

- The footer's second link column drops an **empty anchor to squarespace.com**
  that renders as a blank line in the original. That makes the footer 27px
  shorter than live on both breakpoints, which is the whole of the remaining
  home/features delta.
- The privacy policy is longer because its text was amended — see
  `PRIVACY-REVIEW.md`. Geometry matches exactly; only content height differs.
- `/home` was an alias of `/` on the original (same canonical, identical body)
  and is not reproduced. `/cart` was a commerce stub and is not ported.
