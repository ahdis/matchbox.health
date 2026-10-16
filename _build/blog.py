"""The blog: Markdown posts in _build/posts/, rendered into the shared chrome.

A post is `_build/posts/YYYY-MM-DD-<slug>.md` with YAML front matter (see
`_build/posts/_template.md`). It is published at /blog/<year>/<slug>/, the URL
scheme of the ahdis.ch blog. Files starting with an underscore are not posts.

Everything is rendered at build time: code is highlighted by Pygments into
CSS classes (styled in site.css), so posts ship no JavaScript."""
import datetime as dt
import html
import os
import re
from urllib.parse import urlparse

import yaml
from markdown_it import MarkdownIt
from mdit_py_plugins.anchors import anchors_plugin
from mdit_py_plugins.footnote import footnote_plugin
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name
from pygments.util import ClassNotFound

from layout import SITE

POSTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'posts')
NAME = re.compile(r'(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$')
FRONT = re.compile(r'\A---\n(.*?)\n---\n', re.S)
COMMENT = re.compile(r'<!--.*?-->\n?', re.S)
REQUIRED = ('title', 'date', 'author', 'summary')
EXT = ' target="_blank" rel="noopener"'
# The banner of /blog/, also its meta description. HL7 and FHIR are registered
# trademarks of HL7, marked as on the home page.
INDEX_LEDE = ('Latest news, updates and insights on HL7&reg; FHIR&reg; validation and mapping '
              'with Matchbox.')


class PostError(SystemExit):
    pass


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------
def load():
    """All posts, newest first. Fails the build on a malformed post rather
    than publishing it half-rendered."""
    posts = []
    for name in sorted(os.listdir(POSTS)):
        if name.startswith('_') or not name.endswith('.md'):
            continue
        m = NAME.match(name)
        if not m:
            raise PostError(f'{name}: a post is named YYYY-MM-DD-<slug>.md (lowercase, digits, hyphens)')
        src = open(os.path.join(POSTS, name), encoding='utf-8').read()
        fm = FRONT.match(src)
        if not fm:
            raise PostError(f'{name}: no front matter (a --- block at the top)')
        meta = yaml.safe_load(fm.group(1)) or {}
        missing = [k for k in REQUIRED if not meta.get(k)]
        if missing:
            raise PostError(f'{name}: front matter is missing {", ".join(missing)}')
        date = meta['date']
        if not isinstance(date, dt.date) or isinstance(date, dt.datetime):
            raise PostError(f'{name}: date must be YYYY-MM-DD')
        if date.isoformat() != m.group(1):
            raise PostError(f'{name}: date {date} does not match the file name')
        body = COMMENT.sub('', src[fm.end():]).strip() + '\n'
        if re.match(r'#\s', body):
            raise PostError(f'{name}: the title belongs in the front matter, not as a # heading')
        slug = m.group(2)
        posts.append(dict(
            meta, date=date, slug=slug, file=name, body=body,
            path=f'/blog/{date.year}/{slug}/',
            tags=[str(t) for t in meta.get('tags') or []],
        ))
    posts.sort(key=lambda p: (p['date'], p['slug']), reverse=True)
    return posts


# --------------------------------------------------------------------------
# Markdown
# --------------------------------------------------------------------------
FORMATTER = HtmlFormatter(nowrap=True)


def _fence(self, tokens, idx, options, env):
    info = tokens[idx].info.strip()
    lang = info.split()[0] if info else ''
    code = tokens[idx].content
    try:
        spans = highlight(code, get_lexer_by_name(lang), FORMATTER) if lang else None
    except ClassNotFound:
        spans = None
    label = f'<span class="code__lang">{html.escape(lang)}</span>' if lang else ''
    return (f'<div class="code">{label}<pre><code>'
            f'{spans if spans is not None else html.escape(code)}</code></pre></div>\n')


def _link_open(self, tokens, idx, options, env):
    href = tokens[idx].attrGet('href') or ''
    if href.startswith('http') and urlparse(href).hostname not in ('www.matchbox.health', 'matchbox.health'):
        tokens[idx].attrSet('target', '_blank')
        tokens[idx].attrSet('rel', 'noopener')
    return self.renderToken(tokens, idx, options, env)


def markdown():
    md = (MarkdownIt('commonmark', {'html': True})
          .enable(['table', 'strikethrough'])
          .use(footnote_plugin)
          .use(anchors_plugin, min_level=2, max_level=3))
    md.add_render_rule('fence', _fence)
    md.add_render_rule('code_block', _fence)
    md.add_render_rule('link_open', _link_open)
    # wide tables scroll inside the column instead of widening the page
    md.add_render_rule('table_open', lambda self, t, i, o, e: '<div class="table-scroll">\n<table>\n')
    md.add_render_rule('table_close', lambda self, t, i, o, e: '</table>\n</div>\n')
    default_image = md.renderer.rules['image']

    def image(self, tokens, idx, options, env):
        tokens[idx].attrSet('loading', 'lazy')
        return default_image(tokens, idx, options, env)
    md.add_render_rule('image', image)
    return md


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
def long_date(d):
    return f'{d.day} {d:%B %Y}'


def _host(url):
    host = urlparse(url).hostname or url
    return host[4:] if host.startswith('www.') else host


def byline(post):
    gh = post.get('github')
    who = html.escape(post['author'])
    if gh:
        who += f' (<a href="https://github.com/{html.escape(gh)}"{EXT}>@{html.escape(gh)}</a>)'
    return (f'<time datetime="{post["date"].isoformat()}">{long_date(post["date"])}</time>'
            f' &middot; {who}')


def tag_list(post):
    tags = [f'<li class="tag">{html.escape(t)}</li>' for t in post['tags']]
    if post.get('matchbox'):
        tags.insert(0, f'<li class="tag tag--release">Matchbox {html.escape(str(post["matchbox"]))}</li>')
    return f'<ul class="tags" aria-label="Tags">{"".join(tags)}</ul>' if tags else ''


def post_body(post, content):
    original = post.get('original')
    note = (f'\n          <p class="article__original">Originally published on '
            f'<a href="{html.escape(original)}"{EXT}>{_host(original)}</a> on '
            f'{long_date(post["date"])}.</p>' if original else '')
    return f"""  <section class="section section--dark post-hero">
    <div class="wrap post-hero__inner">
      <div class="column">
        <p class="post-hero__crumb"><a href="/blog">Blog</a></p>
        <h1 class="post-hero__title">{html.escape(post['title'])}</h1>
        <p class="post-hero__meta">{byline(post)}</p>
        {tag_list(post)}
      </div>
    </div>
  </section>

  <section class="section section--white post">
    <div class="wrap post__inner">
      <article class="column article">{note}
{content}      </article>
      <p class="column post__back"><a class="button" href="/blog">All posts</a></p>
    </div>
  </section>"""


def index_body(posts):
    items = "\n".join(f"""        <li class="posts__item">
          <p class="posts__meta">{byline(p)}</p>
          <h2 class="posts__title"><a href="{p['path']}">{html.escape(p['title'])}</a></h2>
          <p class="posts__summary">{html.escape(p['summary'])}</p>
          {tag_list(p)}
        </li>""" for p in posts)
    return f"""  <section class="section section--dark post-hero">
    <div class="wrap post-hero__inner">
      <div class="column">
        <h1 class="post-hero__title">Blog</h1>
        <p class="post-hero__lede">{INDEX_LEDE}</p>
        <p class="post-hero__feed"><a href="/blog/feed.xml">Atom feed</a></p>
      </div>
    </div>
  </section>

  <section class="section section--white post">
    <div class="wrap post__inner">
      <ol class="column posts">
{items}
      </ol>
    </div>
  </section>"""


def feed(posts, rendered):
    """Atom feed with the full text. Links are made absolute, since feed
    readers resolve them against the feed, not the post."""
    def absolute(s):
        return re.sub(r'(href|src)="/', rf'\1="{SITE}/', s)

    def stamp(d):
        return f'{d.isoformat()}T00:00:00Z'

    entries = "\n".join(f"""  <entry>
    <title>{html.escape(p['title'])}</title>
    <link rel="alternate" type="text/html" href="{SITE}{p['path']}"/>
    <id>{SITE}{p['path']}</id>
    <published>{stamp(p['date'])}</published>
    <updated>{stamp(p['date'])}</updated>
    <author><name>{html.escape(p['author'])}</name></author>
    <summary>{html.escape(p['summary'])}</summary>
    <content type="html">{html.escape(absolute(rendered[p['slug']]))}</content>
  </entry>""" for p in posts)
    return f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>matchbox.health blog</title>
  <link rel="alternate" type="text/html" href="{SITE}/blog/"/>
  <link rel="self" type="application/atom+xml" href="{SITE}/blog/feed.xml"/>
  <id>{SITE}/blog/</id>
  <updated>{stamp(max(p['date'] for p in posts))}</updated>
{entries}
</feed>
"""


def head(post=None):
    """Extra <head> markup for blog pages: the feed, and article metadata."""
    lines = ['<link rel="alternate" type="application/atom+xml" title="matchbox.health blog" '
             f'href="{SITE}/blog/feed.xml">']
    if post:
        lines.append(f'<meta property="article:published_time" content="{post["date"].isoformat()}">')
        lines += [f'<meta property="article:tag" content="{html.escape(t)}">' for t in post['tags']]
    return "\n".join(lines)
