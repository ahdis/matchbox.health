#!/usr/bin/env python3
"""Dumps the section/block tree with text for each archived page, so the
content map comes from the markup rather than from a screenshot."""
import re, sys, glob, os, html
from html.parser import HTMLParser

class Tree(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.stack=[]; s.out=[]; s.depth=0
    def handle_starttag(s, tag, attrs):
        a=dict(attrs); cls=a.get('class','')
        s.stack.append(tag)
        if tag=='section':
            s.out.append(('SECTION', a.get('data-section-theme'), a.get('id'),
                          ' '.join(c for c in cls.split() if re.search(r'section-height|content-width|background-width|vertical-align', c))))
        elif 'sqs-block' in cls:
            kinds=[c for c in cls.split() if c.startswith('sqs-block-')]
            s.out.append(('BLOCK', kinds[0] if kinds else '?', None, None))
        elif tag in ('h1','h2','h3','h4','p','li','a','img'):
            s.out.append(('TAG', tag, a.get('src') or a.get('href'), cls))
    def handle_endtag(s, tag):
        if s.stack and s.stack[-1]==tag: s.stack.pop()
    def handle_data(s, d):
        d=' '.join(d.split())
        if d and s.out: s.out.append(('TEXT', d[:400], None, None))

for p in sorted(glob.glob(sys.argv[1])):
    h=open(p,encoding='utf-8').read()
    m=re.search(r'<main.*?</main>', h, re.S) or re.search(r'<body.*</body>', h, re.S)
    body=re.sub(r'<script.*?</script>','',m.group(0),flags=re.S)
    body=re.sub(r'<style.*?</style>','',body,flags=re.S)
    t=Tree(); t.feed(body)
    print(f'\n{"="*70}\n{os.path.basename(p)}\n{"="*70}')
    for kind,a,b,c in t.out:
        if kind=='SECTION': print(f'\n## SECTION theme={a} id={b} {c}')
        elif kind=='BLOCK': print(f'  -- {a}')
        elif kind=='TAG':   print(f'     <{a}> {("["+str(b)[-60:]+"]") if b else ""} {c or ""}'.rstrip())
        else:               print(f'        "{a}"')
