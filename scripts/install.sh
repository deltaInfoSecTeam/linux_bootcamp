#!/usr/bin/env bash
# Linux Bootcamp – Installation / Update
#
# Prüft die Voraussetzungen, installiert bei Bedarf Docker, setzt die
# Dateirechte, legt .env an und startet den Container. Mehrfaches Ausführen
# ist unbedenklich: Bereits Erledigtes wird übersprungen.
#
#   ./scripts/install.sh               interaktiv
#   ./scripts/install.sh --yes         ohne Rückfragen (z.B. für Automatisierung)
#   ./scripts/install.sh --admin NAME  zusätzlich ersten Admin anlegen
#   ./scripts/install.sh --tls         HTTPS mit lokal vertrauter CA (grünes Schloss)
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
    sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
}

ASSUME_YES=0
ADMIN_NAME=""
WANT_TLS=0
while [ $# -gt 0 ]; do
    case "$1" in
        -y|--yes) ASSUME_YES=1 ;;
        --admin) [ $# -ge 2 ] || die "--admin braucht einen Benutzernamen"; ADMIN_NAME="$2"; shift ;;
        --tls) WANT_TLS=1 ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done

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
# data/ und tls/ haben eigene Besitzer (Container bzw. root) und bleiben außen vor
if [ "$(stat -c %U "$REPO_DIR")" != "$OWNER" ] || find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$REPO_DIR/tls" \) -prune -o ! -user "$OWNER" -print -quit | grep -q .; then
    info "Übertrage Projektordner an $OWNER"
    $SUDO find "$REPO_DIR" \( -path "$REPO_DIR/data" -o -path "$REPO_DIR/tls" \) -prune -o -exec chown -h "$OWNER": {} +
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
BIND_ADDRESS="$(env_value BIND_ADDRESS)"; BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
HOST_PORT="$(env_value HOST_PORT)"; HOST_PORT="${HOST_PORT:-8000}"

# --- 4. HTTPS (optional) -------------------------------------------------
# Einmal mit --tls eingerichtet, wird das Zertifikat bei jedem weiteren Lauf
# geprüft und bei Bedarf erneuert (Ablauf, neue IP-Adresse, neuer Hostname).
TLS_ACTIVE=0
[ -n "$(env_value TLS_CERT_PATH)" ] && TLS_ACTIVE=1
if [ "$WANT_TLS" -eq 1 ] && [ "$TLS_ACTIVE" -eq 0 ]; then
    echo "   HTTPS-Einrichtung: Es wird eine eigene Zertifizierungsstelle (CA) erzeugt,"
    echo "   die nur für lokale Namen und private IP-Adressen gilt. Sie wird im System"
    echo "   und in Firefox/Chrome von $OWNER als vertrauenswürdig hinterlegt."
    confirm "HTTPS jetzt einrichten?" || die "Abgebrochen."
    TLS_ACTIVE=1
fi
$SUDO install -d -m 700 -o "$CONTAINER_UID" -g "$CONTAINER_UID" "$REPO_DIR/tls/server" 2>/dev/null \
    || $SUDO mkdir -p "$REPO_DIR/tls/server"
CERT_BEFORE=""
if [ "$TLS_ACTIVE" -eq 1 ]; then
    CERT_BEFORE="$($SUDO sha256sum "$REPO_DIR/tls/server/server.crt" 2>/dev/null || true)"
    $SUDO env SUDO_USER="$OWNER" bash "$REPO_DIR/scripts/tls.sh" setup
    $SUDO env SUDO_USER="$OWNER" bash "$REPO_DIR/scripts/tls.sh" trust
    env_set TLS_CERT_PATH /app/tls/server.crt
    env_set TLS_KEY_PATH /app/tls/server.key
fi

# --- 5. Bauen und starten -------------------------------------------------
info "Baue und starte den Container (beim ersten Mal dauert das einige Minuten)"
$DOCKER compose up -d --build
if [ "$TLS_ACTIVE" -eq 1 ] && [ -n "$CERT_BEFORE" ] \
   && [ "$CERT_BEFORE" != "$($SUDO sha256sum "$REPO_DIR/tls/server/server.crt" 2>/dev/null || true)" ]; then
    info "Zertifikat wurde erneuert – starte Container neu"
    $DOCKER compose restart bootcamp
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
ok "Container läuft und ist gesund"

# --- 6. Optional: Admin ---------------------------------------------------
if [ -n "$ADMIN_NAME" ]; then
    info "Lege Admin \"$ADMIN_NAME\" an"
    $DOCKER compose exec -T bootcamp node scripts/create-admin.js "$ADMIN_NAME"
fi

# --- Zusammenfassung ------------------------------------------------------
echo
PROTO=http; [ "$TLS_ACTIVE" -eq 1 ] && PROTO=https
if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then SHOW_HOST=localhost; else SHOW_HOST="$(hostname -s)"; fi
ok "Linux Bootcamp ist bereit: $PROTO://$SHOW_HOST:$HOST_PORT"
if [ "$TLS_ACTIVE" -eq 1 ]; then
    echo "   Andere Geräte (Handy, Laptop): Datei tls/linux-bootcamp-ca.crt dort als"
    echo "   vertrauenswürdige Zertifizierungsstelle importieren (siehe README)."
fi
if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
    echo "   Nur lokal erreichbar. Für Zugriff von außen einen Reverse Proxy mit HTTPS"
    echo "   davorsetzen (siehe README) oder für das Heimnetz BIND_ADDRESS=0.0.0.0 in .env."
fi
if [ -z "$ADMIN_NAME" ]; then
    echo "   Ersten Admin anlegen:  $DOCKER compose exec bootcamp node scripts/create-admin.js <name>"
fi
