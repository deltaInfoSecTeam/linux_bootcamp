#!/usr/bin/env bash
# Linux Bootcamp – HTTPS mit eigener, lokal vertrauter Zertifizierungsstelle
#
#   sudo ./scripts/tls.sh setup     CA und Serverzertifikat erzeugen bzw. erneuern
#   sudo ./scripts/tls.sh trust     CA im System und in Firefox/Chrome hinterlegen
#   sudo ./scripts/tls.sh untrust   CA aus System und Browsern wieder entfernen
#        ./scripts/tls.sh status    Zertifikate und Vertrauensstatus anzeigen
#
# Die CA ist per "Name Constraints" auf lokale Namen und private IP-Bereiche
# beschränkt. Selbst wenn ihr Schlüssel abhandenkommt, lassen sich damit keine
# gültigen Zertifikate für öffentliche Domains (Bank, Google …) ausstellen.
#
# Zusätzliche Hostnamen (z.B. eine interne Domain) in .env eintragen:
#   TLS_HOSTNAMES=bootcamp.intern.example.org,schule.lan

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TLS_DIR="$REPO_DIR/tls"
CA_DIR="$TLS_DIR/ca"
SRV_DIR="$TLS_DIR/server"
CONTAINER_UID=1000

HOST_SHORT="$(hostname -s 2>/dev/null || hostname)"
HOST_SHORT="${HOST_SHORT,,}"
CA_NAME="Linux Bootcamp CA ($HOST_SHORT)"
SYSTEM_CA_FILE="/usr/local/share/ca-certificates/linux-bootcamp-$HOST_SHORT.crt"
OWNER="${SUDO_USER:-$(id -un)}"

CA_DAYS=3650
# 825 Tage ist das Maximum, das iOS/macOS auch bei selbst hinterlegten CAs akzeptieren
SRV_DAYS=825
RENEW_BEFORE_DAYS=60

if [ -t 1 ]; then
    C_OK=$'\e[32m'; C_WARN=$'\e[33m'; C_ERR=$'\e[31m'; C_INFO=$'\e[36m'; C_OFF=$'\e[0m'
else
    C_OK=''; C_WARN=''; C_ERR=''; C_INFO=''; C_OFF=''
fi
info() { printf '%s==>%s %s\n' "$C_INFO" "$C_OFF" "$*"; }
ok()   { printf '%s ✔ %s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '%s ! %s %s\n' "$C_WARN" "$C_OFF" "$*" >&2; }
die()  { printf '%s ✘ %s %s\n' "$C_ERR" "$C_OFF" "$*" >&2; exit 1; }

need_root() { [ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen: sudo $0 $1"; }
command -v openssl >/dev/null || die "openssl fehlt (sudo apt install openssl)."

env_value() {
    [ -f "$REPO_DIR/.env" ] || return 0
    grep -E "^$1=" "$REPO_DIR/.env" | tail -1 | cut -d= -f2- || true
}

# --- Namen ermitteln ------------------------------------------------------
# Zusätzliche Hostnamen aus TLS_HOSTNAMES, einer pro Zeile, klein geschrieben
extra_hostnames() {
    env_value TLS_HOSTNAMES | tr ',' '\n' | tr -d ' \t\r' | tr '[:upper:]' '[:lower:]' | grep -v '^$' || true
}

# Jeder Eintrag erlaubt der CA auch alle Subdomains. Deshalb nur gültige
# Hostnamen mit mindestens einem Punkt (kein "com", keine Wildcards).
validate_hostnames() {
    local n
    while read -r n; do
        [[ "$n" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$ ]] \
            || die "Ungültiger Eintrag in TLS_HOSTNAMES: \"$n\" (erlaubt: vollständige Hostnamen wie schule.lan)"
    done < <(extra_hostnames)
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
        # Öffentliche Domains müssen bewusst in TLS_HOSTNAMES eingetragen werden.
        local fqdn; fqdn="$(hostname -f 2>/dev/null || true)"; fqdn="${fqdn,,}"
        if [ -n "$fqdn" ] && [ "$fqdn" != "$HOST_SHORT" ] && [ "$fqdn" != localhost ]; then
            case "$fqdn" in
                *.local|*.lan|*.home.arpa|*.internal|*.intern) echo "DNS:$fqdn" ;;
            esac
        fi
        extra_hostnames | sed 's/^/DNS:/'
        echo "IP:127.0.0.1"
        echo "IP:::1"
        host_ips | sed 's/^/IP:/'
    } | awk '!seen[$0]++'
}

# Erlaubte Namensräume der CA. Bewusst nur lokale Endungen und private Netze.
ca_constraints() {
    {
        for d in localhost local lan home.arpa internal intern "$HOST_SHORT"; do echo "permitted;DNS:$d"; done
        extra_hostnames | sed 's/^/permitted;DNS:/'
        echo "permitted;IP:127.0.0.0/255.0.0.0"
        echo "permitted;IP:10.0.0.0/255.0.0.0"
        echo "permitted;IP:172.16.0.0/255.240.0.0"
        echo "permitted;IP:192.168.0.0/255.255.0.0"
        echo "permitted;IP:0:0:0:0:0:0:0:1/FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF"
        echo "permitted;IP:FC00:0:0:0:0:0:0:0/FE00:0:0:0:0:0:0:0"
    } | awk '!seen[$0]++'
}

# --- CA -------------------------------------------------------------------
create_ca() {
    info "Erzeuge neue Zertifizierungsstelle \"$CA_NAME\""
    install -d -m 700 -o root -g root "$CA_DIR"
    local constraints; constraints="$(ca_constraints | paste -sd, -)"
    openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out "$CA_DIR/ca.key" 2>/dev/null
    chmod 600 "$CA_DIR/ca.key"
    openssl req -x509 -new -key "$CA_DIR/ca.key" -sha256 -days "$CA_DAYS" \
        -subj "/O=Linux Bootcamp/CN=$CA_NAME" \
        -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
        -addext "keyUsage=critical,keyCertSign,cRLSign" \
        -addext "subjectKeyIdentifier=hash" \
        -addext "nameConstraints=critical,$constraints" \
        -out "$CA_DIR/ca.crt"
    ca_constraints > "$CA_DIR/constraints"
    rm -f "$SRV_DIR/server.crt"   # altes Serverzertifikat passt nicht mehr zur neuen CA
    ok "CA erzeugt (gültig $((CA_DAYS / 365)) Jahre, beschränkt auf lokale Namen und private IPs)"
}

ca_ok() {
    [ -s "$CA_DIR/ca.key" ] && [ -s "$CA_DIR/ca.crt" ] && [ -f "$CA_DIR/constraints" ] || return 1
    openssl x509 -in "$CA_DIR/ca.crt" -noout -checkend $((365 * 86400)) >/dev/null || return 1
    # Neue Hostnamen in TLS_HOSTNAMES brauchen eine CA mit passenden Constraints
    [ -z "$(comm -13 <(sort "$CA_DIR/constraints") <(ca_constraints | sort))" ]
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
    openssl req -new -key "$tmp/server.key" -subj "/O=Linux Bootcamp/CN=$HOST_SHORT" -out "$tmp/server.csr"
    cat > "$tmp/ext.cnf" <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid
subjectAltName=$san
EOF
    openssl x509 -req -in "$tmp/server.csr" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" \
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
        echo "   Hinweis: $fqdn ist kein lokaler Name und wurde nicht aufgenommen."
        echo "   Falls gewünscht: TLS_HOSTNAMES=$fqdn in .env eintragen und erneut ausführen."
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
    for p in "$TLS_DIR" "$CA_DIR" "$SRV_DIR" "$TLS_DIR/linux-bootcamp-ca.crt" \
             "$CA_DIR/ca.key" "$CA_DIR/ca.crt" "$SRV_DIR/server.key" "$SRV_DIR/server.crt"; do
        [ -L "$p" ] && die "$p ist ein symbolischer Link – aus Sicherheitsgründen abgebrochen."
    done
    return 0
}

cmd_setup() {
    need_root setup
    no_symlinks
    validate_hostnames
    install -d -m 755 "$TLS_DIR"
    ca_ok || create_ca
    if server_cert_ok; then
        ok "Serverzertifikat ist aktuell"
    else
        create_server_cert
    fi
    # Öffentliches CA-Zertifikat zum Verteilen auf andere Geräte (Handy, Laptop)
    install -m 644 "$CA_DIR/ca.crt" "$TLS_DIR/linux-bootcamp-ca.crt"
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

cmd_trust() {
    need_root trust
    no_symlinks
    [ -s "$CA_DIR/ca.crt" ] || die "Noch keine CA vorhanden. Zuerst: sudo $0 setup"
    # Nur eine CA hinterlegen, die wirklich auf lokale Namen beschränkt ist
    openssl x509 -in "$CA_DIR/ca.crt" -noout -ext nameConstraints 2>/dev/null | grep -q 'critical' \
        || die "Die CA in $CA_DIR hat keine Namensbeschränkung – wird nicht als vertrauenswürdig hinterlegt."
    cmp -s "$CA_DIR/ca.crt" "$TLS_DIR/linux-bootcamp-ca.crt" \
        || install -m 644 "$CA_DIR/ca.crt" "$TLS_DIR/linux-bootcamp-ca.crt"

    if command -v update-ca-certificates >/dev/null; then
        install -m 644 "$CA_DIR/ca.crt" "$SYSTEM_CA_FILE"
        update-ca-certificates >/dev/null 2>&1
        ok "CA im System hinterlegt (curl, wget, Node, Python …)"
    else
        warn "update-ca-certificates fehlt – System-Vertrauensspeicher übersprungen"
    fi

    if ! ensure_certutil; then
        warn "certutil fehlt – Browser übersprungen (sudo apt install libnss3-tools)"
        return 0
    fi
    local db
    while read -r db; do
        if [ ! -f "$db/cert9.db" ]; then
            as_owner mkdir -p "$db"
            as_owner certutil -N -d "sql:$db" --empty-password
        fi
        as_owner certutil -D -d "sql:$db" -n "$CA_NAME" >/dev/null 2>&1 || true
        as_owner certutil -A -d "sql:$db" -n "$CA_NAME" -t "C,," -i "$TLS_DIR/linux-bootcamp-ca.crt" \
            || { warn "Konnte CA nicht eintragen in: $db"; continue; }
        ok "CA im Browser hinterlegt: ${db/#$(getent passwd "$OWNER" | cut -d: -f6)/\~}"
    done < <(nss_dbs)
    echo "   Laufende Browser einmal neu starten, damit sie die CA übernehmen."
}

cmd_untrust() {
    need_root untrust
    if [ -f "$SYSTEM_CA_FILE" ]; then
        rm -f "$SYSTEM_CA_FILE"
        update-ca-certificates --fresh >/dev/null 2>&1
        ok "CA aus dem System entfernt"
    fi
    if command -v certutil >/dev/null; then
        local db
        while read -r db; do
            [ -f "$db/cert9.db" ] || continue
            as_owner certutil -D -d "sql:$db" -n "$CA_NAME" >/dev/null 2>&1 \
                && ok "CA aus Browser entfernt: $db"
        done < <(nss_dbs)
    fi
}

cmd_status() {
    if [ -r "$TLS_DIR/linux-bootcamp-ca.crt" ]; then
        echo "CA:     $(openssl x509 -in "$TLS_DIR/linux-bootcamp-ca.crt" -noout -subject -enddate | paste -sd' ' -)"
    else
        echo "CA:     keine"
    fi
    if [ -r "$SRV_DIR/server.crt" ]; then
        echo "Server: $(openssl x509 -in "$SRV_DIR/server.crt" -noout -enddate)"
        openssl x509 -in "$SRV_DIR/server.crt" -noout -ext subjectAltName 2>/dev/null | tail -n +2 | sed 's/^ */        /'
    else
        echo "Server: kein Zertifikat (oder keine Leserechte, dann mit sudo)"
    fi
    [ -f "$SYSTEM_CA_FILE" ] && echo "System: vertraut" || echo "System: nicht hinterlegt"
}

case "${1:-}" in
    setup)   cmd_setup ;;
    trust)   cmd_trust ;;
    untrust) cmd_untrust ;;
    status)  cmd_status ;;
    *) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
