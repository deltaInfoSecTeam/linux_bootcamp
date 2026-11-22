#!/usr/bin/env bash
# restore – Sicherung von uninstall.sh --backup zurückspielen
#
# Spielt eine Sicherung aus ~/deltainfosec/<slug>/backup/DATUM in die bestehende Installation zurück:
# Projektdateien (.env, .nvd-key, data, tls, logs, cache, overrides.json), die CA unter /etc/<slug>,
# systemd-Units und Cron-Dateien. Ohne Angabe nimmt es die neueste Sicherung. Was überschrieben
# wird, sichert es vorher nach ~/deltainfosec/<slug>/backup/restore-point/DATUM, das sich ebenso zurückspielen lässt.
# Als Besitzer des Repo-Klons starten; sudo nur für Docker, systemd und root-Dateien.
#
# Aufruf:
#   ./scripts/restore.sh [OPTIONEN] [SICHERUNG]
#
# Optionen:
#   -y, --yes      ohne Rückfrage
#   --only TEILE   nur diese Teile, durch Komma getrennt:
#                  key, env, data, tls, logs, cache, overrides, ca, units, cron
#   --list         vorhandene Sicherungen zeigen
#   -h, --help     diese Hilfe
#
# Beispiele:
#   ./scripts/restore.sh                                     neueste Sicherung, alles
#   ./scripts/restore.sh --only key,tls                      nur NVD-Schlüssel und Zertifikat
#   ./scripts/restore.sh ~/deltainfosec/app/backup/20261122-101500
#                                                            bestimmte Sicherung
#   ./scripts/restore.sh --list                              Sicherungen zeigen

set -euo pipefail

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
fi
info() { dis_info "$*"; }
ok()   { dis_ok "$*"; }
warn() { dis_warn "$*" >&2; }
die()  { dis_die "$*"; }

# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }

ALL_PARTS="key env data tls logs cache overrides ca units cron"
ASSUME_YES=0; LIST=0; ONLY=""; SRC=""
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --only) [ $# -ge 2 ] || die "--only braucht eine Liste (siehe --help)"; ONLY="$2"; shift ;;
        --only=*) ONLY="${1#--only=}" ;;
        --list) LIST=1 ;;
        -h|--help) usage ;;
        -*) die "Unbekannte Option: $1 (siehe --help)" ;;
        *) [ -z "$SRC" ] || die "Nur eine Sicherung angeben"; SRC="$1" ;;
    esac
    shift
done

PARTS=()
if [ -n "$ONLY" ]; then
    IFS=',' read -r -a PARTS <<< "$ONLY"
    for p in "${PARTS[@]}"; do
        [[ " $ALL_PARTS " == *" $p "* ]] || die "Unbekannter Teil: $p (erlaubt: ${ALL_PARTS// /, })"
    done
else
    read -r -a PARTS <<< "$ALL_PARTS"
fi
want() { [[ " ${PARTS[*]} " == *" $1 "* ]]; }

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
BASE="$OWNER_HOME/deltainfosec/$APP_SLUG"   # Ordner der App: app/ (Klon), backup/, backup/restore-point/

if [ "$LIST" -eq 1 ]; then
    found=0
    for d in "$BASE"/backup/[0-9]* "$BASE"/backup/restore-point/*; do
        [ -d "$d" ] || continue
        found=1; dis_kv "${d#"$BASE"/}" "$(cd "$d" && ls | tr '\n' ' ')"
    done
    [ "$found" -eq 1 ] || info "Keine Sicherung unter $BASE/backup"
    exit 0
fi

if [ -z "$SRC" ]; then
    SRC="$(ls -1d "$BASE"/backup/[0-9]* 2>/dev/null | sort | tail -n 1 || true)"
    [ -n "$SRC" ] || die "Keine Sicherung unter $BASE/backup (Pfad angeben oder --list)"
fi
[ -d "$SRC" ] || die "Sicherung nicht gefunden: $SRC"
SRC="$(cd "$SRC" && pwd)"
case "$SRC" in
    */"$APP_SLUG"/backup/*) ;;
    *) die "$SRC ist keine Sicherung von $APP_SLUG (erwartet $BASE/backup/DATUM)" ;;
esac

# Projektteile und ihre Pfade im Archiv
declare -A PATH_OF=([key]=.nvd-key [env]=.env [data]=data [tls]=tls [logs]=logs [cache]=cache [overrides]=overrides.json)
TGZ="$SRC/projekt.tgz"; CA_TGZ="$SRC/etc-$APP_SLUG.tgz"; SHARED_TGZ="$SRC/etc-deltainfosec.tgz"
MEMBERS=()
if [ -f "$TGZ" ]; then
    listing="$(tar -tzf "$TGZ")" || die "Archiv nicht lesbar: $TGZ"
    for p in key env data tls logs cache overrides; do
        want "$p" || continue
        m="${PATH_OF[$p]}"
        grep -qxE "(\./)?$m/?" <<< "$listing" && MEMBERS+=("$m")
    done
fi
UNIT_FILES=(); CRON_FILES=()
for f in "$SRC/$APP_SLUG"-*; do
    [ -f "$f" ] || continue
    case "$f" in
        *.tgz) ;;
        *.service|*.timer|*.path) want units && UNIT_FILES+=("$f") ;;
        *) want cron && CRON_FILES+=("$f") ;;
    esac
done
DO_CA=0; want ca && { [ -f "$CA_TGZ" ] || [ -f "$SHARED_TGZ" ]; } && DO_CA=1
[ ${#MEMBERS[@]} -gt 0 ] || [ "$DO_CA" -eq 1 ] || [ ${#UNIT_FILES[@]} -gt 0 ] || [ ${#CRON_FILES[@]} -gt 0 ] \
    || die "In $SRC steht nichts von dem, was zurückgespielt werden soll"

dis_banner "$APP_NAME" "$APP_SLUG" "Wiederherstellung"
dis_kv "Sicherung" "$SRC"
dis_kv "Projektordner" "$REPO_DIR"
dis_kv "Dateien" "$([ ${#MEMBERS[@]} -gt 0 ] && echo "${MEMBERS[*]}" || echo "–")"
dis_kv "CA" "$([ "$DO_CA" -eq 1 ] && echo "/etc/deltainfosec" || echo "–")"
[ -f "$SHARED_TGZ" ] && [ "$DO_CA" -eq 1 ] \
    && warn "Die CA gilt für alle deltaInfoSec-Apps dieses Servers, sie bekommen danach neue Zertifikate per tls.sh setup"
dis_kv "Units" "$([ ${#UNIT_FILES[@]} -gt 0 ] && echo "${#UNIT_FILES[@]}" || echo "–")"
dis_kv "Cron" "$([ ${#CRON_FILES[@]} -gt 0 ] && echo "${#CRON_FILES[@]}" || echo "–")"
for m in "${MEMBERS[@]}"; do
    [ "$m" = data ] && warn "data enthält die Datenbank: Accounts und Einstellungen gehen auf den Stand der Sicherung zurück"
done
if [ "$ASSUME_YES" -eq 0 ]; then
    [ -t 0 ] || die "Keine Rückfrage möglich (kein Terminal). Mit --yes erneut starten."
    read -r -p " $(printf '%s[ FRAGE ]%s' "${C_GOLD:-}" "${C_OFF:-}") Zum Bestätigen \"$APP_SLUG\" eingeben: " answer
    [ "$answer" = "$APP_SLUG" ] || die "Abgebrochen, nichts geändert"
fi
$SUDO true || die "sudo nicht verfügbar"

STEPS=3; [ ${#MEMBERS[@]} -gt 0 ] && STEPS=$((STEPS + 1)); [ "$DO_CA" -eq 1 ] && STEPS=$((STEPS + 1))
[ $((${#UNIT_FILES[@]} + ${#CRON_FILES[@]})) -gt 0 ] && STEPS=$((STEPS + 1)); N=0
step() { N=$((N + 1)); dis_step "$N" "$STEPS" "$1"; }

# --- Vorher sichern ---------------------------------------------------------
step "Aktuellen Stand sichern"
PRE="$BASE/backup/restore-point/$(date +%Y%m%d-%H%M%S)"
$SUDO install -d -m 700 -o "$OWNER" "$OWNER_HOME/deltainfosec" "$BASE" "$BASE/backup" "$BASE/backup/restore-point" "$PRE"
cur=(); for m in "${MEMBERS[@]}"; do [ -e "$REPO_DIR/$m" ] && cur+=("$m"); done
[ ${#cur[@]} -gt 0 ] && $SUDO tar -C "$REPO_DIR" -czf "$PRE/projekt.tgz" "${cur[@]}"
[ "$DO_CA" -eq 1 ] && [ -d "/etc/$APP_SLUG" ] && $SUDO tar -C /etc -czf "$PRE/etc-$APP_SLUG.tgz" "$APP_SLUG"
[ "$DO_CA" -eq 1 ] && [ -d /etc/deltainfosec ] && $SUDO tar -C /etc -czf "$PRE/etc-deltainfosec.tgz" deltainfosec
for f in "${UNIT_FILES[@]}"; do t="/etc/systemd/system/$(basename "$f")"; [ -f "$t" ] && $SUDO cp "$t" "$PRE/"; done
for f in "${CRON_FILES[@]}"; do t="/etc/cron.d/$(basename "$f")"; [ -f "$t" ] && $SUDO cp "$t" "$PRE/"; done
$SUDO chown "$OWNER" "$PRE"/* 2>/dev/null || true
for t in "$PRE/etc-$APP_SLUG.tgz" "$PRE/etc-deltainfosec.tgz"; do
    $SUDO chown root:root "$t" 2>/dev/null && $SUDO chmod 600 "$t" || true
done
ok "Gesichert nach $PRE"
trap 'rc=$?; [ "$rc" -eq 0 ] || dis_error "Abgebrochen. Voriger Stand: ./scripts/restore.sh $PRE"' EXIT

# --- Container stoppen ------------------------------------------------------
step "Container stoppen"
cd "$REPO_DIR"
$SUDO docker compose version >/dev/null 2>&1 || die "Docker Compose fehlt, erst install.sh ausführen"
$SUDO docker compose stop >/dev/null 2>&1 && ok "Container gestoppt" || warn "docker compose stop meldete einen Fehler"

# --- Projektdateien ---------------------------------------------------------
if [ ${#MEMBERS[@]} -gt 0 ]; then
    step "Projektdateien"
    for m in "${MEMBERS[@]}"; do
        case "$m" in ""|.|..|/*|*..*) die "Ungültiger Pfad im Archiv: $m" ;; esac
        $SUDO rm -rf -- "${REPO_DIR:?}/$m"
    done
    # als root entpacken, damit Besitzer und Rechte (z. B. .nvd-key 600, data des Containers) bleiben
    $SUDO tar -C "$REPO_DIR" -xzf "$TGZ" "${MEMBERS[@]}"
    ok "Zurückgespielt: ${MEMBERS[*]}"
fi

# --- CA ---------------------------------------------------------------------
if [ "$DO_CA" -eq 1 ]; then
    step "CA"
    if [ -f "$SHARED_TGZ" ]; then
        $SUDO rm -rf /etc/deltainfosec
        $SUDO tar -C /etc -xzf "$SHARED_TGZ" deltainfosec
        ok "Gemeinsame CA zurückgespielt nach /etc/deltainfosec"
    fi
    if [ -f "$CA_TGZ" ]; then
        $SUDO rm -rf -- "/etc/${APP_SLUG:?}"
        $SUDO tar -C /etc -xzf "$CA_TGZ" "$APP_SLUG"
        ok "Frühere CA der App zurückgespielt nach /etc/$APP_SLUG"
    fi
fi

# --- Units und Cron ---------------------------------------------------------
if [ $((${#UNIT_FILES[@]} + ${#CRON_FILES[@]})) -gt 0 ]; then
    step "Units und Cron"
    for f in "${UNIT_FILES[@]}"; do $SUDO install -m 644 -o root -g root "$f" "/etc/systemd/system/$(basename "$f")"; done
    for f in "${CRON_FILES[@]}"; do $SUDO install -m 644 -o root -g root "$f" "/etc/cron.d/$(basename "$f")"; done
    if [ ${#UNIT_FILES[@]} -gt 0 ]; then
        $SUDO systemctl daemon-reload
        for f in "${UNIT_FILES[@]}"; do
            u="$(basename "$f")"
            case "$u" in *.path|*.timer) $SUDO systemctl --quiet enable --now "$u" || warn "$u ließ sich nicht starten" ;; esac
        done
    fi
    ok "Units: ${#UNIT_FILES[@]}, Cron: ${#CRON_FILES[@]}"
fi

# --- Starten ----------------------------------------------------------------
step "Container starten"
if $SUDO docker compose up -d >/dev/null 2>&1; then ok "Container laufen"
else warn "docker compose up meldete einen Fehler: sudo docker compose logs zeigt mehr"; fi
info "Rückweg: ./scripts/restore.sh $PRE"
