#!/usr/bin/env bash
# Linux Bootcamp – App-Icons aus dem zentralen Wappen erzeugen
#
# Rendert public/img/brand/wappen.svg auf dunklem Quadrat zu
#   public/img/brand/icon-192.png und icon-512.png
# (PWA-Manifest und Apple-Touch-Icon). Nach jedem Wappentausch einmal ausführen.
#
# Voraussetzung: Firefox (headless) oder Chromium/Chrome.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRAND="$ROOT/public/img/brand"
CREST="$BRAND/wappen.svg"
BG="#0a0c10"

[ -f "$CREST" ] || { echo "Wappen fehlt: $CREST" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$CREST" "$WORK/wappen.svg"
cat > "$WORK/icon.html" <<EOF
<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;height:100%;background:$BG}
  body{display:grid;place-items:center}
  img{height:72vh;width:auto}
</style>
<img src="wappen.svg" alt="">
EOF

render() { # $1 = size, $2 = output
    if command -v firefox >/dev/null 2>&1; then
        mkdir -p "$WORK/profile"
        firefox --headless --no-remote --profile "$WORK/profile" \
            --window-size "$1,$1" --screenshot "$2" "file://$WORK/icon.html" >/dev/null 2>&1
    elif command -v chromium >/dev/null 2>&1 || command -v google-chrome >/dev/null 2>&1; then
        local bin; bin="$(command -v chromium || command -v google-chrome)"
        "$bin" --headless --disable-gpu --hide-scrollbars --window-size="$1,$1" \
            --screenshot="$2" "file://$WORK/icon.html" >/dev/null 2>&1
    else
        echo "Weder Firefox noch Chromium gefunden." >&2; exit 1
    fi
    [ -s "$2" ] || { echo "Rendern fehlgeschlagen: $2" >&2; exit 1; }
}

render 192 "$BRAND/icon-192.png"
render 512 "$BRAND/icon-512.png"
echo "Icons erzeugt: $BRAND/icon-192.png, $BRAND/icon-512.png"
