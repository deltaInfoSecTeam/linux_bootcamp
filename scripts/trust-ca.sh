#!/usr/bin/env bash
# Linux Bootcamp – lokale CA auf einem Linux-CLIENT vertrauen
#
# Lädt das CA-Zertifikat vom Bootcamp-Server, prüft es gegen den erwarteten
# Fingerabdruck und trägt es ein in:
#   - den System-Zertifikatsspeicher (curl, wget, Python, viele Programme)
#   - alle Firefox-Profile des Nutzers (inkl. Vertrauen für Webseiten)
#   - den NSS-Speicher von Chromium/Chrome
#
# Den passenden Aufruf mit Fingerabdruck gibt scripts/install.sh auf dem Server aus:
#   curl -fsSL https://raw.githubusercontent.com/deltaInfoSecTeam/linux_bootcamp/main/scripts/trust-ca.sh \
#     | bash -s -- --server bootcamp.example --fingerprint AB:CD:...
#
# Optionen:
#   --server NAME        Name des Bootcamp-Servers (Pflicht)
#   --fingerprint FP     erwarteter SHA-256-Fingerabdruck der CA (Pflicht)
#   --ip ADRESSE         falls NAME nicht auflösbar: Eintrag in /etc/hosts anlegen
#   --dry-run            nur anzeigen, was passieren würde
#   --uninstall          CA (und hosts-Eintrag) wieder entfernen
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

SERVER=""; FINGERPRINT=""; HOST_IP=""; DRY_RUN=0; UNINSTALL=0
while [ $# -gt 0 ]; do
    case "$1" in
        --server) [ $# -ge 2 ] || die "--server braucht einen Namen"; SERVER="${2,,}"; shift ;;
        --fingerprint) [ $# -ge 2 ] || die "--fingerprint braucht einen Wert"; FINGERPRINT="$2"; shift ;;
        --ip) [ $# -ge 2 ] || die "--ip braucht eine Adresse"; HOST_IP="$2"; shift ;;
        --dry-run) DRY_RUN=1 ;;
        --uninstall) UNINSTALL=1 ;;
        -h|--help) sed -n '2,24p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//' || true; exit 0 ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
    shift
done

[[ "$SERVER" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] || die "--server fehlt oder ist ungültig"
[ -z "$HOST_IP" ] || [[ "$HOST_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || die "--ip muss eine IPv4-Adresse sein"
[ "$(id -u)" -ne 0 ] || [ -n "${SUDO_USER:-}" ] || warn "Läuft direkt als root: Browser-Profile von root werden bearbeitet. Besser als normaler Nutzer starten."

# Nutzer, dessen Browser-Profile bearbeitet werden
TARGET_USER="${SUDO_USER:-$(id -un)}"
TARGET_HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)"
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi
as_user() { if [ "$(id -un)" = "$TARGET_USER" ]; then "$@"; else sudo -u "$TARGET_USER" "$@"; fi; }
run() { if [ "$DRY_RUN" -eq 1 ]; then printf '   [dry-run] %s\n' "$*"; else "$@"; fi; }

CA_NAME="Linux Bootcamp CA ($SERVER)"
CA_FILE_NAME="linux-bootcamp-${SERVER//./-}.crt"
HOSTS_MARK="# linux-bootcamp $SERVER"

# --- Systemspeicher ermitteln --------------------------------------------
if [ -d /usr/local/share/ca-certificates ] && command -v update-ca-certificates >/dev/null; then
    SYS_DIR=/usr/local/share/ca-certificates; SYS_UPDATE=(update-ca-certificates)
elif [ -d /etc/pki/ca-trust/source/anchors ] && command -v update-ca-trust >/dev/null; then
    SYS_DIR=/etc/pki/ca-trust/source/anchors; SYS_UPDATE=(update-ca-trust extract)
elif [ -d /etc/ca-certificates/trust-source/anchors ] && command -v trust >/dev/null; then
    SYS_DIR=/etc/ca-certificates/trust-source/anchors; SYS_UPDATE=(trust extract-compat)
else
    die "Unbekannter System-Zertifikatsspeicher. Bitte die CA manuell installieren (siehe README)."
fi

# Firefox-Profile (klassisch, Flatpak, Snap) und Chromium-NSS-Datenbank
mapfile -t FF_PROFILES < <(for base in "$TARGET_HOME/.mozilla/firefox" "$TARGET_HOME/.var/app/org.mozilla.firefox/.mozilla/firefox" "$TARGET_HOME/snap/firefox/common/.mozilla/firefox"; do
    for p in "$base"/*/; do [ -f "$p/cert9.db" ] && echo "${p%/}"; done
done 2>/dev/null)
CHROME_DB="$TARGET_HOME/.pki/nssdb"
use_chrome=0
{ command -v chromium >/dev/null || command -v chromium-browser >/dev/null || command -v google-chrome >/dev/null || [ -d "$CHROME_DB" ]; } && use_chrome=1

need_certutil=0
{ [ ${#FF_PROFILES[@]} -gt 0 ] || [ "$use_chrome" -eq 1 ]; } && need_certutil=1
ensure_certutil() {
    command -v certutil >/dev/null && return 0
    info "certutil fehlt (für Browser-Zertifikatsspeicher)"
    if command -v apt-get >/dev/null; then run $SUDO apt-get install -y -qq libnss3-tools
    elif command -v dnf >/dev/null; then run $SUDO dnf install -y -q nss-tools
    elif command -v pacman >/dev/null; then run $SUDO pacman -S --noconfirm --needed nss
    else warn "certutil nicht installierbar – Browser bitte manuell einrichten (siehe README)"; return 1
    fi
    [ "$DRY_RUN" -eq 1 ] || command -v certutil >/dev/null
}

# --- Deinstallation ------------------------------------------------------
if [ "$UNINSTALL" -eq 1 ]; then
    info "Entferne $CA_NAME"
    if [ -f "$SYS_DIR/$CA_FILE_NAME" ]; then run $SUDO rm -f "$SYS_DIR/$CA_FILE_NAME"; run $SUDO "${SYS_UPDATE[@]}"; ok "aus dem Systemspeicher entfernt"; fi
    if command -v certutil >/dev/null; then
        for p in "${FF_PROFILES[@]}"; do as_user certutil -d "sql:$p" -L -n "$CA_NAME" >/dev/null 2>&1 && run as_user certutil -d "sql:$p" -D -n "$CA_NAME" && ok "aus Firefox-Profil $(basename "$p") entfernt"; done
        [ -d "$CHROME_DB" ] && as_user certutil -d "sql:$CHROME_DB" -L -n "$CA_NAME" >/dev/null 2>&1 && run as_user certutil -d "sql:$CHROME_DB" -D -n "$CA_NAME" && ok "aus Chromium entfernt"
    fi
    if grep -qF "$HOSTS_MARK" /etc/hosts; then run $SUDO sed -i "\|$HOSTS_MARK|d" /etc/hosts; ok "hosts-Eintrag entfernt"; fi
    exit 0
fi

[ -n "$FINGERPRINT" ] || die "--fingerprint fehlt. Den korrekten Aufruf zeigt scripts/install.sh auf dem Server an."
norm_fp() { printf '%s' "$1" | tr -d ': \n' | tr 'a-f' 'A-F'; }
[[ "$(norm_fp "$FINGERPRINT")" =~ ^[0-9A-F]{64}$ ]] || die "--fingerprint ist kein SHA-256-Fingerabdruck"
command -v openssl >/dev/null || die "openssl fehlt (z.B. sudo apt install openssl)"
command -v curl >/dev/null || die "curl fehlt (z.B. sudo apt install curl)"

# --- 1. Namensauflösung --------------------------------------------------
if ! getent hosts "$SERVER" >/dev/null; then
    [ -n "$HOST_IP" ] || die "$SERVER ist nicht auflösbar. Mit --ip <Server-IP> einen hosts-Eintrag anlegen lassen."
    info "Lege hosts-Eintrag an: $HOST_IP $SERVER"
    run $SUDO sh -c "printf '%s\t%s\t%s\n' '$HOST_IP' '$SERVER' '$HOSTS_MARK' >> /etc/hosts"
fi
FETCH_HOST="$SERVER"; [ -n "$HOST_IP" ] && FETCH_HOST="$HOST_IP"

# --- 2. CA laden und prüfen ----------------------------------------------
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
info "Lade CA von http://$FETCH_HOST/ca.crt"
curl -fsS -m 10 -o "$TMP/ca.crt" "http://$FETCH_HOST/ca.crt" || die "CA-Zertifikat nicht abrufbar."
openssl x509 -in "$TMP/ca.crt" -noout >/dev/null 2>&1 || die "Download ist kein gültiges Zertifikat."

actual="$(openssl x509 -in "$TMP/ca.crt" -noout -fingerprint -sha256 | cut -d= -f2)"
[ "$(norm_fp "$actual")" = "$(norm_fp "$FINGERPRINT")" ] \
    || die "Fingerabdruck stimmt NICHT überein – nichts installiert!
     erwartet: $FINGERPRINT
     erhalten: $actual"
ok "Fingerabdruck stimmt: $actual"

# Nur eine echte, per Name Constraints beschränkte CA akzeptieren
exts="$(openssl x509 -in "$TMP/ca.crt" -noout -ext basicConstraints,nameConstraints 2>/dev/null || true)"
grep -q "CA:TRUE" <<<"$exts" || die "Zertifikat ist keine CA – nichts installiert."
grep -q "Name Constraints" <<<"$exts" || die "CA hat keine Name Constraints – aus Sicherheitsgründen nicht installiert."
ok "CA ist beschränkt auf: $(grep -E '^\s+(DNS|IP):' <<<"$exts" | tr -d ' ' | paste -sd' ')"

# --- 3. Systemspeicher ---------------------------------------------------
# Schon vorhanden (auch unter anderem Dateinamen, z.B. von Hand installiert)?
already=""
for f in "$SYS_DIR"/*.crt "$SYS_DIR"/*.pem; do
    [ -f "$f" ] || continue
    if [ "$(openssl x509 -in "$f" -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2)" = "$actual" ]; then already="$f"; break; fi
done
if [ -n "$already" ]; then
    ok "Systemspeicher: bereits eingetragen ($(basename "$already"))"
else
    info "Trage CA in den Systemspeicher ein ($SYS_DIR)"
    run $SUDO install -m 644 "$TMP/ca.crt" "$SYS_DIR/$CA_FILE_NAME"
    run $SUDO "${SYS_UPDATE[@]}"
    ok "Systemspeicher aktualisiert"
fi

# --- 4. Browser ----------------------------------------------------------
if [ "$need_certutil" -eq 1 ] && ensure_certutil; then
    cp "$TMP/ca.crt" "$TMP/ca-user.crt"; chmod 644 "$TMP/ca-user.crt"; chmod 755 "$TMP"
    want_fp="$(norm_fp "$actual")"
    # Ist die CA schon in der Datenbank (z.B. von Hand importiert), deren Spitznamen finden
    existing_nick() {
        local db="$1" nick
        while IFS= read -r nick; do
            [ -n "$nick" ] || continue
            if [ "$(as_user certutil -d "sql:$db" -L -n "$nick" -a 2>/dev/null \
                    | openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2 | tr -d ':')" = "$want_fp" ]; then
                printf '%s' "$nick"; return 0
            fi
        done < <(as_user certutil -d "sql:$db" -L 2>/dev/null | tail -n +5 | sed -E 's/[[:space:]]+[^[:space:]]*,[^[:space:]]*,[^[:space:]]*[[:space:]]*$//')
        return 1
    }
    # "C,," = vertrauenswürdige CA für TLS-Server (der Haken "Websites identifizieren")
    trust_in_db() {
        local db="$1" label="$2" nick
        if nick="$(existing_nick "$db")"; then
            run as_user certutil -d "sql:$db" -M -n "$nick" -t "C,,"
            ok "$label: vorhandene CA \"$nick\" für Webseiten vertraut"
        else
            run as_user certutil -d "sql:$db" -A -t "C,," -n "$CA_NAME" -i "$TMP/ca-user.crt"
            ok "$label: CA eingetragen und für Webseiten vertraut"
        fi
    }
    for p in "${FF_PROFILES[@]}"; do trust_in_db "$p" "Firefox-Profil $(basename "$p")"; done
    [ ${#FF_PROFILES[@]} -gt 0 ] || info "Kein Firefox-Profil gefunden"
    if [ "$use_chrome" -eq 1 ]; then
        [ -d "$CHROME_DB" ] || run as_user mkdir -p "$CHROME_DB"
        [ -f "$CHROME_DB/cert9.db" ] || run as_user certutil -d "sql:$CHROME_DB" -N --empty-password
        trust_in_db "$CHROME_DB" "Chromium/Chrome"
    fi
fi

# --- 5. Prüfen -----------------------------------------------------------
if [ "$DRY_RUN" -eq 0 ]; then
    code="$(curl -s -m 10 -o /dev/null -w '%{http_code}' "https://$SERVER/" || true)"
    [ "$code" = 200 ] && ok "https://$SERVER/ wird vom System als vertrauenswürdig akzeptiert" \
        || warn "Test-Abruf von https://$SERVER/ ergab HTTP ${code:-Fehler}"
fi
echo
ok "Fertig. Laufende Browser einmal neu starten."
