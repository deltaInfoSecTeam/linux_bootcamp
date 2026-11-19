#!/usr/bin/env bash
# Linux Bootcamp – Update-Agent für den Knopf „Jetzt aktualisieren“ unter Management / System
#
# Der Container darf sich nicht selbst aktualisieren (dafür bräuchte er Zugriff auf Docker,
# das wäre root auf dem ganzen Server). Der Knopf legt deshalb nur einen Auftrag in
# data/update/ ab. Dieser Agent läuft auf dem Host (systemd), erledigt den Auftrag mit festen
# Befehlen und schreibt den Stand zurück, den Management / System anzeigt.
#
#   sudo ./scripts/update-agent.sh install     Agent einrichten (systemd-Units, einmalig)
#   sudo ./scripts/update-agent.sh uninstall   Agent entfernen
#   ./scripts/update-agent.sh check            nach neuer Version suchen (auch per Timer)
#   ./scripts/update-agent.sh run              offene Aufträge abarbeiten (vom systemd-Pfad)
#
# Aktualisieren heißt: git pull --ff-only im Projektordner, dann scripts/install.sh --yes.
# Aus dem Auftrag wird nur der Benutzername für das Protokoll gelesen, nie ein Befehl.

set -euo pipefail
umask 022

AGENT_DEST=/usr/local/sbin/bootcamp-update-agent
UNIT_DIR=/etc/systemd/system
MIN_GAP=600                     # höchstens ein Update je 10 Minuten
CONTAINER_UID=1000              # Nutzer "node" im Container, gehört data/

# Projektordner: beim installierten Agenten fest eingetragen, sonst der Ordner dieses Skripts
REPO_DIR="${BOOTCAMP_DIR:-__REPO_DIR__}"
case "$REPO_DIR" in __REPO*) REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" ;; esac
UPD="$REPO_DIR/data/update"
OWNER="$(stat -c %U "$REPO_DIR")"

die() { echo "update-agent: $*" >&2; exit 1; }
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
        run_state running "Container wird neu gebaut und gestartet. Das Bootcamp ist dabei kurz nicht erreichbar." "$by" "$started" "" 2
        # Der Build läuft als root im Ordner des Besitzers. Git (in docker compose build) verweigert dort
        # sonst die Commit-Info ("dubious ownership"). Nur für diesen Aufruf als vertrauenswürdig angeben.
        SUDO_USER="$OWNER" GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="$REPO_DIR" \
            bash "$REPO_DIR/scripts/install.sh" --yes
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
    logger -t bootcamp-update "Update von $by: rc=$rc" 2>/dev/null || true
}

do_run() {
    ensure_dir
    { exec 9>/run/bootcamp-update.lock; } 2>/dev/null || exec 9>"/tmp/bootcamp-update.lock"
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
    cat > "$UNIT_DIR/bootcamp-update.service" <<EOF
[Unit]
Description=Linux Bootcamp: Update-Auftrag aus Management / System ausführen
After=docker.service network-online.target

[Service]
Type=oneshot
ExecStart=$AGENT_DEST run
EOF
    cat > "$UNIT_DIR/bootcamp-update.path" <<EOF
[Unit]
Description=Linux Bootcamp: auf Update-Aufträge aus Management / System warten

[Path]
PathExistsGlob=$UPD/*.req
Unit=bootcamp-update.service

[Install]
WantedBy=multi-user.target
EOF
    cat > "$UNIT_DIR/bootcamp-update-check.service" <<EOF
[Unit]
Description=Linux Bootcamp: nach neuer Version suchen
After=network-online.target

[Service]
Type=oneshot
ExecStart=$AGENT_DEST check
EOF
    cat > "$UNIT_DIR/bootcamp-update-check.timer" <<EOF
[Unit]
Description=Linux Bootcamp: regelmäßig nach neuer Version suchen

[Timer]
OnBootSec=5min
OnUnitActiveSec=6h

[Install]
WantedBy=timers.target
EOF
    ensure_dir
    systemctl daemon-reload
    systemctl enable --now bootcamp-update.path bootcamp-update-check.timer
    "$AGENT_DEST" check
    echo "Update-Agent eingerichtet. Unter Management / System steht jetzt der Programmstand."
    echo "Nach Änderungen an diesem Skript erneut ausführen: sudo $0 install"
}

do_uninstall() {
    [ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen: sudo $0 uninstall"
    systemctl disable --now bootcamp-update.path bootcamp-update-check.timer 2>/dev/null || true
    rm -f "$UNIT_DIR"/bootcamp-update.service "$UNIT_DIR"/bootcamp-update.path \
          "$UNIT_DIR"/bootcamp-update-check.service "$UNIT_DIR"/bootcamp-update-check.timer "$AGENT_DEST"
    systemctl daemon-reload
    rm -f "$UPD/status.json"
    echo "Update-Agent entfernt."
}

case "${1:-}" in
    install) do_install ;;
    uninstall) do_uninstall ;;
    check) do_check ;;
    run) do_run ;;
    *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
