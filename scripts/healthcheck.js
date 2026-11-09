// Docker-Healthcheck: prüft, ob der Server antwortet – per HTTP oder HTTPS,
// je nachdem, ob TLS konfiguriert ist.
const tls = Boolean(process.env.TLS_CERT_PATH || process.env.TLS_PFX_PATH);
const client = require(tls ? 'https' : 'http');
const port = process.env.PORT || 8000;

const req = client.get({
    host: '127.0.0.1',
    port,
    path: '/',
    timeout: 4000,
    // Nur Erreichbarkeit prüfen; die Zertifikatskette prüft der Browser.
    rejectUnauthorized: false,
}, (res) => process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1));

req.on('timeout', () => req.destroy());
req.on('error', () => process.exit(1));
