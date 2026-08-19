"""Shared chrome for every page. Kept in one place so the header, footer and
consent banner cannot drift between the generated files.

The nav is entirely external on this site -- matchbox.health links out to
ahdis.ch, GitHub and the test server, and has no internal nav items at all.
"""

NAV = [
    ("Get Help", "https://www.ahdis.ch/en/home"),
    ("GitHub", "https://github.com/ahdis/matchbox"),
    ("Test Server", "https://test.ahdis.ch/matchboxv3/"),
    ("Documentation", "https://ahdis.github.io/matchbox/"),
    ("Contact", "https://www.ahdis.ch/en/contact"),
]

# Footer link columns, exactly as the original groups them.
FOOTER_COLS = [
    [("Commercial Support", "https://www.ahdis.ch/en/home"),
     ("Get Help", "https://www.ahdis.ch/en/home"),
     ("GitHub", "https://github.com/ahdis/matchbox")],
    [("Test Server", "https://test.ahdis.ch/matchboxv3/"),
     ("Documentation", "https://ahdis.github.io/matchbox/"),
     ("Contact", "https://www.ahdis.ch/en/contact"),
     ("Privacy Policy", "/privacy-policy")],
]

SOCIAL = [
    ("Email ahdis", "mailto:info@ahdis.ch",
     "M2 4h20v16H2V4zm10 7L3.5 5.5v.2L12 12l8.5-6.3v-.2L12 11z"),
    ("ahdis on X", "https://x.com/oliveregger",
     "M18.9 2H22l-7 8 8.2 12h-6.4l-5-7.3-5.8 7.3H2.9l7.5-8.6L2.5 2H9l4.6 6.7L18.9 2zm-1.1 18h1.8L7.3 3.8H5.4L17.8 20z"),
    ("ahdis on LinkedIn", "https://www.linkedin.com/company/ahdis-ag/",
     "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05C21.6 8.65 23 10.9 23 14.3V21h-4v-6c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9z"),
    ("ahdis on YouTube", "https://www.youtube.com/@ahdis-ch",
     "M23 12s0-3.6-.46-5.33a2.77 2.77 0 0 0-1.95-1.96C18.86 4.25 12 4.25 12 4.25s-6.86 0-8.59.46A2.77 2.77 0 0 0 1.46 6.67C1 8.4 1 12 1 12s0 3.6.46 5.33c.26.95 1 1.7 1.95 1.96 1.73.46 8.59.46 8.59.46s6.86 0 8.59-.46a2.77 2.77 0 0 0 1.95-1.96C23 15.6 23 12 23 12zM9.75 15.27V8.73L15.5 12l-5.75 3.27z"),
    ("ahdis on GitHub", "https://github.com/ahdis",
     "M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"),
    ("ahdis website", "https://www.ahdis.ch/en/home",
     "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.9 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14A8.06 8.06 0 0 1 4 12c0-.69.1-1.36.26-2h3.38a16.6 16.6 0 0 0 0 4H4.26zm.84 2h2.95c.33 1.27.8 2.47 1.38 3.56A7.99 7.99 0 0 1 5.1 16zm2.95-8H5.1a7.99 7.99 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.05 8zM12 19.96A13.9 13.9 0 0 1 10.09 16h3.82A13.9 13.9 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.23 5.56c.58-1.09 1.05-2.29 1.38-3.56h2.95a7.99 7.99 0 0 1-4.33 3.56zM16.36 14a16.6 16.6 0 0 0 0-4h3.38c.17.64.26 1.31.26 2 0 .69-.1 1.36-.26 2h-3.38z"),
]

SITE = "https://www.matchbox.health"


def rel(href, base):
    """Rewrite a site-root href to one relative to the current page, so the
    site also renders correctly under ahdis.github.io/<repo>/."""
    if not href.startswith("/"):
        return href
    tail = href.lstrip("/")
    if not tail:
        return base or "./"
    # a trailing slash only for directory-style paths, never for files
    is_file = "." in tail.rsplit("/", 1)[-1]
    return base + tail + ("" if is_file or tail.endswith("/") else "/")


def _link(label, href, base, extra=""):
    h = rel(href, base)
    ext = ' target="_blank" rel="noopener"' if h.startswith("http") else ""
    return f'<a href="{h}"{ext}{extra}>{label}</a>'


def header(base=""):
    items = "\n".join(f"          <li>{_link(l, h, base)}</li>" for l, h in NAV)
    return f"""  <header class="header">
    <div class="header__inner">
      <a class="header__logo" href="{base or './'}" aria-label="matchbox.health home">
        <img src="{base}assets/img/matchbox-logo.webp" width="725" height="306" alt="matchbox">
      </a>
      <button class="header__toggle" type="button" aria-expanded="false"
              aria-controls="site-menu" aria-label="Open Menu">
        <span class="header__toggle-icon" aria-hidden="true"></span>
      </button>
      <nav class="header__nav" aria-label="Main">
        <ul>
{items}
        </ul>
      </nav>
    </div>
  </header>

  <div class="menu" id="site-menu" hidden>
    <nav class="menu__nav" aria-label="Main">
      <ul>
{items}
      </ul>
    </nav>
  </div>"""


def social_row(indent="            ", base=""):
    return "\n".join(
        f'{indent}<a href="{href}" aria-label="{label}"'
        + (' target="_blank" rel="noopener"' if href.startswith("http") else "")
        + f'><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="{d}"/></svg></a>'
        for label, href, d in SOCIAL)


def footer(base=""):
    cols = "\n".join(
        "        <ul>\n"
        + "\n".join(f"          <li>{_link(l, h, base)}</li>" for l, h in col)
        + "\n        </ul>"
        for col in FOOTER_COLS)
    return f"""  <footer class="footer">
    <div class="footer__grid">
      <div class="footer__brand">
        <div class="block footer__logo-block">
          <a class="footer__logo" href="https://ahdis.ch/en/" target="_blank" rel="noopener">
            <img src="{base}assets/img/ahdis-logo.webp" width="1004" height="295" alt="ahdis ag">
          </a>
        </div>
        <div class="block">
          <address class="footer__address">
            ahdis ag<br>c/o Impact Hub Z&uuml;rich<br>Sihlquai 131<br>8005 Z&uuml;rich<br>Switzerland
          </address>
        </div>
        <div class="block">
          <nav class="footer__social" aria-label="ahdis on other services">
{social_row(base=base)}
          </nav>
        </div>
        <div class="block">
          <p class="footer__copy">&copy; ahdis ag</p>
        </div>
      </div>
      <nav class="footer__links" aria-label="Footer">
{cols}
      </nav>
    </div>
  </footer>

  <div class="consent" role="region" aria-label="Cookie notice" hidden>
    <p>We use Google Analytics to understand how this site is used. Analytics
       cookies are only set if you agree. See our
       <a href="{rel('/privacy-policy', base)}">Privacy Policy</a>.</p>
    <div class="consent__actions">
      <button type="button" class="consent__accept">Accept</button>
      <button type="button" class="consent__deny">Decline</button>
    </div>
  </div>"""


def page(title, description, body, canonical="/", base="", indexable=True):
    canon = (f'<link rel="canonical" href="{SITE}{canonical}">' if indexable
             else '<meta name="robots" content="noindex">')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
{canon}
<meta property="og:site_name" content="matchbox.health">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{canonical}">
<meta property="og:image" content="{SITE}/assets/img/matchbox-logo.webp">
<meta property="og:image:width" content="725">
<meta property="og:image:height" content="306">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}assets/img/favicon.ico" sizes="any">
<link rel="preload" as="font" type="font/woff2" href="{base}assets/fonts/poppins-400-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="{base}assets/fonts/poppins-500-latin.woff2" crossorigin>
<link rel="stylesheet" href="{base}assets/css/site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to Content</a>
{header(base)}
<main id="main">
{body}
</main>
{footer(base)}
<script src="{base}assets/js/site.js" defer></script>
</body>
</html>
"""


NOTFOUND_SCRIPT = """<script>
// On the custom domain the root-absolute href above is already right. On the
// ahdis.github.io preview the site lives under /<repo>/, so point at that
// instead -- without this the only link on the page leaves the project.
(function () {
  if (!location.hostname.endsWith("github.io")) return;
  var repo = location.pathname.split("/")[1];
  if (repo) document.getElementById("home").href = "/" + repo + "/";
}());
</script>"""


def standalone(title, description, css):
    """A page that must render correctly at ANY depth: GitHub Pages serves
    404.html for every missing path, so it can carry no relative asset links.
    Everything it needs is inlined; the fonts are the one root-absolute
    reference and degrade to the fallback stack when they cannot be reached."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/img/favicon.ico" sizes="any">
<style>
{css}
</style>
</head>
<body class="notfound-page">
<main>
  <h1>Page not found</h1>
  <p>The page you asked for is not here. It may have moved when this site was
     rebuilt.</p>
  <p><a class="button" id="home" href="/">Back to Overview</a></p>
</main>
{NOTFOUND_SCRIPT}
</body>
</html>
"""
