// Einfacher In-Memory-Rate-Limiter (Fixed Window). Für eine einzelne Instanz völlig ausreichend.
function createRateLimiter({ windowMs, max, message, keyFn }) {
    const hits = new Map();

    // Abgelaufene Einträge regelmäßig entfernen, damit die Map nicht unbegrenzt wächst
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of hits) {
            if (now - record.start > windowMs) hits.delete(key);
        }
    }, windowMs);
    cleanup.unref();

    return (req, res, next) => {
        const key = keyFn ? keyFn(req) : (req.ip || 'unknown');
        const now = Date.now();
        let record = hits.get(key);
        if (!record || now - record.start > windowMs) {
            record = { count: 0, start: now };
            hits.set(key, record);
        }
        record.count++;
        if (record.count > max) {
            res.setHeader('Retry-After', Math.ceil((record.start + windowMs - now) / 1000));
            return res.status(429).json({ error: message });
        }
        next();
    };
}

module.exports = { createRateLimiter };
