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
#   ./scripts/install.sh --renew-ca       lokale CA neu erzeugen (danach auf
#                                         allen Geräten neu installieren)
#   ./scripts/install.sh --dns bootcamp.internal
#                                         DNS-Server fürs Heimnetz, der diesen
#                                         Namen auf den Server auflöst
#   ./scripts/install.sh --no-dns         DNS-Server wieder abschalten
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
    sed -n '2,23p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
}

ASSUME_YES=0
ADMIN_NAME=""
TLS_MODE=""          # "", "on" oder "off"
DNS_MODE=""          # "", "on" oder "off"
DNS_NAME_ARG=""
RENEW_CA=0
EXTRA_HOSTNAMES=()
valid_hostname() { [[ "$1" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$ ]]; }
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --admin) [ $# -ge 2 ] || die "--admin braucht einen Benutzernamen"; ADMIN_NAME="$2"; shift ;;
        --tls) TLS_MODE=on ;;
        --no-tls) TLS_MODE=off ;;
        --renew-ca) RENEW_CA=1 ;;
        --hostname) [ $# -ge 2 ] || die "--hostname braucht einen Namen"; EXTRA_HOSTNAMES+=("${2,,}"); shift ;;
        --dns) [ $# -ge 2 ] || die "--dns braucht einen Namen, z.B. bootcamp.internal"; DNS_MODE=on; DNS_NAME_ARG="${2,,}"; shift ;;
        --no-dns) DNS_MODE=off ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done
for n in "${EXTRA_HOSTNAMES[@]}" ${DNS_NAME_ARG:+"$DNS_NAME_ARG"}; do
    valid_hostname "$n" || die "Ungültiger Hostname: $n"
done
[ ${#EXTRA_HOSTNAMES[@]} -gt 0 ] && [ -z "$TLS_MODE" ] && TLS_MODE=on
[ "$RENEW_CA" -eq 1 ] && [ -z "$TLS_MODE" ] && TLS_MODE=on

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

# Modi aus .env übernehmen, wenn nicht per Option gesetzt
OLD_PROFILES=",$(env_value COMPOSE_PROFILES),"
if [ -z "$TLS_MODE" ]; then
    [[ "$OLD_PROFILES" == *,tls,* ]] && TLS_MODE=on || TLS_MODE=off
fi
if [ -z "$DNS_MODE" ]; then
    [[ "$OLD_PROFILES" == *,dns,* ]] && DNS_MODE=on || DNS_MODE=off
fi
DNS_NAME="${DNS_NAME_ARG:-$(env_value DNS_NAME)}"
if [ "$DNS_MODE" = on ]; then
    [ -n "$DNS_NAME" ] || die "Kein DNS-Name bekannt. Aufruf z.B.: ./scripts/install.sh --dns bootcamp.internal"
    set_env DNS_NAME "$DNS_NAME"
fi

profiles=()
[ "$TLS_MODE" = on ] && profiles+=(tls)
[ "$DNS_MODE" = on ] && profiles+=(dns)
set_env COMPOSE_PROFILES "$(IFS=,; echo "${profiles[*]:-}")"

if [ "$TLS_MODE" = on ]; then
    # Die App direkt nur noch lokal anbieten – sonst ginge HTTPS am Port 8000 vorbei
    if [ "$(env_value BIND_ADDRESS)" != 127.0.0.1 ]; then
        warn "BIND_ADDRESS wird auf 127.0.0.1 gesetzt: Zugriff von außen nur noch über HTTPS."
        set_env BIND_ADDRESS 127.0.0.1
    fi
    # Hinter nginx muss Express der ersten Proxy-Stufe vertrauen (Client-IP, HTTPS)
    set_env TRUST_PROXY 1
elif [[ "$OLD_PROFILES" == *,tls,* ]]; then
    set_env TRUST_PROXY ""
    info "HTTPS deaktiviert"
fi
[ "$DNS_MODE" = off ] && [[ "$OLD_PROFILES" == *,dns,* ]] && info "DNS-Server deaktiviert"

# Primäre LAN-Adresse = Quelladresse der Default-Route (bei mehreren Interfaces die bevorzugte)
LAN_DEV="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="dev") print $(i+1)}' | head -1)"
LAN_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="src") print $(i+1)}' | head -1)"
LAN_GW="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<NF;i++) if($i=="via") print $(i+1)}' | head -1)"

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
    [ "$DNS_MODE" = on ] && names+=("$DNS_NAME")
    # Bereits früher konfigurierte Zusatznamen beibehalten
    saved_names="$(env_value TLS_HOSTNAMES)"
    [ -n "$saved_names" ] && IFS=',' read -r -a saved_arr <<<"$saved_names" && names+=("${saved_arr[@]}")
    # Hauptname für CN und Download-Link: DNS-Name, sonst erster Zusatzname, sonst FQDN, sonst Hostname
    PRIMARY_NAME=""
    [ "$DNS_MODE" = on ] && PRIMARY_NAME="$DNS_NAME"
    [ -z "$PRIMARY_NAME" ] && PRIMARY_NAME="${EXTRA_HOSTNAMES[0]:-}"
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

    # deploy/tls/ca gehört root (700): Existenz-Prüfungen deshalb immer mit $SUDO,
    # sonst hält ein normaler Nutzer die CA für fehlend und erzeugt sie bei jedem Lauf neu.
    tls_exists() { $SUDO test -s "$1"; }
    if [ "$RENEW_CA" -eq 1 ] && tls_exists "$TLS_DIR/ca/ca.key"; then
        warn "Erzeuge die CA neu – das alte CA-Zertifikat muss auf allen Geräten entfernt und das neue installiert werden."
        confirm "Alte CA wirklich ersetzen?" || die "Abgebrochen."
        $SUDO mv "$TLS_DIR/ca" "$TLS_DIR/ca.old-$(date +%Y%m%d%H%M%S)"
    fi
    $SUDO mkdir -p "$TLS_DIR/ca" "$TLS_DIR/certs"
    $SUDO chmod 700 "$TLS_DIR/ca"

    # CA nur einmal erzeugen – sie ist es, die auf den Geräten installiert wird.
    # Name Constraints: Die CA darf nur Zertifikate für diese Domains und das
    # Heimnetz ausstellen. Selbst bei gestohlenem CA-Schlüssel lassen sich damit
    # keine fremden Webseiten fälschen.
    if ! tls_exists "$TLS_DIR/ca/ca.key" || ! tls_exists "$TLS_DIR/ca/ca.crt"; then
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
    if ! tls_exists "$TLS_DIR/certs/server.crt"; then renew="fehlt"
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

# --- 5. DNS-Server fürs Heimnetz ------------------------------------------
if [ "$DNS_MODE" = on ]; then
    info "Bereite DNS-Server für $DNS_NAME vor"
    [ -n "$LAN_IP" ] && [ -n "$LAN_GW" ] && [ -n "$LAN_DEV" ] \
        || die "LAN-Adresse oder Router nicht ermittelbar (ip route get 1.1.1.1)."
    # Stabile IPv6-Adresse (ULA fd00::/8, nicht temporär) auf dem LAN-Interface, falls vorhanden.
    # Globale IPv6-Adressen taugen nicht: das Präfix des Providers wechselt.
    LAN_IP6="$(ip -6 -o addr show dev "$LAN_DEV" scope global 2>/dev/null \
        | awk '$4 ~ /^fd/ && $0 !~ /temporary/ {sub(/\/.*/, "", $4); print $4; exit}')"
    $SUDO sed -i '/^DNS_BIND_ADDRESS6\?=/d' "$REPO_DIR/.env"
    # Der Container läuft im Host-Netzwerk. Statt einer festen IP antwortet dnsmasq
    # per interface-name immer mit der aktuellen IPv4 des LAN-Interfaces und lauscht
    # (bind-dynamic) auf allen Adressen, die das Interface gerade hat.
    dns_conf="# Von scripts/install.sh erzeugt – wird beim nächsten Lauf überschrieben.
# Beantwortet $DNS_NAME mit der aktuellen Adresse von $LAN_DEV, alles andere fragt den Router.
no-resolv
no-hosts
server=$LAN_GW
interface=$LAN_DEV
interface=lo
bind-dynamic
interface-name=$DNS_NAME,$LAN_DEV/4
cache-size=1000
pid-file="
    if [ "$($SUDO cat "$REPO_DIR/deploy/dns/bootcamp.conf" 2>/dev/null || true)" != "$dns_conf" ]; then
        printf '%s\n' "$dns_conf" | $SUDO tee "$REPO_DIR/deploy/dns/bootcamp.conf" >/dev/null
        $SUDO chmod 644 "$REPO_DIR/deploy/dns/bootcamp.conf"
        RESTART_DNS=1
    fi
    ok "DNS: $DNS_NAME -> Adresse von $LAN_DEV (jetzt $LAN_IP), Weiterleitung an $LAN_GW"
fi

# --- 6. Bauen und starten -------------------------------------------------
info "Baue und starte die Container (beim ersten Mal dauert das einige Minuten)"
$DOCKER compose up -d --build --remove-orphans
for svc in nginx:tls dns:dns; do
    name="linux_bootcamp_${svc%%:*}"
    mode_var="${svc##*:}"; [ "$mode_var" = tls ] && mode="$TLS_MODE" || mode="$DNS_MODE"
    if [ "$mode" = off ] && $DOCKER ps -a --format '{{.Names}}' | grep -qx "$name"; then
        $DOCKER rm -f "$name" >/dev/null
    fi
done
if [ "$DNS_MODE" = on ] && [ "${RESTART_DNS:-}" = 1 ]; then
    $DOCKER compose restart dns >/dev/null
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

if [ "$DNS_MODE" = on ]; then
    answer=""
    for _ in $(seq 1 15); do
        answer="$($DOCKER compose exec -T dns nslookup -type=a "$DNS_NAME" 127.0.0.1 2>/dev/null | awk '/^Name:/ {f=1} f && /^Address/ {print $NF; exit}' || true)"
        [ "$answer" = "$LAN_IP" ] && break
        sleep 1
    done
    [ "$answer" = "$LAN_IP" ] || { $DOCKER compose logs --tail 30 dns >&2; die "DNS-Server antwortet nicht korrekt für $DNS_NAME (bekam: ${answer:-nichts})."; }
    $DOCKER compose exec -T dns nslookup -type=a debian.org 127.0.0.1 >/dev/null 2>&1 \
        || warn "Weiterleitung an den Router ($LAN_GW) funktioniert nicht – Internet-Namen würden nicht aufgelöst!"
    ok "DNS-Server läuft"
fi

# --- 7. Optional: Admin ---------------------------------------------------
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
    CA_FP="$($SUDO openssl x509 -in "$TLS_DIR/certs/ca.crt" -noout -fingerprint -sha256 | cut -d= -f2)"
    # Raw-URL des Client-Skripts aus dem Git-Remote ableiten (funktioniert auch für Forks)
    origin="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || true)"
    origin="${origin%.git}"; origin="${origin#git@github.com:}"; origin="${origin#https://github.com/}"
    echo
    echo "   Damit Browser dem Zertifikat vertrauen, einmal pro Gerät die CA installieren."
    echo "   Fingerabdruck: $CA_FP"
    if [[ "$origin" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
        echo
        echo "   Linux-Clients (System, Firefox, Chromium) – auf dem jeweiligen Rechner ausführen:"
        echo "     curl -fsSL https://raw.githubusercontent.com/$origin/main/scripts/trust-ca.sh | bash -s -- --server $PRIMARY_NAME --ip ${LAN_IP:-<server-ip>} --fingerprint $CA_FP"
    fi
    echo
    echo "   Android/iOS/Windows: http://$PRIMARY_NAME$http_suffix/ca.crt laden, Fingerabdruck vergleichen,"
    echo "   als vertrauenswürdige CA installieren (Anleitung im README)."
else
    ok "Linux Bootcamp ist bereit: http://$BIND_ADDRESS:$HOST_PORT"
    if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
        echo "   Nur lokal erreichbar. Für Zugriff im Heimnetz mit HTTPS: ./scripts/install.sh --tls"
    fi
fi
if [ "$DNS_MODE" = on ]; then
    echo
    echo "   DNS: Damit Geräte $DNS_NAME finden, im Router als DNS-Server verteilen:"
    echo "     IPv4: $LAN_IP   (dem Server im Router eine feste IPv4 zuweisen!)"
    if [ -n "${LAN_IP6:-}" ]; then
        echo "     IPv6: $LAN_IP6"
    else
        echo "     IPv6: keine stabile ULA-Adresse vorhanden – im Router ULA aktivieren, Skript erneut starten"
    fi
    echo "   Läuft dieser Server nicht, funktioniert im Heimnetz keine Namensauflösung mehr."
fi
if [ -z "$ADMIN_NAME" ]; then
    echo "   Ersten Admin anlegen:  $DOCKER compose exec bootcamp node scripts/create-admin.js <name>"
fi
