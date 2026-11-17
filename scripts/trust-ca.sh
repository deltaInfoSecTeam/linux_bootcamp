#!/usr/bin/env bash
# Linux Bootcamp – lokale CA auf einem Linux-CLIENT vertrauen
#
# Lädt das CA-Zertifikat vom Bootcamp-Server, prüft es gegen den erwarteten
# Fingerabdruck und trägt es ein in:
#   - den System-Zertifikatsspeicher (curl, wget, Python, viele Programme)
#   - alle Firefox-Profile des Nutzers (mit Vertrauen für Webseiten)
#   - den NSS-Speicher von Chromium/Chrome
#
# Den passenden Aufruf samt Fingerabdruck gibt "scripts/install.sh --tls" auf
# dem Server aus, z.B.:
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/trust-ca.sh \
#     | bash -s -- --server bootcamp.lan --fingerprint AB:CD:...
#
# Optionen:
#   --server NAME        Name des Bootcamp-Servers (Pflicht)
#   --fingerprint FP     erwarteter SHA-256-Fingerabdruck der CA (Pflicht)
#   --port PORT          HTTPS-Port des Servers (Standard: 443)
#   --ip ADRESSE         falls NAME nicht auflösbar: Eintrag in /etc/hosts anlegen
#   --ca-file DATEI      CA aus einer Datei statt vom Server nehmen
#   --replace-old        ältere "Linux Bootcamp"-CAs mit anderem Fingerabdruck entfernen
#   --dry-run            nur anzeigen, was passieren würde
#   --uninstall          diese CA (und den hosts-Eintrag) wieder entfernen
#
# Unterstützt Debian/Ubuntu/Kali, Fedora/RHEL und Arch.

set -euo pipefail

if [ -t 1 ]; then
    C_OK=$'\e[32m'; C_WARN=$'\e[33m'; C_ERR=$'\e[31m'; C_INFO=$'\e[36m'; C_OFF=$'\e[0m'
else
    C_OK=''; C_WARN=''; C_ERR=''; C_INFO=''; C_OFF=''
fi
info() { printf '%s==>%s %s\n' "$C_INFO" "$C_OFF" "$*"; }
ok()   { printf '%s ✔ %s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '%s ! %s %s\n' "$C_WARN" "$C_OFF" "$*" >&2; }
die()  { printf '%s ✘ %s %s\n' "$C_ERR" "$C_OFF" "$*" >&2; exit 1; }

SERVER=""; FINGERPRINT=""; PORT=443; HOST_IP=""; CA_FILE=""
REPLACE_OLD=0; DRY_RUN=0; UNINSTALL=0
while [ $# -gt 0 ]; do
    case "$1" in
        --server) [ $# -ge 2 ] || die "--server braucht einen Namen"; SERVER="${2,,}"; shift ;;
        --fingerprint) [ $# -ge 2 ] || die "--fingerprint braucht einen Wert"; FINGERPRINT="$2"; shift ;;
        --port) [ $# -ge 2 ] || die "--port braucht eine Zahl"; PORT="$2"; shift ;;
        --ip) [ $# -ge 2 ] || die "--ip braucht eine Adresse"; HOST_IP="$2"; shift ;;
        --ca-file) [ $# -ge 2 ] || die "--ca-file braucht einen Pfad"; CA_FILE="$2"; shift ;;
        --replace-old) REPLACE_OLD=1 ;;
        --dry-run) DRY_RUN=1 ;;
        --uninstall) UNINSTALL=1 ;;
        -h|--help) sed -n '2,26p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//' || true; exit 0 ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done

[[ "$SERVER" =~ ^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$ ]] || die "--server fehlt oder ist ungültig"
[[ "$PORT" =~ ^[0-9]{1,5}$ ]] && [ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || die "--port ist ungültig"
[ -z "$HOST_IP" ] || [[ "$HOST_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || die "--ip muss eine IPv4-Adresse sein"
[ -z "$CA_FILE" ] || [ -r "$CA_FILE" ] || die "--ca-file ist nicht lesbar: $CA_FILE"
command -v openssl >/dev/null || die "openssl fehlt (z.B. sudo apt install openssl)"

# Nutzer, dessen Browser-Profile bearbeitet werden (auch bei Aufruf mit sudo)
TARGET_USER="${SUDO_USER:-$(id -un)}"
TARGET_HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)"
[ -n "$TARGET_HOME" ] || die "Heimverzeichnis von $TARGET_USER nicht gefunden"
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi
[ "$(id -u)" -ne 0 ] || [ -n "${SUDO_USER:-}" ] \
    || warn "Läuft direkt als root: es werden die Browser-Profile von root bearbeitet."
as_user() { if [ "$(id -un)" = "$TARGET_USER" ]; then "$@"; else sudo -u "$TARGET_USER" -- "$@"; fi; }
run() { if [ "$DRY_RUN" -eq 1 ]; then printf '   [dry-run] %s\n' "$*"; else "$@"; fi; }
norm_fp() { printf '%s' "$1" | tr -d ': \n' | tr 'a-f' 'A-F'; }
fp_of_file() { openssl x509 -in "$1" -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2; }
subject_of_file() { openssl x509 -in "$1" -noout -subject 2>/dev/null; }

CA_NAME="Linux Bootcamp CA ($SERVER)"
CA_FILE_NAME="linux-bootcamp-${SERVER//./-}.crt"
HOSTS_MARK="# linux-bootcamp $SERVER"

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

# Zertifikate einer NSS-Datenbank, deren Betreff "Linux Bootcamp" enthält,
# jeweils als "Spitzname<TAB>Fingerabdruck"
bootcamp_certs_in_db() {
    local db="$1" nick fp
    have_certutil || return 0
    while IFS= read -r nick; do
        [ -n "$nick" ] || continue
        as_user certutil -d "sql:$db" -L -n "$nick" -a 2>/dev/null > "$TMP/nss.pem" || continue
        subject_of_file "$TMP/nss.pem" | grep -q "Linux Bootcamp" || continue
        fp="$(fp_of_file "$TMP/nss.pem")"
        printf '%s\t%s\n' "$nick" "$fp"
    done < <(as_user certutil -d "sql:$db" -L 2>/dev/null | tail -n +5 \
             | sed -E 's/[[:space:]]+[^[:space:]]*,[^[:space:]]*,[^[:space:]]*[[:space:]]*$//')
}

# --- Deinstallation ------------------------------------------------------
if [ "$UNINSTALL" -eq 1 ]; then
    info "Entferne $CA_NAME"
    if [ -f "$SYS_DIR/$CA_FILE_NAME" ]; then
        run $SUDO rm -f "$SYS_DIR/$CA_FILE_NAME"
        run $SUDO "${SYS_UPDATE[@]}"
        ok "aus dem Systemspeicher entfernt"
    fi
    dbs=("${NSS_DBS[@]}"); [ "$USE_CHROME" -eq 1 ] && [ -d "$CHROME_DB" ] && dbs+=("$CHROME_DB")
    for db in "${dbs[@]}"; do
        if have_certutil && as_user certutil -d "sql:$db" -L -n "$CA_NAME" >/dev/null 2>&1; then
            run as_user certutil -d "sql:$db" -D -n "$CA_NAME"
            ok "$(db_label "$db"): entfernt"
        fi
    done
    if grep -qF "$HOSTS_MARK" /etc/hosts; then
        run $SUDO sed -i "\|$HOSTS_MARK|d" /etc/hosts
        ok "hosts-Eintrag entfernt"
    fi
    exit 0
fi

[ -n "$FINGERPRINT" ] || die "--fingerprint fehlt. Den korrekten Aufruf zeigt scripts/install.sh auf dem Server an."
WANT_FP="$(norm_fp "$FINGERPRINT")"
[[ "$WANT_FP" =~ ^[0-9A-F]{64}$ ]] || die "--fingerprint ist kein SHA-256-Fingerabdruck"

# --- 1. Namensauflösung --------------------------------------------------
NEED_RESOLVE=0
if ! getent hosts "$SERVER" >/dev/null; then
    [ -n "$HOST_IP" ] || die "$SERVER ist nicht auflösbar. Mit --ip <Server-IP> einen hosts-Eintrag anlegen lassen."
    info "Lege hosts-Eintrag an: $HOST_IP $SERVER"
    if [ "$DRY_RUN" -eq 1 ]; then
        printf '   [dry-run] %s\t%s\t%s >> /etc/hosts\n' "$HOST_IP" "$SERVER" "$HOSTS_MARK"
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

GOT_FP="$(fp_of_file "$TMP/ca.crt")"
[ "$(norm_fp "$GOT_FP")" = "$WANT_FP" ] || die "Fingerabdruck stimmt NICHT – nichts installiert!
     erwartet: $FINGERPRINT
     erhalten: $GOT_FP"
ok "Fingerabdruck stimmt: $GOT_FP"

# Nur eine echte, per Name Constraints beschränkte CA akzeptieren
exts="$(openssl x509 -in "$TMP/ca.crt" -noout -ext basicConstraints,nameConstraints 2>/dev/null || true)"
grep -q "CA:TRUE" <<<"$exts" || die "Das Zertifikat ist keine CA – nichts installiert."
grep -q "Name Constraints: critical" <<<"$exts" \
    || die "Die CA hat keine (kritischen) Name Constraints – aus Sicherheitsgründen nicht installiert."
ok "CA ist beschränkt auf: $(grep -E '^[[:space:]]+(DNS|IP):' <<<"$exts" | tr -d ' ' | paste -sd' ')"

# --- 3. Systemspeicher ---------------------------------------------------
already=""; stale=()
for f in "$SYS_DIR"/*.crt "$SYS_DIR"/*.pem; do
    [ -f "$f" ] || continue
    fp="$(fp_of_file "$f")"
    if [ "$(norm_fp "$fp")" = "$WANT_FP" ]; then
        already="$f"
    elif subject_of_file "$f" | grep -q "Linux Bootcamp"; then
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
        info "Entferne ältere Bootcamp-CA aus dem Systemspeicher: $(basename "$f")"
        run $SUDO rm -f "$f"; changed_sys=1
    else
        warn "Ältere Bootcamp-CA im Systemspeicher: $(basename "$f") (mit --replace-old entfernen)"
    fi
done
if [ "$changed_sys" -eq 1 ]; then
    run $SUDO "${SYS_UPDATE[@]}"
    ok "Systemspeicher aktualisiert"
fi

# --- 4. Browser ----------------------------------------------------------
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
                ok "$label: ältere Bootcamp-CA \"$nick\" entfernt"
            else
                warn "$label: ältere Bootcamp-CA \"$nick\" vorhanden (mit --replace-old entfernen)"
            fi
        done < <(bootcamp_certs_in_db "$db")
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
    code="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://$SERVER:$PORT/" || true)"
    if [ "$code" = 200 ]; then
        ok "https://$SERVER:$PORT/ wird vom System als vertrauenswürdig akzeptiert"
    else
        warn "Test-Abruf von https://$SERVER:$PORT/ ergab HTTP ${code:-Fehler}"
    fi
fi
echo
ok "Fertig. Laufende Browser einmal neu starten."
