#!/usr/bin/env bash
# Archives the original Squarespace site (pages + assets + fonts + css) before
# it is decommissioned. Re-runnable; overwrites into _reference/squarespace/.
set -euo pipefail
BASE="https://www.matchbox.health"
OUT="$(cd "$(dirname "$0")" && pwd)/squarespace"
mkdir -p "$OUT"/pages "$OUT"/assets "$OUT"/css "$OUT"/extracted "$OUT"/fonts

# /home is an alias of / (same canonical, identical body); /cart is a commerce
# stub. Neither is ported.
PAGES="index:/ features:/features privacy-policy:/privacy-policy"

for entry in $PAGES; do
  name="${entry%%:*}"; path="${entry#*:}"
  curl -sSL --compressed -o "$OUT/pages/$name.html" "$BASE$path"
  printf '%-20s %8s bytes\n' "$name.html" "$(wc -c < "$OUT/pages/$name.html" | tr -d ' ')"
done

# Every Squarespace-hosted asset referenced by any page. Both absolute and
# protocol-relative (//images...) forms occur -- the header logos use the latter.
grep -ohE '(https:)?//(images|file)\.squarespace-cdn\.com/content/[^"'"'"'?\&)\ ]*' \
  "$OUT"/pages/*.html \
  | sed 's|^//|https://|' | sort -u > "$OUT/assets/SOURCES.txt"

echo "assets referenced: $(wc -l < "$OUT/assets/SOURCES.txt" | tr -d ' ')"

while read -r url; do
  [ -z "$url" ] && continue
  # Distinct assets share basenames (three separate uploads are all called
  # matchbox_logo_color.png; every font is called latin.woff2), so key each
  # file by its asset UUID.
  fn="$(basename "$(dirname "$url")")-$(basename "$url")"
  case "$url" in
    *images.squarespace-cdn.com*) q="?format=2500w"; dir="$OUT/assets" ;;
    *)                            q="";             dir="$OUT/fonts"  ;;
  esac
  # Without an explicit Accept the CDN content-negotiates and may return WebP
  # under a .png name -- which made the archive non-deterministic between runs.
  code=$(curl -sSL -H 'Accept: image/png,image/gif,image/jpeg,*/*;q=0.5' \
           -o "$dir/$fn" -w '%{http_code}' "$url$q")
  printf '  %s %9s  %s\n' "$code" "$(wc -c < "$dir/$fn" | tr -d ' ')" "${dir##*/}/$fn"
done < "$OUT/assets/SOURCES.txt"

# Theme CSS -- reference only, never shipped (site.css is ~1.3MB of framework).
curl -sSL --compressed -o "$OUT/css/site.css" \
  "https://static1.squarespace.com/static/versioned-site-css/62558863dd21d705877c3696/121/5c5a519771c10ba3470d8101/62558863dd21d705877c36ca/1817/site.css?nocustom=true"
curl -sSL --compressed -o "$OUT/css/custom.css" \
  "https://static1.squarespace.com/static/custom-css/62558863dd21d705877c3696/62558863dd21d705877c36ca/0/custom.css"

# Per-page inline <style> blocks.
python3 - "$OUT" <<'PY'
import re, sys, glob, os
out = sys.argv[1]
for p in sorted(glob.glob(os.path.join(out, 'pages', '*.html'))):
    name = os.path.basename(p)[:-5]
    css = "\n\n/* ---- */\n\n".join(
        re.findall(r'<style[^>]*>(.*?)</style>', open(p, encoding='utf-8').read(), re.S))
    open(os.path.join(out, 'extracted', f'{name}.inline.css'), 'w', encoding='utf-8').write(css)
    print(f'  extracted {name}.inline.css  {len(css)} bytes')
PY
echo "archive complete: $OUT"
