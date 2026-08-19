#!/usr/bin/env python3
"""Generates the static pages from shared chrome plus per-page bodies.
Output is plain HTML that GitHub Pages serves as-is (no Jekyll, no Actions)."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layout import page, rel, standalone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))

def read(name):
    return open(os.path.join(HERE, 'content', name), encoding='utf-8').read()

EXT = ' target="_blank" rel="noopener"'

# --------------------------------------------------------------------------
# Home
# --------------------------------------------------------------------------
home_body = f"""  <section class="section section--dark hero">
    <div class="wrap wrap--medium hero__inner">
      <div class="row hero__row">
        <div class="block block--flush-x hero__figure">
          <div class="hero__media">
            <picture>
              <source srcset="/assets/img/hero-icons.webp" type="image/webp">
              <img src="/assets/img/hero-icons.gif" width="1500" height="1500"
                   alt="Animated matchbox icons">
            </picture>
          </div>
        </div>
        <div class="hero__spacer"></div>
        <div class="hero__col">
          <div class="block hero__text">
            <div class="hero__prose">
            <h1 class="visually-hidden">matchbox</h1>
              <p class="hero__lede">Matchbox is an open source initiative to support testing and
                implementation of FHIR-based solutions and to map or capture health data into
              <a href="https://www.hl7.org/fhir/"{EXT}>HL7&reg; FHIR&reg;</a>, the standard for
                healthcare interoperability.</p>
              <p class="hero__lede">Matchbox can be deployed as a microservice in your IT
                infrastructure.</p>
              <p class="hero__lede">The software is licensed under the business-friendly
                <a href="https://github.com/ahdis/matchbox/blob/main/LICENSE"{EXT}>Apache Software
                License 2.0</a> and is based on the
                <a href="https://hapifhir.io"{EXT}>HAPI FHIR</a> project.</p>
            </div>
          </div>
          <div class="block hero__cta-block">
            <p><a class="button" href="https://www.ahdis.ch/en/contact"{EXT}>Contact Us</a></p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--white list-section">
    <div class="list__head"><h2 class="list__title">Product Features</h2></div>
    <ul class="list">
      <li class="list__item">
        <div class="list__media">
          <img src="/assets/img/icon-validation.webp" width="720" height="720"
               alt="Validation of FHIR implementations" loading="lazy">
        </div>
        <p class="list__desc">Validation of FHIR implementations</p>
      </li>
      <li class="list__item">
        <div class="list__media">
          <img src="/assets/img/icon-mapping.webp" width="720" height="720"
               alt="Mapping health data to and from FHIR" loading="lazy">
        </div>
        <p class="list__desc">Mapping health data to and from FHIR using the FHIR mapping
          language</p>
      </li>
    </ul>
    <div class="list__cta">
      <a class="button button--fluid button--dark" href="/features">Features in Detail</a>
    </div>
  </section>

  <section class="section section--mint band">
    <div class="wrap">
      <div class="row">
        <div class="band__logo">
          <img src="/assets/img/matchbox-logo.webp" width="725" height="306" alt="matchbox"
               loading="lazy">
        </div>
        <div class="band__head">
          <h2 class="band__title">Your tooling for FHIR-based interoperability</h2>
        </div>
      </div>
    </div>
  </section>"""

# --------------------------------------------------------------------------
# Features. Source order is the MOBILE order -- image first in both cards; the
# desktop image-left/image-right alternation is done with flex direction only.
# --------------------------------------------------------------------------
CARDS = [
    ("icon-validation", "Validation of FHIR implementations",
     '<p>Need to test your FHIR implementation for correctness? FHIR '
     f'<a href="https://hl7.org/fhir/implementationguide.html"{EXT}>implementation guides</a> '
     'have different requirements on your implementation. From country-specific adaptations '
     f'(e.g. <a href="http://fhir.ch"{EXT}>Swiss FHIR specifications</a>), to requirements for '
     'specific use cases like the '
     f'<a href="http://hl7.org/fhir/uv/ips/"{EXT}>International Patient Summary (IPS)</a>, or your '
     'own organization&rsquo;s internal FHIR implementation guide. You can configure Matchbox to '
     'meet your requirements, and validate your FHIR resources directly with an API during testing '
     'or in production. Validation is based on the official '
     f'<a href="https://github.com/hapifhir/org.hl7.fhir.core"{EXT}>HL7 Java reference validator</a> '
     'in accordance with the provided terminologies. An external terminology server can also be '
     'configured, and you can validate your implementation through the open FHIR API or through a '
     'simple GUI. Matchbox can also be integrated with '
     f'<a href="https://gazelle.ihe.net/EVSClient/home.seam"{EXT}>EVS Client</a>, the validation '
     f'tool from <a href="https://www.ihe.net"{EXT}>IHE</a> that is used during Connectathons.</p>'),
    ("icon-mapping", "Mapping health data to and from FHIR using the FHIR mapping language",
     '<p>Need to map your health data into FHIR and want to share your mapping to FHIR in a '
     f're-usable way? The <a href="https://www.hl7.org/fhir/mapping-language.html"{EXT}>FHIR '
     'mapping language</a> allows you to define mapping in a text representation and transform '
     f'them to FHIR <a href="https://www.hl7.org/fhir/structuremap.html"{EXT}>StructureMap</a> '
     'resources. Those resources can then be provided in FHIR implementation guides. Matchbox '
     'applies the mapping to your own data to create FHIR-compatible data sets. It also checks '
     'that the mapping conforms with the included validation stack. In Switzerland, this approach '
     'is tested with mapping between CDA and FHIR exchange formats for medication '
     f'(<a href="http://fhir.ch/ig/cda-fhir-maps/index.html"{EXT}>CDA-FHIR-Maps</a>).</p>'),
]

def card(i, img, title, prose):
    mirrored = ' card--mirrored' if i % 2 else ''
    return f"""        <div class="card{mirrored}">
          <figure class="card__figure">
            <div class="card__media">
              <img src="/assets/img/{img}.webp" width="720" height="720" alt="" loading="lazy">
            </div>
            <figcaption class="card__body">
              <h3 class="card__title">{title}</h3>
              <div class="card__prose">{prose}</div>
            </figcaption>
          </figure>
        </div>"""

cards = "\n".join(card(i, *c) for i, c in enumerate(CARDS))

features_body = f"""  <section class="section panel">
    <div class="panel__inner">
      <div class="wrap--medium panel__content">
        <div class="row">
          <div class="panel__head"><h1 class="panel__title">Features in Detail</h1></div>
{cards}
          <div class="panel__cta">
            <a class="button button--onteal" href="/">Back to Overview</a>
          </div>
        </div>
      </div>
    </div>
  </section>"""

# --------------------------------------------------------------------------
privacy_body = f"""  <section class="section section--white policy">
    <div class="wrap policy__inner">
      <div class="row policy__row">
        <div class="block policy__head">
          <h1 class="policy__title">Privacy Policy</h1>
        </div>
        <div class="policy__spacer"></div>
        <div class="block prose">
{read('privacy-policy.html')}
        </div>
      </div>
    </div>
  </section>

  <!-- an empty mint band the original places between the policy and the footer -->
  <section class="section section--mint band-empty"></section>"""

# --------------------------------------------------------------------------
def localize(html, base):
    """Rewrite site-root href/src/srcset in a body to be relative to its page,
    so the site also renders under ahdis.github.io/<repo>/."""
    return re.sub(r'(href|src|srcset)="(/[^"]*)"',
                  lambda m: f'{m.group(1)}="{rel(m.group(2), base)}"', html)

PAGES = [
    ('index.html', 'matchbox.health',
     'Matchbox is an open source initiative to support testing and implementation of FHIR-based '
     'solutions and to map or capture health data into HL7 FHIR.', home_body, '/'),
    ('features/index.html', 'Features &mdash; matchbox.health',
     'Validation of FHIR implementations and mapping health data to and from FHIR using the FHIR '
     'mapping language.', features_body, '/features'),
    ('privacy-policy/index.html', 'Privacy Policy &mdash; matchbox.health',
     'How ahdis collects and processes personal data on www.matchbox.health.',
     privacy_body, '/privacy-policy'),
]

for name, title, desc, body, canonical in PAGES:
    base = '../' * name.count('/')
    out = page(title, desc, localize(body, base), canonical, base=base)
    dest = os.path.join(ROOT, name)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)
    print(f"  {name:28} {len(out):7} bytes")
# 404.html is generated separately -- see layout.standalone().
NOTFOUND_CSS = """
@font-face { font-family: Poppins; font-weight: 400; font-display: swap;
  src: url(/assets/fonts/poppins-400-latin.woff2) format("woff2"); }
@font-face { font-family: Poppins; font-weight: 500; font-display: swap;
  src: url(/assets/fonts/poppins-500-latin.woff2) format("woff2"); }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: flex; align-items: center;
  justify-content: center; padding: 6vmax 6vw; text-align: center;
  background: #3d5c73; color: #fff;
  font-family: Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: calc(16px + 0.12 * 1vmax); line-height: 1.5; }
main { max-width: 34em; }
h1 { margin: 0 0 0.5em; font-weight: 500; line-height: 1.316;
  font-size: calc(16px + 1.8 * 1vmax); }
p { margin: 0 0 32px; }
a.button { display: inline-block; text-decoration: none; font-weight: 500;
  background: #61a2ab; color: #fff; padding: 14.4px 24.048px;
  border-radius: 6.4px; font-size: 16px; letter-spacing: 0.02em; }
a.button:hover { opacity: 0.85; }
@media (min-width: 768px) {
  body { font-size: calc(16px + 0.12 * 1vw); padding: 6vmax 5vw; }
  h1 { font-size: calc(16px + 1.8 * 1vw); }
}
"""
out = standalone('Page not found &mdash; matchbox.health',
                 'The page you asked for is not on www.matchbox.health.',
                 NOTFOUND_CSS.strip())
open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8').write(out)
print(f"  {'404.html':28} {len(out):7} bytes")
print("build complete")
