// Zentrale Konfiguration. Alles kommt aus Umgebungsvariablen (.env / docker-compose).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT_DIR, 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

/**
 * Liest ein Secret aus der Umgebung oder aus einer Datei im Datenverzeichnis.
 * Gibt es beides nicht, wird ein zufälliges Secret erzeugt und mit 0600 gespeichert.
 * Es gibt bewusst KEIN fest eingebautes Fallback-Secret.
 */
function loadSecret(envName, fileName) {
    const fromEnv = process.env[envName];
    if (fromEnv) {
        if (fromEnv.length < 32) {
            throw new Error(`${envName} muss mindestens 32 Zeichen lang sein.`);
        }
        return fromEnv;
    }
    const file = path.join(DATA_DIR, fileName);
    if (fs.existsSync(file)) {
        const value = fs.readFileSync(file, 'utf8').trim();
        if (value.length >= 32) return value;
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, generated, { mode: 0o600 });
    return generated;
}

function parseOrigin(url) {
    if (!url) return null;
    try {
        return new URL(url).origin;
    } catch {
        throw new Error(`Ungültige URL in Konfiguration: ${url}`);
    }
}

const config = {
    ROOT_DIR,
    DATA_DIR,
    PUBLIC_DIR: path.join(ROOT_DIR, 'public'),
    DB_PATH: path.join(DATA_DIR, 'bootcamp.db'),

    HOST: process.env.HOST || '0.0.0.0',
    PORT: Number(process.env.PORT) || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    JWT_SECRET: loadSecret('JWT_SECRET', '.jwt_secret'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    // Schlüssel zum Verschlüsseln der gespeicherten LLM-API-Keys
    ENCRYPTION_SECRET: loadSecret('ENCRYPTION_SECRET', '.encryption_secret'),

    // Hinter Reverse Proxy (nginx/Traefik/Caddy) auf z.B. "1" setzen, damit req.ip stimmt
    TRUST_PROXY: process.env.TRUST_PROXY || false,

    // Kommagetrennte Liste fremder Origins, die die API nutzen dürfen (Standard: keine)
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),

    // Ollama-Server, den der Proxy erreichen darf, z.B. http://host.docker.internal:11434
    OLLAMA_ORIGIN: parseOrigin(process.env.OLLAMA_URL),

    // Optional: HTTPS direkt in Node (empfohlen ist stattdessen ein Reverse Proxy)
    TLS_PFX_PATH: process.env.TLS_PFX_PATH || '',
    TLS_PFX_PASSPHRASE: process.env.TLS_PFX_PASSPHRASE || '',
};

module.exports = config;
