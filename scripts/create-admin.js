#!/usr/bin/env node
// Legt einen Admin an oder macht einen bestehenden Nutzer zum Admin.
//   node scripts/create-admin.js <username>
//   docker compose exec bootcamp node scripts/create-admin.js <username>
// Für neue Nutzer wird ein zufälliges Passwort erzeugt und einmalig ausgegeben.
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../server/db');
const { validateUsername } = require('../server/validation');

const u = validateUsername(process.argv[2]);
if (u.error) {
    console.error('Aufruf: node scripts/create-admin.js <username>\n' + u.error);
    process.exit(1);
}

const existing = db.getUserByUsername(u.value);
if (existing) {
    db.toggleAdmin(existing.id, true);
    console.log(`"${u.value}" ist jetzt Admin. Bitte einmal neu anmelden.`);
} else {
    const password = crypto.randomBytes(12).toString('base64url');
    const { recovery_code } = db.createUser(u.value, bcrypt.hashSync(password, 12), { isAdmin: true });
    console.log(`Admin "${u.value}" angelegt.`);
    console.log(`  Passwort:          ${password}`);
    console.log(`  Recovery-Token:    ${recovery_code}`);
    console.log('Beides jetzt sicher notieren – es wird nicht erneut angezeigt.');
}
db.close();
