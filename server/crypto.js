// Kleine Krypto-Helfer: Recovery-Codes hashen, LLM-Konfiguration verschlüsseln.
const crypto = require('crypto');
const { ENCRYPTION_SECRET } = require('./config');

const ENC_KEY = crypto.hkdfSync('sha256', ENCRYPTION_SECRET, 'linux-bootcamp', 'llm-config-v1', 32);
const ENC_PREFIX = 'enc:v1:';

function generateRecoveryCode() {
    const part = () => crypto.randomBytes(4).toString('hex').toUpperCase();
    return `ROOT-${part()}-${part()}`;
}

// Recovery-Codes haben 64 Bit Zufall – ein HMAC reicht (kein bcrypt nötig).
function hashRecoveryCode(code) {
    const normalized = String(code).trim().toUpperCase();
    return 'hmac:' + crypto.createHmac('sha256', ENC_KEY).update(normalized).digest('hex');
}

function verifyRecoveryCode(code, storedHash) {
    if (!storedHash || typeof code !== 'string') return false;
    const a = Buffer.from(hashRecoveryCode(code));
    const b = Buffer.from(storedHash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isHashedRecoveryCode(value) {
    return typeof value === 'string' && value.startsWith('hmac:');
}

function encrypt(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
    const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ENC_PREFIX + Buffer.concat([iv, tag, data]).toString('base64');
}

function decrypt(value) {
    if (value === null || value === undefined) return null;
    if (!String(value).startsWith(ENC_PREFIX)) return value; // Altbestand (Klartext)
    try {
        const raw = Buffer.from(String(value).slice(ENC_PREFIX.length), 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, raw.subarray(0, 12));
        decipher.setAuthTag(raw.subarray(12, 28));
        return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    } catch {
        return null; // z.B. nach Wechsel des ENCRYPTION_SECRET
    }
}

module.exports = {
    generateRecoveryCode,
    hashRecoveryCode,
    verifyRecoveryCode,
    isHashedRecoveryCode,
    encrypt,
    decrypt,
};
