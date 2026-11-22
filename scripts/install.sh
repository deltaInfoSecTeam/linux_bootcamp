#!/usr/bin/env bash
# install – Installation und Update
#
# Prüft die Voraussetzungen, installiert bei Bedarf Docker, setzt die Dateirechte, legt .env an
# und startet den Container. Mehrfach ausführbar, Erledigtes wird übersprungen. Fehlt ein Admin,
# wird einer angelegt; sein Einmal-Passwort steht nur im Kasten am Ende (oder in DIS_SUMMARY_FILE,
# falls ein umgebendes Skript es setzt) und muss beim ersten Login geändert werden.
# Unterstützt Debian, Ubuntu, Raspberry Pi OS und Kali (apt-basiert).
#
# Aufruf:
#   ./scripts/install.sh [OPTIONEN]
#
# Optionen:
#   -y, --yes          ohne Rückfragen (z.B. für Automatisierung)
#   --admin NAME       Admin mit diesem Namen anlegen (sonst heißt er admin)
#   --tls              HTTPS mit lokal vertrauter CA (grünes Schloss, braucht Modul tls)
#   --hostname N       weitere Namen fürs Zertifikat (z.B. app.lan, mehrere mit Komma)
#   -h, --help         diese Hilfe
#
# Beispiele:
#   ./scripts/install.sh                      interaktiv installieren oder aktualisieren
#   ./scripts/install.sh --tls --admin chef   mit HTTPS und eigenem Admin-Namen
#   ./scripts/install.sh --yes                ohne Rückfragen (Update-Agent nutzt das)

set -euo pipefail

# --- Ausgabe ---------------------------------------------------------------
# Terminal-Design aus scripts/lib/dis-term.sh (Kopie aus dem Corporate Design),
# fehlt die Datei, genügt eine schlichte Ausgabe ohne Farben.
LIB="$(dirname "${BASH_SOURCE[0]}")/lib/dis-term.sh"
if [ -r "$LIB" ]; then
    # shellcheck disable=SC1090
    . "$LIB"
else
    dis_ok()     { printf ' [  OK  ] %s\n' "$*"; }
    dis_warn()   { printf ' [ WARN ] %s\n' "$*"; }
    dis_error()  { printf ' [ FAIL ] %s\n' "$*" >&2; }
    dis_fail()   { dis_error "$@"; }
    dis_info()   { printf ' [ INFO ] %s\n' "$*"; }
    dis_die()    { dis_error "$*"; exit 1; }
    dis_kv()     { printf ' %-14s %s\n' "$1" "$2"; }
    dis_cmd()    { printf ' $ %s\n' "$*"; }
    dis_step()   { printf '\n> SCHRITT %02d/%02d  %s\n' "$1" "$2" "$3"; }
    dis_banner() { printf '\n %s\n %s\n\n' "$1" "${3:-}"; }
    dis_box()    { printf '\n == %s ==\n' "$1"; shift; printf '    %s\n' "$@"; }
    dis_run()    { local l=$1 rc=0; shift; "$@" >>"${DIS_LOG:-/dev/null}" 2>&1 || rc=$?
                   if [ "$rc" -eq 0 ]; then dis_ok "$l"; else dis_error "$l (Exit $rc)"; fi; return "$rc"; }
    C_TEXT3='' C_OFF=''
fi
info() { dis_info "$*"; }
ok()   { dis_ok "$*"; }
warn() { dis_warn "$*" >&2; }
die()  { dis_die "$*"; }

# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }

ASSUME_YES=0
ADMIN_NAME=""
WANT_TLS=0
ADD_HOSTNAMES=""
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --admin) [ $# -ge 2 ] || die "--admin braucht einen Benutzernamen"; ADMIN_NAME="$2"; shift ;;
        --tls) WANT_TLS=1 ;;
        --hostname) [ $# -ge 2 ] || die "--hostname braucht einen Namen"; ADD_HOSTNAMES="$2"; shift
            [[ "$ADD_HOSTNAMES" =~ ^[A-Za-z0-9.,-]+$ ]] || die "--hostname: nur Hostnamen, mehrere mit Komma" ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done

confirm() {
    [ "$ASSUME_YES" -eq 1 ] && return 0
    [ -t 0 ] || die "$1 – keine Rückfrage möglich (kein Terminal). Mit --yes erneut starten."
    local answer
    read -r -p " $(printf '%s[ FRAGE ]%s' "${C_GOLD:-}" "${C_OFF:-}") $1 [J/n] " answer
    [[ -z "$answer" || "$answer" =~ ^[jJyY] ]]
}

# --- Kontext ermitteln ----------------------------------------------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
# App-Identität aus app.conf (APP_NAME, APP_SLUG)
APP_NAME="App"; APP_SLUG="app"
# shellcheck disable=SC1091
[ -r "$REPO_DIR/app.conf" ] && . "$REPO_DIR/app.conf"
DB_FILE="${DB_FILE:-$APP_SLUG.db}"
# Startbild: zufällig eines aus scripts/banners/*.txt, sonst scripts/banner.txt
# (beide gebaut von scripts/banners.sh), sonst Block-Schrift
banners=()
for f in "$REPO_DIR"/scripts/banners/*.txt; do [ -r "$f" ] && banners+=("$f"); done
if [ ${#banners[@]} -gt 0 ]; then DIS_BANNER_FILE="${banners[RANDOM % ${#banners[@]}]}"
elif [ -r "$REPO_DIR/scripts/banner.txt" ]; then DIS_BANNER_FILE="$REPO_DIR/scripts/banner.txt"; fi
# Ein umgebendes Skript (z.B. deploy/install.sh der App) zeigt die Wortmarke selbst und setzt DIS_BANNER_SHOWN=1
[ "${DIS_BANNER_SHOWN:-0}" = 1 ] || dis_banner "$APP_NAME" "$APP_SLUG" "Installation / Update"
[ -f docker-compose.yml ] && [ -f Dockerfile ] || die "Kein App-Projektordner: $REPO_DIR"

if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
    # Bei "sudo ./install.sh" gehört der Ordner trotzdem dem aufrufenden Nutzer
    OWNER="${SUDO_USER:-root}"
else
    command -v sudo >/dev/null || die "sudo fehlt. Bitte als root ausführen oder sudo installieren."
    SUDO="sudo"
    OWNER="$(id -un)"
fi
# Der Container läuft als Nutzer "node" (UID/GID 1000), siehe Dockerfile
CONTAINER_UID=1000

info "Projektordner: $REPO_DIR (Besitzer: $OWNER)"

# --- 1. Docker ------------------------------------------------------------
dis_step 1 6 "Docker"
need_pkgs=()
if command -v docker >/dev/null 2>&1; then
    ok "Docker vorhanden: $(docker --version 2>/dev/null | head -1)"
else
    need_pkgs+=(docker.io)
fi
if command -v docker >/dev/null 2>&1 && $SUDO docker compose version >/dev/null 2>&1; then
    ok "Docker Compose vorhanden: $($SUDO docker compose version --short 2>/dev/null)"
else
    need_pkgs+=(compose)
fi

if [ ${#need_pkgs[@]} -gt 0 ]; then
    command -v apt-get >/dev/null || die "Docker fehlt und dieses System nutzt kein apt. Bitte Docker manuell installieren: https://docs.docker.com/engine/install/"

    # Compose-v2-Paketname unterscheidet sich je nach Distribution
    pkgs=()
    for p in "${need_pkgs[@]}"; do
        if [ "$p" = compose ]; then
            $SUDO apt-get update -qq
            for candidate in docker-compose-v2 docker-compose-plugin docker-compose; do
                ver="$(LC_ALL=C apt-cache policy "$candidate" 2>/dev/null | awk '/Candidate:/ {print $2}')"
                if [ -n "$ver" ] && [ "$ver" != "(none)" ]; then
                    # Nur Compose v2 (Go) taugt; v1 (Python, 1.x) kennt "docker compose" nicht
                    case "$ver" in 1.*|*:1.*) continue ;; esac
                    pkgs+=("$candidate"); break
                fi
            done
            [ ${#pkgs[@]} -gt 0 ] && [[ " ${pkgs[*]} " == *compose* ]] \
                || die "Kein Compose-v2-Paket in den Paketquellen gefunden. Siehe https://docs.docker.com/compose/install/linux/"
        else
            pkgs+=("$p")
        fi
    done

    info "Benötigte Pakete: ${pkgs[*]}"
    confirm "Diese Pakete jetzt mit apt installieren?" || die "Abgebrochen."
    $SUDO apt-get update -qq
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${pkgs[@]}"
    ok "Docker installiert"
fi

if command -v systemctl >/dev/null 2>&1 && ! $SUDO systemctl is-active --quiet docker; then
    info "Starte Docker-Dienst"
    $SUDO systemctl --quiet enable --now docker
fi
$SUDO docker info >/dev/null 2>&1 || die "Docker-Dienst läuft nicht (sudo systemctl status docker)."
$SUDO docker compose version >/dev/null 2>&1 || die "\"docker compose\" funktioniert nicht."
ok "Docker-Dienst läuft"

# Bewusst KEIN Hinzufügen zur Gruppe "docker": die ist faktisch root-gleich.
if [ -n "$SUDO" ] && id -nG "$OWNER" | tr ' ' '\n' | grep -qx docker; then
    DOCKER="docker"
else
    DOCKER="$SUDO docker"
fi

# --- 2. Dateirechte -------------------------------------------------------
dis_step 2 6 "Dateirechte"
# data/ und tls/server/ haben eigene Besitzer (Container) und bleiben außen vor
if [ "$(stat -c %U "$REPO_DIR")" != "$OWNER" ] || find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$REPO_DIR/tls" \) -prune -o ! -user "$OWNER" -print -quit | grep -q .; then
    info "Übertrage Projektordner an $OWNER"
    $SUDO find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$REPO_DIR/tls" \) -prune -o -exec chown -h "$OWNER": {} +
fi
$SUDO mkdir -p "$REPO_DIR/data"

# Alte Datenbank aus v1.0.0 (lag im Projektwurzelverzeichnis) übernehmen
if [ -s "$REPO_DIR/$DB_FILE" ] && [ ! -e "$REPO_DIR/data/$DB_FILE" ]; then
    info "Übernehme alte Datenbank $DB_FILE nach data/"
    $SUDO mv "$REPO_DIR/$DB_FILE" "$REPO_DIR/data/$DB_FILE"
fi
$SUDO chown -R "$CONTAINER_UID:$CONTAINER_UID" "$REPO_DIR/data"
$SUDO chmod 700 "$REPO_DIR/data"
ok "Rechte gesetzt (data/ gehört UID $CONTAINER_UID)"

# --- 3. Konfiguration -----------------------------------------------------
dis_step 3 6 "Konfiguration"
if [ ! -f "$REPO_DIR/.env" ]; then
    $SUDO install -m 600 -o "$OWNER" -g "$(id -gn "$OWNER")" "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    ok ".env aus .env.example angelegt"
else
    ok ".env vorhanden (unverändert)"
fi
env_value() { grep -E "^$1=" "$REPO_DIR/.env" | tail -1 | cut -d= -f2- || true; }
env_set() {
    if grep -qE "^$1=" "$REPO_DIR/.env"; then
        $SUDO sed -i "s|^$1=.*|$1=$2|" "$REPO_DIR/.env"
    else
        echo "$1=$2" | $SUDO tee -a "$REPO_DIR/.env" >/dev/null
    fi
}
if [ -n "$ADD_HOSTNAMES" ]; then
    # Bisherige Namen bleiben, neue kommen dazu. Deckt die CA sie nicht ab, fragt tls.sh nach einer neuen CA.
    cur="$(env_value TLS_HOSTNAMES)"
    merged="$(printf '%s,%s\n' "$cur" "$ADD_HOSTNAMES" | tr ',' '\n' | tr -d ' \t\r' | tr '[:upper:]' '[:lower:]' \
        | grep -v '^$' | awk '!seen[$0]++' | paste -sd, -)"
    if [ "$merged" != "$cur" ]; then env_set TLS_HOSTNAMES "$merged"; ok "TLS_HOSTNAMES=$merged"; fi
fi
BIND_ADDRESS="$(env_value BIND_ADDRESS)"; BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
HOST_PORT="$(env_value HOST_PORT)"; HOST_PORT="${HOST_PORT:-8000}"

# --- 4. HTTPS (optional) -------------------------------------------------
dis_step 4 6 "HTTPS"
# Einmal mit --tls eingerichtet, wird das Zertifikat bei jedem weiteren Lauf
# geprüft und bei Bedarf erneuert (Ablauf, neue IP-Adresse, neuer Hostname).
TLS_ACTIVE=0
[ -n "$(env_value TLS_CERT_PATH)" ] && TLS_ACTIVE=1
if [ "$WANT_TLS" -eq 1 ] && [ "$TLS_ACTIVE" -eq 0 ]; then
    echo "   HTTPS-Einrichtung: Es wird eine eigene Zertifizierungsstelle (CA) erzeugt,"
    echo "   die nur für lokale Namen und private IP-Adressen gilt. Sie wird im System"
    echo "   und in Firefox/Chrome von $OWNER als vertrauenswürdig hinterlegt."
    # Nein heißt: ohne HTTPS weiter, nicht abbrechen
    confirm "HTTPS jetzt einrichten?" && TLS_ACTIVE=1
fi
$SUDO install -d -m 755 -o "$OWNER" -g "$(id -gn "$OWNER")" "$REPO_DIR/tls"
$SUDO install -d -m 700 -o "$CONTAINER_UID" -g "$CONTAINER_UID" "$REPO_DIR/tls/server" 2>/dev/null \
    || $SUDO mkdir -p "$REPO_DIR/tls/server"
CERT_BEFORE=""
[ "$TLS_ACTIVE" -eq 0 ] && info "HTTPS nicht eingerichtet, die Seite läuft per HTTP (später mit --tls nachholen)"
if [ "$TLS_ACTIVE" -eq 1 ] && [ ! -f "$REPO_DIR/scripts/tls.sh" ]; then
    die "HTTPS braucht scripts/tls.sh (fehlt)"
fi
# Netzwerk-Domain (z. B. aus DHCP) einmal anbieten, damit <host>.<domain> ins Zertifikat kommt
if [ "$TLS_ACTIVE" -eq 1 ] && [ -z "$(env_value TLS_DOMAINS)" ] && [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
    dom="$(resolvectl domain 2>/dev/null | sed 's/^[^:]*://' | tr ' ' '\n' | grep -v -e '^~' -e '^$' | head -1 || true)"
    [ -n "$dom" ] || dom="$(awk '$1=="search"{print $2; exit}' /etc/resolv.conf 2>/dev/null || true)"
    dom="$(printf '%s' "$dom" | tr '[:upper:]' '[:lower:]' | sed 's/\.$//')"
    case "$dom" in
        ""|local|localdomain) ;;
        *) if confirm "Domain erkannt: $dom – $(hostname -s).$dom ins Zertifikat aufnehmen?"; then
               env_set TLS_DOMAINS "$dom"; ok "TLS_DOMAINS=$dom"
           fi ;;
    esac
fi
if [ "$TLS_ACTIVE" -eq 1 ]; then
    CERT_BEFORE="$($SUDO sha256sum "$REPO_DIR/tls/server/server.crt" 2>/dev/null || true)"
    TLS_YES=(); [ "$ASSUME_YES" -eq 1 ] && TLS_YES=(--yes)
    $SUDO env SUDO_USER="$OWNER" bash "$REPO_DIR/scripts/tls.sh" setup "${TLS_YES[@]}"
    $SUDO env SUDO_USER="$OWNER" bash "$REPO_DIR/scripts/tls.sh" trust
    env_set TLS_CERT_PATH /app/tls/server.crt
    env_set TLS_KEY_PATH /app/tls/server.key
    env_set TLS_CA_PATH /app/tls/ca.crt
fi

# --- 5. Bauen und starten -------------------------------------------------
dis_step 5 6 "Container"
# Docker-Ausgabe (BuildKit, Compose) ins eigene Protokoll, im Terminal nur Statusmarken
mkdir -p "$REPO_DIR/logs"
DIS_LOG="$REPO_DIR/logs/docker-$(date +%F-%H%M%S).log"
info "Protokoll: $DIS_LOG"
docker_die() { tail -n 20 "$DIS_LOG" | sed 's/^/           /' >&2; die "$1"; }
info "Der erste Bau dauert einige Minuten"
dis_run "Image bauen" $DOCKER compose build || docker_die "Image-Bau fehlgeschlagen"
# --remove-orphans: Container eines umbenannten Dienstes (früher "bootcamp") räumen
dis_run "Container starten" $DOCKER compose up -d --remove-orphans || docker_die "Container-Start fehlgeschlagen"
if [ "$TLS_ACTIVE" -eq 1 ] && [ -n "$CERT_BEFORE" ] \
   && [ "$CERT_BEFORE" != "$($SUDO sha256sum "$REPO_DIR/tls/server/server.crt" 2>/dev/null || true)" ]; then
    dis_run "Neustart (Zertifikat erneuert)" $DOCKER compose restart app || docker_die "Neustart fehlgeschlagen"
fi
wait_healthy() {
    local s
    for _ in $(seq 1 60); do
        s="$($DOCKER inspect -f '{{.State.Health.Status}}' "$($DOCKER compose ps -q app)" 2>/dev/null || true)"
        echo "Health: ${s:-unbekannt}"
        [ "$s" = healthy ] && return 0
        [ "$s" = unhealthy ] && return 1
        sleep 2
    done
    return 1
}
if ! dis_run "Healthcheck" wait_healthy; then
    $DOCKER compose logs --tail 30 app >&2 || true
    die "Container ist nicht gesund (Status: $(tail -n 1 "$DIS_LOG" | sed 's/^Health: //')). Logs siehe oben."
fi
DIS_LOG=/dev/null

# --- 6. Admin -------------------------------------------------------------
dis_step 6 6 "Admin"
ADMIN_STATUS="" ADMIN_PW="" ADMIN_RECOVERY="" SETUP_TOKEN="" SETUP_CODE=""
if [ ! -f "$REPO_DIR/scripts/create-admin.js" ]; then
    info "Ohne Login-Modul, kein Admin nötig"
else
    # Ohne --admin nur beim ersten Lauf: Gibt es schon einen Admin, bleibt alles, wie es ist
    admin_opts=(--env); [ -n "$ADMIN_NAME" ] || { ADMIN_NAME=admin; admin_opts+=(--if-none); }
    info "Prüfe Admin \"$ADMIN_NAME\""
    # --env: Zugangsdaten als Zeilen, damit sie nur in den Kasten und nicht ins Protokoll gelangen
    admin_out="$($DOCKER compose exec -T app node scripts/create-admin.js "$ADMIN_NAME" "${admin_opts[@]}")" \
        || die "Admin konnte nicht angelegt werden."
    ADMIN_STATUS="$(sed -n 's/^STATUS=//p' <<<"$admin_out")"
    ADMIN_PW="$(sed -n 's/^PASSWORD=\([A-Za-z0-9_-]*\)$/\1/p' <<<"$admin_out")"
    ADMIN_RECOVERY="$(sed -n 's/^RECOVERY=\([A-Z0-9-]*\)$/\1/p' <<<"$admin_out")"
    # Einmal-Link für die Einrichtung im Browser (30 Minuten, Server speichert nur den Hash)
    SETUP_TOKEN="$(sed -n 's/^SETUP=\([A-Za-z0-9_-]*\)$/\1/p' <<<"$admin_out")"
    # Bootcamp: ohne --admin richtet man den ersten Admin im Browser mit dem Setup-Code ein
    SETUP_CODE="$(sed -n 's/^SETUP_CODE=\([A-Z0-9-]*\)$/\1/p' <<<"$admin_out")"
    unset admin_out
    case "$ADMIN_STATUS" in
        created)  ok "Admin angelegt, Zugangsdaten nur am Bildschirm (Kasten am Ende)" ;;
        promoted) ok "Bestehender Nutzer ist jetzt Admin, Passwort unverändert" ;;
        exists)   ok "Admin besteht bereits, nichts geändert" ;;
        setup)    ok "Noch kein Admin, Einrichtung im Browser mit Setup-Code (Kasten am Ende)" ;;
        *)        die "Unerwartete Antwort von create-admin.js" ;;
    esac
fi

# --- Zusammenfassung ------------------------------------------------------
PROTO=http; [ "$TLS_ACTIVE" -eq 1 ] && PROTO=https
# Name, unter dem andere Geräte den Server erreichen: erster TLS_HOSTNAMES-Eintrag,
# sonst <host>.<erste TLS_DOMAINS>, sonst Hostname
CLIENT_HOST="$(env_value TLS_HOSTNAMES | cut -d, -f1 | tr -d ' ')"
if [ -z "$CLIENT_HOST" ]; then
    first_dom="$(env_value TLS_DOMAINS | cut -d, -f1 | tr -d ' ')"
    CLIENT_HOST="$(hostname -s)${first_dom:+.$first_dom}"
fi
if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then SHOW_HOST=localhost; else SHOW_HOST="$CLIENT_HOST"; fi
SETUP_URL=""; [ -n "$SETUP_TOKEN" ] && SETUP_URL="$PROTO://$SHOW_HOST:$HOST_PORT/#setup=$SETUP_TOKEN"
# Befehl über mehrere Zeilen mit \ aufbereiten, bleibt so auch im schmalen Terminal kopierbar
#   cmd_lines "erste Zeile" "Fortsetzung" …   (hängt an das Feld copy an)
cmd_lines() {
    copy+=("$1"); shift
    local a; for a in "$@"; do copy[-1]+=" \\"; copy+=("    $a"); done
}
# Befehle und Links unter dem Kasten ausgeben: ohne Rahmenzeichen, nur eingerückt,
# damit beim Markieren im Terminal kein │ mitkopiert wird
print_copy() {
    [ "${#copy[@]}" -gt 0 ] || return 0
    printf '\n'; printf '   %s\n' "${copy[@]}"
    copy=()
}
summary() {
if [ "$TLS_ACTIVE" -eq 1 ]; then
    # Zuerst die CA: Kennt ein Browser den Namen schon mit HTTPS (HSTS), sperrt er bei einer
    # unbekannten CA jede Seite ohne Ausnahme, auch den Einrichtungslink und /ca.crt.
    CA_FP="$($SUDO openssl x509 -in "$REPO_DIR/tls/$APP_SLUG-ca.crt" -noout -fingerprint -sha256 | cut -d= -f2)"
    CLIENT_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="src") print $(i+1)}' | head -1)"
    # trust-ca.sh ignoriert die Doppelpunkte, ohne sie bleibt die Zeile kurz
    srv="--server $CLIENT_HOST"
    [ "$HOST_PORT" != 443 ] && srv+=" --port $HOST_PORT"
    [ -n "$CLIENT_IP" ] && srv+=" --ip $CLIENT_IP"
    trust_opts=("--name \"$APP_NAME\" --slug $APP_SLUG" "$srv" "--fingerprint ${CA_FP//:/}")
    # Danach öffnet trust-ca.sh gleich die Einrichtung im Browser
    [ -n "$SETUP_URL" ] && trust_opts+=("--open \"$SETUP_URL\"")
    # Pfad im Home des Besitzers kurz als ~/…, die Gegenseite setzt ihn wieder ein
    owner_home="$(getent passwd "$OWNER" | cut -d: -f6)"
    ssh_path="$REPO_DIR/scripts/trust-ca.sh"
    [ -n "$owner_home" ] && [[ "$ssh_path" == "$owner_home"/* ]] && ssh_path="~/${ssh_path#"$owner_home"/}"
    # Eigener Kasten, damit die Schritte nicht im Protokoll untergehen
    copy=()
    ca=("${C_TEXT3}CA-Fingerabdruck (SHA-256)${C_OFF}" "  ${CA_FP:0:48}" "  ${CA_FP:48}" "")
    if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
        ca+=("Auf diesem Rechner ist die CA schon hinterlegt (System, Firefox, Chrome).")
    else
        ca+=("${C_TEXT3}Andere Linux-Rechner (System, Firefox, Chromium), dort ausführen.${C_OFF}"
            "${C_TEXT3}Holt das Skript per SSH, prüft den Fingerabdruck, trägt die CA ein${C_OFF}")
        if [ -n "$SETUP_URL" ]; then
            ca+=("${C_TEXT3}und öffnet danach die Einrichtung im Browser.${C_OFF}")
        else
            ca+=("${C_TEXT3}in System und Browser.${C_OFF}")
        fi
        ca+=("${C_TEXT3}Befehl unter diesem Kasten.${C_OFF}")
        cmd_lines "ssh $OWNER@$CLIENT_HOST cat $ssh_path" "| bash -s -- ${trust_opts[0]}" "${trust_opts[@]:1}"
        ca+=("" "${C_TEXT3}Handy/Windows/macOS:${C_OFF} https://$CLIENT_HOST:$HOST_PORT/ca.crt laden,"
            "Fingerabdruck vergleichen und als vertrauenswürdige Zertifizierungsstelle"
            "importieren (siehe README). Sperrt der Browser schon /ca.crt (Seite früher"
            "mit anderer CA besucht), tls/$APP_SLUG-ca.crt per scp oder USB holen.")
    fi
    dis_box "SCHRITT 1: CA VERTRAUEN UND EINRICHTEN" "${ca[@]}"
    print_copy
fi
copy=()
box=("${C_TEXT3}Installationsstatus${C_OFF} ${C_MATRIX:-}[ INSTALLIERT ]${C_OFF}" "")
box+=("${C_TEXT3}Seite   ${C_OFF} $PROTO://$SHOW_HOST:$HOST_PORT")
[ "$TLS_ACTIVE" -eq 1 ] && box+=("${C_TEXT3}CA      ${C_OFF} tls/$APP_SLUG-ca.crt")
if [ "$ADMIN_STATUS" = exists ]; then
    box+=("${C_TEXT3}Admin   ${C_OFF} besteht bereits, Passwort unverändert")
    box+=("" "${C_TEXT3}Passwort vergessen? Neues Einmal-Passwort, Befehl unter dem Kasten.${C_OFF}")
    cmd_lines "$DOCKER compose exec app" "node scripts/create-admin.js <name> --reset"
elif [ "$ADMIN_STATUS" = setup ]; then
    box+=("${C_TEXT3}Admin   ${C_OFF} im Browser einrichten")
    box+=("${C_TEXT3}Setup-Code${C_OFF} $C_BOLD$SETUP_CODE$C_OFF")
    box+=("" "${C_TEXT3}Seite öffnen, der Einrichtungsdialog fragt den Code ab.${C_OFF}")
    box+=("${C_TEXT3}Er gilt bis zum ersten Admin und wird bei jedem Neustart neu erzeugt.${C_OFF}")
elif [ -n "$ADMIN_STATUS" ]; then box+=("${C_TEXT3}Admin   ${C_OFF} $ADMIN_NAME")
    if [ -n "$ADMIN_PW" ]; then
        box+=("${C_TEXT3}Passwort${C_OFF} $C_BOLD$ADMIN_PW$C_OFF")
        if [ -n "$SETUP_URL" ]; then
            # Der Recovery-Schlüssel entsteht erst in der Einrichtung neu und wird dort gesichert
            box+=("${C_TEXT3}Recovery${C_OFF} folgt in der Einrichtung")
            if [ "$TLS_ACTIVE" -eq 1 ] && [ "$BIND_ADDRESS" != 127.0.0.1 ]; then
                box+=("" "${C_TEXT3}Einrichtungslink unter dem Kasten, öffnet Schritt 1 selbst (gilt 30 Minuten).${C_OFF}")
            else
                box+=("" "${C_TEXT3}Einrichtungslink unter dem Kasten (gilt 30 Minuten).${C_OFF}")
            fi
            copy+=("$SETUP_URL")
            box+=("" "${C_TEXT3}Läuft der Link ab: mit dem Passwort anmelden, die${C_OFF}")
            box+=("${C_TEXT3}Einrichtung startet dann ebenso.${C_OFF}")
        else
            box+=("${C_TEXT3}Recovery${C_OFF} $C_BOLD$ADMIN_RECOVERY$C_OFF")
            box+=("" "${C_TEXT3}Passwort beim ersten Login ändern, Recovery-Token${C_OFF}")
            box+=("${C_TEXT3}sicher notieren. Beides wird nicht erneut angezeigt.${C_OFF}")
        fi
    fi
fi
dis_box "$APP_NAME" "${box[@]}"
print_copy
echo
if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
    echo "   Nur lokal erreichbar. Für Zugriff von außen einen Reverse Proxy mit HTTPS"
    echo "   davorsetzen (siehe README) oder für das Heimnetz BIND_ADDRESS=0.0.0.0 in .env."
fi
}

if [ -n "${DIS_SUMMARY_FILE:-}" ]; then
    (umask 077; summary > "$DIS_SUMMARY_FILE")
    # Link für das umgebende Skript, das nach dem Kasten den Browser öffnet
    if [ -n "${DIS_SETUP_URL_FILE:-}" ] && [ -n "$SETUP_TOKEN" ]; then
        (umask 077; printf '%s\n' "$SETUP_URL" > "$DIS_SETUP_URL_FILE")
    fi
else
    summary
    OPEN_YES=(); [ "$ASSUME_YES" -eq 1 ] && OPEN_YES=(--yes)
    if [ -n "$SETUP_URL" ]; then bash "$REPO_DIR/scripts/open-setup.sh" "${OPEN_YES[@]}" "$SETUP_URL" || true; fi
fi
