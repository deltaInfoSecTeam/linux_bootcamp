// Gemeinsame Eingabe-Validierung
const USERNAME_RE = /^[a-zA-Z0-9_\-.]{3,24}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignoriert alles danach

function validateUsername(username) {
    const u = String(username ?? '').trim();
    if (!USERNAME_RE.test(u)) {
        return { error: 'Ungültiger Username. Erlaubt sind 3-24 Zeichen (nur Buchstaben, Zahlen, _, -, .).' };
    }
    return { value: u };
}

function validatePassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
        return { error: `Das Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.` };
    }
    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
        return { error: `Das Passwort darf höchstens ${PASSWORD_MAX_BYTES} Bytes lang sein.` };
    }
    return { value: password };
}

function isIntInRange(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
}

// Akzeptiert Zahlen und Zahl-Strings ("12"), liefert sonst null
function toId(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function optionalString(value, maxLen) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string' || value.length > maxLen) return null;
    return value;
}

module.exports = { validateUsername, validatePassword, isIntInRange, toId, optionalString };
