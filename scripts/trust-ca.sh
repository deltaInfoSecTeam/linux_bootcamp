#!/usr/bin/env bash
# trust-ca – lokale CA einer App auf einem Linux-CLIENT vertrauen
#
# Lädt das CA-Zertifikat vom App-Server, prüft den SHA-256-Fingerabdruck und trägt es in den
# System-Zertifikatsspeicher, alle Firefox-Profile und den NSS-Speicher von Chromium/Chrome ein.
# Den passenden Aufruf samt Fingerabdruck zeigt "scripts/install.sh --tls" auf dem Server.
# Unterstützt Debian/Ubuntu/Kali, Fedora/RHEL und Arch.
#
# Aufruf:
#   trust-ca.sh --server NAME --fingerprint FP [OPTIONEN]
#
# Optionen:
#   --server NAME        Name des Servers (Pflicht)
#   --fingerprint FP     erwarteter SHA-256-Fingerabdruck der CA (Pflicht)
#   --name APPNAME       Anzeigename der App wie in app.conf (Standard: App)
#   --slug KUERZEL       Kürzel der App wie in app.conf (Standard: app)
#   --port PORT          HTTPS-Port des Servers (Standard: 443)
#   --ip ADRESSE         falls NAME nicht auflösbar: Eintrag in /etc/hosts anlegen
#   --ca-file DATEI      CA aus einer Datei statt vom Server nehmen
#   --open URL           danach diesen Link (Einrichtungslink) im Browser öffnen
#   --replace-old        ältere CAs derselben App mit anderem Fingerabdruck entfernen
#   --dry-run            nur anzeigen, was passieren würde
#   --uninstall          diese CA (und den hosts-Eintrag) wieder entfernen
#   -h, --help           diese Hilfe
#
# Beispiele:
#   ssh johndoe@app.lan cat ~/deltainfosec/meine-app/app/scripts/trust-ca.sh \
#     | bash -s -- --server app.lan --fingerprint AB:CD:... --open "https://app.lan/#setup=TOKEN"   per SSH, danach Einrichtung
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/trust-ca.sh \
#     | bash -s -- --name "Meine App" --slug meine-app --server app.lan --fingerprint AB:CD:...   CA ohne Klon vertrauen
#   bash trust-ca.sh --server app.lan --fingerprint AB:CD:... --dry-run                           nur anzeigen
#   bash trust-ca.sh --server app.lan --fingerprint AB:CD:... --uninstall                         Vertrauen entfernen
set -euo pipefail

# Hilfe = Kopfkommentar ab Zeile 2 bis zur ersten Zeile ohne #
usage() { awk 'NR > 1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0" 2>/dev/null \
    || echo "Hilfe steht im Kopf der Skriptdatei (per curl | bash nicht lesbar)."; exit "${1:-0}"; }

# Ausgabe im Stil des Installers. Liegt lib/dis-term.sh neben dem Skript (Repo-Klon), wird sie
# genutzt, sonst (curl | bash, einzeln kopiert) der eingebaute Ersatz in denselben Farben.
SELF="${BASH_SOURCE[0]:-}"; HERE=""
[ -f "$SELF" ] && HERE="$(cd "$(dirname "$SELF")" && pwd)"
if [ -n "$HERE" ] && [ -r "$HERE/lib/dis-term.sh" ]; then
    # shellcheck disable=SC1091
    . "$HERE/lib/dis-term.sh"
else
    if [ -t 1 ] && [ -z "${NO_COLOR:-}" ] && [ "${TERM:-dumb}" != dumb ]; then
        case "${COLORTERM:-}" in
            truecolor|24bit) _c() { printf '\e[38;2;%d;%d;%dm' "$1" "$2" "$3"; } ;;
            *) _c() { printf '\e[38;5;%dm' "$4"; } ;;
        esac
        C_GOLD=$(_c 226 168 58 178); C_CREST=$(_c 214 153 38 172); C_MATRIX=$(_c 63 214 138 78)
        C_WARN=$(_c 242 179 61 214); C_DANGER=$(_c 240 96 106 203); C_TEXT=$(_c 231 233 236 255)
        C_TEXT2=$(_c 163 171 184 248); C_TEXT3=$(_c 107 116 130 243); C_BOLD=$'\e[1m'; C_OFF=$'\e[0m'
    else
        C_GOLD='' C_CREST='' C_MATRIX='' C_WARN='' C_DANGER='' C_TEXT='' C_TEXT2='' C_TEXT3='' C_BOLD='' C_OFF=''
    fi
    if [[ "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" =~ [Uu][Tt][Ff]-?8 ]]; then
        DIS_H='─' DIS_V='│' DIS_TL='┌' DIS_TR='┐' DIS_BL='└' DIS_BR='┘' DIS_DOT='·'
    else
        DIS_H='-' DIS_V='|' DIS_TL='+' DIS_TR='+' DIS_BL='+' DIS_BR='+' DIS_DOT='.'
    fi
    dis_ok()    { printf ' %s[  OK  ]%s %s\n' "$C_MATRIX" "$C_OFF" "$*"; }
    dis_warn()  { printf ' %s[ WARN ]%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
    dis_error() { printf ' %s[ FAIL ]%s %s\n' "$C_DANGER" "$C_OFF" "$*" >&2; }
    dis_info()  { printf ' %s[ INFO ]%s %s%s%s\n' "$C_TEXT3" "$C_OFF" "$C_TEXT2" "$*" "$C_OFF"; }
    dis_rule()  { local s='' i; for ((i = 0; i < $1; i++)); do s+="$DIS_H"; done; printf '%s' "$s"; }
    dis_box() {
        local title=$1 w=58 line plain; shift
        for line in "$@"; do
            plain="$(printf '%s' "$line" | sed 's/\x1b\[[0-9;]*m//g')"
            [ $((${#plain} + 3)) -gt "$w" ] && w=$((${#plain} + 3))
        done
        printf '\n %s%s%s %s%s%s %s%s%s\n' "$C_GOLD" "$DIS_TL$DIS_H" "$C_OFF" "$C_BOLD$C_GOLD" "$title" "$C_OFF" \
            "$C_GOLD" "$(dis_rule $((w - ${#title} - 2)))$DIS_TR" "$C_OFF"
        for line in "$@"; do
            plain="$(printf '%s' "$line" | sed 's/\x1b\[[0-9;]*m//g')"
            printf ' %s%s%s  %s%*s%s%s%s\n' "$C_GOLD" "$DIS_V" "$C_OFF" "$line" $((w - 1 - ${#plain})) '' "$C_GOLD" "$DIS_V" "$C_OFF"
        done
        printf ' %s%s%s%s\n' "$C_GOLD" "$DIS_BL" "$(dis_rule $((w + 1)))$DIS_BR" "$C_OFF"
    }
    dis_banner() {
        echo
        [ -n "${2:-}" ] && printf ' %s> %s%s\n\n' "$C_MATRIX" "${2^^}" "$C_OFF"
        printf ' %s%s%s\n\n' "$C_BOLD$C_GOLD" "${1^^}" "$C_OFF"
        [ -n "${3:-}" ] && printf ' %s%s%s\n' "$C_TEXT2" "$3" "$C_OFF"
        printf ' %s%s %sdeltaInfoSec%s\n' "$C_TEXT3" "$(dis_rule 40)" "$C_TEXT3" "$C_OFF"
    }
fi
section() {
    printf '\n %s>%s  %s%s%s\n' "$C_MATRIX" "$C_OFF" "$C_BOLD$C_TEXT" "$1" "$C_OFF"   # Titel in Großbuchstaben übergeben
    printf ' %s%s%s\n' "$C_TEXT3" "$(dis_rule 60)" "$C_OFF"
}
IND='          '   # Folgezeilen beginnen in Spalte 11, bündig mit dem Text hinter den Marken
info() { dis_info "$*"; }
ok()   { dis_ok "$*"; }
warn() { dis_warn "$*"; }
more() { printf '%s%s\n' "$IND" "$*"; }
# Mehrzeilige Meldung: erste Zeile mit Marke, Rest eingerückt
die() {
    local m="$*"
    dis_error "${m%%$'\n'*}"
    [[ "$m" == *$'\n'* ]] && printf '%s\n' "${m#*$'\n'}" | sed "s/^[[:space:]]*/$IND/" >&2
    exit 1
}
# Werteliste umbrechen: "  Namen  a b c", Folgezeilen bündig unter dem ersten Wert
kv_wrap() {
    local label=$1 line='' w; shift
    for w in "$@"; do
        if [ -n "$line" ] && [ $((${#line} + ${#w} + 1)) -gt 46 ]; then
            printf '%s%s%-6s%s %s\n' "$IND" "$C_TEXT3" "$label" "$C_OFF" "$line"; label=''; line="$w"
        else
            line="${line:+$line }$w"
        fi
    done
    [ -n "$line" ] && printf '%s%s%-6s%s %s\n' "$IND" "$C_TEXT3" "$label" "$C_OFF" "$line"
}
# Netzmaske in Präfixlänge: 255.240.0.0 -> 12, FE00:0:… -> 7
mask_bits() {
    local m=$1 n=0 p v
    if [[ "$m" == *:* ]]; then
        local IFS=:; for p in $m; do v=$((16#${p:-0})); while [ "$v" -gt 0 ]; do n=$((n + (v & 1))); v=$((v >> 1)); done; done
    else
        local IFS=.; for p in $m; do v=$p; while [ "$v" -gt 0 ]; do n=$((n + (v & 1))); v=$((v >> 1)); done; done
    fi
    echo "$n"
}
# IPv6 kürzen: FC00:0:0:0:0:0:0:0 -> fc00::, 0:0:0:0:0:0:0:1 -> ::1
v6_short() {
    local a=":${1,,}:" run
    for run in :0:0:0:0:0:0:0:0: :0:0:0:0:0:0:0: :0:0:0:0:0:0: :0:0:0:0:0: :0:0:0:0: :0:0:0: :0:0:; do
        [[ "$a" == *"$run"* ]] && { a="${a/"$run"/::}"; break; }
    done
    [[ "$a" == :[!:]* ]] && a="${a#:}"
    [[ "$a" == *[!:]: ]] && a="${a%:}"
    echo "$a"
}
# "IP:10.0.0.0/255.0.0.0" -> "10.0.0.0/8"
to_cidr() {
    local v=${1#IP:} addr mask
    addr=${v%/*}; mask=${v#*/}
    [[ "$addr" == *:* ]] && addr=$(v6_short "$addr")
    echo "$addr/$(mask_bits "$mask")"
}

APP_NAME="App"; APP_SLUG="app"
SERVER=""; FINGERPRINT=""; PORT=443; HOST_IP=""; CA_FILE=""; OPEN_URL=""
REPLACE_OLD=0; DRY_RUN=0; UNINSTALL=0
while [ $# -gt 0 ]; do
    case "$1" in
        --name) [ $# -ge 2 ] || die "--name braucht einen Wert"; APP_NAME="$2"; shift ;;
        --slug) [ $# -ge 2 ] || die "--slug braucht einen Wert"; APP_SLUG="$2"; shift ;;
        --server) [ $# -ge 2 ] || die "--server braucht einen Namen"; SERVER="${2,,}"; shift ;;
        --fingerprint) [ $# -ge 2 ] || die "--fingerprint braucht einen Wert"; FINGERPRINT="$2"; shift ;;
        --port) [ $# -ge 2 ] || die "--port braucht eine Zahl"; PORT="$2"; shift ;;
        --ip) [ $# -ge 2 ] || die "--ip braucht eine Adresse"; HOST_IP="$2"; shift ;;
        --ca-file) [ $# -ge 2 ] || die "--ca-file braucht einen Pfad"; CA_FILE="$2"; shift ;;
        --open) [ $# -ge 2 ] || die "--open braucht einen Link"; OPEN_URL="$2"; shift ;;
        --replace-old) REPLACE_OLD=1 ;;
        --dry-run) DRY_RUN=1 ;;
        --uninstall) UNINSTALL=1 ;;
        -h|--help) usage ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done

[[ "$SERVER" =~ ^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$ ]] || die "--server fehlt oder ist ungültig"
[[ "$PORT" =~ ^[0-9]{1,5}$ ]] && [ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || die "--port ist ungültig"
[ -z "$HOST_IP" ] || [[ "$HOST_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || die "--ip muss eine IPv4-Adresse sein"
[ -z "$CA_FILE" ] || [ -r "$CA_FILE" ] || die "--ca-file ist nicht lesbar: $CA_FILE"
# ] steht vorn in der Klasse, sonst beendet es sie (IPv6 in eckigen Klammern)
url_re='^https?://[][A-Za-z0-9.:-]+/(#setup=[A-Za-z0-9_-]+)?$'
[ -z "$OPEN_URL" ] || [[ "$OPEN_URL" =~ $url_re ]] || die "--open ist kein gültiger Einrichtungslink"
command -v openssl >/dev/null || die "openssl fehlt (z.B. sudo apt install openssl)"

# Nutzer, dessen Browser-Profile bearbeitet werden (auch bei Aufruf mit sudo)
TARGET_USER="${SUDO_USER:-$(id -un)}"
TARGET_HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)"
[ -n "$TARGET_HOME" ] || die "Heimverzeichnis von $TARGET_USER nicht gefunden"
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi
[ "$(id -u)" -ne 0 ] || [ -n "${SUDO_USER:-}" ] \
    || warn "Läuft direkt als root: es werden die Browser-Profile von root bearbeitet."
as_user() { if [ "$(id -un)" = "$TARGET_USER" ]; then "$@"; else sudo -u "$TARGET_USER" -- "$@"; fi; }
run() { if [ "$DRY_RUN" -eq 1 ]; then printf '%s%s[dry-run]%s %s\n' "$IND" "$C_TEXT3" "$C_OFF" "$*"; else "$@"; fi; }
norm_fp() { printf '%s' "$1" | tr -d ': \n' | tr 'a-f' 'A-F'; }
fp_of_file() { openssl x509 -in "$1" -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2; }
# Betreff immer als "O = …, CN = …" (OpenSSL 3 schreibt sonst "O=…")
subject_of_file() {
    openssl x509 -in "$1" -noout -subject -nameopt oneline 2>/dev/null \
        || openssl x509 -in "$1" -noout -subject 2>/dev/null
}

[[ "$APP_SLUG" =~ ^[a-z0-9][a-z0-9-]{0,40}$ ]] || die "--slug ungültig: $APP_SLUG"
# Die gemeinsame CA aller deltaInfoSec-Apps (O = deltaInfoSec) wird einmal je Server eingetragen,
# eine frühere CA nur dieser App unter dem Namen der App
CA_ORG="deltaInfoSec"
CA_NAME="$APP_NAME CA ($SERVER)"
CA_FILE_NAME="$APP_SLUG-${SERVER//./-}.crt"
set_shared_names() {
    subject_of_file "$1" | grep -qF "O = $CA_ORG" || return 0
    CA_NAME="$CA_ORG CA ($SERVER)"
    CA_FILE_NAME="deltainfosec-${SERVER//./-}.crt"
}
# Frühere CAs: dieser App oder die gemeinsame
is_app_ca() { subject_of_file "$1" | grep -qE "O = ($APP_NAME|$CA_ORG)(,|$)"; }
HOSTS_MARK="# $APP_SLUG $SERVER"

# Startbild wie im Installer: zufällig aus banners/*.txt neben dem Skript, sonst banner.txt
banners=()
if [ -n "$HERE" ]; then
    for f in "$HERE"/banners/*.txt; do [ -r "$f" ] && banners+=("$f"); done
    if [ ${#banners[@]} -gt 0 ]; then DIS_BANNER_FILE="${banners[RANDOM % ${#banners[@]}]}"
    elif [ -r "$HERE/banner.txt" ]; then DIS_BANNER_FILE="$HERE/banner.txt"; fi
fi
dis_banner "$APP_NAME" "$APP_SLUG" "CA vertrauen"

# --- Speicher ermitteln --------------------------------------------------
if [ -d /usr/local/share/ca-certificates ] && command -v update-ca-certificates >/dev/null; then
    SYS_DIR=/usr/local/share/ca-certificates; SYS_UPDATE=(update-ca-certificates --fresh)
elif [ -d /etc/pki/ca-trust/source/anchors ] && command -v update-ca-trust >/dev/null; then
    SYS_DIR=/etc/pki/ca-trust/source/anchors; SYS_UPDATE=(update-ca-trust extract)
elif [ -d /etc/ca-certificates/trust-source/anchors ] && command -v trust >/dev/null; then
    SYS_DIR=/etc/ca-certificates/trust-source/anchors; SYS_UPDATE=(trust extract-compat)
else
    die "Unbekannter System-Zertifikatsspeicher. Bitte die CA manuell installieren (siehe README)."
fi

# Firefox-Profile (klassisch, Flatpak, Snap) und Chromium-NSS-Datenbank
mapfile -t NSS_DBS < <(
    for base in "$TARGET_HOME/.mozilla/firefox" \
                "$TARGET_HOME/.var/app/org.mozilla.firefox/.mozilla/firefox" \
                "$TARGET_HOME/snap/firefox/common/.mozilla/firefox"; do
        for p in "$base"/*/; do [ -f "$p/cert9.db" ] && echo "${p%/}"; done
    done 2>/dev/null
)
CHROME_DB="$TARGET_HOME/.pki/nssdb"
USE_CHROME=0
if command -v chromium >/dev/null || command -v chromium-browser >/dev/null \
   || command -v google-chrome >/dev/null || [ -d "$CHROME_DB" ]; then
    USE_CHROME=1
fi
db_label() { case "$1" in "$CHROME_DB") echo "Chromium/Chrome" ;; *) echo "Firefox-Profil $(basename "$1")" ;; esac; }

have_certutil() { command -v certutil >/dev/null; }
ensure_certutil() {
    have_certutil && return 0
    info "certutil fehlt (für die Zertifikatsspeicher der Browser)"
    if command -v apt-get >/dev/null; then run $SUDO apt-get install -y -qq libnss3-tools
    elif command -v dnf >/dev/null; then run $SUDO dnf install -y -q nss-tools
    elif command -v pacman >/dev/null; then run $SUDO pacman -S --noconfirm --needed nss
    else warn "certutil nicht installierbar – Browser bitte manuell einrichten (siehe README)"; return 1
    fi
    [ "$DRY_RUN" -eq 1 ] || have_certutil
}

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
chmod 755 "$TMP"   # der Zielnutzer (bei sudo) muss die Datei lesen können

# Zertifikate einer NSS-Datenbank, deren Betreff "O = $APP_NAME" enthält,
# jeweils als "Spitzname<TAB>Fingerabdruck"
app_certs_in_db() {
    local db="$1" nick fp
    have_certutil || return 0
    while IFS= read -r nick; do
        [ -n "$nick" ] || continue
        as_user certutil -d "sql:$db" -L -n "$nick" -a 2>/dev/null > "$TMP/nss.pem" || continue
        is_app_ca "$TMP/nss.pem" || continue
        fp="$(fp_of_file "$TMP/nss.pem")"
        printf '%s\t%s\n' "$nick" "$fp"
    done < <(as_user certutil -d "sql:$db" -L 2>/dev/null | tail -n +5 \
             | sed -E 's/[[:space:]]+[^[:space:]]*,[^[:space:]]*,[^[:space:]]*[[:space:]]*$//')
}

# --- Deinstallation ------------------------------------------------------
if [ "$UNINSTALL" -eq 1 ]; then
    section "ENTFERNEN"
    # Gemeinsame CA und frühere CA nur dieser App
    names=("$CA_ORG CA ($SERVER)" "$CA_NAME")
    files=("deltainfosec-${SERVER//./-}.crt" "$CA_FILE_NAME")
    removed=0
    for f in "${files[@]}"; do
        [ -f "$SYS_DIR/$f" ] || continue
        run $SUDO rm -f "$SYS_DIR/$f"; removed=1
    done
    if [ "$removed" -eq 1 ]; then
        run $SUDO "${SYS_UPDATE[@]}"
        ok "aus dem Systemspeicher entfernt"
    fi
    dbs=("${NSS_DBS[@]}"); [ "$USE_CHROME" -eq 1 ] && [ -d "$CHROME_DB" ] && dbs+=("$CHROME_DB")
    for db in "${dbs[@]}"; do
        for n in "${names[@]}"; do
            if have_certutil && as_user certutil -d "sql:$db" -L -n "$n" >/dev/null 2>&1; then
                run as_user certutil -d "sql:$db" -D -n "$n"
                ok "$(db_label "$db"): $n entfernt"
            fi
        done
    done
    if grep -qF "$HOSTS_MARK" /etc/hosts; then
        run $SUDO sed -i "\|$HOSTS_MARK|d" /etc/hosts
        ok "hosts-Eintrag entfernt"
    fi
    dis_box "CA ENTFERNT" "Browser einmal neu starten."
    exit 0
fi

[ -n "$FINGERPRINT" ] || die "--fingerprint fehlt. Den korrekten Aufruf zeigt scripts/install.sh auf dem Server an."
WANT_FP="$(norm_fp "$FINGERPRINT")"
[[ "$WANT_FP" =~ ^[0-9A-F]{64}$ ]] || die "--fingerprint ist kein SHA-256-Fingerabdruck"

# --- 1. Namensauflösung --------------------------------------------------
section "PRÜFEN"
NEED_RESOLVE=0
if ! getent hosts "$SERVER" >/dev/null; then
    [ -n "$HOST_IP" ] || die "$SERVER ist nicht auflösbar. Mit --ip <Server-IP> einen hosts-Eintrag anlegen lassen."
    info "Lege hosts-Eintrag an: $HOST_IP $SERVER"
    if [ "$DRY_RUN" -eq 1 ]; then
        printf '%s%s[dry-run]%s %s  %s  %s >> /etc/hosts\n' "$IND" "$C_TEXT3" "$C_OFF" "$HOST_IP" "$SERVER" "$HOSTS_MARK"
        NEED_RESOLVE=1
    else
        printf '%s\t%s\t%s\n' "$HOST_IP" "$SERVER" "$HOSTS_MARK" | $SUDO tee -a /etc/hosts >/dev/null
    fi
fi

# --- 2. CA besorgen und prüfen -------------------------------------------
if [ -n "$CA_FILE" ]; then
    cp "$CA_FILE" "$TMP/ca.crt"
else
    command -v curl >/dev/null || die "curl fehlt (z.B. sudo apt install curl)"
    url="https://$SERVER:$PORT/ca.crt"
    info "Lade CA von $url"
    # Die CA ist hier noch nicht vertraut: Abruf ohne TLS-Prüfung, die Echtheit
    # sichert stattdessen der Fingerabdruck-Vergleich direkt danach.
    resolve=(); [ "$NEED_RESOLVE" -eq 1 ] && resolve=(--resolve "$SERVER:$PORT:$HOST_IP")
    curl -fsS -k -m 10 "${resolve[@]}" -o "$TMP/ca.crt" "$url" \
        || die "CA-Zertifikat nicht abrufbar ($url). Läuft der Server mit HTTPS (install.sh --tls)?"
fi
chmod 644 "$TMP/ca.crt"
openssl x509 -in "$TMP/ca.crt" -noout >/dev/null 2>&1 || die "Das ist kein gültiges Zertifikat."
grep -q "PRIVATE KEY" "$TMP/ca.crt" && die "Die Datei enthält einen privaten Schlüssel – abgebrochen."
set_shared_names "$TMP/ca.crt"

GOT_FP="$(fp_of_file "$TMP/ca.crt")"
[ "$(norm_fp "$GOT_FP")" = "$WANT_FP" ] || die "Fingerabdruck stimmt NICHT – nichts installiert!
erwartet  $FINGERPRINT
erhalten  $GOT_FP"
ok "Fingerabdruck stimmt"
more "${GOT_FP:0:48}"
more "${GOT_FP:48}"

# Nur eine echte, per Name Constraints beschränkte CA akzeptieren
exts="$(openssl x509 -in "$TMP/ca.crt" -noout -ext basicConstraints,nameConstraints 2>/dev/null || true)"
grep -q "CA:TRUE" <<<"$exts" || die "Das Zertifikat ist keine CA – nichts installiert."
grep -q "Name Constraints: critical" <<<"$exts" \
    || die "Die CA hat keine (kritischen) Name Constraints – aus Sicherheitsgründen nicht installiert."
ok "CA ist beschränkt (Name Constraints)"
names=(); nets=()
while read -r e; do
    case "$e" in DNS:*) names+=("${e#DNS:}") ;; IP:*) nets+=("$(to_cidr "$e")") ;; esac
done < <(grep -E '^[[:space:]]+(DNS|IP):' <<<"$exts" | tr -d ' ')
[ ${#names[@]} -eq 0 ] || kv_wrap Namen "${names[@]}"
[ ${#nets[@]} -eq 0 ] || kv_wrap Netze "${nets[@]}"

# --- 3. Systemspeicher ---------------------------------------------------
section "SYSTEM"
already=""; stale=()
for f in "$SYS_DIR"/*.crt "$SYS_DIR"/*.pem; do
    [ -f "$f" ] || continue
    fp="$(fp_of_file "$f")"
    if [ "$(norm_fp "$fp")" = "$WANT_FP" ]; then
        already="$f"
    elif is_app_ca "$f"; then
        stale+=("$f")
    fi
done
changed_sys=0
if [ -n "$already" ]; then
    ok "Systemspeicher: bereits eingetragen ($(basename "$already"))"
else
    info "Trage CA in den Systemspeicher ein ($SYS_DIR)"
    run $SUDO install -m 644 "$TMP/ca.crt" "$SYS_DIR/$CA_FILE_NAME"
    changed_sys=1
fi
for f in "${stale[@]}"; do
    if [ "$REPLACE_OLD" -eq 1 ]; then
        info "Entferne ältere App-CA aus dem Systemspeicher: $(basename "$f")"
        run $SUDO rm -f "$f"; changed_sys=1
    else
        warn "Ältere App-CA im Systemspeicher: $(basename "$f") (mit --replace-old entfernen)"
    fi
done
if [ "$changed_sys" -eq 1 ]; then
    run $SUDO "${SYS_UPDATE[@]}"
    ok "Systemspeicher aktualisiert"
fi

# --- 4. Browser ----------------------------------------------------------
section "BROWSER"
dbs=("${NSS_DBS[@]}")
[ "$USE_CHROME" -eq 1 ] && dbs+=("$CHROME_DB")
if [ ${#dbs[@]} -gt 0 ] && ensure_certutil; then
    for db in "${dbs[@]}"; do
        label="$(db_label "$db")"
        if [ "$db" = "$CHROME_DB" ] && [ ! -f "$CHROME_DB/cert9.db" ]; then
            run as_user mkdir -p "$CHROME_DB"
            run as_user certutil -d "sql:$CHROME_DB" -N --empty-password
        fi
        found_nick=""
        while IFS=$'\t' read -r nick fp; do
            [ -n "$nick" ] || continue
            if [ "$(norm_fp "$fp")" = "$WANT_FP" ]; then
                found_nick="$nick"
            elif [ "$REPLACE_OLD" -eq 1 ]; then
                run as_user certutil -d "sql:$db" -D -n "$nick"
                ok "$label: ältere App-CA \"$nick\" entfernt"
            else
                warn "$label: ältere App-CA \"$nick\" vorhanden (mit --replace-old entfernen)"
            fi
        done < <(app_certs_in_db "$db")
        # "C,," = vertrauenswürdige CA für TLS-Server (der Haken "Websites identifizieren")
        if [ -n "$found_nick" ]; then
            run as_user certutil -d "sql:$db" -M -n "$found_nick" -t "C,,"
            ok "$label: vorhandene CA \"$found_nick\" für Webseiten vertraut"
        else
            run as_user certutil -d "sql:$db" -A -t "C,," -n "$CA_NAME" -i "$TMP/ca.crt"
            ok "$label: CA eingetragen und für Webseiten vertraut"
        fi
    done
elif [ ${#dbs[@]} -eq 0 ]; then
    info "Kein Firefox-Profil und kein Chromium gefunden"
fi

# --- 5. Prüfen -----------------------------------------------------------
if [ "$DRY_RUN" -eq 0 ] && command -v curl >/dev/null; then
    section "TEST"
    code="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://$SERVER:$PORT/" || true)"
    if [ "$code" = 200 ]; then
        ok "https://$SERVER:$PORT/ wird vom System als vertrauenswürdig akzeptiert"
    else
        warn "Test-Abruf von https://$SERVER:$PORT/ ergab HTTP ${code:-Fehler}"
    fi
fi
if [ "$DRY_RUN" -eq 1 ]; then
    dis_box "PROBELAUF" "Nichts geändert. Ohne --dry-run ausführen, um die CA einzutragen."
    exit 0
fi
if [ -z "$OPEN_URL" ]; then
    dis_box "CA VERTRAUT" "Seite    https://$SERVER:$PORT" "Browser einmal neu starten, dann den Einrichtungslink öffnen."
    exit 0
fi

# --- 6. Einrichtung öffnen -----------------------------------------------
section "EINRICHTUNG"
# Ein laufender Browser übernimmt die neue CA erst nach einem Neustart
running="$(pgrep -u "$TARGET_USER" -x -l '(firefox|firefox-esr|firefox-bin|chromium|chromium-browse|chrome)' 2>/dev/null \
           | awk '{print $2}' | sort -u | tr '\n' ' ' || true)"
if [ -n "$running" ]; then
    warn "Browser läuft noch (${running% }) und kennt die CA erst nach einem Neustart"
    # stdin ist bei "| bash -s" das Skript selbst, daher vom Terminal lesen
    if { : </dev/tty; } 2>/dev/null; then
        read -r -p "$IND""Browser ganz schließen, dann Enter … " _ </dev/tty || true
    fi
fi
# Als der Nutzer öffnen, dem die Browser-Profile gehören, nie als root
if { [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; } && command -v xdg-open >/dev/null; then
    if [ "$(id -un)" = "$TARGET_USER" ]; then
        xdg-open "$OPEN_URL" >/dev/null 2>&1 &
    else
        sudo -u "$TARGET_USER" --preserve-env=DISPLAY,WAYLAND_DISPLAY,XDG_RUNTIME_DIR,DBUS_SESSION_BUS_ADDRESS \
            xdg-open "$OPEN_URL" >/dev/null 2>&1 &
    fi
    ok "Einrichtung im Browser geöffnet. Falls nicht, diesen Link öffnen:"
else
    info "Kein Desktop gefunden. Diesen Link im Browser öffnen:"
fi
more "$OPEN_URL"
dis_box "CA VERTRAUT" "Seite    https://$SERVER:$PORT" "Einrichtung: Passwort ändern, Recovery-Schlüssel sichern."
