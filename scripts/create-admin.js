#!/usr/bin/env node
// Legt einen Admin an, macht einen bestehenden Nutzer zum Admin oder setzt
// im Notfall Passwort und Recovery-Token eines Nutzers zurück.
//   node scripts/create-admin.js <username>
//   node scripts/create-admin.js <username> --reset
//   docker compose exec app node scripts/create-admin.js <username> [--reset]
//   --env      Ausgabe als STATUS=/PASSWORD=/RECOVERY=/SETUP_CODE=-Zeilen (für install.sh)
//   --if-none  ohne Admin nichts anlegen, sondern den Setup-Code für die Einrichtung im
//              Browser melden (STATUS=setup), sonst STATUS=exists (install.sh ohne --admin)
// Neue Passwörter und Recovery-Tokens werden einmalig ausgegeben.
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../server/db');
const setup = require('../server/setup');
const { validateUsername } = require('../server/validation');

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const asEnv = args.includes('--env');
const ifNone = args.includes('--if-none');
const name = args.find(a => !a.startsWith('--'));
const unknown = args.filter(a => a.startsWith('--') && !['--reset', '--env', '--if-none'].includes(a));

const u = validateUsername(name);
if (u.error || unknown.length) {
    console.error('Aufruf: node scripts/create-admin.js <username> [--reset] [--env] [--if-none]\n' + (u.error || `Unbekannte Option: ${unknown[0]}`));
    process.exit(1);
}

const newPassword = () => crypto.randomBytes(12).toString('base64url');
// --env: maschinenlesbar, Passwort und Token kommen aus base64url bzw. dem Recovery-Format (ohne Leer-/Sonderzeichen)
const report = (status, text, password, recovery_code, setupCode) => {
    if (asEnv) {
        console.log(`STATUS=${status}`);
        if (password) console.log(`PASSWORD=${password}\nRECOVERY=${recovery_code}`);
        if (setupCode) console.log(`SETUP_CODE=${setupCode}`);
        return;
    }
    console.log(text);
    if (password) {
        console.log(`  Passwort:          ${password}`);
        console.log(`  Recovery-Token:    ${recovery_code}`);
        if (status === 'reset') console.log('Alle bestehenden Sitzungen dieses Nutzers sind abgemeldet.');
        console.log('Beides jetzt sicher notieren – es wird nicht erneut angezeigt.');
    }
};
// Setup-Code, den der laufende Server beim Start geschrieben hat
const readSetupCode = () => {
    try { return fs.readFileSync(setup.CODE_FILE, 'utf8').trim(); } catch { return ''; }
};
const existing = db.getUserByUsername(u.value);

if (ifNone && !reset && db.hasAdmin()) {
    report('exists', 'Es gibt schon einen Admin, nichts geändert.');
} else if (ifNone && !reset) {
    // Erst-Einrichtung bleibt im Browser: kein Admin anlegen, nur den Setup-Code melden
    const code = readSetupCode();
    if (!code) {
        console.error('Kein Admin und kein Setup-Code vorhanden. Container neu starten oder --admin angeben.');
        process.exit(1);
    }
    db.close();
    report('setup', `Kein Admin vorhanden. Setup-Code für die Einrichtung im Browser: ${code}`, null, null, code);
    process.exit(0);
} else if (reset) {
    if (!existing) {
        console.error(`Nutzer "${u.value}" gibt es nicht.`);
        process.exit(1);
    }
    const password = newPassword();
    const recovery_code = db.resetCredentials(existing.id, bcrypt.hashSync(password, 12));
    report('reset', `Zugangsdaten für "${u.value}" neu gesetzt.`, password, recovery_code);
} else if (existing) {
    db.toggleAdmin(existing.id, true);
    report('promoted', `"${u.value}" ist jetzt Admin. Bitte einmal neu anmelden.`);
} else {
    const password = newPassword();
    const { recovery_code } = db.createUser(u.value, bcrypt.hashSync(password, 12), { isAdmin: true });
    report('created', `Admin "${u.value}" angelegt.`, password, recovery_code);
}

// Es gibt jetzt einen Admin: Setup-Code der Erst-Einrichtung entwerten
if (db.hasAdmin()) setup.removeCode();
db.close();
