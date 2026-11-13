// Sicherheits-Header inkl. Content-Security-Policy (ohne zusätzliche Abhängigkeit)
const { OLLAMA_ORIGIN } = require('../config');

function securityHeaders() {
    const connectSrc = ["'self'", 'https:', 'http://localhost:*', 'http://127.0.0.1:*'];
    if (OLLAMA_ORIGIN) connectSrc.push(OLLAMA_ORIGIN);

    const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "img-src 'self' data: blob:",
        `connect-src ${connectSrc.join(' ')}`,
        "manifest-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; ');

    return (req, res, next) => {
        res.setHeader('Content-Security-Policy', csp);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
        if (req.secure) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        if (req.path.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-store');
        }
        next();
    };
}

module.exports = { securityHeaders };
