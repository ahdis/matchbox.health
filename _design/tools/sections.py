#!/usr/bin/env python3
"""Per-page section inventory: region, theme, layout classes and visible text."""
import re, sys, glob, os
def clean(s):
    s=re.sub(r'<script.*?</script>','',s,flags=re.S)
    s=re.sub(r'<style.*?</style>','',s,flags=re.S)
    s=re.sub(r'<!--.*?-->','',s,flags=re.S)
    return s
def text(s):
    s=clean(s)
    s=re.sub(r'<(h[1-6]|p|li|div|figcaption)\b[^>]*>',r'\n',s)
    s=re.sub(r'<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>',lambda m:f'{re.sub("<[^>]+>","",m.group(2))}[{m.group(1)}]',s,flags=re.S)
    s=re.sub(r'<img\b[^>]*?(?:data-src|src)="([^"]*)"[^>]*>',lambda m:f'\n<IMG {m.group(1).split("/")[-1][:70]}>',s)
    s=re.sub(r'<[^>]+>',' ',s)
    import html as H; s=H.unescape(s)
    return '\n'.join(l.strip() for l in s.split('\n') if l.strip())
for p in sorted(glob.glob(sys.argv[1])):
    src=open(p,encoding='utf-8').read()
    print(f'\n{"#"*72}\n# {os.path.basename(p)}\n{"#"*72}')
    for region,pat in (('HEADER',r'<header[^>]*id="header".*?</header>'),
                       ('MAIN',  r'<main.*?</main>'),
                       ('FOOTER',r'<footer[^>]*>.*?</footer>')):
        m=re.search(pat,src,re.S)
        if not m: print(f'\n[{region}] -- not found'); continue
        chunk=m.group(0)
        secs=re.findall(r'<section\b[^>]*>',chunk)
        parts=re.split(r'(?=<section\b)',chunk)
        print(f'\n[{region}]  {len(secs)} section(s)')
        for part in parts:
            tag=re.match(r'<section\b[^>]*>',part)
            if not tag:
                t=text(part)
                if t and region=='HEADER': print(f'  (outside sections)\n'+'\n'.join('    '+l for l in t.split('\n')))
                continue
            th=re.search(r'data-section-theme="([^"]*)"',tag.group(0))
            cl=re.search(r"class='([^']*)'|class=\"([^\"]*)\"",tag.group(0))
            classes=' '.join((cl.group(1) or cl.group(2) or '').split()) if cl else ''
            keep=' '.join(c for c in classes.split() if re.search(r'height|content-width|background-width|alignment',c))
            print(f'\n  <section theme={th.group(1) if th else None}> {keep}')
            print('\n'.join('    '+l for l in text(part).split('\n')))
