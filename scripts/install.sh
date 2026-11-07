#!/usr/bin/env bash
# Linux Bootcamp – Installation / Update
#
# Prüft die Voraussetzungen, installiert bei Bedarf Docker, setzt die
# Dateirechte, legt .env an und startet den Container. Mehrfaches Ausführen
# ist unbedenklich: Bereits Erledigtes wird übersprungen.
#
#   ./scripts/install.sh                  interaktiv
#   ./scripts/install.sh --yes            ohne Rückfragen
#   ./scripts/install.sh --admin NAME     zusätzlich ersten Admin anlegen
#   ./scripts/install.sh --tls            HTTPS über nginx mit eigener lokaler CA
#   ./scripts/install.sh --tls --hostname bootcamp.lan --hostname pi.local
#                                         weitere Namen ins Zertifikat aufnehmen
#   ./scripts/install.sh --no-tls         HTTPS wieder abschalten
#
# Unterstützt Debian, Ubuntu, Raspberry Pi OS und Kali (apt-basiert).

set -euo pipefail

# --- Hilfsfunktionen ------------------------------------------------------
if [ -t 1 ]; then
    C_OK=$'\e[32m'; C_WARN=$'\e[33m'; C_ERR=$'\e[31m'; C_INFO=$'\e[36m'; C_OFF=$'\e[0m'
else
    C_OK=''; C_WARN=''; C_ERR=''; C_INFO=''; C_OFF=''
fi
info() { printf '%s==>%s %s\n' "$C_INFO" "$C_OFF" "$*"; }
ok()   { printf '%s ✔ %s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '%s ! %s %s\n' "$C_WARN" "$C_OFF" "$*" >&2; }
die()  { printf '%s ✘ %s %s\n' "$C_ERR" "$C_OFF" "$*" >&2; exit 1; }

usage() {
    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
}

ASSUME_YES=0
ADMIN_NAME=""
TLS_MODE=""          # "", "on" oder "off"
EXTRA_HOSTNAMES=()
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --admin) [ $# -ge 2 ] || die "--admin braucht einen Benutzernamen"; ADMIN_NAME="$2"; shift ;;
        --tls) TLS_MODE=on ;;
        --no-tls) TLS_MODE=off ;;
        --hostname) [ $# -ge 2 ] || die "--hostname braucht einen Namen"; EXTRA_HOSTNAMES+=("$2"); shift ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done
[ ${#EXTRA_HOSTNAMES[@]} -gt 0 ] && [ -z "$TLS_MODE" ] && TLS_MODE=on

confirm() {
    [ "$ASSUME_YES" -eq 1 ] && return 0
    [ -t 0 ] || die "$1 – keine Rückfrage möglich (kein Terminal). Mit --yes erneut starten."
    local answer
    read -r -p "$1 [j/N] " answer
    [[ "$answer" =~ ^[jJyY]$ ]]
}

# --- Kontext ermitteln ----------------------------------------------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
[ -f docker-compose.yml ] && [ -f Dockerfile ] || die "Kein Bootcamp-Projektordner: $REPO_DIR"

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
TLS_DIR="$REPO_DIR/deploy/tls"

info "Projektordner: $REPO_DIR (Besitzer: $OWNER)"

# --- 1. Docker ------------------------------------------------------------
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
if [ "$TLS_MODE" = on ] && ! command -v openssl >/dev/null 2>&1; then
    need_pkgs+=(openssl)
fi

if [ ${#need_pkgs[@]} -gt 0 ]; then
    command -v apt-get >/dev/null || die "Fehlende Pakete (${need_pkgs[*]}) und dieses System nutzt kein apt. Bitte manuell installieren: https://docs.docker.com/engine/install/"

    # Compose-v2-Paketname unterscheidet sich je nach Distribution
    pkgs=()
    for p in "${need_pkgs[@]}"; do
        if [ "$p" = compose ]; then
            $SUDO apt-get update -qq
            found=""
            for candidate in docker-compose-v2 docker-compose-plugin docker-compose; do
                ver="$(apt-cache policy "$candidate" 2>/dev/null | awk '/Candidate:/ {print $2}')"
                if [ -n "$ver" ] && [ "$ver" != "(none)" ]; then
                    # Nur Compose v2 (Go) taugt; v1 (Python, 1.x) kennt "docker compose" nicht
                    case "$ver" in 1.*|*:1.*) continue ;; esac
                    pkgs+=("$candidate"); found=1; break
                fi
            done
            [ -n "$found" ] || die "Kein Compose-v2-Paket in den Paketquellen gefunden. Siehe https://docs.docker.com/compose/install/linux/"
        else
            pkgs+=("$p")
        fi
    done

    info "Benötigte Pakete: ${pkgs[*]}"
    confirm "Diese Pakete jetzt mit apt installieren?" || die "Abgebrochen."
    $SUDO apt-get update -qq
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${pkgs[@]}"
    ok "Pakete installiert"
fi

if command -v systemctl >/dev/null 2>&1 && ! $SUDO systemctl is-active --quiet docker; then
    info "Starte Docker-Dienst"
    $SUDO systemctl enable --now docker
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
if [ "$(stat -c %U "$REPO_DIR")" != "$OWNER" ] || find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$TLS_DIR" \) -prune -o ! -user "$OWNER" -print -quit | grep -q .; then
    info "Übertrage Projektordner an $OWNER"
    find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$TLS_DIR" \) -prune -o -print0 | $SUDO xargs -0 chown "$OWNER":
fi
$SUDO mkdir -p "$REPO_DIR/data"

# Alte Datenbank aus v1.0.0 (lag im Projektwurzelverzeichnis) übernehmen
if [ -s "$REPO_DIR/bootcamp.db" ] && [ ! -e "$REPO_DIR/data/bootcamp.db" ]; then
    info "Übernehme alte Datenbank bootcamp.db nach data/"
    $SUDO mv "$REPO_DIR/bootcamp.db" "$REPO_DIR/data/bootcamp.db"
fi
$SUDO chown -R "$CONTAINER_UID:$CONTAINER_UID" "$REPO_DIR/data"
$SUDO chmod 700 "$REPO_DIR/data"
ok "Rechte gesetzt (data/ gehört UID $CONTAINER_UID)"

# --- 3. Konfiguration -----------------------------------------------------
if [ ! -f "$REPO_DIR/.env" ]; then
    $SUDO install -m 600 -o "$OWNER" -g "$(id -gn "$OWNER")" "$REPO_DIR/.env.example" "$REPO_DIR/.env"
    ok ".env aus .env.example angelegt"
else
    ok ".env vorhanden"
fi
env_value() { grep -E "^$1=" "$REPO_DIR/.env" | tail -1 | cut -d= -f2- || true; }
set_env() {
    # Setzt KEY=VALUE in .env (ersetzt vorhandenen Eintrag oder hängt an)
    local key="$1" value="$2"
    if grep -qE "^$key=" "$REPO_DIR/.env"; then
        $SUDO sed -i "s|^$key=.*|$key=$value|" "$REPO_DIR/.env"
    else
        printf '%s=%s\n' "$key" "$value" | $SUDO tee -a "$REPO_DIR/.env" >/dev/null
    fi
}

# TLS-Modus aus .env übernehmen, wenn nicht per Option gesetzt
if [ -z "$TLS_MODE" ]; then
    [[ ",$(env_value COMPOSE_PROFILES)," == *,tls,* ]] && TLS_MODE=on || TLS_MODE=off
fi

if [ "$TLS_MODE" = on ]; then
    set_env COMPOSE_PROFILES tls
    # Die App direkt nur noch lokal anbieten – sonst ginge HTTPS am Port 8000 vorbei
    if [ "$(env_value BIND_ADDRESS)" != 127.0.0.1 ]; then
        warn "BIND_ADDRESS wird auf 127.0.0.1 gesetzt: Zugriff von außen nur noch über HTTPS."
        set_env BIND_ADDRESS 127.0.0.1
    fi
    # Hinter nginx muss Express der ersten Proxy-Stufe vertrauen (Client-IP, HTTPS)
    set_env TRUST_PROXY 1
else
    if [ "$(env_value COMPOSE_PROFILES)" = tls ]; then
        set_env COMPOSE_PROFILES ""
        set_env TRUST_PROXY ""
        info "HTTPS deaktiviert"
    fi
fi

BIND_ADDRESS="$(env_value BIND_ADDRESS)"; BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
HOST_PORT="$(env_value HOST_PORT)"; HOST_PORT="${HOST_PORT:-8000}"
HTTPS_PORT="$(env_value HTTPS_PORT)"; HTTPS_PORT="${HTTPS_PORT:-443}"
HTTP_PORT="$(env_value HTTP_PORT)"; HTTP_PORT="${HTTP_PORT:-80}"

# --- 4. TLS: lokale CA und Server-Zertifikat -----------------------------
cidr_to_netmask() {
    local bits="$1" mask="" i octet
    for i in 1 2 3 4; do
        if [ "$bits" -ge 8 ]; then octet=255; bits=$((bits - 8))
        else octet=$(( 256 - (1 << (8 - bits)) )); [ "$bits" -eq 0 ] && octet=0; bits=0; fi
        mask+="${mask:+.}$octet"
    done
    echo "$mask"
}
network_of() {
    # 192.168.1.37/24 -> 192.168.1.0/255.255.255.0
    local ip="${1%/*}" bits="${1#*/}" mask a b c d m1 m2 m3 m4
    mask="$(cidr_to_netmask "$bits")"
    IFS=. read -r a b c d <<<"$ip"; IFS=. read -r m1 m2 m3 m4 <<<"$mask"
    echo "$((a & m1)).$((b & m2)).$((c & m3)).$((d & m4))/$mask"
}

if [ "$TLS_MODE" = on ]; then
    info "Bereite HTTPS vor"
    # Namen und Adressen, unter denen der Server im Heimnetz erreichbar ist
    names=("$(hostname)" "$(hostname).local" "localhost")
    fqdn="$(hostname -f 2>/dev/null || true)"
    [ -n "$fqdn" ] && [[ "$fqdn" == *.* ]] && names+=("$fqdn")
    names+=("${EXTRA_HOSTNAMES[@]}")
    # Bereits früher konfigurierte Zusatznamen beibehalten
    saved_names="$(env_value TLS_HOSTNAMES)"
    [ -n "$saved_names" ] && IFS=',' read -r -a saved_arr <<<"$saved_names" && names+=("${saved_arr[@]}")
    # Hauptname für CN und Download-Link: erster Zusatzname, sonst FQDN, sonst Hostname
    PRIMARY_NAME="${EXTRA_HOSTNAMES[0]:-}"
    [ -z "$PRIMARY_NAME" ] && [ -n "$saved_names" ] && PRIMARY_NAME="${saved_names%%,*}"
    [ -z "$PRIMARY_NAME" ] && [[ "$fqdn" == *.* ]] && PRIMARY_NAME="$fqdn"
    PRIMARY_NAME="$(printf '%s' "${PRIMARY_NAME:-$(hostname)}" | tr 'A-Z' 'a-z')"
    mapfile -t names < <(printf '%s\n' "${names[@]}" | awk 'NF' | tr 'A-Z' 'a-z' | sort -u)
    [ ${#EXTRA_HOSTNAMES[@]} -gt 0 ] && set_env TLS_HOSTNAMES "$(printf '%s\n' "${EXTRA_HOSTNAMES[@]}" ${saved_names//,/ } | awk 'NF' | sort -u | paste -sd,)"

    mapfile -t cidrs < <(ip -4 -o addr show scope global 2>/dev/null | awk '$2 !~ /^(docker|br-|veth)/ {print $4}')
    ips=("127.0.0.1"); nets=()
    for c in "${cidrs[@]}"; do ips+=("${c%/*}"); nets+=("$(network_of "$c")"); done
    mapfile -t nets < <(printf '%s\n' "${nets[@]}" | sort -u)

    san="$(printf 'DNS:%s,' "${names[@]}")$(printf 'IP:%s,' "${ips[@]}")"; san="${san%,}"

    $SUDO mkdir -p "$TLS_DIR/ca" "$TLS_DIR/certs"
    $SUDO chmod 700 "$TLS_DIR/ca"

    # CA nur einmal erzeugen – sie ist es, die auf den Geräten installiert wird.
    # Name Constraints: Die CA darf nur Zertifikate für diese Domains und das
    # Heimnetz ausstellen. Selbst bei gestohlenem CA-Schlüssel lassen sich damit
    # keine fremden Webseiten fälschen.
    if [ ! -s "$TLS_DIR/ca/ca.key" ] || [ ! -s "$TLS_DIR/ca/ca.crt" ]; then
        permitted=""
        for n in "${names[@]}"; do
            if [[ "$n" == *.* ]]; then permitted+="permitted;DNS:${n#*.},"; else permitted+="permitted;DNS:$n,"; fi
        done
        permitted+="permitted;IP:127.0.0.1/255.255.255.255,"
        for net in "${nets[@]}"; do permitted+="permitted;IP:$net,"; done
        permitted="$(printf '%s' "${permitted%,}" | tr ',' '\n' | sort -u | paste -sd,)"

        info "Erzeuge lokale Zertifizierungsstelle (einmalig, 10 Jahre gültig)"
        $SUDO openssl req -x509 -new -nodes -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
            -keyout "$TLS_DIR/ca/ca.key" -out "$TLS_DIR/ca/ca.crt" -days 3650 \
            -subj "/CN=Linux Bootcamp Local CA ($(hostname))" \
            -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
            -addext "keyUsage=critical,keyCertSign,cRLSign" \
            -addext "nameConstraints=critical,$permitted" 2>/dev/null
        $SUDO chmod 600 "$TLS_DIR/ca/ca.key"
        $SUDO rm -f "$TLS_DIR/certs/server.crt"   # neue CA -> neues Server-Zertifikat
        ok "CA erzeugt (erlaubte Bereiche: ${permitted//permitted;/})"
    fi

    # Server-Zertifikat erneuern, wenn es fehlt, bald abläuft oder Namen/IPs sich geändert haben
    renew=""
    if [ ! -s "$TLS_DIR/certs/server.crt" ]; then renew="fehlt"
    elif ! $SUDO openssl x509 -in "$TLS_DIR/certs/server.crt" -noout -checkend $((30*24*3600)) >/dev/null; then renew="läuft bald ab"
    elif [ "$($SUDO cat "$TLS_DIR/certs/.san" 2>/dev/null)" != "$san" ]; then renew="Namen/IPs geändert"
    fi
    if [ -n "$renew" ]; then
        info "Erzeuge Server-Zertifikat ($renew)"
        ext="$(mktemp)"
        printf '%s\n' "basicConstraints=critical,CA:FALSE" "keyUsage=critical,digitalSignature" \
            "extendedKeyUsage=serverAuth" "subjectAltName=$san" > "$ext"
        $SUDO openssl req -new -nodes -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
            -keyout "$TLS_DIR/certs/server.key" -subj "/CN=$PRIMARY_NAME" -out "$TLS_DIR/certs/server.csr" 2>/dev/null
        if ! $SUDO openssl x509 -req -in "$TLS_DIR/certs/server.csr" -CA "$TLS_DIR/ca/ca.crt" -CAkey "$TLS_DIR/ca/ca.key" \
                -CAcreateserial -days 397 -sha256 -extfile "$ext" -out "$TLS_DIR/certs/server.crt" 2>/dev/null \
           || ! $SUDO openssl verify -CAfile "$TLS_DIR/ca/ca.crt" "$TLS_DIR/certs/server.crt" >/dev/null 2>&1; then
            rm -f "$ext"
            die "Server-Zertifikat passt nicht zur CA (z.B. neues Netz/Domain außerhalb der Name Constraints). CA neu erzeugen: sudo rm -r $TLS_DIR/ca und Skript erneut starten – dann ca.crt auf den Geräten neu installieren."
        fi
        rm -f "$ext" ; $SUDO rm -f "$TLS_DIR/certs/server.csr"
        printf '%s' "$san" | $SUDO tee "$TLS_DIR/certs/.san" >/dev/null
        RELOAD_NGINX=1
        ok "Server-Zertifikat gültig bis $($SUDO openssl x509 -in "$TLS_DIR/certs/server.crt" -noout -enddate | cut -d= -f2)"
    else
        ok "Server-Zertifikat aktuell"
    fi
    $SUDO cp "$TLS_DIR/ca/ca.crt" "$TLS_DIR/certs/ca.crt"
    # Schlüssel gehören root (der nginx-Master liest sie ohne Zusatzrechte), Zertifikate sind öffentlich
    $SUDO chown -R root:root "$TLS_DIR"
    $SUDO chmod 600 "$TLS_DIR/certs/server.key"
    $SUDO chmod 644 "$TLS_DIR/certs/server.crt" "$TLS_DIR/certs/ca.crt"
fi

# --- 5. Bauen und starten -------------------------------------------------
info "Baue und starte die Container (beim ersten Mal dauert das einige Minuten)"
$DOCKER compose up -d --build --remove-orphans
if [ "$TLS_MODE" = off ] && $DOCKER ps -a --format '{{.Names}}' | grep -qx linux_bootcamp_nginx; then
    $DOCKER rm -f linux_bootcamp_nginx >/dev/null
fi
if [ "$TLS_MODE" = on ] && [ "${RELOAD_NGINX:-}" = 1 ]; then
    $DOCKER compose exec -T nginx nginx -s reload >/dev/null 2>&1 || true
fi

info "Warte auf den Healthcheck"
status=""
for _ in $(seq 1 60); do
    status="$($DOCKER inspect -f '{{.State.Health.Status}}' linux_bootcamp 2>/dev/null || true)"
    [ "$status" = healthy ] && break
    [ "$status" = unhealthy ] && break
    sleep 2
done
if [ "$status" != healthy ]; then
    $DOCKER compose logs --tail 30 bootcamp >&2 || true
    die "Container ist nicht gesund (Status: ${status:-unbekannt}). Logs siehe oben."
fi
ok "App-Container läuft und ist gesund"

if [ "$TLS_MODE" = on ]; then
    for _ in $(seq 1 15); do
        [ "$($DOCKER inspect -f '{{.State.Running}}' linux_bootcamp_nginx 2>/dev/null)" = true ] && break
        sleep 1
    done
    $DOCKER compose exec -T nginx nginx -t >/dev/null 2>&1 || { $DOCKER compose logs --tail 30 nginx >&2; die "nginx-Konfiguration fehlerhaft."; }
    if command -v curl >/dev/null 2>&1; then
        code="$(curl -s -o /dev/null -w '%{http_code}' --cacert "$TLS_DIR/certs/ca.crt" \
            --resolve "localhost:$HTTPS_PORT:127.0.0.1" "https://localhost:$HTTPS_PORT/" || true)"
        [ "$code" = 200 ] || { $DOCKER compose logs --tail 30 nginx >&2; die "HTTPS antwortet nicht korrekt (HTTP $code)."; }
    fi
    ok "nginx läuft, HTTPS funktioniert"
fi

# --- 6. Optional: Admin ---------------------------------------------------
if [ -n "$ADMIN_NAME" ]; then
    info "Lege Admin \"$ADMIN_NAME\" an"
    $DOCKER compose exec -T bootcamp node scripts/create-admin.js "$ADMIN_NAME"
fi

# --- Zusammenfassung ------------------------------------------------------
echo
if [ "$TLS_MODE" = on ]; then
    port_suffix=""; [ "$HTTPS_PORT" != 443 ] && port_suffix=":$HTTPS_PORT"
    http_suffix=""; [ "$HTTP_PORT" != 80 ] && http_suffix=":$HTTP_PORT"
    ok "Linux Bootcamp ist bereit unter:"
    for n in "${names[@]}"; do [ "$n" = localhost ] || echo "     https://$n$port_suffix"; done
    for ip in "${ips[@]}"; do [ "$ip" = 127.0.0.1 ] || echo "     https://$ip$port_suffix"; done
    echo
    echo "   Damit Browser dem Zertifikat vertrauen, einmal pro Gerät das CA-Zertifikat"
    echo "   installieren (Download: http://$PRIMARY_NAME$http_suffix/ca.crt) – Anleitung im README."
    echo "   Fingerabdruck zum Vergleichen beim Installieren:"
    echo "     $($SUDO openssl x509 -in "$TLS_DIR/certs/ca.crt" -noout -fingerprint -sha256 | cut -d= -f2)"
else
    ok "Linux Bootcamp ist bereit: http://$BIND_ADDRESS:$HOST_PORT"
    if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
        echo "   Nur lokal erreichbar. Für Zugriff im Heimnetz mit HTTPS: ./scripts/install.sh --tls"
    fi
fi
if [ -z "$ADMIN_NAME" ]; then
    echo "   Ersten Admin anlegen:  $DOCKER compose exec bootcamp node scripts/create-admin.js <name>"
fi
