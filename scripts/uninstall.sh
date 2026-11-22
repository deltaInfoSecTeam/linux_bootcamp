#!/usr/bin/env bash
# uninstall – App vom Server entfernen (Gegenstück zu install.sh)
#
# Entfernt Container, Volumes, gebaute Images, die systemd-Units von Update-Agent und Datenbau,
# /etc/cron.d/<slug>-* und den Projektordner. Die CA unter /etc/<slug> bleibt, außer mit --full.
# Als Besitzer des Repo-Klons starten; sudo nur für Docker, systemd und root-Dateien.
#
# Aufruf:
#   ./scripts/uninstall.sh [OPTIONEN] [-- INSTALL-OPTIONEN]
#
# Optionen:
#   -y, --yes      ohne Rückfrage
#   --backup       vorher sichern nach ~/deltainfosec/<slug>/backup/DATUM (zurück mit restore.sh)
#   --full         auch die CA (/etc/<slug>) und ihr Vertrauen auf diesem Rechner entfernen
#   --reinstall    danach frisch klonen (gleiche Quelle, gleicher Branch) und installieren;
#                  alles nach -- geht an das Installskript
#   --keep-key     mit --reinstall: den NVD-Schlüssel (.nvd-key) in die neue Installation übernehmen
#   -h, --help     diese Hilfe
#
# Beispiele:
#   ./scripts/uninstall.sh                                 entfernen, CA bleibt
#   ./scripts/uninstall.sh --backup --full                 sichern, dann restlos entfernen
#   ./scripts/uninstall.sh -y --reinstall -- --tls --yes   Testschleife: weg und neu mit HTTPS
#   ./scripts/uninstall.sh -y --reinstall --keep-key       neu, NVD-Schlüssel bleibt

set -euo pipefail

# Alles steht in main: bash liest die Funktion vorab ganz ein, das Skript löscht sich selbst mit.
main() {
LIB="$(dirname "${BASH_SOURCE[0]}")/lib/dis-term.sh"
if [ -r "$LIB" ]; then
    # shellcheck disable=SC1090
    . "$LIB"
else
    dis_ok()     { printf ' [  OK  ] %s\n' "$*"; }
    dis_warn()   { printf ' [ WARN ] %s\n' "$*"; }
    dis_error()  { printf ' [ FAIL ] %s\n' "$*" >&2; }
    dis_info()   { printf ' [ INFO ] %s\n' "$*"; }
    dis_die()    { dis_error "$*"; exit 1; }
    dis_kv()     { printf ' %-14s %s\n' "$1" "$2"; }
    dis_step()   { printf '\n> SCHRITT %02d/%02d  %s\n' "$1" "$2" "$3"; }
    dis_banner() { printf '\n %s\n %s\n\n' "$1" "${3:-}"; }
    dis_box()    { printf '\n == %s ==\n' "$1"; shift; printf '    %s\n' "$@"; }
fi
info() { dis_info "$*"; }
ok()   { dis_ok "$*"; }
warn() { dis_warn "$*" >&2; }
die()  { dis_die "$*"; }

# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }

ASSUME_YES=0; FULL=0; BACKUP=0; REINSTALL=0; KEEP_KEY=0; INSTALL_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --full) FULL=1 ;;
        --backup) BACKUP=1 ;;
        --reinstall) REINSTALL=1 ;;
        --keep-key) KEEP_KEY=1 ;;
        --) shift; INSTALL_ARGS=("$@"); break ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done
[ ${#INSTALL_ARGS[@]} -eq 0 ] || [ "$REINSTALL" -eq 1 ] || die "Optionen nach -- gelten nur mit --reinstall"
[ "$KEEP_KEY" -eq 0 ] || [ "$REINSTALL" -eq 1 ] || die "--keep-key gilt nur mit --reinstall"

# --- Kontext ----------------------------------------------------------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="App"; APP_SLUG="app"
# shellcheck disable=SC1091
[ -r "$REPO_DIR/app.conf" ] && . "$REPO_DIR/app.conf"
[[ "$APP_SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "Ungültiger APP_SLUG in app.conf: $APP_SLUG"
[ -f "$REPO_DIR/docker-compose.yml" ] && [ -f "$REPO_DIR/Dockerfile" ] || die "Kein App-Projektordner: $REPO_DIR"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; OWNER="${SUDO_USER:-root}"
else command -v sudo >/dev/null || die "sudo fehlt"; SUDO="sudo"; OWNER="$(id -un)"; fi
OWNER_HOME="$(getent passwd "$OWNER" | cut -d: -f6)"
BASE="$OWNER_HOME/deltainfosec/$APP_SLUG"   # app/ (Klon), backup/, backup/restore-point/
case "$REPO_DIR" in
    /|/home|/root|/etc|/usr|/opt|/srv|"$OWNER_HOME"|"$OWNER_HOME/deltainfosec"|"$OWNER_HOME/deltainfosec/$APP_SLUG"|"$OWNER_HOME/deltainfosec/$APP_SLUG/backup") die "Projektordner $REPO_DIR wird nicht gelöscht" ;;
esac
as_owner() { if [ "$(id -un)" = "$OWNER" ]; then "$@"; else sudo -u "$OWNER" -H "$@"; fi; }

GIT_URL=""; GIT_BRANCH=""
if [ "$REINSTALL" -eq 1 ]; then
    GIT_URL="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null)" || die "--reinstall: kein Git-Remote origin"
    GIT_BRANCH="$(git -C "$REPO_DIR" branch --show-current 2>/dev/null)"
    [ -n "$GIT_BRANCH" ] || die "--reinstall: kein Branch ausgecheckt"
fi
KEY_TMP=""
if [ "$KEEP_KEY" -eq 1 ] && [ ! -f "$REPO_DIR/.nvd-key" ]; then
    warn "--keep-key: kein .nvd-key vorhanden, es wird nichts übernommen"; KEEP_KEY=0
fi

UNITS=("$APP_SLUG-update.path" "$APP_SLUG-update-check.timer" "$APP_SLUG-build.path" "$APP_SLUG-build.timer"
       "$APP_SLUG-update.service" "$APP_SLUG-update-check.service" "$APP_SLUG-build.service")
SBIN=("/usr/local/sbin/$APP_SLUG-update-agent" "/usr/local/sbin/$APP_SLUG-build-prepare")
CRON=(); for f in /etc/cron.d/"$APP_SLUG"-*; do [ -e "$f" ] && CRON+=("$f"); done

dis_banner "$APP_NAME" "$APP_SLUG" "Deinstallation"
dis_kv "Projektordner" "$REPO_DIR"
dis_kv "CA" "$([ "$FULL" -eq 1 ] && echo "App wird abgemeldet, die letzte App entfernt die CA" || echo "bleibt (/etc/deltainfosec)")"
dis_kv "Sicherung" "$([ "$BACKUP" -eq 1 ] && echo ja || echo nein)"
[ "$REINSTALL" -eq 1 ] && dis_kv "Danach" "neu klonen ($GIT_BRANCH) und installieren ${INSTALL_ARGS[*]}"
[ "$KEEP_KEY" -eq 1 ] && dis_kv "NVD-Schlüssel" "wird übernommen"
if [ "$ASSUME_YES" -eq 0 ]; then
    [ -t 0 ] || die "Keine Rückfrage möglich (kein Terminal). Mit --yes erneut starten."
    read -r -p " $(printf '%s[ FRAGE ]%s' "${C_GOLD:-}" "${C_OFF:-}") Zum Bestätigen \"$APP_SLUG\" eingeben: " answer
    [ "$answer" = "$APP_SLUG" ] || die "Abgebrochen, nichts geändert"
fi
$SUDO true || die "sudo nicht verfügbar"
cd /

STEPS=5; [ "$BACKUP" -eq 1 ] && STEPS=6; [ "$REINSTALL" -eq 1 ] && STEPS=$((STEPS + 1)); N=0
step() { N=$((N + 1)); dis_step "$N" "$STEPS" "$1"; }

# --- Sicherung ------------------------------------------------------------
if [ "$BACKUP" -eq 1 ]; then
    step "Sicherung"
    B="$BASE/backup/$(date +%Y%m%d-%H%M%S)"
    $SUDO install -d -m 700 -o "$OWNER" "$OWNER_HOME/deltainfosec" "$BASE" "$BASE/backup" "$B"
    items=(); for i in .env .nvd-key data tls logs cache overrides.json; do [ -e "$REPO_DIR/$i" ] && items+=("$i"); done
    [ ${#items[@]} -gt 0 ] && $SUDO tar -C "$REPO_DIR" -czf "$B/projekt.tgz" "${items[@]}"
    [ -d "/etc/$APP_SLUG" ] && $SUDO tar -C /etc -czf "$B/etc-$APP_SLUG.tgz" "$APP_SLUG"   # CA-Schlüssel: Datei nur root
    [ -d /etc/deltainfosec ] && $SUDO tar -C /etc -czf "$B/etc-deltainfosec.tgz" deltainfosec   # gemeinsame CA
    for u in "${UNITS[@]}"; do [ -f "/etc/systemd/system/$u" ] && $SUDO cp "/etc/systemd/system/$u" "$B/"; done
    for f in "${CRON[@]}"; do $SUDO cp "$f" "$B/"; done
    $SUDO chown "$OWNER" "$B"/* 2>/dev/null || true
    $SUDO chown root:root "$B/etc-$APP_SLUG.tgz" 2>/dev/null && $SUDO chmod 600 "$B/etc-$APP_SLUG.tgz" || true
    ok "Gesichert nach $B"
fi

# --- Container ------------------------------------------------------------
step "Container"
if $SUDO docker compose version >/dev/null 2>&1; then
    (cd "$REPO_DIR" && $SUDO docker compose down -v --remove-orphans --rmi local >/dev/null 2>&1) \
        && ok "Container, Volumes und gebaute Images entfernt" || warn "docker compose down meldete einen Fehler"
else
    info "Docker Compose fehlt, nichts zu tun"
fi

# --- systemd und Cron -----------------------------------------------------
step "Dienste"
removed=0
for u in "${UNITS[@]}"; do
    [ -f "/etc/systemd/system/$u" ] || continue
    $SUDO systemctl disable --now "$u" >/dev/null 2>&1 || true
    $SUDO rm -f "/etc/systemd/system/$u"; removed=$((removed + 1))
done
for f in "${SBIN[@]}" "${CRON[@]}"; do [ -e "$f" ] && { $SUDO rm -f "$f"; removed=$((removed + 1)); }; done
if [ "$removed" -gt 0 ]; then
    $SUDO systemctl daemon-reload; $SUDO systemctl reset-failed >/dev/null 2>&1 || true
    ok "$removed Units, Programme und Cron-Dateien entfernt"
else
    info "Keine Units oder Cron-Dateien vorhanden"
fi

# --- CA -------------------------------------------------------------------
step "CA"
if [ "$FULL" -eq 1 ]; then
    if [ -f "$REPO_DIR/scripts/tls.sh" ]; then
        $SUDO env SUDO_USER="$OWNER" bash "$REPO_DIR/scripts/tls.sh" release || warn "tls.sh release meldete einen Fehler"
    fi
    if [ -d "/etc/$APP_SLUG" ]; then $SUDO rm -rf -- "/etc/${APP_SLUG:?}" && ok "/etc/$APP_SLUG entfernt"; fi
else
    info "CA bleibt unter /etc/deltainfosec (mit --full entfernen)"
fi

# --- Projektordner --------------------------------------------------------
step "Projektordner"
if [ "$KEEP_KEY" -eq 1 ]; then
    # Schlüssel außerhalb des Projektordners zwischenlagern, nur für den Aufrufer lesbar
    KEY_TMP="$(mktemp)"; trap 'rm -f "$KEY_TMP"' EXIT
    $SUDO cat "$REPO_DIR/.nvd-key" > "$KEY_TMP" || die "NVD-Schlüssel nicht lesbar"
fi
$SUDO rm -rf "$REPO_DIR" && ok "$REPO_DIR entfernt"

# --- Kontrolle ------------------------------------------------------------
step "Kontrolle"
left=()
for u in "${UNITS[@]}"; do [ -e "/etc/systemd/system/$u" ] && left+=("$u"); done
for f in "${SBIN[@]}" /etc/cron.d/"$APP_SLUG"-*; do [ -e "$f" ] && left+=("$f"); done
[ -e "$REPO_DIR" ] && left+=("$REPO_DIR")
while read -r c; do [ -n "$c" ] && left+=("Container $c"); done \
    < <($SUDO docker ps -a --filter "label=com.docker.compose.project=$(basename "$REPO_DIR")" --format '{{.Names}}' 2>/dev/null)
if [ ${#left[@]} -eq 0 ]; then ok "Nichts übrig"; else for l in "${left[@]}"; do warn "Noch vorhanden: $l"; done; fi

# --- Neuinstallation ------------------------------------------------------
if [ "$REINSTALL" -eq 1 ]; then
    step "Neuinstallation"
    as_owner git clone -q -b "$GIT_BRANCH" "$GIT_URL" "$REPO_DIR" || die "git clone fehlgeschlagen"
    ok "Neu geklont: $GIT_BRANCH"
    if [ -n "$KEY_TMP" ]; then
        $SUDO install -m 600 -o "$OWNER" "$KEY_TMP" "$REPO_DIR/.nvd-key" && ok "NVD-Schlüssel übernommen"
        rm -f "$KEY_TMP"
    fi
    INST="$REPO_DIR/scripts/install.sh"
    [ -f "$REPO_DIR/deploy/install.sh" ] && INST="$REPO_DIR/deploy/install.sh"
    cd "$REPO_DIR"
    as_owner bash "$INST" "${INSTALL_ARGS[@]}"
    return
fi
dis_box "FERTIG" "$APP_NAME ist entfernt." \
    "Neu installieren: git clone QUELLE ${REPO_DIR/#"$OWNER_HOME"/\~}" \
    "dann darin ./scripts/install.sh (oder deploy/install.sh)" \
    "Sicherungen: ${BASE/#"$OWNER_HOME"/\~}/backup"
}

main "$@"
exit $?
