#!/usr/bin/env bash
# banners – Startbilder der App aus dem Kürzel bauen (auf dem Entwicklerrechner)
#
# Setzt den Schriftzug (figlet) neben die Motive aus APP_BANNERS (app.conf, Standard: shield tux)
# und schreibt scripts/banners/<motiv>.txt sowie scripts/banner.txt (nur Schriftzug).
# Andere Motive in scripts/banners/ werden entfernt. install.sh zeigt zufällig eines.
# Die Dateien kommen ins Repo, der Server braucht kein figlet. Nach einer Umbenennung neu bauen.
#
# Aufruf:
#   scripts/banners.sh [OPTIONEN]
#
# Optionen:
#   --text TEXT      Schriftzug (Standard: APP_SLUG aus app.conf)
#   --font NAME      figlet-Schrift (Standard: slant)
#   --motifs LISTE   Motive, z.B. "tux" (Standard: APP_BANNERS aus app.conf)
#   --list           Motive auflisten
#   -h, --help       diese Hilfe
#
# Beispiele:
#   scripts/banners.sh                     Startbilder für APP_SLUG neu bauen
#   scripts/banners.sh --text meine-app    anderer Schriftzug
#   scripts/banners.sh --font standard     andere figlet-Schrift
#   scripts/banners.sh --motifs scope      nur das Radar (passt zu eolstat)
set -euo pipefail

usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$HERE")"
# shellcheck disable=SC1091
. "$HERE/lib/dis-term.sh"
die() { dis_error "$*"; exit 1; }

# Motive: Name, Leerzeile-frei, Abschluss mit einer Zeile "@@"
motifs() {
    cat <<'EOF'
shield
      _______________
     |\_____________/|
     |  .---------.  |
     |  |  .---.  |  |
     |  |  | * |  |  |
      \ |  '---'  | /
       \'---------'/
        '.       .'
          '-._.-'
@@
tux
            .--.
           |o_o |
           |:_/ |
          //   \ \
         (|     | )
        /'\_   _/`\
        \___)=(___/
@@
scope
             .-~~~~~~~~~-.
         .-'      |      '-.
       .'         |         '.
      /     *     |           \
     |            |            |
     |------------+------------|
     |            |            |
      \       *   |           /
       '.         |       * .'
         '-.      |      .-'
             '-~~~~~~~~~-'
@@
EOF
}

TEXT="" FONT="slant" LIST=0 MOTIFS=""
while [ $# -gt 0 ]; do
    case "$1" in
        --text) TEXT="${2:?--text braucht einen Wert}"; shift 2 ;;
        --font) FONT="${2:?--font braucht einen Wert}"; shift 2 ;;
        --motifs) MOTIFS="${2:?--motifs braucht einen Wert}"; shift 2 ;;
        --list) LIST=1; shift ;;
        -h|--help) usage ;;
        *) dis_error "Unbekannte Option: $1"; usage 2 ;;
    esac
done

if [ "$LIST" -eq 1 ]; then
    motifs | awk 'f == 0 { print; f = 1; next } /^@@$/ { f = 0 }'
    exit 0
fi

# shellcheck disable=SC1091
[ -r "$REPO_DIR/app.conf" ] && . "$REPO_DIR/app.conf"
[ -n "$TEXT" ] || TEXT="${APP_SLUG:-}"
[ -n "$MOTIFS" ] || MOTIFS="${APP_BANNERS:-shield tux}"
known=" $(motifs | awk 'f == 0 { printf "%s ", $0; f = 1; next } /^@@$/ { f = 0 }')"
for m in $MOTIFS; do
    case "$known" in *" $m "*) ;; *) die "Unbekanntes Motiv: $m (--list zeigt alle)" ;; esac
done
[ -n "$TEXT" ] || die "Kein Schriftzug: APP_SLUG in app.conf fehlt, sonst --text angeben"
command -v figlet >/dev/null || die "figlet fehlt (sudo apt install figlet)"

WORD="$(figlet -f "$FONT" -w 300 -- "$TEXT")" || die "figlet-Schrift nicht gefunden: $FONT"
mkdir -p "$REPO_DIR/scripts/banners"
# Motive, die nicht mehr gewählt sind, entfernen
for f in "$REPO_DIR"/scripts/banners/*.txt; do
    [ -e "$f" ] || continue
    m="$(basename "$f" .txt)"
    case " $MOTIFS " in *" $m "*) ;; *) rm -f -- "$f"; dis_info "entfernt: scripts/banners/$m.txt" ;; esac
done

# Schriftzug ohne Leerzeilen oben/unten, rechts gestutzt
trim() { sed -e 's/[[:space:]]*$//' | awk 'NF { last = NR } { l[NR] = $0 } END { s = 0; for (i = 1; i <= last; i++) { if (!s && l[i] == "") continue; s = 1; print l[i] } }'; }
WORD="$(printf '%s\n' "$WORD" | trim)"
printf '%s\n' "$WORD" > "$REPO_DIR/scripts/banner.txt"
dis_ok "scripts/banner.txt"

# Motiv links, Schriftzug rechts daneben, vertikal mittig.
# Schriftzug über die Umgebung, awk -v würde Backslashes auswerten.
motifs | BANNER_WORD="$WORD" awk -v dir="$REPO_DIR/scripts/banners" -v want=" $MOTIFS " '
    BEGIN { nw = split(ENVIRON["BANNER_WORD"], w, "\n") }
    name == "" { name = $0; n = 0; width = 0; next }
    /^@@$/ && index(want, " " name " ") == 0 { name = ""; next }
    /^@@$/ {
        off = int((n - nw) / 2); if (off < 0) off = 0
        rows = (off + nw > n) ? off + nw : n
        out = dir "/" name ".txt"
        for (i = 1; i <= rows; i++) {
            a = (i <= n) ? m[i] : ""
            t = (i - off >= 1 && i - off <= nw) ? w[i - off] : ""
            line = (t == "") ? a : sprintf("%-" width + 4 "s%s", a, t)
            sub(/[ \t]+$/, "", line); print line > out
        }
        close(out); print name; name = ""; next
    }
    { m[++n] = $0; if (length($0) > width) width = length($0) }
' | while read -r name; do dis_ok "scripts/banners/$name.txt"; done
dis_info "Ansehen: cat scripts/banners/*.txt"
