#!/usr/bin/env bash
# dis-term.sh – Terminal-Ausgabe im deltaInfoSec-Design (zum Einbinden per "source")
#
#   . scripts/lib/dis-term.sh
#   dis_banner "Support-Radar" "LINUX" "Installation"   Wortmarke (DIS_BANNER_FILE oder Block-Schrift)
#   dis_step 3 7 "TLS einrichten"                       Abschnitt mit Fortschritt
#   dis_ok / dis_warn / dis_fail / dis_info "Text"      Statusmarken [ OK ] [ !! ] [ FAIL ] [ ii ]
#   dis_kv "Adresse" "https://…"                        Schlüssel/Wert, ausgerichtet
#   dis_cmd "docker compose up -d"                      Befehl mit Kali-Prompt anzeigen
#   dis_run "Container starten" cmd args…               Spinner, Laufzeit, Ausgabe ins Log
#   dis_confirm "Frage?"                                [J/n], ohne Terminal: nein
#   dis_box "Titel" "Zeile" …                           Abschlussbox
#
# Farben aus dem CD (RULES.md). Ohne Terminal (außer FORCE_COLOR=1), mit NO_COLOR oder TERM=dumb ohne Farbe,
# ohne UTF-8 mit ASCII-Ersatz. Keine Abhängigkeiten außer bash 4.
# DIS_BANNER_FILE: fertiges ASCII-Bild (scripts/term-banner.sh), sonst eingebaute Block-Schrift.
# Quelle: corporate-deltainfosec dist/sh/dis-term.sh. In Projekten nicht bearbeiten, dort ändern.

DIS_LOG="${DIS_LOG:-/dev/null}"

dis_init() {
    local tc=0
    # FORCE_COLOR=1: Farbe auch ohne Terminal, z. B. wenn ein Wrapper die Ausgabe per tee protokolliert
    if { [ -t 1 ] || [ "${FORCE_COLOR:-0}" = 1 ]; } && [ -z "${NO_COLOR:-}" ] && [ "${TERM:-dumb}" != dumb ]; then
        case "${COLORTERM:-}" in truecolor|24bit) tc=1 ;; esac
        if [ "$tc" -eq 1 ]; then
            _c() { printf '\e[38;2;%d;%d;%dm' "$1" "$2" "$3"; }
        else
            _c() { printf '\e[38;5;%dm' "$4"; }
        fi
        # Name          R   G   B  256
        C_GOLD=$(_c    226 168  58 178)   # --dis-gold
        C_CREST=$(_c   214 153  38 172)   # --dis-crest-gold
        C_MATRIX=$(_c   63 214 138  78)   # --dis-matrix
        C_WARN=$(_c    242 179  61 214)   # --dis-warn
        C_DANGER=$(_c  240  96 106 203)   # --dis-danger
        C_TEXT=$(_c    231 233 236 255)   # --dis-text
        C_TEXT2=$(_c   163 171 184 248)   # --dis-text-2
        C_TEXT3=$(_c   107 116 130 243)   # --dis-text-3
        C_BOLD=$'\e[1m'; C_OFF=$'\e[0m'
    else
        C_GOLD='' C_CREST='' C_MATRIX='' C_WARN='' C_DANGER='' C_TEXT='' C_TEXT2='' C_TEXT3='' C_BOLD='' C_OFF=''
    fi
    # Spinner nur auf einem echten Terminal, sonst landen die Zwischenstände im Protokoll
    if [ -t 1 ]; then DIS_TTY=1; else DIS_TTY=0; fi
    if [[ "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" =~ [Uu][Tt][Ff]-?8 ]]; then
        DIS_BLK='█' DIS_H='─' DIS_V='│' DIS_TL='┌' DIS_TR='┐' DIS_BL='└' DIS_BR='┘' DIS_DOT='·'
        DIS_SPIN=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏) DIS_BAR_ON='■' DIS_BAR_OFF='□'
    else
        DIS_BLK='#' DIS_H='-' DIS_V='|' DIS_TL='+' DIS_TR='+' DIS_BL='+' DIS_BR='+' DIS_DOT='.'
        DIS_SPIN=('|' '/' '-' '\') DIS_BAR_ON='#' DIS_BAR_OFF='.'
    fi
}

# --- Statusmarken (wie dis-mark im CD) ---------------------------------------
dis_ok()   { printf ' %s[  OK  ]%s %s\n' "$C_MATRIX" "$C_OFF" "$*"; }
dis_warn() { printf ' %s[  !!  ]%s %s\n' "$C_WARN"   "$C_OFF" "$*"; }
dis_fail() { printf ' %s[ FAIL ]%s %s\n' "$C_DANGER" "$C_OFF" "$*" >&2; }
dis_info() { printf ' %s[  ii  ]%s %s%s%s\n' "$C_TEXT3" "$C_OFF" "$C_TEXT2" "$*" "$C_OFF"; }
dis_die()  { dis_fail "$*"; exit 1; }

dis_kv() { printf '          %s%-14s%s %s\n' "$C_TEXT3" "$1" "$C_OFF" "$2"; }

dis_cmd() {
    printf '          %s┌──(%s%s%s)-[%s~%s]\n          └─#%s %s\n' \
        "$C_MATRIX" "$C_GOLD" "root㉿kali" "$C_MATRIX" "$C_TEXT" "$C_MATRIX" "$C_OFF" "$*"
}

# --- Abschnitt: > SCHRITT 03/07  TLS EINRICHTEN  ■■■□□□□ ---------------------
dis_step() {
    local n=$1 total=$2 title=$3 bar='' i
    for ((i = 1; i <= total; i++)); do
        if [ "$i" -le "$n" ]; then bar+="$DIS_BAR_ON"; else bar+="$DIS_BAR_OFF"; fi
    done
    printf '\n %s> %02d/%02d%s  %s%s%s  %s%s%s\n' \
        "$C_MATRIX" "$n" "$total" "$C_OFF" "$C_BOLD$C_TEXT" "${title^^}" "$C_OFF" "$C_GOLD" "$bar" "$C_OFF"
    printf ' %s%s%s\n' "$C_TEXT3" "$(dis_rule 60)" "$C_OFF"
}

dis_rule() { local s='' i; for ((i = 0; i < $1; i++)); do s+="$DIS_H"; done; printf '%s' "$s"; }

# --- Befehl mit Spinner, Ausgabe ins Log --------------------------------------
dis_run() {
    local label=$1; shift
    local t0=$SECONDS rc
    if [ "$DIS_TTY" -eq 1 ]; then
        "$@" >>"$DIS_LOG" 2>&1 &
        local pid=$! i=0
        while kill -0 "$pid" 2>/dev/null; do
            printf '\r %s[  %s   ]%s %s %s%ds%s' "$C_GOLD" "${DIS_SPIN[i++ % ${#DIS_SPIN[@]}]}" "$C_OFF" \
                "$label" "$C_TEXT3" $((SECONDS - t0)) "$C_OFF"
            sleep 0.1
        done
        wait "$pid" && rc=0 || rc=$?
        printf '\r\e[K'
    else
        "$@" >>"$DIS_LOG" 2>&1 && rc=0 || rc=$?
    fi
    if [ "$rc" -eq 0 ]; then
        dis_ok "$label $C_TEXT3($((SECONDS - t0))s)$C_OFF"
    else
        dis_fail "$label (Exit $rc, Details: $DIS_LOG)"
    fi
    return "$rc"
}

dis_confirm() {
    [ "${ASSUME_YES:-0}" -eq 1 ] && return 0
    [ -t 0 ] || return 1
    local a
    read -r -p " $(printf '%s[  ??  ]%s' "$C_GOLD" "$C_OFF") $1 [J/n] " a
    [[ -z "$a" || "$a" =~ ^[jJyY] ]]
}

# --- Abschlussbox -------------------------------------------------------------
dis_box() {
    local title=$1; shift
    local w=58 line plain
    printf '\n %s%s%s %s%s%s %s%s%s\n' "$C_GOLD" "$DIS_TL$DIS_H" "$C_OFF" "$C_BOLD$C_GOLD" "$title" "$C_OFF" \
        "$C_GOLD" "$(dis_rule $((w - ${#title} - 2)))$DIS_TR" "$C_OFF"
    for line in "$@"; do
        plain="$(printf '%s' "$line" | sed 's/\x1b\[[0-9;]*m//g')"
        printf ' %s%s%s  %s%*s%s%s%s\n' "$C_GOLD" "$DIS_V" "$C_OFF" "$line" $((w - 1 - ${#plain})) '' "$C_GOLD" "$DIS_V" "$C_OFF"
    done
    printf ' %s%s%s%s\n' "$C_GOLD" "$DIS_BL" "$(dis_rule $((w + 1)))$DIS_BR" "$C_OFF"
}

# --- Banner: Block-Schrift, 5 Zeilen, Gold-Verlauf von oben nach unten ---------
declare -A _DIS_FONT=(
    [A]='.###.|#...#|#####|#...#|#...#' [B]='####.|#...#|####.|#...#|####.' [C]='.####|#....|#....|#....|.####'
    [D]='####.|#...#|#...#|#...#|####.' [E]='#####|#....|####.|#....|#####' [F]='#####|#....|####.|#....|#....'
    [G]='.####|#....|#..##|#...#|.###.' [H]='#...#|#...#|#####|#...#|#...#' [I]='###|.#.|.#.|.#.|###'
    [J]='..###|...#.|...#.|#..#.|.##..' [K]='#...#|#..#.|###..|#..#.|#...#' [L]='#....|#....|#....|#....|#####'
    [M]='#...#|##.##|#.#.#|#...#|#...#' [N]='#...#|##..#|#.#.#|#..##|#...#' [O]='.###.|#...#|#...#|#...#|.###.'
    [P]='####.|#...#|####.|#....|#....' [Q]='.###.|#...#|#.#.#|#..#.|.##.#' [R]='####.|#...#|####.|#..#.|#...#'
    [S]='.####|#....|.###.|....#|####.' [T]='#####|..#..|..#..|..#..|..#..' [U]='#...#|#...#|#...#|#...#|.###.'
    [V]='#...#|#...#|#...#|.#.#.|..#..' [W]='#...#|#...#|#.#.#|##.##|#...#' [X]='#...#|.#.#.|..#..|.#.#.|#...#'
    [Y]='#...#|.#.#.|..#..|..#..|..#..' [Z]='#####|...#.|..#..|.#...|#####'
    [0]='.###.|#..##|#.#.#|##..#|.###.' [1]='.#.|##.|.#.|.#.|###' [2]='####.|....#|.###.|#....|#####'
    [3]='####.|....#|.###.|....#|####.' [4]='#...#|#...#|#####|....#|....#' [5]='#####|#....|####.|....#|####.'
    [6]='.###.|#....|####.|#...#|.###.' [7]='#####|....#|...#.|..#..|..#..' [8]='.###.|#...#|.###.|#...#|.###.'
    [9]='.###.|#...#|.####|....#|.###.' [-]='....|....|####|....|....' [' ']='..|..|..|..|..'
)

dis_bigtext() {
    local text="${1^^}" r c ch rows out
    # Verlauf: Oberfläche-Gold oben, Wappen-Gold unten (truecolor), sonst einfarbig
    local -a grad=("$C_GOLD" "$C_GOLD" "$C_CREST" "$C_CREST" "$C_CREST")
    for ((r = 0; r < 5; r++)); do
        out=''
        for ((c = 0; c < ${#text}; c++)); do
            ch="${text:c:1}"
            [ -n "${_DIS_FONT[$ch]+x}" ] || continue
            IFS='|' read -r -a rows <<<"${_DIS_FONT[$ch]}"
            out+="${rows[r]}."
        done
        out="${out//#/$DIS_BLK}"; out="${out//./ }"
        printf '   %s%s%s\n' "${grad[r]}" "$out" "$C_OFF"
    done
}

# Wortmarke: kleines Label, Block-Schrift, Tagline, Linie
#   dis_banner TITEL [LABEL] [TAGLINE]
dis_banner() {
    local title=$1 label=${2:-} tagline=${3:-}
    local cols; cols=$(tput cols 2>/dev/null || echo 80)
    echo
    [ -n "$label" ] && printf '   %s> %s%s\n\n' "$C_MATRIX" "${label^^}" "$C_OFF"
    # passt die Block-Schrift nicht in die Breite, nur Text
    # Fertiges Bild (z.B. mit figlet erzeugt) hat Vorrang vor der eingebauten Schrift
    local f="${DIS_BANNER_FILE:-}" w=0 l n=0
    if [ -n "$f" ] && [ -r "$f" ]; then
        while IFS= read -r l; do [ ${#l} -gt "$w" ] && w=${#l}; n=$((n + 1)); done <"$f"
    fi
    if [ "$n" -gt 0 ] && [ $((w + 3)) -le "$cols" ]; then
        local i=0
        while IFS= read -r l; do
            [ $((i * 2)) -lt "$n" ] && printf '   %s%s%s\n' "$C_GOLD" "$l" "$C_OFF" || printf '   %s%s%s\n' "$C_CREST" "$l" "$C_OFF"
            i=$((i + 1))
        done <"$f"
    elif [ $(( ${#title} * 6 + 3 )) -le "$cols" ]; then
        dis_bigtext "$title"
    else
        printf '   %s%s%s\n' "$C_BOLD$C_GOLD" "${title^^}" "$C_OFF"
    fi
    echo
    [ -n "$tagline" ] && printf '   %s%s%s\n' "$C_TEXT2" "$tagline" "$C_OFF"
    printf '   %s%s%s %sdeltaInfoSec%s\n' "$C_TEXT3" "$(dis_rule 40)" "$C_OFF" "$C_TEXT3" "$C_OFF"
}

dis_init
