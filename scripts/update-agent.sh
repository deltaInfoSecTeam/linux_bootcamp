#!/usr/bin/env bash
# update-agent – Update-Agent für den Knopf „Jetzt aktualisieren“ unter Management / System
#
# Der Container darf sich nicht selbst aktualisieren (dafür bräuchte er Docker, also root auf dem
# Server). Der Knopf legt nur einen Auftrag in data/update/ ab; dieser Agent auf dem Host (systemd)
# erledigt ihn mit festen Befehlen: git pull --ff-only, dann scripts/install.sh --yes. Aus dem
# Auftrag liest er nur den Benutzernamen fürs Protokoll, nie einen Befehl.
#
# Aufruf:
#   ./scripts/update-agent.sh BEFEHL
#
# Befehle:
#   install        Agent einrichten (systemd-Units, einmalig, sudo)
#   uninstall      Agent entfernen (sudo)
#   check          nach neuer Version suchen (läuft auch per Timer)
#   run            offene Aufträge abarbeiten (vom systemd-Pfad)
#
# Optionen:
#   -h, --help     diese Hilfe
#
# Beispiele:
#   sudo ./scripts/update-agent.sh install   Agent und Units einrichten
#   ./scripts/update-agent.sh check          nach neuer Version suchen
#   journalctl -u <slug>-update -f           laufendes Update mitlesen
set -euo pipefail
# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }
umask 022

UNIT_DIR=/etc/systemd/system
MIN_GAP=600                     # höchstens ein Update je 10 Minuten
CONTAINER_UID=1000              # Nutzer "node" im Container, gehört data/

# Projektordner: beim installierten Agenten fest eingetragen, sonst der Ordner dieses Skripts
REPO_DIR="${APP_DIR:-__REPO_DIR__}"
case "$REPO_DIR" in __REPO*) REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" ;; esac
# App-Identität aus app.conf (APP_NAME, APP_SLUG)
APP_NAME="App"; APP_SLUG="app"
# shellcheck disable=SC1091
[ -r "$REPO_DIR/app.conf" ] && . "$REPO_DIR/app.conf"
AGENT_DEST="/usr/local/sbin/$APP_SLUG-update-agent"
UNIT="$APP_SLUG-update"
UPD="$REPO_DIR/data/update"
OWNER="$(stat -c %U "$REPO_DIR")"

# Ausgabe über lib/dis-term.sh (Modul install), fehlt sie, schlichte Marken ohne Farbe
if [ -r "$REPO_DIR/scripts/lib/dis-term.sh" ]; then
    # shellcheck disable=SC1091
    . "$REPO_DIR/scripts/lib/dis-term.sh"
else
    dis_ok()    { printf ' [  OK  ] %s\n' "$*"; }
    dis_warn()  { printf ' [ WARN ] %s\n' "$*"; }
    dis_error() { printf ' [ FAIL ] %s\n' "$*" >&2; }
    dis_info()  { printf ' [ INFO ] %s\n' "$*"; }
fi
die() { dis_error "update-agent: $*"; exit 1; }
now() { date -Is; }

# Git immer als Besitzer des Projektordners, nie als root
as_owner() {
    if [ "$(id -u)" -eq 0 ] && [ "$OWNER" != root ]; then runuser -u "$OWNER" -- "$@"; else "$@"; fi
}

# JSON-Zeichenkette sicher escapen (nur Bash, keine Zusatzpakete)
jstr() {
    local s=${1//\\/\\\\}
    s=${s//\"/\\\"}; s=${s//$'\t'/ }; s=${s//$'\r'/}; s=${s//$'\n'/\\n}
    printf '"%s"' "$(printf '%s' "$s" | tr -d '\000-\010\013-\037')"
}

# Datei atomar schreiben. mktemp legt eine neue Datei an, mv ersetzt nur den Verzeichniseintrag:
# Ein vom Container untergeschobener Symlink wird so ersetzt, nie verfolgt.
put() {
    [ -d "$UPD" ] && [ ! -L "$UPD" ] || return 0
    local tmp; tmp="$(mktemp "$UPD/.tmp.XXXXXX")"
    printf '%s\n' "$2" > "$tmp"
    chmod 644 "$tmp"
    mv -fT "$tmp" "$UPD/$1"
}

# Auftrag lesen und entfernen: nur reguläre Dateien, nur der Benutzername
take() {
    local f="$UPD/$1" by=""
    [ -e "$f" ] || [ -L "$f" ] || return 1
    if [ -f "$f" ] && [ ! -L "$f" ]; then by="$(head -c 100 "$f" | tr -cd 'A-Za-z0-9._@-' | head -c 40)"; fi
    rm -f -- "$f"
    printf '%s' "${by:-unbekannt}"
}

ensure_dir() {
    [ -L "$UPD" ] && die "$UPD ist ein Symlink, abgebrochen"
    mkdir -p "$UPD"
    if [ "$(id -u)" -eq 0 ]; then chown "$CONTAINER_UID:$CONTAINER_UID" "$UPD"; fi
    chmod 755 "$UPD"
}

do_check() {
    ensure_dir
    local branch cur remote behind commits="" line err=""
    branch="$(as_owner git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
    if ! err="$(as_owner git -C "$REPO_DIR" fetch -q 2>&1)"; then err="Repo nicht erreichbar: ${err: -200}"; else err=""; fi
    cur="$(as_owner git -C "$REPO_DIR" log -1 --format='%h %s' 2>/dev/null || echo '?')"
    remote="$(as_owner git -C "$REPO_DIR" rev-parse --short '@{u}' 2>/dev/null || echo '')"
    behind="$(as_owner git -C "$REPO_DIR" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)"
    while IFS= read -r line; do
        [ -n "$line" ] && commits="${commits:+$commits,}$(jstr "$line")"
    done < <(as_owner git -C "$REPO_DIR" log --format='%h %s' -n 20 'HEAD..@{u}' 2>/dev/null || true)
    put status.json "{\"agent\":1,\"checked_at\":$(jstr "$(now)"),\"branch\":$(jstr "$branch"),\"current\":$(jstr "$cur"),\"remote\":$(jstr "$remote"),\"behind\":${behind:-0},\"commits\":[${commits}],\"error\":$(jstr "$err")}"
}

# Hat sich update-agent.sh mit dem Update geändert, installiert sich der Agent selbst neu (Kopie,
# systemd-Units). Das nutzt dasselbe Vertrauen wie install.sh, das der Agent ohnehin als root ausführt.
# Nur der installierte Agent tut das, nicht ein direkt aus dem Repo gestarteter. Ein Fehler hier lässt
# das Update nicht scheitern; dann bleibt die bisherige Agent-Version aktiv.
self_update() {
    [ "$(id -u)" -eq 0 ] || return 0
    [ "$(readlink -f "$0")" = "$AGENT_DEST" ] || return 0
    local src="$REPO_DIR/scripts/update-agent.sh"
    [ -f "$src" ] || return 0
    if sed "s|__REPO_DIR__|$REPO_DIR|" "$src" | cmp -s - "$AGENT_DEST"; then
        dis_ok "Update-Agent ist aktuell."
        return 0
    fi
    dis_info "Update-Agent hat sich geändert, installiere die neue Version …"
    bash "$src" install || dis_warn "Der Update-Agent konnte sich nicht selbst aktualisieren. Bitte einmal von Hand: sudo ./scripts/update-agent.sh install"
}

run_state() {   # state message by started finished step(1 holen, 2 bauen/neu starten, 3 fertig)
    put run.json "{\"state\":$(jstr "$1"),\"message\":$(jstr "$2"),\"by\":$(jstr "$3"),\"started_at\":$(jstr "$4"),\"finished_at\":$(jstr "${5:-}"),\"step\":${6:-0}}"
}

do_apply() {
    local by="$1" started log rc=0 last
    started="$(now)"
    last="$( [ -f "$UPD/.last-apply" ] && [ ! -L "$UPD/.last-apply" ] && tr -cd 0-9 < "$UPD/.last-apply" | head -c 12 || true)"
    if [ $(( $(date +%s) - ${last:-0} )) -lt "$MIN_GAP" ]; then
        run_state failed "Das letzte Update ist weniger als 10 Minuten her. Bitte später erneut versuchen." "$by" "$started" "$(now)"
        return 0
    fi
    put .last-apply "$(date +%s)"
    run_state running "Neue Version wird geholt." "$by" "$started" "" 1
    log="$(mktemp)"
    (   # Subshell: ein Abbruch beendet nur diesen Block, der Status wird danach trotzdem geschrieben
        set -e
        echo "== $(now) Update angefordert von $by"
        if [ -n "$(as_owner git -C "$REPO_DIR" status --porcelain --untracked-files=no)" ]; then
            echo "Im Projektordner gibt es lokale Änderungen. Update abgebrochen (git status prüfen)."
            exit 3
        fi
        as_owner git -C "$REPO_DIR" pull --ff-only
        as_owner git -C "$REPO_DIR" log -1 --format='Neuer Stand: %h %s'
        run_state running "Container wird neu gebaut und gestartet. Die App ist dabei kurz nicht erreichbar." "$by" "$started" "" 2
        # Der Build läuft als root im Ordner des Besitzers. Git (in docker compose build) verweigert dort
        # sonst die Commit-Info ("dubious ownership"). Nur für diesen Aufruf als vertrauenswürdig angeben.
        SUDO_USER="$OWNER" GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="$REPO_DIR" \
            bash "$REPO_DIR/scripts/install.sh" --yes
        self_update
        # Apps mit eigenem Datenbau (z. B. $APP_SLUG-build.service) gleich anstoßen, Fortschritt im Journal
        if systemctl cat "$APP_SLUG-build.service" >/dev/null 2>&1; then
            systemctl start --no-block "$APP_SLUG-build.service" && echo "Datenbau gestartet (journalctl -u $APP_SLUG-build)"
        fi
        echo "== $(now) fertig"
    ) > "$log" 2>&1 || rc=$?
    ensure_dir
    put log.txt "$(tail -n 60 "$log" | sed 's/\x1b\[[0-9;]*m//g')"
    rm -f "$log"
    if [ "$rc" -eq 0 ]; then
        run_state ok "Update erfolgreich. Neuer Stand ist aktiv." "$by" "$started" "$(now)" 3
    else
        run_state failed "Update fehlgeschlagen (Code $rc). Der bisherige Stand läuft weiter, Details im Protokoll." "$by" "$started" "$(now)"
        rm -f "$UPD/.last-apply"   # nach einem Fehler sofort erneut versuchen dürfen
    fi
    logger -t "$UNIT" "Update von $by: rc=$rc" 2>/dev/null || true
}

do_run() {
    ensure_dir
    { exec 9>/run/${UNIT}.lock; } 2>/dev/null || exec 9>"/tmp/${UNIT}.lock"
    flock -n 9 || exit 0
    local by
    if by="$(take apply.req)"; then take check.req >/dev/null || true; do_apply "$by"; do_check; fi
    if take check.req >/dev/null; then do_check; fi
}

do_install() {
    [ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen: sudo $0 install"
    command -v systemctl >/dev/null || die "systemd fehlt"
    [ "$OWNER" != root ] || die "Der Projektordner gehört root. Bitte als normaler Nutzer klonen (siehe README)."
    sed "s|__REPO_DIR__|$REPO_DIR|" "$REPO_DIR/scripts/update-agent.sh" > "$AGENT_DEST.part"
    chown root:root "$AGENT_DEST.part"; chmod 755 "$AGENT_DEST.part"; mv -f "$AGENT_DEST.part" "$AGENT_DEST"
    cat > "$UNIT_DIR/${UNIT}.service" <<EOF
[Unit]
Description=$APP_NAME: Update-Auftrag aus Management / System ausführen
After=docker.service network-online.target

[Service]
Type=oneshot
ExecStart=$AGENT_DEST run
EOF
    cat > "$UNIT_DIR/${UNIT}.path" <<EOF
[Unit]
Description=$APP_NAME: auf Update-Aufträge aus Management / System warten

[Path]
PathExistsGlob=$UPD/*.req
Unit=${UNIT}.service

[Install]
WantedBy=multi-user.target
EOF
    cat > "$UNIT_DIR/${UNIT}-check.service" <<EOF
[Unit]
Description=$APP_NAME: nach neuer Version suchen
After=network-online.target

[Service]
Type=oneshot
ExecStart=$AGENT_DEST check
EOF
    cat > "$UNIT_DIR/${UNIT}-check.timer" <<EOF
[Unit]
Description=$APP_NAME: regelmäßig nach neuer Version suchen

[Timer]
OnBootSec=5min
OnUnitActiveSec=6h

[Install]
WantedBy=timers.target
EOF
    ensure_dir
    systemctl daemon-reload
    systemctl --quiet enable --now ${UNIT}.path ${UNIT}-check.timer
    "$AGENT_DEST" check
    dis_ok "Update-Agent eingerichtet. Unter Management / System steht jetzt der Programmstand."
    dis_info "Nach Änderungen an diesem Skript erneut ausführen: sudo $0 install"
}

do_uninstall() {
    [ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen: sudo $0 uninstall"
    systemctl --quiet disable --now ${UNIT}.path ${UNIT}-check.timer 2>/dev/null || true
    rm -f "$UNIT_DIR"/${UNIT}.service "$UNIT_DIR"/${UNIT}.path \
          "$UNIT_DIR"/${UNIT}-check.service "$UNIT_DIR"/${UNIT}-check.timer "$AGENT_DEST"
    systemctl daemon-reload
    rm -f "$UPD/status.json"
    dis_ok "Update-Agent entfernt."
}

case "${1:-}" in
    install) do_install ;;
    uninstall) do_uninstall ;;
    check) do_check ;;
    run) do_run ;;
    -h|--help) usage ;;
    *) usage 1 ;;
esac
