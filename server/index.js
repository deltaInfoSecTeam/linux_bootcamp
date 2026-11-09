const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { securityHeaders } = require('./middleware/security');
const { router: authRouter } = require('./routes/auth');
const adminRouter = require('./routes/admin');
const proxyRouter = require('./routes/proxy');
const userRouter = require('./routes/user');

const app = express();
app.disable('x-powered-by');
if (config.TRUST_PROXY) {
    const n = Number(config.TRUST_PROXY);
    app.set('trust proxy', Number.isInteger(n) ? n : config.TRUST_PROXY);
}

app.use(securityHeaders());

// CORS nur, wenn ausdrücklich fremde Origins freigegeben wurden (Standard: gleiche Origin)
if (config.ALLOWED_ORIGINS.length > 0) {
    app.use('/api', cors({ origin: config.ALLOWED_ORIGINS }));
}

app.use(express.json({ limit: '300kb' }));

// --- API ---
app.use('/api', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', proxyRouter);
app.use('/api', userRouter); // enthält authenticateToken für alle übrigen /api-Routen

app.use('/api', (req, res) => res.status(404).json({ error: 'Unbekannter API-Endpunkt' }));

// --- Frontend: ausschließlich der public/-Ordner wird ausgeliefert ---
app.use(express.static(config.PUBLIC_DIR, {
    dotfiles: 'deny',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

// Fehlerbehandlung: keine Stacktraces an den Client
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Ungültiges JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Anfrage zu groß' });
    console.error('Unbehandelter Fehler:', err);
    res.status(err.status || 500).json({ error: 'Interner Server Fehler' });
});

function tlsOptions() {
    if (config.TLS_CERT_PATH || config.TLS_KEY_PATH) {
        if (!config.TLS_CERT_PATH || !config.TLS_KEY_PATH) {
            throw new Error('TLS_CERT_PATH und TLS_KEY_PATH müssen beide gesetzt sein.');
        }
        return { cert: fs.readFileSync(config.TLS_CERT_PATH), key: fs.readFileSync(config.TLS_KEY_PATH) };
    }
    if (config.TLS_PFX_PATH) {
        return { pfx: fs.readFileSync(config.TLS_PFX_PATH), passphrase: config.TLS_PFX_PASSPHRASE };
    }
    return null;
}

function start() {
    const tls = tlsOptions();
    const server = tls ? https.createServer(tls, app) : http.createServer(app);
    server.listen(config.PORT, config.HOST, () => {
        const proto = tls ? 'https' : 'http';
        console.log(`Linux Bootcamp läuft auf ${proto}://${config.HOST}:${config.PORT}`);
        console.log(`Datenverzeichnis: ${config.DATA_DIR}`);
    });
    return server;
}

if (require.main === module) start();

module.exports = { app, start };
