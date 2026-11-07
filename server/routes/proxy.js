// CORS-Fallback-Proxy für LLM-Anbieter.
// Sicherheitsmodell: Allowlist statt Blocklist. Nur fest definierte Anbieter-Origins sind erreichbar,
// Weiterleitungen werden nicht verfolgt, Methoden und Header sind eingeschränkt.
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { OLLAMA_ORIGIN } = require('../config');

const router = express.Router();

const ALLOWED_ORIGINS = new Set([
    'https://generativelanguage.googleapis.com',
    'https://api.openai.com',
]);
if (OLLAMA_ORIGIN) ALLOWED_ORIGINS.add(OLLAMA_ORIGIN);

const ALLOWED_METHODS = new Set(['GET', 'POST']);
const ALLOWED_HEADERS = new Set(['content-type', 'authorization', 'x-goog-api-key']);
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 60 * 1000;

const proxyLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Zu viele KI-Anfragen. Bitte warte kurz.',
    keyFn: (req) => `user:${req.user.id}`,
});

router.post('/proxy', authenticateToken, proxyLimiter, async (req, res) => {
    const payload = req.body || {};
    let target;
    try {
        target = new URL(String(payload.url || ''));
    } catch {
        return res.status(400).json({ error: 'Ungültige Ziel-URL' });
    }
    if (!ALLOWED_ORIGINS.has(target.origin) || target.username || target.password) {
        return res.status(403).json({ error: 'Dieses Ziel ist für den Proxy nicht freigegeben.' });
    }

    const method = String(payload.method || 'POST').toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
        return res.status(400).json({ error: 'HTTP-Methode nicht erlaubt' });
    }

    const headers = {};
    for (const [name, value] of Object.entries(payload.headers || {})) {
        if (ALLOWED_HEADERS.has(name.toLowerCase()) && typeof value === 'string') headers[name] = value;
    }

    let body;
    if (method === 'POST' && payload.body !== undefined) {
        // Der Client schickt den Body bereits als JSON-String; Objekte werden serialisiert
        body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
    }

    try {
        const upstream = await fetch(target, {
            method,
            headers,
            body,
            redirect: 'manual',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (upstream.status >= 300 && upstream.status < 400) {
            return res.status(502).json({ error: 'Weiterleitungen werden vom Proxy nicht verfolgt.' });
        }
        const text = await upstream.text();
        if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) {
            return res.status(502).json({ error: 'Antwort des Anbieters zu groß' });
        }
        try {
            JSON.parse(text);
        } catch {
            return res.status(502).json({ error: `Anbieter antwortete nicht mit JSON (HTTP ${upstream.status})` });
        }
        res.status(upstream.status).type('application/json').send(text);
    } catch (err) {
        console.error('Proxy-Fehler:', err.message);
        res.status(502).json({ error: 'Proxy Request Failed' });
    }
});

module.exports = router;
