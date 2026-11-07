const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { signToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { validateUsername, validatePassword } = require('../validation');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
// Wird verglichen, wenn der Nutzer nicht existiert -> gleiche Antwortzeit, keine Nutzer-Enumeration
const DUMMY_HASH = bcrypt.hashSync('timing-dummy-password', BCRYPT_ROUNDS);

const authLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Zu viele Anmeldeversuche. Bitte warte eine Minute.',
});

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        xp: user.xp,
        streak: user.streak,
        answered_total: user.answered_total,
        last_played: user.last_played,
        llm_config: user.llm_config,
        is_admin: user.is_admin,
    };
}

router.post('/register', authLimiter, async (req, res) => {
    const { username, password } = req.body || {};
    const u = validateUsername(username);
    if (u.error) return res.status(400).json({ error: u.error });
    const p = validatePassword(password);
    if (p.error) return res.status(400).json({ error: p.error });

    if (db.getUserByUsername(u.value)) {
        return res.status(400).json({ error: 'Dieser Username existiert bereits' });
    }

    try {
        const hash = await bcrypt.hash(p.value, BCRYPT_ROUNDS);
        const { id, recovery_code } = db.createUser(u.value, hash);
        const user = db.getUserById(id);
        res.json({ token: signToken(user), user: publicUser(user), recovery_code });
    } catch (err) {
        if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
            return res.status(400).json({ error: 'Dieser Username existiert bereits' });
        }
        console.error('Register-Fehler:', err);
        res.status(500).json({ error: 'Interner Server Fehler' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ error: 'Username und Passwort werden benötigt' });
    }

    try {
        const authUser = db.getAuthUserByUsername(username.trim());
        const match = await bcrypt.compare(password, authUser ? authUser.password_hash : DUMMY_HASH);
        if (!authUser || !match) {
            return res.status(401).json({ error: 'Falscher Username oder Passwort' });
        }
        // Sperre erst nach korrektem Passwort verraten
        if (authUser.is_banned) {
            return res.status(403).json({ error: 'Dein Account wurde gesperrt. Bitte kontaktiere den Administrator.' });
        }
        const user = db.getUserById(authUser.id);
        res.json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
        console.error('Login-Fehler:', err);
        res.status(500).json({ error: 'Interner Server Fehler' });
    }
});

router.post('/reset_password', authLimiter, async (req, res) => {
    const { username, recovery_code, new_password } = req.body || {};
    if (typeof username !== 'string' || typeof recovery_code !== 'string' || !username || !recovery_code || !new_password) {
        return res.status(400).json({ error: 'Bitte fülle alle Felder aus' });
    }
    const p = validatePassword(new_password);
    if (p.error) return res.status(400).json({ error: p.error });

    const authUser = db.getAuthUserByUsername(username.trim());
    // Eine Fehlermeldung für beide Fälle -> verrät nicht, ob der Nutzer existiert
    if (!authUser || !db.verifyRecoveryCode(authUser, recovery_code)) {
        return res.status(403).json({ error: 'Username oder Root-Recovery-Token ungültig' });
    }

    try {
        db.updatePassword(authUser.id, await bcrypt.hash(p.value, BCRYPT_ROUNDS));
        res.json({ success: true, message: 'Passwort wurde erfolgreich geändert' });
    } catch (err) {
        console.error('Reset-Fehler:', err);
        res.status(500).json({ error: 'Interner Server Fehler' });
    }
});

module.exports = { router, BCRYPT_ROUNDS };
