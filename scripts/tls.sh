#!/usr/bin/env bash
# tls – HTTPS mit eigener, lokal vertrauter Zertifizierungsstelle
#
# Alle deltaInfoSec-Apps eines Servers teilen sich eine CA unter /etc/deltainfosec/tls/ca (nur root):
# Ein Gerät vertraut ihr einmal und kennt damit jede App dieses Servers. Die CA ist per "Name
# Constraints" auf lokale Namen, die Netzwerk-Domain und private IP-Bereiche beschränkt: Selbst mit
# ihrem Schlüssel lassen sich keine Zertifikate für öffentliche Domains ausstellen. Im Repo liegen nur
# tls/<slug>-ca.crt (öffentlich) und tls/server/. Netzwerk-Domain: TLS_DOMAINS in .env (z. B. schule.lan,
# ergibt <host>.schule.lan), weitere Namen: TLS_HOSTNAMES.
#
# Aufruf:
#   ./scripts/tls.sh BEFEHL [OPTIONEN]
#
# Befehle:
#   setup          CA und Serverzertifikat erzeugen bzw. erneuern (sudo)
#   trust          CA im System und in Firefox/Chrome hinterlegen (sudo)
#   untrust        CA aus System und Browsern wieder entfernen (sudo)
#   status         Zertifikate und Vertrauensstatus anzeigen
#   release        App von der CA abmelden; die letzte App entfernt CA und Vertrauen (sudo)
#
# Optionen:
#   -y, --yes      bei setup: neue CA ohne Rückfrage, falls nötig
#   -h, --help     diese Hilfe
#
# Beispiele:
#   sudo ./scripts/tls.sh setup && sudo ./scripts/tls.sh trust            CA und Zertifikat anlegen, CA vertrauen
#   ./scripts/tls.sh status                                               Zertifikat und Laufzeit anzeigen
#   echo 'TLS_DOMAINS=schule.lan' >> .env && sudo ./scripts/tls.sh setup  Netzwerk-Domain ergänzen
#   echo 'TLS_HOSTNAMES=app.lan' >> .env && sudo ./scripts/tls.sh setup   weiteren Namen ergänzen
set -euo pipefail

# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; exit "${1:-0}"; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# App-Identität aus app.conf (APP_NAME, APP_SLUG)
APP_NAME="App"; APP_SLUG="app"
# shellcheck disable=SC1091
[ -r "$REPO_DIR/app.conf" ] && . "$REPO_DIR/app.conf"
[[ "$APP_SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { printf ' [ FAIL ] Ungültiger APP_SLUG in app.conf: %s\n' "$APP_SLUG" >&2; exit 1; }
TLS_DIR="$REPO_DIR/tls"
# Gemeinsame CA aller Apps; apps/ hält je App eine Marke mit dem Pfad ihres Klons
SHARED_DIR=/etc/deltainfosec/tls
CA_DIR="$SHARED_DIR/ca"
APPS_DIR="$SHARED_DIR/apps"
CA_ORG="deltaInfoSec"
LEGACY_CA_DIR="/etc/$APP_SLUG/tls/ca"   # frühere CA nur dieser App, wird beim setup übernommen
OLD_CA_DIR="$TLS_DIR/ca"                # noch frühere Ablage im Repo
SRV_DIR="$TLS_DIR/server"
CONTAINER_UID=1000

HOST_SHORT="$(hostname -s 2>/dev/null || hostname)"
HOST_SHORT="${HOST_SHORT,,}"
SYSTEM_CA_FILE="/usr/local/share/ca-certificates/deltainfosec-$HOST_SHORT.crt"
LEGACY_SYSTEM_CA_FILE="/usr/local/share/ca-certificates/$APP_SLUG-$HOST_SHORT.crt"
LEGACY_CA_NAME="$APP_NAME CA ($HOST_SHORT)"
OWNER="${SUDO_USER:-$(id -un)}"
ASSUME_YES=0

CA_DAYS=3650
# 825 Tage ist das Maximum, das iOS/macOS auch bei selbst hinterlegten CAs akzeptieren
SRV_DAYS=825
RENEW_BEFORE_DAYS=60

# Ausgabe über lib/dis-term.sh (Modul install), fehlt sie, schlichte Marken ohne Farbe
if [ -r "$REPO_DIR/scripts/lib/dis-term.sh" ]; then
    # shellcheck disable=SC1091
    . "$REPO_DIR/scripts/lib/dis-term.sh"
else
    dis_ok()    { printf ' [  OK  ] %s\n' "$*"; }
    dis_warn()  { printf ' [ WARN ] %s\n' "$*"; }
    dis_error() { printf ' [ FAIL ] %s\n' "$*" >&2; }
    dis_info()  { printf ' [ INFO ] %s\n' "$*"; }
    dis_kv()    { printf ' %-14s %s\n' "$1" "$2"; }
fi
info() { dis_info "$*"; }
ok()   { dis_ok "$*"; }
warn() { dis_warn "$*"; }
die()  { dis_error "$*"; exit 1; }
# Befehl ohne Ausgabe ausführen, bei Fehler die Ausgabe zeigen (openssl meldet auch Erfolg auf stderr)
quiet() { local out; out="$("$@" 2>&1)" || { printf '%s\n' "$out" >&2; return 1; }; }

confirm() {
    [ "$ASSUME_YES" -eq 1 ] && return 0
    [ -t 0 ] || die "$1 – keine Rückfrage möglich (kein Terminal). Mit --yes erneut starten."
    local answer
    read -r -p "$1 [J/n] " answer
    [[ -z "$answer" || "$answer" =~ ^[jJyY] ]]
}

need_root() { [ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen: sudo $0 $1"; }
command -v openssl >/dev/null || die "openssl fehlt (sudo apt install openssl)."

env_value() {
    [ -f "$REPO_DIR/.env" ] || return 0
    grep -E "^$1=" "$REPO_DIR/.env" | tail -1 | cut -d= -f2- || true
}

# --- Namen ermitteln ------------------------------------------------------
# Liste aus .env (kommagetrennt), ein Eintrag pro Zeile, klein geschrieben
env_list() {
    env_value "$1" | tr ',' '\n' | tr -d ' \t\r' | tr '[:upper:]' '[:lower:]' | grep -v '^$' || true
}
extra_hostnames() { env_list TLS_HOSTNAMES; }
tls_domains()     { env_list TLS_DOMAINS; }

# Lokale Endungen, die die CA immer abdeckt
LOCAL_SUFFIXES="localhost local lan home.arpa internal intern"
is_local_suffix() { case " $LOCAL_SUFFIXES " in *" $1 "*) return 0 ;; esac; return 1; }

# Jeder Eintrag erlaubt der CA auch alle Subdomains. Deshalb nur gültige Namen
# mit mindestens einem Punkt (kein "com", keine Wildcards), lokale Endungen ausgenommen.
validate_hostnames() {
    local n re='^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    while read -r n; do
        [[ "$n" =~ $re ]] || die "Ungültiger Eintrag in TLS_HOSTNAMES: \"$n\" (erlaubt: vollständige Hostnamen wie schule.lan)"
    done < <(extra_hostnames)
    while read -r n; do
        is_local_suffix "$n" || [[ "$n" =~ $re ]] \
            || die "Ungültiger Eintrag in TLS_DOMAINS: \"$n\" (erlaubt: Domains mit Punkt wie schule.lan)"
    done < <(tls_domains)
    [[ "$HOST_SHORT" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || die "Ungewöhnlicher Hostname: \"$HOST_SHORT\""
}

# Private IPv4-Adressen der echten Netzwerkkarten (ohne Docker-/VM-Bridges)
host_ips() {
    ip -4 -o addr show scope global 2>/dev/null \
        | awk '$2 !~ /^(docker|br-|veth|virbr|vnet|cni|flannel|lxc|wg|tun|tap)/ { split($4, a, "/"); print a[1] }' \
        | grep -E '^(10|192\.168|172\.(1[6-9]|2[0-9]|3[01]))\.' || true
}

# DNS-Namen und IPs, unter denen der Server erreichbar sein soll (SAN-Einträge)
server_names() {
    {
        echo "DNS:localhost"
        echo "DNS:$HOST_SHORT"
        echo "DNS:$HOST_SHORT.local"
        # Den vollen Hostnamen nur, wenn er unter einer lokalen Endung liegt.
        # Öffentliche Domains müssen bewusst in TLS_DOMAINS oder TLS_HOSTNAMES stehen.
        local fqdn; fqdn="$(hostname -f 2>/dev/null || true)"; fqdn="${fqdn,,}"
        if [ -n "$fqdn" ] && [ "$fqdn" != "$HOST_SHORT" ] && [ "$fqdn" != localhost ]; then
            case "$fqdn" in
                *.local|*.lan|*.home.arpa|*.internal|*.intern) echo "DNS:$fqdn" ;;
            esac
        fi
        tls_domains | sed "s/^/DNS:$HOST_SHORT./"
        extra_hostnames | sed 's/^/DNS:/'
        echo "IP:127.0.0.1"
        echo "IP:::1"
        host_ips | sed 's/^/IP:/'
    } | awk '!seen[$0]++'
}

# Erlaubte Namensräume einer neuen CA: lokale Endungen, Hostname, Netzwerk-Domains, weitere
# Namen und private Netze. Was eine bisherige CA schon erlaubte, bleibt erlaubt, damit die
# Namen anderer Apps dieses Servers abgedeckt bleiben.
ca_constraints() {
    {
        local d
        for d in $LOCAL_SUFFIXES "$HOST_SHORT"; do echo "permitted;DNS:$d"; done
        tls_domains | sed 's/^/permitted;DNS:/'
        extra_hostnames | sed 's/^/permitted;DNS:/'
        [ -f "$CA_DIR/constraints" ] && grep '^permitted;DNS:' "$CA_DIR/constraints"
        echo "permitted;IP:127.0.0.0/255.0.0.0"
        echo "permitted;IP:10.0.0.0/255.0.0.0"
        echo "permitted;IP:172.16.0.0/255.240.0.0"
        echo "permitted;IP:192.168.0.0/255.255.0.0"
        echo "permitted;IP:0:0:0:0:0:0:0:1/FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF"
        echo "permitted;IP:FC00:0:0:0:0:0:0:0/FE00:0:0:0:0:0:0:0"
    } | awk '!seen[$0]++'
}

# DNS-Namen des Serverzertifikats, die die Constraints-Datei $1 nicht abdeckt.
# Ein Eintrag "lan" erlaubt "lan" und alles unter ".lan".
uncovered_names() {
    local file="$1" n p hit
    local -a permitted=()
    [ -f "$file" ] && mapfile -t permitted < <(sed -n 's/^permitted;DNS://p' "$file")
    while read -r n; do
        hit=0
        for p in "${permitted[@]}"; do
            if [ "$n" = "$p" ] || [[ "$n" == *".$p" ]]; then hit=1; break; fi
        done
        [ "$hit" -eq 1 ] || echo "$n"
    done < <(server_names | sed -n 's/^DNS://p')
}

# --- CA -------------------------------------------------------------------
# Anzeigename der CA: aus dem Zertifikat, sonst der Name einer neuen CA
ca_name() {
    local cn=""
    [ -r "$CA_DIR/ca.crt" ] && cn="$(openssl x509 -in "$CA_DIR/ca.crt" -noout -subject -nameopt multiline 2>/dev/null \
        | sed -n 's/^ *commonName *= *//p')"
    echo "${cn:-$CA_ORG CA ($HOST_SHORT)}"
}

make_shared_dirs() {
    install -d -m 755 -o root -g root /etc/deltainfosec "$SHARED_DIR" "$APPS_DIR"
    install -d -m 700 -o root -g root "$CA_DIR"
}

# Andere Apps mit Marke, deren Klon noch existiert, als "slug<TAB>pfad".
# Marken ohne Klon werden dabei entfernt.
other_apps() {
    local m path
    for m in "$APPS_DIR"/*; do
        [ -f "$m" ] && [ "$(basename "$m")" != "$APP_SLUG" ] || continue
        path="$(head -1 "$m")"
        if [ -f "$path/app.conf" ]; then printf '%s\t%s\n' "$(basename "$m")" "$path"; else rm -f -- "$m"; fi
    done
    return 0
}

create_ca() {
    local name="$CA_ORG CA ($HOST_SHORT)"
    info "Erzeuge neue Zertifizierungsstelle \"$name\""
    make_shared_dirs
    local list; list="$(ca_constraints)"
    local constraints; constraints="$(paste -sd, - <<<"$list")"
    openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out "$CA_DIR/ca.key.new" 2>/dev/null
    chmod 600 "$CA_DIR/ca.key.new"
    quiet openssl req -x509 -new -key "$CA_DIR/ca.key.new" -sha256 -days "$CA_DAYS" \
        -subj "/O=$CA_ORG/CN=$name" \
        -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
        -addext "keyUsage=critical,keyCertSign,cRLSign" \
        -addext "subjectKeyIdentifier=hash" \
        -addext "nameConstraints=critical,$constraints" \
        -out "$CA_DIR/ca.crt.new"
    mv -f "$CA_DIR/ca.key.new" "$CA_DIR/ca.key"
    mv -f "$CA_DIR/ca.crt.new" "$CA_DIR/ca.crt"
    chmod 644 "$CA_DIR/ca.crt"
    rm -f -- "${CA_DIR:?}/ca.srl"
    printf '%s\n' "$list" > "$CA_DIR/constraints"
    rm -f -- "${SRV_DIR:?}/server.crt"   # altes Serverzertifikat passt nicht mehr zur neuen CA
    ok "CA erzeugt (gültig $((CA_DAYS / 365)) Jahre, beschränkt auf lokale Namen und private IPs)"
    local slug path
    while IFS=$'\t' read -r slug path; do
        warn "Die App $slug nutzt dieselbe CA und braucht ein neues Zertifikat: sudo $path/scripts/tls.sh setup"
    done < <(other_apps)
}

# Gibt nichts aus, wenn die CA in $1 weiter genutzt werden kann, sonst den Grund
ca_problem() {
    local dir="${1:-$CA_DIR}" missing
    if [ ! -s "$dir/ca.crt" ]; then
        echo "keine CA vorhanden"
    elif [ ! -s "$dir/ca.key" ]; then
        echo "der Schlüssel der CA fehlt ($dir/ca.key)"
    elif ! openssl x509 -in "$dir/ca.crt" -noout -checkend $((365 * 86400)) >/dev/null; then
        echo "die CA läuft in weniger als einem Jahr ab"
    else
        missing="$(uncovered_names "$dir/constraints" | paste -sd' ' -)"
        [ -z "$missing" ] || echo "die CA deckt diese Namen nicht ab: $missing"
    fi
}

# Noch frühere Ablage im Repo nach /etc/<slug>/tls/ca verschieben
migrate_repo_ca() {
    [ -d "$OLD_CA_DIR" ] && [ ! -L "$OLD_CA_DIR" ] || return 0
    if [ ! -s "$LEGACY_CA_DIR/ca.key" ] && [ -s "$OLD_CA_DIR/ca.key" ] && [ -s "$OLD_CA_DIR/ca.crt" ]; then
        install -d -m 700 -o root -g root "/etc/$APP_SLUG" "/etc/$APP_SLUG/tls" "$LEGACY_CA_DIR"
        local f
        for f in ca.key ca.crt constraints ca.srl; do
            [ -f "$OLD_CA_DIR/$f" ] && [ ! -L "$OLD_CA_DIR/$f" ] && install -m 600 -o root -g root "$OLD_CA_DIR/$f" "$LEGACY_CA_DIR/$f"
        done
    fi
    [ -s "$LEGACY_CA_DIR/ca.key" ] && rm -rf -- "${OLD_CA_DIR:?}"
    return 0
}

# Die frühere CA nur dieser App wird zur gemeinsamen CA, wenn es noch keine gibt und sie alle
# Namen abdeckt. So müssen Geräte, die ihr schon vertrauen, nichts neu importieren.
adopt_legacy_ca() {
    [ -d "$LEGACY_CA_DIR" ] && [ ! -L "$LEGACY_CA_DIR" ] || return 0
    if [ ! -s "$CA_DIR/ca.key" ] && [ -z "$(ca_problem "$LEGACY_CA_DIR")" ]; then
        make_shared_dirs
        local f
        for f in ca.key ca.crt constraints ca.srl; do
            [ -f "$LEGACY_CA_DIR/$f" ] && [ ! -L "$LEGACY_CA_DIR/$f" ] && install -m 600 -o root -g root "$LEGACY_CA_DIR/$f" "$CA_DIR/$f"
        done
        chmod 644 "$CA_DIR/ca.crt"
        ok "Bisherige CA der App als gemeinsame CA übernommen ($CA_DIR)"
    fi
    # Die alte Ablage nur löschen, wenn ihre CA jetzt die gemeinsame ist
    if [ -s "$CA_DIR/ca.crt" ] && cmp -s "$LEGACY_CA_DIR/ca.crt" "$CA_DIR/ca.crt"; then
        rm -rf -- "${LEGACY_CA_DIR:?}"
    fi
    return 0
}

# Neue CA nur nach Rückfrage, wenn Geräte die bisherige schon vertrauen könnten
ensure_ca() {
    local why; why="$(ca_problem)"
    if [ -z "$why" ]; then
        ok "Gemeinsame CA wird weiter genutzt ($CA_DIR)"
        return 0
    fi
    if [ -s "$CA_DIR/ca.crt" ] || [ -s "$LEGACY_CA_DIR/ca.crt" ] || [ -f "$SYSTEM_CA_FILE" ] || [ -f "$LEGACY_SYSTEM_CA_FILE" ]; then
        [ -s "$CA_DIR/ca.crt" ] || [ ! -s "$LEGACY_CA_DIR/ca.crt" ] || why="$(ca_problem "$LEGACY_CA_DIR")"
        warn "Die bisherige CA kann nicht weiter genutzt werden: $why."
        warn "Eine neue CA muss auf allen Geräten neu importiert werden."
        if [ -s "$CA_DIR/ca.crt" ] && [ ! -s "$CA_DIR/ca.key" ]; then
            warn "Gibt es noch eine Sicherung des Schlüssels: nach $CA_DIR/ca.key zurücklegen und erneut starten."
        fi
        confirm "Neue CA erzeugen?" || die "Abgebrochen, keine neue CA erzeugt."
    fi
    create_ca
}

# --- Serverzertifikat -----------------------------------------------------
create_server_cert() {
    info "Erzeuge Serverzertifikat"
    install -d -m 700 "$SRV_DIR"
    local san; san="$(server_names | paste -sd, -)"
    local tmp; tmp="$(mktemp -d)"
    # shellcheck disable=SC2064  # Pfad bewusst jetzt einsetzen
    trap "rm -rf '$tmp'" EXIT
    openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out "$tmp/server.key" 2>/dev/null
    quiet openssl req -new -key "$tmp/server.key" -subj "/O=$APP_NAME/CN=$HOST_SHORT" -out "$tmp/server.csr"
    cat > "$tmp/ext.cnf" <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
subjectAltName=$san
EOF
    quiet openssl x509 -req -in "$tmp/server.csr" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" \
        -CAcreateserial -CAserial "$CA_DIR/ca.srl" -sha256 -days "$SRV_DAYS" \
        -extfile "$tmp/ext.cnf" -out "$tmp/server.crt" \
        || die "OpenSSL konnte das Serverzertifikat nicht ausstellen (Namen: $san)."
    openssl verify -CAfile "$CA_DIR/ca.crt" "$tmp/server.crt" >/dev/null \
        || die "Neues Serverzertifikat lässt sich nicht gegen die CA prüfen."
    install -m 600 "$tmp/server.key" "$SRV_DIR/server.key"
    install -m 644 "$tmp/server.crt" "$SRV_DIR/server.crt"
    server_names > "$SRV_DIR/names"
    ok "Serverzertifikat für: $(server_names | sed 's/^[A-Z]*://' | paste -sd' ' -)"
    local fqdn; fqdn="$(hostname -f 2>/dev/null || true)"; fqdn="${fqdn,,}"
    if [ -n "$fqdn" ] && ! server_names | grep -qx "DNS:$fqdn" && [ "$fqdn" != "$HOST_SHORT" ]; then
        dis_info "$fqdn ist kein lokaler Name und wurde nicht aufgenommen."
        dis_info "Falls gewünscht: TLS_DOMAINS=${fqdn#*.} in .env eintragen und erneut ausführen."
    fi
}

server_cert_ok() {
    [ -s "$SRV_DIR/server.key" ] && [ -s "$SRV_DIR/server.crt" ] && [ -f "$SRV_DIR/names" ] || return 1
    openssl verify -CAfile "$CA_DIR/ca.crt" "$SRV_DIR/server.crt" >/dev/null 2>&1 || return 1
    openssl x509 -in "$SRV_DIR/server.crt" -noout -checkend $((RENEW_BEFORE_DAYS * 86400)) >/dev/null || return 1
    # Neue IP-Adresse oder neuer Hostname -> neu ausstellen
    [ "$(sort "$SRV_DIR/names")" = "$(server_names | sort)" ]
}

# root schreibt hier in einen Ordner, der dem Nutzer gehört: Symlinks ablehnen,
# damit nicht versehentlich (oder absichtlich) Dateien außerhalb geändert werden
no_symlinks() {
    local p
    for p in "$TLS_DIR" "$OLD_CA_DIR" "$LEGACY_CA_DIR" "$SRV_DIR" "$TLS_DIR/$APP_SLUG-ca.crt" \
             "$SRV_DIR/server.key" "$SRV_DIR/server.crt" \
             "$SRV_DIR/ca.crt"; do
        [ -L "$p" ] && die "$p ist ein symbolischer Link – aus Sicherheitsgründen abgebrochen."
    done
    return 0
}

cmd_setup() {
    need_root setup
    no_symlinks
    validate_hostnames
    local group; group="$(id -gn "$OWNER")"
    # tls/ gehört dem Nutzer, damit sich der Klon ohne sudo löschen lässt
    install -d -m 755 -o "$OWNER" -g "$group" "$TLS_DIR"
    chown -h "$OWNER:$group" "$TLS_DIR"
    migrate_repo_ca
    adopt_legacy_ca
    ensure_ca
    # Marke: diese App nutzt die gemeinsame CA (für release und uninstall --full)
    printf '%s\n' "$REPO_DIR" > "$APPS_DIR/$APP_SLUG"
    chmod 644 "$APPS_DIR/$APP_SLUG"
    if server_cert_ok; then
        ok "Serverzertifikat ist aktuell"
    else
        create_server_cert
    fi
    # Öffentliches CA-Zertifikat zum Verteilen auf andere Geräte (Handy, Laptop).
    # Die Kopie in tls/server/ sieht der Container und liefert sie unter /ca.crt aus.
    install -m 644 -o "$OWNER" -g "$group" "$CA_DIR/ca.crt" "$TLS_DIR/$APP_SLUG-ca.crt"
    install -m 644 "$CA_DIR/ca.crt" "$SRV_DIR/ca.crt"
    # Der Container läuft als UID 1000 und muss den Serverschlüssel lesen können
    chown -R -h "$CONTAINER_UID:$CONTAINER_UID" "$SRV_DIR"
    # Nutzt ein vorgeschalteter nginx dasselbe Zertifikat, neu laden
    if command -v systemctl >/dev/null && systemctl is-active --quiet nginx \
       && grep -rqs "$SRV_DIR/server.crt" /etc/nginx/; then
        nginx -t >/dev/null 2>&1 && systemctl reload nginx && ok "nginx neu geladen"
    fi
}

# --- Vertrauen hinterlegen ------------------------------------------------
# NSS-Datenbanken (Firefox-Profile, Chrome/Chromium) des Nutzers finden
nss_dbs() {
    local home; home="$(getent passwd "$OWNER" | cut -d: -f6)"
    [ -n "$home" ] || return 0
    local d
    for d in "$home"/.mozilla/firefox/*/ \
             "$home"/snap/firefox/common/.mozilla/firefox/*/ \
             "$home"/.var/app/org.mozilla.firefox/.mozilla/firefox/*/ \
             "$home"/.librewolf/*/; do
        [ -f "$d/cert9.db" ] && echo "${d%/}"
    done
    # Chrome, Chromium, Brave, Edge unter Linux nutzen ~/.pki/nssdb
    echo "$home/.pki/nssdb"
}

as_owner() { if [ "$(id -un)" = "$OWNER" ]; then "$@" </dev/null; else sudo -u "$OWNER" -H "$@" </dev/null; fi; }

ensure_certutil() {
    command -v certutil >/dev/null && return 0
    if command -v apt-get >/dev/null; then
        info "Installiere libnss3-tools (für Firefox/Chrome)"
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libnss3-tools >/dev/null
    fi
    command -v certutil >/dev/null
}

# Eintrag $1 aus allen NSS-Datenbanken des Nutzers entfernen
nss_remove() {
    command -v certutil >/dev/null || return 0
    local db home; home="$(getent passwd "$OWNER" | cut -d: -f6)"
    while read -r db; do
        [ -f "$db/cert9.db" ] || continue
        as_owner certutil -D -d "sql:$db" -n "$1" >/dev/null 2>&1 \
            && ok "\"$1\" aus Browser entfernt: ${db/#$home/\~}"
    done < <(nss_dbs)
    return 0
}

# Vertrauen in die frühere CA nur dieser App entfernen (Systemdatei und Browser-Eintrag)
remove_legacy_trust() {
    if [ -f "$LEGACY_SYSTEM_CA_FILE" ] && [ "$LEGACY_SYSTEM_CA_FILE" != "$SYSTEM_CA_FILE" ]; then
        rm -f -- "$LEGACY_SYSTEM_CA_FILE"
        ok "Frühere CA der App aus dem System entfernt"
    fi
    [ "$LEGACY_CA_NAME" = "$(ca_name)" ] || nss_remove "$LEGACY_CA_NAME"
}

cmd_trust() {
    need_root trust
    no_symlinks
    [ -s "$CA_DIR/ca.crt" ] || die "Noch keine CA vorhanden. Zuerst: sudo $0 setup"
    # Nur eine CA hinterlegen, die wirklich auf lokale Namen beschränkt ist
    openssl x509 -in "$CA_DIR/ca.crt" -noout -ext nameConstraints 2>/dev/null | grep -q 'critical' \
        || die "Die CA in $CA_DIR hat keine Namensbeschränkung – wird nicht als vertrauenswürdig hinterlegt."
    cmp -s "$CA_DIR/ca.crt" "$TLS_DIR/$APP_SLUG-ca.crt" \
        || install -m 644 -o "$OWNER" -g "$(id -gn "$OWNER")" "$CA_DIR/ca.crt" "$TLS_DIR/$APP_SLUG-ca.crt"
    local name; name="$(ca_name)"
    remove_legacy_trust

    if command -v update-ca-certificates >/dev/null; then
        install -m 644 "$CA_DIR/ca.crt" "$SYSTEM_CA_FILE"
        update-ca-certificates --fresh >/dev/null 2>&1
        ok "CA im System hinterlegt (curl, wget, Node, Python …)"
    else
        warn "update-ca-certificates fehlt – System-Vertrauensspeicher übersprungen"
    fi

    if ! ensure_certutil; then
        warn "certutil fehlt – Browser übersprungen (sudo apt install libnss3-tools)"
        return 0
    fi
    local db home; home="$(getent passwd "$OWNER" | cut -d: -f6)"
    while read -r db; do
        if [ ! -f "$db/cert9.db" ]; then
            as_owner mkdir -p "$db"
            as_owner certutil -N -d "sql:$db" --empty-password
        fi
        as_owner certutil -D -d "sql:$db" -n "$name" >/dev/null 2>&1 || true
        as_owner certutil -A -d "sql:$db" -n "$name" -t "C,," -i "$TLS_DIR/$APP_SLUG-ca.crt" \
            || { warn "Konnte CA nicht eintragen in: $db"; continue; }
        ok "CA im Browser hinterlegt: ${db/#$home/\~}"
    done < <(nss_dbs)
    dis_info "Laufende Browser einmal neu starten, damit sie die CA übernehmen."
}

cmd_untrust() {
    need_root untrust
    local name; name="$(ca_name)"
    if [ -f "$SYSTEM_CA_FILE" ] || [ -f "$LEGACY_SYSTEM_CA_FILE" ]; then
        rm -f -- "$SYSTEM_CA_FILE" "$LEGACY_SYSTEM_CA_FILE"
        update-ca-certificates --fresh >/dev/null 2>&1
        ok "CA aus dem System entfernt"
    fi
    nss_remove "$name"
    [ "$LEGACY_CA_NAME" = "$name" ] || nss_remove "$LEGACY_CA_NAME"
}

# App abmelden. Nutzt keine andere App die CA mehr, werden Vertrauen und CA entfernt.
cmd_release() {
    need_root release
    rm -f -- "${APPS_DIR:?}/${APP_SLUG:?}"
    local others; others="$(other_apps | cut -f1 | paste -sd' ' -)"
    if [ -n "$others" ]; then
        ok "App abgemeldet, die gemeinsame CA bleibt (genutzt von: $others)"
        return 0
    fi
    cmd_untrust
    if [ -d /etc/deltainfosec ]; then
        rm -rf /etc/deltainfosec
        ok "Gemeinsame CA entfernt (/etc/deltainfosec)"
    fi
}

cmd_status() {
    if [ -r "$TLS_DIR/$APP_SLUG-ca.crt" ]; then
        dis_kv "CA" "$(openssl x509 -in "$TLS_DIR/$APP_SLUG-ca.crt" -noout -subject -enddate | paste -sd' ' -)"
    else
        dis_kv "CA" "keine"
    fi
    if [ -r "$SRV_DIR/server.crt" ]; then
        dis_kv "Server" "$(openssl x509 -in "$SRV_DIR/server.crt" -noout -enddate)"
        dis_kv "Namen" "$(openssl x509 -in "$SRV_DIR/server.crt" -noout -ext subjectAltName 2>/dev/null | tail -n +2 | sed 's/^ *//')"
    else
        dis_kv "Server" "kein Zertifikat (oder keine Leserechte, dann mit sudo)"
    fi
    if [ -f "$SYSTEM_CA_FILE" ]; then dis_kv "System" "vertraut"; else dis_kv "System" "nicht hinterlegt"; fi
    local apps; apps="$(for m in "$APPS_DIR"/*; do [ -f "$m" ] && basename "$m"; done | paste -sd' ' -)"
    dis_kv "Apps" "${apps:-keine}"
}

case "${1:-}" in -h|--help) usage ;; esac
CMD="${1:-}"; shift || true
for a in "$@"; do
    case "$a" in
        -y|--yes) ASSUME_YES=1 ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $a (siehe --help)" ;;
    esac
done
case "$CMD" in
    setup)   cmd_setup ;;
    trust)   cmd_trust ;;
    untrust) cmd_untrust ;;
    release) cmd_release ;;
    status)  cmd_status ;;
    *) usage 1 ;;
esac
