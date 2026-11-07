const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

function signToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, tv: user.token_version || 0 },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN }
    );
}

function authenticateToken(req, res, next) {
    const [scheme, token] = String(req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Kein Token übergeben' });
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ error: 'Sitzung abgelaufen. Bitte erneut anmelden.' });
    }

    const user = db.getUserById(payload.id);
    // token_version steigt bei Passwortwechsel, Sperre und Rechteänderung -> alte Tokens ungültig
    if (!user || (payload.tv || 0) !== (user.token_version || 0)) {
        return res.status(401).json({ error: 'Sitzung abgelaufen. Bitte erneut anmelden.' });
    }
    if (user.is_banned) return res.status(403).json({ error: 'Account gesperrt' });

    req.user = user;
    next();
}

function adminOnly(req, res, next) {
    if (!req.user || req.user.is_admin !== 1) {
        return res.status(403).json({ error: 'Zugriff verweigert. Nur Administratoren.' });
    }
    next();
}

module.exports = { signToken, authenticateToken, adminOnly };
