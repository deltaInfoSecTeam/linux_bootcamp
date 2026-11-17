#!/usr/bin/env node
// Legt einen Admin an, macht einen bestehenden Nutzer zum Admin oder setzt
// im Notfall Passwort und Recovery-Token eines Nutzers zurück.
//   node scripts/create-admin.js <username>
//   node scripts/create-admin.js <username> --reset
//   docker compose exec bootcamp node scripts/create-admin.js <username> [--reset]
// Neue Passwörter und Recovery-Tokens werden einmalig ausgegeben.
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../server/db');
const setup = require('../server/setup');
const { validateUsername } = require('../server/validation');

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const name = args.find(a => !a.startsWith('--'));
const unknown = args.filter(a => a.startsWith('--') && a !== '--reset');

const u = validateUsername(name);
if (u.error || unknown.length) {
    console.error('Aufruf: node scripts/create-admin.js <username> [--reset]\n' + (u.error || `Unbekannte Option: ${unknown[0]}`));
    process.exit(1);
}

const newPassword = () => crypto.randomBytes(12).toString('base64url');
const existing = db.getUserByUsername(u.value);

if (reset) {
    if (!existing) {
        console.error(`Nutzer "${u.value}" gibt es nicht.`);
        process.exit(1);
    }
    const password = newPassword();
    const recovery_code = db.resetCredentials(existing.id, bcrypt.hashSync(password, 12));
    console.log(`Zugangsdaten für "${u.value}" neu gesetzt.`);
    console.log(`  Passwort:          ${password}`);
    console.log(`  Recovery-Token:    ${recovery_code}`);
    console.log('Alle bestehenden Sitzungen dieses Nutzers sind abgemeldet.');
    console.log('Beides jetzt sicher notieren – es wird nicht erneut angezeigt.');
} else if (existing) {
    db.toggleAdmin(existing.id, true);
    console.log(`"${u.value}" ist jetzt Admin. Bitte einmal neu anmelden.`);
} else {
    const password = newPassword();
    const { recovery_code } = db.createUser(u.value, bcrypt.hashSync(password, 12), { isAdmin: true });
    console.log(`Admin "${u.value}" angelegt.`);
    console.log(`  Passwort:          ${password}`);
    console.log(`  Recovery-Token:    ${recovery_code}`);
    console.log('Beides jetzt sicher notieren – es wird nicht erneut angezeigt.');
}

// Es gibt jetzt einen Admin: Setup-Code der Erst-Einrichtung entwerten
if (db.hasAdmin()) setup.removeCode();
db.close();
