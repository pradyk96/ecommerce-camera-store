#!/usr/bin/env bash
# ---------------------------------------------------------------
# Image pipeline — regenerates responsive image derivatives.
# Requires ImageMagick (`convert`). Originals live in assets/img/src.
# Usage: ./scripts/optimize-images.sh
# ---------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/img/src"
OUT="$ROOT/assets/img"

mkdir -p "$OUT"

# name | crop geometry (optional) | widths
render() {
  local name="$1" crop="$2"; shift 2
  for w in "$@"; do
    # WebP (primary format)
    convert "$SRC/$name.jpg" \
      ${crop:+-gravity center -crop "$crop" +repage} \
      -resize "${w}x>" -strip -quality 82 \
      "$OUT/${name}-${w}.webp"
    # JPEG (fallback for older browsers)
    convert "$SRC/$name.jpg" \
      ${crop:+-gravity center -crop "$crop" +repage} \
      -resize "${w}x>" -strip -quality 80 -interlace Plane \
      "$OUT/${name}-${w}.jpg"
  done
  echo "✓ $name"
}

render hero-cinematic   ""         960 1400 1672
render promo-tradein    ""         1000 1600 1983
render cat-mirrorless   "4:3"      800 1200
render cat-lenses       "4:3"      800 1200
render cat-studio       "4:3"      800 1200
render prod-fxpro       "1:1"      480 800 1254
render prod-prime       "1:1"      480 800 1254
render prod-tripod      "1:1"      480 800 1254
render prod-mic         "1:1"      480 800 1254
render seo-flatlay      "4:3"      800 1200 1536

echo "Done — derivatives written to assets/img/"
