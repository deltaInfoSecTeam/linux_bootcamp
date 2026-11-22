#!/usr/bin/env bash
# open-setup – Einrichtung nach der Installation im Browser öffnen
#
# Wartet auf Enter (nur mit Terminal) und startet den Standardbrowser, sofern eine grafische
# Sitzung da ist; sonst (z.B. per SSH) steht der Link zum Kopieren da. Mit --yes ohne Rückfrage.
# Ruft install.sh selbst auf.
#
# Aufruf:
#   ./scripts/open-setup.sh [--yes] URL
#
# Optionen:
#   -y, --yes      ohne Enter sofort öffnen (unbeaufsichtigte Installation)
#   -h, --help     diese Hilfe
#
# Beispiele:
#   ./scripts/open-setup.sh https://app.local/#setup=TOKEN         nach Enter öffnen
#   ./scripts/open-setup.sh --yes https://app.local/#setup=TOKEN   sofort öffnen
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }
# Ausgabe über lib/dis-term.sh (Modul install), fehlt sie, schlichte Marken ohne Farbe
if [ -r "$HERE/lib/dis-term.sh" ]; then
    # shellcheck disable=SC1091
    . "$HERE/lib/dis-term.sh"
else
    dis_ok()    { printf ' [  OK  ] %s\n' "$*"; }
    dis_warn()  { printf ' [ WARN ] %s\n' "$*"; }
    dis_error() { printf ' [ FAIL ] %s\n' "$*" >&2; }
    dis_info()  { printf ' [ INFO ] %s\n' "$*"; }
    dis_kv()    { printf ' %-14s %s\n' "$1" "$2"; }
fi
YES=0
case "${1:-}" in
    -h|--help) usage ;;
    -y|--yes)  YES=1; shift ;;
esac
URL="${1:-}"
# ] steht vorn in der Klasse, sonst beendet es sie (IPv6 in eckigen Klammern)
re='^https?://[][A-Za-z0-9.:-]+/#setup=[A-Za-z0-9_-]+$'
[[ "$URL" =~ $re ]] || { dis_error "Ungültiger Einrichtungslink"; exit 2; }
if [ "$YES" -eq 0 ]; then
    { : </dev/tty; } 2>/dev/null || exit 0
    echo
    [[ "$URL" == https://* ]] && dis_info "Anderer Rechner? Erst die CA importieren (Schritt 1), sonst sperrt der Browser den Link."
    read -r -p " [ INFO ] Enter öffnet die Einrichtung (Passwort ändern, Recovery-Schlüssel sichern) … " _ </dev/tty || exit 0
fi
# Unter sudo den Browser des aufrufenden Nutzers starten, nicht den von root
open_url() {
    if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
        sudo -u "$SUDO_USER" --preserve-env=DISPLAY,WAYLAND_DISPLAY,XDG_RUNTIME_DIR,DBUS_SESSION_BUS_ADDRESS \
            xdg-open "$URL" >/dev/null 2>&1 &
    else
        xdg-open "$URL" >/dev/null 2>&1 &
    fi
}
if { [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; } && command -v xdg-open >/dev/null; then
    open_url
    dis_ok "Browser geöffnet. Falls nicht, diesen Link öffnen:"
else
    dis_info "Kein Desktop gefunden. Diesen Link im Browser öffnen:"
fi
printf '          %s\n' "$URL"
