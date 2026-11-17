// Erst-Einrichtung: Solange es keinen Admin gibt, erzeugt der Server beim Start
// einen einmaligen Setup-Code. Nur wer ihn kennt (Ausgabe von install.sh,
// Container-Log oder data/setup-code), kann im Browser den ersten Admin anlegen.
// Sobald ein Admin existiert, ist die Einrichtung dauerhaft geschlossen.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('./config');
const db = require('./db');

const CODE_FILE = path.join(DATA_DIR, 'setup-code');
// Ohne leicht verwechselbare Zeichen (0/O, 1/I/L); 12 Zeichen = 60 Bit Zufall
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

let currentCode = null;

function generateCode() {
    let s = '';
    for (let i = 0; i < 12; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
    return s.match(/.{4}/g).join('-');
}

function normalize(code) {
    return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function removeCode() {
    currentCode = null;
    try {
        fs.unlinkSync(CODE_FILE);
    } catch {
        // Datei gab es nicht – nichts zu tun
    }
}

/** Beim Serverstart aufrufen: Code erzeugen, falls noch kein Admin existiert. */
function init() {
    if (db.hasAdmin()) {
        removeCode();
        return null;
    }
    // Jeder Start erzeugt einen neuen Code, ein alter wird damit wertlos
    removeCode();
    currentCode = generateCode();
    fs.writeFileSync(CODE_FILE, currentCode + '\n', { mode: 0o600 });
    console.log('');
    console.log('=== Erst-Einrichtung =====================================');
    console.log('Noch kein Admin vorhanden. Im Browser die Seite öffnen und');
    console.log(`diesen Setup-Code eingeben:  ${currentCode}`);
    console.log('==========================================================');
    console.log('');
    return currentCode;
}

/** Einrichtung möglich? Prüft live, ob inzwischen ein Admin existiert (z.B. per CLI). */
function isOpen() {
    if (!currentCode) return false;
    if (db.hasAdmin()) {
        removeCode();
        return false;
    }
    return true;
}

function verifyCode(code) {
    if (!currentCode) return false;
    // Hashen gleicht die Länge an, damit timingSafeEqual nicht vorzeitig abbricht
    const a = crypto.createHash('sha256').update(normalize(code)).digest();
    const b = crypto.createHash('sha256').update(normalize(currentCode)).digest();
    return crypto.timingSafeEqual(a, b);
}

module.exports = { init, isOpen, verifyCode, removeCode, CODE_FILE };
