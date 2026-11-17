// Erst-Einrichtung im Browser: ersten Admin mit dem Setup-Code anlegen
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const setup = require('../setup');
const { signToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { validateUsername, validatePassword } = require('../validation');
const { BCRYPT_ROUNDS, publicUser } = require('./auth');

const router = express.Router();

// Streng begrenzt: der Setup-Code darf nicht durchprobiert werden können
const setupLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Zu viele Versuche. Bitte warte 15 Minuten.',
});

const CLOSED = { error: 'Die Einrichtung ist bereits abgeschlossen.' };

// Öffentlich: zeigt nur an, ob der Einrichtungsdialog nötig ist
router.get('/', (req, res) => {
    res.json({ needed: setup.isOpen() });
});

router.post('/', setupLimiter, async (req, res) => {
    if (!setup.isOpen()) return res.status(410).json(CLOSED);

    const { setup_code, username, password } = req.body || {};
    if (typeof setup_code !== 'string' || !setup.verifyCode(setup_code)) {
        return res.status(403).json({ error: 'Setup-Code stimmt nicht.' });
    }
    const u = validateUsername(username);
    if (u.error) return res.status(400).json({ error: u.error });
    const p = validatePassword(password);
    if (p.error) return res.status(400).json({ error: p.error });
    if (db.getUserByUsername(u.value)) {
        return res.status(400).json({ error: 'Dieser Username existiert bereits' });
    }

    try {
        const hash = await bcrypt.hash(p.value, BCRYPT_ROUNDS);
        // Während des Hashens könnte eine zweite Anfrage durchgekommen sein
        if (!setup.isOpen()) return res.status(410).json(CLOSED);
        const { id, recovery_code } = db.createUser(u.value, hash, { isAdmin: true });
        setup.removeCode();
        console.log(`Erst-Einrichtung abgeschlossen: Admin "${u.value}" angelegt.`);
        const user = db.getUserById(id);
        res.json({ token: signToken(user), user: publicUser(user), recovery_code });
    } catch (err) {
        if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
            return res.status(400).json({ error: 'Dieser Username existiert bereits' });
        }
        console.error('Setup-Fehler:', err);
        res.status(500).json({ error: 'Interner Server Fehler' });
    }
});

module.exports = router;
